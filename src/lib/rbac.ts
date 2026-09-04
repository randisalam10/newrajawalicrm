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
 * Helper to get branch/location scoping filter for database queries.
 * If user has ALL_BRANCHES scope (like SuperAdmin, CEO, FVP):
 *   Allows optional filtering by any requestedLocationId.
 * If user has OWN_BRANCH scope (like Admin Cabang):
 *   Strictly forces locationId to user.locationId.
 */
export function getLocationFilter(user: SessionUser, requestedLocationId?: string) {
    if (user.role === "SuperAdminBP" || user.roleScope === "ALL_BRANCHES") {
        return requestedLocationId ? { locationId: requestedLocationId } : {}
    }
    return { locationId: user.locationId || undefined }
}
