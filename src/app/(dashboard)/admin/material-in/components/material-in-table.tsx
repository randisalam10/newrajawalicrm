"use client"

import { useState, useMemo } from "react"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MaterialInRow, TracingFilterType } from "../types"
import {
    Search,
    ChevronLeft,
    ChevronRight,
    ArrowUpDown,
    ArrowUp,
    ArrowDown,
    Eye,
    Pencil,
    Trash2,
    ShieldCheck,
    FileText,
} from "lucide-react"

function formatRp(val?: number): string {
    return "Rp " + new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 }).format(val || 0)
}

function getUnitLabel(u?: string): string {
    if (!u) return ""
    if (u === "KAPSUL") return "Kapsul"
    if (u === "TON") return "Ton"
    if (u === "ZAK_50") return "Zak"
    if (u === "ZAK_40") return "Zak"
    if (u === "KG") return "KG"
    return u
}

interface MaterialInTableProps {
    data: MaterialInRow[]
    showCabang: boolean
    canManage: boolean
    onViewDetail: (item: MaterialInRow) => void
    onEdit: (item: MaterialInRow) => void
    onDelete: (item: MaterialInRow) => void
}

type SortField = "date" | "name" | "supplier" | "tonnage" | "total_price" | "locationName"

export function MaterialInTable({
    data,
    showCabang,
    canManage,
    onViewDetail,
    onEdit,
    onDelete,
}: MaterialInTableProps) {
    const [searchQuery, setSearchQuery] = useState("")
    const [sourceFilter, setSourceFilter] = useState<TracingFilterType>("ALL")
    const [locationFilter, setLocationFilter] = useState<string>("ALL")
    const [currentPage, setCurrentPage] = useState(1)
    const [sortField, setSortField] = useState<SortField>("date")
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
    const pageSize = 15

    // Unique locations for filter
    const availableLocations = useMemo(() => {
        const set = new Set<string>()
        data.forEach(item => {
            if (item.locationName && item.locationName !== "N/A") {
                set.add(item.locationName)
            }
        })
        return Array.from(set).sort()
    }, [data])

    // Filtered data
    const filteredData = useMemo(() => {
        return data.filter(item => {
            // Source filter
            if (sourceFilter === "PO" && !item.purchaseOrderId && !item.poNumber) return false
            if (sourceFilter === "MANUAL" && (item.purchaseOrderId || item.poNumber)) return false

            // Location filter
            if (locationFilter !== "ALL" && item.locationName !== locationFilter) return false

            // Search query
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase()
                const matchName = item.name.toLowerCase().includes(q)
                const matchSupplier = item.supplier.toLowerCase().includes(q)
                const matchNote = item.delivery_note.toLowerCase().includes(q)
                const matchPo = item.poNumber ? item.poNumber.toLowerCase().includes(q) : false
                const matchLocation = item.locationName.toLowerCase().includes(q)

                if (!matchName && !matchSupplier && !matchNote && !matchPo && !matchLocation) {
                    return false
                }
            }

            return true
        })
    }, [data, sourceFilter, locationFilter, searchQuery])

    // Sorted data
    const sortedData = useMemo(() => {
        return [...filteredData].sort((a, b) => {
            let aVal: any = a[sortField]
            let bVal: any = b[sortField]

            if (sortField === "date") {
                aVal = new Date(a.date).getTime()
                bVal = new Date(b.date).getTime()
            }

            if (aVal < bVal) return sortOrder === "asc" ? -1 : 1
            if (aVal > bVal) return sortOrder === "asc" ? 1 : -1
            return 0
        })
    }, [filteredData, sortField, sortOrder])

    // Pagination
    const totalPages = Math.ceil(sortedData.length / pageSize) || 1
    const paginatedData = useMemo(() => {
        const start = (currentPage - 1) * pageSize
        return sortedData.slice(start, start + pageSize)
    }, [sortedData, currentPage, pageSize])

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortOrder(prev => (prev === "asc" ? "desc" : "asc"))
        } else {
            setSortField(field)
            setSortOrder("desc")
        }
        setCurrentPage(1)
    }

    const renderSortIcon = (field: SortField) => {
        if (sortField !== field) return <ArrowUpDown className="h-3 w-3 text-slate-400 ml-1 inline" />
        return sortOrder === "asc" ? (
            <ArrowUp className="h-3 w-3 text-blue-600 ml-1 inline" />
        ) : (
            <ArrowDown className="h-3 w-3 text-blue-600 ml-1 inline" />
        )
    }

    return (
        <div className="space-y-3">
            {/* Filter Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 p-3 rounded-lg bg-slate-50/70 border border-slate-200/80">
                <div className="flex flex-1 flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    {/* Search Bar */}
                    <div className="relative flex-1 min-w-[240px]">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                        <Input
                            placeholder="Cari distributor, nama semen, no bon, no PO..."
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value)
                                setCurrentPage(1)
                            }}
                            className="pl-8 h-9 text-xs bg-white border-slate-200"
                        />
                    </div>

                    {/* Filter Sumber Tracing */}
                    <Select
                        value={sourceFilter}
                        onValueChange={(val: TracingFilterType) => {
                            setSourceFilter(val)
                            setCurrentPage(1)
                        }}
                    >
                        <SelectTrigger className="w-full sm:w-[170px] h-9 text-xs bg-white border-slate-200">
                            <SelectValue placeholder="Semua Sumber" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">Semua Sumber</SelectItem>
                            <SelectItem value="PO">Terhubung PO</SelectItem>
                            <SelectItem value="MANUAL">Input Manual</SelectItem>
                        </SelectContent>
                    </Select>

                    {/* Filter Cabang (jika SuperAdmin/Corp) */}
                    {showCabang && availableLocations.length > 1 && (
                        <Select
                            value={locationFilter}
                            onValueChange={(val) => {
                                setLocationFilter(val)
                                setCurrentPage(1)
                            }}
                        >
                            <SelectTrigger className="w-full sm:w-[150px] h-9 text-xs bg-white border-slate-200">
                                <SelectValue placeholder="Semua Cabang" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL">Semua Cabang</SelectItem>
                                {availableLocations.map(loc => (
                                    <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}
                </div>

                <div className="text-xs text-slate-500 font-medium whitespace-nowrap self-end sm:self-center">
                    Total: <strong className="text-slate-800 font-mono">{filteredData.length}</strong> data
                </div>
            </div>

            {/* Table Container */}
            <div className="rounded-lg border border-slate-200/80 bg-white overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-slate-50/80 hover:bg-slate-50/80 border-b border-slate-200">
                                <TableHead
                                    className="cursor-pointer select-none text-xs font-semibold text-slate-700 whitespace-nowrap"
                                    onClick={() => handleSort("date")}
                                >
                                    Tanggal {renderSortIcon("date")}
                                </TableHead>
                                {showCabang && (
                                    <TableHead
                                        className="cursor-pointer select-none text-xs font-semibold text-slate-700 whitespace-nowrap"
                                        onClick={() => handleSort("locationName")}
                                    >
                                        Cabang {renderSortIcon("locationName")}
                                    </TableHead>
                                )}
                                <TableHead
                                    className="cursor-pointer select-none text-xs font-semibold text-slate-700 whitespace-nowrap"
                                    onClick={() => handleSort("name")}
                                >
                                    Nama Semen & Tracing {renderSortIcon("name")}
                                </TableHead>
                                <TableHead
                                    className="cursor-pointer select-none text-xs font-semibold text-slate-700 whitespace-nowrap"
                                    onClick={() => handleSort("supplier")}
                                >
                                    Distributor {renderSortIcon("supplier")}
                                </TableHead>
                                <TableHead
                                    className="cursor-pointer select-none text-xs font-semibold text-slate-700 whitespace-nowrap"
                                    onClick={() => handleSort("tonnage")}
                                >
                                    Jumlah (KG) {renderSortIcon("tonnage")}
                                </TableHead>
                                <TableHead className="text-xs font-semibold text-slate-700 whitespace-nowrap">
                                    Harga Satuan
                                </TableHead>
                                <TableHead
                                    className="cursor-pointer select-none text-xs font-semibold text-slate-700 whitespace-nowrap"
                                    onClick={() => handleSort("total_price")}
                                >
                                    Total Nilai {renderSortIcon("total_price")}
                                </TableHead>
                                <TableHead className="text-xs font-semibold text-slate-700 whitespace-nowrap">
                                    No Bon / SJ
                                </TableHead>
                                <TableHead className="text-right text-xs font-semibold text-slate-700 whitespace-nowrap w-[110px]">
                                    Aksi
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {paginatedData.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={showCabang ? 9 : 8} className="h-32 text-center text-slate-500 text-xs">
                                        Tidak ada data semen masuk yang sesuai kriteria pencarian.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                paginatedData.map((item) => {
                                    const hasPo = Boolean(item.purchaseOrderId || item.poNumber)
                                    const unitLabel = getUnitLabel(item.purchase_unit)
                                    const effPerKg = item.effectivePricePerKg || (item.tonnage > 0 && item.total_price > 0 ? item.total_price / item.tonnage : null)

                                    return (
                                        <TableRow
                                            key={item.id}
                                            className="hover:bg-slate-50/70 transition-colors group cursor-pointer"
                                            onClick={() => onViewDetail(item)}
                                        >
                                            {/* Tanggal */}
                                            <TableCell className="text-xs whitespace-nowrap py-3 font-medium text-slate-700">
                                                <div>{item.formattedDate}</div>
                                                {item.formattedTime && item.formattedTime !== "-" && (
                                                    <div className="text-[10px] text-slate-400 font-mono">
                                                        {item.formattedTime} WIB
                                                    </div>
                                                )}
                                            </TableCell>

                                            {/* Cabang */}
                                            {showCabang && (
                                                <TableCell className="py-3">
                                                    <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700 ring-1 ring-inset ring-blue-700/10 uppercase">
                                                        {item.locationName}
                                                    </span>
                                                </TableCell>
                                            )}

                                            {/* Nama Semen & Tracing PO */}
                                            <TableCell className="py-3">
                                                <div className="font-semibold text-xs text-slate-900 leading-tight">
                                                    {item.name}
                                                </div>
                                                <div className="flex items-center gap-1.5 mt-1">
                                                    {hasPo ? (
                                                        <span className="inline-flex items-center gap-1 text-[10px] font-mono font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded">
                                                            <ShieldCheck className="h-2.5 w-2.5 text-blue-600" />
                                                            PO: {item.poNumber}
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded font-medium">
                                                            Manual
                                                        </span>
                                                    )}
                                                </div>
                                            </TableCell>

                                            {/* Distributor */}
                                            <TableCell className="text-xs text-slate-700 py-3 font-medium">
                                                {item.supplier}
                                            </TableCell>

                                            {/* Jumlah (KG) */}
                                            <TableCell className="py-3">
                                                <div className="font-bold font-mono text-xs text-slate-900">
                                                    {item.tonnage.toLocaleString("id-ID")} KG
                                                </div>
                                                {item.purchase_qty && unitLabel && (
                                                    <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                                                        ({item.purchase_qty} {unitLabel})
                                                    </div>
                                                )}
                                            </TableCell>

                                            {/* Harga Satuan */}
                                            <TableCell className="py-3">
                                                {item.unit_price > 0 ? (
                                                    <div>
                                                        <div className="font-mono text-xs text-slate-800 font-medium">
                                                            {formatRp(item.unit_price)}
                                                            <span className="text-[10px] text-slate-400 font-sans ml-0.5">
                                                                /{unitLabel}
                                                            </span>
                                                        </div>
                                                        {effPerKg && unitLabel !== "KG" && (
                                                            <div className="text-[10px] font-mono text-blue-600 font-medium mt-0.5">
                                                                ~{formatRp(Math.round(effPerKg))}/kg
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span className="text-slate-400 text-xs">-</span>
                                                )}
                                            </TableCell>

                                            {/* Total Nilai */}
                                            <TableCell className="py-3">
                                                <div className="font-mono text-xs font-bold text-emerald-700">
                                                    {item.total_price > 0 ? formatRp(item.total_price) : "-"}
                                                </div>
                                            </TableCell>

                                            {/* No Bon */}
                                            <TableCell className="py-3">
                                                <span className="font-mono text-xs text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                                                    {item.delivery_note}
                                                </span>
                                            </TableCell>

                                            {/* Aksi */}
                                            <TableCell className="text-right py-3" onClick={(e) => e.stopPropagation()}>
                                                <div className="flex items-center justify-end gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-7 w-7 text-slate-600 hover:text-blue-600 hover:bg-blue-50"
                                                        onClick={() => onViewDetail(item)}
                                                        title="Detail Tracing Data"
                                                    >
                                                        <Eye className="h-3.5 w-3.5" />
                                                    </Button>
                                                    {canManage && (
                                                        <>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-7 w-7 text-slate-600 hover:text-amber-600 hover:bg-amber-50"
                                                                onClick={() => onEdit(item)}
                                                                title="Edit Data"
                                                            >
                                                                <Pencil className="h-3.5 w-3.5" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-7 w-7 text-slate-600 hover:text-red-600 hover:bg-red-50"
                                                                onClick={() => onDelete(item)}
                                                                title="Hapus Data"
                                                            >
                                                                <Trash2 className="h-3.5 w-3.5 text-red-500" />
                                                            </Button>
                                                        </>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )
                                })
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Pagination Footer */}
                {sortedData.length > 0 && (
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-2 px-4 py-3 border-t border-slate-100 bg-slate-50/50 text-xs text-slate-600">
                        <div>
                            Menampilkan <strong className="font-mono font-semibold text-slate-800">{((currentPage - 1) * pageSize) + 1}</strong> - <strong className="font-mono font-semibold text-slate-800">{Math.min(currentPage * pageSize, sortedData.length)}</strong> dari <strong className="font-mono font-semibold text-slate-800">{sortedData.length}</strong> data
                        </div>
                        <div className="flex items-center gap-1.5">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                                disabled={currentPage === 1}
                                className="h-7 px-2.5 text-xs bg-white"
                            >
                                <ChevronLeft className="h-3.5 w-3.5 mr-1" />
                                Sebelumnya
                            </Button>
                            <span className="text-xs px-2 font-mono text-slate-600">
                                {currentPage} / {totalPages}
                            </span>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                                disabled={currentPage === totalPages}
                                className="h-7 px-2.5 text-xs bg-white"
                            >
                                Selanjutnya
                                <ChevronRight className="h-3.5 w-3.5 ml-1" />
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
