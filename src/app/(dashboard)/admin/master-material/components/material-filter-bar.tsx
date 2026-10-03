"use client"

import React from "react"
import { Building2, Search } from "lucide-react"
import { MaterialLocation } from "../types"

interface MaterialFilterBarProps {
    locations: MaterialLocation[]
    selectedLocation: string
    onSelectLocation: (locId: string) => void
    searchQuery: string
    onSearchQueryChange: (query: string) => void
    isCorporate: boolean
    userLocationId?: string | null
}

export function MaterialFilterBar({
    locations,
    selectedLocation,
    onSelectLocation,
    searchQuery,
    onSearchQueryChange,
    isCorporate,
    userLocationId,
}: MaterialFilterBarProps) {
    return (
        <div className="bg-slate-50 border border-slate-200/80 p-3 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5 mr-1">
                    <Building2 className="w-3.5 h-3.5 text-blue-600" />
                    <span>Lingkup Cabang:</span>
                </span>

                {isCorporate ? (
                    <div className="flex items-center gap-1.5 flex-wrap">
                        <button
                            type="button"
                            onClick={() => onSelectLocation("all")}
                            className={`px-3 py-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                                selectedLocation === "all"
                                    ? "bg-slate-900 text-white shadow-2xs font-semibold"
                                    : "bg-white text-slate-600 hover:bg-slate-200/70 border border-slate-200 font-medium"
                            }`}
                        >
                            Semua Cabang (Global)
                        </button>
                        {locations.map((loc) => (
                            <button
                                key={loc.id}
                                type="button"
                                onClick={() => onSelectLocation(loc.id)}
                                className={`px-3 py-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                                    selectedLocation === loc.id
                                        ? "bg-blue-600 text-white shadow-2xs font-semibold"
                                        : "bg-white text-slate-600 hover:bg-slate-200/70 border border-slate-200 font-medium"
                                }`}
                            >
                                {loc.name}
                            </button>
                        ))}
                    </div>
                ) : (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-800 border border-blue-200 text-xs font-semibold">
                        <span>{locations.find(l => l.id === userLocationId)?.name || "Cabang Anda"}</span>
                    </div>
                )}
            </div>

            <div className="relative w-full md:w-64">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                <input
                    type="text"
                    placeholder="Cari kode atau nama material..."
                    className="w-full h-8 pl-8 pr-3 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                    value={searchQuery}
                    onChange={(e) => onSearchQueryChange(e.target.value)}
                />
            </div>
        </div>
    )
}
