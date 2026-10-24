"use client"

import React, { useState } from "react"
import { RoleItem, PermissionItem, MODULE_GROUPS, MODULE_LABELS, ACTION_LABELS } from "../types"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
    Save,
    Crown,
    CheckSquare,
    Square,
    Search,
    Factory,
    Mountain,
    ShoppingCart,
    Landmark,
    FileBarChart,
    Database,
    ChevronDown,
    ChevronRight,
    Copy,
    Check,
    Filter,
    LayoutGrid,
    List,
} from "lucide-react"

interface RolesPermissionMatrixProps {
    selectedRole: RoleItem
    groupedPermissions: Record<string, PermissionItem[]>
    currentPerms: string[]
    isPending: boolean
    onTogglePermission: (code: string) => void
    onToggleModuleAll: (moduleKey: string) => void
    onToggleGroupAll: (groupModules: string[], selectAll: boolean) => void
    onSavePermissions: () => void
    onDuplicateRole?: (role: RoleItem) => void
}

function getShortActionLabel(perm: PermissionItem): string {
    const code = perm.code
    if (code === "CRUSHER_BBM_CREATE") return "BBM Solar"
    if (code === "CRUSHER_MASTER_MANAGE") return "Master Sumber"
    if (code === "CRUSHER_WAGES_VIEW") return "Slip Upah"
    if (code === "CRUSHER_DAILY_CREATE") return "Catat Harian"
    if (code === "CRUSHER_DAILY_EDIT") return "Ubah Harian"
    if (code === "LOGISTIK_PERUSAHAAN_VIEW") return "Lihat KOP"
    if (code === "LOGISTIK_PERUSAHAAN_MANAGE") return "Kelola KOP"
    if (code === "FINANCE_CREDIT_PAY") return "Bayar Cicilan"
    if (code === "FINANCE_CREDIT_MANAGE") return "Kelola Kredit"
    if (code === "RBL_CLOSE") return "Tutup Buku"
    if (code === "RBL_CREATE") return "Buka Budget"
    if (code === "RBL_EXPORT") return "Export RBL"
    if (code === "SEWA_PRINT") return "Cetak DO"
    if (code === "RETASE_EXPORT") return "Rekap Gaji"

    switch (perm.action) {
        case "view": return "Lihat"
        case "create": return "Tambah"
        case "edit": return "Ubah"
        case "delete": return "Hapus"
        case "approve": return "Setujui"
        case "export": return "Export"
        case "print": return "Cetak"
        default: return ACTION_LABELS[perm.action] || perm.action
    }
}

export function RolesPermissionMatrix({
    selectedRole,
    groupedPermissions,
    currentPerms,
    isPending,
    onTogglePermission,
    onToggleModuleAll,
    onToggleGroupAll,
    onSavePermissions,
    onDuplicateRole,
}: RolesPermissionMatrixProps) {
    const [searchQuery, setSearchQuery] = useState("")
    const [onlyActive, setOnlyActive] = useState(false)
    const [viewMode, setViewMode] = useState<"compact" | "detailed">("compact")
    // Default minimize: all categories are collapsed by default
    const [openGroupIds, setOpenGroupIds] = useState<Record<string, boolean>>({})

    const isSuperAdmin = selectedRole.name === "SuperAdminBP"

    // Icon helper
    const getGroupIcon = (iconKey: string) => {
        switch (iconKey) {
            case "factory":
                return <Factory className="w-5 h-5 text-blue-600 shrink-0" />
            case "mountain":
                return <Mountain className="w-5 h-5 text-amber-600 shrink-0" />
            case "shopping-cart":
                return <ShoppingCart className="w-5 h-5 text-emerald-600 shrink-0" />
            case "landmark":
                return <Landmark className="w-5 h-5 text-purple-600 shrink-0" />
            case "file-bar-chart":
                return <FileBarChart className="w-5 h-5 text-sky-600 shrink-0" />
            case "database":
            default:
                return <Database className="w-5 h-5 text-slate-600 shrink-0" />
        }
    }

    const term = searchQuery.toLowerCase().trim()

    const toggleGroup = (groupId: string) => {
        setOpenGroupIds(prev => ({
            ...prev,
            [groupId]: !prev[groupId]
        }))
    }

    const handleExpandAll = () => {
        const allOpen: Record<string, boolean> = {}
        MODULE_GROUPS.forEach(g => {
            allOpen[g.id] = true
        })
        setOpenGroupIds(allOpen)
    }

    const handleCollapseAll = () => {
        setOpenGroupIds({})
    }

    // Filter permissions by search query and active toggle
    const filterPermissionsForModule = (moduleKey: string, permissions: PermissionItem[]) => {
        let list = permissions
        if (onlyActive) {
            list = list.filter(p => isSuperAdmin || currentPerms.includes(p.code))
        }
        if (!term) return list
        const meta = MODULE_LABELS[moduleKey] || { title: moduleKey, desc: "" }
        if (
            meta.title.toLowerCase().includes(term) ||
            meta.desc.toLowerCase().includes(term) ||
            moduleKey.toLowerCase().includes(term)
        ) {
            return list
        }
        return list.filter(
            p =>
                p.code.toLowerCase().includes(term) ||
                p.name.toLowerCase().includes(term) ||
                p.action.toLowerCase().includes(term) ||
                (p.description && p.description.toLowerCase().includes(term))
        )
    }

    return (
        <Card className="shadow-sm border-slate-200">
            {/* Header: Locked & Sticky below the 64px navbar */}
            <CardHeader className="sticky top-16 z-20 bg-white/95 backdrop-blur border-b pb-3.5 shadow-2xs">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div>
                        <div className="flex items-center gap-2 flex-wrap">
                            <CardTitle className="text-lg sm:text-xl font-bold text-slate-900">
                                Hak Akses: {selectedRole.label}
                            </CardTitle>
                            <Badge variant={selectedRole.scope === "ALL_BRANCHES" ? "default" : "secondary"}>
                                {selectedRole.scope === "ALL_BRANCHES" ? "Global HO (Semua Cabang)" : "Terbatas Cabang Sendiri"}
                            </Badge>
                        </div>
                        <CardDescription className="mt-1 flex items-center gap-2 flex-wrap text-xs">
                            <span>Kode: <code className="bg-slate-200/80 px-1.5 py-0.5 rounded font-semibold text-slate-700">{selectedRole.name}</code></span>
                            <span>•</span>
                            <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                {currentPerms.length} izin aktif
                            </span>
                        </CardDescription>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                        {onDuplicateRole && (
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => onDuplicateRole(selectedRole)}
                                className="gap-1.5 text-xs h-9 bg-white"
                            >
                                <Copy className="h-3.5 w-3.5" />
                                <span className="hidden sm:inline">Duplikat</span>
                            </Button>
                        )}

                        <Button
                            onClick={onSavePermissions}
                            disabled={isPending || isSuperAdmin}
                            className="gap-2 shadow-sm min-w-[140px] text-xs h-9"
                        >
                            <Save className="h-4 w-4" />
                            {isPending ? "Menyimpan..." : "Simpan Hak Akses"}
                        </Button>
                    </div>
                </div>

                {/* Toolbar: Search Bar + Active Filter + View Toggle + Expand/Collapse */}
                <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5 mt-3 pt-2.5 border-t border-slate-100">
                    <div className="relative flex-1">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <Input
                            placeholder="Cari izin / fungsi (misal: 'Perusahaan', 'PO', 'Crusher', 'Semen', 'Retase')..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 text-xs h-8.5 bg-white"
                        />
                    </div>

                    <div className="flex items-center gap-2 shrink-0 flex-wrap justify-between sm:justify-start">
                        {/* Filter Only Active */}
                        <Button
                            type="button"
                            variant={onlyActive ? "default" : "outline"}
                            size="sm"
                            onClick={() => setOnlyActive(!onlyActive)}
                            className={`text-xs h-8 gap-1.5 ${onlyActive ? "bg-slate-900 text-white" : "text-slate-600 bg-white"}`}
                        >
                            <Filter className="w-3 h-3" />
                            <span>Hanya Aktif ({currentPerms.length})</span>
                        </Button>

                        {/* View Mode Toggle */}
                        <div className="flex items-center border border-slate-200 rounded-lg p-0.5 bg-slate-50">
                            <button
                                type="button"
                                onClick={() => setViewMode("compact")}
                                title="Mode Ringkas (Tampilan Ringan & Cepat)"
                                className={`px-2 py-1 rounded text-xs font-medium flex items-center gap-1 transition-colors ${
                                    viewMode === "compact"
                                        ? "bg-white text-slate-900 shadow-2xs font-semibold"
                                        : "text-slate-500 hover:text-slate-800"
                                }`}
                            >
                                <List className="w-3 h-3" />
                                <span>Ringkas</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setViewMode("detailed")}
                                title="Mode Detail (Tampilan Kotak Rinci)"
                                className={`px-2 py-1 rounded text-xs font-medium flex items-center gap-1 transition-colors ${
                                    viewMode === "detailed"
                                        ? "bg-white text-slate-900 shadow-2xs font-semibold"
                                        : "text-slate-500 hover:text-slate-800"
                                }`}
                            >
                                <LayoutGrid className="w-3 h-3" />
                                <span>Rinci</span>
                            </button>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={handleExpandAll}
                                className="text-xs h-8 text-slate-600 hover:text-slate-900 px-2"
                            >
                                Buka Semua
                            </Button>
                            <span className="text-slate-300">|</span>
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={handleCollapseAll}
                                className="text-xs h-8 text-slate-600 hover:text-slate-900 px-2"
                            >
                                Tutup Semua
                            </Button>
                        </div>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="p-0 divide-y divide-slate-100">
                {isSuperAdmin && (
                    <div className="p-4 bg-gradient-to-r from-amber-50 via-yellow-50 to-amber-50/50 border-b border-amber-200 text-amber-950 text-xs flex items-center gap-2.5 font-medium">
                        <Crown className="h-5 w-5 text-amber-600 fill-amber-400 shrink-0" />
                        <div>
                            <span className="font-bold">Super Admin (HQ) - Akses Penuh:</span> Role ini memiliki hak akses tertinggi, bypass seluruh pembatasan cabang, dan akses otomatis ke seluruh modul sistem.
                        </div>
                    </div>
                )}

                {/* Render Each Module Group */}
                {MODULE_GROUPS.map(group => {
                    // Check modules in this group that have permissions
                    const groupModulesWithPerms = group.modules
                        .map(modKey => ({
                            moduleKey: modKey,
                            permissions: filterPermissionsForModule(modKey, groupedPermissions[modKey] || []),
                            allModulePerms: groupedPermissions[modKey] || [],
                        }))
                        .filter(item => item.permissions.length > 0)

                    if (groupModulesWithPerms.length === 0) {
                        return null
                    }

                    // Count total active perms in this category
                    const allPermCodesInGroup = groupModulesWithPerms.flatMap(m => m.allModulePerms.map(p => p.code))
                    const activeCountInGroup = allPermCodesInGroup.filter(c => currentPerms.includes(c)).length
                    const isAllGroupSelected = allPermCodesInGroup.length > 0 && allPermCodesInGroup.every(c => currentPerms.includes(c))

                    // Auto-open if search query or active filter is on and there are matches
                    const isOpen = term.length > 0 || onlyActive ? true : !!openGroupIds[group.id]

                    return (
                        <div key={group.id} className="p-3.5 sm:p-4 space-y-2.5">
                            {/* Group Banner / Accordion Header */}
                            <div
                                onClick={() => toggleGroup(group.id)}
                                className="flex flex-col md:flex-row md:items-center justify-between gap-2.5 p-3 bg-slate-50 hover:bg-slate-100/80 border border-slate-200/90 rounded-xl cursor-pointer transition-colors"
                            >
                                <div className="flex items-center gap-2.5">
                                    <div className="p-1 text-slate-500">
                                        {isOpen ? (
                                            <ChevronDown className="w-4 h-4" />
                                        ) : (
                                            <ChevronRight className="w-4 h-4" />
                                        )}
                                    </div>
                                    <div className="p-1.5 bg-white rounded-lg border border-slate-200 shadow-2xs">
                                        {getGroupIcon(group.iconKey)}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <h3 className="font-bold text-xs sm:text-sm text-slate-900">{group.title}</h3>
                                            <Badge variant="outline" className={`text-[10px] ${group.badgeColor}`}>
                                                {activeCountInGroup} / {allPermCodesInGroup.length} izin aktif
                                            </Badge>
                                        </div>
                                        <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                                            {group.description}
                                        </p>
                                    </div>
                                </div>

                                {!isSuperAdmin && (
                                    <div
                                        className="flex items-center gap-2 self-end md:self-center shrink-0"
                                        onClick={e => e.stopPropagation()}
                                    >
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => onToggleGroupAll(group.modules, !isAllGroupSelected)}
                                            className="text-xs h-7 gap-1.5 bg-white"
                                        >
                                            {isAllGroupSelected ? (
                                                <>
                                                    <Square className="h-3 w-3 text-rose-500" />
                                                    <span>Hapus Kategori</span>
                                                </>
                                            ) : (
                                                <>
                                                    <CheckSquare className="h-3 w-3 text-primary" />
                                                    <span>Pilih Semua Kategori</span>
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                )}
                            </div>

                            {/* Modules inside group: only shown when expanded */}
                            {isOpen && (
                                <div className="pl-1 sm:pl-3 pt-0.5 animate-in fade-in-50 duration-200">
                                    {viewMode === "compact" ? (
                                        /* COMPACT STREAMLINED VIEW (DEFAULT) */
                                        <div className="divide-y divide-slate-100 border border-slate-200/80 rounded-xl bg-white overflow-hidden shadow-2xs">
                                            {groupModulesWithPerms.map(({ moduleKey, permissions, allModulePerms }) => {
                                                const meta = MODULE_LABELS[moduleKey] || { title: moduleKey, desc: "" }
                                                const moduleCodes = allModulePerms.map(p => p.code)
                                                const allChecked = moduleCodes.length > 0 && moduleCodes.every(c => currentPerms.includes(c))
                                                const activeCount = moduleCodes.filter(c => currentPerms.includes(c)).length

                                                return (
                                                    <div
                                                        key={moduleKey}
                                                        className="p-2.5 sm:px-3.5 sm:py-2.5 hover:bg-slate-50/70 transition-colors flex flex-col lg:flex-row lg:items-center justify-between gap-2"
                                                    >
                                                        {/* Left: Module title & description */}
                                                        <div className="min-w-0 flex-1 pr-2">
                                                            <div className="flex items-center gap-2 flex-wrap">
                                                                <span className="font-semibold text-xs sm:text-[13px] text-slate-900">{meta.title}</span>
                                                                <code className="text-[10px] text-slate-500 font-mono font-normal bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200/60">
                                                                    {moduleKey}
                                                                </code>
                                                                <span className={`text-[11px] font-medium ${activeCount > 0 ? "text-emerald-700 font-semibold" : "text-slate-400"}`}>
                                                                    • {activeCount}/{moduleCodes.length} aktif
                                                                </span>
                                                            </div>
                                                            {meta.desc && (
                                                                <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">{meta.desc}</p>
                                                            )}
                                                        </div>

                                                        {/* Right: Actions Pills + Select All shortcut */}
                                                        <div className="flex items-center gap-1.5 flex-wrap shrink-0">
                                                            {permissions.map(perm => {
                                                                const isChecked = isSuperAdmin || currentPerms.includes(perm.code)
                                                                const isSpecial = perm.code.includes("PERUSAHAAN") || perm.code.includes("WAGES") || perm.code.includes("CLOSE")

                                                                return (
                                                                    <button
                                                                        key={perm.code}
                                                                        type="button"
                                                                        disabled={isSuperAdmin}
                                                                        onClick={() => onTogglePermission(perm.code)}
                                                                        title={`${perm.name} (${perm.code})`}
                                                                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs border transition-all cursor-pointer ${
                                                                            isChecked
                                                                                ? isSpecial
                                                                                    ? "bg-amber-50 text-amber-900 border-amber-300 font-semibold shadow-2xs ring-1 ring-amber-300/40"
                                                                                    : "bg-emerald-50 text-emerald-800 border-emerald-300 font-semibold shadow-2xs ring-1 ring-emerald-300/40"
                                                                                : "bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:text-slate-900 hover:bg-slate-50"
                                                                        } ${isSuperAdmin ? "cursor-not-allowed opacity-80" : ""}`}
                                                                    >
                                                                        <span className={`w-3.5 h-3.5 rounded flex items-center justify-center text-[10px] shrink-0 border transition-colors ${
                                                                            isChecked
                                                                                ? isSpecial
                                                                                    ? "bg-amber-600 border-amber-600 text-white"
                                                                                    : "bg-emerald-600 border-emerald-600 text-white"
                                                                                : "border-slate-300 bg-white"
                                                                        }`}>
                                                                            {isChecked && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                                                                        </span>
                                                                        <span className="truncate">{getShortActionLabel(perm)}</span>
                                                                    </button>
                                                                )
                                                            })}

                                                            {!isSuperAdmin && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => onToggleModuleAll(moduleKey)}
                                                                    title={allChecked ? "Kosongkan semua izin di modul ini" : "Pilih semua izin di modul ini"}
                                                                    className="text-[11px] text-slate-500 hover:text-primary font-medium px-2 py-1 rounded hover:bg-slate-100 transition-colors shrink-0 ml-1 border border-transparent hover:border-slate-200"
                                                                >
                                                                    {allChecked ? "Kosongkan" : "Pilih Semua"}
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    ) : (
                                        /* DETAILED GRID VIEW (FOR DETAILED INSPECTION) */
                                        <div className="space-y-3">
                                            {groupModulesWithPerms.map(({ moduleKey, permissions, allModulePerms }) => {
                                                const meta = MODULE_LABELS[moduleKey] || { title: moduleKey, desc: "" }
                                                const moduleCodes = allModulePerms.map(p => p.code)
                                                const allChecked = moduleCodes.length > 0 && moduleCodes.every(c => currentPerms.includes(c))

                                                return (
                                                    <div
                                                        key={moduleKey}
                                                        className="p-3 sm:p-3.5 rounded-xl border border-slate-200/80 bg-white hover:border-slate-300 transition-colors space-y-2.5"
                                                    >
                                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 border-b border-slate-100 pb-2">
                                                            <div>
                                                                <h4 className="font-bold text-xs sm:text-sm text-slate-800 flex items-center gap-2">
                                                                    <span>{meta.title}</span>
                                                                    <code className="text-[10px] text-slate-400 font-mono font-normal">
                                                                        ({moduleKey})
                                                                    </code>
                                                                </h4>
                                                                {meta.desc && (
                                                                    <p className="text-[11px] text-slate-500 mt-0.5">{meta.desc}</p>
                                                                )}
                                                            </div>

                                                            {!isSuperAdmin && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => onToggleModuleAll(moduleKey)}
                                                                    className="text-xs text-primary hover:underline font-medium flex items-center gap-1 shrink-0"
                                                                >
                                                                    {allChecked ? (
                                                                        <>
                                                                            <Square className="h-3 w-3 text-rose-500" /> Hapus Modul
                                                                        </>
                                                                    ) : (
                                                                        <>
                                                                            <CheckSquare className="h-3 w-3" /> Pilih Modul
                                                                        </>
                                                                    )}
                                                                </button>
                                                            )}
                                                        </div>

                                                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 pt-0.5">
                                                            {permissions.map(perm => {
                                                                const isChecked = isSuperAdmin || currentPerms.includes(perm.code)
                                                                const isSpecialPerusahaan = perm.code.includes("PERUSAHAAN")

                                                                return (
                                                                    <label
                                                                        key={perm.code}
                                                                        className={`flex items-start gap-2 p-2 rounded-lg border text-xs cursor-pointer transition-all ${
                                                                            isChecked
                                                                                ? isSpecialPerusahaan
                                                                                    ? "bg-amber-50/70 border-amber-300 text-amber-950 font-medium shadow-2xs"
                                                                                    : "bg-emerald-50/70 border-emerald-300 text-emerald-950 font-medium shadow-2xs"
                                                                                : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                                                                        } ${isSuperAdmin ? "cursor-not-allowed opacity-80" : ""}`}
                                                                    >
                                                                        <input
                                                                            type="checkbox"
                                                                            checked={isChecked}
                                                                            disabled={isSuperAdmin}
                                                                            onChange={() => onTogglePermission(perm.code)}
                                                                            className="mt-0.5 rounded border-slate-300 text-primary focus:ring-primary h-3.5 w-3.5"
                                                                        />
                                                                        <div className="flex-1 min-w-0">
                                                                            <div className="flex items-center gap-1.5 flex-wrap">
                                                                                <span className="font-semibold capitalize">
                                                                                    {ACTION_LABELS[perm.action] || perm.action}
                                                                                </span>
                                                                                {isSpecialPerusahaan && (
                                                                                    <span className="text-[9px] bg-amber-100 text-amber-800 border border-amber-300 px-1 py-0.2 rounded font-bold">
                                                                                        KOP Surat
                                                                                    </span>
                                                                                )}
                                                                            </div>
                                                                            <div className="text-[10px] text-slate-500 font-normal leading-tight mt-0.5 truncate">
                                                                                {perm.name}
                                                                            </div>
                                                                            <div className="text-[9px] text-slate-400 font-mono mt-0.5">
                                                                                {perm.code}
                                                                            </div>
                                                                        </div>
                                                                    </label>
                                                                )
                                                            })}
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )
                })}
            </CardContent>
        </Card>
    )
}
