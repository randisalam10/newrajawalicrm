import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

const DEFAULT_CATEGORIES = [
    {
        name: "BBM / Solar",
        description: "Bahan bakar kendaraan & alat operasional (Mixer, Loader, Genset)",
        requireVehicleKm: true,
        isSystem: true,
    },
    {
        name: "Pelumas / Oli",
        description: "Oli mesin, transmisi, hidrolik, gemuk/grease armada & alat plant",
        requireVehicleKm: true,
        isSystem: true,
    },
    {
        name: "Konsumsi & Dapur",
        description: "Makan lembur, air minum galon, konsumsi kru & tamu plant",
        requireVehicleKm: false,
        isSystem: true,
    },
    {
        name: "Pemeliharaan & Sparepart",
        description: "Perbaikan kecil, baut, las, cuci truk, servis darurat",
        requireVehicleKm: false,
        isSystem: true,
    },
    {
        name: "ATK & Keperluan Kantor",
        description: "Kertas bon, tinta printer, map, alat tulis kantor plant",
        requireVehicleKm: false,
        isSystem: true,
    },
    {
        name: "Listrik, Air & Internet",
        description: "Token listrik PLN, air PDAM/tangki, kuota pulsa/WiFi cabang",
        requireVehicleKm: false,
        isSystem: true,
    },
    {
        name: "Keamanan & Kebersihan",
        description: "Retribusi sampah, koordinasi keamanan lingkungan, sabun cuci",
        requireVehicleKm: false,
        isSystem: true,
    },
    {
        name: "Operasional Umum",
        description: "Biaya tak terduga, fotokopi, parkir, pengeluaran umum lapangan",
        requireVehicleKm: false,
        isSystem: true,
    },
]

export async function seedRblCategories() {
    console.log("🌱 Menyemai kategori default RBL...")
    for (const cat of DEFAULT_CATEGORIES) {
        await prisma.rblCategory.upsert({
            where: { name: cat.name },
            update: {
                description: cat.description,
                requireVehicleKm: cat.requireVehicleKm,
                isSystem: cat.isSystem,
            },
            create: {
                name: cat.name,
                description: cat.description,
                requireVehicleKm: cat.requireVehicleKm,
                isSystem: cat.isSystem,
            },
        })
    }

    // Link existing expenses that have matching category names
    const allCategories = await prisma.rblCategory.findMany()
    const categoryMap = new Map(allCategories.map(c => [c.name.toLowerCase(), c.id]))

    const expensesWithoutCatId = await prisma.rblExpense.findMany({
        where: { categoryId: null, category: { not: null } },
        select: { id: true, category: true },
    })

    for (const exp of expensesWithoutCatId) {
        const catName = exp.category?.toLowerCase() || ""
        let matchedId = categoryMap.get(catName)

        if (!matchedId) {
            // Check for legacy "BBM & Pelumas"
            if (catName.includes("bbm") || catName.includes("solar")) {
                matchedId = categoryMap.get("bbm / solar")
            } else if (catName.includes("pelumas") || catName.includes("oli")) {
                matchedId = categoryMap.get("pelumas / oli")
            } else if (catName.includes("konsumsi") || catName.includes("dapur")) {
                matchedId = categoryMap.get("konsumsi & dapur")
            } else if (catName.includes("pemeliharaan") || catName.includes("sparepart")) {
                matchedId = categoryMap.get("pemeliharaan & sparepart")
            } else if (catName.includes("atk") || catName.includes("kantor")) {
                matchedId = categoryMap.get("atk & keperluan kantor")
            } else if (catName.includes("listrik") || catName.includes("air") || catName.includes("internet")) {
                matchedId = categoryMap.get("listrik, air & internet")
            } else if (catName.includes("keamanan") || catName.includes("kebersihan")) {
                matchedId = categoryMap.get("keamanan & kebersihan")
            } else {
                matchedId = categoryMap.get("operasional umum")
            }
        }

        if (matchedId) {
            await prisma.rblExpense.update({
                where: { id: exp.id },
                data: { categoryId: matchedId }
            })
        }
    }

    console.log("✅ Kategori default RBL berhasil disemai dan data eksisting diselaraskan.")
}

if (require.main === module) {
    seedRblCategories()
        .catch(console.error)
        .finally(() => prisma.$disconnect())
}
