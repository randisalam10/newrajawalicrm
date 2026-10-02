"use client"

import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Combobox } from "@/components/ui/combobox"
import { cn } from "@/lib/utils"

interface POFormDocInfoProps {
    companies: any[]
    companyOptions: { value: string; label: string }[]
    selectedCompanyId: string
    onCompanyChange: (val: string) => void
    isForBp: boolean
    setIsForBp: (val: boolean) => void
    isCorp: boolean
    selectedLocationId: string
    setSelectedLocationId: (val: string) => void
    locations: any[]
    userLocationId: string | null | undefined
    projectOptions: { value: string; label: string }[]
    selectedProjectId: string
    setSelectedProjectId: (val: string) => void
    categoryOptions: { value: string; label: string }[]
    selectedCategoryId: string
    setSelectedCategoryId: (val: string) => void
    activeCategory: any
    kmHm: string
    setKmHm: (val: string) => void
    supplierOptions: { value: string; label: string }[]
    selectedSupplierId: string
    onSupplierChange: (val: string) => void
    metodePembayaran: "CASH" | "CREDIT"
    setMetodePembayaran: (val: "CASH" | "CREDIT") => void
}

export function POFormDocInfo({
    companies,
    companyOptions,
    selectedCompanyId,
    onCompanyChange,
    isForBp,
    setIsForBp,
    isCorp,
    selectedLocationId,
    setSelectedLocationId,
    locations,
    userLocationId,
    projectOptions,
    selectedProjectId,
    setSelectedProjectId,
    categoryOptions,
    selectedCategoryId,
    setSelectedCategoryId,
    activeCategory,
    kmHm,
    setKmHm,
    supplierOptions,
    selectedSupplierId,
    onSupplierChange,
    metodePembayaran,
    setMetodePembayaran,
}: POFormDocInfoProps) {
    return (
        <Card className="shadow-sm">
            <CardHeader className="bg-slate-50/50 border-b pb-4">
                <CardTitle className="text-lg">Informasi Dokumen & Tujuan</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
                {/* Perusahaan Penerbit */}
                <div className="space-y-2">
                    <Label>Perusahaan Penerbit (KOP Surat) *</Label>
                    <Combobox
                        options={companyOptions}
                        value={selectedCompanyId}
                        onChange={onCompanyChange}
                        placeholder="Pilih Perusahaan..."
                    />
                </div>

                {/* Tag Peruntukan: Untuk Batching Plant (BP) */}
                <div className="p-3 bg-blue-50/60 border border-blue-200 rounded-lg space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                        <div className="space-y-0.5">
                            <label className="text-xs font-bold text-blue-900 flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={isForBp}
                                    disabled={!isCorp}
                                    onChange={(e) => setIsForBp(e.target.checked)}
                                    className="rounded text-blue-600 cursor-pointer h-4 w-4"
                                />
                                <span>Peruntukan: Untuk Batching Plant (BP)</span>
                            </label>
                            <p className="text-[11px] text-blue-700">
                                {!isCorp 
                                    ? "Sebagai Admin Cabang, PO ini otomatis tercatat untuk Batching Plant Anda." 
                                    : "Centang jika pengadaan ini untuk operasional Batching Plant (Semen Silo, sparepart plant, dll)."}
                            </p>
                        </div>
                        <span className={cn(
                            "px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider shrink-0",
                            isForBp ? "bg-blue-600 text-white" : "bg-slate-200 text-slate-700"
                        )}>
                            {isForBp ? "UNTUK BP" : "NON-BP"}
                        </span>
                    </div>

                    {/* Dropdown / Label Cabang BP */}
                    {isForBp && (
                        <div className="pt-2 border-t border-blue-200/80 space-y-1">
                            <Label className="text-xs font-semibold text-blue-950">Cabang Batching Plant *</Label>
                            {!isCorp ? (
                                <div className="px-3 py-2 bg-white border border-blue-300 rounded-md text-xs font-medium text-slate-800 flex items-center gap-1.5">
                                    <span className="text-blue-600">🏢</span>
                                    <span>{locations.find((l: any) => l.id === userLocationId)?.name || "Cabang Anda"}</span>
                                    <span className="text-[10px] text-slate-400 font-normal ml-auto">(Terkunci untuk cabang Anda)</span>
                                </div>
                            ) : (
                                <Combobox
                                    options={locations.map((l: any) => ({ value: l.id, label: l.name }))}
                                    value={selectedLocationId}
                                    onChange={setSelectedLocationId}
                                    placeholder="Pilih Cabang Batching Plant..."
                                />
                            )}
                        </div>
                    )}
                </div>

                {/* Proyek */}
                <div className="space-y-2">
                    <Label>Tujuan / Lokasi (Proyek)</Label>
                    <div className={cn(selectedCompanyId ? "" : "opacity-50 pointer-events-none")}>
                        <Combobox
                            options={projectOptions}
                            value={selectedProjectId}
                            onChange={setSelectedProjectId}
                            placeholder="Pilih Proyek (Opsional)..."
                        />
                    </div>
                </div>

                {/* Kategori */}
                <div className="space-y-2 pt-2 border-t">
                    <Label>Kategori PO *</Label>
                    <Combobox
                        options={categoryOptions}
                        value={selectedCategoryId}
                        onChange={setSelectedCategoryId}
                        placeholder="Pilih Kategori..."
                    />
                </div>

                {activeCategory?.require_hm_km && (
                    <div className="space-y-2 p-3 bg-slate-50 border border-slate-200 rounded-md">
                        <Label className="text-slate-800 font-semibold">KM/HM Kendaraan (Opsional)</Label>
                        <Input
                            value={kmHm}
                            onChange={e => setKmHm(e.target.value)}
                            placeholder="Contoh: 15.000 KM"
                        />
                    </div>
                )}

                {/* Toko / Supplier */}
                <div className="space-y-2 pt-2 border-t">
                    <Label>Toko / Supplier *</Label>
                    <Combobox
                        options={supplierOptions}
                        value={selectedSupplierId}
                        onChange={onSupplierChange}
                        placeholder="Pilih Toko..."
                    />
                </div>

                {/* Metode Pembayaran */}
                <div className="space-y-2">
                    <Label>Metode Pembayaran *</Label>
                    <Combobox
                        options={[{ value: "CASH", label: "Cash / Tunai" }, { value: "CREDIT", label: "Kredit" }]}
                        value={metodePembayaran}
                        onChange={(v) => setMetodePembayaran(v as "CASH" | "CREDIT")}
                        placeholder="Pilih Metode"
                    />
                </div>
            </CardContent>
        </Card>
    )
}
