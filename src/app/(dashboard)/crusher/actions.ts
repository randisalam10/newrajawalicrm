"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { revalidatePath } from "next/cache"
import { CrusherDailyReportData, CrusherMaterialSourceItem, CrusherDestinationItem, CrusherEditLogItem } from "./types"
import { computeOperatorFee, computeRetase, DEFAULT_MATERIAL_IN_RATE } from "@/lib/crusher-calc"
import { resolveCrusherRetaseSetting } from "@/lib/crusher-retase-setting"
import { calculateHmDifference } from "./utils/crusher-helpers"

export async function getCrusherDailyReport(dateStr: string, targetLocationId?: string): Promise<CrusherDailyReportData | null> {
    const session = await auth()
    if (!session?.user) throw new Error("Unauthorized")

    const locationId = targetLocationId || session.user.locationId
    if (!locationId) return null

    // Parse date midday UTC safe
    const targetDate = new Date(`${dateStr}T12:00:00.000Z`)

    if (!prisma.crusherDailyReport) {
        console.warn("[StoneCrusher] prisma.crusherDailyReport is undefined on current instance.")
        return null
    }

    const report = await prisma.crusherDailyReport.findUnique({
        where: {
            locationId_date: {
                locationId,
                date: targetDate,
            },
        },
        include: {
            location: { select: { id: true, name: true } },
            createdBy: { select: { id: true, username: true } },
            downtimes: { orderBy: { start_time: "asc" } },
            fuelLogs: { orderBy: { createdAt: "desc" } },
            materialsIn: { orderBy: { createdAt: "desc" } },
            materialsOut: {
                include: {
                    targetLocation: { select: { id: true, name: true } },
                },
                orderBy: { createdAt: "desc" },
            },
            operatorWorkLogs: {
                orderBy: [{ role_type: "asc" }, { employee_name: "asc" }],
            },
        },
    })

    if (!report) return null

    // Safely batch load destinations for materialsOut (prevents stale client crashes)
    const destIds = Array.from(
        new Set(
            report.materialsOut
                .map((o: any) => o.destinationId)
                .filter((id): id is string => Boolean(id))
        )
    )
    const destMap = new Map<string, { id: string; name: string; distance_km: number }>()
    if (destIds.length > 0 && (prisma as any).crusherDestination) {
        try {
            const destRecords = await (prisma as any).crusherDestination.findMany({
                where: { id: { in: destIds } },
                select: { id: true, name: true, distance_km: true },
            })
            for (const d of destRecords) {
                destMap.set(d.id, d)
            }
        } catch (e) {
            console.warn("[StoneCrusher] Error batch fetching destinations:", e)
        }
    }

    let editLogs: CrusherEditLogItem[] = []
    try {
        const rawLogs: any[] = await prisma.$queryRaw`
            SELECT l.id, l."action", l."changes", l."createdAt", u.username as "userName"
            FROM "CrusherReportEditLog" l
            LEFT JOIN "User" u ON u.id = l."userId"
            WHERE l."reportId" = ${report.id}
            ORDER BY l."createdAt" DESC;
        `
        if (Array.isArray(rawLogs)) {
            editLogs = rawLogs.map((l) => ({
                id: String(l.id),
                action: String(l.action),
                changes: String(l.changes),
                userName: String(l.userName || "Operator"),
                createdAt: l.createdAt ? new Date(l.createdAt).toISOString() : "",
            }))
        }
    } catch (err) {
        // Fallback jika query error
    }

    return {
        id: report.id,
        date: dateStr,
        locationId: report.locationId,
        locationName: report.location.name,
        hm_start: report.hm_start ?? 0,
        hm_end: report.hm_end ?? 0,
        total_hm: report.total_hm ?? 0,
        hm_notes: report.hm_notes,
        sunny_from: report.sunny_from,
        sunny_to: report.sunny_to,
        rain_from: report.rain_from,
        rain_to: report.rain_to,
        weather_notes: report.weather_notes,
        status: (report.status as "DRAFT" | "SUBMITTED" | "APPROVED") || "DRAFT",
        createdById: report.createdById,
        createdByName: report.createdBy?.username,
        downtimes: report.downtimes.map(d => ({
            id: d.id,
            start_time: d.start_time,
            end_time: d.end_time,
            total_hours: d.total_hours ?? 0,
            problem_desc: d.problem_desc,
            action_taken: d.action_taken,
        })),
        fuelLogs: report.fuelLogs.map(f => ({
            id: f.id,
            unit_name: f.unit_name,
            unit_category: f.unit_category as any,
            vehicleId: f.vehicleId,
            liters: f.liters ?? 0,
            current_hm: f.current_hm,
            current_km: f.current_km,
            work_hours: f.work_hours,
            notes: f.notes,
        })),
        materialsIn: report.materialsIn.map(m => ({
            id: m.id,
            feed_type: m.feed_type as any,
            vehicleId: m.vehicleId,
            plate_number: m.plate_number,
            driverId: m.driverId,
            driver_name: m.driver_name,
            sourceId: m.sourceId,
            source_name: m.source_name,
            distance_km: m.distance_km ?? 0,
            ritase: m.ritase ?? 0,
            volume_m3: m.volume_m3,
            rate_price: m.rate_price ?? 4500,
            retase_amount: m.retase_amount ?? 0,
            is_paid: m.is_paid,
            paid_date: m.paid_date ? m.paid_date.toISOString() : null,
            notes: m.notes,
        })),
        materialsOut: report.materialsOut.map(o => ({
            id: o.id,
            material_name: o.material_name,
            volume_m3: o.volume_m3 ?? 0,
            vehicleId: o.vehicleId,
            plate_number: o.plate_number,
            driverId: o.driverId,
            driver_name: o.driver_name,
            dump_truck_size: o.dump_truck_size,
            ritase: o.ritase ?? 1,
            distance_km: o.distance_km ?? 0,
            retase_rate: o.retase_rate ?? 0,
            retase_amount: o.retase_amount ?? 0,
            is_retase_paid: o.is_retase_paid,
            paid_retase_date: o.paid_retase_date ? o.paid_retase_date.toISOString() : null,
            operatorId: o.operatorId,
            operator_name: o.operator_name,
            operator_rate: o.operator_rate ?? 0,
            operator_fee: o.operator_fee ?? 0,
            is_operator_paid: o.is_operator_paid,
            destination_type: o.destination_type as any,
            destinationId: o.destinationId,
            destinationName: (o.destinationId ? destMap.get(o.destinationId)?.name : null) || o.customer_name || null,
            targetLocationId: o.targetLocationId,
            targetLocationName: o.targetLocation?.name,
            receipt_status: o.receipt_status,
            receivedAt: o.receivedAt ? o.receivedAt.toISOString() : null,
            customer_name: o.customer_name || (o.destinationId ? destMap.get(o.destinationId)?.name : null) || null,
            unit_price: o.unit_price ?? 0,
            total_price: o.total_price ?? 0,
            payment_method: o.payment_method,
            payment_status: o.payment_status,
            notes: o.notes,
        })),
        operatorLogs: (report.operatorWorkLogs || []).map(l => ({
            id: l.id,
            date: l.date.toISOString().split("T")[0],
            locationId: l.locationId,
            reportId: l.reportId,
            employeeId: l.employeeId,
            employee_name: l.employee_name,
            role_type: l.role_type as any,
            vehicleId: l.vehicleId,
            vehicle_code: l.vehicle_code,
            hm_start: l.hm_start,
            hm_end: l.hm_end,
            work_hours_normal: l.work_hours_normal,
            work_hours_overtime: l.work_hours_overtime,
            total_hours: l.total_hours,
            rate_normal: l.rate_normal,
            rate_overtime: l.rate_overtime,
            fee_normal: l.fee_normal,
            fee_overtime: l.fee_overtime,
            total_fee: l.total_fee,
            incentiveRateId: l.incentiveRateId,
            is_paid: l.is_paid,
            paid_date: l.paid_date ? l.paid_date.toISOString() : null,
            notes: l.notes,
        })),
        editLogs,
    }
}

export async function upsertCrusherHeader(data: {
    date: string
    locationId: string
    hm_start: number
    hm_end: number
    total_hm: number
    hm_notes?: string
    sunny_from?: string
    sunny_to?: string
    rain_from?: string
    rain_to?: string
    weather_notes?: string
}) {
    const session = await auth()
    if (!session?.user?.id) throw new Error("Unauthorized")

    const targetDate = new Date(`${data.date}T12:00:00.000Z`)

    const existing = await prisma.crusherDailyReport.findUnique({
        where: {
            locationId_date: {
                locationId: data.locationId,
                date: targetDate,
            },
        },
    })

    const newStart = Number(data.hm_start) || 0
    const newEnd = Number(data.hm_end) || 0
    // B9: total_hm dihitung di server (hm_end - hm_start), tidak mempercayai nilai dari klien.
    const newTotal = calculateHmDifference(newStart, newEnd)

    if (existing) {
        const diffs: string[] = []
        const oldStart = existing.hm_start ?? 0
        const oldEnd = existing.hm_end ?? 0
        const oldTotal = existing.total_hm ?? 0

        // Catat perubahan HM jika ada perbedaan nilai
        if (newStart !== oldStart || newEnd !== oldEnd || newTotal !== oldTotal) {
            diffs.push(`HM: ${oldStart}-${oldEnd} (${oldTotal} j) ➔ ${newStart}-${newEnd} (${newTotal} j)`)
        }

        const oldSunny = `${existing.sunny_from || "-"}-${existing.sunny_to || "-"}`
        const newSunny = `${data.sunny_from || "-"}-${data.sunny_to || "-"}`
        if (oldSunny !== newSunny && (data.sunny_from || data.sunny_to)) {
            diffs.push(`Cuaca Cerah: ${oldSunny} ➔ ${newSunny}`)
        }

        const oldRain = `${existing.rain_from || "-"}-${existing.rain_to || "-"}`
        const newRain = `${data.rain_from || "-"}-${data.rain_to || "-"}`
        if (oldRain !== newRain && (data.rain_from || data.rain_to)) {
            diffs.push(`Cuaca Hujan: ${oldRain} ➔ ${newRain}`)
        }

        const oldNotes = (existing.hm_notes || "").trim()
        const newNotes = (data.hm_notes || "").trim()
        if (oldNotes !== newNotes && (oldNotes || newNotes)) {
            diffs.push(`Keterangan: "${oldNotes || "-"}" ➔ "${newNotes || "-"}"`)
        }

        if (diffs.length > 0) {
            try {
                await prisma.$executeRawUnsafe(
                    `INSERT INTO "CrusherReportEditLog" ("id", "reportId", "userId", "action", "changes", "createdAt")
                     VALUES (gen_random_uuid(), $1, $2, $3, $4, NOW())`,
                    existing.id,
                    session.user.id,
                    "UPDATE_MACHINE_HM",
                    diffs.join(" • ")
                )
            } catch (err) {
                console.error("[Crusher] Gagal mencatat edit log:", err)
            }
        }
    }

    const report = await prisma.crusherDailyReport.upsert({
        where: {
            locationId_date: {
                locationId: data.locationId,
                date: targetDate,
            },
        },
        update: {
            hm_start: newStart,
            hm_end: newEnd,
            total_hm: newTotal,
            hm_notes: data.hm_notes || null,
            sunny_from: data.sunny_from || null,
            sunny_to: data.sunny_to || null,
            rain_from: data.rain_from || null,
            rain_to: data.rain_to || null,
            weather_notes: data.weather_notes || null,
            // B9: pertahankan status APPROVED agar laporan yang sudah disetujui tidak turun status.
            status: existing?.status === "APPROVED" ? "APPROVED" : "SUBMITTED",
        },
        create: {
            date: targetDate,
            locationId: data.locationId,
            createdById: session.user.id,
            hm_start: newStart,
            hm_end: newEnd,
            total_hm: newTotal,
            hm_notes: data.hm_notes || null,
            sunny_from: data.sunny_from || null,
            sunny_to: data.sunny_to || null,
            rain_from: data.rain_from || null,
            rain_to: data.rain_to || null,
            weather_notes: data.weather_notes || null,
            status: "SUBMITTED",
        },
    })

    revalidatePath("/crusher")
    revalidatePath("/crusher/mesin")
    return { success: true, reportId: report.id }
}

export async function addCrusherDowntime(
    reportTarget: string | { reportId?: string; date?: string; locationId?: string },
    item: {
        start_time: string
        end_time: string
        total_hours: number
        problem_desc: string
        action_taken?: string
    }
) {
    const session = await auth()
    if (!session?.user?.id) throw new Error("Unauthorized")

    let targetReportId = typeof reportTarget === "string" ? reportTarget : reportTarget.reportId

    if (!targetReportId && typeof reportTarget === "object") {
        const date = reportTarget.date
        const locId = reportTarget.locationId || session.user.locationId
        if (date && locId) {
            const ensured = await ensureCrusherDailyReport(date, locId, session.user.id)
            targetReportId = ensured.id
        }
    }

    if (!targetReportId) {
        throw new Error("Laporan harian tidak ditemukan atau lokasi belum dipilih")
    }

    await prisma.crusherDowntime.create({
        data: {
            reportId: targetReportId,
            start_time: item.start_time,
            end_time: item.end_time,
            total_hours: Number(item.total_hours) || 0,
            problem_desc: item.problem_desc,
            action_taken: item.action_taken || null,
        },
    })

    revalidatePath("/crusher")
    revalidatePath("/crusher/mesin")
    return { success: true }
}

export async function deleteCrusherDowntime(id: string) {
    const session = await auth()
    if (!session?.user) throw new Error("Unauthorized")

    await prisma.crusherDowntime.delete({ where: { id } })
    revalidatePath("/crusher")
    revalidatePath("/crusher/mesin")
    return { success: true }
}

export async function addCrusherFuelLog(
    reportTarget: string | { reportId?: string; date?: string; locationId?: string },
    item: {
        unit_name: string
        unit_category: string
        vehicleId?: string
        liters: number
        current_hm?: number
        current_km?: number
        work_hours?: number
        notes?: string
        fuel_source?: string
        cost_per_liter?: number
        total_cost?: number
        rblExpenseId?: string
    }
) {
    const session = await auth()
    if (!session?.user?.id) throw new Error("Unauthorized")

    let targetReportId = typeof reportTarget === "string" ? reportTarget : reportTarget.reportId

    if (!targetReportId && typeof reportTarget === "object") {
        const date = reportTarget.date
        const locId = reportTarget.locationId || session.user.locationId
        if (date && locId) {
            const ensured = await ensureCrusherDailyReport(date, locId, session.user.id)
            targetReportId = ensured.id
        }
    }

    if (!targetReportId) {
        throw new Error("Laporan harian tidak ditemukan atau lokasi belum dipilih")
    }

    const liters = Number(item.liters) || 0
    if (liters <= 0) {
        throw new Error("Volume liter solar wajib diisi lebih dari 0")
    }

    const currentHm = item.current_hm !== undefined && item.current_hm !== null ? Number(item.current_hm) : null
    const currentKm = item.current_km !== undefined && item.current_km !== null ? Number(item.current_km) : null

    // Validasi Mandatory Odometer (KM / HM)
    if ((currentHm === null || isNaN(currentHm) || currentHm <= 0) && (currentKm === null || isNaN(currentKm) || currentKm <= 0)) {
        throw new Error("Angka Odometer (KM) atau Hour Meter (HM) saat pengisian wajib diisi!")
    }

    const costPerLiter = item.cost_per_liter !== undefined && item.cost_per_liter !== null ? Number(item.cost_per_liter) : 0
    const totalCost = item.total_cost !== undefined && item.total_cost !== null ? Number(item.total_cost) : (liters * costPerLiter)

    await prisma.crusherFuelLog.create({
        data: {
            reportId: targetReportId,
            unit_name: item.unit_name,
            unit_category: item.unit_category,
            vehicleId: item.vehicleId || null,
            liters,
            current_hm: currentHm,
            current_km: currentKm,
            work_hours: item.work_hours ? Number(item.work_hours) : null,
            notes: item.notes || null,
            fuel_source: item.fuel_source || "NON_RBL",
            cost_per_liter: costPerLiter,
            total_cost: totalCost,
            rblExpenseId: item.rblExpenseId || null,
        },
    })

    revalidatePath("/crusher")
    revalidatePath("/crusher/solar")
    revalidatePath("/admin/reports/kendaraan")
    return { success: true }
}

export async function deleteCrusherFuelLog(id: string) {
    const session = await auth()
    if (!session?.user) throw new Error("Unauthorized")

    await prisma.crusherFuelLog.delete({ where: { id } })
    revalidatePath("/crusher")
    return { success: true }
}

export async function ensureCrusherDailyReport(dateStr: string, locationId: string, userId: string) {
    const targetDate = new Date(`${dateStr}T12:00:00.000Z`)
    return await prisma.crusherDailyReport.upsert({
        where: {
            locationId_date: {
                locationId,
                date: targetDate,
            },
        },
        update: {},
        create: {
            date: targetDate,
            locationId,
            createdById: userId,
            hm_start: 0,
            hm_end: 0,
            total_hm: 0,
            status: "SUBMITTED",
        },
    })
}

export async function addCrusherMaterialIn(
    reportTarget: string | { reportId?: string; date?: string; locationId?: string },
    item: {
        feed_type: string
        vehicleId?: string
        plate_number: string
        driverId?: string
        driver_name: string
        sourceId?: string
        source_name: string
        distance_km: number
        ritase: number
        volume_m3?: number
        rate_price?: number
        notes?: string
    }
) {
    const session = await auth()
    if (!session?.user?.id) throw new Error("Unauthorized")

    let targetReportId = typeof reportTarget === "string" ? reportTarget : reportTarget.reportId

    if (!targetReportId && typeof reportTarget === "object") {
        const date = reportTarget.date
        const locId = reportTarget.locationId || session.user.locationId
        if (date && locId) {
            const ensured = await ensureCrusherDailyReport(date, locId, session.user.id)
            targetReportId = ensured.id
        }
    }

    if (!targetReportId) {
        throw new Error("Laporan harian tidak ditemukan atau lokasi belum dipilih")
    }

    const ritase = Number(item.ritase) || 1
    // B12: tarif retase material masuk diambil dari master CrusherRetaseSetting (fallback Rp4.500/rit).
    // Snapshot rate_price tetap disimpan untuk audit.
    let ratePrice = item.rate_price !== undefined ? Number(item.rate_price) : 0
    if (!ratePrice || ratePrice <= 0) {
        const reportLoc = await prisma.crusherDailyReport.findUnique({
            where: { id: targetReportId },
            select: { locationId: true },
        })
        const setting = await resolveCrusherRetaseSetting(reportLoc?.locationId)
        ratePrice = setting?.rate_flat_rit && Number(setting.rate_flat_rit) > 0
            ? Number(setting.rate_flat_rit)
            : DEFAULT_MATERIAL_IN_RATE
    }
    const retaseAmount = ritase * ratePrice

    let driverId = item.driverId || null
    if (!driverId && item.driver_name) {
        try {
            const emp = await prisma.employee.findFirst({
                where: {
                    name: { equals: item.driver_name.trim(), mode: "insensitive" },
                    position: "Sopir",
                    status: "Active",
                },
                select: { id: true },
            })
            if (emp) driverId = emp.id
        } catch (e) { }
    }

    let vehicleId = item.vehicleId || null
    if (!vehicleId && item.plate_number) {
        try {
            const cleanPlate = item.plate_number.replace(/\s+/g, "").toUpperCase()
            const veh = await prisma.vehicle.findFirst({
                where: {
                    plate_number: { equals: cleanPlate, mode: "insensitive" },
                },
                select: { id: true },
            })
            if (veh) vehicleId = veh.id
        } catch (e) { }
    }

    await prisma.crusherMaterialIn.create({
        data: {
            reportId: targetReportId,
            feed_type: item.feed_type,
            vehicleId,
            plate_number: item.plate_number.toUpperCase().trim(),
            driverId,
            driver_name: item.driver_name.trim(),
            sourceId: item.sourceId || null,
            source_name: item.source_name,
            distance_km: Number(item.distance_km) || 0,
            ritase: ritase,
            volume_m3: item.volume_m3 ? Number(item.volume_m3) : null,
            rate_price: ratePrice,
            retase_amount: retaseAmount,
            notes: item.notes || null,
        },
    })

    revalidatePath("/crusher")
    revalidatePath("/crusher/material-masuk")
    revalidatePath("/admin/retase-crusher")
    return { success: true, reportId: targetReportId }
}

export async function deleteCrusherMaterialIn(id: string) {
    const session = await auth()
    if (!session?.user) throw new Error("Unauthorized")

    await prisma.crusherMaterialIn.delete({ where: { id } })
    revalidatePath("/crusher")
    return { success: true }
}

export async function addCrusherMaterialOut(
    reportTarget: string | { reportId?: string; date?: string; locationId?: string },
    item: {
        material_name: string
        volume_m3: number
        vehicleId?: string
        plate_number?: string
        driverId?: string
        driver_name?: string
        dump_truck_size?: string // "BESAR" | "KECIL"
        ritase?: number
        distance_km?: number
        retase_rate?: number
        operatorId?: string
        operator_name?: string
        operator_rate?: number
        destination_type: string
        destinationId?: string
        targetLocationId?: string
        customer_name?: string
        unit_price?: number
        total_price?: number
        payment_method?: string
        payment_status?: string
        notes?: string
    }
) {
    const session = await auth()
    if (!session?.user?.id) throw new Error("Unauthorized")

    let targetReportId = typeof reportTarget === "string" ? reportTarget : reportTarget.reportId

    if (!targetReportId && typeof reportTarget === "object") {
        const date = reportTarget.date
        const locId = reportTarget.locationId || session.user.locationId
        if (date && locId) {
            const ensured = await ensureCrusherDailyReport(date, locId, session.user.id)
            targetReportId = ensured.id
        }
    }

    if (!targetReportId) {
        throw new Error("Laporan harian tidak ditemukan atau lokasi belum dipilih")
    }

    const ritase = Number(item.ritase) || 1
    const distanceKm = Number(item.distance_km) || 0
    const volumeM3 = Number(item.volume_m3) || 0

    // Ambil setting retase Stone Crusher dari SuperAdmin / Finance
    const reportObj = await prisma.crusherDailyReport.findUnique({
        where: { id: targetReportId },
        select: { locationId: true }
    })
    const reportLocId = reportObj?.locationId

    // Ambil master tujuan (untuk nama pelanggan & jarak default)
    let destRecord: { name: string; distance_km: number } | null = null
    if (item.destinationId) {
        destRecord = await prisma.crusherDestination.findUnique({
            where: { id: item.destinationId },
            select: { name: true, distance_km: true },
        })
    }

    // B4: Retase sopir untuk PENJUALAN_BEBAS dihitung otomatis saat input memakai
    // CrusherRetaseSetting aktif (sebelumnya selalu 0 dan hanya terisi via backdate).
    // Untuk BATCHING_PLANT, retase dihitung saat penerimaan di BP tujuan.
    let retaseRate = 0
    let retaseAmount = 0
    if (item.destination_type === "PENJUALAN_BEBAS") {
        const setting = await resolveCrusherRetaseSetting(reportLocId)
        if (setting) {
            let dist = distanceKm
            if ((!dist || dist <= 0) && destRecord) {
                dist = Number(destRecord.distance_km) || 0
            }
            const calc = computeRetase({
                formulaType: setting.formula_type,
                distanceKm: dist,
                ritase,
                volumeM3,
                dumpTruckSize: item.dump_truck_size,
                rateDtKecil: setting.rate_dt_kecil,
                rateDtBesar: setting.rate_dt_besar,
                ratePerKm: setting.rate_per_km,
                ratePerM3Km: setting.rate_per_m3_km,
                rateFlatRit: setting.rate_flat_rit,
            })
            retaseRate = calc.rate
            retaseAmount = calc.amount
        }
    }

    // Auto-link vehicleId jika plat nomor cocok dengan master kendaraan
    let vehicleId = item.vehicleId || null
    let plateNumber = item.plate_number?.trim() || null
    if (!vehicleId && plateNumber) {
        const matchedVeh = await prisma.vehicle.findFirst({
            where: {
                plate_number: { equals: plateNumber, mode: "insensitive" },
            },
            select: { id: true, plate_number: true },
        })
        if (matchedVeh) {
            vehicleId = matchedVeh.id
            plateNumber = matchedVeh.plate_number
        }
    }

    // Auto-link driverId jika nama sopir cocok dengan master karyawan
    let driverId = item.driverId || null
    let driverName = item.driver_name?.trim() || null
    if (!driverId && driverName) {
        const matchedDriver = await prisma.employee.findFirst({
            where: {
                name: { equals: driverName, mode: "insensitive" },
                position: "Sopir",
                status: "Active",
            },
            select: { id: true, name: true },
        })
        if (matchedDriver) {
            driverId = matchedDriver.id
            driverName = matchedDriver.name
        }
    }

    // Perhitungan Insentif Operator Crusher: Rp5.000 * volume (seluruh produk pecahan batu: Abu Batu, Ciping, Batu 1-2, Batu 2-3, Base Course, dll.)
    let operatorId = item.operatorId || null
    let operatorName = item.operator_name || null

    if (!operatorId && reportLocId) {
        // B5: prioritaskan operator yang benar-benar tercatat sebagai OPERATOR_CRUSHER
        // di lokasi ini (via OperatorWorkLog), bukan sembarang "Operator" (excavator/loader).
        const crusherOpLog = await prisma.operatorWorkLog.findFirst({
            where: { locationId: reportLocId, role_type: "OPERATOR_CRUSHER" },
            orderBy: { date: "desc" },
            select: { employeeId: true, employee_name: true },
        })
        if (crusherOpLog?.employeeId) {
            operatorId = crusherOpLog.employeeId
            operatorName = crusherOpLog.employee_name
        } else {
            const defaultOp = await prisma.employee.findFirst({
                where: {
                    status: "Active",
                    locationId: reportLocId,
                    position: "Operator",
                },
                orderBy: { name: "asc" },
                select: { id: true, name: true },
            })
            if (defaultOp) {
                operatorId = defaultOp.id
                operatorName = defaultOp.name
            }
        }
    }

    const operatorRate = item.operator_rate !== undefined && Number(item.operator_rate) > 0 ? Number(item.operator_rate) : 5000
    // B1: insentif operator HANYA untuk material pecahan batu (aturan sama dengan UI).
    const operatorFee = computeOperatorFee(item.material_name, volumeM3, operatorRate)

    // Nama pelanggan: pakai input manual, atau fallback ke nama master tujuan
    let custName = item.customer_name || destRecord?.name || null

    // Status penerimaan ke BP
    const receiptStatus = item.destination_type === "BATCHING_PLANT" && item.targetLocationId ? "PENDING_RECEIPT" : "RECEIVED"

    await prisma.crusherMaterialOut.create({
        data: {
            reportId: targetReportId,
            material_name: item.material_name,
            volume_m3: volumeM3,
            vehicleId: vehicleId,
            plate_number: plateNumber,
            driverId: driverId,
            driver_name: driverName,
            dump_truck_size: item.dump_truck_size || null,
            ritase: ritase,
            distance_km: distanceKm,
            retase_rate: retaseRate,
            retase_amount: retaseAmount,
            operatorId: operatorId,
            operator_name: operatorName,
            operator_rate: operatorRate,
            operator_fee: operatorFee,
            destination_type: item.destination_type,
            destinationId: item.destinationId || null,
            targetLocationId: item.targetLocationId || null,
            is_received_by_bp: false,
            receipt_status: receiptStatus,
            aggregateIncomingId: null,
            customer_name: custName,
            unit_price: item.unit_price ? Number(item.unit_price) : 0,
            total_price: item.total_price ? Number(item.total_price) : 0,
            payment_method: item.payment_method || "CASH",
            payment_status: item.payment_status || "LUNAS",
            notes: item.notes || null,
        },
    })

    revalidatePath("/crusher")
    revalidatePath("/crusher/material-keluar")
    revalidatePath("/admin/retase-crusher")
    return { success: true }
}

export async function deleteCrusherMaterialOut(id: string) {
    const session = await auth()
    if (!session?.user) throw new Error("Unauthorized")

    const existing = await prisma.crusherMaterialOut.findUnique({
        where: { id },
        select: { aggregateIncomingId: true },
    })

    if (existing?.aggregateIncomingId) {
        await prisma.aggregateIncoming.delete({
            where: { id: existing.aggregateIncomingId },
        }).catch(() => null)
    }

    await prisma.crusherMaterialOut.delete({ where: { id } })
    revalidatePath("/crusher")
    return { success: true }
}

export async function submitCrusherReport(reportId: string, status: "SUBMITTED" | "APPROVED" | "DRAFT") {
    const session = await auth()
    if (!session?.user) throw new Error("Unauthorized")

    await prisma.crusherDailyReport.update({
        where: { id: reportId },
        data: { status },
    })

    revalidatePath("/crusher")
    return { success: true }
}

export async function getCrusherMaterialSources(): Promise<CrusherMaterialSourceItem[]> {
    if (!prisma.crusherMaterialSource) {
        return []
    }
    const sources = await prisma.crusherMaterialSource.findMany({
        where: { isActive: true },
        orderBy: { name: "asc" },
    })
    return sources.map(s => ({
        id: s.id,
        name: s.name,
        default_distance_km: s.default_distance_km ?? 0,
        description: s.description,
        isActive: s.isActive,
    }))
}

export async function saveCrusherMaterialSource(data: {
    id?: string
    name: string
    default_distance_km: number
    description?: string
}) {
    const session = await auth()
    if (!session?.user) throw new Error("Unauthorized")

    if (data.id) {
        await prisma.crusherMaterialSource.update({
            where: { id: data.id },
            data: {
                name: data.name,
                default_distance_km: Number(data.default_distance_km) || 0,
                description: data.description || null,
            },
        })
    } else {
        await prisma.crusherMaterialSource.create({
            data: {
                name: data.name,
                default_distance_km: Number(data.default_distance_km) || 0,
                description: data.description || null,
            },
        })
    }

    revalidatePath("/crusher")
    return { success: true }
}

export async function deleteCrusherMaterialSource(id: string) {
    const session = await auth()
    if (!session?.user) throw new Error("Unauthorized")

    await prisma.crusherMaterialSource.update({
        where: { id },
        data: { isActive: false },
    })
    revalidatePath("/crusher")
    return { success: true }
}

// ─── MASTER TUJUAN PENGIRIMAN NON-BP STONE CRUSHER ─────────────────────

export async function getCrusherDestinations(locationId?: string): Promise<CrusherDestinationItem[]> {
    if (!prisma.crusherDestination) {
        return []
    }
    const cleanLoc = (locationId && locationId !== "all" && locationId.trim() !== "") ? locationId.trim() : undefined
    const destinations = await prisma.crusherDestination.findMany({
        where: {
            isActive: true,
            ...(cleanLoc ? {
                OR: [
                    { locationId: cleanLoc },
                    { locationId: null },
                ]
            } : {}),
        },
        include: {
            location: { select: { name: true } },
            _count: { select: { materialsOut: true } },
        },
        orderBy: { name: "asc" },
    })

    return destinations.map(d => ({
        id: d.id,
        name: d.name,
        distance_km: d.distance_km ?? 0,
        address: d.address,
        contact_person: d.contact_person,
        phone: d.phone,
        notes: d.notes,
        isActive: d.isActive,
        locationId: d.locationId,
        locationName: d.location?.name || "Semua Crusher",
        totalDeliveries: d._count.materialsOut,
    }))
}

export async function saveCrusherDestination(data: {
    id?: string
    name: string
    distance_km: number
    address?: string
    contact_person?: string
    phone?: string
    notes?: string
    locationId?: string
    isActive?: boolean
}) {
    const session = await auth()
    if (!session?.user) throw new Error("Unauthorized")

    const cleanName = (data.name || "").trim()
    if (!cleanName) {
        throw new Error("Nama tujuan / proyek / pembeli wajib diisi")
    }

    let distanceKm = 0
    if (typeof data.distance_km === "number") {
        distanceKm = isNaN(data.distance_km) ? 0 : Math.max(0, data.distance_km)
    } else if (typeof data.distance_km === "string") {
        const parsed = parseFloat(String(data.distance_km).replace(",", "."))
        distanceKm = isNaN(parsed) ? 0 : Math.max(0, parsed)
    }

    let cleanLocationId: string | null = null
    if (data.locationId && data.locationId !== "all" && data.locationId.trim() !== "") {
        const candidateId = data.locationId.trim()
        try {
            const loc = await prisma.location.findUnique({
                where: { id: candidateId },
                select: { id: true },
            })
            if (loc) {
                cleanLocationId = candidateId
            }
        } catch (e) {
            cleanLocationId = null
        }
    }

    try {
        let saved
        if (data.id) {
            saved = await prisma.crusherDestination.update({
                where: { id: data.id },
                data: {
                    name: cleanName,
                    distance_km: distanceKm,
                    address: data.address?.trim() || null,
                    contact_person: data.contact_person?.trim() || null,
                    phone: data.phone?.trim() || null,
                    notes: data.notes?.trim() || null,
                    locationId: cleanLocationId,
                    ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
                },
                include: { location: { select: { name: true } } },
            })
        } else {
            saved = await prisma.crusherDestination.create({
                data: {
                    name: cleanName,
                    distance_km: distanceKm,
                    address: data.address?.trim() || null,
                    contact_person: data.contact_person?.trim() || null,
                    phone: data.phone?.trim() || null,
                    notes: data.notes?.trim() || null,
                    locationId: cleanLocationId,
                    isActive: true,
                },
                include: { location: { select: { name: true } } },
            })
        }

        revalidatePath("/crusher")
        revalidatePath("/crusher/material-keluar")
        revalidatePath("/admin/master-tujuan-crusher")
        revalidatePath("/admin/retase-crusher")

        const destination: CrusherDestinationItem = {
            id: saved.id,
            name: saved.name,
            distance_km: saved.distance_km ?? 0,
            address: saved.address,
            contact_person: saved.contact_person,
            phone: saved.phone,
            notes: saved.notes,
            isActive: saved.isActive,
            locationId: saved.locationId,
            locationName: saved.location?.name || "Semua Crusher",
            totalDeliveries: 0,
        }

        return { success: true, destination }
    } catch (err: any) {
        console.error("[StoneCrusher] Error saving destination:", err)
        throw new Error(err.message || "Gagal menyimpan data tujuan stone crusher")
    }
}

export async function deleteCrusherDestination(id: string) {
    const session = await auth()
    if (!session?.user) throw new Error("Unauthorized")

    try {
        const usageCount = await prisma.crusherMaterialOut.count({
            where: { destinationId: id },
        })

        if (usageCount > 0) {
            await prisma.crusherDestination.update({
                where: { id },
                data: { isActive: false },
            })
        } else {
            await prisma.crusherDestination.delete({
                where: { id },
            })
        }

        revalidatePath("/crusher")
        revalidatePath("/crusher/material-keluar")
        revalidatePath("/admin/master-tujuan-crusher")
        revalidatePath("/admin/retase-crusher")
        return { success: true }
    } catch (err: any) {
        console.error("[StoneCrusher] Error deleting destination:", err)
        throw new Error(err.message || "Gagal menghapus tujuan")
    }
}

// ─── MASTER LOKASI CRUSHER & BP ──────────────────────────────────────

export async function getCrusherLocations(): Promise<Array<{ id: string; name: string }>> {
    try {
        const crushers = await (prisma.location as any).findMany({
            where: { type: "STONE_CRUSHER" },
            orderBy: { name: "asc" },
            select: { id: true, name: true, type: true },
        })
        if (crushers.length > 0) return crushers
    } catch {
        try {
            const raw = await prisma.$queryRaw<Array<{ id: string; name: string; type: string }>>`
                SELECT "id", "name", "type" FROM "Location" WHERE "type" = 'STONE_CRUSHER' ORDER BY "name" ASC
            `
            if (raw.length > 0) return raw
        } catch { }
    }

    try {
        return await (prisma.location as any).findMany({
            orderBy: { name: "asc" },
            select: { id: true, name: true, type: true },
        })
    } catch {
        return await prisma.location.findMany({
            orderBy: { name: "asc" },
            select: { id: true, name: true },
        })
    }
}

export async function getBatchingPlantLocations(crusherLocationId?: string): Promise<Array<{ id: string; name: string }>> {
    let allBps: Array<{ id: string; name: string }> = []
    try {
        const bps = await (prisma.location as any).findMany({
            where: { type: "BATCHING_PLANT" },
            orderBy: { name: "asc" },
            select: { id: true, name: true, type: true },
        })
        if (bps.length > 0) allBps = bps
    } catch {
        try {
            const raw = await prisma.$queryRaw<Array<{ id: string; name: string; type: string }>>`
                SELECT "id", "name", "type" FROM "Location" WHERE "type" = 'BATCHING_PLANT' ORDER BY "name" ASC
            `
            if (raw.length > 0) allBps = raw
        } catch { }
    }

    if (allBps.length === 0) {
        try {
            allBps = await prisma.location.findMany({
                where: { type: "BATCHING_PLANT" },
                orderBy: { name: "asc" },
                select: { id: true, name: true },
            })
        } catch { }
    }

    // Resolusi Klaster Operasional Darat (Regional Cluster Filtering):
    // Crusher Harapan (Jayapura / Sentani) hanya dapat mendistribusikan agregat via Dump Truck
    // ke Batching Plant di wilayah operasional darat yang sama (Youtefa dan Koya).
    // Sorong (Papua Barat Daya) dan Tenggarong (Kaltim) dipisahkan agar operator tidak salah kirim.
    let crusherName = ""
    if (crusherLocationId) {
        try {
            const cLoc = await prisma.location.findUnique({
                where: { id: crusherLocationId },
                select: { name: true }
            })
            crusherName = (cLoc?.name || "").toLowerCase()
        } catch { }
    }

    // Jika crusher adalah Harapan atau crusher Jayapura (atau default crusher aktif saat ini)
    if (!crusherName || crusherName.includes("harapan") || crusherName.includes("jayapura") || crusherName.includes("sentani")) {
        const jayapuraBps = allBps.filter(bp => {
            const bpName = bp.name.toLowerCase()
            return !bpName.includes("sorong") && !bpName.includes("tenggarong")
        })
        if (jayapuraBps.length > 0) {
            // Urutkan Youtefa di depan sebagai penerima utama
            return jayapuraBps.sort((a, b) => {
                if (a.name.toLowerCase().includes("youtefa")) return -1
                if (b.name.toLowerCase().includes("youtefa")) return 1
                return a.name.localeCompare(b.name)
            })
        }
    } else if (crusherName.includes("sorong")) {
        return allBps.filter(bp => bp.name.toLowerCase().includes("sorong"))
    } else if (crusherName.includes("tenggarong")) {
        return allBps.filter(bp => bp.name.toLowerCase().includes("tenggarong"))
    }

    return allBps
}

// ─── MASTER KARYAWAN & SOPIR CRUSHER ─────────────────────────────────

export async function getCrusherEmployees(locationId?: string | null) {
    const session = await auth()
    if (!session?.user) throw new Error("Unauthorized")

    let locId = locationId || session.user.locationId
    if (!locId) {
        const defaultLoc = await findDefaultCrusherLocation()
        locId = defaultLoc?.id || null
    }

    const employees = await prisma.employee.findMany({
        where: {
            status: "Active",
            // B8: hanya karyawan pada lokasi crusher ini (atau seluruh crusher bila locId null).
            // Sebelumnya cabang OR menarik SEMUA sopir BP lintas cabang.
            ...(locId ? { locationId: locId } : { location: { type: "STONE_CRUSHER" } }),
            position: { in: ["Sopir", "Operator", "Helper"] },
        },
        orderBy: [{ location: { type: "desc" } }, { name: "asc" }],
        include: {
            driverCategory: true,
            location: { select: { id: true, name: true, type: true } },
        },
    })

    return employees.map(e => ({
        id: e.id,
        name: e.name,
        position: e.position,
        status: e.status,
        driverCategoryId: e.driverCategoryId,
        driverCategoryName: e.driverCategory?.name || (e.position === "Sopir" ? "Sopir Dump Truck" : null),
        locationId: e.locationId,
        locationName: e.location?.name,
        locationType: e.location?.type || null,
    }))
}

async function findDefaultCrusherLocation(): Promise<{ id: string; name: string } | null> {
    try {
        const found = await prisma.location.findFirst({
            where: {
                OR: [
                    { type: "STONE_CRUSHER" },
                    { name: { contains: "Harapan", mode: "insensitive" } },
                    { name: { contains: "Crusher", mode: "insensitive" } },
                ],
            },
            select: { id: true, name: true },
        })
        if (found) return found
    } catch { }
    return await prisma.location.findFirst({ select: { id: true, name: true } })
}

export async function quickAddEmployee(data: {
    name: string
    position?: "Sopir" | "Operator" | "Helper"
    locationId?: string
    driverCategoryName?: string
}) {
    const session = await auth()
    if (!session?.user) throw new Error("Unauthorized")
    if (!data.name?.trim()) throw new Error("Nama karyawan wajib diisi")

    const locId = data.locationId || session.user.locationId
    const pos = data.position || "Sopir"

    let driverCategoryId: string | null = null
    if (pos === "Sopir") {
        const catName = data.driverCategoryName || "Sopir Dump Truck"
        let dCat = await prisma.driverCategory.findFirst({
            where: { name: { equals: catName, mode: "insensitive" } },
        })
        if (!dCat) {
            dCat = await prisma.driverCategory.create({
                data: {
                    name: catName,
                    code: "SDT",
                    description: "Sopir Dump Truck Quarry & Cold Bin",
                    isSystem: true,
                },
            })
        }
        driverCategoryId = dCat.id
    }

    const fallbackLoc = await findDefaultCrusherLocation()
    const targetLocId = locId || fallbackLoc?.id

    const newEmployee = await prisma.employee.create({
        data: {
            name: data.name.trim(),
            position: pos,
            status: "Active",
            join_date: new Date(),
            locationId: targetLocId || null,
            driverCategoryId,
        },
    })

    revalidatePath("/crusher")
    revalidatePath("/crusher/karyawan")
    revalidatePath("/crusher/material-masuk")
    revalidatePath("/crusher/operator")
    revalidatePath("/admin/karyawan")
    return { success: true, employee: newEmployee, driver: { id: newEmployee.id, name: newEmployee.name } }
}

export async function updateCrusherEmployee(data: {
    id: string
    name: string
    position: "Sopir" | "Operator" | "Helper"
    driverCategoryName?: string
    status?: "Active" | "Inactive"
}) {
    const session = await auth()
    if (!session?.user) throw new Error("Unauthorized")
    if (!data.id) throw new Error("ID Karyawan wajib ada")
    if (!data.name?.trim()) throw new Error("Nama karyawan wajib diisi")

    let driverCategoryId: string | null = null
    if (data.position === "Sopir") {
        const catName = data.driverCategoryName || "Sopir Dump Truck"
        let dCat = await prisma.driverCategory.findFirst({
            where: { name: { equals: catName, mode: "insensitive" } },
        })
        if (!dCat) {
            dCat = await prisma.driverCategory.create({
                data: {
                    name: catName,
                    code: "SDT",
                    description: "Sopir Dump Truck Quarry & Cold Bin",
                    isSystem: true,
                },
            })
        }
        driverCategoryId = dCat.id
    }

    const updated = await prisma.employee.update({
        where: { id: data.id },
        data: {
            name: data.name.trim(),
            position: data.position,
            status: data.status || "Active",
            driverCategoryId,
        },
    })

    revalidatePath("/crusher")
    revalidatePath("/crusher/karyawan")
    revalidatePath("/crusher/material-masuk")
    revalidatePath("/crusher/operator")
    revalidatePath("/admin/karyawan")
    return { success: true, employee: updated }
}

export async function quickAddDriver(name: string, locationId?: string) {
    return quickAddEmployee({ name, position: "Sopir", locationId })
}

// ─── MASTER KENDARAAN CRUSHER ────────────────────────────────────────

export async function getCrusherVehicles(locationId?: string | null) {
    const session = await auth()
    if (!session?.user) throw new Error("Unauthorized")

    const locId = locationId && locationId !== "ALL" ? locationId : (session.user.locationId && session.user.locationId !== "ALL" ? session.user.locationId : undefined)

    const whereClause: any = locId
        ? {
            OR: [
                { locationId: locId },
                { dump_truck_size: { in: ["BESAR", "KECIL"] } },
                { category: { name: { contains: "Dump Truck", mode: "insensitive" } } },
            ],
          }
        : {
            OR: [
                { location: { type: "STONE_CRUSHER" } },
                { location: { name: { contains: "Crusher", mode: "insensitive" } } },
                { dump_truck_size: { in: ["BESAR", "KECIL"] } },
                { category: { name: { contains: "Dump Truck", mode: "insensitive" } } },
                { category: { name: { in: ["Excavator", "Wheel Loader", "Genset & Power Plant", "Stone Crusher", "Genset & Alat Berat"], mode: "insensitive" } } },
            ],
          }

    const vehicles = await prisma.vehicle.findMany({
        where: whereClause,
        orderBy: { plate_number: "asc" },
        include: {
            category: true,
            location: { select: { id: true, name: true } },
        },
    })

    const mapped = vehicles.map(v => ({
        id: v.id,
        plate_number: v.plate_number,
        code: v.code,
        dump_truck_size: v.dump_truck_size,
        capacity_cubic: v.capacity_cubic,
        categoryName: v.category?.name || "Dump Truck",
        locationId: v.locationId,
        locationName: v.location?.name,
        meter_type: v.meter_type,
        merk_model: v.merk_model,
    }))

    if (locId) {
        mapped.sort((a, b) => {
            const aMatch = a.locationId === locId ? 1 : 0
            const bMatch = b.locationId === locId ? 1 : 0
            if (aMatch !== bMatch) return bMatch - aMatch
            return a.plate_number.localeCompare(b.plate_number)
        })
    }

    return mapped
}

export async function quickAddVehicle(data: {
    plate_number: string
    dump_truck_size?: string
    capacity_cubic?: number
    locationId?: string
    categoryName?: string
    merk_model?: string
}) {
    const session = await auth()
    if (!session?.user) throw new Error("Unauthorized")
    if (!data.plate_number?.trim()) throw new Error("Plat nomor wajib diisi")

    const cleanPlate = data.plate_number.trim().toUpperCase().replace(/\s+/g, " ")
    const locId = data.locationId || session.user.locationId

    const fallbackLoc = await findDefaultCrusherLocation()
    if (!fallbackLoc) throw new Error("Belum ada lokasi cabang di database")
    const targetLocId = locId || fallbackLoc.id

    const existing = await prisma.vehicle.findFirst({
        where: {
            plate_number: { equals: cleanPlate, mode: "insensitive" },
        },
    })
    if (existing) {
        return { success: true, vehicle: existing }
    }

    const catName = data.categoryName || "Dump Truck"
    let category = await prisma.vehicleCategory.findFirst({
        where: { name: { equals: catName, mode: "insensitive" } },
    })
    if (!category) {
        category = await prisma.vehicleCategory.create({
            data: {
                name: catName,
                code: catName.slice(0, 3).toUpperCase(),
                description: `Armada / Alat ${catName}`,
                isSystem: true,
            },
        })
    }

    const cleanPlateUpper = cleanPlate.replace(/[^A-Z0-9]/g, "")
    const isDT = catName.toLowerCase().includes("dump")
    const isExca = catName.toLowerCase().includes("exca")
    const isLoader = catName.toLowerCase().includes("loader")
    const isGenset = catName.toLowerCase().includes("genset")
    const isCrusher = catName.toLowerCase().includes("crusher")

    const codePrefix = isExca ? "EXC" : isLoader ? "WL" : isGenset ? "GS" : isCrusher ? "CRU" : "DT"
    const code = `${codePrefix}-${cleanPlateUpper}`

    const newVehicle = await prisma.vehicle.create({
        data: {
            plate_number: cleanPlate,
            code,
            vehicle_type: "Loader",
            categoryId: category.id,
            dump_truck_size: isDT ? (data.dump_truck_size || "BESAR") : null,
            capacity_cubic: isDT ? (Number(data.capacity_cubic) || (data.dump_truck_size === "KECIL" ? 4.0 : 8.0)) : 0,
            locationId: targetLocId,
            meter_type: isDT ? "KM" : "HM",
            merk_model: data.merk_model || null,
        },
    })

    revalidatePath("/crusher")
    revalidatePath("/crusher/kendaraan")
    revalidatePath("/crusher/material-masuk")
    revalidatePath("/crusher/operator")
    revalidatePath("/crusher/solar")
    revalidatePath("/admin/kendaraan")
    return { success: true, vehicle: newVehicle }
}

export async function updateCrusherVehicle(data: {
    id: string
    plate_number: string
    code?: string
    dump_truck_size?: "BESAR" | "KECIL" | null
    capacity_cubic?: number
    categoryName?: string
    merk_model?: string
    meter_type?: "KM" | "HM"
}) {
    const session = await auth()
    if (!session?.user) throw new Error("Unauthorized")
    if (!data.id) throw new Error("ID Kendaraan wajib ada")
    if (!data.plate_number?.trim()) throw new Error("Plat nomor kendaraan wajib diisi")

    const cleanPlate = data.plate_number.trim().toUpperCase().replace(/\s+/g, " ")

    let categoryId: string | undefined = undefined
    if (data.categoryName) {
        let cat = await prisma.vehicleCategory.findFirst({
            where: { name: { equals: data.categoryName, mode: "insensitive" } },
        })
        if (!cat) {
            cat = await prisma.vehicleCategory.create({
                data: {
                    name: data.categoryName,
                    code: data.categoryName.slice(0, 3).toUpperCase(),
                    isSystem: false,
                },
            })
        }
        categoryId = cat.id
    }

    const updated = await prisma.vehicle.update({
        where: { id: data.id },
        data: {
            plate_number: cleanPlate,
            code: data.code || undefined,
            ...(categoryId ? { categoryId } : {}),
            dump_truck_size: data.dump_truck_size,
            capacity_cubic: data.capacity_cubic,
            merk_model: data.merk_model || null,
            meter_type: data.meter_type || undefined,
        },
    })

    revalidatePath("/crusher")
    revalidatePath("/crusher/kendaraan")
    revalidatePath("/crusher/material-masuk")
    revalidatePath("/crusher/operator")
    revalidatePath("/crusher/solar")
    revalidatePath("/admin/kendaraan")
    return { success: true, vehicle: updated }
}

export async function getMasterOperatorRates(locationId?: string | null) {
    const session = await auth()
    if (!session?.user) throw new Error("Unauthorized")

    const locId = locationId || session.user.locationId
    const rates = await prisma.masterIncentiveRate.findMany({
        where: {
            isActive: true,
            kategori_peran: {
                in: [
                    "OPERATOR_EXCAVATOR",
                    "OPERATOR_LOADER",
                    "HELPER",
                    "OPERATOR_CRUSHER",
                    "SOPIR_DT_LANGSIR",
                    "SOPIR_DT_KOLBIN",
                    "SOPIR_DT_KECIL",
                ],
            },
            ...(locId ? { OR: [{ locationId: locId }, { locationId: null }] } : {}),
        },
        orderBy: { effective_date: "desc" },
    })

    const rateMap: Record<string, { normal: number; overtime: number; name?: string }> = {
        OPERATOR_EXCAVATOR: { normal: 15000, overtime: 20000, name: "Operator Excavator" },
        OPERATOR_LOADER: { normal: 10000, overtime: 15000, name: "Operator Wheel Loader" },
        HELPER: { normal: 10000, overtime: 15000, name: "Helper Harian" },
        OPERATOR_CRUSHER: { normal: 15000, overtime: 20000, name: "Operator Stone Crusher" },
    }

    // B16: rates sudah urut effective_date desc → kecocokan spesifik PERTAMA = tarif terbaru.
    const specificSet = new Set<string>()
    for (const r of rates) {
        const isSpecific = Boolean(locId) && r.locationId === locId
        if (isSpecific) {
            if (specificSet.has(r.kategori_peran)) continue
            specificSet.add(r.kategori_peran)
            rateMap[r.kategori_peran] = {
                normal: Number(r.tarif_utama) || 0,
                overtime: Number(r.tarif_sekunder) || 0,
                name: r.nama_insentif,
            }
        } else if (!rateMap[r.kategori_peran]) {
            rateMap[r.kategori_peran] = {
                normal: Number(r.tarif_utama) || 0,
                overtime: Number(r.tarif_sekunder) || 0,
                name: r.nama_insentif,
            }
        }
    }

    return rateMap
}

// ─── PENERIMAAN MATERIAL DI BATCHING PLANT (KONFIRMASI PENERIMAAN) ────

export async function confirmMaterialReceiptInBP(
    materialOutId: string,
    paramsOrLocationId?: string | {
        bpLocationId?: string
        noBon?: string
        receivedVolumeM3?: number
        notes?: string
    }
) {
    const session = await auth()
    if (!session?.user?.id) throw new Error("Unauthorized")

    const bpLocationId = typeof paramsOrLocationId === "string" ? paramsOrLocationId : paramsOrLocationId?.bpLocationId
    const customNoBon = typeof paramsOrLocationId === "object" ? paramsOrLocationId?.noBon?.trim() : undefined
    const customVolume = typeof paramsOrLocationId === "object" ? paramsOrLocationId?.receivedVolumeM3 : undefined
    const customNotes = typeof paramsOrLocationId === "object" ? paramsOrLocationId?.notes : undefined

    const materialOut = await prisma.crusherMaterialOut.findUnique({
        where: { id: materialOutId },
        include: {
            report: { select: { date: true, location: { select: { name: true } } } },
        },
    })

    if (!materialOut) throw new Error("Data pengiriman material tidak ditemukan")
    if (materialOut.is_received_by_bp) throw new Error("Material sudah diterima sebelumnya")

    const targetLoc = bpLocationId || materialOut.targetLocationId
    if (!targetLoc) throw new Error("Lokasi Batching Plant tujuan belum ditentukan")

    let aggregateType: any = "Other"
    const matLower = materialOut.material_name.toLowerCase()
    if (matLower.includes("1-2") || matLower.includes("1/2")) aggregateType = "SplitHalfOne"
    else if (matLower.includes("2-3") || matLower.includes("2/3")) aggregateType = "SplitTwoThree"
    else if (matLower.includes("pasir")) aggregateType = "Pasir"

    const finalVolume = (customVolume !== undefined && customVolume > 0) ? customVolume : materialOut.volume_m3

    // Hitung retase sopir di Batching Plant penerima (sesuai setting retase agregat masuk BP)
    let resolvedRate: number | null = null
    let resolvedDistance: number | null = materialOut.distance_km || null
    let calculatedRetase: number | null = null

    const retaseSetting = await prisma.aggregateRetaseSetting.findFirst({
        where: { locationId: targetLoc }
    })

    if (retaseSetting) {
        resolvedRate = materialOut.dump_truck_size === "KECIL"
            ? retaseSetting.price_dt_kecil
            : (retaseSetting.price_dt_besar || 0)

        if (!resolvedDistance || resolvedDistance <= 0) {
            resolvedDistance = retaseSetting.default_distance_km
        }

        if (resolvedRate != null && resolvedDistance != null) {
            // B11: gunakan fungsi retase terpusat (aggregateRetaseSetting = Rp/m³.km → PER_M3_KM).
            const calc = computeRetase({
                formulaType: "PER_M3_KM",
                distanceKm: Number(resolvedDistance),
                ritase: 1,
                volumeM3: Number(finalVolume),
                rateDtKecil: 0,
                rateDtBesar: 0,
                ratePerKm: 0,
                ratePerM3Km: Number(resolvedRate),
                rateFlatRit: 0,
            })
            calculatedRetase = calc.amount
        }
    }

    const finalBon = (customNoBon && customNoBon.length > 0) ? customNoBon : `SC-TRF-${Date.now().toString().slice(-6)}`
    const finalNotes = customNotes
        ? `${customNotes} (Ref SC: ${materialOut.notes || "-"})`
        : `Transfer dari Stone Crusher (${materialOut.notes || "Internal SC Transfer"})`

    // Catat stok masuk agregat di Batching Plant beserta data armada & hak retase sopir di BP
    const incoming = await prisma.aggregateIncoming.create({
        data: {
            date: materialOut.report?.date ?? new Date(),
            no_bon: finalBon,
            driver_name: materialOut.driver_name || "Sopir Pengangkut",
            plate_number: materialOut.plate_number || "-",
            volume_cubic: finalVolume,
            aggregate_type: aggregateType,
            custom_material_name: aggregateType === "Other" ? materialOut.material_name : null,
            source_type: "Internal",
            supplier: materialOut.report?.location.name || "Stone Crusher Harapan",
            locationId: targetLoc,
            vehicleId: materialOut.vehicleId || null,
            driverId: materialOut.driverId || null,
            dump_truck_size: materialOut.dump_truck_size || null,
            distance_km: resolvedDistance,
            rate_price: resolvedRate,
            retase_amount: calculatedRetase,
            notes: finalNotes,
        },
    })

    await prisma.crusherMaterialOut.update({
        where: { id: materialOutId },
        data: {
            is_received_by_bp: true,
            receipt_status: "RECEIVED",
            aggregateIncomingId: incoming.id,
            receivedAt: new Date(),
            receivedById: session.user.id,
        },
    })

    revalidatePath("/crusher")
    revalidatePath("/crusher/material-keluar")
    revalidatePath("/admin/material-agregat")
    revalidatePath("/admin/retase")
    return { success: true, incomingId: incoming.id }
}

export async function getPendingCrusherTransfersForBP(bpLocationId: string) {
    const session = await auth()
    if (!session?.user) throw new Error("Unauthorized")

    return await prisma.crusherMaterialOut.findMany({
        where: {
            destination_type: "BATCHING_PLANT",
            targetLocationId: bpLocationId,
            is_received_by_bp: false,
        },
        include: {
            report: { select: { date: true, location: { select: { name: true } } } },
        },
        orderBy: { createdAt: "desc" },
    })
}

// ─── UNIVERSAL OPERATOR & HELPER WORK LOGS (SC & BATCHING PLANT) ──────

export async function getOperatorWorkLogs(filter: {
    date?: string
    locationId?: string
    role_type?: string
    month?: string
    is_paid?: boolean
}) {
    const session = await auth()
    if (!session?.user) throw new Error("Unauthorized")

    const where: any = {}
    if (filter.locationId && filter.locationId !== "ALL") {
        where.locationId = filter.locationId
    } else if (session.user.locationId && session.user.role !== "AdminLogistik" && !["CEO", "FVP"].includes(session.user.role || "")) {
        where.locationId = session.user.locationId
    }

    if (filter.date) {
        where.date = new Date(`${filter.date}T12:00:00.000Z`)
    } else if (filter.month) {
        const [year, month] = filter.month.split("-").map(Number)
        const start = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0))
        const end = new Date(Date.UTC(year, month, 0, 23, 59, 59))
        where.date = { gte: start, lte: end }
    }

    if (filter.role_type && filter.role_type !== "ALL") {
        where.role_type = filter.role_type
    }

    if (filter.is_paid !== undefined) {
        where.is_paid = filter.is_paid
    }

    const logs = await prisma.operatorWorkLog.findMany({
        where,
        include: {
            location: { select: { id: true, name: true } },
            employee: { select: { id: true, name: true, position: true } },
            vehicle: { select: { id: true, code: true, plate_number: true, meter_type: true } },
        },
        orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    })

    return logs.map((l) => ({
        id: l.id,
        date: l.date.toISOString().split("T")[0],
        locationId: l.locationId,
        locationName: l.location?.name,
        reportId: l.reportId,
        employeeId: l.employeeId,
        employee_name: l.employee_name || l.employee.name,
        role_type: l.role_type as any,
        vehicleId: l.vehicleId,
        vehicle_code: l.vehicle_code || l.vehicle?.code || l.vehicle?.plate_number,
        hm_start: l.hm_start,
        hm_end: l.hm_end,
        work_hours_normal: l.work_hours_normal,
        work_hours_overtime: l.work_hours_overtime,
        total_hours: l.total_hours,
        rate_normal: l.rate_normal,
        rate_overtime: l.rate_overtime,
        fee_normal: l.fee_normal,
        fee_overtime: l.fee_overtime,
        total_fee: l.total_fee,
        incentiveRateId: l.incentiveRateId,
        is_paid: l.is_paid,
        paid_date: l.paid_date ? l.paid_date.toISOString() : null,
        notes: l.notes,
    }))
}

export async function addOperatorWorkLog(data: {
    date: string
    locationId: string
    reportId?: string
    employeeId: string
    role_type: string
    vehicleId?: string
    hm_start?: number
    hm_end?: number
    work_hours_normal: number
    work_hours_overtime: number
    rate_normal?: number
    rate_overtime?: number
    notes?: string
}) {
    const session = await auth()
    if (!session?.user?.id) throw new Error("Unauthorized")

    const employee = await prisma.employee.findUnique({
        where: { id: data.employeeId },
        select: { name: true, position: true },
    })
    if (!employee) throw new Error("Karyawan tidak ditemukan")

    let vehicleCode: string | null = null
    if (data.vehicleId) {
        const vehicle = await prisma.vehicle.findUnique({
            where: { id: data.vehicleId },
            select: { code: true, plate_number: true },
        })
        vehicleCode = vehicle?.code || vehicle?.plate_number || null
    }

    // B15: hormati nilai 0 yang dikirim eksplisit (0 = lembur tidak dibayar), hanya fallback ke master bila kosong.
    const hasNormal = data.rate_normal !== undefined && data.rate_normal !== null
    const hasOvertime = data.rate_overtime !== undefined && data.rate_overtime !== null
    let rateNormal = hasNormal ? Number(data.rate_normal) : 0
    let rateOvertime = hasOvertime ? Number(data.rate_overtime) : 0
    let matchedIncentiveId: string | null = null

    if (!hasNormal || !hasOvertime) {
        // B3: cari tarif spesifik cabang dulu, baru fallback universal (hindari NULLS FIRST).
        const masterRate =
            (await prisma.masterIncentiveRate.findFirst({
                where: {
                    kategori_peran: data.role_type,
                    isActive: true,
                    locationId: data.locationId,
                },
                orderBy: { effective_date: "desc" },
            })) ||
            (await prisma.masterIncentiveRate.findFirst({
                where: {
                    kategori_peran: data.role_type,
                    isActive: true,
                    locationId: null,
                },
                orderBy: { effective_date: "desc" },
            }))
        if (masterRate) {
            matchedIncentiveId = masterRate.id
            if (!hasNormal) rateNormal = Number(masterRate.tarif_utama) || 0
            if (!hasOvertime) rateOvertime = masterRate.tarif_sekunder ?? masterRate.tarif_utama
        }
    }

    const hoursNormal = Number(data.work_hours_normal) || 0
    const hoursOvertime = Number(data.work_hours_overtime) || 0
    const totalHours = hoursNormal + hoursOvertime
    const feeNormal = hoursNormal * rateNormal
    const feeOvertime = hoursOvertime * rateOvertime
    const totalFee = feeNormal + feeOvertime

    const dateMidday = new Date(`${data.date}T12:00:00.000Z`)

    const log = await prisma.operatorWorkLog.create({
        data: {
            date: dateMidday,
            locationId: data.locationId,
            reportId: data.reportId || null,
            employeeId: data.employeeId,
            employee_name: employee.name,
            role_type: data.role_type,
            vehicleId: data.vehicleId || null,
            vehicle_code: vehicleCode,
            hm_start: data.hm_start !== undefined ? Number(data.hm_start) : null,
            hm_end: data.hm_end !== undefined ? Number(data.hm_end) : null,
            work_hours_normal: hoursNormal,
            work_hours_overtime: hoursOvertime,
            total_hours: totalHours,
            rate_normal: rateNormal,
            rate_overtime: rateOvertime,
            fee_normal: feeNormal,
            fee_overtime: feeOvertime,
            total_fee: totalFee,
            incentiveRateId: matchedIncentiveId,
            notes: data.notes || null,
            createdById: session.user.id,
        },
    })

    revalidatePath("/crusher")
    revalidatePath("/crusher/operator")
    return { success: true, id: log.id }
}

export async function deleteOperatorWorkLog(id: string) {
    const session = await auth()
    if (!session?.user) throw new Error("Unauthorized")

    await prisma.operatorWorkLog.delete({ where: { id } })
    revalidatePath("/crusher")
    revalidatePath("/crusher/operator")
    return { success: true }
}

export async function markOperatorWorkLogsPaid(ids: string[], paidDateStr?: string) {
    const session = await auth()
    if (!session?.user) throw new Error("Unauthorized")

    const paidDate = paidDateStr ? new Date(`${paidDateStr}T12:00:00.000Z`) : new Date()
    await prisma.operatorWorkLog.updateMany({
        where: { id: { in: ids } },
        data: {
            is_paid: true,
            paid_date: paidDate,
        },
    })

    revalidatePath("/crusher")
    revalidatePath("/crusher/operator")
    return { success: true }
}

export async function getLastMeterForVehicle(vehicleId: string) {
    const session = await auth()
    if (!session?.user) throw new Error("Unauthorized")

    const vehicle = await prisma.vehicle.findUnique({
        where: { id: vehicleId },
        select: { id: true, meter_type: true, plate_number: true, code: true },
    })
    if (!vehicle) return null

    const meterType = (vehicle.meter_type as "KM" | "HM") || "KM"

    // 1. Cek CrusherFuelLog terakhir
    const lastCrusher = await prisma.crusherFuelLog.findFirst({
        where: { vehicleId },
        orderBy: { createdAt: "desc" },
        select: { current_hm: true, current_km: true, createdAt: true },
    })

    // 2. Cek OperatorWorkLog terakhir
    const lastOp = await prisma.operatorWorkLog.findFirst({
        where: { vehicleId },
        orderBy: [{ date: "desc" }, { createdAt: "desc" }],
        select: { hm_end: true, date: true },
    })

    // 3. Cek VehicleFuelLog terakhir (BBM umum / Batching Plant)
    const lastVehicleFuel = await prisma.vehicleFuelLog.findFirst({
        where: { vehicleId },
        orderBy: [{ date: "desc" }, { createdAt: "desc" }],
        select: { current_meter: true, date: true, meter_type: true },
    })

    // 4. Cek RblExpense terakhir (BBM kas kecil / RBL)
    const lastRbl = await prisma.rblExpense.findFirst({
        where: { vehicleId, kmMeter: { not: null, gt: 0 } },
        orderBy: [{ date: "desc" }, { createdAt: "desc" }],
        select: { kmMeter: true, date: true },
    })

    // Kumpulkan kandidat HM
    const hmCandidates: Array<{ val: number; date?: Date | null; source: string }> = []
    if (lastOp?.hm_end && lastOp.hm_end > 0) {
        hmCandidates.push({ val: lastOp.hm_end, date: lastOp.date, source: "Laporan Operator" })
    }
    if (lastCrusher?.current_hm && lastCrusher.current_hm > 0) {
        hmCandidates.push({ val: lastCrusher.current_hm, date: lastCrusher.createdAt, source: "BBM Stone Crusher" })
    }
    if (lastVehicleFuel?.current_meter && lastVehicleFuel.current_meter > 0 && lastVehicleFuel.meter_type === "HM") {
        hmCandidates.push({ val: lastVehicleFuel.current_meter, date: lastVehicleFuel.date, source: "BBM Plant" })
    }

    // Kumpulkan kandidat KM
    const kmCandidates: Array<{ val: number; date?: Date | null; source: string }> = []
    if (lastCrusher?.current_km && lastCrusher.current_km > 0) {
        kmCandidates.push({ val: lastCrusher.current_km, date: lastCrusher.createdAt, source: "BBM Stone Crusher" })
    }
    if (lastVehicleFuel?.current_meter && lastVehicleFuel.current_meter > 0 && lastVehicleFuel.meter_type === "KM") {
        kmCandidates.push({ val: lastVehicleFuel.current_meter, date: lastVehicleFuel.date, source: "BBM Plant" })
    }
    if (lastRbl?.kmMeter && lastRbl.kmMeter > 0) {
        kmCandidates.push({ val: lastRbl.kmMeter, date: lastRbl.date, source: "RBL Kas Kecil" })
    }

    hmCandidates.sort((a, b) => b.val - a.val)
    kmCandidates.sort((a, b) => b.val - a.val)

    const topHm = hmCandidates[0] || null
    const topKm = kmCandidates[0] || null

    const primaryCandidate = meterType === "HM" ? topHm : topKm

    return {
        meter_type: meterType,
        last_hm: topHm?.val ?? null,
        last_km: topKm?.val ?? null,
        source: primaryCandidate?.source ?? "Riwayat Unit",
        date: primaryCandidate?.date ? primaryCandidate.date.toISOString().split("T")[0] : null,
    }
}

