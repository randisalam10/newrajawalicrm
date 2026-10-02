import { format } from "date-fns"
import { id as idLocale } from "date-fns/locale"
import { toast } from "sonner"
import { VehicleAnalyticsItem } from "./types"

export const fmt = (n: number) =>
    "Rp " + new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 }).format(Math.round(n || 0))

export const fmtNum = (n: number, decimals: number = 0) =>
    new Intl.NumberFormat("id-ID", { maximumFractionDigits: decimals }).format(n || 0)

export const fmtDate = (d: any) =>
    d ? format(new Date(d), "dd/MM/yyyy", { locale: idLocale }) : "-"

export const getCategoryBadgeClass = (name: string = "") => {
    const lower = name.toLowerCase()
    if (lower.includes("mixer")) return "bg-blue-50 text-blue-700 border-blue-200"
    if (lower.includes("loader")) return "bg-orange-50 text-orange-700 border-orange-200"
    if (lower.includes("dump")) return "bg-emerald-50 text-emerald-700 border-emerald-200"
    if (lower.includes("pump")) return "bg-sky-50 text-sky-700 border-sky-200"
    if (lower.includes("operasional") || lower.includes("mobil")) return "bg-teal-50 text-teal-700 border-teal-200"
    if (lower.includes("genset") || lower.includes("berat")) return "bg-slate-100 text-slate-700 border-slate-200"
    if (lower.includes("motor")) return "bg-cyan-50 text-cyan-700 border-cyan-200"
    return "bg-indigo-50 text-indigo-700 border-indigo-200"
}

export function exportVehicleReportToCSV({
    vehicleAnalytics,
    activeLocationName,
    startDate,
    endDate,
}: {
    vehicleAnalytics: VehicleAnalyticsItem[]
    activeLocationName: string
    startDate?: string
    endDate?: string
}) {
    if (!vehicleAnalytics || vehicleAnalytics.length === 0) {
        toast.error("Tidak ada data armada untuk diekspor.")
        return
    }

    const headers = [
        "No",
        "Kode Unit",
        "No. Plat",
        "Kategori Kendaraan",
        "Tipe Produksi",
        "Unit Sewa",
        "Cabang Pangkalan",
        "Total Solar (Liter)",
        "Biaya Solar (Rp)",
        "Biaya Pelumas/Oli (Rp)",
        "Biaya Lain-lain (Rp)",
        "Total Biaya RBL (Rp)",
        "Biaya Sparepart PO (Rp)",
        "Grand Total TCO (Rp)",
        "Pendapatan Sewa (Rp)",
        "Profit Bersih Unit (Rp)",
        "KM Awal",
        "KM Akhir",
        "Jarak Tempuh (KM)",
        "Total Ritase",
        "Total Volume Cor (m3)",
        "Konsumsi BBM / m3 (L/m3)",
        "Biaya / Ritase (Rp)",
        "Biaya / m3 (Rp)"
    ]

    const rows = vehicleAnalytics.map((va: VehicleAnalyticsItem, idx: number) => {
        const v = va.vehicle
        const s = va.stats
        const categoryName = v.category?.name || v.vehicle_type || "-"
        return [
            idx + 1,
            `"${v.code}"`,
            `"${v.plate_number}"`,
            `"${categoryName}"`,
            `"${v.vehicle_type}"`,
            `"${v.is_for_rent ? "Ya (Sewa)" : "Operasional"}"`,
            `"${v.location?.name || "-"}"`,
            s.fuelLiters,
            s.fuelCost,
            s.lubricantCost,
            s.otherCost,
            s.totalCost,
            s.sparepartCost || 0,
            s.grandTotalCost || s.totalCost,
            s.rentalRevenue || 0,
            s.netProfit || 0,
            s.minKm ?? "-",
            s.maxKm ?? "-",
            s.kmDistance,
            s.totalTrips,
            s.totalVolume,
            s.fuelPerCubic > 0 ? s.fuelPerCubic.toFixed(2) : "-",
            Math.round(s.costPerTrip),
            Math.round(s.costPerCubic)
        ]
    })

    const csvContent = "\uFEFF" + [
        `"LAPORAN REKAPITULASI KENDARAAN & OPERASIONAL ARMADA"`,
        `"Cabang: ${activeLocationName}"`,
        `"Periode: ${startDate ? fmtDate(startDate) : "Awal"} s/d ${endDate ? fmtDate(endDate) : "Sekarang"}"`,
        `"Tanggal Cetak: ${format(new Date(), "dd/MM/yyyy HH:mm")}"`,
        "",
        headers.join(","),
        ...rows.map((r: any) => r.join(","))
    ].join("\r\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.setAttribute("download", `Laporan_Armada_${format(new Date(), "yyyyMMdd")}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    toast.success("File rekap armada Excel/CSV berhasil diunduh.")
}
