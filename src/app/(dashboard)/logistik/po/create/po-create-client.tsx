"use client"

import React, { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { CheckCircle } from "lucide-react"
import { createPurchaseOrder } from "../actions"
import { quickUpdateItemPrice } from "../../master-barang/actions"
import { POFormDocInfo } from "../components/form/po-form-doc-info"
import { POFormMetaSigners } from "../components/form/po-form-meta-signers"
import { POItemPickerCard } from "../components/form/po-item-picker-card"
import { POItemsTableCard } from "../components/form/po-items-table-card"
import { POShortcutPriceDialog } from "../components/form/po-shortcut-price-dialog"

type PoPaymentMethod = "CASH" | "CREDIT"

export function POCreateClient({
    companies,
    categories,
    suppliers,
    items,
    signers,
    vehicles = [],
    locations = [],
    userRole = "",
    userLocationId = null,
    pembuatAdmin
}: {
    companies: any[]
    categories: any[]
    suppliers: any[]
    items: any[]
    signers: any[]
    vehicles?: any[]
    locations?: any[]
    userRole?: string
    userLocationId?: string | null
    pembuatAdmin: string
}) {
    const router = useRouter()
    const [saving, setSaving] = useState(false)
    const [savedPoNumber, setSavedPoNumber] = useState<string | null>(null)
    const [savedPoId, setSavedPoId] = useState<string | null>(null)
    const [savedAsDraft, setSavedAsDraft] = useState(false)

    // Corporate scope detection: SuperAdminBP, AdminLogistik, CEO, FVP, Approver
    const isCorp = userRole === "SuperAdminBP" || userRole === "AdminLogistik" || ["CEO", "FVP", "Approver"].includes(userRole || "")
    const [isForBp, setIsForBp] = useState(!isCorp ? true : false)
    const [selectedLocationId, setSelectedLocationId] = useState(!isCorp && userLocationId ? userLocationId : "")

    // Master items state
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
    const [inputVehicleId, setInputVehicleId] = useState("")
    const [inputKmHm, setInputKmHm] = useState("")
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

    useEffect(() => {
        setTanggalTerbit(new Date().toISOString().split('T')[0])
    }, [])

    const selectedCompany = companies.find((c: any) => c.id === selectedCompanyId)
    const filteredProjects = selectedCompany?.projects || []
    const activeCategory = categories.find((c: any) => c.id === selectedCategoryId)
    const availableItems = masterItemsList.filter((i: any) => i.supplierId === selectedSupplierId)

    // Category requirement rules
    const isSparepart = activeCategory?.kode_kategori === "SPR" || activeCategory?.name?.toLowerCase().includes("sparepart")
    const isPengadaanBaru = activeCategory?.kode_kategori === "PEN" || activeCategory?.name?.toLowerCase().includes("pengadaan")
    const showVehicleFields = isSparepart || isPengadaanBaru

    const selectedVehicle = vehicles.find((v: any) => v.id === inputVehicleId)
    const isHM = selectedVehicle?.meter_type === "HM" ||
        selectedVehicle?.category?.name?.toLowerCase().includes("batching") ||
        selectedVehicle?.category?.name?.toLowerCase().includes("genset") ||
        selectedVehicle?.category?.name?.toLowerCase().includes("excavator") ||
        selectedVehicle?.category?.name?.toLowerCase().includes("loader") ||
        selectedVehicle?.category?.name?.toLowerCase().includes("pump")
    const meterUnitLabel = isHM ? "Hour Meter (HM)" : "Odometer (KM)"

    const parsedInputMeter = useMemo(() => {
        if (!inputKmHm) return null
        const cleaned = String(inputKmHm).replace(/[^0-9.]/g, '')
        const num = parseFloat(cleaned)
        return (!isNaN(num) && num > 0) ? num : null
    }, [inputKmHm])

    const effectiveLastMeter = useMemo(() => {
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

    const isBackdateAnomaly = useMemo(() => {
        if (!effectiveLastMeter || !parsedInputMeter) return false
        return parsedInputMeter < effectiveLastMeter
    }, [effectiveLastMeter, parsedInputMeter])

    const vehicleOptions = useMemo(() => {
        return vehicles.map((v: any) => {
            const cat = v.category?.name || v.vehicle_type || "Unit"
            const loc = v.location?.name ? ` • ${v.location.name}` : ""
            const plate = v.plate_number ? ` - ${v.plate_number}` : ""
            const spec = v.merk_model ? ` (${v.merk_model})` : ""
            return {
                value: v.id,
                label: `[${v.code}]${plate} [${cat}${loc}]${spec}`,
            }
        })
    }, [vehicles])

    const handleCompanyChange = (val: string) => {
        setSelectedCompanyId(val)
        setSelectedProjectId("")
        const comp = companies.find((c: any) => c.id === val)
        if (comp) {
            const ceoSigner = signers.find(s => s.id === comp.defaultCeoId)
            const fvpSigner = signers.find(s => s.id === comp.defaultFvpId)
            
            setPimpinan(ceoSigner?.employee?.name || ceoSigner?.username || comp.pimpinan_default || "")
            setKepalaPeralatan(fvpSigner?.employee?.name || fvpSigner?.username || comp.kepala_peralatan_default || "-")
            setJabatanKepala(fvpSigner ? "Approver" : (comp.jabatan_kepala_default || ""))
            setSelectedCeoId(ceoSigner ? comp.defaultCeoId : "none")
            setSelectedFvpId(fvpSigner ? comp.defaultFvpId : "none")
        }
    }

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

    const handleAddItem = () => {
        if (!selectedItemId) return
        const itm = masterItemsList.find((i: any) => i.id === selectedItemId)
        if (!itm) return

        if (inputVehicleId && isBackdateAnomaly && effectiveLastMeter && parsedInputMeter) {
            const confirmAdd = confirm(
                `PERINGATAN METER BACKDATE / MUNDUR:\n\n` +
                `Unit: ${selectedVehicle?.code} (${selectedVehicle?.plate_number})\n` +
                `Nilai ${meterUnitLabel} yang dimasukkan: ${parsedInputMeter.toLocaleString('id-ID')}\n` +
                `Catatan meter terakhir di sistem: ${effectiveLastMeter.toLocaleString('id-ID')} (${selectedVehicle?.lastKmSource || 'Sistem'})\n` +
                `Selisih: ${(parsedInputMeter - effectiveLastMeter).toLocaleString('id-ID')} (LEBIH KECIL)\n\n` +
                `Apakah Anda yakin data meter ini benar dan ingin tetap menambahkannya?`
            )
            if (!confirmAdd) return
        }

        const qty = Number(inputQty) > 0 ? Number(inputQty) : 1
        const price = inputHarga !== "" ? Number(inputHarga) : itm.harga

        const veh = vehicles.find((v: any) => v.id === inputVehicleId)
        const vehicleText = veh ? `[${veh.code} - ${veh.plate_number}${inputKmHm ? ` | ${inputKmHm}` : ""}]` : ""
        const fullKeterangan = inputKeterangan.trim()
            ? (vehicleText ? `${vehicleText} ${inputKeterangan.trim()}` : inputKeterangan.trim())
            : (vehicleText || undefined)

        setPoItems([...poItems, {
            ...itm,
            cartId: Math.random().toString(),
            masterHarga: itm.harga,
            harga: price,
            quantity: qty,
            keterangan: fullKeterangan,
            rawKeterangan: inputKeterangan,
            updateMasterPrice: inputUpdateMaster,
            vehicleId: inputVehicleId || null,
            vehicleCode: veh?.code || null,
            vehiclePlate: veh?.plate_number || null,
            vehicleCategory: veh?.category?.name || veh?.vehicle_type || null,
            km_hm: inputKmHm || null,
        }])

        setSelectedItemId("")
        setShowPriceEditor(false)
        setInputQty(1)
        setInputHarga("")
        setInputKeterangan("")
        setInputUpdateMaster(false)
    }

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

    const handleSubmit = async (e?: React.FormEvent, isDraft: boolean = false) => {
        if (e && e.preventDefault) e.preventDefault()
        if (poItems.length === 0) { alert("Tambahkan minimal 1 item barang."); return }
        if (!selectedCompanyId || !selectedCategoryId || !selectedSupplierId) {
            alert("Perusahaan, Kategori, dan Toko wajib dipilih.")
            return
        }

        if (isForBp && isCorp && !selectedLocationId) {
            alert("Silakan pilih Cabang Batching Plant untuk PO bertag BP.")
            return
        }

        setSaving(true)
        try {
            const finalLocationId = isForBp ? (!isCorp ? (userLocationId || undefined) : (selectedLocationId || undefined)) : undefined
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
                locationId: finalLocationId,
                is_for_bp: isForBp,
                notes: notes || undefined,
                pic_name: picName || undefined,
                pic_phone: picPhone || undefined,
                ceoId: selectedCeoId !== "none" ? selectedCeoId : undefined,
                fvpId: selectedFvpId !== "none" ? selectedFvpId : undefined,
                pembuat_admin: pembuatAdmin,
                isDraft,
                items: poItems.map(item => ({
                    masterItemId: item.id,
                    quantity: item.quantity,
                    harga_satuan: item.harga,
                    keterangan: item.keterangan || undefined,
                    subtotal: item.harga * item.quantity,
                    updateMasterPrice: item.updateMasterPrice || false,
                    vehicleId: item.vehicleId || undefined,
                    km_hm: item.km_hm || undefined,
                }))
            })

            if (result.success && result.po_number) {
                setSavedPoNumber(result.po_number)
                setSavedPoId((result as any).id || null)
                setSavedAsDraft(isDraft)
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
                <h2 className="text-2xl font-bold">
                    {savedAsDraft ? "PO Berhasil Disimpan sebagai Draft!" : "PO Berhasil Dibuat & Diajukan!"}
                </h2>
                <p className="text-muted-foreground">Nomor PO: <span className="font-mono font-bold text-slate-800">{savedPoNumber}</span></p>
                <div className="text-xs px-3 py-1.5 rounded-full font-medium border">
                    {savedAsDraft ? (
                        <span className="text-slate-600 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
                            Status: <strong>DRAFT</strong> (Belum diajukan. Anda dapat mengedit dan mengajukannya nanti)
                        </span>
                    ) : (
                        <span className="text-blue-700 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
                            Status: <strong>SUBMITTED</strong> (Telah diajukan untuk persetujuan Approver/FVP/CEO)
                        </span>
                    )}
                </div>
                <div className="flex gap-3 mt-4">
                    <Button variant="outline" onClick={() => router.push("/logistik/po")}>Lihat Daftar PO</Button>
                    <Button onClick={() => router.push(`/print/po/${savedPoId || savedPoNumber}`)}>Print PO</Button>
                </div>
            </div>
        )
    }

    return (
        <form onSubmit={handleSubmit} className="w-full space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Bagian Kiri: Informasi Dokumen & Tujuan */}
                <POFormDocInfo
                    companies={companies}
                    companyOptions={companyOptions}
                    selectedCompanyId={selectedCompanyId}
                    onCompanyChange={handleCompanyChange}
                    isForBp={isForBp}
                    setIsForBp={setIsForBp}
                    isCorp={isCorp}
                    selectedLocationId={selectedLocationId}
                    setSelectedLocationId={setSelectedLocationId}
                    locations={locations}
                    userLocationId={userLocationId}
                    projectOptions={projectOptions}
                    selectedProjectId={selectedProjectId}
                    setSelectedProjectId={setSelectedProjectId}
                    categoryOptions={categoryOptions}
                    selectedCategoryId={selectedCategoryId}
                    setSelectedCategoryId={setSelectedCategoryId}
                    activeCategory={activeCategory}
                    kmHm={kmHm}
                    setKmHm={setKmHm}
                    supplierOptions={supplierOptions}
                    selectedSupplierId={selectedSupplierId}
                    onSupplierChange={(val) => { setSelectedSupplierId(val); setPoItems([]) }}
                    metodePembayaran={metodePembayaran}
                    setMetodePembayaran={setMetodePembayaran}
                />

                {/* Bagian Kanan: Penandatangan & Meta */}
                <POFormMetaSigners
                    tanggalTerbit={tanggalTerbit}
                    setTanggalTerbit={setTanggalTerbit}
                    signers={signers}
                    selectedCeoId={selectedCeoId}
                    onCeoChange={(val) => {
                        setSelectedCeoId(val)
                        if (val === "none") {
                            setPimpinan("")
                        } else {
                            const s = signers.find(u => u.id === val)
                            setPimpinan(s?.employee?.name || s?.username || "")
                        }
                    }}
                    selectedFvpId={selectedFvpId}
                    onFvpChange={(val) => {
                        setSelectedFvpId(val)
                        if (val === "none") {
                            setKepalaPeralatan("-")
                            setJabatanKepala("")
                        } else {
                            const s = signers.find(u => u.id === val)
                            setKepalaPeralatan(s?.employee?.name || s?.username || "")
                            setJabatanKepala("Approver")
                        }
                    }}
                    pembuatAdmin={pembuatAdmin}
                    notes={notes}
                    setNotes={setNotes}
                    picName={picName}
                    setPicName={setPicName}
                    picPhone={picPhone}
                    setPicPhone={setPicPhone}
                />
            </div>

            {/* Rincian Barang Pesanan */}
            <Card className="shadow-sm">
                <POItemPickerCard
                    selectedSupplierId={selectedSupplierId}
                    itemOptions={itemOptions}
                    selectedItemId={selectedItemId}
                    onSelectItem={handleSelectItem}
                    selectedItem={selectedItem}
                    showPriceEditor={showPriceEditor}
                    setShowPriceEditor={setShowPriceEditor}
                    inputHarga={inputHarga}
                    setInputHarga={setInputHarga}
                    inputUpdateMaster={inputUpdateMaster}
                    setInputUpdateMaster={setInputUpdateMaster}
                    updatingItemId={updatingItemId}
                    onQuickUpdatePicker={handleQuickUpdatePicker}
                    showVehicleFields={showVehicleFields}
                    selectedVehicle={selectedVehicle}
                    vehicleOptions={vehicleOptions}
                    inputVehicleId={inputVehicleId}
                    setInputVehicleId={setInputVehicleId}
                    inputKmHm={inputKmHm}
                    setInputKmHm={setInputKmHm}
                    isHM={isHM}
                    meterUnitLabel={meterUnitLabel}
                    isBackdateAnomaly={isBackdateAnomaly}
                    effectiveLastMeter={effectiveLastMeter}
                    inputQty={inputQty}
                    setInputQty={setInputQty}
                    inputKeterangan={inputKeterangan}
                    setInputKeterangan={setInputKeterangan}
                    onAddItem={handleAddItem}
                    onOpenShortcutModal={() => {
                        setShortcutItemId(selectedItemId || "")
                        if (selectedItemId) {
                            const itm = masterItemsList.find(i => i.id === selectedItemId)
                            if (itm) setShortcutNewPrice(itm.harga)
                        }
                        setShortcutModalOpen(true)
                    }}
                />
                <CardContent className="p-0">
                    <POItemsTableCard
                        selectedSupplierId={selectedSupplierId}
                        poItems={poItems}
                        setPoItems={setPoItems}
                        totalHarga={totalHarga}
                        updatingItemId={updatingItemId}
                        onQuickUpdateFromRow={handleQuickUpdateFromRow}
                        onOpenShortcutModalWithItem={(item) => {
                            setShortcutItemId(item.id)
                            setShortcutNewPrice(item.harga)
                            setShortcutModalOpen(true)
                        }}
                    />
                </CardContent>
            </Card>

            {/* Sticky Action Footer */}
            <div className="flex justify-end gap-2.5 sticky bottom-4 bg-white/95 backdrop-blur-xs p-3 rounded-xl border border-slate-200/80 shadow-lg">
                <Button type="button" variant="outline" className="bg-white" onClick={() => router.back()}>
                    Batal
                </Button>
                <Button 
                    type="button" 
                    variant="outline"
                    size="lg" 
                    disabled={poItems.length === 0 || saving} 
                    className="border-slate-300 text-slate-700 hover:bg-slate-100 font-medium"
                    onClick={() => handleSubmit(undefined, true)}
                >
                    {saving ? "Menyimpan..." : "💾 Simpan sebagai Draft"}
                </Button>
                <Button 
                    type="button" 
                    size="lg" 
                    disabled={poItems.length === 0 || saving} 
                    className="bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-md gap-1.5"
                    onClick={() => handleSubmit(undefined, false)}
                >
                    {saving ? "Menyimpan..." : "🚀 Simpan & Ajukan Persetujuan"}
                </Button>
            </div>

            {/* Shortcut Ubah Harga Master Modal */}
            <POShortcutPriceDialog
                open={shortcutModalOpen}
                onOpenChange={setShortcutModalOpen}
                shortcutItemId={shortcutItemId}
                shortcutItemOptions={shortcutItemOptions}
                shortcutItem={shortcutItem}
                shortcutNewPrice={shortcutNewPrice}
                setShortcutNewPrice={setShortcutNewPrice}
                shortcutReason={shortcutReason}
                setShortcutReason={setShortcutReason}
                shortcutUpdating={shortcutUpdating}
                shortcutSuccessMsg={shortcutSuccessMsg}
                onItemSelect={handleShortcutItemSelect}
                onSave={handleShortcutSave}
            />
        </form>
    )
}
