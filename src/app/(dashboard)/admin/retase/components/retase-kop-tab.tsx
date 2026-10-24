"use client"

import React, { useState, useEffect, useTransition } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RetaseLocation } from "../types"
import { updateLocationKopSettings } from "../actions"
import { toast } from "sonner"
import { Upload, Trash2, Eye, Building2, Check, Loader2 } from "lucide-react"

interface RetaseKopTabProps {
    userRole: string
    locations: RetaseLocation[]
}

export function RetaseKopTab({ userRole, locations }: RetaseKopTabProps) {
    const isCorporate = userRole === "SuperAdminBP" || ["CEO", "FVP", "Approver"].includes(userRole)

    const [selectedLocId, setSelectedLocId] = useState<string>(locations[0]?.id || "")
    const [companyName, setCompanyName] = useState<string>("")
    const [companySub, setCompanySub] = useState<string>("")
    const [address, setAddress] = useState<string>("")
    const [phone, setPhone] = useState<string>("")
    const [email, setEmail] = useState<string>("")
    const [logoUrl, setLogoUrl] = useState<string>("")
    const [kopFooter, setKopFooter] = useState<string>("")

    const [isUploading, setIsUploading] = useState<boolean>(false)
    const [isPending, startTransition] = useTransition()

    // Sinkronisasi data ketika pilihan cabang berubah
    useEffect(() => {
        const currentLoc = locations.find(l => l.id === selectedLocId)
        if (currentLoc) {
            setCompanyName(currentLoc.company_name || "PT. Rajawali Puncak Jayawijaya")
            setCompanySub(currentLoc.company_sub || `Batching Plant & Beton Cor Readymix • Cabang: ${currentLoc.name}`)
            setAddress(currentLoc.address || "")
            setPhone(currentLoc.phone || "")
            setEmail(currentLoc.email || "")
            setLogoUrl(currentLoc.logo_url || "")
            setKopFooter(currentLoc.kop_footer || "")
        }
    }, [selectedLocId, locations])

    async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0]
        if (!file) return

        if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
            toast.error("Format tidak didukung. Gunakan PNG, JPG, atau WebP.")
            return
        }
        if (file.size > 2 * 1024 * 1024) {
            toast.error("Ukuran file maksimal 2MB.")
            return
        }

        setIsUploading(true)
        try {
            const fd = new FormData()
            fd.append("file", file)
            const res = await fetch("/api/upload/logo", { method: "POST", body: fd })
            const data = await res.json()
            if (data.url) {
                setLogoUrl(data.url)
                toast.success("Logo cabang berhasil diunggah!")
            } else {
                toast.error(data.error || "Gagal mengunggah logo.")
            }
        } catch (err: any) {
            toast.error("Terjadi kesalahan saat mengunggah logo.")
        } finally {
            setIsUploading(false)
        }
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (!selectedLocId) {
            toast.error("Pilih cabang terlebih dahulu.")
            return
        }

        startTransition(async () => {
            const fd = new FormData()
            fd.append("locationId", selectedLocId)
            fd.append("company_name", companyName)
            fd.append("company_sub", companySub)
            fd.append("address", address)
            fd.append("phone", phone)
            fd.append("email", email)
            fd.append("logo_url", logoUrl)
            fd.append("kop_footer", kopFooter)

            const res = await updateLocationKopSettings(fd)
            if (res.error) {
                toast.error(res.error)
            } else {
                toast.success("Pengaturan kop surat cabang berhasil disimpan!")
                // Mutasi lokal di array locations agar data konsisten
                const currentLoc = locations.find(l => l.id === selectedLocId)
                if (currentLoc) {
                    currentLoc.company_name = companyName
                    currentLoc.company_sub = companySub
                    currentLoc.address = address
                    currentLoc.phone = phone
                    currentLoc.email = email
                    currentLoc.logo_url = logoUrl
                    currentLoc.kop_footer = kopFooter
                }
            }
        })
    }

    const currentLocName = locations.find(l => l.id === selectedLocId)?.name || "Cabang"

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full">
            {/* Form Pengaturan Kop Surat (Col 7) */}
            <Card className="lg:col-span-7 shadow-sm border-slate-200">
                <CardHeader className="pb-4">
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-slate-700" />
                        Pengaturan Kop Surat & Logo
                    </CardTitle>
                    <CardDescription className="text-xs">
                        Tentukan identitas kop surat, logo, dan kontak resmi per batching plant untuk cetakan surat jalan.
                    </CardDescription>
                </CardHeader>

                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Pilihan Cabang */}
                        {isCorporate ? (
                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold text-slate-700">Pilih Cabang (Batching Plant)</Label>
                                <Select value={selectedLocId} onValueChange={setSelectedLocId}>
                                    <SelectTrigger className="text-xs h-9">
                                        <SelectValue placeholder="Pilih Cabang" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {locations.map((loc) => (
                                            <SelectItem key={loc.id} value={loc.id} className="text-xs">
                                                {loc.name} {loc.code ? `(${loc.code})` : ""}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        ) : (
                            <div className="p-3 bg-slate-50 rounded-md border border-slate-200">
                                <span className="text-xs font-medium text-slate-500">Cabang:</span>
                                <span className="text-xs font-semibold text-slate-800 ml-1.5">{currentLocName}</span>
                            </div>
                        )}

                        {/* Upload Logo */}
                        <div className="space-y-2 pt-1 border-t border-slate-100">
                            <Label className="text-xs font-semibold text-slate-700">Logo Perusahaan / Cabang</Label>
                            <div className="flex items-center gap-4">
                                {logoUrl ? (
                                    <div className="relative group w-16 h-16 rounded border border-slate-200 bg-white p-1 flex items-center justify-center shrink-0">
                                        <img src={logoUrl} alt="Logo Preview" className="max-w-full max-h-full object-contain" />
                                        <button
                                            type="button"
                                            onClick={() => setLogoUrl("")}
                                            className="absolute -top-1.5 -right-1.5 bg-rose-600 text-white rounded-full p-1 opacity-90 hover:opacity-100 shadow cursor-pointer"
                                            title="Hapus Logo"
                                        >
                                            <Trash2 className="w-3 h-3" />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="w-16 h-16 rounded border border-dashed border-slate-300 bg-slate-50 flex items-center justify-center text-[10px] text-slate-400 text-center p-1 shrink-0">
                                        Tanpa Logo
                                    </div>
                                )}

                                <div className="space-y-1.5 flex-1">
                                    <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 cursor-pointer transition">
                                        <Upload className="w-3.5 h-3.5" />
                                        <span>{isUploading ? "Mengunggah..." : logoUrl ? "Ganti Logo" : "Unggah Logo"}</span>
                                        <input
                                            type="file"
                                            accept="image/png,image/jpeg,image/webp"
                                            onChange={handleLogoUpload}
                                            disabled={isUploading}
                                            className="hidden"
                                        />
                                    </label>
                                    <p className="text-[11px] text-slate-500">
                                        Format PNG/JPG transparan persegi direkomendasikan (maks. 2MB).
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Nama Perusahaan */}
                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold text-slate-700">Nama Perusahaan di Kop</Label>
                            <Input
                                value={companyName}
                                onChange={(e) => setCompanyName(e.target.value)}
                                placeholder="PT. Rajawali Puncak Jayawijaya"
                                className="text-xs h-9"
                            />
                        </div>

                        {/* Sub-judul Kop */}
                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold text-slate-700">Sub-judul / Lini Bisnis</Label>
                            <Input
                                value={companySub}
                                onChange={(e) => setCompanySub(e.target.value)}
                                placeholder="Batching Plant & Beton Cor Readymix"
                                className="text-xs h-9"
                            />
                        </div>

                        {/* Alamat Cabang */}
                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold text-slate-700">Alamat Lengkap Batching Plant</Label>
                            <Textarea
                                value={address}
                                onChange={(e) => setAddress(e.target.value)}
                                placeholder="Jl. Poros Tenggarong - Samarinda Km. 5"
                                rows={2}
                                className="text-xs"
                            />
                        </div>

                        {/* Telepon & Email */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold text-slate-700">No. Telepon / WhatsApp</Label>
                                <Input
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    placeholder="0812-xxxx-xxxx"
                                    className="text-xs h-9"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold text-slate-700">Alamat Email</Label>
                                <Input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="cabang@rajawalimix.com"
                                    className="text-xs h-9"
                                />
                            </div>
                        </div>

                        {/* Catatan Kaki (Footer Surat Jalan) */}
                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold text-slate-700">Catatan Kaki Surat Jalan (Opsional)</Label>
                            <Input
                                value={kopFooter}
                                onChange={(e) => setKopFooter(e.target.value)}
                                placeholder="Contoh: Penambahan air di lokasi proyek di luar tanggung jawab produsen."
                                className="text-xs h-9"
                            />
                        </div>

                        {/* Tombol Simpan */}
                        <div className="pt-2 flex justify-end">
                            <Button
                                type="submit"
                                disabled={isPending || isUploading}
                                className="text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white"
                            >
                                {isPending ? (
                                    <>
                                        <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                                        Menyimpan...
                                    </>
                                ) : (
                                    <>
                                        <Check className="w-3.5 h-3.5 mr-1.5" />
                                        Simpan Kop Surat
                                    </>
                                )}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>

            {/* Live Preview Kop Surat (Col 5) */}
            <Card className="lg:col-span-5 shadow-sm border-slate-200">
                <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                        <Eye className="w-4 h-4 text-slate-600" />
                        Pratinjau Kop Surat (Live Preview)
                    </CardTitle>
                    <CardDescription className="text-xs">
                        Tampilan visual header surat jalan yang akan tercetak di lembar A4.
                    </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                    {/* Mockup Kop Box */}
                    <div className="p-4 bg-white rounded border border-slate-300 shadow-xs space-y-3">
                        {/* Header Row */}
                        <div className="flex items-start justify-between pb-3 border-b-2 border-slate-800 gap-2">
                            <div className="flex items-center gap-2.5 flex-1 min-w-0">
                                {logoUrl ? (
                                    <div className="w-10 h-10 rounded shrink-0 flex items-center justify-center p-0.5 border border-slate-100 bg-white">
                                        <img src={logoUrl} alt="Logo" className="max-w-full max-h-full object-contain" />
                                    </div>
                                ) : (
                                    <div className="w-10 h-10 rounded shrink-0 bg-slate-100 border border-slate-200 flex items-center justify-center text-[9px] text-slate-400 text-center font-bold">
                                        RMX
                                    </div>
                                )}
                                <div className="min-w-0 flex-1">
                                    <h4 className="text-xs font-bold text-slate-900 leading-tight truncate">
                                        {companyName || "PT. Rajawali Puncak Jayawijaya"}
                                    </h4>
                                    <p className="text-[10px] text-slate-500 leading-tight truncate">
                                        {companySub || `Batching Plant & Beton Cor Readymix • Cabang: ${currentLocName}`}
                                    </p>
                                    {address && (
                                        <p className="text-[9px] text-slate-400 leading-tight truncate mt-0.5">
                                            {address}
                                        </p>
                                    )}
                                    {(phone || email) && (
                                        <p className="text-[9px] text-slate-400 leading-tight truncate">
                                            {[phone ? `Telp: ${phone}` : null, email ? `Email: ${email}` : null].filter(Boolean).join(" | ")}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="text-right shrink-0">
                                <span className="text-[11px] font-bold tracking-wider text-slate-800 uppercase block">Surat Jalan</span>
                                <span className="text-[9px] text-slate-500 font-mono">No: RMX-001/SJ/10/26</span>
                                <span className="text-[9px] text-slate-400 block">Tgl: 24 Okt 2026</span>
                            </div>
                        </div>

                        {/* Dummy Mini Body */}
                        <div className="space-y-1.5 opacity-60">
                            <div className="grid grid-cols-2 gap-2 text-[9px] bg-slate-50 p-2 rounded border border-slate-200">
                                <div>
                                    <span className="font-semibold text-slate-700 block">CUSTOMER:</span>
                                    <span className="text-slate-600 block">PT. Kontraktor Prima</span>
                                </div>
                                <div>
                                    <span className="font-semibold text-slate-700 block">PENGIRIMAN:</span>
                                    <span className="text-slate-600 block">KT 8821 RZ (TM-01)</span>
                                </div>
                            </div>
                            <div className="text-[9px] bg-slate-100 p-1.5 rounded flex justify-between font-mono">
                                <span>K-300 NFA (6.00 M³)</span>
                                <span className="text-slate-500">Slump: 12±2</span>
                            </div>
                        </div>

                        {/* Footer / Catatan Preview */}
                        <div className="pt-1 border-t border-dashed border-slate-200">
                            <span className="text-[9px] text-slate-400 italic block">
                                {kopFooter || "Catatan: Standar penerimaan beton cor berlaku."}
                            </span>
                        </div>
                    </div>

                    <div className="p-3 bg-emerald-50 rounded-md border border-emerald-200 text-emerald-800 text-xs space-y-1">
                        <div className="font-semibold flex items-center gap-1.5">
                            <Check className="w-3.5 h-3.5" />
                            Integritas Historis Terjamin
                        </div>
                        <p className="text-[11px] text-emerald-700 leading-relaxed">
                            Perubahan kop surat ini hanya berlaku untuk surat jalan yang baru dibuat. Seluruh surat jalan yang telah dicetak sebelumnya membekukan data kop saat transaksi dibuat dan tidak akan berubah.
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
