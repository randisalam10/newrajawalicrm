"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { revalidatePath } from "next/cache"

export interface MaterialPriceInput {
    materialId: string
    price_per_m3: number
    effective_date: string // YYYY-MM-DD
    locationId?: string | null
    notes?: string
}

export interface NewMaterialInput {
    code: string
    name: string
    category?: string
    unit?: string
    defaultDensity?: number
    description?: string
    initial_price: number
    effective_date: string // YYYY-MM-DD
    locationId?: string | null
    notes?: string
}

const DEFAULT_MATERIALS = [
    {
        code: "PASIR",
        name: "Pasir Cor",
        category: "PASIR",
        unit: "m³",
        defaultDensity: 1400,
        description: "Pasir beton cor alam berkualitas standar batching plant",
        initialPrice: 150000,
        effectiveDate: "2026-01-01",
    },
    {
        code: "SPLIT_1_2",
        name: "Batu Split 1/2",
        category: "BATU",
        unit: "m³",
        defaultDensity: 1450,
        description: "Batu pecah ukuran 10-20mm untuk mutu K-225 ke atas",
        initialPrice: 185000,
        effectiveDate: "2026-01-01",
    },
    {
        code: "SPLIT_2_3",
        name: "Batu Split 2/3",
        category: "BATU",
        unit: "m³",
        defaultDensity: 1450,
        description: "Batu pecah ukuran 20-30mm untuk struktur beton berat",
        initialPrice: 185000,
        effectiveDate: "2026-01-01",
    },
    {
        code: "ABU_BATU",
        name: "Abu Batu / Screening",
        category: "BATU",
        unit: "m³",
        defaultDensity: 1400,
        description: "Material agregat halus hasil pemecah batu",
        initialPrice: 140000,
        effectiveDate: "2026-01-01",
    },
    {
        code: "OTHER",
        name: "Agregat Lainnya / Sirtu",
        category: "AGREGAT",
        unit: "m³",
        defaultDensity: 1400,
        description: "Material agregat pengisi atau sirtu quarry",
        initialPrice: 130000,
        effectiveDate: "2026-01-01",
    },
]

/**
 * Seed initial default materials (explicitly non-cement) if empty.
 */
export async function seedInitialMaterialsIfEmpty() {
    try {
        const count = await prisma.masterMaterial.count()
        if (count > 0) return

        for (const m of DEFAULT_MATERIALS) {
            const mat = await prisma.masterMaterial.create({
                data: {
                    code: m.code,
                    name: m.name,
                    category: m.category,
                    unit: m.unit,
                    defaultDensity: m.defaultDensity,
                    description: m.description,
                    isActive: true,
                }
            })

            await prisma.materialPriceHistory.create({
                data: {
                    materialId: mat.id,
                    material_code: mat.code,
                    material_name: mat.name,
                    price_per_m3: m.initialPrice,
                    effective_date: new Date(m.effectiveDate),
                    old_price: 0,
                    notes: "Harga dasar default inisialisasi master data",
                }
            })
        }
    } catch (err) {
        console.error("seedInitialMaterialsIfEmpty error:", err)
    }
}

/**
 * Main query: Fetches all materials with active price and full history
 */
export async function getMasterMaterialsData(filters?: { locationId?: string }) {
    const session = await auth()
    if (!session?.user) return { materials: [], histories: [], locations: [] }

    await seedInitialMaterialsIfEmpty()

    const now = new Date()

    const [materials, locations] = await Promise.all([
        prisma.masterMaterial.findMany({
            include: {
                priceHistories: {
                    include: {
                        location: { select: { id: true, name: true } },
                        createdBy: { select: { id: true, username: true } },
                    },
                    orderBy: { effective_date: "desc" },
                }
            },
            orderBy: [{ isActive: "desc" }, { createdAt: "asc" }]
        }),
        prisma.location.findMany({
            select: { id: true, name: true },
            orderBy: { name: "asc" }
        })
    ])

    // Compute active current price, future price, and price changes for each material
    const formattedMaterials = materials.map((mat: any) => {
        const histories = mat.priceHistories || []

        // Find active price currently in effect (effective_date <= now)
        // If location filter specified, prioritize that location
        const activeEntries = histories.filter((h: any) => new Date(h.effective_date) <= now)
        let currentPriceEntry: any = null

        if (filters?.locationId && filters.locationId !== "all") {
            currentPriceEntry = activeEntries.find((h: any) => h.locationId === filters.locationId)
        }
        if (!currentPriceEntry) {
            currentPriceEntry = activeEntries[0] || null
        }

        // Future scheduled price if any
        const futureEntries = histories.filter((h: any) => new Date(h.effective_date) > now).reverse()
        const nextPriceEntry = futureEntries[0] || null

        return {
            id: mat.id,
            code: mat.code,
            name: mat.name,
            category: mat.category,
            unit: mat.unit,
            defaultDensity: mat.defaultDensity,
            description: mat.description,
            isActive: mat.isActive,
            createdAt: mat.createdAt,
            currentPrice: currentPriceEntry ? currentPriceEntry.price_per_m3 : 0,
            currentEffectiveDate: currentPriceEntry ? currentPriceEntry.effective_date : null,
            currentLocationName: currentPriceEntry?.location?.name || "Semua Cabang (Global)",
            currentLocationId: currentPriceEntry?.locationId || null,
            currentHistoryId: currentPriceEntry?.id || null,
            currentNotes: currentPriceEntry?.notes || "",
            nextPrice: nextPriceEntry ? nextPriceEntry.price_per_m3 : null,
            nextEffectiveDate: nextPriceEntry ? nextPriceEntry.effective_date : null,
            nextHistoryId: nextPriceEntry?.id || null,
            historyCount: histories.length,
            histories: histories.map((h: any) => ({
                id: h.id,
                materialId: h.materialId,
                material_code: h.material_code,
                material_name: h.material_name,
                price_per_m3: h.price_per_m3,
                effective_date: h.effective_date,
                old_price: h.old_price,
                price_diff: (h.price_per_m3 || 0) - (h.old_price || 0),
                percentage: h.old_price && h.old_price > 0 ? (((h.price_per_m3 - h.old_price) / h.old_price) * 100) : 0,
                locationId: h.locationId,
                locationName: h.location?.name || "Semua Cabang (Global)",
                notes: h.notes,
                createdByName: h.createdBy?.username || "-",
                createdAt: h.createdAt,
            }))
        }
    })

    // Flatten all histories for global timeline view
    const allHistories = formattedMaterials.flatMap((m: any) => m.histories).sort((a: any, b: any) =>
        new Date(b.effective_date).getTime() - new Date(a.effective_date).getTime()
    )

    return {
        materials: formattedMaterials,
        histories: allHistories,
        locations
    }
}

/**
 * Add / Update price with an effective date (backdate support)
 */
export async function addMaterialPrice(input: MaterialPriceInput) {
    const session = await auth()
    if (!session?.user) throw new Error("Unauthorized")

    const { materialId, price_per_m3, effective_date, locationId, notes } = input

    if (!materialId) throw new Error("Material ID wajib diisi.")
    if (!price_per_m3 || price_per_m3 <= 0) throw new Error("Harga per kubik harus lebih besar dari 0.")
    if (!effective_date) throw new Error("Tanggal mulai berlaku wajib diisi.")

    const material = await prisma.masterMaterial.findUnique({
        where: { id: materialId }
    })
    if (!material) throw new Error("Material tidak ditemukan.")

    const effDate = new Date(effective_date)

    // Find the latest active price prior to this effective date for old_price
    const prevPrice = await prisma.materialPriceHistory.findFirst({
        where: {
            materialId,
            effective_date: { lt: effDate },
            ...(locationId ? { OR: [{ locationId }, { locationId: null }] } : { locationId: null })
        },
        orderBy: { effective_date: "desc" }
    })

    const cleanLocationId = locationId && locationId !== "all" ? locationId : null

    // Check if an entry with exact same effective date & location exists
    const existingExact = await prisma.materialPriceHistory.findFirst({
        where: {
            materialId,
            effective_date: effDate,
            locationId: cleanLocationId
        }
    })

    if (existingExact) {
        // Update existing exact entry
        await prisma.materialPriceHistory.update({
            where: { id: existingExact.id },
            data: {
                price_per_m3,
                notes,
                createdById: session.user.id,
            }
        })
    } else {
        // Create new history entry
        await prisma.materialPriceHistory.create({
            data: {
                materialId: material.id,
                material_code: material.code,
                material_name: material.name,
                price_per_m3,
                effective_date: effDate,
                old_price: prevPrice?.price_per_m3 || 0,
                locationId: cleanLocationId,
                notes,
                createdById: session.user.id,
            }
        })
    }

    revalidatePath("/admin/master-material")
    return { success: true }
}

/**
 * Edit an existing price history entry
 */
export async function editMaterialPriceHistory(data: {
    id: string
    price_per_m3: number
    effective_date: string
    locationId?: string | null
    notes?: string
}) {
    const session = await auth()
    if (!session?.user) throw new Error("Unauthorized")

    const { id, price_per_m3, effective_date, locationId, notes } = data

    if (!price_per_m3 || price_per_m3 <= 0) throw new Error("Harga harus lebih besar dari 0.")
    if (!effective_date) throw new Error("Tanggal efektif wajib diisi.")

    const cleanLocationId = locationId && locationId !== "all" ? locationId : null

    await prisma.materialPriceHistory.update({
        where: { id },
        data: {
            price_per_m3,
            effective_date: new Date(effective_date),
            locationId: cleanLocationId,
            notes,
        }
    })

    revalidatePath("/admin/master-material")
    return { success: true }
}

/**
 * Delete a price history entry (keeps at least 1)
 */
export async function deleteMaterialPriceHistory(id: string) {
    const session = await auth()
    if (!session?.user) throw new Error("Unauthorized")

    const entry = await prisma.materialPriceHistory.findUnique({
        where: { id }
    })
    if (!entry) throw new Error("Data riwayat tidak ditemukan.")

    const count = await prisma.materialPriceHistory.count({
        where: { materialId: entry.materialId }
    })
    if (count <= 1) {
        throw new Error("Tidak dapat menghapus satu-satunya riwayat harga material ini. Silakan ubah harganya.")
    }

    await prisma.materialPriceHistory.delete({
        where: { id }
    })

    revalidatePath("/admin/master-material")
    return { success: true }
}

/**
 * Create a new master material (non-cement)
 */
export async function createMasterMaterial(input: NewMaterialInput) {
    const session = await auth()
    if (!session?.user) throw new Error("Unauthorized")

    const {
        code, name, category = "AGREGAT", unit = "m³",
        defaultDensity, description, initial_price, effective_date, locationId, notes
    } = input

    if (!code || !name) throw new Error("Kode dan Nama Material wajib diisi.")
    if (!initial_price || initial_price <= 0) throw new Error("Harga awal harus lebih besar dari 0.")
    if (!effective_date) throw new Error("Tanggal mulai berlaku wajib diisi.")

    const normalizedCode = code.toUpperCase().trim().replace(/\s+/g, "_")

    // Check duplicate code
    const existing = await prisma.masterMaterial.findUnique({
        where: { code: normalizedCode }
    })
    if (existing) throw new Error(`Kode material "${normalizedCode}" sudah digunakan.`)

    const cleanLocationId = locationId && locationId !== "all" ? locationId : null

    const mat = await prisma.masterMaterial.create({
        data: {
            code: normalizedCode,
            name,
            category,
            unit,
            defaultDensity: defaultDensity ? Number(defaultDensity) : null,
            description,
            isActive: true,
        }
    })

    await prisma.materialPriceHistory.create({
        data: {
            materialId: mat.id,
            material_code: mat.code,
            material_name: mat.name,
            price_per_m3: initial_price,
            effective_date: new Date(effective_date),
            old_price: 0,
            locationId: cleanLocationId,
            notes: notes || "Penetapan harga awal material",
            createdById: session.user.id,
        }
    })

    revalidatePath("/admin/master-material")
    return { success: true }
}

/**
 * Point-in-time Price Lookup:
 * Returns the exact effective price of a material at any historical date.
 * E.g. date: "2026-08-15" will pick the price effective on/before 15 Aug 2026,
 * ignoring any newer price set on 1 Sept 2026!
 */
export async function getMaterialPriceAtDate(
    materialCode: string,
    targetDate: Date | string = new Date(),
    locationId?: string | null
): Promise<number> {
    const d = new Date(targetDate)

    // 1. Try branch-specific price first
    if (locationId && locationId !== "all") {
        const branchPrice = await prisma.materialPriceHistory.findFirst({
            where: {
                material_code: materialCode,
                locationId: locationId,
                effective_date: { lte: d },
            },
            orderBy: { effective_date: "desc" }
        })
        if (branchPrice) return branchPrice.price_per_m3
    }

    // 2. Fallback to global price (locationId is null)
    const globalPrice = await prisma.materialPriceHistory.findFirst({
        where: {
            material_code: materialCode,
            locationId: null,
            effective_date: { lte: d },
        },
        orderBy: { effective_date: "desc" }
    })
    if (globalPrice) return globalPrice.price_per_m3

    // 3. Fallback: if transaction date is older than the first recorded effective date, use earliest price
    const earliestPrice = await prisma.materialPriceHistory.findFirst({
        where: {
            material_code: materialCode,
            OR: [
                ...(locationId && locationId !== "all" ? [{ locationId }] : []),
                { locationId: null }
            ]
        },
        orderBy: { effective_date: "asc" }
    })

    return earliestPrice?.price_per_m3 ?? 0
}

/**
 * Simulator / Verification helper for UI:
 * Shows the exact matched price, along with timeline context (previous & next price).
 */
export async function simulatePriceAtDate(data: {
    materialCode: string
    targetDate: string // YYYY-MM-DD
    locationId?: string | null
}) {
    const { materialCode, targetDate, locationId } = data
    const d = new Date(targetDate)
    const cleanLocationId = locationId && locationId !== "all" ? locationId : null

    // Exact active entry
    let activeEntry = await prisma.materialPriceHistory.findFirst({
        where: {
            material_code: materialCode,
            effective_date: { lte: d },
            OR: [
                ...(cleanLocationId ? [{ locationId: cleanLocationId }] : []),
                { locationId: null }
            ]
        },
        include: { location: { select: { name: true } } },
        orderBy: [
            { locationId: cleanLocationId ? "desc" : "asc" },
            { effective_date: "desc" }
        ]
    })

    let isFallbackToEarliest = false
    if (!activeEntry) {
        // Fallback to earliest recorded price if date precedes first effective date
        activeEntry = await prisma.materialPriceHistory.findFirst({
            where: {
                material_code: materialCode,
                OR: [
                    ...(cleanLocationId ? [{ locationId: cleanLocationId }] : []),
                    { locationId: null }
                ]
            },
            include: { location: { select: { name: true } } },
            orderBy: { effective_date: "asc" }
        })
        if (activeEntry) isFallbackToEarliest = true
    }

    // Next scheduled entry after this date (if any)
    const nextEntry = await prisma.materialPriceHistory.findFirst({
        where: {
            material_code: materialCode,
            effective_date: { gt: d },
            OR: [
                ...(cleanLocationId ? [{ locationId: cleanLocationId }] : []),
                { locationId: null }
            ]
        },
        include: { location: { select: { name: true } } },
        orderBy: { effective_date: "asc" }
    })

    return {
        matchedPrice: activeEntry?.price_per_m3 ?? 0,
        matchedEffectiveDate: activeEntry?.effective_date ?? null,
        matchedLocationName: activeEntry?.location?.name || "Semua Cabang (Global)",
        notes: activeEntry?.notes ? (isFallbackToEarliest ? `${activeEntry.notes} (Tarif dasar awal)` : activeEntry.notes) : (isFallbackToEarliest ? "Menggunakan tarif dasar awal" : null),
        nextPrice: nextEntry?.price_per_m3 ?? null,
        nextEffectiveDate: nextEntry?.effective_date ?? null,
    }
}
