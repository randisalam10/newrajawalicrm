"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
    Trash2, Plus, Info, CheckCircle, Sparkles, Zap, Check, Loader2
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Combobox } from "@/components/ui/combobox"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { createPurchaseOrder } from "../actions"
import { quickUpdateItemPrice } from "../../master-barang/actions"
import { useRouter } from "next/navigation"

type PoPaymentMethod = "CASH" | "CREDIT"

export function POCreateClient({ companies, categories, suppliers, items, signers, pembuatAdmin }: {
    companies: any[], categories: any[], suppliers: any[], items: any[], signers: any[], pembuatAdmin: string
}) {
    const router = useRouter()
    const [saving, setSaving] = useState(false)
    const [savedPoNumber, setSavedPoNumber] = useState<string | null>(null)

    // Master items state (allows dynamic updating via shortcuts without reload)
    const [masterItemsList, setMasterItemsList] = useState<any[]>(items)

    const [selectedCompanyId, setSelectedCompanyId] = useState("")
    const [selectedProjectId, setSelectedProjectId] = useState("")
    const [selectedCategoryId, setSelectedCategoryId] = useState("")
    const [selectedSupplierId, setSelectedSupplierId] = useState("")
    const [pimpinan, setPimpinan] = useState("")
    const [kepalaPeralatan, setKepalaPeralatan] = useState("")
    const [jabatanKepala, setJabatanKepala] = useState("")
    const [selectedCeoId, setSelectedCeoId] = useState<string>("none")
    const [selectedFvpId, setSelectedFvpId] = useState<string>("none")
    const [poItems, setPoItems] = useState<any[]>([])

    // Item picker inputs
    const [selectedItemId, setSelectedItemId] = useState("")
    const [showPriceEditor, setShowPriceEditor] = useState(false)
    const [inputQty, setInputQty] = useState<number>(1)
    const [inputHarga, setInputHarga] = useState<number | "">("")
    const [inputKeterangan, setInputKeterangan] = useState("")
    const [inputUpdateMaster, setInputUpdateMaster] = useState(false)
    const [updatingItemId, setUpdatingItemId] = useState<string | null>(null)

    // Shortcut Modal State
    const [shortcutModalOpen, setShortcutModalOpen] = useState(false)
    const [shortcutItemId, setShortcutItemId] = useState("")
    const [shortcutNewPrice, setShortcutNewPrice] = useState<number | "">("")
    const [shortcutReason, setShortcutReason] = useState("")
    const [shortcutUpdating, setShortcutUpdating] = useState(false)
    const [shortcutSuccessMsg, setShortcutSuccessMsg] = useState("")

    const [metodePembayaran, setMetodePembayaran] = useState<PoPaymentMethod>("CREDIT")
    const [tanggalTerbit, setTanggalTerbit] = useState("")
    const [kmHm, setKmHm] = useState("")
    const [notes, setNotes] = useState("")
    const [picName, setPicName] = useState("")
    const [picPhone, setPicPhone] = useState("")

    React.useEffect(() => {
        setTanggalTerbit(new Date().toISOString().split('T')[0])
    }, [])

    const selectedCompany = companies.find((c: any) => c.id === selectedCompanyId)
    const filteredProjects = selectedCompany?.projects || []
    const activeCategory = categories.find((c: any) => c.id === selectedCategoryId)
    const availableItems = masterItemsList.filter((i: any) => i.supplierId === selectedSupplierId)

    const handleCompanyChange = (val: string) => {
        setSelectedCompanyId(val)
        setSelectedProjectId("")
        const comp = companies.find((c: any) => c.id === val)
        if (comp) {
            const ceoSigner = signers.find(s => s.id === comp.defaultCeoId)
            const fvpSigner = signers.find(s => s.id === comp.defaultFvpId)
            
            setPimpinan(ceoSigner?.employee?.name || ceoSigner?.username || "")
            setKepalaPeralatan(fvpSigner?.employee?.name || fvpSigner?.username || "")
            setJabatanKepala("Yang Mengajukan")
            setSelectedCeoId(ceoSigner ? comp.defaultCeoId : "none")
            setSelectedFvpId(fvpSigner ? comp.defaultFvpId : "none")
        }
    }

    // Handler when choosing item in picker combobox
    const handleSelectItem = (val: string) => {
        setSelectedItemId(val)
        setShowPriceEditor(false)
        const itm = masterItemsList.find((i: any) => i.id === val)
        if (itm) {
            setInputHarga(itm.harga)
            setInputQty(1)
            setInputKeterangan("")
            setInputUpdateMaster(false)
        }
    }

    // Add selected item to PO table
    const handleAddItem = () => {
        if (!selectedItemId) return
        const itm = masterItemsList.find((i: any) => i.id === selectedItemId)
        if (!itm) return

        const qty = Number(inputQty) > 0 ? Number(inputQty) : 1
        const price = inputHarga !== "" ? Number(inputHarga) : itm.harga

        setPoItems([...poItems, {
            ...itm,
            cartId: Math.random().toString(),
            masterHarga: itm.harga,
            harga: price,
            quantity: qty,
            keterangan: inputKeterangan,
            updateMasterPrice: inputUpdateMaster
        }])

        setSelectedItemId("")
        setShowPriceEditor(false)
        setInputQty(1)
        setInputHarga("")
        setInputKeterangan("")
        setInputUpdateMaster(false)
    }

    // Direct update master price from picker
    const handleQuickUpdatePicker = async () => {
        if (!selectedItemId || inputHarga === "" || Number(inputHarga) < 0) return
        setUpdatingItemId("picker")
        try {
            const res = await quickUpdateItemPrice(
                selectedItemId,
                Number(inputHarga),
                "Penyesuaian harga saat pemilihan barang di PO"
            )
            if (res.success) {
                setMasterItemsList(prev => prev.map(i => i.id === selectedItemId ? { ...i, harga: Number(inputHarga) } : i))
                setInputUpdateMaster(false)
                alert("Harga Master Barang berhasil diperbarui!")
            } else {
                alert("Gagal update: " + res.error)
            }
        } finally {
            setUpdatingItemId(null)
        }
    }

    // Direct 1-click update from table row
    const handleQuickUpdateFromRow = async (item: any) => {
        setUpdatingItemId(item.cartId)
        try {
            const res = await quickUpdateItemPrice(
                item.id,
                item.harga,
                `Update via input PO (${item.keterangan || 'Penyesuaian PO'})`
            )
            if (res.success) {
                setMasterItemsList(prev => prev.map(i => i.id === item.id ? { ...i, harga: item.harga } : i))
                setPoItems(prev => prev.map(i => i.cartId === item.cartId ? { ...i, masterHarga: item.harga, updateMasterPrice: false } : i))
                alert(`Harga master untuk "${item.name}" berhasil diupdate menjadi Rp ${Number(item.harga).toLocaleString('id-ID')}`)
            } else {
                alert("Gagal update: " + res.error)
            }
        } finally {
            setUpdatingItemId(null)
        }
    }

    // Shortcut modal handlers
    const handleShortcutItemSelect = (id: string) => {
        setShortcutItemId(id)
        const itm = masterItemsList.find(i => i.id === id)
        if (itm) {
            setShortcutNewPrice(itm.harga)
            setShortcutReason("Penyesuaian harga saat input PO")
            setShortcutSuccessMsg("")
        }
    }

    const handleShortcutSave = async () => {
        if (!shortcutItemId || shortcutNewPrice === "" || Number(shortcutNewPrice) < 0) return
        setShortcutUpdating(true)
        setShortcutSuccessMsg("")
        try {
            const res = await quickUpdateItemPrice(
                shortcutItemId,
                Number(shortcutNewPrice),
                shortcutReason || undefined
            )
            if (res.success) {
                const newPriceNum = Number(shortcutNewPrice)
                setMasterItemsList(prev => prev.map(i => i.id === shortcutItemId ? { ...i, harga: newPriceNum } : i))
                setPoItems(prev => prev.map(i => i.id === shortcutItemId ? { ...i, masterHarga: newPriceNum, harga: newPriceNum, updateMasterPrice: false } : i))
                if (selectedItemId === shortcutItemId) {
                    setInputHarga(newPriceNum)
                }
                setShortcutSuccessMsg("Harga master barang berhasil diupdate!")
                setTimeout(() => {
                    setShortcutModalOpen(false)
                    setShortcutSuccessMsg("")
                }, 1000)
            } else {
                alert("Gagal update harga: " + res.error)
            }
        } finally {
            setShortcutUpdating(false)
        }
    }

    const totalHarga = poItems.reduce((acc, curr) => acc + (curr.harga * curr.quantity), 0)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (poItems.length === 0) { alert("Tambahkan minimal 1 item barang."); return }
        if (!selectedCompanyId || !selectedCategoryId || !selectedSupplierId) {
            alert("Perusahaan, Kategori, dan Toko wajib dipilih.")
            return
        }

        setSaving(true)
        try {
            const result = await createPurchaseOrder({
                companyGroupId: selectedCompanyId,
                companyProjectId: selectedProjectId || undefined,
                categoryId: selectedCategoryId,
                supplierId: selectedSupplierId,
                pimpinan,
                kepala_peralatan: kepalaPeralatan,
                jabatan_kepala: jabatanKepala || undefined,
                metode_pembayaran: metodePembayaran,
                km_hm_kendaraan: kmHm || undefined,
                tanggal_terbit: new Date(tanggalTerbit),
                notes: notes || undefined,
                pic_name: picName || undefined,
                pic_phone: picPhone || undefined,
                ceoId: selectedCeoId !== "none" ? selectedCeoId : undefined,
                fvpId: selectedFvpId !== "none" ? selectedFvpId : undefined,
                pembuat_admin: pembuatAdmin,
                items: poItems.map(item => ({
                    masterItemId: item.id,
                    quantity: item.quantity,
                    harga_satuan: item.harga,
                    keterangan: item.keterangan || undefined,
                    subtotal: item.harga * item.quantity,
                    updateMasterPrice: item.updateMasterPrice || false
                }))
            })

            if (result.success && result.po_number) {
                setSavedPoNumber(result.po_number)
            } else {
                alert("Gagal menyimpan PO: " + result.error)
            }
        } finally {
            setSaving(false)
        }
    }

    const companyOptions = companies.map((c: any) => ({ value: c.id, label: c.name }))
    const projectOptions = filteredProjects.map((p: any) => ({
        value: p.id,
        label: p.kode_proyek ? `${p.name} (${p.kode_proyek})` : p.name
    }))
    const categoryOptions = categories.map((c: any) => ({ value: c.id, label: `${c.name} (${c.kode_kategori})` }))
    const supplierOptions = suppliers.map((s: any) => ({ value: s.id, label: s.name }))
    const itemOptions = availableItems.map((i: any) => ({
        value: i.id,
        label: `${i.name} - Rp ${Number(i.harga).toLocaleString('id-ID')}`
    }))

    const shortcutItemOptions = masterItemsList.map((i: any) => {
        const supp = suppliers.find(s => s.id === i.supplierId)?.name
        return {
            value: i.id,
            label: `${i.name} ${supp ? `[${supp}]` : ''} - Rp ${Number(i.harga).toLocaleString('id-ID')}`
        }
    })

    const selectedItem = masterItemsList.find((i: any) => i.id === selectedItemId)
    const shortcutItem = masterItemsList.find((i: any) => i.id === shortcutItemId)

    if (savedPoNumber) {
        return (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
                <CheckCircle className="w-16 h-16 text-green-500" />
                <h2 className="text-2xl font-bold">PO Berhasil Dibuat!</h2>
                <p className="text-muted-foreground">Nomor PO: <span className="font-mono font-bold text-slate-800">{savedPoNumber}</span></p>
                <div className="flex gap-3 mt-4">
                    <Button variant="outline" onClick={() => router.push("/logistik/po")}>Lihat Daftar PO</Button>
                    <Button onClick={() => router.push(`/print/po/${savedPoNumber}`)}>Print PO</Button>
                </div>
            </div>
        )
    }

    return (
        <form onSubmit={handleSubmit} className="max-w-6xl space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Bagian Kiri */}
                <Card className="shadow-sm">
                    <CardHeader className="bg-slate-50/50 border-b pb-4">
                        <CardTitle className="text-lg">Informasi Dokumen & Tujuan</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-4">
                        <div className="space-y-2">
                            <Label>Perusahaan Penerbit (KOP Surat) *</Label>
                            <Combobox options={companyOptions} value={selectedCompanyId} onChange={handleCompanyChange} placeholder="Pilih Perusahaan..." />
                        </div>
                        <div className="space-y-2">
                            <Label>Tujuan / Lokasi (Proyek)</Label>
                            <div className={cn(selectedCompanyId ? "" : "opacity-50 pointer-events-none")}>
                                <Combobox options={projectOptions} value={selectedProjectId} onChange={setSelectedProjectId} placeholder="Pilih Proyek (Opsional)..." />
                            </div>
                        </div>
                        <div className="space-y-2 pt-2 border-t">
                            <Label>Kategori PO *</Label>
                            <Combobox options={categoryOptions} value={selectedCategoryId} onChange={setSelectedCategoryId} placeholder="Pilih Kategori..." />
                        </div>
                        {activeCategory?.require_hm_km && (
                            <div className="space-y-2 p-3 bg-amber-50 border border-amber-200 rounded-md">
                                <Label className="text-amber-800 font-semibold">KM/HM Kendaraan *</Label>
                                <Input value={kmHm} onChange={e => setKmHm(e.target.value)} placeholder="Contoh: 15.000 KM" />
                            </div>
                        )}
                        <div className="space-y-2 pt-2 border-t">
                            <Label>Toko / Supplier *</Label>
                            <Combobox
                                options={supplierOptions}
                                value={selectedSupplierId}
                                onChange={(val) => { setSelectedSupplierId(val); setPoItems([]) }}
                                placeholder="Pilih Toko..."
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Metode Pembayaran *</Label>
                            <Combobox
                                options={[{ value: "CASH", label: "Cash / Tunai" }, { value: "CREDIT", label: "Kredit" }]}
                                value={metodePembayaran}
                                onChange={(v) => setMetodePembayaran(v as PoPaymentMethod)}
                                placeholder="Pilih Metode"
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Bagian Kanan */}
                <Card className="shadow-sm">
                    <CardHeader className="bg-slate-50/50 border-b pb-4">
                        <CardTitle className="text-lg">Penandatangan & Meta</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-4">
                        <div className="space-y-2">
                            <Label>Tanggal Terbit PO</Label>
                            <Input type="date" value={tanggalTerbit} onChange={e => setTanggalTerbit(e.target.value)} required />
                        </div>
                        <div className="space-y-2 border-t pt-4">
                            <Label>Pilih Penandatangan (Approval)</Label>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <Label className="text-xs text-slate-500">CEO Signer</Label>
                                    <Select value={selectedCeoId} onValueChange={(val) => {
                                        setSelectedCeoId(val)
                                        const s = signers.find(u => u.id === val)
                                        setPimpinan(s?.employee?.name || s?.username || "")
                                    }}>
                                        <SelectTrigger className="h-9">
                                            <SelectValue placeholder="Pilih CEO" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">-- Kosongkan --</SelectItem>
                                            {signers.filter(s => s.role === 'CEO').map(s => (
                                                <SelectItem key={s.id} value={s.id}>{(s as any).employee?.name || s.username}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs text-slate-500">FVP Signer</Label>
                                    <Select value={selectedFvpId} onValueChange={(val) => {
                                        setSelectedFvpId(val)
                                        const s = signers.find(u => u.id === val)
                                        setKepalaPeralatan(s?.employee?.name || s?.username || "")
                                    }}>
                                        <SelectTrigger className="h-9">
                                            <SelectValue placeholder="Pilih FVP" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">-- Kosongkan --</SelectItem>
                                            {signers.filter(s => s.role === 'FVP').map(s => (
                                                <SelectItem key={s.id} value={s.id}>{(s as any).employee?.name || s.username}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>
                        <div className="space-y-2 border-t pt-4">
                            <Label>Pembuat PO (Sistem)</Label>
                            <Input value={pembuatAdmin} disabled className="bg-slate-50 text-slate-500" />
                        </div>
                        <div className="space-y-2">
                            <Label>Catatan (Opsional)</Label>
                            <Input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Catatan tambahan..." />
                        </div>
                        <div className="grid grid-cols-2 gap-4 border-t pt-4">
                            <div className="space-y-2">
                                <Label>Nama PIC / Penanggungjawab</Label>
                                <Input value={picName} onChange={e => setPicName(e.target.value)} placeholder="Nama PIC..." />
                            </div>
                            <div className="space-y-2">
                                <Label>No. HP PIC</Label>
                                <Input value={picPhone} onChange={e => setPicPhone(e.target.value.replace(/\D/g, ""))} placeholder="No. HP..." />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Rincian Barang */}
            <Card className="shadow-sm">
                <CardHeader className="bg-slate-50/50 border-b flex flex-col sm:flex-row sm:items-center justify-between pb-4 gap-3">
                    <div>
                        <CardTitle className="text-lg">Rincian Barang Pesanan</CardTitle>
                        <p className="text-xs text-slate-500 mt-0.5">Pilih barang dari master atau gunakan shortcut ubah harga jika supplier mengubah harga.</p>
                    </div>
                    <Button 
                        type="button" 
                        variant="outline" 
                        size="sm" 
                        onClick={() => {
                            setShortcutItemId(selectedItemId || "")
                            if (selectedItemId) {
                                const itm = masterItemsList.find(i => i.id === selectedItemId)
                                if (itm) setShortcutNewPrice(itm.harga)
                            }
                            setShortcutModalOpen(true)
                        }} 
                        className="border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 font-semibold shadow-xs transition-all w-fit"
                    >
                        <Sparkles className="w-4 h-4 mr-1.5 text-amber-600" />
                        ⚡ Shortcut Ubah Harga Master
                    </Button>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="p-4 bg-slate-50 border-b space-y-3">
                        <div className="flex flex-col md:flex-row gap-3 items-start md:items-end">
                            <div className="flex-1 space-y-1.5 w-full">
                                <Label className="text-xs font-semibold text-slate-700">Pilih Barang dari Master *</Label>
                                <div className={cn(selectedSupplierId ? "" : "opacity-50 pointer-events-none")}>
                                    <Combobox 
                                        options={itemOptions} 
                                        value={selectedItemId} 
                                        onChange={handleSelectItem} 
                                        placeholder={selectedSupplierId ? "Cari nama barang atau kode..." : "Pilih Toko / Supplier terlebih dahulu"} 
                                    />
                                </div>
                            </div>
                        </div>

                        {selectedItem && (
                            <div className="p-3.5 bg-white border border-slate-200 rounded-lg shadow-xs space-y-3">
                                <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-2">
                                    <div>
                                        <div className="font-semibold text-slate-900 text-sm">{selectedItem.name}</div>
                                        <div className="text-xs text-slate-500">
                                            Part/Tipe: <span className="font-mono">{selectedItem.part_number || "-"}</span> | Merk: <span>{selectedItem.merk || "-"}</span> | Satuan: <span className="font-semibold">{selectedItem.satuan}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="text-xs bg-slate-100 px-2.5 py-1 rounded text-slate-700 font-medium">
                                            Harga Master: <span className="font-bold text-slate-900">Rp {Number(selectedItem.harga).toLocaleString('id-ID')}</span>
                                        </div>
                                        <Button
                                            type="button"
                                            variant={showPriceEditor ? "secondary" : "outline"}
                                            size="sm"
                                            onClick={() => setShowPriceEditor(!showPriceEditor)}
                                            className="h-7 text-xs border-amber-300 text-amber-900 hover:bg-amber-50"
                                        >
                                            <Sparkles className="w-3 h-3 mr-1 text-amber-600" />
                                            {showPriceEditor ? "Tutup Ubah Harga" : "Ubah Harga (Opsional)"}
                                        </Button>
                                    </div>
                                </div>

                                {/* Opsi Ubah Harga: HANYA MUNCUL JIKA DIKLIK */}
                                {showPriceEditor && (
                                    <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-md space-y-2.5 animate-in fade-in slide-in-from-top-1 duration-150">
                                        <div className="flex items-center justify-between">
                                            <Label className="text-xs font-semibold text-amber-950 flex items-center gap-1.5">
                                                <Zap className="w-3.5 h-3.5 text-amber-600" />
                                                Penyesuaian Harga Satuan
                                            </Label>
                                            {inputHarga !== "" && Number(inputHarga) !== Number(selectedItem.harga) && (
                                                <span className={cn(
                                                    "text-[11px] font-bold px-1.5 py-0.5 rounded",
                                                    Number(inputHarga) > Number(selectedItem.harga) ? "text-amber-800 bg-amber-100" : "text-blue-800 bg-blue-100"
                                                )}>
                                                    {Number(inputHarga) > Number(selectedItem.harga) ? '▲ +' : '▼ '}
                                                    {Math.round(((Number(inputHarga) - Number(selectedItem.harga)) / (Number(selectedItem.harga) || 1)) * 100)}%
                                                </span>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-center">
                                            <div className="relative">
                                                <span className="absolute left-3 top-2 text-xs text-slate-400 font-medium">Rp</span>
                                                <Input
                                                    type="number"
                                                    min="0"
                                                    step="any"
                                                    value={inputHarga}
                                                    onChange={e => setInputHarga(e.target.value === "" ? "" : Number(e.target.value))}
                                                    placeholder="Harga satuan baru..."
                                                    className="h-9 pl-9 font-semibold text-slate-900 bg-white"
                                                />
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={handleQuickUpdatePicker}
                                                    disabled={updatingItemId === "picker" || inputHarga === "" || Number(inputHarga) === Number(selectedItem.harga)}
                                                    className="h-9 text-xs bg-white hover:bg-amber-100 text-amber-900 border-amber-300 font-semibold"
                                                >
                                                    {updatingItemId === "picker" ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Zap className="w-3 h-3 mr-1 text-amber-600" />}
                                                    Update Master Sekarang
                                                </Button>
                                            </div>
                                        </div>

                                        <label className="flex items-center gap-2 cursor-pointer pt-0.5 text-xs text-amber-900">
                                            <input
                                                type="checkbox"
                                                checked={inputUpdateMaster}
                                                onChange={e => setInputUpdateMaster(e.target.checked)}
                                                className="rounded text-amber-600 focus:ring-amber-500 h-4 w-4"
                                            />
                                            <span>Otomatis perbarui master barang saat PO disimpan</span>
                                        </label>
                                    </div>
                                )}

                                {/* Baris standar input PO */}
                                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                                    <div className="md:col-span-2 space-y-1">
                                        <Label className="text-xs font-medium">Qty ({selectedItem.satuan})</Label>
                                        <Input 
                                            type="number" 
                                            min="0.01" 
                                            step="any" 
                                            value={inputQty} 
                                            onChange={e => setInputQty(Number(e.target.value))} 
                                            className="h-9"
                                        />
                                    </div>
                                    <div className="md:col-span-7 space-y-1">
                                        <Label className="text-xs font-medium">Keterangan Khusus (Opsional)</Label>
                                        <Input 
                                            placeholder="Plat nomor / lokasi..." 
                                            value={inputKeterangan} 
                                            onChange={e => setInputKeterangan(e.target.value)} 
                                            className="h-9 text-xs"
                                        />
                                    </div>
                                    <div className="md:col-span-3">
                                        <Button type="button" onClick={handleAddItem} className="w-full h-9 bg-slate-900 hover:bg-slate-800 text-white font-medium">
                                            <Plus className="w-4 h-4 mr-1.5" /> Tambah ke PO
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {!selectedSupplierId && (
                        <div className="p-8 text-center text-slate-500 flex flex-col items-center">
                            <Info className="w-8 h-8 mb-2 opacity-50" />
                            <p>Pilih Toko / Supplier pada form di atas terlebih dahulu.</p>
                        </div>
                    )}
                    {selectedSupplierId && poItems.length === 0 && (
                        <div className="p-8 text-center text-slate-500">Belum ada rincian barang. Silakan pilih dan tambah barang di atas.</div>
                    )}

                    {poItems.length > 0 && (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-slate-100 border-b">
                                    <tr>
                                        <th className="py-2.5 px-4 text-left font-semibold text-slate-600">Info Barang</th>
                                        <th className="py-2.5 px-4 text-center font-semibold text-slate-600 w-24">Qty</th>
                                        <th className="py-2.5 px-4 text-left font-semibold text-slate-600 w-20">Satuan</th>
                                        <th className="py-2.5 px-4 text-right font-semibold text-slate-600 w-44">Harga Satuan</th>
                                        <th className="py-2.5 px-4 text-left font-semibold text-slate-600">Keterangan Khusus</th>
                                        <th className="py-2.5 px-4 text-right font-semibold text-slate-600 w-32">Total Harga</th>
                                        <th className="py-2.5 px-4 w-10"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {poItems.map((item) => (
                                        <tr key={item.cartId} className="border-b hover:bg-slate-50/50">
                                            <td className="py-3 px-4">
                                                <div className="font-medium text-slate-900">{item.name}</div>
                                                <div className="text-xs text-slate-500 mt-0.5">
                                                    Part/Tipe: {item.part_number || "-"} | Merk: {item.merk || "-"}
                                                </div>
                                            </td>
                                            <td className="py-2 px-4">
                                                <Input
                                                    type="number" min="0.01" step="any" value={item.quantity}
                                                    onChange={e => setPoItems(poItems.map(i => i.cartId === item.cartId ? { ...i, quantity: Number(e.target.value) } : i))}
                                                    className="w-16 text-center h-8 mx-auto"
                                                />
                                            </td>
                                            <td className="py-2 px-4 text-slate-600">{item.satuan}</td>
                                            <td className="py-2 px-4">
                                                <div className="flex flex-col items-end gap-1">
                                                    <div className="flex items-center gap-1.5 justify-end">
                                                        <span className="text-xs text-slate-400 font-medium">Rp</span>
                                                        <Input
                                                            type="number"
                                                            min="0"
                                                            step="any"
                                                            value={item.harga}
                                                            onChange={e => {
                                                                const val = Number(e.target.value) || 0
                                                                setPoItems(poItems.map(i => i.cartId === item.cartId ? { ...i, harga: val } : i))
                                                            }}
                                                            className="w-28 text-right h-8 font-semibold text-xs text-slate-800"
                                                        />
                                                    </div>
                                                    {Math.abs(item.harga - (item.masterHarga ?? item.harga)) > 0.001 ? (
                                                        <div className="flex flex-col items-end gap-1">
                                                            <span className={cn(
                                                                "text-[10px] font-bold px-1.5 py-0.5 rounded",
                                                                item.harga > (item.masterHarga ?? 0) ? "bg-amber-100 text-amber-800" : "bg-blue-100 text-blue-800"
                                                            )}>
                                                                Master: Rp {Number(item.masterHarga).toLocaleString('id-ID')} ({item.harga > (item.masterHarga ?? 0) ? `▲ +${Math.round(((item.harga - (item.masterHarga ?? 1)) / (item.masterHarga ?? 1)) * 100)}%` : '▼ Turun'})
                                                            </span>
                                                            <div className="flex items-center gap-1.5">
                                                                <label className="flex items-center gap-1 text-[10px] bg-amber-50 border border-amber-200 text-amber-800 px-1.5 py-0.5 rounded cursor-pointer hover:bg-amber-100 transition-colors whitespace-nowrap">
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={item.updateMasterPrice || false}
                                                                        onChange={e => {
                                                                            setPoItems(poItems.map(i => i.cartId === item.cartId ? { ...i, updateMasterPrice: e.target.checked } : i))
                                                                        }}
                                                                        className="rounded text-amber-600 focus:ring-amber-500 h-3 w-3"
                                                                    />
                                                                    <span>Auto-update di PO</span>
                                                                </label>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleQuickUpdateFromRow(item)}
                                                                    disabled={updatingItemId === item.cartId}
                                                                    className="text-[10px] font-semibold bg-amber-600 hover:bg-amber-700 text-white px-2 py-0.5 rounded shadow-xs flex items-center gap-1 transition-all"
                                                                    title="Langsung update database Master Barang sekarang"
                                                                >
                                                                    {updatingItemId === item.cartId ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : <Zap className="w-2.5 h-2.5" />}
                                                                    Update Master
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setShortcutItemId(item.id)
                                                                setShortcutNewPrice(item.harga)
                                                                setShortcutModalOpen(true)
                                                            }}
                                                            className="text-[10px] text-slate-400 hover:text-amber-600 flex items-center gap-0.5 font-medium transition-colors"
                                                            title="Buka shortcut ubah harga master untuk barang ini"
                                                        >
                                                            <Sparkles className="w-2.5 h-2.5" /> Ubah Master
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="py-2 px-4">
                                                <Input
                                                    placeholder="Contoh: Plat DT 8258 RI"
                                                    value={item.keterangan}
                                                    onChange={e => setPoItems(poItems.map(i => i.cartId === item.cartId ? { ...i, keterangan: e.target.value } : i))}
                                                    className="h-8 text-xs"
                                                />
                                            </td>
                                            <td className="py-2 px-4 text-right font-semibold whitespace-nowrap">
                                                Rp {(item.harga * item.quantity).toLocaleString('id-ID')}
                                            </td>
                                            <td className="py-2 px-4">
                                                <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-red-500"
                                                    onClick={() => setPoItems(poItems.filter(i => i.cartId !== item.cartId))}>
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot className="bg-slate-50/80">
                                    <tr>
                                        <td colSpan={5} className="py-4 px-4 text-right font-bold text-slate-700">TOTAL HARGA:</td>
                                        <td className="py-4 px-4 text-right font-bold text-lg text-green-700 whitespace-nowrap">
                                            Rp {totalHarga.toLocaleString('id-ID')}
                                        </td>
                                        <td></td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>

            <div className="flex justify-end gap-2 sticky bottom-4">
                <Button type="button" variant="outline" className="bg-white" onClick={() => router.back()}>Batal</Button>
                <Button type="submit" size="lg" disabled={poItems.length === 0 || saving} className="shadow-lg">
                    {saving ? "Menyimpan..." : "Simpan dan Generate Nomor PO"}
                </Button>
            </div>

            {/* Shortcut Ubah Harga Master Modal */}
            <Dialog open={shortcutModalOpen} onOpenChange={setShortcutModalOpen}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-amber-800">
                            <Sparkles className="w-5 h-5 text-amber-600" />
                            Shortcut Cepat Ubah Harga Master Barang
                        </DialogTitle>
                        <DialogDescription>
                            Ubah harga master barang secara instan tanpa perlu meninggalkan halaman PO. Perubahan akan otomatis dicatat ke riwayat kenaikan harga master barang.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-2">
                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold">Pilih Barang</Label>
                            <Combobox
                                options={shortcutItemOptions}
                                value={shortcutItemId}
                                onChange={handleShortcutItemSelect}
                                placeholder="Ketik untuk mencari barang..."
                            />
                        </div>

                        {shortcutItem && (
                            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 space-y-3">
                                <div className="grid grid-cols-2 gap-2 text-xs pb-2 border-b">
                                    <div>
                                        <span className="text-slate-500">Satuan:</span> <span className="font-semibold text-slate-800">{shortcutItem.satuan}</span>
                                    </div>
                                    <div>
                                        <span className="text-slate-500">Part/Tipe:</span> <span className="font-mono text-slate-800">{shortcutItem.part_number || "-"}</span>
                                    </div>
                                    <div>
                                        <span className="text-slate-500">Merk:</span> <span className="text-slate-800">{shortcutItem.merk || "-"}</span>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between bg-white p-2.5 rounded border">
                                    <span className="text-xs text-slate-500 font-medium">Harga Master Saat Ini:</span>
                                    <span className="text-sm font-bold text-slate-900">Rp {Number(shortcutItem.harga).toLocaleString('id-ID')}</span>
                                </div>

                                <div className="space-y-1.5">
                                    <Label className="text-xs font-semibold text-slate-700">Harga Master Baru (Rp) *</Label>
                                    <Input
                                        type="number"
                                        min="0"
                                        step="any"
                                        value={shortcutNewPrice}
                                        onChange={e => setShortcutNewPrice(e.target.value === "" ? "" : Number(e.target.value))}
                                        placeholder="Masukkan harga baru..."
                                        className="font-bold text-slate-900 text-base h-10"
                                    />
                                    {shortcutNewPrice !== "" && Number(shortcutNewPrice) !== Number(shortcutItem.harga) && (
                                        <div className="flex items-center justify-between text-xs pt-1 px-1">
                                            <span className="text-slate-500">Selisih:</span>
                                            <span className={cn(
                                                "font-bold",
                                                Number(shortcutNewPrice) > Number(shortcutItem.harga) ? "text-amber-600" : "text-blue-600"
                                            )}>
                                                {Number(shortcutNewPrice) > Number(shortcutItem.harga) ? `+Rp ${(Number(shortcutNewPrice) - Number(shortcutItem.harga)).toLocaleString('id-ID')} (+${Math.round(((Number(shortcutNewPrice) - Number(shortcutItem.harga)) / (Number(shortcutItem.harga) || 1)) * 100)}%) ▲ Kenaikan` : `-Rp ${(Number(shortcutItem.harga) - Number(shortcutNewPrice)).toLocaleString('id-ID')} (-${Math.round(((Number(shortcutItem.harga) - Number(shortcutNewPrice)) / (Number(shortcutItem.harga) || 1)) * 100)}%) ▼ Penurunan`}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-1.5">
                                    <Label className="text-xs font-medium text-slate-700">Alasan Perubahan (Opsional)</Label>
                                    <Input
                                        value={shortcutReason}
                                        onChange={e => setShortcutReason(e.target.value)}
                                        placeholder="Contoh: Kenaikan harga distributor saat buat PO"
                                        className="text-xs"
                                    />
                                </div>

                                {shortcutSuccessMsg && (
                                    <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs px-3 py-2 rounded flex items-center gap-2">
                                        <Check className="w-4 h-4 text-emerald-600" />
                                        {shortcutSuccessMsg}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button type="button" variant="outline" onClick={() => setShortcutModalOpen(false)}>
                            Tutup
                        </Button>
                        <Button
                            type="button"
                            onClick={handleShortcutSave}
                            disabled={!shortcutItemId || shortcutNewPrice === "" || Number(shortcutNewPrice) < 0 || shortcutUpdating}
                            className="bg-amber-600 hover:bg-amber-700 text-white font-medium"
                        >
                            {shortcutUpdating ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Menyimpan...
                                </>
                            ) : (
                                <>
                                    <Sparkles className="w-4 h-4 mr-2" /> Simpan & Update Harga Master
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </form>
    )
}
