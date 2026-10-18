import { prisma } from "@/lib/prisma"

/**
 * Resolver setting retase Stone Crusher dengan presedensi yang benar.
 *
 * MASALAH LAMA (B3): query memakai `orderBy: [{ locationId: "desc" }]`. Di PostgreSQL,
 * `ORDER BY ... DESC` menempatkan NULL di DEPAN (NULLS FIRST), sehingga setting
 * universal (`locationId = null`) selalu menang atas setting spesifik cabang.
 *
 * SOLUSI: cari setting spesifik cabang terlebih dahulu; hanya jika tidak ada,
 * fallback ke setting universal (`locationId = null`).
 */
export async function resolveCrusherRetaseSetting(locationId?: string | null) {
    const db = prisma as any
    if (!db.crusherRetaseSetting) return null

    const locId = locationId && locationId !== "all" ? locationId : null

    if (locId) {
        const specific = await db.crusherRetaseSetting.findFirst({
            where: { isActive: true, locationId: locId },
            orderBy: { createdAt: "desc" },
        })
        if (specific) return specific
    }

    return await db.crusherRetaseSetting.findFirst({
        where: { isActive: true, locationId: null },
        orderBy: { createdAt: "desc" },
    })
}
