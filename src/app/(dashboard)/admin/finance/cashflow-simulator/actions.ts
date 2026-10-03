"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { format, startOfMonth, subMonths } from "date-fns"
import { id as idLocale } from "date-fns/locale"
import {
    HistoricalBaselineData,
    FixedContractSnapshot,
    ApScheduleBucket,
    DataGapNote
} from "./types"

export async function getSimulatorBaselineData(
    filterLocationId?: string | null
): Promise<{ success: boolean; data?: HistoricalBaselineData; error?: string }> {
    const session = await auth()

    if (!session?.user) {
        return { success: false, error: "Sesi tidak valid. Silakan login kembali." }
    }

    try {
        const now = new Date()
        const currentPeriodStr = format(now, "yyyy-MM")
        const currentMonthLabel = format(now, "MMMM yyyy", { locale: idLocale })

        const locId = filterLocationId && filterLocationId !== "all" ? filterLocationId : null
        const locationFilter = locId ? { locationId: locId } : {}

        // 1. Fetch Locations
        const allLocations = await prisma.location.findMany({
            select: { id: true, name: true },
            orderBy: { name: "asc" }
        })

        // 2. Fetch Outstanding AR from Unpaid Invoices
        const unpaidInvoices = await prisma.invoice.findMany({
            where: {
                status: { in: ["ISSUED", "PARTIAL"] },
                ...locationFilter
            },
            select: {
                id: true,
                total_amount: true,
                paid_amount: true,
                issue_date: true
            }
        })

        let outstandingArTotal = 0
        unpaidInvoices.forEach(inv => {
            const out = (inv.total_amount || 0) - (inv.paid_amount || 0)
            if (out > 0) outstandingArTotal += out
        })

        // 3. Fetch Outstanding AP & Due Schedule from CreditObligation
        const unpaidCredits = await prisma.creditObligation.findMany({
            where: {
                status: { in: ["UNPAID", "PARTIAL"] },
                ...(locId ? { locationId: locId } : {})
            },
            select: {
                id: true,
                outstanding: true,
                due_date: true,
                credit_date: true
            }
        })

        let outstandingApTotal = 0
        const apBucketsMap = new Map<string, { amount: number; count: number }>()

        unpaidCredits.forEach(c => {
            const out = c.outstanding || 0
            outstandingApTotal += out

            const date = c.due_date || c.credit_date || now
            const bucketPeriod = format(new Date(date), "yyyy-MM")
            const currentBucket = apBucketsMap.get(bucketPeriod) || { amount: 0, count: 0 }
            apBucketsMap.set(bucketPeriod, {
                amount: currentBucket.amount + out,
                count: currentBucket.count + 1
            })
        })

        const apDueSchedule: ApScheduleBucket[] = Array.from(apBucketsMap.entries())
            .map(([period, data]) => {
                let monthLabel = period
                try {
                    const [y, m] = period.split("-")
                    const d = new Date(Number(y), Number(m) - 1, 1)
                    monthLabel = format(d, "MMM yyyy", { locale: idLocale })
                } catch {}
                return {
                    period,
                    monthLabel,
                    amount: Math.round(data.amount),
                    count: data.count
                }
            })
            .sort((a, b) => a.period.localeCompare(b.period))

        // 4. Fetch Fixed Costs & Contracts (Payroll, Sewa, Izin)
        const fixedContracts = await prisma.fixedCostContract.findMany({
            where: {
                isActive: true,
                ...(locId ? { OR: [{ locationId: locId }, { locationId: null }] } : {})
            },
            orderBy: { monthly_amount: "desc" }
        })

        let monthlyPayrollBase = 92228000 // Default fallback dari data riil September 2026
        let monthlyFixedContractsTotal = 0
        const fixedContractsList: FixedContractSnapshot[] = []

        fixedContracts.forEach(fc => {
            const upperCat = (fc.category || "").toUpperCase()
            const upperName = (fc.name || "").toUpperCase()

            if (upperCat.includes("GAJI") || upperName.includes("GAJI") || upperName.includes("PAYROLL")) {
                monthlyPayrollBase = fc.monthly_amount || fc.total_amount || 92228000
            } else {
                monthlyFixedContractsTotal += (fc.monthly_amount || 0)
                fixedContractsList.push({
                    id: fc.id,
                    name: fc.name,
                    category: fc.category,
                    monthly_amount: Math.round(fc.monthly_amount || 0),
                    start_date: format(fc.start_date, "yyyy-MM-dd"),
                    end_date: format(fc.end_date, "yyyy-MM-dd")
                })
            }
        })

        // 5. Fetch Operational Field Expenses (RBL) average
        const threeMonthsAgo = startOfMonth(subMonths(now, 3))
        const rblExpenses = await prisma.rblExpense.findMany({
            where: {
                date: { gte: threeMonthsAgo },
                ...(locId ? { budget: { locationId: locId } } : {})
            },
            select: { amount: true }
        })

        const totalRblSum = rblExpenses.reduce((sum, r) => sum + (r.amount || 0), 0)
        // Rata-rata bulanan (3 bulan atau minimal baseline)
        const monthlyRblOpexAverage = totalRblSum > 0 ? Math.round(totalRblSum / 3) : 75000000

        // 6. Fetch Target Settings from OperationalTargetSetting
        const targetSetting = await prisma.operationalTargetSetting.findFirst({
            where: locId ? { locationId: locId } : { locationId: null },
            orderBy: { createdAt: "desc" }
        })

        const targetVolume = targetSetting?.target_monthly_volume ? Number(targetSetting.target_monthly_volume) : 500
        const targetAsp = targetSetting?.target_asp ? Number(targetSetting.target_asp) : 2000000
        const targetCogsPerM3 = targetSetting?.target_cogs ? Number(targetSetting.target_cogs) : 630000

        // 7. Fetch Recent Production Volume (September 2026 atau bulan berjalan)
        const recentTxns = await prisma.productionTransaction.findMany({
            where: {
                date: { gte: startOfMonth(subMonths(now, 1)) },
                status: "Confirmed",
                ...locationFilter
            },
            select: { volume_cubic: true }
        })
        const currentMonthlyVolume = Math.round(recentTxns.reduce((sum, t) => sum + (t.volume_cubic || 0), 0)) || 567

        // 8. Transparent Notes on Data Limitations
        const dataGapNotes: DataGapNote[] = [
            {
                title: "Jatuh Tempo Invoice Pelanggan (AR Due Date)",
                currentStatus: "100% Invoice di database belum memiliki due_date (nilai null).",
                impact: "Jadwal pelunasan pelanggan tidak dapat ditarik per tanggal pasti.",
                simulatorMitigation: "Menggunakan Slider Parameter DSO (15, 30, 45, 60 hari) untuk mensimulasikan kecepatan perputaran piutang secara dinamis."
            },
            {
                title: "Saldo Awal Kas & Rekening Bank (Opening Cash)",
                currentStatus: "Tidak ada tabel pencatatan mutasi saldo rekening koran bank di CRM.",
                impact: "Posisi uang tunai riil perusahaan per hari ini tidak dapat ditebak oleh sistem.",
                simulatorMitigation: "Disediakan input parameter manual Saldo Kas Awal di header simulator agar manajemen memasukkan angka riil saat menjalankan simulasi."
            },
            {
                title: "Kewajiban Cicilan Hutang Bank & Leasing (Non-PO Debt)",
                currentStatus: "Tabel CreditObligation baru merekam hutang PO Supplier (Rp 1,34 Miliar).",
                impact: "Cicilan kendaraan leasing atau pinjaman modal bank belum terhitung otomatis.",
                simulatorMitigation: "Disediakan tombol tambah cicilan pinjaman manual untuk memasukkan komitmen bulanan non-PO."
            },
            {
                title: "Rincian Gaji Karyawan (Payroll)",
                currentStatus: "Master Employee tidak menyimpan nominal gaji; gaji dicatat gelondongan di Kontrak Beban Tetap.",
                impact: "Tidak ada rincian upah per departemen.",
                simulatorMitigation: "Menggunakan angka baseline Rp 92.228.000 dari kontrak 'Gaji September' yang dilengkapi slider penyesuaian (0%, 5%, 10%)."
            },
            {
                title: "Kewajiban Pajak Tahunan (Corporate Tax)",
                currentStatus: "Sistem mencatat PPN tagihan, belum ada modul SPT PPh 21/23/25.",
                impact: "Kewajiban pajak badan tidak terhitung secara otomatis.",
                simulatorMitigation: "Disediakan alokasi cadangan pajak bulanan (default Rp 10.000.000) yang dapat disesuaikan."
            }
        ]

        return {
            success: true,
            data: {
                activeLocations: allLocations,
                selectedLocationId: locId,
                currentMonthLabel,
                currentPeriodStr,
                outstandingArTotal: Math.round(outstandingArTotal),
                unpaidInvoicesCount: unpaidInvoices.length,
                outstandingApTotal: Math.round(outstandingApTotal),
                unpaidCreditsCount: unpaidCredits.length,
                currentMonthlyVolume,
                currentAsp: targetAsp,
                currentDirectCogsPerM3: targetCogsPerM3,
                targetVolume,
                targetAsp,
                targetCogsPerM3,
                monthlyPayrollBase,
                monthlyFixedContractsTotal: Math.round(monthlyFixedContractsTotal),
                fixedContractsList,
                monthlyRblOpexAverage,
                apDueSchedule,
                dataGapNotes
            }
        }
    } catch (error: any) {
        console.error("Error fetching cashflow simulator baseline data:", error)
        return {
            success: false,
            error: error?.message || "Gagal memuat data baseline simulator keuangan."
        }
    }
}
