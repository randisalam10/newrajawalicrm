"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { revalidatePath } from "next/cache"
import {
    FuelFilterParams,
    FuelLogStats,
    LocationOptionItem,
    VehicleFuelLogItem,
    VehicleOptionItem,
    DriverOptionItem,
} from "./types"

/**
 * Mendapatkan meter terakhir kendaraan dari SELURUH sumber data:
 * 1. VehicleFuelLog (BBM Plant / Universal)
 * 2. CrusherFuelLog (BBM Stone Crusher)
 * 3. RblExpense (BBM Kas Kecil)
 * 4. PoItem (Suku Cadang / Servis)
 * 5. OperatorWorkLog (Jam Kerja Alat)
 */
export async function getLastMeterForVehicleUniversal(vehicleId: string) {
    const session = await auth()
    if (!session?.user) throw new Error("Unauthorized")

    const vehicle = await prisma.vehicle.findUnique({
        where: { id: vehicleId },
        select: { id: true, meter_type: true, plate_number: true, code: true },
    })
    if (!vehicle) return null

    const meterType = (vehicle.meter_type as "KM" | "HM") || "KM"

    // 1. VehicleFuelLog terakhir
    const lastFuel = await prisma.vehicleFuelLog.findFirst({
        where: { vehicleId },
        orderBy: [{ date: "desc" }, { createdAt: "desc" }],
        select: { current_meter: true, date: true, fuel_source: true },
    })

    // 2. CrusherFuelLog terakhir
    const lastCrusher = await prisma.crusherFuelLog.findFirst({
        where: { vehicleId },
        orderBy: { createdAt: "desc" },
        select: { current_hm: true, current_km: true, createdAt: true },
    })

    // 3. RblExpense terakhir
    const lastRbl = await prisma.rblExpense.findFirst({
        where: { vehicleId, kmMeter: { not: null, gt: 0 } },
        orderBy: [{ date: "desc" }, { createdAt: "desc" }],
        select: { kmMeter: true, date: true, itemDescription: true },
    })

    // 4. PoItem terakhir
    const lastPo = await prisma.poItem.findFirst({
        where: {
            vehicleId,
            km_hm: { not: null },
            purchaseOrder: { status: { not: "CANCELLED" } },
        },
        orderBy: { purchaseOrder: { tanggal_terbit: "desc" } },
        select: { km_hm: true, purchaseOrder: { select: { tanggal_terbit: true } } },
    })

    const candidates: Array<{ meter: number; date?: Date | null; source: string }> = []

    if (lastFuel?.current_meter && lastFuel.current_meter > 0) {
        candidates.push({
            meter: lastFuel.current_meter,
            date: lastFuel.date,
            source: `BBM (${lastFuel.fuel_source === "NON_RBL" ? "Non-RBL" : lastFuel.fuel_source})`,
        })
    }

    if (meterType === "HM") {
        if (lastCrusher?.current_hm && lastCrusher.current_hm > 0) {
            candidates.push({
                meter: lastCrusher.current_hm,
                date: lastCrusher.createdAt,
                source: "BBM Stone Crusher",
            })
        }
    } else {
        if (lastCrusher?.current_km && lastCrusher.current_km > 0) {
            candidates.push({
                meter: lastCrusher.current_km,
                date: lastCrusher.createdAt,
                source: "BBM Stone Crusher",
            })
        }
    }

    if (lastRbl?.kmMeter && lastRbl.kmMeter > 0) {
        candidates.push({
            meter: lastRbl.kmMeter,
            date: lastRbl.date,
            source: "RBL Kas Kecil",
        })
    }

    if (lastPo?.km_hm) {
        const parsed = parseFloat(String(lastPo.km_hm).replace(/[^0-9.]/g, ""))
        if (!isNaN(parsed) && parsed > 0) {
            candidates.push({
                meter: parsed,
                date: lastPo.purchaseOrder?.tanggal_terbit,
                source: "PO Logistik",
            })
        }
    }

    if (candidates.length === 0) {
        return {
            meterType,
            lastMeter: null,
            source: "",
            date: null,
        }
    }

    candidates.sort((a, b) => (b.meter || 0) - (a.meter || 0))
    const top = candidates[0]

    return {
        meterType,
        lastMeter: top.meter,
        source: top.source,
        date: top.date
            ? new Date(top.date).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })
            : null,
    }
}

/**
 * Mengambil master data opsi: Lokasi, Kendaraan (lengkap dengan meter terakhir universal), dan Driver
 */
export async function getFuelMasterOptions(targetLocationId?: string) {
    const session = await auth()
    if (!session?.user) throw new Error("Unauthorized")

    const isSuperAdmin =
        session.user.role === "SuperAdminBP" ||
        session.user.roleScope === "ALL_BRANCHES" ||
        ["CEO", "FVP"].includes(session.user.role || "")

    const activeLocId = isSuperAdmin ? targetLocationId : (session.user.locationId || targetLocationId)

    const [locations, rawVehicles, drivers] = await Promise.all([
        prisma.location.findMany({
            select: { id: true, name: true, type: true },
            orderBy: { name: "asc" },
        }),
        prisma.vehicle.findMany({
            where: activeLocId ? { locationId: activeLocId } : undefined,
            include: {
                location: { select: { id: true, name: true } },
                rblExpenses: {
                    where: { kmMeter: { not: null, gt: 0 } },
                    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
                    take: 1,
                    select: { kmMeter: true, date: true, itemDescription: true },
                },
                vehicleFuelLogs: {
                    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
                    take: 1,
                    select: { current_meter: true, date: true, fuel_source: true },
                },
                crusherFuelLogs: {
                    orderBy: { createdAt: "desc" },
                    take: 1,
                    select: { current_hm: true, current_km: true, createdAt: true },
                },
                poItems: {
                    where: {
                        km_hm: { not: null },
                        purchaseOrder: { status: { not: "CANCELLED" } },
                    },
                    orderBy: { purchaseOrder: { tanggal_terbit: "desc" } },
                    take: 1,
                    select: { km_hm: true, purchaseOrder: { select: { tanggal_terbit: true } } },
                },
            },
            orderBy: [{ location: { name: "asc" } }, { code: "asc" }],
        }),
        prisma.employee.findMany({
            where: {
                status: "Active",
                ...(activeLocId ? { locationId: activeLocId } : {}),
            },
            select: { id: true, name: true, position: true, locationId: true },
            orderBy: { name: "asc" },
        }),
    ])

    const vehicles: VehicleOptionItem[] = rawVehicles.map((v) => {
        const lastFuel = v.vehicleFuelLogs?.[0]
        const lastCrusher = v.crusherFuelLogs?.[0]
        const lastRbl = v.rblExpenses?.[0]
        const lastPo = v.poItems?.[0]
        const meterType = (v.meter_type as "KM" | "HM") || "KM"

        const candidates: Array<{ meter: number; date?: Date | null; source: string }> = []

        if (lastFuel?.current_meter && lastFuel.current_meter > 0) {
            candidates.push({
                meter: lastFuel.current_meter,
                date: lastFuel.date,
                source: `BBM (${lastFuel.fuel_source === "NON_RBL" ? "Non-RBL" : lastFuel.fuel_source})`,
            })
        }

        if (meterType === "HM") {
            if (lastCrusher?.current_hm && lastCrusher.current_hm > 0) {
                candidates.push({
                    meter: lastCrusher.current_hm,
                    date: lastCrusher.createdAt,
                    source: "BBM Stone Crusher",
                })
            }
        } else {
            if (lastCrusher?.current_km && lastCrusher.current_km > 0) {
                candidates.push({
                    meter: lastCrusher.current_km,
                    date: lastCrusher.createdAt,
                    source: "BBM Stone Crusher",
                })
            }
        }

        if (lastRbl?.kmMeter && lastRbl.kmMeter > 0) {
            candidates.push({
                meter: lastRbl.kmMeter,
                date: lastRbl.date,
                source: "RBL Kas Kecil",
            })
        }

        if (lastPo?.km_hm) {
            const parsed = parseFloat(String(lastPo.km_hm).replace(/[^0-9.]/g, ""))
            if (!isNaN(parsed) && parsed > 0) {
                candidates.push({
                    meter: parsed,
                    date: lastPo.purchaseOrder?.tanggal_terbit,
                    source: "PO Logistik",
                })
            }
        }

        let lastMeter: number | null = null
        let lastMeterSource: string | null = null
        let lastMeterDate: string | null = null

        if (candidates.length > 0) {
            candidates.sort((a, b) => (b.meter || 0) - (a.meter || 0))
            lastMeter = candidates[0].meter
            lastMeterSource = candidates[0].source
            lastMeterDate = candidates[0].date
                ? new Date(candidates[0].date).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })
                : null
        }

        return {
            id: v.id,
            code: v.code,
            plate_number: v.plate_number,
            vehicle_type: v.vehicle_type,
            meter_type: meterType,
            merk_model: v.merk_model,
            locationId: v.locationId,
            locationName: v.location?.name || "-",
            lastMeter,
            lastMeterSource,
            lastMeterDate,
        }
    })

    return {
        locations,
        vehicles,
        drivers,
    }
}

/**
 * Mengambil daftar VehicleFuelLog berdasarkan filter
 */
export async function getVehicleFuelLogs(params: FuelFilterParams = {}) {
    const session = await auth()
    if (!session?.user) throw new Error("Unauthorized")

    const isCorporate =
        session.user.role === "SuperAdminBP" ||
        session.user.roleScope === "ALL_BRANCHES" ||
        ["CEO", "FVP"].includes(session.user.role || "")

    const locationId = isCorporate
        ? (params.locationId && params.locationId !== "all" ? params.locationId : undefined)
        : session.user.locationId

    const where: any = {}
    if (locationId) where.locationId = locationId
    if (params.vehicleId && params.vehicleId !== "all") where.vehicleId = params.vehicleId
    if (params.fuelSource && params.fuelSource !== "all") where.fuel_source = params.fuelSource

    if (params.startDate || params.endDate) {
        where.date = {}
        if (params.startDate) {
            where.date.gte = new Date(`${params.startDate}T00:00:00.000Z`)
        }
        if (params.endDate) {
            where.date.lte = new Date(`${params.endDate}T23:59:59.999Z`)
        }
    }

    const logs = await prisma.vehicleFuelLog.findMany({
        where,
        include: {
            location: { select: { id: true, name: true } },
            vehicle: { select: { id: true, code: true, plate_number: true, vehicle_type: true, meter_type: true } },
            driver: { select: { id: true, name: true } },
            createdBy: { select: { username: true } },
        },
        orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    })

    let totalLiters = 0
    let totalCost = 0
    let totalNonRblLiters = 0
    let totalNonRblCost = 0
    let totalRblLiters = 0
    let totalRblCost = 0

    const items: VehicleFuelLogItem[] = logs.map((log) => {
        const liters = log.liters || 0
        const cost = log.total_cost || 0
        const isRbl = log.fuel_source === "RBL"

        totalLiters += liters
        totalCost += cost

        if (isRbl) {
            totalRblLiters += liters
            totalRblCost += cost
        } else {
            totalNonRblLiters += liters
            totalNonRblCost += cost
        }

        return {
            id: log.id,
            date: log.date.toISOString().split("T")[0],
            createdAt: log.createdAt.toISOString(),
            locationId: log.locationId,
            locationName: log.location.name,
            vehicleId: log.vehicleId,
            vehicleCode: log.vehicle.code,
            plateNumber: log.vehicle.plate_number,
            vehicleType: log.vehicle.vehicle_type,
            meterType: log.meter_type,
            currentMeter: log.current_meter,
            lastMeter: log.last_meter,
            meterDelta: log.meter_delta,
            isMeterReset: log.is_meter_reset,
            liters,
            fuelSource: log.fuel_source,
            costPerLiter: log.cost_per_liter || 0,
            totalCost: cost,
            driverId: log.driverId,
            driverName: log.driver?.name || log.driver_name,
            receiptNo: log.receipt_no,
            notes: log.notes,
            createdByName: log.createdBy.username,
        }
    })

    const stats: FuelLogStats = {
        totalLiters,
        totalCost,
        totalNonRblLiters,
        totalNonRblCost,
        totalRblLiters,
        totalRblCost,
        totalEntries: items.length,
    }

    return { items, stats }
}

/**
 * Menambahkan data pengisian BBM baru
 */
export async function addVehicleFuelLog(data: {
    date: string
    locationId: string
    vehicleId: string
    driverId?: string
    driver_name?: string
    meter_type: string
    current_meter: number
    is_meter_reset?: boolean
    liters: number
    fuel_source: string
    cost_per_liter: number
    total_cost?: number
    receipt_no?: string
    notes?: string
}) {
    const session = await auth()
    if (!session?.user?.id) throw new Error("Unauthorized")

    if (!data.vehicleId) throw new Error("Pilih armada / kendaraan")
    if (!data.liters || Number(data.liters) <= 0) throw new Error("Volume liter wajib diisi lebih dari 0")
    if (data.current_meter === undefined || data.current_meter === null || isNaN(Number(data.current_meter))) {
        throw new Error("Odometer saat pengisian wajib diisi")
    }

    // Ambil meter terakhir untuk menghitung selisih dan validasi backdate
    const last = await getLastMeterForVehicleUniversal(data.vehicleId)
    const lastMeterVal = last?.lastMeter ?? null
    const currentMeterVal = Number(data.current_meter)

    if (!data.is_meter_reset && lastMeterVal !== null && currentMeterVal < lastMeterVal) {
        throw new Error(
            `Odometer (${currentMeterVal}) tidak boleh lebih kecil dari meter sebelumnya (${lastMeterVal}). Jika baru saja ganti speedometer, aktifkan opsi 'Ganti Speedometer Baru'.`
        )
    }

    const meterDelta = lastMeterVal !== null && !data.is_meter_reset ? Math.max(0, currentMeterVal - lastMeterVal) : null
    const litersNum = Number(data.liters)
    const costPerLiterNum = Number(data.cost_per_liter) || 0
    const totalCostNum = data.total_cost !== undefined && data.total_cost !== null
        ? Number(data.total_cost)
        : litersNum * costPerLiterNum

    const targetDate = new Date(`${data.date}T12:00:00.000Z`)

    await prisma.vehicleFuelLog.create({
        data: {
            date: targetDate,
            locationId: data.locationId,
            vehicleId: data.vehicleId,
            driverId: data.driverId || null,
            driver_name: data.driver_name || null,
            meter_type: data.meter_type || "KM",
            current_meter: currentMeterVal,
            last_meter: lastMeterVal,
            meter_delta: meterDelta,
            is_meter_reset: Boolean(data.is_meter_reset),
            liters: litersNum,
            fuel_source: data.fuel_source || "NON_RBL",
            cost_per_liter: costPerLiterNum,
            total_cost: totalCostNum,
            receipt_no: data.receipt_no || null,
            notes: data.notes || null,
            createdById: session.user.id,
        },
    })

    revalidatePath("/admin/fuel")
    revalidatePath("/admin/reports/kendaraan")
    return { success: true }
}

/**
 * Menghapus data log BBM
 */
export async function deleteVehicleFuelLog(id: string) {
    const session = await auth()
    if (!session?.user?.id) throw new Error("Unauthorized")

    await prisma.vehicleFuelLog.delete({
        where: { id },
    })

    revalidatePath("/admin/fuel")
    revalidatePath("/admin/reports/kendaraan")
    return { success: true }
}
