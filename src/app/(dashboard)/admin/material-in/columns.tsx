"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Edit, Trash2 } from "lucide-react"

export type MaterialInRow = {
    id: string
    date: string
    name: string
    supplier: string
    tonnage: number
    delivery_note: string
    locationName: string
    locationId: string
    unit_price?: number
    total_price?: number
    purchase_unit?: string
    purchase_qty?: number
    purchaseOrderId?: string | null
    poNumber?: string | null
    poItemId?: string | null
}

export type LedgerRow = {
    id: string
    formattedDate: string
    type: "IN" | "OUT"
    description: string
    reference: string
    qty_in: number
    qty_out: number
    balance: number
    locationName: string
}

const fmtRupiah = (n?: number) => "Rp " + new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 }).format(n || 0)

export const getIncomingColumns = (userRole: string, onEdit: (row: MaterialInRow) => void, onDelete: (row: MaterialInRow) => void): ColumnDef<MaterialInRow>[] => [
    {
        accessorKey: "date",
        header: "Tanggal",
    },
    ...(userRole === "SuperAdminBP" ? [{
        accessorKey: "locationName",
        header: "Cabang",
        cell: ({ row }: any) => {
            return (
                <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                    {row.original.locationName}
                </span>
            )
        },
    }] : []),
    {
        accessorKey: "name",
        header: "Nama Semen",
        cell: ({ row }) => (
            <div>
                <div className="font-medium text-slate-800">{row.original.name}</div>
                {row.original.poNumber ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-mono font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-1.5 py-0.2 rounded mt-0.5">
                        PO: {row.original.poNumber}
                    </span>
                ) : (
                    <span className="inline-flex items-center text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded mt-0.5">
                        Manual
                    </span>
                )}
            </div>
        ),
    },
    {
        accessorKey: "supplier",
        header: "Distributor",
    },
    {
        accessorKey: "tonnage",
        header: "Jumlah (KG)",
        cell: ({ row }) => {
            const u = row.original.purchase_unit
            let uLabel = u?.replace('_', ' ') || ""
            if (u === "KAPSUL") uLabel = "Kapsul"
            else if (u === "TON") uLabel = "Ton"
            else if (u === "ZAK_50") uLabel = "Zak (50kg)"
            else if (u === "ZAK_40") uLabel = "Zak (40kg)"

            return (
                <div>
                    <div className="font-bold font-mono text-slate-900">{row.original.tonnage.toLocaleString('id-ID')} KG</div>
                    {row.original.purchase_qty && u && u !== "KG" && (
                        <div className="text-[10px] text-slate-500 font-mono">
                            ({row.original.purchase_qty} {uLabel})
                        </div>
                    )}
                </div>
            )
        },
    },
    {
        accessorKey: "unit_price",
        header: "Harga Satuan",
        cell: ({ row }) => {
            const up = row.original.unit_price
            const u = row.original.purchase_unit
            if (!up) return <div className="text-slate-400 text-xs">-</div>

            let unitLabel = ""
            if (u === "KAPSUL") unitLabel = "/ Kapsul"
            else if (u === "TON") unitLabel = "/ Ton"
            else if (u === "ZAK_50" || u === "ZAK_40") unitLabel = "/ Zak"
            else if (u === "KG") unitLabel = "/ KG"

            const effKg = row.original.tonnage > 0 && row.original.total_price 
                ? Math.round((row.original.total_price / row.original.tonnage) * 10) / 10
                : null

            return (
                <div>
                    <div className="font-mono text-xs text-slate-800">
                        {fmtRupiah(up)} <span className="text-[10px] text-slate-400 font-sans">{unitLabel}</span>
                    </div>
                    {effKg && u !== "KG" && (
                        <div className="text-[10px] font-mono text-blue-600 font-medium">
                            ~Rp {effKg.toLocaleString('id-ID')}/kg
                        </div>
                    )}
                </div>
            )
        },
    },
    {
        accessorKey: "total_price",
        header: "Total Nilai",
        cell: ({ row }) => (
            <div className="font-mono text-xs font-semibold text-slate-900">
                {row.original.total_price ? fmtRupiah(row.original.total_price) : "-"}
            </div>
        ),
    },
    {
        accessorKey: "delivery_note",
        header: "No Bon / Surat Jalan",
    },
    {
        id: "actions",
        header: "Aksi",
        cell: ({ row }) => {
            return (
                <div className="flex items-center justify-end gap-2">
                    <Button variant="ghost" size="icon" onClick={() => onEdit(row.original)}>
                        <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => onDelete(row.original)}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                </div>
            )
        },
    }
]

export const getLedgerColumns = (userRole: string): ColumnDef<LedgerRow>[] => [
    {
        accessorKey: "formattedDate",
        header: "Tanggal / Jam",
        cell: ({ row }) => <div className="whitespace-nowrap">{row.original.formattedDate}</div>,
    },
    ...(userRole === "SuperAdminBP" ? [{
        accessorKey: "locationName",
        header: "Cabang",
        cell: ({ row }: any) => {
            return (
                <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10 whitespace-nowrap">
                    {row.original.locationName}
                </span>
            )
        },
    }] : []),
    {
        accessorKey: "type",
        header: "Tipe",
        cell: ({ row }) => {
            const isOut = row.original.type === "OUT"
            return (
                <Badge variant={isOut ? "destructive" : "default"}>
                    {isOut ? "PRODUKSI (OUT)" : "MASUK (IN)"}
                </Badge>
            )
        },
    },
    {
        accessorKey: "description",
        header: "Keterangan",
        cell: ({ row }) => <div className="font-medium max-w-[250px] truncate">{row.original.description}</div>,
    },
    {
        accessorKey: "reference",
        header: "Referensi",
        cell: ({ row }) => <div className="text-muted-foreground">{row.original.reference}</div>,
    },
    {
        accessorKey: "qty_in",
        header: "MASUK (KG)",
        cell: ({ row }) => {
            const val = row.original.qty_in
            return val > 0 ? <div className="font-bold text-green-600">+{val.toLocaleString('id-ID')}</div> : <div className="text-slate-300">-</div>
        },
    },
    {
        accessorKey: "qty_out",
        header: "KELUAR (KG)",
        cell: ({ row }) => {
            const val = row.original.qty_out
            return val > 0 ? <div className="font-bold text-red-600">-{val.toLocaleString('id-ID', { maximumFractionDigits: 1 })}</div> : <div className="text-slate-300">-</div>
        },
    },
    {
        accessorKey: "balance",
        header: "STOK (KG)",
        cell: ({ row }) => <div className="font-bold text-slate-900 border-l-2 pl-2 border-slate-300">{row.original.balance.toLocaleString('id-ID', { maximumFractionDigits: 1 })}</div>,
    },
]
