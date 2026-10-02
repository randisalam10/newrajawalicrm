"use client"

import React, { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useRouter } from "next/navigation"
import { updatePurchaseOrder, submitPurchaseOrder } from "../../actions"
import { quickUpdateItemPrice } from "../../../master-barang/actions"
import { POFormDocInfo } from "../../components/form/po-form-doc-info"
import { POFormMetaSigners } from "../../components/form/po-form-meta-signers"
import { POItemPickerCard } from "../../components/form/po-item-picker-card"
import { POItemsTableCard } from "../../components/form/po-items-table-card"
import { POShortcutPriceDialog } from "../../components/form/po-shortcut-price-dialog"

type PoPaymentMethod = "CASH" | "CREDIT"

interface POEditClientProps {
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
}

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
    pembuatAdmin,
}: POEditClientProps) {
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

    // Initial state from initialPo
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

    // Filtered options
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
    const showVehicleFields = isSparepart || isPengadaanBaru

    const selectedVehicle = vehicles.find((v: any) => v.id === inputVehicleId)
    const isHM = selectedVehicle?.meter_type === "HM" ||
        selectedVehicle?.category?.name?.toLowerCase().includes("batching") ||
        selectedVehicle?.category?.name?.toLowerCase().includes("genset") ||
        selectedVehicle?.category?.name?.toLowerCase().includes("excavator") ||
        selectedVehicle?.category?.name?.toLowerCase().includes("loader") ||
        selectedVehicle?.category?.name?.toLowerCase().includes("pump")

    const meterUnitLabel = isHM ? "HM (Hour Meter)" : "KM Odometer"

    const parsedInputMeter = useMemo(() => {
        if (!inputKmHm) return null
        const cleaned = String(inputKmHm).replace(/[^0-9.]/g, '')
        const val = parseFloat(cleaned)
        return isNaN(val) ? null : val
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
                    pimpinan={pimpinan}
                    setPimpinan={setPimpinan}
                    kepalaPeralatan={kepalaPeralatan}
                    setKepalaPeralatan={setKepalaPeralatan}
                    jabatanKepala={jabatanKepala}
                    setJabatanKepala={setJabatanKepala}
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

            {/* Bottom Actions */}
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

            {/* Shortcut Modal */}
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
