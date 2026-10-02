import { format } from "date-fns"
import { id as idLocale } from "date-fns/locale"
import { toast } from "sonner"
import { IncomingMaterialItem } from "./types"

export const fmt = (n: number) =>
    "Rp " + new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 }).format(Math.round(n || 0))

export const fmtNum = (n: number, decimals: number = 2) =>
    new Intl.NumberFormat("id-ID", { maximumFractionDigits: decimals }).format(n || 0)

export const fmtDate = (d: any) =>
    d ? format(new Date(d), "dd/MM/yyyy", { locale: idLocale }) : "-"

export function exportMaterialReportToCSV({
    incomingList,
    startDate,
    endDate,
}: {
    incomingList: IncomingMaterialItem[]
    startDate: string
    endDate: string
}) {
    if (!incomingList || incomingList.length === 0) {
        toast.error("Tidak ada data material masuk untuk diekspor.")
        return
    }

    const headers = [
        "Tanggal",
        "No Surat Jalan / Bon",
        "Cabang / Plant",
        "Jenis Material",
        "Sumber Material",
        "Supplier / Quarry",
        "Nama Driver",
        "Plat Kendaraan",
        "Ukuran DT",
        "Jarak (KM)",
        "Volume (m3)",
        "Harga Pokok Satuan (Rp)",
        "Total Nilai Pokok (Rp)",
        "Ongkos Retase DT (Rp)",
        "Total Landed Cost (Rp)",
        "Landed Cost per m3 (Rp)",
        "Status Retase",
        "Catatan"
    ]

    const rows = incomingList.map((item: IncomingMaterialItem) => [
        `"${fmtDate(item.date)}"`,
        `"${item.no_bon}"`,
        `"${item.locationName}"`,
        `"${item.material_name}"`,
        `"${item.source_type === 'Internal' ? 'Quarry Sendiri' : 'Vendor Luar'}"`,
        `"${item.supplier}"`,
        `"${item.driver_name}"`,
        `"${item.plate_number}"`,
        `"${item.dump_truck_size}"`,
        item.distance_km || 0,
        item.volume_cubic,
        item.unit_price,
        item.material_cost,
        item.retase_cost,
        item.landed_cost,
        Math.round(item.landed_per_m3),
        `"${item.is_retase_paid ? 'Lunas' : 'Belum Lunas'}"`,
        `"${(item.notes || '').replace(/"/g, '""')}"`
    ])

    const csvContent =
        "data:text/csv;charset=utf-8," +
        [headers.join(","), ...rows.map((e: any[]) => e.join(","))].join("\n")
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", `Laporan_Biaya_Material_${startDate}_sd_${endDate}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success("Berhasil mengunduh laporan CSV.")
}
