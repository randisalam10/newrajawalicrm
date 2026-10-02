"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { DollarSign, Trash2 } from "lucide-react"
import { CustomerProject, ConcreteQualityItem } from "../types"
import { upsertProjectPrice, deleteProjectPrice } from "../actions"

interface ProjectPriceManagerProps {
    project: CustomerProject
    qualities: ConcreteQualityItem[]
    customerLocationId: string
    canCreate: boolean
    canDelete: boolean
    priceForm: {
        qualityId: string
        price: string
        ppnMode: string
        ppnRate: string
    }
    setPriceForm: React.Dispatch<
        React.SetStateAction<{
            qualityId: string
            price: string
            ppnMode: string
            ppnRate: string
        }>
    >
    priceLoading: boolean
    setPriceLoading: (loading: boolean) => void
}

export function ProjectPriceManager({
    project,
    qualities,
    customerLocationId,
    canCreate,
    canDelete,
    priceForm,
    setPriceForm,
    priceLoading,
    setPriceLoading,
}: ProjectPriceManagerProps) {
    const existingQualityIds = (project.prices || []).map((p) => p.qualityId)
    const branchQualities = customerLocationId
        ? qualities.filter((q) => q.locationId === customerLocationId)
        : qualities
    const availableQualities = (branchQualities.length > 0 ? branchQualities : qualities).filter(
        (q) => !existingQualityIds.includes(q.id)
    )

    const isProjectPpn = (project.tax_ppn ?? 0) > 0
    const effectivePpnRate = project.tax_ppn ?? 11

    const activePpnMode = isProjectPpn
        ? (priceForm.ppnMode === "INCLUDE" ? "INCLUDE" : "EXCLUDE")
        : "NON_PPN"

    const inputNum = Number(priceForm.price) || 0
    let previewDpp = inputNum
    let previewPpn = 0
    let previewTotal = inputNum

    if (isProjectPpn) {
        if (activePpnMode === "INCLUDE") {
            previewDpp = inputNum / (1 + effectivePpnRate / 100)
            previewPpn = inputNum - previewDpp
            previewTotal = inputNum
        } else {
            // EXCLUDE (Harga DPP sebelum PPN)
            previewDpp = inputNum
            previewPpn = inputNum * (effectivePpnRate / 100)
            previewTotal = inputNum + previewPpn
        }
    }

    return (
        <div className="ml-4 rounded-lg border border-slate-200 bg-white p-3 space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-1">
                <div className="flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                    Daftar Tarif per Mutu Beton
                </div>
                <span className={`text-[10px] font-normal px-2 py-0.5 rounded border ${isProjectPpn ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                    {isProjectPpn ? `Status Proyek: Kena PPN (${effectivePpnRate}%)` : "Status Proyek: Non-PPN (0%)"}
                </span>
            </div>

            {/* Existing prices */}
            {project.prices && project.prices.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                    {project.prices.map((p) => {
                        const ppnMode = p.ppn_mode || "NON_PPN"
                        const ppnRate = p.ppn_rate ?? effectivePpnRate
                        const priceNum = Number(p.price)
                        let dpp = priceNum
                        let totalDisp = priceNum
                        if (ppnMode === "INCLUDE") {
                            dpp = priceNum / (1 + ppnRate / 100)
                            totalDisp = priceNum
                        } else if (ppnMode === "EXCLUDE" || (ppnMode === "NON_PPN" && isProjectPpn)) {
                            totalDisp = priceNum + priceNum * (ppnRate / 100)
                        }

                        const badgeLabel = ppnMode === "INCLUDE"
                            ? `Inc. PPN ${ppnRate}%`
                            : isProjectPpn
                            ? `Belum PPN (DPP)`
                            : `Non-PPN`

                        const badgeColor = ppnMode === "INCLUDE"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : isProjectPpn
                            ? "bg-sky-50 text-sky-700 border-sky-200"
                            : "bg-slate-100 text-slate-700 border-slate-200"

                        return (
                            <div
                                key={p.qualityId}
                                className="flex items-start gap-2 bg-slate-50 border border-slate-200 rounded-md px-2.5 py-1.5 text-xs"
                            >
                                <div>
                                    <div className="font-semibold text-slate-700">
                                        {p.concreteQuality?.name}
                                    </div>
                                    <div className="text-slate-600 font-medium flex items-center gap-1.5">
                                        <span>Rp {priceNum.toLocaleString("id-ID")}</span>
                                        <span className={`text-[10px] px-1.5 py-0.2 rounded font-medium border ${badgeColor}`}>
                                            {badgeLabel}
                                        </span>
                                    </div>
                                    {isProjectPpn && (
                                        <div className="text-[10px] text-slate-400 mt-0.5 font-mono">
                                            DPP: Rp {Math.round(dpp).toLocaleString("id-ID")} · Total: Rp {Math.round(totalDisp).toLocaleString("id-ID")}
                                        </div>
                                    )}
                                </div>
                                {canDelete && (
                                    <button
                                        type="button"
                                        className="text-slate-400 hover:text-rose-600 transition-colors ml-1 mt-0.5 cursor-pointer"
                                        onClick={async () => {
                                            await deleteProjectPrice(project.id, p.qualityId)
                                        }}
                                        title="Hapus tarif ini"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                )}
                            </div>
                        )
                    })}
                </div>
            ) : (
                <p className="text-xs text-slate-400 italic">Belum ada tarif khusus. Tambahkan di bawah.</p>
            )}

            {/* Add price form */}
            {canCreate && availableQualities.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-slate-100 mt-2">
                    <div className="flex items-center gap-2 flex-wrap">
                        {/* Mutu selector */}
                        <select
                            className="flex-1 min-w-[130px] text-xs h-8 rounded-md border border-slate-200 bg-white px-2 focus:outline-none focus:ring-1 focus:ring-blue-400"
                            value={priceForm.qualityId}
                            onChange={(e) =>
                                setPriceForm((f) => ({ ...f, qualityId: e.target.value }))
                            }
                        >
                            <option value="">Pilih Mutu...</option>
                            {availableQualities.map((q) => (
                                <option key={q.id} value={q.id}>
                                    {q.name}
                                    {q.location?.name ? ` • [${q.location.name}]` : ""}
                                </option>
                            ))}
                        </select>

                        {/* Mode PPN selector */}
                        {isProjectPpn ? (
                            <select
                                className="w-44 text-xs h-8 rounded-md border border-slate-200 bg-white px-2 focus:outline-none focus:ring-1 focus:ring-blue-400 font-medium"
                                value={activePpnMode}
                                onChange={(e) =>
                                    setPriceForm((f) => ({ ...f, ppnMode: e.target.value }))
                                }
                            >
                                <option value="EXCLUDE">Belum PPN (DPP)</option>
                                <option value="INCLUDE">Sudah Inc. PPN (All-in)</option>
                            </select>
                        ) : (
                            <div className="text-[11px] text-slate-500 bg-slate-100 border border-slate-200 px-2 py-1 rounded">
                                Non-PPN (0%)
                            </div>
                        )}

                        {/* Harga input */}
                        <input
                            type="number"
                            placeholder={
                                !isProjectPpn
                                    ? "Harga/m³"
                                    : activePpnMode === "INCLUDE"
                                    ? "Harga All-in (inc. PPN)/m³"
                                    : "Harga DPP/m³"
                            }
                            className="w-44 text-xs h-8 rounded-md border border-slate-200 bg-white px-2 focus:outline-none focus:ring-1 focus:ring-blue-400 font-mono"
                            value={priceForm.price}
                            onChange={(e) =>
                                setPriceForm((f) => ({ ...f, price: e.target.value }))
                            }
                        />

                        {/* Tombol Simpan */}
                        <Button
                            size="sm"
                            className="h-8 text-xs bg-slate-800 hover:bg-slate-900 text-white cursor-pointer"
                            disabled={priceLoading || !priceForm.qualityId || !priceForm.price}
                            onClick={async () => {
                                if (!priceForm.qualityId || !priceForm.price) return
                                setPriceLoading(true)
                                await upsertProjectPrice(
                                    project.id,
                                    priceForm.qualityId,
                                    Number(priceForm.price),
                                    activePpnMode,
                                    effectivePpnRate
                                )
                                setPriceForm({
                                    qualityId: "",
                                    price: "",
                                    ppnMode: isProjectPpn ? "EXCLUDE" : "NON_PPN",
                                    ppnRate: String(effectivePpnRate),
                                })
                                setPriceLoading(false)
                            }}
                        >
                            {priceLoading ? "..." : "Simpan Tarif"}
                        </Button>
                    </div>

                    {/* Preview DPP / PPN */}
                    {inputNum > 0 && isProjectPpn && (
                        <div className="text-[11px] text-slate-600 bg-slate-50 rounded px-2.5 py-1.5 flex gap-4 border border-slate-200 font-mono">
                            <span>
                                DPP: <strong className="text-slate-900">Rp {Math.round(previewDpp).toLocaleString("id-ID")}</strong>
                            </span>
                            <span>
                                PPN ({effectivePpnRate}%): <strong className="text-indigo-700">Rp {Math.round(previewPpn).toLocaleString("id-ID")}</strong>
                            </span>
                            <span>
                                Total Tagihan: <strong className="text-emerald-700">Rp {Math.round(previewTotal).toLocaleString("id-ID")}</strong>
                            </span>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
