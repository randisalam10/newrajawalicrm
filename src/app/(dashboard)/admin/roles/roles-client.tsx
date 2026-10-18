"use client"

import React, { useState, useTransition } from "react"
import { RolesClientProps, RoleItem } from "./types"
import { RolesList } from "./components/roles-list"
import { RolesPermissionMatrix } from "./components/roles-permission-matrix"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Shield, Plus, Edit2, Copy, Check } from "lucide-react"
import { createRole, updateRole, deleteRole, updateRolePermissions, duplicateRole } from "./actions"
import { toast } from "sonner"

export function RolesClient({ roles: initialRoles, groupedPermissions, initialRolePermissions }: RolesClientProps) {
    const [roles, setRoles] = useState<RoleItem[]>(initialRoles)
    const [selectedRoleId, setSelectedRoleId] = useState<string>(initialRoles[0]?.id || "")
    const [rolePermissions, setRolePermissions] = useState<Record<string, string[]>>(initialRolePermissions)
    const [isCreateOpen, setIsCreateOpen] = useState(false)
    const [editingRole, setEditingRole] = useState<RoleItem | null>(null)
    const [duplicatingRoleState, setDuplicatingRoleState] = useState<RoleItem | null>(null)
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

    const handleToggleGroupAll = (groupModules: string[], selectAll: boolean) => {
        if (selectedRole?.name === "SuperAdminBP") return
        const allGroupCodes = groupModules.flatMap(m => (groupedPermissions[m] || []).map(p => p.code))

        setRolePermissions(prev => {
            const list = prev[selectedRoleId] || []
            const updated = selectAll
                ? Array.from(new Set([...list, ...allGroupCodes]))
                : list.filter(c => !allGroupCodes.includes(c))
            return { ...prev, [selectedRoleId]: updated }
        })
    }

    const handleSavePermissions = () => {
        if (!selectedRoleId) return
        startTransition(async () => {
            const result = await updateRolePermissions(selectedRoleId, currentPerms)
            if (result.success) {
                toast.success(`Hak akses role "${selectedRole?.label}" berhasil disimpan! (${result.count} izin aktif)`)
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

    const handleDuplicateRoleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        if (!duplicatingRoleState) return
        const sourceId = duplicatingRoleState.id
        const formData = new FormData(e.currentTarget)

        startTransition(async () => {
            const result = await duplicateRole(sourceId, formData)
            if (result.success && result.role) {
                toast.success(`Role "${result.role.label}" berhasil dibuat dengan menyalin ${result.permissionCount} izin!`)
                const newRole: RoleItem = {
                    ...result.role,
                    _count: { permissions: result.permissionCount || 0, users: 0 }
                }
                setRoles(prev => [...prev, newRole])
                setSelectedRoleId(newRole.id)
                setRolePermissions(prev => ({
                    ...prev,
                    [newRole.id]: [...(prev[sourceId] || [])]
                }))
                setDuplicatingRoleState(null)
            } else {
                toast.error(result.error || "Gagal menduplikasi role.")
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
        <div className="space-y-6 w-full">
            {/* Header Title & Actions */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2">
                        <Shield className="h-7 w-7 text-primary" />
                        Manajemen Role & Izin Akses (RBAC)
                    </h1>
                    <p className="text-muted-foreground mt-1 text-sm">
                        Atur peran pengguna dan kendalikan matriks izin akses per modul operasional (BP, Stone Crusher, Logistik, Keuangan).
                    </p>
                </div>
                <Button onClick={() => setIsCreateOpen(true)} className="gap-2 shadow-sm">
                    <Plus className="h-4 w-4" />
                    Tambah Role Baru
                </Button>
            </div>

            {/* Layout: Left column = Role selector (Locked/Sticky), Right column = Permission Matrix */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full">
                {/* Role List (Cards - Sticky locked on desktop) */}
                <div className="lg:col-span-4 xl:col-span-3 lg:sticky lg:top-20 self-start">
                    <RolesList
                        roles={roles}
                        selectedRoleId={selectedRoleId}
                        onSelectRole={setSelectedRoleId}
                        onEditRole={setEditingRole}
                        onDeleteRole={handleDeleteRole}
                        onDuplicateRole={setDuplicatingRoleState}
                    />
                </div>

                {/* Permission Matrix (Center/Right) */}
                <div className="lg:col-span-8 xl:col-span-9">
                    {selectedRole ? (
                        <RolesPermissionMatrix
                            selectedRole={selectedRole}
                            groupedPermissions={groupedPermissions}
                            currentPerms={currentPerms}
                            isPending={isPending}
                            onTogglePermission={handleTogglePermission}
                            onToggleModuleAll={handleToggleModuleAll}
                            onToggleGroupAll={handleToggleGroupAll}
                            onSavePermissions={handleSavePermissions}
                            onDuplicateRole={setDuplicatingRoleState}
                        />
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
                                <Input id="label" name="label" placeholder="Contoh: Staf Logistik Lapangan" required />
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="name">Kode Unik Role *</Label>
                                <Input id="name" name="name" placeholder="Contoh: LogistikLapangan" required />
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

            {/* Modal Duplikat Role */}
            <Dialog open={!!duplicatingRoleState} onOpenChange={(open) => !open && setDuplicatingRoleState(null)}>
                <DialogContent className="sm:max-w-[480px]">
                    {duplicatingRoleState && (
                        <form onSubmit={handleDuplicateRoleSubmit} className="space-y-4">
                            <DialogHeader>
                                <DialogTitle className="flex items-center gap-2">
                                    <Copy className="h-5 w-5 text-primary" />
                                    Duplikat Role: {duplicatingRoleState.label}
                                </DialogTitle>
                                <DialogDescription>
                                    Buat role baru berdasarkan konfigurasi role ini. Seluruh {duplicatingRoleState._count.permissions} izin akses akan disalin otomatis.
                                </DialogDescription>
                            </DialogHeader>

                            <div className="space-y-3 py-2">
                                <div className="space-y-1.5">
                                    <Label htmlFor="dup-label">Nama Tampilan Role Baru *</Label>
                                    <Input
                                        id="dup-label"
                                        name="label"
                                        defaultValue={`[Salinan] ${duplicatingRoleState.label}`}
                                        required
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="dup-name">Kode Unik Role Baru *</Label>
                                    <Input
                                        id="dup-name"
                                        name="name"
                                        defaultValue={`${duplicatingRoleState.name}_Copy`}
                                        required
                                    />
                                    <p className="text-[11px] text-slate-400">Hanya gunakan huruf dan angka tanpa spasi.</p>
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="dup-scope">Cakupan Wilayah Data (Scope) *</Label>
                                    <Select name="scope" defaultValue={duplicatingRoleState.scope}>
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
                                    <Label htmlFor="dup-description">Deskripsi</Label>
                                    <Textarea
                                        id="dup-description"
                                        name="description"
                                        defaultValue={`Salinan konfigurasi dari role ${duplicatingRoleState.label}.`}
                                        rows={3}
                                    />
                                </div>

                                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-900 flex items-start gap-2">
                                    <Check className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                                    <span>
                                        Seluruh <strong>{duplicatingRoleState._count.permissions} izin aktif</strong> dari role sumber akan langsung diterapkan ke role baru ini. Anda dapat mengubahnya setelah disimpan.
                                    </span>
                                </div>
                            </div>

                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setDuplicatingRoleState(null)}>
                                    Batal
                                </Button>
                                <Button type="submit" disabled={isPending} className="gap-2">
                                    <Copy className="h-4 w-4" />
                                    {isPending ? "Menduplikasi..." : "Duplikat & Buat Role"}
                                </Button>
                            </DialogFooter>
                        </form>
                    )}
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
