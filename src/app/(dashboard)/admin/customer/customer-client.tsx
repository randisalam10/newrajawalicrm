"use client"

import React, { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import {
    Plus, Pencil, Trash2, ChevronDown, ChevronRight,
    FolderOpen, Search, ChevronLeft, ArrowUpDown, ArrowUp, ArrowDown
} from "lucide-react"
import {
    createCustomer, updateCustomer, deleteCustomer,
    createProject, updateProject, deleteProject,
    upsertProjectPrice, deleteProjectPrice
} from "./actions"
import { DollarSign, Tag } from "lucide-react"

type DialogMode = "customerNew" | "customerEdit" | "projectNew" | "projectEdit" | null
type SortKey = "customer_name" | "address" | "location"
type SortDir = "asc" | "desc"

export function CustomerClient({ initialData, locations, userRole, qualities = [] }: { initialData: any[], locations: any[], userRole: string, qualities?: any[] }) {
    const [expandedCustomer, setExpandedCustomer] = useState<string | null>(null)
    const [expandedProject, setExpandedProject] = useState<string | null>(null)
    const [dialogMode, setDialogMode] = useState<DialogMode>(null)
    const [editData, setEditData] = useState<any>(null)
    const [parentCustomer, setParentCustomer] = useState<any>(null)
    // Price form state
    const [priceForm, setPriceForm] = useState<{ qualityId: string; price: string }>({ qualityId: "", price: "" })
    const [priceLoading, setPriceLoading] = useState(false)

    // Search / sort / pagination
    const [searchQuery, setSearchQuery] = useState("")
    const [sortKey, setSortKey] = useState<SortKey>("customer_name")
    const [sortDir, setSortDir] = useState<SortDir>("asc")
    const [currentPage, setCurrentPage] = useState(1)
    const PAGE_SIZE = 10

    // ── Derived data ───────────────────────────────────────────────
    const filtered = useMemo(() => {
        const q = searchQuery.toLowerCase()
        return initialData.filter((c) => {
            if (!q) return true
            return (
                c.customer_name?.toLowerCase().includes(q) ||
                c.address?.toLowerCase().includes(q) ||
                c.location?.name?.toLowerCase().includes(q)
            )
        })
    }, [initialData, searchQuery])

    const sorted = useMemo(() => {
        return [...filtered].sort((a, b) => {
            let av = "", bv = ""
            if (sortKey === "customer_name") { av = a.customer_name ?? ""; bv = b.customer_name ?? "" }
            if (sortKey === "address") { av = a.address ?? ""; bv = b.address ?? "" }
            if (sortKey === "location") { av = a.location?.name ?? ""; bv = b.location?.name ?? "" }
            const cmp = av.localeCompare(bv)
            return sortDir === "asc" ? cmp : -cmp
        })
    }, [filtered, sortKey, sortDir])

    const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE))
    const paginated = useMemo(() => {
        const start = (currentPage - 1) * PAGE_SIZE
        return sorted.slice(start, start + PAGE_SIZE)
    }, [sorted, currentPage])

    function handleSort(key: SortKey) {
        if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc")
        else { setSortKey(key); setSortDir("asc") }
        setCurrentPage(1)
    }

    function handleSearch(e: React.ChangeEvent<HTMLInputElement>) {
        setSearchQuery(e.target.value)
        setCurrentPage(1)
    }

    function SortIcon({ k }: { k: SortKey }) {
        if (sortKey !== k) return <ArrowUpDown className="h-3 w-3 opacity-0 group-hover:opacity-50" />
        return sortDir === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
    }

    function SortableHead({ label, k }: { label: string; k: SortKey }) {
        return (
            <div
                className="flex items-center gap-1 cursor-pointer hover:text-slate-900 transition-colors group select-none"
                onClick={() => handleSort(k)}
            >
                {label}
                <SortIcon k={k} />
            </div>
        )
    }

    // ── Customer Handlers ──────────────────────────────────────────
    async function handleCustomerSubmit(formData: FormData) {
        const result = dialogMode === "customerEdit"
            ? await updateCustomer(editData.id, formData)
            : await createCustomer(formData)
        if (result.success) { setDialogMode(null); setEditData(null) }
        else alert("Error: " + JSON.stringify(result.error))
    }

    async function handleCustomerDelete(id: string) {
        if (!confirm("Hapus customer ini? Semua proyek di bawahnya juga akan terhapus.")) return
        const result = await deleteCustomer(id)
        if (!result.success) alert(result.error)
    }

    // ── Project Handlers ───────────────────────────────────────────
    async function handleProjectSubmit(formData: FormData) {
        const result = dialogMode === "projectEdit"
            ? await updateProject(editData.id, formData)
            : await createProject(formData)
        if (result.success) { setDialogMode(null); setEditData(null) }
        else alert("Error: " + JSON.stringify(result.error))
    }

    async function handleProjectDelete(id: string) {
        if (!confirm("Hapus proyek ini?")) return
        const result = await deleteProject(id)
        if (!result.success) alert(result.error)
    }

    const isCustomerDialog = dialogMode === "customerNew" || dialogMode === "customerEdit"
    const isProjectDialog = dialogMode === "projectNew" || dialogMode === "projectEdit"

    return (
        <div className="space-y-4">
            {/* ── Header ──────────────────────────────────────────── */}
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold tracking-tight">Daftar Customer & Proyek</h2>
                <Button onClick={() => { setEditData(null); setDialogMode("customerNew") }}>
                    <Plus className="w-4 h-4 mr-2" /> Tambah Customer
                </Button>
            </div>

            {/* ── Search ──────────────────────────────────────────── */}
            <div className="flex items-center gap-2">
                <div className="relative w-full max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Cari customer, alamat, atau cabang..."
                        value={searchQuery}
                        onChange={handleSearch}
                        className="pl-9 h-9 bg-white"
                    />
                </div>
                <span className="text-xs text-slate-400 whitespace-nowrap">
                    {sorted.length} customer ditemukan
                </span>
            </div>

            {/* ── Table ───────────────────────────────────────────── */}
            <div className="rounded-md border bg-white overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-slate-50/50">
                            <TableHead className="w-8"></TableHead>
                            {userRole === "SuperAdminBP" && (
                                <TableHead>
                                    <SortableHead label="Cabang" k="location" />
                                </TableHead>
                            )}
                            <TableHead>
                                <SortableHead label="Nama Customer" k="customer_name" />
                            </TableHead>
                            <TableHead>
                                <SortableHead label="Alamat Tagih" k="address" />
                            </TableHead>
                            <TableHead>Proyek</TableHead>
                            <TableHead className="w-[120px]">Aksi</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {paginated.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={userRole === "SuperAdminBP" ? 6 : 5} className="text-center text-muted-foreground h-24">
                                    {searchQuery ? "Tidak ada data yang cocok dengan pencarian." : "Belum ada customer."}
                                </TableCell>
                            </TableRow>
                        )}
                        {paginated.map((cust) => (
                            <React.Fragment key={cust.id}>
                                {/* Customer Row */}
                                <TableRow
                                    className="hover:bg-slate-50/70 transition-colors cursor-pointer"
                                    onClick={() => setExpandedCustomer(expandedCustomer === cust.id ? null : cust.id)}
                                >
                                    <TableCell className="pl-4">
                                        {expandedCustomer === cust.id
                                            ? <ChevronDown className="w-4 h-4 text-slate-400" />
                                            : <ChevronRight className="w-4 h-4 text-slate-400" />}
                                    </TableCell>
                                    {userRole === "SuperAdminBP" && (
                                        <TableCell>
                                            <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-[10px] font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10 uppercase">
                                                {cust.location?.name || "N/A"}
                                            </span>
                                        </TableCell>
                                    )}
                                    <TableCell className="font-semibold text-sm">{cust.customer_name}</TableCell>
                                    <TableCell className="text-sm text-slate-500">{cust.address}</TableCell>
                                    <TableCell>
                                        <Badge variant="secondary">{cust.projects?.length ?? 0} proyek</Badge>
                                    </TableCell>
                                    <TableCell onClick={(e) => e.stopPropagation()}>
                                        <div className="flex items-center gap-1">
                                            <Button
                                                variant="ghost" size="icon" className="h-8 w-8"
                                                title="Tambah Proyek"
                                                onClick={() => {
                                                    setParentCustomer(cust)
                                                    setEditData(null)
                                                    setExpandedCustomer(cust.id)
                                                    setDialogMode("projectNew")
                                                }}
                                            >
                                                <FolderOpen className="w-4 h-4 text-green-600" />
                                            </Button>
                                            <Button
                                                variant="ghost" size="icon" className="h-8 w-8"
                                                onClick={() => { setEditData(cust); setDialogMode("customerEdit") }}
                                            >
                                                <Pencil className="w-4 h-4 text-slate-500" />
                                            </Button>
                                            <Button
                                                variant="ghost" size="icon" className="h-8 w-8"
                                                onClick={() => handleCustomerDelete(cust.id)}
                                            >
                                                <Trash2 className="w-4 h-4 text-red-500" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>

                                {/* Expanded Project Sub-list */}
                                {expandedCustomer === cust.id && (
                                    <TableRow key={`${cust.id}-projects`} className="bg-slate-50/80 border-t-0">
                                        <TableCell colSpan={userRole === "SuperAdminBP" ? 6 : 5} className="p-0">
                                            <div className="px-10 py-3 border-l-4 border-blue-200 bg-blue-50/30">
                                                <div className="flex justify-between items-center mb-2">
                                                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                                        Proyek milik <span className="text-blue-700">{cust.customer_name}</span>
                                                    </p>
                                                    <Button
                                                        size="sm" variant="outline" className="h-7 text-xs"
                                                        onClick={() => {
                                                            setParentCustomer(cust)
                                                            setEditData(null)
                                                            setDialogMode("projectNew")
                                                        }}
                                                    >
                                                        <Plus className="w-3 h-3 mr-1" /> Tambah Proyek
                                                    </Button>
                                                </div>
                                                {(!cust.projects || cust.projects.length === 0) ? (
                                                    <p className="text-sm text-slate-400 italic py-2">Belum ada proyek untuk customer ini.</p>
                                                ) : (
                                                    <table className="w-full text-sm">
                                                        <thead>
                                                            <tr className="border-b border-slate-200">
                                                                <th className="text-left py-1 pr-4 font-medium text-slate-600 text-xs">Nama Proyek</th>
                                                                <th className="text-left py-1 pr-4 font-medium text-slate-600 text-xs">Lokasi Pengecoran</th>
                                                                <th className="text-left py-1 pr-4 font-medium text-slate-600 text-xs">Jarak (KM)</th>
                                                                <th className="text-left py-1 font-medium text-slate-600 text-xs">PPN (%)</th>
                                                                <th className="w-[80px]"></th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {cust.projects.map((proj: any) => (
                                                                <React.Fragment key={proj.id}>
                                                                    <tr className="border-b border-slate-100 last:border-0 hover:bg-blue-50/50 transition-colors">
                                                                        <td className="py-2 pr-4">
                                                                            <button
                                                                                className="flex items-center gap-1 font-medium text-slate-800 hover:text-blue-600 text-left"
                                                                                onClick={() => setExpandedProject(expandedProject === proj.id ? null : proj.id)}
                                                                            >
                                                                                {expandedProject === proj.id
                                                                                    ? <ChevronDown className="w-3 h-3 flex-shrink-0" />
                                                                                    : <ChevronRight className="w-3 h-3 flex-shrink-0" />}
                                                                                {proj.name}
                                                                                {(!proj.prices || proj.prices.length === 0) && (
                                                                                    <span className="ml-1 text-[10px] bg-amber-100 text-amber-700 rounded px-1 py-0.5 flex items-center gap-0.5">
                                                                                        <Tag className="w-2.5 h-2.5" /> Belum ada harga
                                                                                    </span>
                                                                                )}
                                                                            </button>
                                                                        </td>
                                                                        <td className="py-2 pr-4 text-slate-500 text-xs">{proj.address}</td>
                                                                        <td className="py-2 pr-4 text-xs">{proj.default_distance} km</td>
                                                                        <td className="py-2 text-xs">{proj.tax_ppn}%</td>
                                                                        <td className="py-2">
                                                                            <div className="flex gap-1">
                                                                                <Button
                                                                                    variant="ghost" size="icon" className="h-7 w-7"
                                                                                    onClick={() => {
                                                                                        setParentCustomer(cust)
                                                                                        setEditData(proj)
                                                                                        setDialogMode("projectEdit")
                                                                                    }}
                                                                                >
                                                                                    <Pencil className="w-3 h-3 text-slate-500" />
                                                                                </Button>
                                                                                <Button
                                                                                    variant="ghost" size="icon" className="h-7 w-7"
                                                                                    onClick={() => handleProjectDelete(proj.id)}
                                                                                >
                                                                                    <Trash2 className="w-3 h-3 text-red-500" />
                                                                                </Button>
                                                                            </div>
                                                                        </td>
                                                                    </tr>
                                                                    {/* ── Pricing Sub-row ── */}
                                                                    {expandedProject === proj.id && (
                                                                        <tr>
                                                                            <td colSpan={5} className="pb-3 pt-0">
                                                                                <div className="ml-4 rounded-lg border border-slate-200 bg-white p-3 space-y-2">
                                                                                    <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 mb-1">
                                                                                        <DollarSign className="w-3.5 h-3.5 text-green-600" />
                                                                                        Harga per Mutu
                                                                                    </div>
                                                                                    {/* Existing prices */}
                                                                                    {proj.prices && proj.prices.length > 0 ? (
                                                                                        <div className="flex flex-wrap gap-2">
                                                                                            {proj.prices.map((p: any) => (
                                                                                                <div key={p.qualityId} className="flex items-center gap-1.5 bg-slate-50 border rounded-md px-2.5 py-1.5 text-xs">
                                                                                                    <span className="font-semibold text-slate-700">{p.concreteQuality?.name}</span>
                                                                                                    <span className="text-slate-500">Rp {Number(p.price).toLocaleString('id-ID')}</span>
                                                                                                    <button
                                                                                                        className="text-red-400 hover:text-red-600 ml-1"
                                                                                                        onClick={async () => {
                                                                                                            await deleteProjectPrice(proj.id, p.qualityId)
                                                                                                        }}
                                                                                                        title="Hapus harga ini"
                                                                                                    >
                                                                                                        ×
                                                                                                    </button>
                                                                                                </div>
                                                                                            ))}
                                                                                        </div>
                                                                                    ) : (
                                                                                        <p className="text-xs text-slate-400 italic">Belum ada harga. Tambahkan di bawah.</p>
                                                                                    )}
                                                                                    {/* Add price form */}
                                                                                    {qualities.length > 0 && (() => {
                                                                                        const existingQualityIds = (proj.prices || []).map((p: any) => p.qualityId)
                                                                                        const availableQualities = qualities.filter((q: any) => !existingQualityIds.includes(q.id))
                                                                                        if (availableQualities.length === 0) return null
                                                                                        return (
                                                                                            <div className="flex items-center gap-2 pt-1 border-t border-slate-100 mt-1">
                                                                                                <select
                                                                                                    className="flex-1 text-xs h-8 rounded-md border border-slate-200 bg-white px-2 focus:outline-none focus:ring-1 focus:ring-blue-400"
                                                                                                    value={priceForm.qualityId}
                                                                                                    onChange={e => setPriceForm(f => ({ ...f, qualityId: e.target.value }))}
                                                                                                >
                                                                                                    <option value="">Pilih Mutu...</option>
                                                                                                    {availableQualities.map((q: any) => (
                                                                                                        <option key={q.id} value={q.id}>{q.name}</option>
                                                                                                    ))}
                                                                                                </select>
                                                                                                <input
                                                                                                    type="number"
                                                                                                    placeholder="Harga/m³"
                                                                                                    className="w-28 text-xs h-8 rounded-md border border-slate-200 bg-white px-2 focus:outline-none focus:ring-1 focus:ring-blue-400"
                                                                                                    value={priceForm.price}
                                                                                                    onChange={e => setPriceForm(f => ({ ...f, price: e.target.value }))}
                                                                                                />
                                                                                                <Button
                                                                                                    size="sm" className="h-8 text-xs"
                                                                                                    disabled={priceLoading || !priceForm.qualityId || !priceForm.price}
                                                                                                    onClick={async () => {
                                                                                                        if (!priceForm.qualityId || !priceForm.price) return
                                                                                                        setPriceLoading(true)
                                                                                                        await upsertProjectPrice(proj.id, priceForm.qualityId, Number(priceForm.price))
                                                                                                        setPriceForm({ qualityId: "", price: "" })
                                                                                                        setPriceLoading(false)
                                                                                                    }}
                                                                                                >
                                                                                                    {priceLoading ? "..." : "Simpan"}
                                                                                                </Button>
                                                                                            </div>
                                                                                        )
                                                                                    })()}
                                                                                </div>
                                                                            </td>
                                                                        </tr>
                                                                    )}
                                                                </React.Fragment>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </React.Fragment>
                        ))}
                    </TableBody>
                </Table>
            </div>

            {/* ── Pagination ───────────────────────────────────────── */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between px-2">
                    <div className="text-sm text-muted-foreground font-medium">
                        Halaman {currentPage} dari {totalPages}
                        <span className="ml-2 text-xs italic font-normal">(Total {sorted.length} customer)</span>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Button
                            variant="outline" size="sm"
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="h-8 text-xs"
                        >
                            <ChevronLeft className="h-4 w-4 mr-1" /> Sebelumnya
                        </Button>
                        <Button
                            variant="outline" size="sm"
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage >= totalPages}
                            className="h-8 text-xs"
                        >
                            Selanjutnya <ChevronLeft className="h-4 w-4 ml-1 rotate-180" />
                        </Button>
                    </div>
                </div>
            )}

            {/* ── Customer Dialog ─────────────────────────────────── */}
            <Dialog open={isCustomerDialog} onOpenChange={(o) => { if (!o) { setDialogMode(null); setEditData(null) } }}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>{dialogMode === "customerEdit" ? "Edit Customer" : "Tambah Customer Baru"}</DialogTitle>
                    </DialogHeader>
                    <form key={editData?.id || "new-customer"} action={handleCustomerSubmit} className="space-y-4 mt-4">
                        <div className="space-y-2">
                            <Label htmlFor="customer_name">Nama Customer *</Label>
                            <Input id="customer_name" name="customer_name" defaultValue={editData?.customer_name} required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="address">Alamat Tagih *</Label>
                            <Input id="address" name="address" defaultValue={editData?.address} required />
                        </div>
                        {userRole === "SuperAdminBP" && (
                            <div className="space-y-2">
                                <Label>Cabang (Lokasi) *</Label>
                                <Select name="locationId" defaultValue={editData?.locationId || ""}>
                                    <SelectTrigger><SelectValue placeholder="Pilih Cabang" /></SelectTrigger>
                                    <SelectContent>
                                        {locations.map((loc) => (
                                            <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                        <Button type="submit" className="w-full mt-4">Simpan</Button>
                    </form>
                </DialogContent>
            </Dialog>

            {/* ── Project Dialog ──────────────────────────────────── */}
            <Dialog open={isProjectDialog} onOpenChange={(o) => { if (!o) { setDialogMode(null); setEditData(null) } }}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>
                            {dialogMode === "projectEdit" ? "Edit Proyek" : `Tambah Proyek — ${parentCustomer?.customer_name}`}
                        </DialogTitle>
                    </DialogHeader>
                    <form key={editData?.id || "new-project"} action={handleProjectSubmit} className="space-y-4 mt-4">
                        <input
                            type="hidden"
                            name="customerId"
                            value={dialogMode === "projectEdit" ? editData?.customerId : parentCustomer?.id}
                        />
                        <div className="space-y-2">
                            <Label htmlFor="proj_name">Nama Proyek *</Label>
                            <Input id="proj_name" name="name" defaultValue={editData?.name} placeholder="Ex: Jalan Lingkar Barat" required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="proj_address">Lokasi Pengecoran *</Label>
                            <Input id="proj_address" name="address" defaultValue={editData?.address} placeholder="Ex: Jl. Soekarno Hatta Km 5" required />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="default_distance">Jarak Default (KM) *</Label>
                                <Input
                                    id="default_distance" name="default_distance" type="number" step="0.1" min="0"
                                    defaultValue={editData?.default_distance ?? ""}
                                    placeholder="Ex: 12.5" required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="tax_ppn">PPN (%) *</Label>
                                <Input
                                    id="tax_ppn" name="tax_ppn" type="number" step="0.01" min="0" max="100"
                                    defaultValue={editData?.tax_ppn ?? ""}
                                    placeholder="Ex: 11" required
                                />
                            </div>
                        </div>
                        <Button type="submit" className="w-full mt-2">Simpan Proyek</Button>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    )
}
