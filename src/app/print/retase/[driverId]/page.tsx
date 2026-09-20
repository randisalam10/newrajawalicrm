// Print page: Retase Sopir
// Route: /print/retase/[driverId]
// Query params: ?month=1-12&year=2025&locationId=xxx&type=mixer|dumptruck

import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import { RetasePrintClient } from "./client"

export default async function PrintRetasePage({
    params,
    searchParams,
}: {
    params: Promise<{ driverId: string }>
    searchParams: Promise<{ month?: string; year?: string; locationId?: string; type?: string }>
}) {
    const { driverId } = await params
    const { month, year, locationId, type } = await searchParams

    const now = new Date()
    const m = parseInt(month ?? String(now.getMonth() + 1))
    const y = parseInt(year ?? String(now.getFullYear()))

    const startDate = new Date(y, m - 1, 1)
    const endDate = new Date(y, m, 0, 23, 59, 59)

    // Fetch location name
    let locationName = "PT. Rajawali Mix"
    if (locationId) {
        const loc = await prisma.location.findUnique({ where: { id: locationId } })
        if (loc) locationName = `PT. Rajawali Mix — ${loc.name}`
    }

    const isDumpTruck = type === "dump_truck" || type === "dumptruck" || driverId.startsWith("name_")

    if (isDumpTruck) {
        let driverName = ""
        let resolvedDriverId = driverId
        if (driverId.startsWith("name_")) {
            driverName = decodeURIComponent(driverId.replace("name_", ""))
        } else {
            const emp = await prisma.employee.findUnique({ where: { id: driverId } })
            if (emp) {
                driverName = emp.name
                resolvedDriverId = emp.id
            } else {
                driverName = decodeURIComponent(driverId)
            }
        }

        const dtRecords = await prisma.aggregateIncoming.findMany({
            where: {
                source_type: "Internal",
                retase_amount: { gt: 0 },
                date: { gte: startDate, lte: endDate },
                ...(locationId ? { locationId } : {}),
                OR: [
                    { driverId: resolvedDriverId },
                    { driver_name: driverName },
                ]
            },
            include: {
                location: true,
                vehicle: true,
            },
            orderBy: { date: "asc" }
        })

        if (dtRecords.length === 0 && !driverName) return notFound()

        const totalTrip = dtRecords.length
        const totalVolume = dtRecords.reduce((s, t) => s + (t.volume_cubic || 0), 0)
        const totalKm = dtRecords.reduce((s, t) => s + (t.distance_km ?? 0), 0)
        const totalIncome = dtRecords.reduce((s, t) => s + (t.retase_amount ?? 0), 0)

        const records = dtRecords.map(tx => ({
            id: tx.id,
            date: tx.date.toISOString(),
            volume_cubic: tx.volume_cubic,
            no_bon: tx.no_bon,
            aggregate_type: tx.aggregate_type,
            dump_truck_size: tx.dump_truck_size,
            plate_number: tx.plate_number || tx.vehicle?.plate_number,
            vehicleCode: tx.vehicle?.code || "DT",
            distance_km: tx.distance_km,
            rate_price: tx.rate_price,
            retase_amount: tx.retase_amount,
        }))

        const driverData = {
            driverId: resolvedDriverId,
            driverType: "DUMP_TRUCK",
            name: driverName || dtRecords[0]?.driver_name || "Sopir Dump Truck",
            vehicleCode: dtRecords[0]?.vehicle?.code ?? dtRecords[0]?.plate_number ?? "Dump Truck",
            totalTrip,
            totalVolume,
            totalKm,
            totalIncome,
            records,
        }

        return (
            <RetasePrintClient
                driver={driverData}
                year={y}
                month={m}
                locationName={locationName}
            />
        )
    }

    // Default / Truk Mixer
    const driver = await prisma.employee.findUnique({
        where: { id: driverId },
    })
    if (!driver) return notFound()

    const transactions = await prisma.productionTransaction.findMany({
        where: {
            driverId,
            status: "Confirmed",
            date: { gte: startDate, lte: endDate },
            ...(locationId ? { locationId } : {}),
            retase: { isNot: null },
        },
        include: {
            retase: true,
            project: { include: { customer: true } },
            concreteQuality: true,
            vehicle: true,
        },
        orderBy: { date: "asc" },
    })

    const totalTrip = transactions.length
    const totalVolume = transactions.reduce((s, t) => s + t.volume_cubic, 0)
    const totalKm = transactions.reduce((s, t) => s + (t.retase?.calculated_distance ?? 0), 0)
    const totalIncome = transactions.reduce((s, t) => s + (t.retase?.income_amount ?? 0), 0)

    const records = transactions.map(tx => ({
        id: tx.id,
        date: tx.date.toISOString(),
        volume_cubic: tx.volume_cubic,
        project: {
            name: tx.project.name,
            customer: { customer_name: tx.project.customer.customer_name },
        },
        concreteQuality: { name: tx.concreteQuality.name },
        retase: tx.retase ? {
            calculated_distance: tx.retase.calculated_distance,
            price_per_cubic_km: tx.retase.price_per_cubic_km,
            income_amount: tx.retase.income_amount,
        } : undefined,
    }))

    const driverData = {
        driverId,
        driverType: "MIXER",
        name: driver.name,
        vehicleCode: transactions[0]?.vehicle?.code ?? "-",
        totalTrip,
        totalVolume,
        totalKm,
        totalIncome,
        records,
    }

    return (
        <RetasePrintClient
            driver={driverData}
            year={y}
            month={m}
            locationName={locationName}
        />
    )
}
