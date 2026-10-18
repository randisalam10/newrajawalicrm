import { prisma } from "@/lib/prisma"

/**
 * Helper untuk me-resolve lokasi Stone Crusher yang aktif secara aman (zero-guesswork).
 * - Menemukan lokasi dengan type "STONE_CRUSHER".
 * - Memastikan lokasi Admin Crusher terkunci pada akun masing-masing (anti-iseng / anti-tampering).
 * - Multi-cabang hanya diizinkan untuk SuperAdminBP, CEO, FVP (roleScope ALL_BRANCHES).
 */
export async function resolveCrusherLocation(
    paramLocId?: string | null,
    sessionLocId?: string | null,
    userRole?: string | null,
    roleScope?: string | null
) {
    let crushers: Array<{ id: string; name: string; type?: string | null }> = []

    try {
        crushers = await (prisma.location as any).findMany({
            where: { type: "STONE_CRUSHER" },
            orderBy: { name: "asc" },
            select: { id: true, name: true, type: true },
        })
    } catch {
        // Fallback langsung ke database postgres jika memory dev server belum reload DMMF
        try {
            crushers = await prisma.$queryRaw<Array<{ id: string; name: string; type: string }>>`
                SELECT "id", "name", "type" FROM "Location" WHERE "type" = 'STONE_CRUSHER' ORDER BY "name" ASC
            `
        } catch {
            crushers = []
        }
    }

    const hasDedicatedCrusher = crushers.length > 0
    let candidateLocations: Array<{ id: string; name: string; type?: string | null }> = []

    if (hasDedicatedCrusher) {
        candidateLocations = crushers
    } else {
        try {
            candidateLocations = await (prisma.location as any).findMany({
                orderBy: { name: "asc" },
                select: { id: true, name: true, type: true },
            })
        } catch {
            try {
                candidateLocations = await prisma.location.findMany({
                    orderBy: { name: "asc" },
                    select: { id: true, name: true },
                })
            } catch {
                candidateLocations = []
            }
        }
    }

    // Tentukan apakah user memiliki akses multi-cabang (Global Admin)
    const isGlobalAdmin = ["SuperAdminBP", "CEO", "FVP"].includes(userRole || "") || roleScope === "ALL_BRANCHES"

    // Jika user adalah admin crusher / cabang (bukan global admin) dan memiliki sessionLocId,
    // MAKA LOKASI DIKUNCI MUTLAK ke sessionLocId akun (anti-tampering URL).
    const isLocationLocked = !isGlobalAdmin && Boolean(sessionLocId)

    let activeLocation: { id: string; name: string; type?: string | null } | undefined

    if (isLocationLocked && sessionLocId) {
        activeLocation = candidateLocations.find(l => l.id === sessionLocId)
        // Jika sessionLocId belum terdaftar di candidateLocations, cari langsung dari tabel Location
        if (!activeLocation) {
            try {
                const dbLoc = await (prisma.location as any).findUnique({
                    where: { id: sessionLocId },
                    select: { id: true, name: true, type: true }
                })
                if (dbLoc) activeLocation = dbLoc
            } catch {}
        }
    } else {
        activeLocation = candidateLocations.find(l => l.id === paramLocId)
        if (!activeLocation && sessionLocId) {
            activeLocation = candidateLocations.find(l => l.id === sessionLocId)
        }
    }

    if (!activeLocation && candidateLocations.length > 0) {
        activeLocation = candidateLocations[0]
    }

    // Jika lokasi terkunci, kembalikan hanya 1 lokasi agar UI tidak menampilkan selector switch cabang
    const returnedLocations = isLocationLocked && activeLocation
        ? [{ id: activeLocation.id, name: activeLocation.name }]
        : candidateLocations.map(l => ({ id: l.id, name: l.name }))

    return {
        activeLocationId: activeLocation?.id || "",
        activeLocationName: activeLocation?.name || "Stone Crusher",
        locations: returnedLocations,
        isSingleLocation: returnedLocations.length <= 1,
        isLocationLocked,
        hasDedicatedCrusher,
    }
}
