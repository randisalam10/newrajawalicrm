import type { Prisma } from "@prisma/client"

export type LogistikBusinessUnit = "BP" | "CRUSHER" | "ALL"

export interface LogistikFilterParams {
    businessUnit?: LogistikBusinessUnit | "ALL"
    locationId?: string | "ALL"
}

export interface SessionUserContext {
    id?: string
    role?: string
    roleScope?: string
    locationId?: string | null
    permissions?: string[]
}

/**
 * Memeriksa apakah user adalah SuperAdmin, Admin Logistik, atau Corporate
 * yang memiliki hak akses penuh ke seluruh cabang tanpa batasan wilayah.
 */
export function isLogistikCentralUser(user?: SessionUserContext | null): boolean {
    if (!user) return false
    const role = user.role || ""
    const scope = user.roleScope || ""
    return (
        role === "SuperAdminBP" ||
        role === "AdminLogistik" ||
        scope === "ALL_BRANCHES" ||
        ["CEO", "FVP", "Approver"].includes(role)
    )
}

/**
 * Menghasilkan Prisma Where Clause untuk Master Supplier berdasarkan hak akses user.
 */
export function buildSupplierBranchFilter(
    user?: SessionUserContext | null,
    params?: LogistikFilterParams
): Prisma.SupplierWhereInput {
    if (!user) return { id: "__UNAUTHORIZED__" }

    const isCentral = isLogistikCentralUser(user)

    // Admin Logistik & SuperAdmin: Akses seluruh cabang, bisa difilter manual
    if (isCentral) {
        const where: Prisma.SupplierWhereInput = {}

        if (params?.businessUnit && params.businessUnit !== "ALL") {
            where.target_business = { in: [params.businessUnit, "ALL"] }
        }

        if (params?.locationId && params.locationId !== "ALL") {
            where.OR = [
                { is_global: true },
                { locationId: params.locationId },
                { sharedLocations: { some: { id: params.locationId } } }
            ]
        }

        return where
    }

    // Akun Cabang (BP atau Stone Crusher)
    const userLocId = user.locationId
    const isCrusher = user.role === "OperatorCrusher" || user.role === "AdminCrusher"

    const allowedBusinessUnits: LogistikBusinessUnit[] = isCrusher
        ? ["CRUSHER", "ALL"]
        : ["BP", "ALL"]

    if (!userLocId) {
        // Fallback jika akun cabang belum diset locationId: hanya barang global
        return {
            target_business: { in: allowedBusinessUnits },
            is_global: true
        }
    }

    return {
        target_business: { in: allowedBusinessUnits },
        OR: [
            { is_global: true },
            { locationId: userLocId },
            { sharedLocations: { some: { id: userLocId } } }
        ]
    }
}

/**
 * Menghasilkan Prisma Where Clause untuk Master Item berdasarkan hak akses user.
 */
export function buildMasterItemBranchFilter(
    user?: SessionUserContext | null,
    params?: LogistikFilterParams
): Prisma.MasterItemWhereInput {
    if (!user) return { id: "__UNAUTHORIZED__" }

    const isCentral = isLogistikCentralUser(user)

    // Admin Logistik & SuperAdmin: Akses seluruh cabang, bisa difilter manual
    if (isCentral) {
        const where: Prisma.MasterItemWhereInput = {}

        if (params?.businessUnit && params.businessUnit !== "ALL") {
            where.target_business = { in: [params.businessUnit, "ALL"] }
        }

        if (params?.locationId && params.locationId !== "ALL") {
            where.OR = [
                { is_global: true },
                { locationId: params.locationId },
                { sharedLocations: { some: { id: params.locationId } } }
            ]
        }

        return where
    }

    // Akun Cabang (BP atau Stone Crusher)
    const userLocId = user.locationId
    const isCrusher = user.role === "OperatorCrusher" || user.role === "AdminCrusher"

    const allowedBusinessUnits: LogistikBusinessUnit[] = isCrusher
        ? ["CRUSHER", "ALL"]
        : ["BP", "ALL"]

    if (!userLocId) {
        return {
            target_business: { in: allowedBusinessUnits },
            is_global: true
        }
    }

    return {
        target_business: { in: allowedBusinessUnits },
        OR: [
            { is_global: true },
            { locationId: userLocId },
            { sharedLocations: { some: { id: userLocId } } }
        ]
    }
}
