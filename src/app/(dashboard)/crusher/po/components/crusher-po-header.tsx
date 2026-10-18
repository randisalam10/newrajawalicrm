"use client"

import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Plus, Mountain, Building2 } from "lucide-react"
import Link from "next/link"

type LocationOption = {
    id: string
    name: string
}

type Props = {
    locations: LocationOption[]
    selectedLocationId: string
    onLocationChange: (locId: string) => void
    onOpenCreate?: () => void
    createHref?: string
}

export function CrusherPoHeader({
    locations,
    selectedLocationId,
    onLocationChange,
    onOpenCreate,
    createHref,
}: Props) {
    return (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs w-full">
            <div className="flex items-center gap-3">
                <Link href="/crusher">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-slate-800" title="Kembali ke Dashboard Crusher">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <div>
                    <div className="flex items-center gap-2">
                        <Mountain className="h-5 w-5 text-emerald-600" />
                        <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                            Purchase Order (PO) Stone Crusher
                        </h1>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                        Pengadaan suku cadang, solar alat berat, dan kebutuhan operasional pabrik pemecah batu.
                    </p>
                </div>
            </div>

            <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 w-full sm:w-auto justify-end">
                {locations.length > 1 && (
                    <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs">
                        <Building2 className="h-4 w-4 text-slate-500 shrink-0" />
                        <Select value={selectedLocationId} onValueChange={onLocationChange}>
                            <SelectTrigger className="h-8 border-none bg-transparent text-xs sm:text-sm font-semibold shadow-none focus:ring-0 p-0 pr-2">
                                <SelectValue placeholder="Pilih Crusher" />
                            </SelectTrigger>
                            <SelectContent>
                                {locations.map(loc => (
                                    <SelectItem key={loc.id} value={loc.id} className="text-xs sm:text-sm">
                                        {loc.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                )}

                {createHref ? (
                    <Link href={createHref}>
                        <Button
                            className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs sm:text-sm h-8 px-3.5 shadow-2xs rounded-lg gap-1.5"
                        >
                            <Plus className="h-4 w-4" />
                            <span>Buat PO Crusher</span>
                        </Button>
                    </Link>
                ) : onOpenCreate ? (
                    <Button
                        onClick={onOpenCreate}
                        className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs sm:text-sm h-8 px-3.5 shadow-2xs rounded-lg gap-1.5"
                    >
                        <Plus className="h-4 w-4" />
                        <span>Buat PO Crusher</span>
                    </Button>
                ) : null}
            </div>
        </div>
    )
}
