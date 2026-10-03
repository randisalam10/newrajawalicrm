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
import { LedgerRow } from "../types"
import { Search, ChevronLeft, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react"

interface MaterialInLedgerTableProps {
    data: LedgerRow[]
    showCabang: boolean
}

type SortField = "formattedDate" | "type" | "description" | "reference" | "qty_in" | "qty_out" | "balance" | "locationName"

export function MaterialInLedgerTable({
    data,
    showCabang,
}: MaterialInLedgerTableProps) {
    const [searchQuery, setSearchQuery] = useState("")
    const [typeFilter, setTypeFilter] = useState<"ALL" | "IN" | "OUT">("ALL")
    const [locationFilter, setLocationFilter] = useState<string>("ALL")
    const [currentPage, setCurrentPage] = useState(1)
    const [sortField, setSortField] = useState<SortField>("formattedDate")
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
    const pageSize = 15

    // Locations for filter
    const availableLocations = useMemo(() => {
        const set = new Set<string>()
        data.forEach(item => {
            if (item.locationName) set.add(item.locationName)
        })
        return Array.from(set).sort()
    }, [data])

    // Filtered data
    const filteredData = useMemo(() => {
        return data.filter(item => {
            if (typeFilter !== "ALL" && item.type !== typeFilter) return false
            if (locationFilter !== "ALL" && item.locationName !== locationFilter) return false

            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase()
                const matchDesc = item.description.toLowerCase().includes(q)
                const matchRef = item.reference.toLowerCase().includes(q)
                const matchLoc = item.locationName.toLowerCase().includes(q)
                if (!matchDesc && !matchRef && !matchLoc) return false
            }

            return true
        })
    }, [data, typeFilter, locationFilter, searchQuery])

    // Sorted data
    const sortedData = useMemo(() => {
        return [...filteredData].sort((a, b) => {
            const aVal: any = a[sortField]
            const bVal: any = b[sortField]

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
                    <div className="relative flex-1 min-w-[240px]">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                        <Input
                            placeholder="Cari keterangan, referensi SPK, DO..."
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value)
                                setCurrentPage(1)
                            }}
                            className="pl-8 h-9 text-xs bg-white border-slate-200"
                        />
                    </div>

                    <Select
                        value={typeFilter}
                        onValueChange={(val: "ALL" | "IN" | "OUT") => {
                            setTypeFilter(val)
                            setCurrentPage(1)
                        }}
                    >
                        <SelectTrigger className="w-full sm:w-[150px] h-9 text-xs bg-white border-slate-200">
                            <SelectValue placeholder="Semua Tipe" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">Semua Tipe</SelectItem>
                            <SelectItem value="IN">Semen Masuk (IN)</SelectItem>
                            <SelectItem value="OUT">Produksi (OUT)</SelectItem>
                        </SelectContent>
                    </Select>

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
                    Total: <strong className="text-slate-800 font-mono">{filteredData.length}</strong> mutasi
                </div>
            </div>

            {/* Table */}
            <div className="rounded-lg border border-slate-200/80 bg-white overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-slate-50/80 hover:bg-slate-50/80 border-b border-slate-200">
                                <TableHead
                                    className="cursor-pointer select-none text-xs font-semibold text-slate-700 whitespace-nowrap"
                                    onClick={() => handleSort("formattedDate")}
                                >
                                    Tanggal / Jam {renderSortIcon("formattedDate")}
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
                                    className="cursor-pointer select-none text-xs font-semibold text-slate-700 whitespace-nowrap w-[90px]"
                                    onClick={() => handleSort("type")}
                                >
                                    Tipe {renderSortIcon("type")}
                                </TableHead>
                                <TableHead
                                    className="cursor-pointer select-none text-xs font-semibold text-slate-700 whitespace-nowrap"
                                    onClick={() => handleSort("description")}
                                >
                                    Keterangan {renderSortIcon("description")}
                                </TableHead>
                                <TableHead
                                    className="cursor-pointer select-none text-xs font-semibold text-slate-700 whitespace-nowrap"
                                    onClick={() => handleSort("reference")}
                                >
                                    Referensi {renderSortIcon("reference")}
                                </TableHead>
                                <TableHead
                                    className="cursor-pointer select-none text-xs font-semibold text-slate-700 whitespace-nowrap text-right"
                                    onClick={() => handleSort("qty_in")}
                                >
                                    Masuk (KG) {renderSortIcon("qty_in")}
                                </TableHead>
                                <TableHead
                                    className="cursor-pointer select-none text-xs font-semibold text-slate-700 whitespace-nowrap text-right"
                                    onClick={() => handleSort("qty_out")}
                                >
                                    Keluar (KG) {renderSortIcon("qty_out")}
                                </TableHead>
                                <TableHead
                                    className="cursor-pointer select-none text-xs font-semibold text-slate-700 whitespace-nowrap text-right bg-slate-100/50"
                                    onClick={() => handleSort("balance")}
                                >
                                    Stok Silo (KG) {renderSortIcon("balance")}
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {paginatedData.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={showCabang ? 8 : 7} className="h-32 text-center text-slate-500 text-xs">
                                        Tidak ada catatan mutasi stok yang sesuai.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                paginatedData.map((item) => {
                                    const isOut = item.type === "OUT"
                                    return (
                                        <TableRow key={item.id} className="hover:bg-slate-50/70 transition-colors">
                                            <TableCell className="text-xs whitespace-nowrap py-3 font-mono text-slate-600">
                                                {item.formattedDate}
                                            </TableCell>
                                            {showCabang && (
                                                <TableCell className="py-3">
                                                    <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700 ring-1 ring-inset ring-blue-700/10 uppercase">
                                                        {item.locationName}
                                                    </span>
                                                </TableCell>
                                            )}
                                            <TableCell className="py-3">
                                                <Badge
                                                    variant={isOut ? "destructive" : "default"}
                                                    className={`text-[10px] font-bold py-0.5 px-2 uppercase ${
                                                        isOut ? "bg-rose-50 text-rose-700 border-rose-200" : "bg-emerald-50 text-emerald-700 border-emerald-200"
                                                    }`}
                                                >
                                                    {isOut ? "OUT" : "IN"}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-xs font-medium text-slate-800 py-3 max-w-[260px] truncate">
                                                {item.description}
                                            </TableCell>
                                            <TableCell className="text-xs text-slate-500 py-3 font-mono">
                                                {item.reference}
                                            </TableCell>
                                            <TableCell className="text-xs py-3 text-right font-mono font-semibold">
                                                {item.qty_in > 0 ? (
                                                    <span className="text-emerald-600">+{item.qty_in.toLocaleString("id-ID")}</span>
                                                ) : (
                                                    <span className="text-slate-300">-</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-xs py-3 text-right font-mono font-semibold">
                                                {item.qty_out > 0 ? (
                                                    <span className="text-rose-600">-{item.qty_out.toLocaleString("id-ID", { maximumFractionDigits: 1 })}</span>
                                                ) : (
                                                    <span className="text-slate-300">-</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-xs py-3 text-right font-mono font-bold text-slate-900 border-l border-slate-100 bg-slate-50/40">
                                                {item.balance.toLocaleString("id-ID", { maximumFractionDigits: 1 })}
                                            </TableCell>
                                        </TableRow>
                                    )
                                })
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Pagination */}
                {sortedData.length > 0 && (
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-2 px-4 py-3 border-t border-slate-100 bg-slate-50/50 text-xs text-slate-600">
                        <div>
                            Menampilkan <strong className="font-mono font-semibold text-slate-800">{((currentPage - 1) * pageSize) + 1}</strong> - <strong className="font-mono font-semibold text-slate-800">{Math.min(currentPage * pageSize, sortedData.length)}</strong> dari <strong className="font-mono font-semibold text-slate-800">{sortedData.length}</strong> mutasi
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
