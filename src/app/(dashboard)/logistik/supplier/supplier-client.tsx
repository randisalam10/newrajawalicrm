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
import { Plus, Search, Edit2, Trash2, Phone, MapPin, Package, ShoppingCart, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { SupplierItem, SupplierStats as StatsType } from "./types"
import { SupplierStats } from "./components/supplier-stats"
import { SupplierModal } from "./components/supplier-modal"
import { deleteSupplier } from "./actions"

interface SupplierClientProps {
    initialData: SupplierItem[]
    stats: StatsType
    canManage?: boolean
}

export function SupplierClient({ initialData, stats, canManage = true }: SupplierClientProps) {
    const [search, setSearch] = useState("")
    const [filterCategory, setFilterCategory] = useState<"ALL" | "HAS_ITEMS" | "NO_ITEMS" | "HAS_PO">("ALL")
    const [page, setPage] = useState(1)
    const pageSize = 15

    // Modal states
    const [modalOpen, setModalOpen] = useState(false)
    const [editItem, setEditItem] = useState<SupplierItem | null>(null)

    // Delete alert dialog states
    const [deleteItem, setDeleteItem] = useState<SupplierItem | null>(null)
    const [isDeleting, startDeleteTransition] = useTransition()

    // Filter & Search logic
    const filteredSuppliers = useMemo(() => {
        let result = initialData

        if (filterCategory === "HAS_ITEMS") {
            result = result.filter(s => s.itemCount > 0)
        } else if (filterCategory === "NO_ITEMS") {
            result = result.filter(s => s.itemCount === 0)
        } else if (filterCategory === "HAS_PO") {
            result = result.filter(s => s.poCount > 0)
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
    }, [initialData, search, filterCategory])

    // Pagination
    const totalPages = Math.ceil(filteredSuppliers.length / pageSize) || 1
    const paginatedSuppliers = useMemo(() => {
        const start = (page - 1) * pageSize
        return filteredSuppliers.slice(start, start + pageSize)
    }, [filteredSuppliers, page, pageSize])

    const handleDeleteConfirm = () => {
        if (!deleteItem) return
        startDeleteTransition(async () => {
            const res = await deleteSupplier(deleteItem.id)
            if (res.success) {
                toast.success(`Toko "${deleteItem.name}" berhasil dihapus`)
                setDeleteItem(null)
            } else {
                toast.error(res.error || "Gagal menghapus toko")
            }
        })
    }

    return (
        <div className="space-y-4 w-full">
            {/* 1. Summary Stats Cards */}
            <SupplierStats stats={stats} />

            {/* 2. Controls & Filter Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-lg border border-slate-200/90 shadow-xs">
                {/* Search */}
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                    <Input
                        value={search}
                        onChange={e => { setSearch(e.target.value); setPage(1) }}
                        placeholder="Cari nama toko, alamat, atau nomor telepon..."
                        className="pl-8 h-9 text-xs bg-slate-50/50"
                    />
                </div>

                {/* Filter Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
                    <Button
                        type="button"
                        size="sm"
                        variant={filterCategory === "ALL" ? "default" : "outline"}
                        className="h-8 text-xs font-medium"
                        onClick={() => { setFilterCategory("ALL"); setPage(1) }}
                    >
                        Semua ({initialData.length})
                    </Button>
                    <Button
                        type="button"
                        size="sm"
                        variant={filterCategory === "HAS_ITEMS" ? "default" : "outline"}
                        className="h-8 text-xs font-medium"
                        onClick={() => { setFilterCategory("HAS_ITEMS"); setPage(1) }}
                    >
                        Ada Katalog ({initialData.filter(s => s.itemCount > 0).length})
                    </Button>
                    <Button
                        type="button"
                        size="sm"
                        variant={filterCategory === "HAS_PO" ? "default" : "outline"}
                        className="h-8 text-xs font-medium"
                        onClick={() => { setFilterCategory("HAS_PO"); setPage(1) }}
                    >
                        Riwayat PO ({initialData.filter(s => s.poCount > 0).length})
                    </Button>

                    {canManage && (
                        <Button
                            size="sm"
                            className="h-8 text-xs gap-1.5 ml-auto font-semibold"
                            onClick={() => { setEditItem(null); setModalOpen(true) }}
                        >
                            <Plus className="w-3.5 h-3.5" />
                            Tambah Toko
                        </Button>
                    )}
                </div>
            </div>

            {/* 3. Modern Table */}
            <div className="rounded-lg border border-slate-200 bg-white overflow-hidden shadow-xs">
                <Table>
                    <TableHeader className="bg-slate-50/70 border-b">
                        <TableRow>
                            <TableHead className="w-[40px] text-center text-xs font-semibold text-slate-700">No</TableHead>
                            <TableHead className="text-xs font-semibold text-slate-700">Nama Toko / Supplier</TableHead>
                            <TableHead className="text-xs font-semibold text-slate-700">Kontak</TableHead>
                            <TableHead className="text-xs font-semibold text-slate-700">Alamat</TableHead>
                            <TableHead className="text-center text-xs font-semibold text-slate-700">Katalog Barang</TableHead>
                            <TableHead className="text-center text-xs font-semibold text-slate-700">Riwayat PO</TableHead>
                            {canManage && <TableHead className="w-[90px] text-right text-xs font-semibold text-slate-700 pr-4">Aksi</TableHead>}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {paginatedSuppliers.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={canManage ? 7 : 6} className="text-center py-12 text-slate-400">
                                    <StoreIcon className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                                    <p className="text-sm font-medium">Tidak ada toko atau supplier yang sesuai.</p>
                                    <p className="text-xs text-slate-400">Coba ubah kata kunci pencarian atau filter Anda.</p>
                                </TableCell>
                            </TableRow>
                        ) : (
                            paginatedSuppliers.map((s, idx) => {
                                const rowNumber = (page - 1) * pageSize + idx + 1
                                return (
                                    <TableRow key={s.id} className="hover:bg-slate-50/80 transition-colors">
                                        <TableCell className="text-center text-xs text-slate-400 font-mono">
                                            {rowNumber}
                                        </TableCell>

                                        {/* Nama Toko */}
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="font-semibold text-sm text-slate-900">{s.name}</span>
                                                <span className="text-[11px] text-slate-400">
                                                    ID: {s.id.slice(0, 8)}... • Terdaftar {new Date(s.createdAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                </span>
                                            </div>
                                        </TableCell>

                                        {/* Kontak */}
                                        <TableCell>
                                            {s.contact ? (
                                                <a
                                                    href={`tel:${s.contact.replace(/[^0-9+]/g, '')}`}
                                                    className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:underline"
                                                >
                                                    <Phone className="w-3 h-3 text-slate-400" />
                                                    {s.contact}
                                                </a>
                                            ) : (
                                                <span className="text-xs text-slate-400 italic">—</span>
                                            )}
                                        </TableCell>

                                        {/* Alamat */}
                                        <TableCell className="max-w-[260px]">
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
                                                    {s.itemCount} Item
                                                </Badge>
                                            ) : (
                                                <span className="text-xs text-slate-400 font-medium">0 item</span>
                                            )}
                                        </TableCell>

                                        {/* Riwayat PO */}
                                        <TableCell className="text-center">
                                            {s.poCount > 0 ? (
                                                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs font-semibold gap-1">
                                                    <ShoppingCart className="w-3 h-3" />
                                                    {s.poCount} PO
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
                                                        <span className="sr-only">Edit Toko</span>
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-8 w-8 p-0 text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                                                        title="Hapus Toko"
                                                        onClick={() => setDeleteItem(s)}
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                        <span className="sr-only">Hapus Toko</span>
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

                {/* Pagination Controls */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between px-4 py-3 border-t bg-slate-50/50 text-xs">
                        <span className="text-slate-500">
                            Menampilkan <span className="font-semibold text-slate-800">{(page - 1) * pageSize + 1}</span> - <span className="font-semibold text-slate-800">{Math.min(page * pageSize, filteredSuppliers.length)}</span> dari <span className="font-semibold text-slate-800">{filteredSuppliers.length}</span> toko
                        </span>
                        <div className="flex items-center gap-1">
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-7 px-2.5 text-xs"
                                disabled={page === 1}
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                            >
                                Sebelumnya
                            </Button>
                            <span className="px-2 font-medium text-slate-600">
                                {page} / {totalPages}
                            </span>
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-7 px-2.5 text-xs"
                                disabled={page === totalPages}
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            >
                                Selanjutnya
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            {/* Modal Tambah/Edit Toko */}
            <SupplierModal
                open={modalOpen}
                onOpenChange={setModalOpen}
                initialData={editItem}
            />

            {/* Dialog Konfirmasi Hapus */}
            <AlertDialog open={Boolean(deleteItem)} onOpenChange={open => !open && setDeleteItem(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-base font-bold text-slate-900">
                            Konfirmasi Hapus Toko
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-xs text-slate-600">
                            Apakah Anda yakin ingin menghapus data toko <strong className="text-slate-900">&ldquo;{deleteItem?.name}&rdquo;</strong>?
                            Tindakan ini tidak dapat dibatalkan jika toko belum memiliki transaksi terkait.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="gap-2 sm:gap-0">
                        <AlertDialogCancel disabled={isDeleting} className="h-9 text-xs">Batal</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteConfirm}
                            disabled={isDeleting}
                            className="h-9 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white"
                        >
                            {isDeleting && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
                            Hapus Toko
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}

function StoreIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7" />
            <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
            <path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4" />
            <path d="M2 7h20" />
            <path d="M22 7v3a2 2 0 0 1-2 2v0a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 16 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 12 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 8 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 4 12v0a2 2 0 0 1-2-2V7" />
        </svg>
    )
}
