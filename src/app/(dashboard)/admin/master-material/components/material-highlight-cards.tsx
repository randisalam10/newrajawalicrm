"use client"

import React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CheckCircle2, Edit3, Plus } from "lucide-react"
import { fmt, fmtDate } from "../helpers"
import { MasterMaterialItem } from "../types"

interface MaterialHighlightCardsProps {
    materials: MasterMaterialItem[]
    selectedLocation: string
    canManage: boolean
    onQuickEditActivePrice: (mat: MasterMaterialItem) => void
    onOpenSetPrice: (mat: MasterMaterialItem) => void
}

export function MaterialHighlightCards({
    materials,
    selectedLocation,
    canManage,
    onQuickEditActivePrice,
    onOpenSetPrice,
}: MaterialHighlightCardsProps) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
            {materials.map((mat) => {
                const isSand = mat.code.includes("PASIR")
                const isStone = mat.code.includes("SPLIT") || mat.category === "BATU"

                return (
                    <Card key={mat.id} className="border-slate-200/80 shadow-2xs bg-white hover:border-blue-300 transition-all group">
                        <CardContent className="p-3.5 space-y-2">
                            <div className="flex items-center justify-between">
                                <Badge
                                    variant="outline"
                                    className={`text-[9px] px-1.5 py-0 font-bold uppercase tracking-wider ${
                                        isSand
                                            ? "bg-amber-50 text-amber-800 border-amber-300"
                                            : isStone
                                            ? "bg-blue-50 text-blue-800 border-blue-300"
                                            : "bg-slate-50 text-slate-700 border-slate-300"
                                    }`}
                                >
                                    {mat.category}
                                </Badge>
                                <span className="text-[10px] text-slate-400 font-mono">
                                    {mat.code}
                                </span>
                            </div>

                            <div>
                                <h4 className="text-sm font-bold text-slate-800 truncate" title={mat.name}>
                                    {mat.name}
                                </h4>
                                <div className="text-[10px] text-slate-400">
                                    Satuan: <strong className="text-slate-600 font-mono">1 {mat.unit}</strong>
                                    {mat.defaultDensity && ` (±${mat.defaultDensity} kg)`}
                                </div>
                            </div>

                            <div className="pt-1 border-t border-slate-100">
                                <div className="text-lg font-bold font-mono text-slate-900">
                                    {fmt(mat.displayPrice ?? mat.currentPrice ?? 0)}
                                </div>
                                <div className="text-[10px] text-emerald-700 flex items-center justify-between font-medium mt-0.5">
                                    <div className="flex items-center gap-1">
                                        <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                                        <span>Aktif: {fmtDate(mat.displayEffectiveDate ?? mat.currentEffectiveDate)}</span>
                                    </div>
                                    {canManage && (
                                        <button
                                            type="button"
                                            onClick={() => onQuickEditActivePrice(mat)}
                                            className="text-[10px] text-blue-600 hover:text-blue-800 underline underline-offset-2 flex items-center gap-0.5 cursor-pointer"
                                            title="Koreksi tanggal berlaku atau nominal harga"
                                        >
                                            <Edit3 className="w-2.5 h-2.5" />
                                            <span>Koreksi</span>
                                        </button>
                                    )}
                                </div>
                                {selectedLocation === "all" && mat.branchOverrides && mat.branchOverrides.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mt-1.5 pt-1 border-t border-slate-100">
                                        {mat.branchOverrides.map((b: any) => (
                                            <span key={b.locationId} className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-medium bg-blue-50 text-blue-700 border border-blue-200">
                                                {b.locationName}: {fmt(b.price)}
                                            </span>
                                        ))}
                                    </div>
                                )}
                                {mat.nextPrice && (
                                    <div className="text-[10px] text-amber-800 bg-amber-50 rounded px-1.5 py-0.5 mt-1 border border-amber-200">
                                        Akan naik jadi {fmt(mat.nextPrice)} ({fmtDate(mat.nextEffectiveDate)})
                                    </div>
                                )}
                            </div>

                            {canManage && (
                                <div className="grid grid-cols-2 gap-1.5 pt-1">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => onQuickEditActivePrice(mat)}
                                        className="h-7 text-[10px] font-semibold text-slate-700 border-slate-200 hover:bg-slate-50 cursor-pointer justify-center"
                                        title="Koreksi tanggal mulai berlaku atau tarif aktif ini"
                                    >
                                        <Edit3 className="w-3 h-3 mr-1 text-slate-500" />
                                        <span>Koreksi Tgl</span>
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="default"
                                        onClick={() => onOpenSetPrice(mat)}
                                        className="h-7 text-[10px] font-semibold bg-blue-600 hover:bg-blue-700 text-white cursor-pointer justify-center"
                                        title="Tetapkan jadwal tarif baru"
                                    >
                                        <Plus className="w-3 h-3 mr-0.5" />
                                        <span>Harga Baru</span>
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )
            })}
        </div>
    )
}
