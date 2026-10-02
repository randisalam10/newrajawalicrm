"use client"

import React from "react"
import { Filter } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { PlanStatus } from "../types"
import { STATUS_CONFIG } from "../constants"

interface PlanningFilterBarProps {
    searchText: string
    setSearchText: (v: string) => void
    filterStatus: PlanStatus | "All"
    setFilterStatus: (v: PlanStatus | "All") => void
    filterDateFrom: string
    setFilterDateFrom: (v: string) => void
    filterDateTo: string
    setFilterDateTo: (v: string) => void
    onReset: () => void
}

export function PlanningFilterBar({
    searchText,
    setSearchText,
    filterStatus,
    setFilterStatus,
    filterDateFrom,
    setFilterDateFrom,
    filterDateTo,
    setFilterDateTo,
    onReset,
}: PlanningFilterBarProps) {
    const isFiltered = filterStatus !== "All" || filterDateFrom || filterDateTo || searchText

    return (
        <div className="px-5 pb-4 border-t pt-3 flex flex-wrap gap-3 items-center">
            <Filter className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <Input
                id="plan-search"
                placeholder="Cari proyek, customer, mutu..."
                className="h-8 text-sm w-48"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
            />
            <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as any)}>
                <SelectTrigger className="h-8 text-sm w-36" id="plan-filter-status">
                    <SelectValue placeholder="Semua Status" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="All">Semua Status</SelectItem>
                    {(Object.keys(STATUS_CONFIG) as PlanStatus[]).map((s) => (
                        <SelectItem key={s} value={s}>{STATUS_CONFIG[s].label}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
            <div className="flex items-center gap-1.5">
                <Input
                    id="plan-filter-from"
                    type="date"
                    className="h-8 text-sm w-36"
                    value={filterDateFrom}
                    onChange={(e) => setFilterDateFrom(e.target.value)}
                />
                <span className="text-slate-400 text-xs">s/d</span>
                <Input
                    id="plan-filter-to"
                    type="date"
                    className="h-8 text-sm w-36"
                    value={filterDateTo}
                    onChange={(e) => setFilterDateTo(e.target.value)}
                />
            </div>
            {isFiltered && (
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 text-xs text-slate-500"
                    onClick={onReset}
                >
                    Reset
                </Button>
            )}
        </div>
    )
}
