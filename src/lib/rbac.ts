import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export interface SessionUser {
    id: string
    username: string
    role: string
    roleId?: string | null
    roleLabel?: string
    roleScope?: "ALL_BRANCHES" | "OWN_BRANCH"
    permissions?: string[]
    employeeId: string
    locationId: string | null
    locationType?: "BATCHING_PLANT" | "STONE_CRUSHER" | "HEAD_OFFICE" | string | null
    locationName?: string | null
}

const legacyRoleDefaults: Record<string, string[]> = {
    AdminBP: [
        "PRODUKSI_VIEW", "PRODUKSI_CREATE", "PRODUKSI_EDIT", "PRODUKSI_CONFIRM",
        "RETASE_VIEW", "RETASE_CREATE", "RETASE_EDIT",
        "SEWA_VIEW", "SEWA_CREATE", "SEWA_EDIT",
        "BILLING_VIEW", "BILLING_CREATE", "BILLING_EDIT",
        "CUSTOMER_VIEW", "CUSTOMER_CREATE", "CUSTOMER_EDIT",
        "MUTU_VIEW", "MUTU_CREATE", "MUTU_EDIT",
        "KENDARAAN_VIEW", "KENDARAAN_CREATE", "KENDARAAN_EDIT",
        "ITEM_PEKERJAAN_VIEW", "ITEM_PEKERJAAN_CREATE", "ITEM_PEKERJAAN_EDIT",
        "LOGISTIK_VIEW", "LOGISTIK_CREATE", "LOGISTIK_EDIT", "LOGISTIK_APPROVE",
        "RBL_VIEW", "RBL_CREATE", "RBL_EDIT"
    ],
    AdminTenggarong: [
        "PRODUKSI_VIEW", "PRODUKSI_CREATE", "PRODUKSI_EDIT", "PRODUKSI_CONFIRM",
        "RETASE_VIEW", "RETASE_CREATE", "RETASE_EDIT",
        "SEWA_VIEW", "SEWA_CREATE", "SEWA_EDIT",
        "BILLING_VIEW", "BILLING_CREATE", "BILLING_EDIT",
        "CUSTOMER_VIEW", "CUSTOMER_CREATE", "CUSTOMER_EDIT",
        "MUTU_VIEW", "MUTU_CREATE", "MUTU_EDIT",
        "KENDARAAN_VIEW", "KENDARAAN_CREATE", "KENDARAAN_EDIT",
        "ITEM_PEKERJAAN_VIEW", "ITEM_PEKERJAAN_CREATE", "ITEM_PEKERJAAN_EDIT",
        "LOGISTIK_VIEW", "LOGISTIK_CREATE", "LOGISTIK_EDIT", "LOGISTIK_APPROVE",
        "RBL_VIEW", "RBL_CREATE", "RBL_EDIT"
    ],
    OperatorBP: [
        "PRODUKSI_VIEW", "PRODUKSI_CREATE", "PRODUKSI_EDIT",
        "RETASE_VIEW", "SEWA_VIEW", "SEWA_CREATE"
    ],
    AdminCrusher: [
        "CRUSHER_VIEW", "CRUSHER_CREATE", "CRUSHER_EDIT", "CRUSHER_DELETE",
        "LOGISTIK_VIEW", "LOGISTIK_CREATE", "LOGISTIK_EDIT"
    ],
    OperatorCrusher: [
        "CRUSHER_VIEW", "CRUSHER_CREATE", "CRUSHER_EDIT",
        "LOGISTIK_VIEW", "LOGISTIK_CREATE"
    ],
    AdminLogistik: [
        "LOGISTIK_VIEW", "LOGISTIK_CREATE", "LOGISTIK_EDIT", "LOGISTIK_APPROVE",
        "LOGISTIK_PERUSAHAAN_VIEW", "LOGISTIK_PERUSAHAAN_MANAGE",
        "RBL_VIEW", "RBL_CREATE", "RBL_EDIT"
    ],
}

/**
 * Checks if a user has a specific permission.
 * SuperAdminBP always has all permissions (full bypass).
 * Supports both:
 *  - hasPermission(user, "PRODUKSI_VIEW")
 *  - hasPermission(user, "PRODUKSI", "VIEW")
 */
export function hasPermission(
    user: SessionUser | null | undefined | any,
    moduleOrCode: string,
    action?: string
): boolean {
    if (!user) return false
    if (user.role === "SuperAdminBP") return true

    const code = action ? `${moduleOrCode}_${action.toUpperCase()}` : moduleOrCode

    // Primary: Check database-driven permissions array
    if (Array.isArray(user.permissions) && user.permissions.length > 0) {
        return user.permissions.includes(code)
    }

    // Graceful fallback for legacy sessions during transition
    if (user.role && legacyRoleDefaults[user.role]) {
        return legacyRoleDefaults[user.role].includes(code)
    }

    return false
}

/**
 * Server guard: throws an error if current session user does not have permission.
 */
export async function requirePermission(moduleOrCode: string, action?: string): Promise<SessionUser> {
    const session = await auth()
    if (!session?.user) {
        throw new Error("Unauthorized: Silakan login terlebih dahulu.")
    }
    const user = session.user as SessionUser
    if (!hasPermission(user, moduleOrCode, action)) {
        const permName = action ? `${moduleOrCode}_${action.toUpperCase()}` : moduleOrCode
        throw new Error(`Akses Ditolak: Anda tidak memiliki izin [${permName}].`)
    }
    return user
}

/**
 * Checks if user is corporate-level (not bound to a single branch).
 */
export function isCorporateUser(user: SessionUser | any): boolean {
    if (!user) return false
    return (
        user.role === "SuperAdminBP" ||
        user.roleScope === "ALL_BRANCHES" ||
        user.role === "AdminLogistik" ||
        ["CEO", "FVP", "Approver"].includes(user.role || "")
    )
}

/**
 * Helper to get branch/location scoping filter for database queries.
 * If user has corporate / ALL_BRANCHES scope (like SuperAdmin, CEO, FVP, Approver):
 *   Allows optional filtering by any requestedLocationId.
 * If user has OWN_BRANCH scope (like Admin Cabang):
 *   Strictly forces locationId to user.locationId.
 */
export function getLocationFilter(user: SessionUser | any, requestedLocationId?: string) {
    if (isCorporateUser(user)) {
        return requestedLocationId && requestedLocationId !== "all"
            ? { locationId: requestedLocationId }
            : {}
    }
    if (user?.locationId) {
        return { locationId: user.locationId }
    }
    return {}
}

/**
 * Resolves the target locationId for a create/update mutation.
 * If user is Corporate (roleScope === 'ALL_BRANCHES' or SuperAdmin):
 *   Allows choosing a branch from requestedLocationId, falling back to user.locationId if present.
 * If user has OWN_BRANCH scope:
 *   STRICTLY forces targetLocationId to user.locationId (prevents cross-branch spoofing or accidents).
 */
export function resolveTargetLocationId(
    user: SessionUser | any,
    requestedLocationId?: string | null
): string {
    if (!user) {
        throw new Error("Unauthorized: Pengguna tidak valid.")
    }

    if (isCorporateUser(user)) {
        if (requestedLocationId && requestedLocationId !== "all" && requestedLocationId.trim() !== "") {
            return requestedLocationId.trim()
        }
        if (user.locationId) {
            return user.locationId
        }
        throw new Error("Cabang tujuan transaksi wajib dipilih untuk pengguna corporate.")
    }

    // Branch-bound user: strictly lock to user's assigned branch
    if (!user.locationId) {
        throw new Error("Akun Anda tidak terikat dengan cabang manapun. Hubungi administrator.")
    }

    return user.locationId
}
