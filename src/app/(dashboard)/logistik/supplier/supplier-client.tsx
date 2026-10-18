"use client"

import React, { useState, useMemo, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Plus, Search, Edit2, Trash2, Phone, MapPin, Package, ShoppingCart, Loader2, Store as StoreIcon, Globe, Building2 } from "lucide-react"
import { toast } from "sonner"
import { SupplierItem, SupplierStats as StatsType } from "./types"
import { SupplierStats } from "./components/supplier-stats"
import { SupplierModal } from "./components/supplier-modal"
import { SupplierBulkBar } from "./components/supplier-bulk-bar"
import { SupplierBulkDialog } from "./components/supplier-bulk-dialog"
import { deleteSupplier } from "./actions"

interface SupplierClientProps {
    initialData: SupplierItem[]
    stats: StatsType
    canManage?: boolean
    isCentral?: boolean
    locations?: { id: string; name: string; type: string }[]
    userLocationId?: string | null
}

export function SupplierClient({
    initialData,
    stats,
    canManage = true,
    isCentral = false,
    locations = [],
    userLocationId = null,
}: SupplierClientProps) {
    const [search, setSearch] = useState("")
    const [filterCategory, setFilterCategory] = useState<"ALL" | "HAS_ITEMS" | "NO_ITEMS" | "HAS_PO">("ALL")
    const [filterUnit, setFilterUnit] = useState<"ALL" | "BP" | "CRUSHER">("ALL")
    const [filterLocation, setFilterLocation] = useState<string>("ALL")
    const [page, setPage] = useState(1)
    const pageSize = 15

    // Modal & Selection states
    const [modalOpen, setModalOpen] = useState(false)
    const [editItem, setEditItem] = useState<SupplierItem | null>(null)
    const [deleteItem, setDeleteItem] = useState<SupplierItem | null>(null)
    const [isDeleting, startDeleteTransition] = useTransition()

    // Bulk selection states
    const [selectedIds, setSelectedIds] = useState<string[]>([])
    const [bulkDialogOpen, setBulkDialogOpen] = useState(false)

    // Filter logic
    const filteredSuppliers = useMemo(() => {
        let result = initialData

        if (filterCategory === "HAS_ITEMS") {
            result = result.filter(s => s.itemCount > 0)
        } else if (filterCategory === "NO_ITEMS") {
            result = result.filter(s => s.itemCount === 0)
        } else if (filterCategory === "HAS_PO") {
            result = result.filter(s => s.poCount > 0)
        }

        if (filterUnit !== "ALL") {
            result = result.filter(s => s.target_business === filterUnit || s.target_business === "ALL")
        }

        if (filterLocation !== "ALL") {
            if (filterLocation === "GLOBAL") {
                result = result.filter(s => s.is_global)
            } else {
                result = result.filter(s =>
                    s.is_global ||
                    s.locationId === filterLocation ||
                    s.sharedLocations?.some(l => l.id === filterLocation)
                )
            }
        }

        if (search.trim() !== "") {
            const q = search.toLowerCase()
            result = result.filter(s =>
                s.name.toLowerCase().includes(q) ||
                (s.contact && s.contact.toLowerCase().includes(q)) ||
                (s.address && s.address.toLowerCase().includes(q))
            )
        }

        return result
    }, [initialData, search, filterCategory, filterUnit, filterLocation])

    // Pagination
    const totalPages = Math.ceil(filteredSuppliers.length / pageSize) || 1
    const paginatedSuppliers = useMemo(() => {
        const start = (page - 1) * pageSize
        return filteredSuppliers.slice(start, start + pageSize)
    }, [filteredSuppliers, page, pageSize])

    // Selected suppliers
    const selectedSuppliers = useMemo(() => {
        return initialData.filter(s => selectedIds.includes(s.id))
    }, [initialData, selectedIds])

    const isAllFilteredSelected = filteredSuppliers.length > 0 && selectedIds.length >= filteredSuppliers.length && filteredSuppliers.every(s => selectedIds.includes(s.id))
    const isPartiallySelected = selectedIds.length > 0 && !isAllFilteredSelected

    const handleToggleSelectAll = () => {
        if (isAllFilteredSelected) {
            setSelectedIds([])
        } else {
            setSelectedIds(filteredSuppliers.map(s => s.id))
        }
    }

    const handleToggleSelectRow = (id: string) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
        )
    }

    const handleDelete = () => {
        if (!deleteItem) return
        startDeleteTransition(async () => {
            const res = await deleteSupplier(deleteItem.id)
            if (res.success) {
                toast.success(`Toko "${deleteItem.name}" berhasil dihapus`)
                setDeleteItem(null)
                setSelectedIds(prev => prev.filter(id => id !== deleteItem.id))
            } else {
                toast.error(res.error || "Gagal menghapus toko")
            }
        })
    }

    return (
        <div className="space-y-4">
            {/* 1. Stat Cards */}
            <SupplierStats stats={stats} />

            {/* 2. Filter & Action Toolbar */}
            <div className="flex flex-col gap-2 bg-white p-3 rounded-lg border border-slate-200/90 shadow-2xs">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <div className="relative flex-1">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <Input
                            placeholder="Cari nama toko, kontak, atau alamat..."
                            value={search}
                            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                            className="pl-9 h-8.5 text-xs bg-slate-50/50 focus-visible:bg-white"
                        />
                    </div>

                    {isCentral && (
                        <div className="flex items-center gap-2">
                            <select
                                className="h-8.5 text-xs bg-slate-50 border border-slate-200 rounded-md px-2 focus:ring-1 focus:ring-blue-500"
                                value={filterUnit}
                                onChange={e => { setFilterUnit(e.target.value as any); setPage(1) }}
                            >
                                <option value="ALL">Semua Unit (BP & SC)</option>
                                <option value="BP">Khusus Batching Plant</option>
                                <option value="CRUSHER">Khusus Stone Crusher</option>
                            </select>

                            <select
                                className="h-8.5 text-xs bg-slate-50 border border-slate-200 rounded-md px-2 focus:ring-1 focus:ring-blue-500"
                                value={filterLocation}
                                onChange={e => { setFilterLocation(e.target.value); setPage(1) }}
                            >
                                <option value="ALL">Semua Cabang</option>
                                <option value="GLOBAL">🌐 Hanya Global (Nasional)</option>
                                {locations.map(loc => (
                                    <option key={loc.id} value={loc.id}>
                                        {loc.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>

                <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-100">
                    <Button
                        type="button"
                        size="sm"
                        variant={filterCategory === "ALL" ? "default" : "outline"}
                        className="h-7 text-xs font-medium"
                        onClick={() => { setFilterCategory("ALL"); setPage(1) }}
                    >
                        Semua ({initialData.length})
                    </Button>
                    <Button
                        type="button"
                        size="sm"
                        variant={filterCategory === "HAS_ITEMS" ? "default" : "outline"}
                        className="h-7 text-xs font-medium"
                        onClick={() => { setFilterCategory("HAS_ITEMS"); setPage(1) }}
                    >
                        Ada Katalog ({initialData.filter(s => s.itemCount > 0).length})
                    </Button>
                    <Button
                        type="button"
                        size="sm"
                        variant={filterCategory === "HAS_PO" ? "default" : "outline"}
                        className="h-7 text-xs font-medium"
                        onClick={() => { setFilterCategory("HAS_PO"); setPage(1) }}
                    >
                        Riwayat PO ({initialData.filter(s => s.poCount > 0).length})
                    </Button>

                    {canManage && (
                        <Button
                            size="sm"
                            className="h-7 text-xs gap-1.5 ml-auto font-semibold"
                            onClick={() => { setEditItem(null); setModalOpen(true) }}
                        >
                            <Plus className="w-3.5 h-3.5" />
                            Tambah Toko
                        </Button>
                    )}
                </div>
            </div>

            {/* 3. Table with Selection Checkboxes */}
            <div className="rounded-lg border border-slate-200 bg-white overflow-hidden shadow-xs">
                {/* Banner Bantuan Seleksi Massal */}
                {canManage && selectedIds.length > 0 && (
                    <div className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2 bg-blue-50/90 border-b border-blue-200/90 text-xs text-blue-900">
                        <div className="flex items-center gap-1.5">
                            <span className="font-semibold">{selectedIds.length}</span>
                            <span>dari {filteredSuppliers.length} toko dipilih</span>
                        </div>
                        <div className="flex items-center gap-2">
                            {selectedIds.length < filteredSuppliers.length ? (
                                <button
                                    type="button"
                                    onClick={() => setSelectedIds(filteredSuppliers.map(s => s.id))}
                                    className="font-semibold text-blue-700 hover:text-blue-900 hover:underline cursor-pointer"
                                >
                                    Pilih seluruh {filteredSuppliers.length} toko
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => setSelectedIds(paginatedSuppliers.map(s => s.id))}
                                    className="font-medium text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                                >
                                    Pilih hanya {paginatedSuppliers.length} di halaman ini
                                </button>
                            )}
                            <span className="text-blue-300">|</span>
                            <button
                                type="button"
                                onClick={() => setSelectedIds([])}
                                className="font-medium text-slate-500 hover:text-slate-800 hover:underline cursor-pointer"
                            >
                                Batal Pilih
                            </button>
                        </div>
                    </div>
                )}

                <Table>
                    <TableHeader className="bg-slate-50/70 border-b">
                        <TableRow>
                            {canManage && (
                                <TableHead className="w-[38px] text-center px-2">
                                    <input
                                        type="checkbox"
                                        checked={isAllFilteredSelected}
                                        ref={el => {
                                            if (el) el.indeterminate = isPartiallySelected
                                        }}
                                        onChange={handleToggleSelectAll}
                                        title={isAllFilteredSelected ? "Batal pilih semua" : `Pilih semua ${filteredSuppliers.length} toko`}
                                        className="h-3.5 w-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                    />
                                </TableHead>
                            )}
                            <TableHead className="w-[40px] text-center text-xs font-semibold text-slate-700">No</TableHead>
                            <TableHead className="text-xs font-semibold text-slate-700">Nama Toko / Supplier</TableHead>
                            <TableHead className="text-xs font-semibold text-slate-700">Cakupan Cabang</TableHead>
                            <TableHead className="text-xs font-semibold text-slate-700">Kontak</TableHead>
                            <TableHead className="text-xs font-semibold text-slate-700">Alamat</TableHead>
                            <TableHead className="text-center text-xs font-semibold text-slate-700">Katalog</TableHead>
                            <TableHead className="text-center text-xs font-semibold text-slate-700">Riwayat PO</TableHead>
                            {canManage && <TableHead className="w-[80px] text-right text-xs font-semibold text-slate-700 pr-4">Aksi</TableHead>}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {paginatedSuppliers.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={canManage ? 9 : 7} className="text-center py-12 text-slate-400">
                                    <StoreIcon className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                                    <p className="text-sm font-medium">Tidak ada toko atau supplier yang sesuai.</p>
                                    <p className="text-xs text-slate-400">Coba ubah kata kunci pencarian atau filter Anda.</p>
                                </TableCell>
                            </TableRow>
                        ) : (
                            paginatedSuppliers.map((s, idx) => {
                                const rowNumber = (page - 1) * pageSize + idx + 1
                                const isSelected = selectedIds.includes(s.id)

                                return (
                                    <TableRow
                                        key={s.id}
                                        className={`transition-colors ${
                                            isSelected ? "bg-blue-50/50 hover:bg-blue-50/70" : "hover:bg-slate-50/80"
                                        }`}
                                    >
                                        {/* Checkbox Kolom */}
                                        {canManage && (
                                            <TableCell className="text-center px-2">
                                                <input
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    onChange={() => handleToggleSelectRow(s.id)}
                                                    className="h-3.5 w-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                                />
                                            </TableCell>
                                        )}

                                        <TableCell className="text-center text-xs text-slate-400 font-mono">
                                            {rowNumber}
                                        </TableCell>

                                        {/* Nama Toko */}
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="font-semibold text-sm text-slate-900">{s.name}</span>
                                                <span className="text-[11px] text-slate-400">
                                                    Terdaftar {new Date(s.createdAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                </span>
                                            </div>
                                        </TableCell>

                                        {/* Cakupan Cabang */}
                                        <TableCell>
                                            <div className="flex flex-wrap items-center gap-1">
                                                {s.is_global ? (
                                                    <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] gap-1 font-semibold">
                                                        <Globe className="w-2.5 h-2.5" /> Global
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-[10px] gap-1 font-semibold">
                                                        <Building2 className="w-2.5 h-2.5" />
                                                        {s.location?.name || "Cabang"}
                                                        {s.sharedLocations && s.sharedLocations.length > 0 && ` (+${s.sharedLocations.length})`}
                                                    </Badge>
                                                )}
                                                {s.target_business === "CRUSHER" && (
                                                    <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-200 text-[9px] font-semibold">
                                                        Crusher
                                                    </Badge>
                                                )}
                                                {s.target_business === "BP" && (
                                                    <Badge variant="outline" className="bg-indigo-50 text-indigo-800 border-indigo-200 text-[9px] font-semibold">
                                                        BP
                                                    </Badge>
                                                )}
                                            </div>
                                        </TableCell>

                                        {/* Kontak */}
                                        <TableCell>
                                            {s.contact ? (
                                                <a
                                                    href={`tel:${s.contact.replace(/[^0-9+]/g, '')}`}
                                                    className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:underline"
                                                >
                                                    <Phone className="w-3 h-3 text-slate-400" />
                                                    {s.contact}
                                                </a>
                                            ) : (
                                                <span className="text-xs text-slate-400 italic">—</span>
                                            )}
                                        </TableCell>

                                        {/* Alamat */}
                                        <TableCell className="max-w-[220px]">
                                            {s.address ? (
                                                <div className="flex items-start gap-1 text-xs text-slate-600 line-clamp-2">
                                                    <MapPin className="w-3 h-3 text-slate-400 shrink-0 mt-0.5" />
                                                    <span>{s.address}</span>
                                                </div>
                                            ) : (
                                                <span className="text-xs text-slate-400 italic">—</span>
                                            )}
                                        </TableCell>

                                        {/* Katalog Barang */}
                                        <TableCell className="text-center">
                                            {s.itemCount > 0 ? (
                                                <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs font-semibold gap-1">
                                                    <Package className="w-3 h-3" />
                                                    {s.itemCount}
                                                </Badge>
                                            ) : (
                                                <span className="text-xs text-slate-400 font-medium">0</span>
                                            )}
                                        </TableCell>

                                        {/* Riwayat PO */}
                                        <TableCell className="text-center">
                                            {s.poCount > 0 ? (
                                                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs font-semibold gap-1">
                                                    <ShoppingCart className="w-3 h-3" />
                                                    {s.poCount}
                                                </Badge>
                                            ) : (
                                                <span className="text-xs text-slate-400 font-medium">—</span>
                                            )}
                                        </TableCell>

                                        {/* Aksi */}
                                        {canManage && (
                                            <TableCell className="text-right pr-4">
                                                <div className="flex items-center justify-end gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-8 w-8 p-0 text-slate-500 hover:text-blue-600 hover:bg-blue-50"
                                                        title="Edit Toko"
                                                        onClick={() => { setEditItem(s); setModalOpen(true) }}
                                                    >
                                                        <Edit2 className="w-3.5 h-3.5" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-8 w-8 p-0 text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                                                        title="Hapus Toko"
                                                        onClick={() => setDeleteItem(s)}
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        )}
                                    </TableRow>
                                )
                            })
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                    <span>
                        Menampilkan {Math.min((page - 1) * pageSize + 1, filteredSuppliers.length)} - {Math.min(page * pageSize, filteredSuppliers.length)} dari {filteredSuppliers.length} toko
                    </span>
                    <div className="flex items-center gap-1">
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs"
                            disabled={page <= 1}
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                        >
                            Sebelumnya
                        </Button>
                        <span className="px-2 font-medium">{page} / {totalPages}</span>
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs"
                            disabled={page >= totalPages}
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        >
                            Selanjutnya
                        </Button>
                    </div>
                </div>
            )}

            {/* Floating Bulk Action Bar */}
            {canManage && (
                <SupplierBulkBar
                    selectedSuppliers={selectedSuppliers}
                    onClearSelection={() => setSelectedIds([])}
                    onOpenCustomBulk={() => setBulkDialogOpen(true)}
                    onSuccess={() => setSelectedIds([])}
                />
            )}

            {/* Modal Dialog Bulk Scope */}
            {canManage && (
                <SupplierBulkDialog
                    open={bulkDialogOpen}
                    onOpenChange={setBulkDialogOpen}
                    selectedSuppliers={selectedSuppliers}
                    locations={locations}
                    isCentral={isCentral}
                    onSuccess={() => setSelectedIds([])}
                />
            )}

            {/* Modal Tambah / Edit */}
            <SupplierModal
                open={modalOpen}
                onOpenChange={setModalOpen}
                initialData={editItem}
                onSuccess={() => {}}
                locations={locations}
                isCentral={isCentral}
                userLocationId={userLocationId}
            />

            {/* Alert Dialog Hapus */}
            <AlertDialog open={Boolean(deleteItem)} onOpenChange={(open) => !open && setDeleteItem(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-base font-bold text-slate-900">
                            Hapus Toko / Supplier?
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-xs text-slate-500">
                            Toko <strong className="text-slate-800">"{deleteItem?.name}"</strong> akan dihapus permanen.
                            Toko yang masih memiliki katalog barang atau riwayat PO tidak dapat dihapus.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting} className="h-8 text-xs">Batal</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className="h-8 text-xs bg-rose-600 hover:bg-rose-700 text-white font-semibold"
                        >
                            {isDeleting && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
                            Ya, Hapus Toko
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
