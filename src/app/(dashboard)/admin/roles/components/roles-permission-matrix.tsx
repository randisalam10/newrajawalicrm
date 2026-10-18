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
    ChevronsUpDown,
    Copy
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

    // Filter permissions by search query
    const filterPermissionsForModule = (moduleKey: string, permissions: PermissionItem[]) => {
        if (!term) return permissions
        const meta = MODULE_LABELS[moduleKey] || { title: moduleKey, desc: "" }
        if (
            meta.title.toLowerCase().includes(term) ||
            meta.desc.toLowerCase().includes(term) ||
            moduleKey.toLowerCase().includes(term)
        ) {
            return permissions
        }
        return permissions.filter(
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
            <CardHeader className="sticky top-16 z-20 bg-white/95 backdrop-blur border-b pb-4 shadow-2xs">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <div className="flex items-center gap-2 flex-wrap">
                            <CardTitle className="text-xl font-bold text-slate-900">
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
                                className="gap-1.5 text-xs h-9 text-slate-700"
                                title="Duplikat role ini sebagai dasar role baru"
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

                {/* Toolbar: Search Bar + Expand/Collapse All */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 mt-3 pt-2 border-t border-slate-100">
                    <div className="relative flex-1">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <Input
                            placeholder="Cari izin / fungsi (misal: 'Perusahaan', 'PO', 'Crusher', 'Semen', 'Retase')..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 text-xs h-9 bg-white"
                        />
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={handleExpandAll}
                            className="text-xs h-8 text-slate-600 hover:text-slate-900"
                        >
                            Buka Semua
                        </Button>
                        <span className="text-slate-300">|</span>
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={handleCollapseAll}
                            className="text-xs h-8 text-slate-600 hover:text-slate-900"
                        >
                            Tutup Semua
                        </Button>
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

                    // Auto-open if search query is active and there are matches, otherwise obey state
                    const isOpen = term.length > 0 ? true : !!openGroupIds[group.id]

                    return (
                        <div key={group.id} className="p-4 sm:p-5 space-y-3">
                            {/* Group Banner / Accordion Header */}
                            <div
                                onClick={() => toggleGroup(group.id)}
                                className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-3.5 bg-slate-50 hover:bg-slate-100/80 border border-slate-200/90 rounded-xl cursor-pointer transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="p-1 text-slate-500">
                                        {isOpen ? (
                                            <ChevronDown className="w-4 h-4" />
                                        ) : (
                                            <ChevronRight className="w-4 h-4" />
                                        )}
                                    </div>
                                    <div className="p-2 bg-white rounded-lg border border-slate-200 shadow-2xs">
                                        {getGroupIcon(group.iconKey)}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <h3 className="font-bold text-sm text-slate-900">{group.title}</h3>
                                            <Badge variant="outline" className={`text-[10px] ${group.badgeColor}`}>
                                                {activeCountInGroup} / {allPermCodesInGroup.length} izin aktif
                                            </Badge>
                                        </div>
                                        <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
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
                                <div className="space-y-3.5 pl-2 sm:pl-4 pt-1 animate-in fade-in-50 duration-200">
                                    {groupModulesWithPerms.map(({ moduleKey, permissions, allModulePerms }) => {
                                        const meta = MODULE_LABELS[moduleKey] || { title: moduleKey, desc: "" }
                                        const moduleCodes = allModulePerms.map(p => p.code)
                                        const allChecked = moduleCodes.length > 0 && moduleCodes.every(c => currentPerms.includes(c))

                                        return (
                                            <div
                                                key={moduleKey}
                                                className="p-3.5 sm:p-4 rounded-xl border border-slate-200/80 bg-white hover:border-slate-300 transition-colors space-y-3"
                                            >
                                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                                                    <div>
                                                        <h4 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                                                            <span>{meta.title}</span>
                                                            <code className="text-[10px] text-slate-400 font-mono font-normal">
                                                                ({moduleKey})
                                                            </code>
                                                        </h4>
                                                        {meta.desc && (
                                                            <p className="text-xs text-slate-500 mt-0.5">{meta.desc}</p>
                                                        )}
                                                    </div>

                                                    {!isSuperAdmin && (
                                                        <button
                                                            type="button"
                                                            onClick={() => onToggleModuleAll(moduleKey)}
                                                            className="text-xs text-primary hover:underline font-medium flex items-center gap-1 self-start sm:self-auto shrink-0"
                                                        >
                                                            {allChecked ? (
                                                                <>
                                                                    <Square className="h-3.5 w-3.5 text-rose-500" /> Hapus Modul
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <CheckSquare className="h-3.5 w-3.5" /> Pilih Modul
                                                                </>
                                                            )}
                                                        </button>
                                                    )}
                                                </div>

                                                {/* Action Checkboxes */}
                                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 pt-1">
                                                    {permissions.map(perm => {
                                                        const isChecked = isSuperAdmin || currentPerms.includes(perm.code)
                                                        const isSpecialPerusahaan = perm.code.includes("PERUSAHAAN")

                                                        return (
                                                            <label
                                                                key={perm.code}
                                                                className={`flex items-start gap-2.5 p-2.5 rounded-lg border text-xs cursor-pointer transition-all ${
                                                                    isChecked
                                                                        ? isSpecialPerusahaan
                                                                            ? "bg-amber-50/70 border-amber-300 text-amber-950 font-medium shadow-2xs"
                                                                            : "bg-primary/5 border-primary/40 text-slate-900 font-medium shadow-2xs"
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
                    )
                })}
            </CardContent>
        </Card>
    )
}
