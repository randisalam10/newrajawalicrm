import { AggregateCombinedRow } from "../columns"

export const MATERIAL_COLORS: Record<string, string> = {
    SplitHalfOne: "bg-amber-50 text-amber-800 ring-1 ring-amber-600/30 border-amber-200",
    SplitTwoThree: "bg-rose-50 text-rose-800 ring-1 ring-rose-600/30 border-rose-200",
    Pasir: "bg-yellow-50 text-yellow-800 ring-1 ring-yellow-600/30 border-yellow-200",
    AbuBatu: "bg-purple-50 text-purple-800 ring-1 ring-purple-600/30 border-purple-200",
    Semen: "bg-stone-100 text-stone-800 ring-1 ring-stone-600/30 border-stone-200",
    Other: "bg-slate-100 text-slate-800 ring-1 ring-slate-600/20 border-slate-200",
}

export function exportAggregateCSV(combinedData: AggregateCombinedRow[], toast: (options: { title: string; description: string; variant?: "default" | "destructive" }) => void) {
    if (combinedData.length === 0) {
        return toast({ title: "Data Kosong", description: "Tidak ada data untuk diekspor." })
    }

    const headers = [
        "Tanggal",
        "Arah",
        "Cabang",
        "Jenis Material",
        "Kategori / Sumber",
        "No Bon / Surat Jalan",
        "Pihak / Rekanan",
        "Armada & Sopir",
        "Volume",
        "Satuan",
        "Info Finansial",
        "Catatan",
    ]

    const rows = combinedData.map((row) => [
        `"${row.date}"`,
        `"${row.direction === "IN" ? "MASUK" : "KELUAR"}"`,
        `"${row.locationName}"`,
        `"${row.aggregateLabel}"`,
        `"${row.categoryOrSource}"`,
        `"${row.no_bon}"`,
        `"${row.party}"`,
        `"${row.vehicleInfo}"`,
        `"${row.volume}"`,
        `"${row.unit}"`,
        `"${row.financialInfo || '-'}"`,
        `"${(row.notes || "").replace(/"/g, '""')}"`,
    ])

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers.join(","), ...rows.map(r => r.join(","))].join("\n")
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", `Mutasi_Material_Agregat_${new Date().toISOString().split("T")[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    toast({ title: "Ekspor Berhasil", description: "File CSV mutasi material berhasil diunduh." })
}
