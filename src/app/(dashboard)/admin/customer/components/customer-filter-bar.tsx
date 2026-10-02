"use client"

import React from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Search, Plus, RotateCcw } from "lucide-react"
import { LocationItem, ProjectFilterStatus } from "../types"

interface CustomerFilterBarProps {
    search: string
    onSearchChange: (val: string) => void
    locationId: string
    onLocationChange: (val: string) => void
    projectStatus: ProjectFilterStatus
    onProjectStatusChange: (val: ProjectFilterStatus) => void
    locations: LocationItem[]
    isCorporate: boolean
    filteredCount: number
    totalCount: number
    hasActiveFilters: boolean
    onResetFilters: () => void
    canCreate: boolean
    onOpenCreateCustomer: () => void
}

export function CustomerFilterBar({
    search,
    onSearchChange,
    locationId,
    onLocationChange,
    projectStatus,
    onProjectStatusChange,
    locations,
    isCorporate,
    filteredCount,
    totalCount,
    hasActiveFilters,
    onResetFilters,
    canCreate,
    onOpenCreateCustomer,
}: CustomerFilterBarProps) {
    return (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
            <div className="flex flex-wrap items-center gap-2.5 flex-1">
                {/* Search */}
                <div className="relative w-full sm:w-64">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                    <Input
                        placeholder="Cari customer, proyek, alamat..."
                        value={search}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="pl-9 h-9 text-xs bg-slate-50/50 focus:bg-white"
                    />
                </div>

                {/* Cabang Filter (For Corporate) */}
                {isCorporate && (
                    <div className="w-full sm:w-44">
                        <Select value={locationId} onValueChange={onLocationChange}>
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

                {/* Filter Status Proyek */}
                <div className="w-full sm:w-44">
                    <Select
                        value={projectStatus}
                        onValueChange={(val) => onProjectStatusChange(val as ProjectFilterStatus)}
                    >
                        <SelectTrigger className="h-9 text-xs bg-slate-50/50">
                            <SelectValue placeholder="Status Proyek" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">Semua Status</SelectItem>
                            <SelectItem value="WITH_PROJECTS">Memiliki Proyek</SelectItem>
                            <SelectItem value="WITHOUT_PROJECTS">Tanpa Proyek</SelectItem>
                            <SelectItem value="NEEDS_PRICING">Belum Ada Tarif</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Reset button */}
                {hasActiveFilters && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onResetFilters}
                        className="h-9 text-xs text-slate-500 hover:text-slate-800 px-2"
                    >
                        <RotateCcw className="h-3.5 w-3.5 mr-1" />
                        Reset
                    </Button>
                )}

                <span className="text-xs text-slate-400 whitespace-nowrap pl-1">
                    {filteredCount} dari {totalCount} customer
                </span>
            </div>

            {/* Actions */}
            {canCreate && (
                <div className="flex items-center gap-2">
                    <Button
                        size="sm"
                        onClick={onOpenCreateCustomer}
                        className="h-9 text-xs bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-sm"
                    >
                        <Plus className="w-4 h-4 mr-1.5" />
                        Tambah Customer
                    </Button>
                </div>
            )}
        </div>
    )
}
