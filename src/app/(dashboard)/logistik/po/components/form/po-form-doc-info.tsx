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
    isForCrusher?: boolean
    setIsForCrusher?: (val: boolean) => void
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
    isForCrusher = false,
    setIsForCrusher,
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
    const userLocation = locations.find((l: any) => l.id === userLocationId)
    const isUserSc = userLocation?.type === "STONE_CRUSHER" || userLocation?.name?.toLowerCase().includes("crusher")
    const disableBp = !isCorp && isUserSc
    const disableCrusher = !isCorp && !isUserSc
    const disableProyek = !isCorp && isUserSc

    return (
        <Card className="shadow-2xs">
            <CardHeader className="bg-slate-50/50 border-b pb-4">
                <CardTitle className="text-base sm:text-lg">Informasi Dokumen & Tujuan</CardTitle>
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

                {/* Tag Peruntukan Operasional */}
                <div className="p-3 bg-slate-50/80 border border-slate-200 rounded-lg space-y-2.5">
                    <Label className="text-xs font-bold text-slate-800 block">Peruntukan Pengadaan *</Label>
                    <div className="flex flex-wrap items-center gap-4 text-xs">
                                <label className={cn(
                                    "flex items-center gap-2 font-medium text-slate-700",
                                    disableBp ? "opacity-40 cursor-not-allowed" : "cursor-pointer"
                                )}>
                                    <input
                                        type="radio"
                                        name="peruntukan"
                                        checked={isForBp}
                                        disabled={disableBp}
                                        onChange={() => {
                                            if (disableBp) return
                                            setIsForBp(true)
                                            setIsForCrusher?.(false)
                                        }}
                                        className="text-blue-600 cursor-pointer h-4 w-4"
                                    />
                                    <span>Batching Plant (BP)</span>
                                </label>

                                <label className={cn(
                                    "flex items-center gap-2 font-medium text-slate-700",
                                    disableCrusher ? "opacity-40 cursor-not-allowed" : "cursor-pointer"
                                )}>
                                    <input
                                        type="radio"
                                        name="peruntukan"
                                        checked={!!isForCrusher}
                                        disabled={disableCrusher}
                                        onChange={() => {
                                            if (disableCrusher) return
                                            setIsForBp(false)
                                            setIsForCrusher?.(true)
                                            setSelectedProjectId("")
                                        }}
                                        className="text-amber-600 cursor-pointer h-4 w-4"
                                    />
                                    <span>Stone Crusher</span>
                                </label>

                                <label className={cn(
                                    "flex items-center gap-2 font-medium text-slate-700",
                                    disableProyek ? "opacity-40 cursor-not-allowed" : "cursor-pointer"
                                )}>
                                    <input
                                        type="radio"
                                        name="peruntukan"
                                        checked={!isForBp && !isForCrusher}
                                        disabled={disableProyek}
                                        onChange={() => {
                                            if (disableProyek) return
                                            setIsForBp(false)
                                            setIsForCrusher?.(false)
                                        }}
                                        className="text-slate-600 cursor-pointer h-4 w-4"
                                    />
                                    <span>Proyek / Office</span>
                                </label>
                            </div>

                    {/* Dropdown Cabang Batching Plant */}
                    {isForBp && (
                        <div className="pt-2 border-t border-slate-200/80 space-y-1">
                            <Label className="text-xs font-semibold text-blue-950">Cabang Batching Plant *</Label>
                            {!isCorp && userLocationId ? (
                                <div className="px-3 py-2 bg-white border border-blue-300 rounded-md text-xs font-medium text-slate-800 flex items-center gap-1.5">
                                    <span className="text-blue-600">🏢</span>
                                    <span>{locations.find((l: any) => l.id === userLocationId)?.name || "Cabang Anda"}</span>
                                    <span className="text-[10px] text-slate-400 font-normal ml-auto">(Terkunci untuk cabang Anda)</span>
                                </div>
                            ) : (
                                <Combobox
                                    options={locations
                                        .filter((l: any) => l.type === "BATCHING_PLANT" || !l.type || !l.type?.includes("CRUSHER"))
                                        .map((l: any) => ({ value: l.id, label: l.name }))}
                                    value={selectedLocationId}
                                    onChange={setSelectedLocationId}
                                    placeholder="Pilih Cabang Batching Plant..."
                                />
                            )}
                        </div>
                    )}

                    {/* Dropdown Lokasi Stone Crusher */}
                    {isForCrusher && (
                        <div className="pt-2 border-t border-slate-200/80 space-y-1">
                            <Label className="text-xs font-semibold text-amber-950">Lokasi Stone Crusher (Tujuan Pengadaan) *</Label>
                            {!isCorp && userLocationId ? (
                                <div className="px-3 py-2 bg-white border border-amber-300 rounded-md text-xs font-medium text-slate-800 flex items-center gap-1.5">
                                    <span className="text-amber-600">⛰️</span>
                                    <span>{locations.find((l: any) => l.id === userLocationId)?.name || "Crusher Anda"}</span>
                                    <span className="text-[10px] text-slate-400 font-normal ml-auto">(Terkunci untuk crusher Anda)</span>
                                </div>
                            ) : (
                                <Combobox
                                    options={locations
                                        .filter((l: any) => l.type === "STONE_CRUSHER" || l.name?.toLowerCase().includes("crusher"))
                                        .map((l: any) => ({ value: l.id, label: l.name }))}
                                    value={selectedLocationId}
                                    onChange={setSelectedLocationId}
                                    placeholder="Pilih Lokasi Stone Crusher..."
                                />
                            )}
                            <p className="text-[11px] text-amber-800/80">
                                Lokasi Stone Crusher otomatis berfungsi sebagai tujuan pengadaan.
                            </p>
                        </div>
                    )}
                </div>

                {/* Proyek */}
                {!isForCrusher && (
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
                )}

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
