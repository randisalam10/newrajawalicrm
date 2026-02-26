"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"

export type UsageRow = {
    id: string
    date: string
    vehicleCode: string
    driverName: string
    customerName: string
    mutuName: string
    volume: number
    semen: number
    pasir: number
    batu05: number
    batu12: number
    batu23: number
    locationName: string
}

export const getUsageColumns = (userRole: string): ColumnDef<UsageRow>[] => [
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
        accessorKey: "customerName",
        header: "Customer",
        cell: ({ row }) => <div className="font-medium">{row.original.customerName}</div>,
    },
    {
        accessorKey: "mutuName",
        header: "Mutu",
        cell: ({ row }) => <Badge variant="outline">{row.original.mutuName}</Badge>,
    },
    {
        accessorKey: "volume",
        header: "Vol (m³)",
        cell: ({ row }) => <div className="font-bold">{row.original.volume.toFixed(1)}</div>,
    },
    {
        accessorKey: "semen",
        header: "Semen (kg)",
        cell: ({ row }) => <div>{row.original.semen.toFixed(2)}</div>,
    },
    {
        accessorKey: "pasir",
        header: "Pasir (kg)",
        cell: ({ row }) => <div>{row.original.pasir.toFixed(2)}</div>,
    },
    {
        accessorKey: "batu05",
        header: "Batu 0.5 (kg)",
        cell: ({ row }) => <div>{row.original.batu05.toFixed(2)}</div>,
    },
    {
        accessorKey: "batu12",
        header: "Batu 1-2 (kg)",
        cell: ({ row }) => <div>{row.original.batu12.toFixed(2)}</div>,
    },
    {
        accessorKey: "batu23",
        header: "Batu 2-3 (kg)",
        cell: ({ row }) => <div>{row.original.batu23.toFixed(2)}</div>,
    },
]
