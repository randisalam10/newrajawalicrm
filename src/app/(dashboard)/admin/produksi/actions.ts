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
})

export async function getProductionMasters() {
    const session = await auth()
    if (!session?.user?.employeeId) return { customers: [], vehicles: [], drivers: [], qualities: [], workItems: [] }

    const [customers, vehicles, drivers, qualities, workItems] = await Promise.all([
        prisma.customer.findMany({ where: { status: "Active", createdById: session.user.employeeId }, orderBy: { customer_name: 'asc' } }),
        prisma.vehicle.findMany({ where: { vehicle_type: "Mixer", createdById: session.user.employeeId }, orderBy: { code: 'asc' } }),
        prisma.employee.findMany({ where: { position: "Sopir", status: "Active", createdById: session.user.employeeId }, orderBy: { name: 'asc' } }),
        prisma.concreteQuality.findMany({ where: { createdById: session.user.employeeId }, orderBy: { name: 'asc' } }),
        prisma.workItem.findMany({ where: { createdById: session.user.employeeId }, orderBy: { name: 'asc' } })
    ])

    return { customers, vehicles, drivers, qualities, workItems }
}

export async function getRecentProductions() {
    const session = await auth()
    if (!session?.user?.employeeId) return []

    return await prisma.productionTransaction.findMany({
        where: { createdById: session.user.employeeId },
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
    const parsed = productionSchema.safeParse(data)

    if (!parsed.success) {
        return { success: false, error: parsed.error.format() }
    }

    try {
        const { customerId, vehicleId, driverId, qualityId, workItemId, volume_cubic, slump } = parsed.data

        // Calculate cumulative volume for this customer for today
        const today = new Date()
        today.setHours(0, 0, 0, 0)

        const existingTransactions = await prisma.productionTransaction.findMany({
            where: {
                customerId,
                date: { gte: today }
            }
        })

        const previousCumulative = existingTransactions.reduce((acc: number, t: any) => acc + t.volume_cubic, 0)
        const newCumulative = previousCumulative + volume_cubic

        const transaction = await prisma.productionTransaction.create({
            data: {
                date: new Date(),
                customerId,
                vehicleId,
                driverId,
                qualityId,
                workItemId,
                volume_cubic,
                slump,
                cumulative_volume: newCumulative,
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
📍 *Lokasi:* ${tx.customer.location}
🏗 *Mutu:* ${tx.concreteQuality.name}
⚒️ *Item Pekerjaan:* ${tx.workItem.name}
📏 *Slump:* ${tx.slump}
📦 *Volume Transaksi:* ${tx.volume_cubic} m³
📈 *Volume Kumulatif:* ${tx.cumulative_volume} m³

🚚 *Target Mobil:*
Sopir: ${tx.driver.name}
Plat: ${tx.vehicle.plate_number} 
Mixer: ${tx.vehicle.code}

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
