import { format } from "date-fns"
import { isDirectCogsCategory } from "./cogs-service"

export interface OverheadCalculationParams {
    rblBudgets: any[]
    rblExpensesAll: any[]
    activeFixedContracts: any[]
    activeVehicles: any[]
    monthStart: Date
    monthEnd: Date
}

export function calculateOverheadAndAmortization(params: OverheadCalculationParams) {
    const {
        rblBudgets,
        rblExpensesAll,
        activeFixedContracts,
        activeVehicles,
    } = params

    // 1. RBL Opex (Pemisahan Beban Langsung vs Overhead Murni)
    let rblBbmDirect = 0
    let rblMaintenanceDirect = 0
    let pureOverheadOpex = 0

    const rblCategoryBreakdown: Record<string, { name: string; count: number; total: number; notes: string }> = {}
    const pureOverheadCategoryBreakdown: Record<string, { name: string; count: number; total: number; notes: string }> = {}

    rblExpensesAll.forEach(e => {
        const cat = (e.category || "").toLowerCase()
        const ref = (e.categoryRef?.name || "").toLowerCase()
        const catId = e.categoryId || ""
        const isBbm = catId === "cat-bbm-solar" || cat.includes("bbm") || cat.includes("solar") || ref.includes("bbm") || ref.includes("solar")
        const isMnt = catId === "cat-pemeliharaan" || cat.includes("sparepart") || cat.includes("pemeliharaan") || cat.includes("servis") || cat.includes("bengkel") || ref.includes("sparepart") || ref.includes("pemeliharaan") || ref.includes("servis") || ref.includes("bengkel")

        const catName = e.categoryRef?.name || e.category || "Operasional Umum"

        if (!rblCategoryBreakdown[catName]) {
            rblCategoryBreakdown[catName] = { name: catName, count: 0, total: 0, notes: e.notes || "-" }
        }
        rblCategoryBreakdown[catName].count++
        rblCategoryBreakdown[catName].total += e.amount

        if (isBbm) {
            rblBbmDirect += (e.amount || 0)
        } else if (isMnt) {
            rblMaintenanceDirect += (e.amount || 0)
        } else {
            pureOverheadOpex += (e.amount || 0)
            if (!pureOverheadCategoryBreakdown[catName]) {
                pureOverheadCategoryBreakdown[catName] = { name: catName, count: 0, total: 0, notes: e.notes || "-" }
            }
            pureOverheadCategoryBreakdown[catName].count++
            pureOverheadCategoryBreakdown[catName].total += e.amount
        }
    })

    const totalRblCashDisbursement = rblExpensesAll.reduce((s, e) => s + (e.amount || 0), 0)
    const totalRblBudgetPlafon = rblBudgets.reduce((s, b) => s + (b.amount || 0), 0)
    const sisaKasRbl = totalRblBudgetPlafon - totalRblCashDisbursement
    const totalRblOpex = pureOverheadOpex // Seksi D overhead murni (beban operasional non-COGS)

    // 2. Fixed Cost Contracts (Hanya Beban Tetap & Amortisasi; Biaya Pokok Langsung dialokasikan ke Seksi B)
    let totalSewaTanahCost = 0
    let totalSewaMessCost = 0
    let totalPerizinanCost = 0
    let totalGajiCost = 0
    let totalAsuransiRetribusiCost = 0
    let totalFixedVehicleComplianceCost = 0
    let totalFixedKirCost = 0
    let totalFixedTaxCost = 0

    activeFixedContracts.forEach((c: any) => {
        const cat = (c.category || "").toUpperCase()
        const name = (c.name || "").toUpperCase()

        if (isDirectCogsCategory(c.category) || cat === "GAJI_KARYAWAN" || name.includes("GAJI") || name.includes("UPAH") || name.includes("SALARY")) {
            // Abaikan biaya pokok langsung & gaji karyawan agar tidak terhitung di Seksi D (dialokasikan ke Seksi B COGS)
            return
        }
        const m = c.monthly_amount || 0

        if (cat === "SEWA_TANAH") {
            totalSewaTanahCost += m
        } else if (cat === "SEWA_MESS") {
            totalSewaMessCost += m
        } else if (cat === "PAJAK_KIR" || name.includes("KIR") || name.includes("STNK") || name.includes("PAJAK ARMADA") || name.includes("PAJAK KENDARAAN")) {
            totalFixedVehicleComplianceCost += m
            if (name.includes("STNK") || (name.includes("PAJAK") && !name.includes("KIR"))) {
                totalFixedTaxCost += m
            } else {
                totalFixedKirCost += m
            }
        } else if (cat === "PERIZINAN") {
            totalPerizinanCost += m
        } else {
            totalAsuransiRetribusiCost += m
        }
    })
    const totalFixedContractMonthly = totalSewaTanahCost + totalSewaMessCost + totalPerizinanCost + totalAsuransiRetribusiCost

    // 3. Vehicle Compliance (Pajak STNK & KIR)
    let totalMonthlyVehicleTax = 0
    let totalMonthlyVehicleKir = 0
    const vehicleComplianceDetails: any[] = []

    activeVehicles.forEach((v: any) => {
        const activeTaxRecord = v.complianceRecords?.find((r: any) => r.type === "PAJAK_STNK")
        const activeKirRecord = v.complianceRecords?.find((r: any) => r.type === "UJI_KIR")

        // Tax
        let monthlyTax = 0
        let annualTax = 0
        let taxSource = "NONE"
        let taxExpiry = v.tax_expiry_date ? format(new Date(v.tax_expiry_date), "dd/MM/yyyy") : "-"

        if (activeTaxRecord) {
            annualTax = activeTaxRecord.cost
            monthlyTax = activeTaxRecord.monthly_amount || Math.round(activeTaxRecord.cost / (activeTaxRecord.period_months || 12))
            taxSource = "TERCATAT_RIWAYAT"
            taxExpiry = format(new Date(activeTaxRecord.valid_until), "dd/MM/yyyy")
        } else if (v.annual_tax_cost && v.annual_tax_cost > 0) {
            annualTax = v.annual_tax_cost
            monthlyTax = Math.round(v.annual_tax_cost / 12)
            taxSource = "ESTIMASI_MASTER"
        }

        // KIR
        let monthlyKir = 0
        let kirCost = 0
        let kirPeriod = v.kir_period_months || 6
        let kirSource = "NONE"
        let kirExpiry = v.kir_expiry_date ? format(new Date(v.kir_expiry_date), "dd/MM/yyyy") : "-"

        if (activeKirRecord) {
            kirCost = activeKirRecord.cost
            kirPeriod = activeKirRecord.period_months || 6
            monthlyKir = activeKirRecord.monthly_amount || Math.round(activeKirRecord.cost / kirPeriod)
            kirSource = "TERCATAT_RIWAYAT"
            kirExpiry = format(new Date(activeKirRecord.valid_until), "dd/MM/yyyy")
        } else if (v.kir_cost && v.kir_cost > 0) {
            kirCost = v.kir_cost
            monthlyKir = Math.round(v.kir_cost / kirPeriod)
            kirSource = "ESTIMASI_MASTER"
        }

        totalMonthlyVehicleTax += monthlyTax
        totalMonthlyVehicleKir += monthlyKir

        if (monthlyTax > 0 || monthlyKir > 0) {
            vehicleComplianceDetails.push({
                id: v.id,
                code: v.code,
                plate: v.plate_number,
                category: v.category?.name || v.vehicle_type,
                annualTax,
                monthlyTax,
                taxExpiry,
                taxSource,
                kirCost,
                kirPeriodMonths: kirPeriod,
                monthlyKir,
                kirExpiry,
                kirSource,
                totalMonthly: monthlyTax + monthlyKir,
                hasHistory: !!(activeTaxRecord || activeKirRecord)
            })
        }
    })

    // Tambahkan beban kepatuhan armada dari Kontrak Beban Tetap (KIR / STNK)
    totalMonthlyVehicleTax += totalFixedTaxCost
    totalMonthlyVehicleKir += totalFixedKirCost

    activeFixedContracts.filter((c: any) => {
        const cat = (c.category || "").toUpperCase()
        const name = (c.name || "").toUpperCase()
        return cat === "PAJAK_KIR" || name.includes("KIR") || name.includes("STNK") || name.includes("PAJAK ARMADA") || name.includes("PAJAK KENDARAAN")
    }).forEach((c: any) => {
        const name = (c.name || "").toUpperCase()
        const isTax = name.includes("STNK") || (name.includes("PAJAK") && !name.includes("KIR"))
        const isKir = !isTax
        vehicleComplianceDetails.push({
            id: c.id,
            code: "KONTRAK",
            plate: c.name,
            category: "Kontrak Master Beban Tetap",
            annualTax: isTax ? (c.total_amount || 0) : 0,
            monthlyTax: isTax ? (c.monthly_amount || 0) : 0,
            taxExpiry: c.end_date ? format(new Date(c.end_date), "dd/MM/yyyy") : "-",
            taxSource: "KONTRAK_TETAP",
            kirCost: isKir ? (c.total_amount || 0) : 0,
            kirPeriodMonths: c.duration_months || 6,
            monthlyKir: isKir ? (c.monthly_amount || 0) : 0,
            kirExpiry: c.end_date ? format(new Date(c.end_date), "dd/MM/yyyy") : "-",
            kirSource: "KONTRAK_TETAP",
            totalMonthly: c.monthly_amount || 0,
            hasHistory: true
        })
    })

    const totalVehicleComplianceMonthly = totalMonthlyVehicleTax + totalMonthlyVehicleKir
    const totalAmortizationMonthly = totalFixedContractMonthly + totalVehicleComplianceMonthly

    return {
        totalRblBudgetPlafon,
        totalRblOpex, // Beban Kas Cabang Murni (Overhead)
        pureOverheadOpex,
        totalRblCashDisbursement, // Total Kas Keluar Fisik RBL
        rblBbmDirect,
        rblMaintenanceDirect,
        sisaKasRbl,
        rblCategoryBreakdown,
        pureOverheadCategoryBreakdown,
        totalSewaTanahCost,
        totalSewaMessCost,
        totalPerizinanCost,
        totalGajiCost,
        totalAsuransiRetribusiCost,
        totalFixedContractMonthly,
        totalMonthlyVehicleTax,
        totalMonthlyVehicleKir,
        totalVehicleComplianceMonthly,
        totalAmortizationMonthly,
        vehicleComplianceDetails
    }
}
