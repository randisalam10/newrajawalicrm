"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
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
import {
    Plus, Pencil, Trash2, Search, X, RotateCcw,
    Users, UserCheck, Truck, HardHat, Shield, Building2, Filter
} from "lucide-react"
import { createKaryawan, updateKaryawan, deleteKaryawan } from "./actions"
import { SimpleDataTable, SortableHeader } from "@/components/ui/simple-data-table"

export function KaryawanClient({
    initialData,
    locations,
    userRole,
    canManage = true,
}: {
    initialData: any[]
    locations: any[]
    userRole: string
    canManage?: boolean
}) {
    const isCorporate = userRole === "SuperAdminBP" || ["CEO", "FVP", "Approver"].includes(userRole)
    const [open, setOpen] = useState(false)
    const [editData, setEditData] = useState<any>(null)
    const [selectedPosition, setSelectedPosition] = useState<string>("Sopir")

    // Filter states
    const [searchQuery, setSearchQuery] = useState<string>("")
    const [filterBranch, setFilterBranch] = useState<string>("ALL")
    const [filterPos, setFilterPos] = useState<string>("ALL")
    const [filterStatus, setFilterStatus] = useState<string>("ALL")

    // Quick summary statistics
    const stats = useMemo(() => {
        const total = initialData.length
        const active = initialData.filter(d => d.status === "Active").length
        const sopir = initialData.filter(d => d.position === "Sopir").length
        const operator = initialData.filter(d => d.position === "Operator").length
        const staff = initialData.filter(d => !["Sopir", "Operator"].includes(d.position)).length
        return { total, active, sopir, operator, staff }
    }, [initialData])

    // Filtered data calculation
    const filteredData = useMemo(() => {
        return initialData.filter((item) => {
            // Branch filter
            if (filterBranch !== "ALL" && item.locationId !== filterBranch) {
                return false
            }
            // Position filter
            if (filterPos !== "ALL") {
                if (filterPos === "STAFF") {
                    if (["Sopir", "Operator"].includes(item.position)) return false
                } else if (item.position !== filterPos) {
                    return false
                }
            }
            // Status filter
            if (filterStatus !== "ALL" && item.status !== filterStatus) {
                return false
            }
            // Text search
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase().trim()
                const matchName = item.name?.toLowerCase().includes(q)
                const matchPos = item.position?.toLowerCase().includes(q)
                const matchLoc = item.location?.name?.toLowerCase().includes(q)
                if (!matchName && !matchPos && !matchLoc) return false
            }
            return true
        })
    }, [initialData, filterBranch, filterPos, filterStatus, searchQuery])

    const hasActiveFilters = searchQuery !== "" || filterBranch !== "ALL" || filterPos !== "ALL" || filterStatus !== "ALL"

    const handleResetFilters = () => {
        setSearchQuery("")
        setFilterBranch("ALL")
        setFilterPos("ALL")
        setFilterStatus("ALL")
    }

    async function handleSubmit(formData: FormData) {
        let result;
        if (editData) {
            result = await updateKaryawan(editData.id, formData)
        } else {
            result = await createKaryawan(formData)
        }

        if (result.success) {
            setOpen(false)
            setEditData(null)
        } else {
            alert("Error: " + JSON.stringify(result.error))
        }
    }

    async function handleDelete(id: string) {
        if (confirm("Are you sure you want to delete this Karyawan?")) {
            const result = await deleteKaryawan(id)
            if (!result.success) alert(result.error)
        }
    }

    const handleOpenEdit = (data: any) => {
        setEditData({
            ...data,
            join_date: new Date(data.join_date).toISOString().split('T')[0]
        })
        setSelectedPosition(data.position)
        setOpen(true)
    }

    const handleOpenNew = () => {
        setEditData(null)
        setSelectedPosition("Sopir")
        setOpen(true)
    }

    const getPositionBadge = (pos: string) => {
        switch (pos) {
            case "Sopir":
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                        <Truck className="w-3 h-3 text-blue-500" /> Sopir
                    </span>
                )
            case "Operator":
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                        <HardHat className="w-3 h-3 text-amber-500" /> Operator
                    </span>
                )
            case "Admin":
            case "AdminLogistik":
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200">
                        <Shield className="w-3 h-3 text-purple-500" /> {pos === "AdminLogistik" ? "Admin Logistik" : "Admin"}
                    </span>
                )
            case "CEO":
            case "FVP":
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <Shield className="w-3 h-3 text-emerald-500" /> {pos}
                    </span>
                )
            default:
                return (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                        {pos}
                    </span>
                )
        }
    }

    return (
        <div className="space-y-4">
            {/* ── 1. Header & Tambah Karyawan ── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">Data Karyawan</h1>
                        {!canManage && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                                Mode Pemantauan (Hanya Lihat)
                            </span>
                        )}
                    </div>
                    <p className="text-xs sm:text-sm text-slate-500">Kelola master data Pegawai (Sopir, Operator, Admin).</p>
                </div>
                {canManage && (
                    <>
                        <Button onClick={handleOpenNew} className="shadow-xs bg-slate-900 hover:bg-slate-800 text-white gap-1.5 h-9 text-xs">
                            <Plus className="w-4 h-4" /> Tambah Karyawan
                        </Button>
                        <Dialog open={open} onOpenChange={setOpen}>
                            <DialogContent className="sm:max-w-[425px]">
                            <DialogHeader>
                                <DialogTitle>{editData ? 'Edit Karyawan' : 'Tambah Karyawan Baru'}</DialogTitle>
                            </DialogHeader>
                            <form key={editData?.id || 'new'} action={handleSubmit} className="space-y-4 mt-4">
                                {editData && <input type="hidden" name="id" value={editData.id} />}
                                <div className="space-y-2">
                                    <Label htmlFor="name">Nama Karyawan *</Label>
                                    <Input id="name" name="name" defaultValue={editData?.name} required />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="position">Posisi *</Label>
                                        <Select name="position" value={selectedPosition} onValueChange={setSelectedPosition}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Pilih Posisi" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Sopir">Sopir</SelectItem>
                                                <SelectItem value="Operator">Operator</SelectItem>
                                                <SelectItem value="Admin">Admin</SelectItem>
                                                <SelectItem value="AdminLogistik">Admin Logistik & Peralatan</SelectItem>
                                                <SelectItem value="CEO">CEO</SelectItem>
                                                <SelectItem value="FVP">FVP</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="status">Status *</Label>
                                        <Select name="status" defaultValue={editData?.status || "Active"}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Pilih Status" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Active">Aktif</SelectItem>
                                                <SelectItem value="Inactive">Non-Aktif</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="join_date">Tanggal Bergabung *</Label>
                                    <Input id="join_date" name="join_date" type="date" defaultValue={editData?.join_date} required />
                                </div>

                                {userRole === "SuperAdminBP" && !["AdminLogistik", "CEO", "FVP"].includes(selectedPosition) && (
                                    <div className="space-y-2">
                                        <Label htmlFor="locationId">Cabang (Lokasi) *</Label>
                                        <Select name="locationId" defaultValue={editData?.locationId || ""}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Pilih Cabang" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {locations.map((loc) => (
                                                    <SelectItem key={loc.id} value={loc.id}>
                                                        {loc.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}

                                <Button type="submit" className="w-full mt-4">Simpan</Button>
                            </form>
                        </DialogContent>
                        </Dialog>
                    </>
                )}
            </div>

            {/* ── 2. Kartu Ringkasan Interaktif (Quick Filter Stat Cards) ── */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {/* Total */}
                <Card
                    onClick={() => { setFilterPos("ALL"); setFilterStatus("ALL"); }}
                    className={`cursor-pointer transition-all border shadow-xs hover:border-blue-400 ${filterPos === "ALL" && filterStatus === "ALL" ? "ring-2 ring-blue-500 bg-blue-50/30" : "bg-white"}`}
                >
                    <CardContent className="p-3.5 flex items-center justify-between">
                        <div>
                            <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Total Pegawai</p>
                            <p className="text-xl font-bold text-slate-800 mt-0.5">{stats.total}</p>
                        </div>
                        <div className="p-2 bg-slate-100 rounded-lg text-slate-600">
                            <Users className="w-4 h-4" />
                        </div>
                    </CardContent>
                </Card>

                {/* Aktif */}
                <Card
                    onClick={() => setFilterStatus(filterStatus === "Active" ? "ALL" : "Active")}
                    className={`cursor-pointer transition-all border shadow-xs hover:border-emerald-400 ${filterStatus === "Active" ? "ring-2 ring-emerald-500 bg-emerald-50/30" : "bg-white"}`}
                >
                    <CardContent className="p-3.5 flex items-center justify-between">
                        <div>
                            <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Aktif</p>
                            <p className="text-xl font-bold text-emerald-600 mt-0.5">{stats.active}</p>
                        </div>
                        <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
                            <UserCheck className="w-4 h-4" />
                        </div>
                    </CardContent>
                </Card>

                {/* Sopir */}
                <Card
                    onClick={() => setFilterPos(filterPos === "Sopir" ? "ALL" : "Sopir")}
                    className={`cursor-pointer transition-all border shadow-xs hover:border-blue-400 ${filterPos === "Sopir" ? "ring-2 ring-blue-500 bg-blue-50/30" : "bg-white"}`}
                >
                    <CardContent className="p-3.5 flex items-center justify-between">
                        <div>
                            <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Sopir</p>
                            <p className="text-xl font-bold text-blue-600 mt-0.5">{stats.sopir}</p>
                        </div>
                        <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                            <Truck className="w-4 h-4" />
                        </div>
                    </CardContent>
                </Card>

                {/* Operator */}
                <Card
                    onClick={() => setFilterPos(filterPos === "Operator" ? "ALL" : "Operator")}
                    className={`cursor-pointer transition-all border shadow-xs hover:border-amber-400 ${filterPos === "Operator" ? "ring-2 ring-amber-500 bg-amber-50/30" : "bg-white"}`}
                >
                    <CardContent className="p-3.5 flex items-center justify-between">
                        <div>
                            <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Operator</p>
                            <p className="text-xl font-bold text-amber-600 mt-0.5">{stats.operator}</p>
                        </div>
                        <div className="p-2 bg-amber-50 rounded-lg text-amber-600">
                            <HardHat className="w-4 h-4" />
                        </div>
                    </CardContent>
                </Card>

                {/* Admin & Staf */}
                <Card
                    onClick={() => setFilterPos(filterPos === "STAFF" ? "ALL" : "STAFF")}
                    className={`cursor-pointer transition-all border shadow-xs hover:border-purple-400 ${filterPos === "STAFF" ? "ring-2 ring-purple-500 bg-purple-50/30" : "bg-white"}`}
                >
                    <CardContent className="p-3.5 flex items-center justify-between">
                        <div>
                            <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Admin & Staf</p>
                            <p className="text-xl font-bold text-purple-600 mt-0.5">{stats.staff}</p>
                        </div>
                        <div className="p-2 bg-purple-50 rounded-lg text-purple-600">
                            <Shield className="w-4 h-4" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* ── 3. Toolbar Filter Interaktif ── */}
            <div className="bg-white border rounded-xl p-3 shadow-xs space-y-3">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    {/* Search Input */}
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                        <Input
                            placeholder="Cari nama, posisi, atau cabang..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 pr-8 h-9 text-xs bg-slate-50/50 border-slate-200 focus:bg-white transition-colors"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery("")}
                                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>

                    {/* Filter Dropdowns */}
                    <div className="flex flex-wrap items-center gap-2">
                        {/* Filter Cabang */}
                        {isCorporate && (
                            <div className="w-[140px]">
                                <Select value={filterBranch} onValueChange={setFilterBranch}>
                                    <SelectTrigger className="h-9 text-xs bg-slate-50/50">
                                        <SelectValue placeholder="Semua Cabang" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ALL">Semua Cabang</SelectItem>
                                        {locations.map((loc) => (
                                            <SelectItem key={loc.id} value={loc.id}>
                                                {loc.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        {/* Filter Posisi */}
                        <div className="w-[140px]">
                            <Select value={filterPos} onValueChange={setFilterPos}>
                                <SelectTrigger className="h-9 text-xs bg-slate-50/50">
                                    <SelectValue placeholder="Semua Posisi" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ALL">Semua Posisi</SelectItem>
                                    <SelectItem value="Sopir">Sopir</SelectItem>
                                    <SelectItem value="Operator">Operator</SelectItem>
                                    <SelectItem value="Admin">Admin</SelectItem>
                                    <SelectItem value="AdminLogistik">Admin Logistik</SelectItem>
                                    <SelectItem value="CEO">CEO</SelectItem>
                                    <SelectItem value="FVP">FVP</SelectItem>
                                    <SelectItem value="STAFF">Semua Admin/Staf</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Filter Status */}
                        <div className="w-[125px]">
                            <Select value={filterStatus} onValueChange={setFilterStatus}>
                                <SelectTrigger className="h-9 text-xs bg-slate-50/50">
                                    <SelectValue placeholder="Semua Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ALL">Semua Status</SelectItem>
                                    <SelectItem value="Active">Aktif</SelectItem>
                                    <SelectItem value="Inactive">Non-Aktif</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Reset Filter Button */}
                        {hasActiveFilters && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleResetFilters}
                                className="h-9 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 gap-1 px-2.5"
                            >
                                <RotateCcw className="w-3.5 h-3.5" /> Reset
                            </Button>
                        )}
                    </div>
                </div>

                {/* Chips filter aktif */}
                {hasActiveFilters && (
                    <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100 text-xs">
                        <span className="text-slate-400 text-[11px] font-medium flex items-center gap-1">
                            <Filter className="w-3 h-3" /> Filter aktif:
                        </span>
                        {filterBranch !== "ALL" && (
                            <Badge variant="outline" className="text-[11px] gap-1 bg-blue-50/50 border-blue-200 text-blue-700 py-0.5">
                                Cabang: {locations.find(l => l.id === filterBranch)?.name || filterBranch}
                                <X className="w-3 h-3 cursor-pointer hover:text-blue-900" onClick={() => setFilterBranch("ALL")} />
                            </Badge>
                        )}
                        {filterPos !== "ALL" && (
                            <Badge variant="outline" className="text-[11px] gap-1 bg-purple-50/50 border-purple-200 text-purple-700 py-0.5">
                                Posisi: {filterPos === "STAFF" ? "Admin & Staf" : filterPos}
                                <X className="w-3 h-3 cursor-pointer hover:text-purple-900" onClick={() => setFilterPos("ALL")} />
                            </Badge>
                        )}
                        {filterStatus !== "ALL" && (
                            <Badge variant="outline" className="text-[11px] gap-1 bg-emerald-50/50 border-emerald-200 text-emerald-700 py-0.5">
                                Status: {filterStatus === "Active" ? "Aktif" : "Non-Aktif"}
                                <X className="w-3 h-3 cursor-pointer hover:text-emerald-900" onClick={() => setFilterStatus("ALL")} />
                            </Badge>
                        )}
                        {searchQuery && (
                            <Badge variant="outline" className="text-[11px] gap-1 bg-slate-100 text-slate-700 py-0.5">
                                Pencarian: &quot;{searchQuery}&quot;
                                <X className="w-3 h-3 cursor-pointer hover:text-slate-900" onClick={() => setSearchQuery("")} />
                            </Badge>
                        )}
                    </div>
                )}
            </div>

            {/* ── 4. Tabel Data Karyawan ── */}
            <SimpleDataTable
                data={filteredData}
                searchKeys={["name", "position"]}
                showSearch={false}
                pageSize={10}
            >
                {(items, sortConfig, toggleSort) => (
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-slate-50/80 border-b border-slate-200/80">
                                {isCorporate && (
                                    <TableHead className="w-[130px]">
                                        <SortableHeader label="Cabang" sortKey="locationId" sortConfig={sortConfig} onSort={toggleSort} />
                                    </TableHead>
                                )}
                                <TableHead>
                                    <SortableHeader label="Nama Pegawai" sortKey="name" sortConfig={sortConfig} onSort={toggleSort} />
                                </TableHead>
                                <TableHead className="w-[160px]">
                                    <SortableHeader label="Posisi" sortKey="position" sortConfig={sortConfig} onSort={toggleSort} />
                                </TableHead>
                                <TableHead className="w-[120px]">
                                    <SortableHeader label="Status" sortKey="status" sortConfig={sortConfig} onSort={toggleSort} />
                                </TableHead>
                                <TableHead className="w-[140px]">
                                    <SortableHeader label="Tgl Bergabung" sortKey="join_date" sortConfig={sortConfig} onSort={toggleSort} />
                                </TableHead>
                                {canManage && <TableHead className="w-[80px] text-center">Aksi</TableHead>}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {items.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={(isCorporate ? 1 : 0) + 4 + (canManage ? 1 : 0)} className="text-center py-12 text-slate-400">
                                        <div className="flex flex-col items-center gap-2">
                                            <Users className="w-8 h-8 text-slate-300" />
                                            <p className="text-sm font-medium text-slate-600">Tidak ada data pegawai yang sesuai</p>
                                            <p className="text-xs text-slate-400">Coba ubah atau reset filter pencarian di atas</p>
                                            {hasActiveFilters && (
                                                <Button variant="outline" size="sm" onClick={handleResetFilters} className="mt-2 text-xs">
                                                    Reset Semua Filter
                                                </Button>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )}
                            {items.map((item) => {
                                const initials = item.name
                                    ?.split(" ")
                                    .slice(0, 2)
                                    .map((n: string) => n[0])
                                    .join("")
                                    .toUpperCase() || "K"

                                return (
                                    <TableRow key={item.id} className="hover:bg-slate-50/60 transition-colors">
                                        {isCorporate && (
                                            <TableCell>
                                                <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700 border border-slate-200 uppercase">
                                                    <Building2 className="w-3 h-3 text-slate-400" />
                                                    {item.location?.name || "N/A"}
                                                </span>
                                            </TableCell>
                                        )}
                                        <TableCell>
                                            <div className="flex items-center gap-2.5">
                                                <div className="w-7 h-7 rounded-full bg-blue-100/80 text-blue-700 flex items-center justify-center font-bold text-[10px] shrink-0">
                                                    {initials}
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-xs text-slate-900">{item.name}</p>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {getPositionBadge(item.position)}
                                        </TableCell>
                                        <TableCell>
                                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${item.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'}`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${item.status === 'Active' ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                                                {item.status === 'Active' ? 'Aktif' : 'Non-Aktif'}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-xs text-slate-600" suppressHydrationWarning>
                                            {new Date(item.join_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                        </TableCell>
                                        {canManage && (
                                            <TableCell>
                                                <div className="flex items-center justify-center gap-1">
                                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-500 hover:text-blue-600 hover:bg-blue-50" onClick={() => handleOpenEdit(item)} title="Edit Karyawan">
                                                        <Pencil className="w-3.5 h-3.5" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-500 hover:text-rose-600 hover:bg-rose-50" onClick={() => handleDelete(item.id)} title="Hapus Karyawan">
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        )}
                                    </TableRow>
                                )
                            })}
                        </TableBody>
                    </Table>
                )}
            </SimpleDataTable>
        </div>
    )
}

