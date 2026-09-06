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
}

/**
 * Checks if a user has a specific permission.
 * SuperAdminBP always has all permissions (full bypass).
 */
export function hasPermission(user: SessionUser | null | undefined, module: string, action: string): boolean {
    if (!user) return false
    if (user.role === "SuperAdminBP") return true
    const code = `${module}_${action.toUpperCase()}`
    return Boolean(user.permissions && user.permissions.includes(code))
}

/**
 * Server guard: throws an error if current session user does not have permission.
 */
export async function requirePermission(module: string, action: string): Promise<SessionUser> {
    const session = await auth()
    if (!session?.user) {
        throw new Error("Unauthorized: Silakan login terlebih dahulu.")
    }
    const user = session.user as SessionUser
    if (!hasPermission(user, module, action)) {
        throw new Error(`Akses Ditolak: Anda tidak memiliki izin untuk ${module} (${action}).`)
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
