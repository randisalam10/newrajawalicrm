"use client"

import { useState, useTransition } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Shield, ShieldCheck, Plus, Check, Save, Lock, Building2, Globe, Users, Edit2, Trash2, CheckSquare, Square } from "lucide-react"
import { createRole, updateRole, deleteRole, updateRolePermissions } from "./actions"
import { toast } from "sonner"

interface PermissionItem {
    id: string
    code: string
    module: string
    action: string
    name: string
    description?: string | null
}

interface RoleItem {
    id: string
    name: string
    label: string
    description?: string | null
    isSystem: boolean
    scope: "ALL_BRANCHES" | "OWN_BRANCH"
    _count: {
        permissions: number
        users: number
    }
}

interface RolesClientProps {
    roles: RoleItem[]
    groupedPermissions: Record<string, PermissionItem[]>
    initialRolePermissions: Record<string, string[]> // roleId -> array of permission codes
}

const MODULE_LABELS: Record<string, { title: string; desc: string }> = {
    DASHBOARD: { title: "Monitoring Dashboard", desc: "Ringkasan KPI & grafik produksi harian/bulanan" },
    PRODUKSI: { title: "Input Produksi", desc: "Input pengiriman mixer, edit data tiket, dan konfirmasi transaksi" },
    RETASE: { title: "Surat Jalan & Retase", desc: "Pencatatan surat jalan & perhitungan komisi retase driver" },
    CUSTOMER: { title: "Data Customer & Proyek", desc: "Master customer, data proyek, dan harga khusus mutu per proyek" },
    BILLING: { title: "Tagihan & Invoice", desc: "Pembuatan invoice, penerbitan, pencatatan pembayaran & saldo deposit" },
    MATERIAL_SEMEN: { title: "Semen Masuk & Stok", desc: "Pencatatan penerimaan semen masuk & monitoring kartu stok" },
    MATERIAL_AGREGAT: { title: "Material Agregat", desc: "Penerimaan pasir & batu split serta penyesuaian stok agregat" },
    MATERIAL_USAGE: { title: "Penggunaan Material", desc: "Monitoring rasio pemakaian aktual bahan baku terhadap rencana mutu" },
    PLANNING: { title: "Planning Pengecoran", desc: "Jadwal rencana pengecoran batching plant" },
    MASTER_DATA: { title: "Data Master Operasional", desc: "Master Karyawan, Armada Kendaraan, Mutu Beton, dan Item Pekerjaan" },
    MASTER_CABANG: { title: "Master Cabang BP", desc: "Pengaturan cabang/lokasi batching plant" },
    LOGISTIK: { title: "Logistik & Peralatan", desc: "Pengadaan barang, purchase order, supplier, dan katalog barang" },
    REPORTS: { title: "Laporan & Rekapitulasi", desc: "Rekap gaji sopir, laporan penagihan, dan export audit" },
    USER_MGMT: { title: "Manajemen User", desc: "Akun login pengguna sistem & reset password" },
    RBAC_MGMT: { title: "Pengaturan Hak Akses", desc: "Konfigurasi role dan matriks izin RBAC" },
}

const ACTION_LABELS: Record<string, string> = {
    view: "Lihat",
    create: "Buat / Tambah",
    edit: "Ubah",
    delete: "Hapus",
    approve: "Konfirmasi / Setujui",
    export: "Export / Cetak",
}

export function RolesClient({ roles: initialRoles, groupedPermissions, initialRolePermissions }: RolesClientProps) {
    const [roles, setRoles] = useState<RoleItem[]>(initialRoles)
    const [selectedRoleId, setSelectedRoleId] = useState<string>(initialRoles[0]?.id || "")
    const [rolePermissions, setRolePermissions] = useState<Record<string, string[]>>(initialRolePermissions)
    const [isCreateOpen, setIsCreateOpen] = useState(false)
    const [editingRole, setEditingRole] = useState<RoleItem | null>(null)
    const [isPending, startTransition] = useTransition()

    const selectedRole = roles.find(r => r.id === selectedRoleId)
    const currentPerms = rolePermissions[selectedRoleId] || []

    const handleTogglePermission = (code: string) => {
        if (selectedRole?.name === "SuperAdminBP") {
            toast.info("Super Admin secara otomatis memiliki seluruh hak akses tanpa batas.")
            return
        }

        setRolePermissions(prev => {
            const list = prev[selectedRoleId] || []
            const exists = list.includes(code)
            const updated = exists ? list.filter(c => c !== code) : [...list, code]
            return { ...prev, [selectedRoleId]: updated }
        })
    }

    const handleToggleModuleAll = (moduleKey: string) => {
        if (selectedRole?.name === "SuperAdminBP") return
        const modulePerms = groupedPermissions[moduleKey] || []
        const moduleCodes = modulePerms.map(p => p.code)

        setRolePermissions(prev => {
            const list = prev[selectedRoleId] || []
            const allSelected = moduleCodes.every(c => list.includes(c))
            const updated = allSelected
                ? list.filter(c => !moduleCodes.includes(c))
                : Array.from(new Set([...list, ...moduleCodes]))
            return { ...prev, [selectedRoleId]: updated }
        })
    }

    const handleSavePermissions = () => {
        if (!selectedRoleId) return
        startTransition(async () => {
            const result = await updateRolePermissions(selectedRoleId, currentPerms)
            if (result.success) {
                toast.success(`Hak akses role "${selectedRole?.label}" berhasil disimpan! (${result.count} izin aktif)`)
                // Update local count
                setRoles(prev => prev.map(r => r.id === selectedRoleId ? {
                    ...r,
                    _count: { ...r._count, permissions: result.count || 0 }
                } : r))
            } else {
                toast.error(result.error || "Gagal menyimpan hak akses.")
            }
        })
    }

    const handleCreateRole = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const formData = new FormData(e.currentTarget)
        startTransition(async () => {
            const result = await createRole(formData)
            if (result.success && result.role) {
                toast.success(`Role "${result.role.label}" berhasil dibuat!`)
                const newRole: RoleItem = {
                    ...result.role,
                    _count: { permissions: 0, users: 0 }
                }
                setRoles(prev => [...prev, newRole])
                setSelectedRoleId(newRole.id)
                setRolePermissions(prev => ({ ...prev, [newRole.id]: [] }))
                setIsCreateOpen(false)
            } else {
                toast.error(result.error || "Gagal membuat role.")
            }
        })
    }

    const handleUpdateRole = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        if (!editingRole) return
        const formData = new FormData(e.currentTarget)
        startTransition(async () => {
            const result = await updateRole(editingRole.id, formData)
            if (result.success) {
                toast.success(`Role "${editingRole.label}" berhasil diperbarui!`)
                const label = formData.get("label") as string
                const scope = formData.get("scope") as "ALL_BRANCHES" | "OWN_BRANCH"
                const description = formData.get("description") as string
                setRoles(prev => prev.map(r => r.id === editingRole.id ? {
                    ...r,
                    label,
                    scope,
                    description,
                } : r))
                setEditingRole(null)
            } else {
                toast.error(result.error || "Gagal memperbarui role.")
            }
        })
    }

    const handleDeleteRole = (role: RoleItem) => {
        if (confirm(`Yakin ingin menghapus role "${role.label}"?`)) {
            startTransition(async () => {
                const result = await deleteRole(role.id)
                if (result.success) {
                    toast.success(`Role "${role.label}" berhasil dihapus.`)
                    setRoles(prev => prev.filter(r => r.id !== role.id))
                    if (selectedRoleId === role.id) {
                        setSelectedRoleId(roles[0]?.id || "")
                    }
                } else {
                    toast.error(result.error || "Gagal menghapus role.")
                }
            })
        }
    }

    return (
        <div className="space-y-6">
            {/* Header Title & Actions */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                        <Shield className="h-8 w-8 text-primary" />
                        Manajemen Role & Izin Akses (RBAC)
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Atur peran pengguna dan kendalikan matriks izin akses per modul operasional.
                    </p>
                </div>
                <Button onClick={() => setIsCreateOpen(true)} className="gap-2 shadow-sm">
                    <Plus className="h-4 w-4" />
                    Tambah Role Baru
                </Button>
            </div>

            {/* Layout: Left column = Role selector, Right column = Permission Matrix */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Role List (Cards) */}
                <div className="lg:col-span-4 xl:col-span-3 space-y-3">
                    <div className="flex items-center justify-between pb-1">
                        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
                            Pilih Role ({roles.length})
                        </h2>
                    </div>

                    <div className="space-y-2">
                        {roles.map(role => {
                            const isSelected = role.id === selectedRoleId
                            return (
                                <div
                                    key={role.id}
                                    onClick={() => setSelectedRoleId(role.id)}
                                    className={`p-4 rounded-xl border transition-all cursor-pointer relative ${
                                        isSelected
                                            ? "bg-white border-primary shadow-md ring-1 ring-primary/20"
                                            : "bg-white/80 border-slate-200 hover:border-slate-300 hover:bg-white"
                                    }`}
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-slate-900 text-sm">
                                                    {role.label}
                                                </span>
                                                {role.isSystem && (
                                                    <span title="Role sistem bawaan" className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-medium flex items-center gap-1">
                                                        <Lock className="w-2.5 h-2.5" /> Sistem
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                                                {role.description || "Tidak ada deskripsi."}
                                            </p>
                                        </div>

                                        {!role.isSystem && (
                                            <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-7 w-7 text-slate-400 hover:text-slate-600"
                                                    onClick={() => setEditingRole(role)}
                                                >
                                                    <Edit2 className="h-3.5 w-3.5" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-7 w-7 text-rose-400 hover:text-rose-600"
                                                    onClick={() => handleDeleteRole(role)}
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </Button>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100 text-xs">
                                        <div className="flex items-center gap-1.5 text-slate-500">
                                            {role.scope === "ALL_BRANCHES" ? (
                                                <Badge variant="outline" className="text-[10px] bg-purple-50 text-purple-700 border-purple-200 flex items-center gap-1 font-normal">
                                                    <Globe className="w-3 h-3" /> Semua Cabang
                                                </Badge>
                                            ) : (
                                                <Badge variant="outline" className="text-[10px] bg-blue-50 text-blue-700 border-blue-200 flex items-center gap-1 font-normal">
                                                    <Building2 className="w-3 h-3" /> Cabang Sendiri
                                                </Badge>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-2 text-[11px] text-slate-500 font-medium">
                                            <span className="flex items-center gap-1">
                                                <Users className="w-3 h-3 text-slate-400" />
                                                {role._count.users} User
                                            </span>
                                            <span>•</span>
                                            <span>{role._count.permissions} Izin</span>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* Permission Matrix (Center/Right) */}
                <div className="lg:col-span-8 xl:col-span-9">
                    {selectedRole ? (
                        <Card className="shadow-sm border-slate-200">
                            <CardHeader className="bg-slate-50/60 border-b pb-4">
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <CardTitle className="text-xl font-bold text-slate-900">
                                                Hak Akses: {selectedRole.label}
                                            </CardTitle>
                                            <Badge variant={selectedRole.scope === "ALL_BRANCHES" ? "default" : "secondary"}>
                                                {selectedRole.scope === "ALL_BRANCHES" ? "Global HO" : "Terbatas Cabang"}
                                            </Badge>
                                        </div>
                                        <CardDescription className="mt-1">
                                            Kode sistem: <code className="text-xs bg-slate-200/80 px-1.5 py-0.5 rounded font-semibold text-slate-700">{selectedRole.name}</code>
                                            {" • "}
                                            {currentPerms.length} izin aktif
                                        </CardDescription>
                                    </div>

                                    <Button
                                        onClick={handleSavePermissions}
                                        disabled={isPending || selectedRole.name === "SuperAdminBP"}
                                        className="gap-2 shadow-sm min-w-[150px]"
                                    >
                                        <Save className="h-4 w-4" />
                                        {isPending ? "Menyimpan..." : "Simpan Hak Akses"}
                                    </Button>
                                </div>
                            </CardHeader>

                            <CardContent className="p-0 divide-y divide-slate-100">
                                {selectedRole.name === "SuperAdminBP" && (
                                    <div className="p-4 bg-purple-50/60 border-b border-purple-100 text-purple-800 text-xs flex items-center gap-2 font-medium">
                                        <ShieldCheck className="h-4 w-4 text-purple-600 shrink-0" />
                                        <span>Role <strong>Super Admin</strong> secara otomatis memiliki hak akses penuh ke seluruh modul sistem (full bypass).</span>
                                    </div>
                                )}

                                {Object.entries(groupedPermissions).map(([moduleKey, permissions]) => {
                                    const meta = MODULE_LABELS[moduleKey] || { title: moduleKey, desc: "" }
                                    const moduleCodes = permissions.map(p => p.code)
                                    const allChecked = moduleCodes.every(c => currentPerms.includes(c))
                                    const someChecked = moduleCodes.some(c => currentPerms.includes(c))

                                    return (
                                        <div key={moduleKey} className="p-5 hover:bg-slate-50/40 transition-colors">
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                                                <div>
                                                    <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                                                        {meta.title}
                                                    </h3>
                                                    {meta.desc && (
                                                        <p className="text-xs text-slate-500 mt-0.5">{meta.desc}</p>
                                                    )}
                                                </div>

                                                {selectedRole.name !== "SuperAdminBP" && (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleToggleModuleAll(moduleKey)}
                                                        className="text-xs text-primary hover:underline font-medium flex items-center gap-1 self-start sm:self-auto"
                                                    >
                                                        {allChecked ? (
                                                            <>
                                                                <Square className="h-3.5 w-3.5" /> Hapus Semua
                                                            </>
                                                        ) : (
                                                            <>
                                                                <CheckSquare className="h-3.5 w-3.5" /> Pilih Semua
                                                            </>
                                                        )}
                                                    </button>
                                                )}
                                            </div>

                                            {/* Action Checkboxes */}
                                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 pt-1">
                                                {permissions.map(perm => {
                                                    const isChecked = selectedRole.name === "SuperAdminBP" || currentPerms.includes(perm.code)
                                                    return (
                                                        <label
                                                            key={perm.code}
                                                            className={`flex items-start gap-2.5 p-2.5 rounded-lg border text-xs cursor-pointer transition-all ${
                                                                isChecked
                                                                    ? "bg-primary/5 border-primary/40 text-slate-900 font-medium shadow-xs"
                                                                    : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                                                            } ${selectedRole.name === "SuperAdminBP" ? "cursor-not-allowed opacity-80" : ""}`}
                                                        >
                                                            <input
                                                                type="checkbox"
                                                                checked={isChecked}
                                                                disabled={selectedRole.name === "SuperAdminBP"}
                                                                onChange={() => handleTogglePermission(perm.code)}
                                                                className="mt-0.5 rounded border-slate-300 text-primary focus:ring-primary h-3.5 w-3.5"
                                                            />
                                                            <div className="flex-1">
                                                                <div className="font-semibold capitalize">
                                                                    {ACTION_LABELS[perm.action] || perm.action}
                                                                </div>
                                                                <div className="text-[10px] text-slate-400 font-normal leading-tight mt-0.5">
                                                                    {perm.name}
                                                                </div>
                                                            </div>
                                                        </label>
                                                    )
                                                })}
                                            </div>
                                        </div>
                                    )
                                })}
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="text-center p-12 bg-white rounded-xl border border-slate-200 text-slate-500">
                            Pilih role di sebelah kiri untuk melihat dan mengatur hak aksesnya.
                        </div>
                    )}
                </div>

            </div>

            {/* Modal Tambah Role Baru */}
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogContent className="sm:max-w-[480px]">
                    <form onSubmit={handleCreateRole} className="space-y-4">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <Plus className="h-5 w-5 text-primary" />
                                Tambah Role Baru
                            </DialogTitle>
                            <DialogDescription>
                                Buat peran kustom baru dan tentukan cakupan wilayah operasionalnya.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-3 py-2">
                            <div className="space-y-1.5">
                                <Label htmlFor="label">Nama Tampilan Role *</Label>
                                <Input id="label" name="label" placeholder="Contoh: Staf Keuangan Cabang" required />
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="name">Kode Unik Role *</Label>
                                <Input id="name" name="name" placeholder="Contoh: FinanceCabang" required />
                                <p className="text-[11px] text-slate-400">Hanya gunakan huruf dan angka tanpa spasi.</p>
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="scope">Cakupan Wilayah Data (Scope) *</Label>
                                <Select name="scope" defaultValue="OWN_BRANCH">
                                    <SelectTrigger>
                                        <SelectValue placeholder="Pilih Scope" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="OWN_BRANCH">
                                            Cabang Sendiri (Terbatas pada lokasi kerja pengguna)
                                        </SelectItem>
                                        <SelectItem value="ALL_BRANCHES">
                                            Semua Cabang (Akses global lintas cabang / Head Office)
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="description">Deskripsi</Label>
                                <Textarea id="description" name="description" placeholder="Jelaskan wewenang dan tanggung jawab role ini..." rows={3} />
                            </div>
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                                Batal
                            </Button>
                            <Button type="submit" disabled={isPending}>
                                {isPending ? "Menyimpan..." : "Buat Role"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Modal Edit Role */}
            <Dialog open={!!editingRole} onOpenChange={(open) => !open && setEditingRole(null)}>
                <DialogContent className="sm:max-w-[480px]">
                    {editingRole && (
                        <form onSubmit={handleUpdateRole} className="space-y-4">
                            <DialogHeader>
                                <DialogTitle className="flex items-center gap-2">
                                    <Edit2 className="h-5 w-5 text-primary" />
                                    Edit Role: {editingRole.label}
                                </DialogTitle>
                                <DialogDescription>
                                    Perbarui nama tampilan dan cakupan data role ini.
                                </DialogDescription>
                            </DialogHeader>

                            <div className="space-y-3 py-2">
                                <div className="space-y-1.5">
                                    <Label htmlFor="edit-label">Nama Tampilan Role *</Label>
                                    <Input id="edit-label" name="label" defaultValue={editingRole.label} required />
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="edit-name">Kode Unik Role</Label>
                                    <Input id="edit-name" name="name" defaultValue={editingRole.name} disabled={editingRole.isSystem} required />
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="edit-scope">Cakupan Wilayah Data (Scope) *</Label>
                                    <Select name="scope" defaultValue={editingRole.scope}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Pilih Scope" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="OWN_BRANCH">
                                                Cabang Sendiri (Terbatas pada lokasi kerja pengguna)
                                            </SelectItem>
                                            <SelectItem value="ALL_BRANCHES">
                                                Semua Cabang (Akses global lintas cabang / Head Office)
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="edit-description">Deskripsi</Label>
                                    <Textarea id="edit-description" name="description" defaultValue={editingRole.description || ""} rows={3} />
                                </div>
                            </div>

                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setEditingRole(null)}>
                                    Batal
                                </Button>
                                <Button type="submit" disabled={isPending}>
                                    {isPending ? "Menyimpan..." : "Simpan Perubahan"}
                                </Button>
                            </DialogFooter>
                        </form>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}
