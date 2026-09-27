"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
    Trash2, Plus, Info, Sparkles, Zap, Check, Loader2, Truck, AlertTriangle
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Combobox } from "@/components/ui/combobox"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { updatePurchaseOrder, submitPurchaseOrder } from "../../actions"
import { quickUpdateItemPrice } from "../../../master-barang/actions"
import { useRouter } from "next/navigation"

type PoPaymentMethod = "CASH" | "CREDIT"

export function POEditClient({ 
    initialPo, 
    companies, 
    categories, 
    suppliers, 
    items, 
    vehicles = [], 
    locations = [],
    userRole = "",
    userLocationId = null,
    pembuatAdmin 
}: {
    initialPo: any
    companies: any[]
    categories: any[]
    suppliers: any[]
    items: any[]
    vehicles?: any[]
    locations?: any[]
    userRole?: string
    userLocationId?: string | null
    pembuatAdmin: string
}) {
    const router = useRouter()
    const [saving, setSaving] = useState(false)

    // Corporate scope detection: SuperAdminBP, AdminLogistik, CEO, FVP, Approver
    const isCorp = userRole === "SuperAdminBP" || userRole === "AdminLogistik" || ["CEO", "FVP", "Approver"].includes(userRole || "")
    const [isForBp, setIsForBp] = useState<boolean>(initialPo.is_for_bp ?? (!isCorp ? true : false))
    const [selectedLocationId, setSelectedLocationId] = useState<string>(
        initialPo.locationId || (!isCorp && userLocationId ? userLocationId : "")
    )

    // Master items state
    const [masterItemsList, setMasterItemsList] = useState<any[]>(items)

    // Inisialisasi dari prop initialPo
    const [selectedCompanyId, setSelectedCompanyId] = useState(initialPo.companyGroupId || "")
    const [selectedProjectId, setSelectedProjectId] = useState(initialPo.companyProjectId || "")
    const [selectedCategoryId, setSelectedCategoryId] = useState(initialPo.categoryId || "")
    const [selectedSupplierId, setSelectedSupplierId] = useState(initialPo.supplierId || "")
    const [pimpinan, setPimpinan] = useState(initialPo.pimpinan || "")
    const [kepalaPeralatan, setKepalaPeralatan] = useState(initialPo.kepala_peralatan || "")
    const [jabatanKepala, setJabatanKepala] = useState(initialPo.jabatan_kepala || "Kepala Peralatan")

    // Map existing items
    const defaultItems = initialPo.items?.map((i: any) => {
        const m = items.find((it: any) => it.id === i.masterItemId) || i.masterItem
        return {
            ...i.masterItem,
            id: i.masterItemId,
            cartId: i.id,
            quantity: i.quantity,
            masterHarga: m?.harga ?? i.harga_satuan,
            harga: i.harga_satuan,
            keterangan: i.keterangan || "",
            updateMasterPrice: false,
            vehicleId: i.vehicleId || null,
            vehicleCode: i.vehicle?.code || null,
            vehiclePlate: i.vehicle?.plate_number || null,
            vehicleCategory: i.vehicle?.category?.name || i.vehicle?.vehicle_type || null,
            km_hm: i.km_hm || null
        }
    }) || []
    const [poItems, setPoItems] = useState<any[]>(defaultItems)

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

    const [metodePembayaran, setMetodePembayaran] = useState<PoPaymentMethod>(initialPo.metode_pembayaran || "CREDIT")
    const [tanggalTerbit, setTanggalTerbit] = useState(new Date(initialPo.tanggal_terbit).toISOString().split('T')[0])
    const [kmHm, setKmHm] = useState(initialPo.km_hm_kendaraan || "")
    const [notes, setNotes] = useState(initialPo.notes || "")
    const [picName, setPicName] = useState(initialPo.pic_name || "")
    const [picPhone, setPicPhone] = useState(initialPo.pic_phone || "")

    const selectedCompany = companies.find((c: any) => c.id === selectedCompanyId)
    const filteredProjects = selectedCompany?.projects || []
    const activeCategory = categories.find((c: any) => c.id === selectedCategoryId)
    const availableItems = masterItemsList.filter((i: any) => i.supplierId === selectedSupplierId)

    // Vehicle & Meter inputs for item-level allocation
    const [inputVehicleId, setInputVehicleId] = useState("")
    const [inputKmHm, setInputKmHm] = useState("")

    const isSparepart = activeCategory?.kode_kategori === "PO_SPAREPART" ||
        activeCategory?.name?.toLowerCase().includes("sparepart") ||
        activeCategory?.name?.toLowerCase().includes("suku cadang")
    const isPengadaanBaru = activeCategory?.kode_kategori === "PO_ALAT_BARU" ||
        activeCategory?.name?.toLowerCase().includes("pengadaan") ||
        activeCategory?.name?.toLowerCase().includes("alat")
    const isVehicleRequired = false // Opsional sesuai permintaan user
    const showVehicleFields = isSparepart || isPengadaanBaru

    const selectedVehicle = vehicles.find((v: any) => v.id === inputVehicleId)
    const isHM = selectedVehicle?.meter_type === "HM" ||
        selectedVehicle?.category?.name?.toLowerCase().includes("batching") ||
        selectedVehicle?.category?.name?.toLowerCase().includes("genset") ||
        selectedVehicle?.category?.name?.toLowerCase().includes("excavator") ||
        selectedVehicle?.category?.name?.toLowerCase().includes("loader") ||
        selectedVehicle?.category?.name?.toLowerCase().includes("pump")

    const meterUnitLabel = isHM ? "HM (Hour Meter)" : "KM Odometer"

    const parsedInputMeter = React.useMemo(() => {
        if (!inputKmHm) return null
        const cleaned = String(inputKmHm).replace(/[^0-9.]/g, '')
        const val = parseFloat(cleaned)
        return isNaN(val) ? null : val
    }, [inputKmHm])

    const effectiveLastMeter = React.useMemo(() => {
        let maxMeter = selectedVehicle?.lastKmMeter ? Number(selectedVehicle.lastKmMeter) : null
        for (const item of poItems) {
            if (item.vehicleId === inputVehicleId && item.km_hm) {
                const cleaned = String(item.km_hm).replace(/[^0-9.]/g, '')
                const val = parseFloat(cleaned)
                if (!isNaN(val) && (maxMeter === null || val > maxMeter)) {
                    maxMeter = val
                }
            }
        }
        return maxMeter
    }, [selectedVehicle, poItems, inputVehicleId])

    const isBackdateAnomaly = React.useMemo(() => {
        if (!effectiveLastMeter || !parsedInputMeter) return false
        return parsedInputMeter < effectiveLastMeter
    }, [effectiveLastMeter, parsedInputMeter])

    const vehicleOptions = React.useMemo(() => {
        return vehicles.map((v: any) => {
            const cat = v.category?.name || v.vehicle_type || "Unit"
            const plate = v.plate_number ? ` - ${v.plate_number}` : ""
            const loc = v.location?.name ? ` [${v.location.name}]` : ""
            const meter = v.lastKmMeter ? ` (${Number(v.lastKmMeter).toLocaleString('id-ID')} ${v.meter_type || 'KM'})` : ""
            return {
                value: v.id,
                label: `${v.code}${plate} - ${cat}${loc}${meter}`
            }
        })
    }, [vehicles])

    const handleCompanyChange = (val: string) => {
        setSelectedCompanyId(val)
        setSelectedProjectId("")
        const comp = companies.find((c: any) => c.id === val)
        if (comp) {
            setPimpinan(comp.pimpinan_default || "")
            setKepalaPeralatan(comp.kepala_peralatan_default || "")
            setJabatanKepala(comp.jabatan_kepala_default || "Kepala Peralatan")
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

        // Alokasi unit kendaraan bersifat opsional. Jika diisi bersama KM/HM, tetap divalidasi agar tidak backdate
        if (inputVehicleId && isBackdateAnomaly && effectiveLastMeter && parsedInputMeter) {
            const proceed = window.confirm(
                `⚠️ PERINGATAN BACKDATE ODOMETER / JAM OPERASI:\n\n` +
                `Unit: ${selectedVehicle?.code} (${selectedVehicle?.plate_number})\n` +
                `Input saat ini: ${parsedInputMeter.toLocaleString('id-ID')} ${isHM ? 'HM' : 'KM'}\n` +
                `Catatan meter terakhir di sistem: ${effectiveLastMeter.toLocaleString('id-ID')} (${selectedVehicle?.lastKmSource || 'Sistem'})\n` +
                `Selisih: ${(parsedInputMeter - effectiveLastMeter).toLocaleString('id-ID')} (LEBIH KECIL)\n\n` +
                `Apakah angka ini sudah benar dan Anda ingin tetap menyimpannya?`
            )
            if (!proceed) return
        }

        const qty = Number(inputQty) > 0 ? Number(inputQty) : 1
        const price = inputHarga !== "" ? Number(inputHarga) : itm.harga

        const veh = vehicles.find((v: any) => v.id === inputVehicleId)
        const vehicleText = veh ? `[${veh.code} - ${veh.plate_number}${inputKmHm ? ` | ${inputKmHm}` : ""}]` : ""
        const mergedKeterangan = inputKeterangan.trim()
            ? (vehicleText ? `${vehicleText} ${inputKeterangan.trim()}` : inputKeterangan.trim())
            : (vehicleText || undefined)

        setPoItems([...poItems, {
            ...itm,
            cartId: Math.random().toString(),
            masterHarga: itm.harga,
            harga: price,
            quantity: qty,
            keterangan: mergedKeterangan,
            updateMasterPrice: inputUpdateMaster,
            vehicleId: inputVehicleId || null,
            vehicleCode: veh?.code || null,
            vehiclePlate: veh?.plate_number || null,
            vehicleCategory: veh?.category?.name || veh?.vehicle_type || null,
            km_hm: inputKmHm.trim() || null
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
                "Penyesuaian harga saat edit PO"
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
                `Update via edit PO (${item.keterangan || 'Penyesuaian PO'})`
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
            setShortcutReason("Penyesuaian harga saat edit PO")
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

    const handleSubmit = async (e?: React.FormEvent, shouldSubmit: boolean = false) => {
        if (e && e.preventDefault) e.preventDefault()
        if (poItems.length === 0) { alert("Tambahkan minimal 1 item barang."); return }
        if (!selectedCompanyId || !selectedCategoryId || !selectedSupplierId) {
            alert("Perusahaan, Kategori, dan Toko wajib dipilih.")
            return
        }

        setSaving(true)
        try {
            const result = await updatePurchaseOrder(initialPo.id, {
                companyGroupId: selectedCompanyId,
                companyProjectId: selectedProjectId || undefined,
                categoryId: selectedCategoryId,
                supplierId: selectedSupplierId,
                is_for_bp: isForBp,
                locationId: isForBp ? selectedLocationId || undefined : undefined,
                pimpinan,
                kepala_peralatan: kepalaPeralatan,
                jabatan_kepala: jabatanKepala || undefined,
                metode_pembayaran: metodePembayaran,
                km_hm_kendaraan: kmHm || undefined,
                tanggal_terbit: new Date(tanggalTerbit),
                notes: notes || undefined,
                pic_name: picName || undefined,
                pic_phone: picPhone || undefined,
                pembuat_admin: pembuatAdmin,
                items: poItems.map(item => ({
                    masterItemId: item.id,
                    quantity: item.quantity,
                    harga_satuan: item.harga,
                    keterangan: item.keterangan || undefined,
                    subtotal: item.harga * item.quantity,
                    updateMasterPrice: item.updateMasterPrice || false,
                    vehicleId: item.vehicleId || undefined,
                    km_hm: item.km_hm || undefined
                }))
            })

            if (result.success) {
                if (shouldSubmit) {
                    const submitRes = await submitPurchaseOrder(initialPo.id)
                    if (submitRes.success) {
                        alert("PO Berhasil diperbarui dan diajukan untuk persetujuan!")
                    } else {
                        alert("PO diperbarui, namun gagal diajukan: " + submitRes.error)
                    }
                } else {
                    alert("PO Berhasil diperbarui!")
                }
                router.push(`/logistik/po`)
                router.refresh()
            } else {
                alert("Gagal memperbarui PO: " + result.error)
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
                            <div className="space-y-2 p-3 bg-slate-50 border border-slate-200 rounded-md">
                                <Label className="text-slate-800 font-semibold">KM/HM Kendaraan (Opsional)</Label>
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
                        <div className="grid grid-cols-2 gap-4 border-t pt-4">
                            <div className="space-y-2">
                                <Label>Nama Pimpinan (Kiri)</Label>
                                <Input value={pimpinan} onChange={e => setPimpinan(e.target.value)} required />
                            </div>
                            <div className="space-y-2">
                                <Label>Nama Kepala/Pengaju (Kanan)</Label>
                                <Input value={kepalaPeralatan} onChange={e => setKepalaPeralatan(e.target.value)} required />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Jabatan Pengaju (Kanan)</Label>
                            <Input value={jabatanKepala} onChange={e => setJabatanKepala(e.target.value)} required />
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

                                {/* Alokasi Unit Kendaraan / Alat & KM/HM untuk Kategori Sparepart atau Pengadaan Baru */}
                                {showVehicleFields && (
                                    <div className="p-3 rounded-lg border space-y-2 bg-slate-50 border-slate-200">
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="font-semibold flex items-center gap-1.5 text-slate-800">
                                                <Truck className="w-3.5 h-3.5 text-blue-600" />
                                                <span>Alokasi Unit Kendaraan / Alat</span>
                                                <span className="text-slate-400 font-normal text-[11px]">(Opsional)</span>
                                            </span>
                                            {selectedVehicle && (
                                                <span className="text-[10px] font-mono text-blue-700 bg-white px-2 py-0.5 rounded border border-blue-200 font-medium">
                                                    {selectedVehicle.category?.name || selectedVehicle.vehicle_type} {selectedVehicle.location?.name ? `• ${selectedVehicle.location.name}` : ""}
                                                </span>
                                            )}
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                                            <div className="md:col-span-8 space-y-1">
                                                <Label className="text-xs font-medium text-slate-700">Pilih Kendaraan / Alat (Opsional)</Label>
                                                <Combobox
                                                    options={vehicleOptions}
                                                    value={inputVehicleId}
                                                    onChange={setInputVehicleId}
                                                    placeholder="Pilih unit armada, mixer, alat berat, genset (jika ada)..."
                                                />
                                            </div>
                                            <div className="md:col-span-4 space-y-1">
                                                <Label className="text-xs font-medium text-slate-700">{meterUnitLabel} (Opsional)</Label>
                                                <Input
                                                    placeholder={isHM ? "Misal: 2.450 HM" : "Misal: 15.000 KM"}
                                                    value={inputKmHm}
                                                    onChange={e => setInputKmHm(e.target.value)}
                                                    className={cn("h-9 text-xs bg-white", isBackdateAnomaly && "border-rose-400 focus:ring-rose-500")}
                                                />
                                            </div>
                                        </div>

                                        {effectiveLastMeter && (
                                            <div className="flex items-center justify-between flex-wrap gap-1.5 text-[11px] bg-white px-2.5 py-1.5 rounded border border-slate-200 mt-1">
                                                <div className="flex items-center gap-1.5 text-slate-600">
                                                    <span className="font-medium text-slate-500">Catatan Meter Terakhir:</span>
                                                    <span className="font-mono font-bold text-slate-900">
                                                        {Number(effectiveLastMeter).toLocaleString('id-ID')} {isHM ? "HM" : "KM"}
                                                    </span>
                                                    <span className="text-[10px] text-slate-400">
                                                        ({selectedVehicle?.lastKmSource || "Sistem"}{selectedVehicle?.lastKmDate ? ` • ${new Date(selectedVehicle.lastKmDate).toLocaleDateString('id-ID')}` : ""})
                                                    </span>
                                                </div>
                                                {isBackdateAnomaly && (
                                                    <div className="flex items-center gap-1 text-rose-700 font-semibold text-[11px] bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                                                        <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                                                        <span>Nilai lebih kecil dari meter terakhir (potensi backdate)</span>
                                                    </div>
                                                )}
                                            </div>
                                        )}
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
                                        <th className="py-2.5 px-4 text-left font-semibold text-slate-600 w-40">Kendaraan / Unit</th>
                                        <th className="py-2.5 px-4 text-center font-semibold text-slate-600 w-28">KM / HM</th>
                                        <th className="py-2.5 px-4 text-center font-semibold text-slate-600 w-20">Qty</th>
                                        <th className="py-2.5 px-4 text-left font-semibold text-slate-600 w-16">Satuan</th>
                                        <th className="py-2.5 px-4 text-right font-semibold text-slate-600 w-40">Harga Satuan</th>
                                        <th className="py-2.5 px-4 text-left font-semibold text-slate-600">Keterangan Khusus</th>
                                        <th className="py-2.5 px-4 text-right font-semibold text-slate-600 w-32">Total Harga</th>
                                        <th className="py-2.5 px-4 w-10"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {poItems.map((item) => (
                                        <tr key={item.cartId} className="border-b hover:bg-slate-50/50 text-xs">
                                            <td className="py-3 px-4">
                                                <div className="font-semibold text-slate-900">{item.name}</div>
                                                <div className="text-[11px] text-slate-500 mt-0.5">
                                                    Part: {item.part_number || "-"} | Merk: {item.merk || "-"}
                                                </div>
                                            </td>
                                            <td className="py-2 px-4">
                                                {item.vehicleCode ? (
                                                    <div>
                                                        <div className="font-bold text-slate-800 font-mono flex items-center gap-1 text-xs">
                                                            <Truck className="w-3 h-3 text-blue-600" />
                                                            {item.vehicleCode}
                                                        </div>
                                                        <div className="text-[10px] text-slate-500 truncate max-w-[140px]">
                                                            {item.vehiclePlate} {item.vehicleCategory ? `(${item.vehicleCategory})` : ""}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <span className="text-slate-400 text-xs">-</span>
                                                )}
                                            </td>
                                            <td className="py-2 px-4 text-center font-mono">
                                                {item.km_hm ? (
                                                    <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 font-semibold text-slate-700 text-[11px]">
                                                        {item.km_hm}
                                                    </span>
                                                ) : (
                                                    <span className="text-slate-400 text-xs">-</span>
                                                )}
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

            <div className="flex justify-end gap-2.5 sticky bottom-4 bg-white/95 backdrop-blur-xs p-3 rounded-xl border border-slate-200/80 shadow-lg">
                <Button type="button" variant="outline" className="bg-white" onClick={() => router.back()}>
                    Batal
                </Button>
                {initialPo.status === "DRAFT" ? (
                    <>
                        <Button 
                            type="button" 
                            variant="outline"
                            size="lg" 
                            disabled={poItems.length === 0 || saving} 
                            className="border-slate-300 text-slate-700 hover:bg-slate-100 font-medium"
                            onClick={() => handleSubmit(undefined, false)}
                        >
                            {saving ? "Menyimpan..." : "💾 Simpan Perubahan (Tetap Draft)"}
                        </Button>
                        <Button 
                            type="button" 
                            size="lg" 
                            disabled={poItems.length === 0 || saving} 
                            className="bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-md gap-1.5"
                            onClick={() => handleSubmit(undefined, true)}
                        >
                            {saving ? "Menyimpan..." : "🚀 Simpan & Ajukan Persetujuan"}
                        </Button>
                    </>
                ) : (
                    <Button 
                        type="button" 
                        size="lg" 
                        disabled={poItems.length === 0 || saving} 
                        className="bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-md"
                        onClick={() => handleSubmit(undefined, false)}
                    >
                        {saving ? "Menyimpan..." : "Simpan Perubahan PO"}
                    </Button>
                )}
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
                                        placeholder="Contoh: Kenaikan harga distributor saat edit PO"
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
