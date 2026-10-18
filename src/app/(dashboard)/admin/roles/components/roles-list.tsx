"use client"

import React, { useState } from "react"
import { RoleItem } from "../types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Crown, Lock, Building2, Globe, Users, Edit2, Trash2, Search, Copy } from "lucide-react"

interface RolesListProps {
    roles: RoleItem[]
    selectedRoleId: string
    onSelectRole: (roleId: string) => void
    onEditRole: (role: RoleItem) => void
    onDeleteRole: (role: RoleItem) => void
    onDuplicateRole: (role: RoleItem) => void
}

export function RolesList({
    roles,
    selectedRoleId,
    onSelectRole,
    onEditRole,
    onDeleteRole,
    onDuplicateRole,
}: RolesListProps) {
    const [searchRole, setSearchRole] = useState("")

    const filteredRoles = roles.filter(r =>
        r.label.toLowerCase().includes(searchRole.toLowerCase()) ||
        r.name.toLowerCase().includes(searchRole.toLowerCase()) ||
        (r.description && r.description.toLowerCase().includes(searchRole.toLowerCase()))
    )

    return (
        <div className="space-y-3 max-h-[calc(100vh-6rem)] overflow-y-auto pr-1 pb-4">
            <div className="flex items-center justify-between pb-1">
                <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
                    Daftar Role ({roles.length})
                </h2>
            </div>

            <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                    placeholder="Cari role..."
                    value={searchRole}
                    onChange={(e) => setSearchRole(e.target.value)}
                    className="pl-8 text-xs h-9 bg-white"
                />
            </div>

            <div className="space-y-2">
                {filteredRoles.map(role => {
                    const isSelected = role.id === selectedRoleId
                    return (
                        <div
                            key={role.id}
                            onClick={() => onSelectRole(role.id)}
                            className={`p-3.5 rounded-xl border transition-all cursor-pointer relative ${
                                isSelected
                                    ? "bg-white border-primary shadow-sm ring-1 ring-primary/25"
                                    : "bg-white/80 border-slate-200 hover:border-slate-300 hover:bg-white"
                            }`}
                        >
                            <div className="flex items-start justify-between gap-2">
                                <div className="space-y-0.5 min-w-0">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                        <span className="font-bold text-slate-900 text-sm">
                                            {role.label}
                                        </span>
                                        {role.name === "SuperAdminBP" ? (
                                            <span
                                                title="Super Admin HQ - Full Access Bypass"
                                                className="text-[10px] bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-extrabold px-1.5 py-0.5 rounded shadow-xs flex items-center gap-1"
                                            >
                                                <Crown className="w-2.5 h-2.5 fill-slate-950" /> Super HQ
                                            </span>
                                        ) : role.isSystem ? (
                                            <span
                                                title="Role sistem bawaan"
                                                className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-medium flex items-center gap-1"
                                            >
                                                <Lock className="w-2.5 h-2.5" /> Sistem
                                            </span>
                                        ) : null}
                                    </div>
                                    <p className="text-xs text-slate-500 line-clamp-2">
                                        {role.description || "Tidak ada deskripsi."}
                                    </p>
                                </div>

                                <div className="flex items-center gap-0.5 shrink-0" onClick={e => e.stopPropagation()}>
                                    {/* Duplikat role tersedia untuk semua role */}
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7 text-slate-400 hover:text-primary hover:bg-primary/10"
                                        title="Duplikat Role ini"
                                        onClick={() => onDuplicateRole(role)}
                                    >
                                        <Copy className="h-3.5 w-3.5" />
                                    </Button>

                                    {!role.isSystem && (
                                        <>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-7 w-7 text-slate-400 hover:text-slate-600"
                                                title="Edit Role"
                                                onClick={() => onEditRole(role)}
                                            >
                                                <Edit2 className="h-3.5 w-3.5" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-7 w-7 text-rose-400 hover:text-rose-600"
                                                title="Hapus Role"
                                                onClick={() => onDeleteRole(role)}
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </Button>
                                        </>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-slate-100 text-xs">
                                <div className="flex items-center gap-1.5 text-slate-500">
                                    {role.scope === "ALL_BRANCHES" ? (
                                        <Badge
                                            variant="outline"
                                            className="text-[10px] bg-purple-50 text-purple-700 border-purple-200 flex items-center gap-1 font-normal"
                                        >
                                            <Globe className="w-3 h-3" /> Semua Cabang
                                        </Badge>
                                    ) : (
                                        <Badge
                                            variant="outline"
                                            className="text-[10px] bg-blue-50 text-blue-700 border-blue-200 flex items-center gap-1 font-normal"
                                        >
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

                {filteredRoles.length === 0 && (
                    <div className="p-4 text-center text-xs text-slate-400 border border-dashed rounded-lg">
                        Tidak ada role yang cocok dengan pencarian.
                    </div>
                )}
            </div>
        </div>
    )
}
