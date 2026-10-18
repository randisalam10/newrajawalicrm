"use client"

import React, { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Combobox } from "@/components/ui/combobox"
import { Plus, Pencil, Trash2, ChevronLeft, ChevronRight, History, Globe, Building2, Search } from "lucide-react"
import { createMasterItem, updateMasterItem, deleteMasterItem } from "./actions"
import { MasterBarangDialog } from "./components/master-barang-dialog"
import { MasterBarangHistoryDialog } from "./components/master-barang-history-dialog"

const PAGE_SIZE = 20

export function MasterBarangClient({
    initialData,
    suppliers,
    categories,
    canManage = true,
    locations = [],
    isCentral = false,
    userLocationId = null,
}: {
    initialData: any[]
    suppliers: any[]
    categories: any[]
    canManage?: boolean
    locations?: { id: string; name: string; type: string }[]
    isCentral?: boolean
    userLocationId?: string | null
}) {
    const [search, setSearch] = useState("")
    const [filterCategory, setFilterCategory] = useState("all")
    const [filterUnit, setFilterUnit] = useState<"ALL" | "BP" | "CRUSHER">("ALL")
    const [filterLocation, setFilterLocation] = useState<string>("ALL")
    const [page, setPage] = useState(1)

    const [dialogOpen, setDialogOpen] = useState(false)
    const [historyOpen, setHistoryOpen] = useState(false)
    const [historyItem, setHistoryItem] = useState<any>(null)
    const [editData, setEditData] = useState<any>(null)

    // Reset ke halaman 1 saat filter berubah
    React.useEffect(() => { setPage(1) }, [search, filterCategory, filterUnit, filterLocation])

    const filtered = useMemo(() => initialData.filter(item => {
        const matchSearch = !search ||
            item.name.toLowerCase().includes(search.toLowerCase()) ||
            item.kode_barang.toLowerCase().includes(search.toLowerCase()) ||
            (item.part_number && item.part_number.toLowerCase().includes(search.toLowerCase())) ||
            (item.supplier?.name && item.supplier.name.toLowerCase().includes(search.toLowerCase()))

        const matchCategory = filterCategory === "all" || item.categoryId === filterCategory

        const matchUnit = filterUnit === "ALL" || item.target_business === filterUnit || item.target_business === "ALL"

        let matchLocation = true
        if (filterLocation !== "ALL") {
            if (filterLocation === "GLOBAL") {
                matchLocation = Boolean(item.is_global)
            } else {
                matchLocation = Boolean(
                    item.is_global ||
                    item.locationId === filterLocation ||
                    item.sharedLocations?.some((l: any) => l.id === filterLocation)
                )
            }
        }

        return matchSearch && matchCategory && matchUnit && matchLocation
    }), [initialData, search, filterCategory, filterUnit, filterLocation])

    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
    const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

    const categoryOptions = categories.map(c => ({ value: c.id, label: c.name }))
    const filterCategoryOptions = [
        { value: "all", label: "Semua Kategori" },
        ...categoryOptions
    ]

    async function handleSubmit(formData: FormData) {
        const result = editData
            ? await updateMasterItem(editData.id, formData)
            : await createMasterItem(formData)

        if (result.success) {
            setDialogOpen(false)
            setEditData(null)
        } else {
            alert("Error: " + JSON.stringify(result.error))
        }
    }

    return (
        <div className="space-y-3 p-4">
            {/* Toolbar */}
            <div className="flex flex-col gap-2 bg-slate-50/50 p-2.5 rounded-lg border border-slate-200">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2 flex-1">
                        <div className="relative flex-1 min-w-[200px]">
                            <Search className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                            <Input
                                placeholder="Cari kode, nama, part number, toko..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                className="pl-8 h-8 text-xs bg-white"
                            />
                        </div>

                        <div className="w-[180px]">
                            <Combobox
                                options={filterCategoryOptions}
                                value={filterCategory}
                                onChange={setFilterCategory}
                                placeholder="Semua Kategori"
                            />
                        </div>

                        {isCentral && (
                            <>
                                <select
                                    className="h-8 text-xs bg-white border border-slate-200 rounded-md px-2 focus:ring-1 focus:ring-blue-500"
                                    value={filterUnit}
                                    onChange={e => setFilterUnit(e.target.value as any)}
                                >
                                    <option value="ALL">Semua Unit (BP & SC)</option>
                                    <option value="BP">Khusus BP</option>
                                    <option value="CRUSHER">Khusus Crusher</option>
                                </select>

                                <select
                                    className="h-8 text-xs bg-white border border-slate-200 rounded-md px-2 focus:ring-1 focus:ring-blue-500"
                                    value={filterLocation}
                                    onChange={e => setFilterLocation(e.target.value)}
                                >
                                    <option value="ALL">Semua Cabang</option>
                                    <option value="GLOBAL">🌐 Hanya Global (Nasional)</option>
                                    {locations.map(loc => (
                                        <option key={loc.id} value={loc.id}>
                                            {loc.name}
                                        </option>
                                    ))}
                                </select>
                            </>
                        )}
                    </div>

                    {canManage && (
                        <Button size="sm" className="h-8 text-xs font-semibold gap-1.5 shrink-0" onClick={() => { setEditData(null); setDialogOpen(true) }}>
                            <Plus className="w-3.5 h-3.5" /> Tambah Barang
                        </Button>
                    )}
                </div>
            </div>

            {/* Table */}
            <div className="rounded-md border bg-white overflow-hidden shadow-2xs">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-slate-100/80 h-9">
                                <TableHead className="py-2 min-w-[120px] text-xs font-semibold">Toko / Supplier</TableHead>
                                <TableHead className="py-2 min-w-[70px] text-xs font-semibold">Kode</TableHead>
                                <TableHead className="py-2 min-w-[180px] text-xs font-semibold">Nama Barang</TableHead>
                                <TableHead className="py-2 min-w-[120px] text-xs font-semibold">Cakupan Cabang</TableHead>
                                <TableHead className="py-2 min-w-[110px] text-xs font-semibold">Part / Merk</TableHead>
                                <TableHead className="py-2 min-w-[100px] text-xs font-semibold">Kategori</TableHead>
                                <TableHead className="py-2 text-right min-w-[120px] text-xs font-semibold">Harga Satuan</TableHead>
                                <TableHead className="py-2 w-[90px] text-center text-xs font-semibold">Aksi</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {paginated.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={8} className="text-center text-muted-foreground h-24 text-xs">
                                        Tidak ada barang yang cocok dengan filter.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                paginated.map((item) => (
                                    <TableRow key={item.id} className="hover:bg-slate-50 h-9 text-xs">
                                        <TableCell className="py-1.5 font-semibold text-blue-700">
                                            {item.supplier?.name || "—"}
                                        </TableCell>
                                        <TableCell className="py-1.5 font-mono text-[11px] font-medium text-slate-700">
                                            {item.kode_barang}
                                        </TableCell>
                                        <TableCell className="py-1.5 font-medium text-slate-900">
                                            {item.name}
                                        </TableCell>
                                        <TableCell className="py-1.5">
                                            <div className="flex flex-wrap items-center gap-1">
                                                {item.is_global ? (
                                                    <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[9px] gap-0.5">
                                                        <Globe className="w-2.5 h-2.5" /> Global
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-[9px] gap-0.5">
                                                        <Building2 className="w-2.5 h-2.5" />
                                                        {item.location?.name || "Cabang"}
                                                        {item.sharedLocations && item.sharedLocations.length > 0 && ` (+${item.sharedLocations.length})`}
                                                    </Badge>
                                                )}
                                                {item.target_business === "CRUSHER" && (
                                                    <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-200 text-[8px] font-semibold">
                                                        SC
                                                    </Badge>
                                                )}
                                                {item.target_business === "BP" && (
                                                    <Badge variant="outline" className="bg-indigo-50 text-indigo-800 border-indigo-200 text-[8px] font-semibold">
                                                        BP
                                                    </Badge>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-1.5">
                                            <div>{item.part_number || "-"}</div>
                                            {item.merk && <div className="text-[10px] text-slate-400">{item.merk}</div>}
                                        </TableCell>
                                        <TableCell className="py-1.5">
                                            <span className="inline-flex items-center rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-700">
                                                {item.category?.name}
                                            </span>
                                        </TableCell>
                                        <TableCell className="py-1.5 text-right font-mono font-semibold text-slate-900">
                                            Rp {Number(item.harga).toLocaleString('id-ID')}
                                            <span className="text-[10px] text-slate-400 font-sans ml-1">/{item.satuan}</span>
                                        </TableCell>
                                        <TableCell className="py-1.5 text-center">
                                            <div className="flex items-center justify-center gap-0.5">
                                                <Button
                                                    variant="ghost" size="icon" className="h-7 w-7 text-blue-600 hover:bg-blue-50"
                                                    title="Riwayat Harga"
                                                    onClick={() => { setHistoryItem(item); setHistoryOpen(true) }}
                                                >
                                                    <History className="w-3.5 h-3.5" />
                                                </Button>
                                                {canManage && (
                                                    <>
                                                        <Button
                                                            variant="ghost" size="icon" className="h-7 w-7 text-slate-600"
                                                            title="Edit Barang"
                                                            onClick={() => { setEditData(item); setDialogOpen(true) }}
                                                        >
                                                            <Pencil className="w-3.5 h-3.5" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost" size="icon" className="h-7 w-7 text-rose-500"
                                                            title="Hapus Barang"
                                                            onClick={async () => {
                                                                if (!confirm(`Hapus barang "${item.name}"?`)) return
                                                                const r = await deleteMasterItem(item.id)
                                                                if (!r.success) alert(r.error)
                                                            }}
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </Button>
                                                    </>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between px-4 py-2 border-t text-xs text-slate-500">
                        <span>Menampilkan {((page - 1) * PAGE_SIZE) + 1} - {Math.min(page * PAGE_SIZE, filtered.length)} dari {filtered.length} barang</span>
                        <div className="flex items-center gap-1">
                            <Button
                                variant="outline" size="sm" className="h-7 text-xs"
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                            >
                                <ChevronLeft className="w-3.5 h-3.5 mr-1" /> Prev
                            </Button>
                            <span className="px-2 font-medium">{page} / {totalPages}</span>
                            <Button
                                variant="outline" size="sm" className="h-7 text-xs"
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                            >
                                Next <ChevronRight className="w-3.5 h-3.5 ml-1" />
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            {/* Dialog Tambah / Edit */}
            <MasterBarangDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                editData={editData}
                suppliers={suppliers}
                categories={categories}
                locations={locations}
                isCentral={isCentral}
                userLocationId={userLocationId}
                onSubmit={handleSubmit}
            />

            {/* Dialog Riwayat Perubahan Harga */}
            <MasterBarangHistoryDialog
                open={historyOpen}
                onOpenChange={setHistoryOpen}
                item={historyItem}
            />
        </div>
    )
}
