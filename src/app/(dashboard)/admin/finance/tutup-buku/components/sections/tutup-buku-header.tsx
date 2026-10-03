"use client"

import { BookLock, Plus, Search, Building2, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"

interface TutupBukuHeaderProps {
    selectedYear: number
    onYearChange: (year: number) => void
    selectedLocationId: string
    onLocationChange: (locId: string) => void
    locations: Array<{ id: string; name: string }>
    searchQuery: string
    onSearchChange: (q: string) => void
    onOpenCloseModal: () => void
}

export function TutupBukuHeader({
    selectedYear,
    onYearChange,
    selectedLocationId,
    onLocationChange,
    locations,
    searchQuery,
    onSearchChange,
    onOpenCloseModal
}: TutupBukuHeaderProps) {
    const currentYearNum = new Date().getFullYear()
    const yearOptions = [currentYearNum - 1, currentYearNum, currentYearNum + 1]

    return (
        <div className="space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4">
                <div>
                    <div className="flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <BookLock className="h-5 w-5" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-xl font-bold tracking-tight text-slate-900">
                                    Tutup Buku & Arsip Finansial
                                </h1>
                                <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs">
                                    Audit & Period Lock
                                </Badge>
                            </div>
                            <p className="text-sm text-slate-500">
                                Manajemen penguncian periode akuntansi bulanan. Periode yang telah ditutup buku akan terkunci secara permanen menjadi snapshot resmi.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        onClick={onOpenCloseModal}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm gap-1.5"
                    >
                        <Plus className="h-4 w-4" />
                        <span>Tutup Buku Periode Baru</span>
                    </Button>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
                <div className="sm:col-span-3">
                    <Select
                        value={String(selectedYear)}
                        onValueChange={(val) => onYearChange(Number(val))}
                    >
                        <SelectTrigger className="bg-white">
                            <Calendar className="h-4 w-4 text-slate-400 mr-2" />
                            <SelectValue placeholder="Pilih Tahun" />
                        </SelectTrigger>
                        <SelectContent>
                            {yearOptions.map(y => (
                                <SelectItem key={y} value={String(y)}>
                                    Tahun {y}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="sm:col-span-4">
                    <Select
                        value={selectedLocationId}
                        onValueChange={onLocationChange}
                    >
                        <SelectTrigger className="bg-white">
                            <Building2 className="h-4 w-4 text-slate-400 mr-2" />
                            <SelectValue placeholder="Semua Cabang (Konsolidasi)" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Semua Cabang (Konsolidasi Pusat)</SelectItem>
                            {locations.map(loc => (
                                <SelectItem key={loc.id} value={loc.id}>
                                    {loc.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="sm:col-span-5 relative">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <Input
                        placeholder="Cari periode, catatan, atau auditor..."
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="pl-9 bg-white"
                    />
                </div>
            </div>
        </div>
    )
}
