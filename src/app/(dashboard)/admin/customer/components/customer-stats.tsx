"use client"

import React from "react"
import { CustomerStats, ProjectFilterStatus } from "../types"
import { Users, Building2, AlertCircle, CheckCircle2 } from "lucide-react"

interface CustomerStatsProps {
    stats: CustomerStats
    currentFilter: ProjectFilterStatus
    onSelectFilter: (status: ProjectFilterStatus) => void
}

export function CustomerStatsCards({ stats, currentFilter, onSelectFilter }: CustomerStatsProps) {
    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {/* 1. Total Customer */}
            <div
                onClick={() => onSelectFilter("ALL")}
                className={`p-3.5 rounded-lg border bg-white transition-all cursor-pointer shadow-sm hover:shadow ${
                    currentFilter === "ALL"
                        ? "border-blue-500 ring-1 ring-blue-500/20"
                        : "border-slate-200 hover:border-slate-300"
                }`}
            >
                <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-500">Total Customer</span>
                    <div className="h-7 w-7 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center">
                        <Users className="h-4 w-4" />
                    </div>
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-xl font-bold text-slate-800">{stats.totalCustomers}</span>
                    <span className="text-[11px] text-slate-400">pelanggan</span>
                </div>
            </div>

            {/* 2. Total Proyek */}
            <div
                onClick={() => onSelectFilter("WITH_PROJECTS")}
                className={`p-3.5 rounded-lg border bg-white transition-all cursor-pointer shadow-sm hover:shadow ${
                    currentFilter === "WITH_PROJECTS"
                        ? "border-emerald-500 ring-1 ring-emerald-500/20"
                        : "border-slate-200 hover:border-slate-300"
                }`}
            >
                <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-500">Total Proyek</span>
                    <div className="h-7 w-7 rounded-md bg-emerald-50 text-emerald-600 flex items-center justify-center">
                        <Building2 className="h-4 w-4" />
                    </div>
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-xl font-bold text-slate-800">{stats.totalProjects}</span>
                    <span className="text-[11px] text-slate-400">dari {stats.customersWithProjects} customer</span>
                </div>
            </div>

            {/* 3. Proyek Siap / Ada Harga */}
            <div className="p-3.5 rounded-lg border border-slate-200 bg-white shadow-sm">
                <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-500">Proyek Berharga</span>
                    <div className="h-7 w-7 rounded-md bg-slate-50 text-emerald-600 flex items-center justify-center">
                        <CheckCircle2 className="h-4 w-4" />
                    </div>
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-xl font-bold text-slate-800">{stats.projectsWithPrices}</span>
                    <span className="text-[11px] text-slate-400">telah di-set tarif</span>
                </div>
            </div>

            {/* 4. Perlu Perhatian / Belum Ada Harga / Tanpa Proyek */}
            <div
                onClick={() =>
                    onSelectFilter(
                        stats.projectsWithoutPrices > 0 ? "NEEDS_PRICING" : "WITHOUT_PROJECTS"
                    )
                }
                className={`p-3.5 rounded-lg border bg-white transition-all cursor-pointer shadow-sm hover:shadow ${
                    currentFilter === "NEEDS_PRICING" || currentFilter === "WITHOUT_PROJECTS"
                        ? "border-amber-500 ring-1 ring-amber-500/20"
                        : "border-slate-200 hover:border-slate-300"
                }`}
            >
                <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-500">Perlu Pengaturan</span>
                    <div className="h-7 w-7 rounded-md bg-amber-50 text-amber-600 flex items-center justify-center">
                        <AlertCircle className="h-4 w-4" />
                    </div>
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-xl font-bold text-amber-700">
                        {stats.projectsWithoutPrices}
                    </span>
                    <span className="text-[11px] text-slate-500">
                        proyek belum ada tarif
                        {stats.customersWithoutProjects > 0 && ` (${stats.customersWithoutProjects} tanpa proyek)`}
                    </span>
                </div>
            </div>
        </div>
    )
}
