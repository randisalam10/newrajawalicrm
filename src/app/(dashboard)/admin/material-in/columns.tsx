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
        cell: ({ row }) => <div className="font-medium text-slate-800">{row.original.name}</div>,
    },
    {
        accessorKey: "supplier",
        header: "Distributor",
    },
    {
        accessorKey: "tonnage",
        header: "Jumlah (KG)",
        cell: ({ row }) => <div className="font-bold">{row.original.tonnage.toLocaleString('id-ID')}</div>,
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
