"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import { z } from "zod"

const productionSchema = z.object({
    customerId: z.string().min(1, "Customer required"),
    vehicleId: z.string().min(1, "Mixer required"),
    driverId: z.string().min(1, "Driver required"),
    qualityId: z.string().min(1, "Mutu required"),
    workItemId: z.string().min(1, "Item Pekerjaan required"),
    volume_cubic: z.coerce.number().min(0.1, "Volume minimum 0.1"),
    slump: z.string().min(1, "Slump required"),
    date: z.string().optional(),
    locationId: z.string().optional(),
})

export async function getProductionMasters() {
    const session = await auth()
    if (!session?.user?.employeeId || (!session.user.locationId && session.user.role !== 'SuperAdminBP')) return { customers: [], vehicles: [], drivers: [], qualities: [], workItems: [] }

    const isSuperAdmin = session.user.role === 'SuperAdminBP'
    const filter: any = isSuperAdmin ? {} : { locationId: session.user.locationId! }

    const [customers, vehicles, drivers, qualities, workItems] = await Promise.all([
        prisma.customer.findMany({ where: { status: "Active", ...filter }, orderBy: { customer_name: 'asc' } }),
        prisma.vehicle.findMany({ where: { vehicle_type: "Mixer", ...filter }, orderBy: { code: 'asc' } }),
        prisma.employee.findMany({ where: { position: "Sopir", status: "Active", ...filter }, orderBy: { name: 'asc' } }),
        prisma.concreteQuality.findMany({ where: filter, orderBy: { name: 'asc' } }),
        prisma.workItem.findMany({ where: filter, orderBy: { name: 'asc' } })
    ])

    return { customers, vehicles, drivers, qualities, workItems }
}

export async function getRecentProductions() {
    const session = await auth()
    if (!session?.user?.employeeId || (!session.user.locationId && session.user.role !== 'SuperAdminBP')) return []

    const isSuperAdmin = session.user.role === 'SuperAdminBP'
    const filter: any = isSuperAdmin ? {} : { locationId: session.user.locationId! }

    return await prisma.productionTransaction.findMany({
        where: filter,
        take: 10,
        orderBy: { date: 'desc' },
        include: {
            customer: true,
            vehicle: true,
            driver: true,
            concreteQuality: true,
            workItem: true,
            createdBy: true,
        }
    })
}

export async function createProduction(formData: FormData) {
    const session = await auth()
    if (!session?.user?.employeeId) return { success: false, error: "Unauthorized" }

    const data = Object.fromEntries(formData.entries())
    const locationId = session.user.role === 'SuperAdminBP' ? data.locationId as string : session.user.locationId;
    if (!locationId) return { success: false, error: "Location must be set to create production." }

    const parsed = productionSchema.safeParse(data)

    if (!parsed.success) {
        return { success: false, error: parsed.error.format() }
    }

    try {
        const { customerId, vehicleId, driverId, qualityId, workItemId, volume_cubic, slump, date } = parsed.data

        // Parse date correctly:
        // If date string is "YYYY-MM-DD", treat it as WIB local date (UTC+7)
        // to avoid midnight UTC being interpreted as the previous day in WIB.
        let transactionDate: Date
        if (date) {
            // "YYYY-MM-DD" → parse as WIB (UTC+7) local midnight
            if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
                // Append T00:00:00+07:00 to force WIB interpretation
                transactionDate = new Date(`${date}T00:00:00+07:00`)
            } else {
                transactionDate = new Date(date)
            }
        } else {
            transactionDate = new Date()
        }

        // === Calculate TM & Cumulative untuk hari yg sama (WIB-aware) ===
        // Gunakan UTC offset +7 jam untuk mendapatkan batas hari WIB yang tepat.
        // WIB midnight = UTC 17:00 hari sebelumnya
        // day start WIB = timestamp UTC - (timestamp UTC mod 86400000) + (24h * dayOffset WIB)
        const WIB_OFFSET_MS = 7 * 60 * 60 * 1000 // 7 jam dalam ms

        // Shift ke WIB, ambil midnight-nya, shift balik ke UTC
        const localMs = transactionDate.getTime() + WIB_OFFSET_MS
        const localMidnightMs = localMs - (localMs % (24 * 60 * 60 * 1000))
        const dayStartUTC = new Date(localMidnightMs - WIB_OFFSET_MS) // UTC equivalent of WIB 00:00
        const dayEndUTC = new Date(dayStartUTC.getTime() + 24 * 60 * 60 * 1000 - 1) // WIB 23:59:59.999

        // Query transaksi yang sudah ada di hari + customer + mutu + lokasi yang sama
        const existingTransactions = await prisma.productionTransaction.findMany({
            where: {
                customerId,
                qualityId,
                locationId,                                   // scope per cabang
                date: { gte: dayStartUTC, lte: dayEndUTC }   // scope per hari WIB
            }
        })

        const previousCumulative = existingTransactions.reduce((acc: number, t: any) => acc + t.volume_cubic, 0)
        const newCumulative = previousCumulative + volume_cubic
        const tripSequence = existingTransactions.length + 1  // TM-1, TM-2, dst. → reset tiap hari baru

        const transaction = await prisma.productionTransaction.create({
            data: {
                date: transactionDate,
                customerId,
                vehicleId,
                driverId,
                qualityId,
                workItemId,
                volume_cubic,
                slump,
                // @ts-ignore
                cumulative_volume: newCumulative,
                // @ts-ignore
                trip_sequence: tripSequence,
                locationId,
                createdById: session.user.employeeId,
                status: "Pending" // Will be confirmed in Phase 4
            },
            include: {
                customer: true,
                concreteQuality: true,
                workItem: true,
                driver: true,
                vehicle: true
            }
        })

        // Send Telegram Notification async
        sendTelegramNotification(transaction).catch(console.error)

        revalidatePath("/admin/produksi")
        return { success: true }
    } catch (e: any) {
        return { success: false, error: e.message }
    }
}

async function sendTelegramNotification(tx: any) {
    const botToken = process.env.TELEGRAM_BOT_TOKEN
    const chatId = process.env.TELEGRAM_GROUP_ID

    if (!botToken || !chatId) {
        console.warn("Telegram BOT_TOKEN or GROUP_ID missing. Skipping notification.")
        return
    }

    const message = `
🔔 *PRODUKSI BARU* 🔔

📋 *No Transaksi:* \`${tx.id.substring(0, 8).toUpperCase()}\`
🏢 *Customer:* ${tx.customer.customer_name}
📍 *Lokasi:* ${tx.customer.address}
🏗 *Mutu:* ${tx.concreteQuality.name}
⚒️ *Item Pekerjaan:* ${tx.workItem.name}
📏 *Slump:* ${tx.slump}
📦 *Volume Transaksi:* ${tx.volume_cubic} m³
📈 *Volume Kumulatif:* ${tx.cumulative_volume} m³

🚚 *Target Mobil:*
Sopir: ${tx.driver.name}
Plat: ${tx.vehicle.plate_number} 
Mixer: ${tx.vehicle.code}

📝 *Ritase (TM) Ke:* TM-${tx.trip_sequence}

⏰ *Waktu:* ${new Date(tx.date).toLocaleString('id-ID')}
  `.trim()

    const url = `https://api.telegram.org/bot${botToken}/sendMessage`

    await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            chat_id: chatId,
            text: message,
            parse_mode: "Markdown"
        })
    })
}
