"use client"

import { useState, useEffect, useMemo } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { FileText, Edit3, Calculator, AlertCircle, Building2, CheckCircle2 } from "lucide-react"
import { createIncomingMaterial, updateIncomingMaterial } from "./actions"
import { MaterialInRow } from "./columns"

const formSchema = z.object({
    date: z.string().min(1, "Tanggal wajib diisi"),
    name: z.string().min(1, "Nama Semen wajib diisi"),
    supplier: z.string().min(1, "Distributor wajib diisi"),
    tonnage: z.coerce.number().min(1, "Berat harus lebih dari 0 KG"),
    delivery_note: z.string().min(1, "No Bon / Surat Jalan wajib diisi"),
    locationId: z.string().optional(),
    unit_price: z.coerce.number().min(0).optional(),
    total_price: z.coerce.number().min(0).optional(),
    purchase_unit: z.string().optional(),
    purchase_qty: z.coerce.number().min(0).optional(),
    purchaseOrderId: z.string().optional().nullable(),
    poItemId: z.string().optional().nullable(),
})

export function MaterialInForm({
    isOpen,
    initialData,
    locations,
    approvedPos = [],
    userRole,
    userLocationId,
    onSuccess,
    onCancel
}: {
    isOpen: boolean
    initialData?: MaterialInRow | null
    locations: any[]
    approvedPos?: any[]
    userRole: string
    userLocationId?: string | null
    onSuccess: () => void
    onCancel: () => void
}) {
    const [isLoading, setIsLoading] = useState(false)
    const [mode, setMode] = useState<"PO" | "MANUAL">("PO")
    const [selectedPoId, setSelectedPoId] = useState<string>("")
    const [selectedPoItemId, setSelectedPoItemId] = useState<string>("")

    const form = useForm<any>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            date: new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16),
            name: "",
            supplier: "",
            tonnage: 0,
            delivery_note: "",
            locationId: userLocationId || "",
            unit_price: 0,
            total_price: 0,
            purchase_unit: "KAPSUL",
            purchase_qty: 1,
            purchaseOrderId: null,
            poItemId: null,
        } as any,
    })

    // Filter POs relevant to this location
    const availablePos = useMemo(() => {
        if (!userLocationId || userRole === "SuperAdminBP") return approvedPos
        return approvedPos.filter((p: any) => !p.locationId || p.locationId === userLocationId)
    }, [approvedPos, userLocationId, userRole])

    const selectedPo = useMemo(() => {
        return availablePos.find((p: any) => p.id === selectedPoId)
    }, [availablePos, selectedPoId])

    const selectedPoItem = useMemo(() => {
        if (!selectedPo) return null
        return selectedPo.items.find((i: any) => i.id === selectedPoItemId)
    }, [selectedPo, selectedPoItemId])

    // Reset when modal opens or initialData changes
    useEffect(() => {
        if (initialData && isOpen) {
            const hasPo = Boolean(initialData.purchaseOrderId)
            setMode(hasPo ? "PO" : "MANUAL")
            setSelectedPoId(initialData.purchaseOrderId || "")
            setSelectedPoItemId(initialData.poItemId || "")

            const rawTonnage = initialData.tonnage || 0
            let defaultUnit = initialData.purchase_unit || "KG"
            let defaultQty = initialData.purchase_qty || 0
            let defaultUnitPrice = initialData.unit_price || 0
            let defaultTotalPrice = initialData.total_price || 0

            // Auto-detect untuk data eksisting / migrasi lama (seperti 15.200 KG semen curah kapsul):
            if ((defaultUnit === "KG" || !initialData.purchase_unit) && rawTonnage >= 5000 && defaultQty === 0) {
                defaultUnit = "KAPSUL"
                defaultQty = 1
            } else if (defaultQty === 0 && rawTonnage > 0) {
                defaultQty = defaultUnit === "TON" 
                    ? Math.round((rawTonnage / 1000) * 100) / 100 
                    : (defaultUnit === "KAPSUL" ? 1 : rawTonnage)
            }

            // Jika total_price ada tapi unit_price 0, atau sebaliknya
            if (defaultTotalPrice > 0 && defaultUnitPrice === 0 && defaultQty > 0) {
                defaultUnitPrice = Math.round(defaultTotalPrice / defaultQty)
            } else if (defaultUnitPrice > 0 && defaultTotalPrice === 0 && defaultQty > 0) {
                defaultTotalPrice = Math.round(defaultQty * defaultUnitPrice)
            }

            form.reset({
                date: new Date(initialData.date).toISOString().slice(0, 16),
                name: initialData.name,
                supplier: initialData.supplier,
                tonnage: rawTonnage,
                delivery_note: initialData.delivery_note,
                locationId: initialData.locationId,
                unit_price: defaultUnitPrice,
                total_price: defaultTotalPrice,
                purchase_unit: defaultUnit,
                purchase_qty: defaultQty,
                purchaseOrderId: initialData.purchaseOrderId || null,
                poItemId: initialData.poItemId || null,
            })
        } else if (isOpen) {
            const defaultMode = availablePos.length > 0 ? "PO" : "MANUAL"
            setMode(defaultMode)
            setSelectedPoId("")
            setSelectedPoItemId("")

            form.reset({
                date: new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16),
                name: "",
                supplier: "",
                tonnage: 0,
                delivery_note: "",
                locationId: userLocationId || "",
                unit_price: 0,
                total_price: 0,
                purchase_unit: "KAPSUL",
                purchase_qty: 1,
                purchaseOrderId: null,
                poItemId: null,
            })
        }
    }, [initialData, isOpen, form, availablePos.length, userLocationId])

    // Handlers for bidirectional / 2-way calculations
    const handleUnitChange = (newUnit: string) => {
        form.setValue("purchase_unit", newUnit)
        const curQty = form.getValues("purchase_qty") || 0
        const curTonnage = form.getValues("tonnage") || 0
        const curUnitPrice = form.getValues("unit_price") || 0
        const curTotalPrice = form.getValues("total_price") || 0

        if (newUnit === "KAPSUL") {
            const q = curQty <= 0 || curQty > 10 ? 1 : curQty
            form.setValue("purchase_qty", q)
            if (curTotalPrice > 0) {
                form.setValue("unit_price", Math.round(curTotalPrice / q))
            } else if (curUnitPrice > 0) {
                form.setValue("total_price", Math.round(q * curUnitPrice))
            }
        } else if (newUnit === "TON") {
            let q = curQty
            if (curTonnage > 0 && (q <= 0 || q === 1)) {
                q = Math.round((curTonnage / 1000) * 100) / 100
                form.setValue("purchase_qty", q)
            }
            if (curTotalPrice > 0 && q > 0) {
                form.setValue("unit_price", Math.round(curTotalPrice / q))
            } else if (curUnitPrice > 0) {
                form.setValue("total_price", Math.round(q * curUnitPrice))
            }
        } else if (newUnit === "ZAK_50") {
            let q = curQty
            if (curTonnage > 0 && (q <= 0 || q === 1)) {
                q = Math.round(curTonnage / 50)
                form.setValue("purchase_qty", q)
            }
            if (curTotalPrice > 0 && q > 0) {
                form.setValue("unit_price", Math.round(curTotalPrice / q))
            } else if (curUnitPrice > 0) {
                form.setValue("total_price", Math.round(q * curUnitPrice))
            }
        } else if (newUnit === "ZAK_40") {
            let q = curQty
            if (curTonnage > 0 && (q <= 0 || q === 1)) {
                q = Math.round(curTonnage / 40)
                form.setValue("purchase_qty", q)
            }
            if (curTotalPrice > 0 && q > 0) {
                form.setValue("unit_price", Math.round(curTotalPrice / q))
            } else if (curUnitPrice > 0) {
                form.setValue("total_price", Math.round(q * curUnitPrice))
            }
        } else if (newUnit === "KG") {
            if (curTonnage > 0) {
                form.setValue("purchase_qty", curTonnage)
            }
            if (curTotalPrice > 0 && curTonnage > 0) {
                form.setValue("unit_price", Math.round((curTotalPrice / curTonnage) * 100) / 100)
            }
        }
    }

    const handleQtyChange = (newQty: number) => {
        form.setValue("purchase_qty", newQty)
        const unit = form.getValues("purchase_unit")
        const curUnitPrice = form.getValues("unit_price") || 0
        const curTotalPrice = form.getValues("total_price") || 0

        // Auto sync tonnage for standard weight units
        if (unit === "TON" && newQty > 0) {
            form.setValue("tonnage", Math.round(newQty * 1000 * 100) / 100)
        } else if (unit === "ZAK_50" && newQty > 0) {
            form.setValue("tonnage", Math.round(newQty * 50))
        } else if (unit === "ZAK_40" && newQty > 0) {
            form.setValue("tonnage", Math.round(newQty * 40))
        } else if (unit === "KG" && newQty > 0) {
            form.setValue("tonnage", newQty)
        }

        // Price sync
        if (curUnitPrice > 0 && newQty > 0) {
            form.setValue("total_price", Math.round(newQty * curUnitPrice))
        } else if (curTotalPrice > 0 && newQty > 0 && curUnitPrice === 0) {
            form.setValue("unit_price", Math.round(curTotalPrice / newQty))
        }
    }

    const handleUnitPriceChange = (newUnitPrice: number) => {
        form.setValue("unit_price", newUnitPrice)
        const curQty = form.getValues("purchase_qty") || 0
        const effectiveQty = curQty > 0 ? curQty : 1
        form.setValue("total_price", Math.round(effectiveQty * newUnitPrice))
    }

    const handleTotalPriceChange = (newTotalPrice: number) => {
        form.setValue("total_price", newTotalPrice)
        let curQty = form.getValues("purchase_qty") || 0
        const unit = form.getValues("purchase_unit")
        if (curQty <= 0 && unit === "KAPSUL") {
            curQty = 1
            form.setValue("purchase_qty", 1)
        }
        if (curQty > 0) {
            form.setValue("unit_price", Math.round(newTotalPrice / curQty))
        }
    }

    // When a PO is selected
    const handlePoChange = (poId: string) => {
        setSelectedPoId(poId)
        form.setValue("purchaseOrderId", poId || null)

        const po = availablePos.find((p: any) => p.id === poId)
        if (po && po.items.length > 0) {
            const firstItem = po.items[0]
            setSelectedPoItemId(firstItem.id)
            applyPoItem(po, firstItem)
        } else {
            setSelectedPoItemId("")
        }
    }

    // When an item from the selected PO is selected
    const applyPoItem = (po: any, item: any) => {
        form.setValue("poItemId", item.id)
        form.setValue("name", item.itemName)
        form.setValue("supplier", item.supplierName || po.supplierName || "Distributor Semen")
        form.setValue("unit_price", item.harga_satuan || 0)

        // Detect unit
        const rawUnit = (item.satuan || "").toLowerCase()
        let pUnit = "TON"
        if (rawUnit.includes("kapsul")) pUnit = "KAPSUL"
        else if (rawUnit.includes("ton")) pUnit = "TON"
        else if (rawUnit.includes("40")) pUnit = "ZAK_40"
        else if (rawUnit.includes("sak") || rawUnit.includes("zak")) pUnit = "ZAK_50"
        else if (rawUnit.includes("kg")) pUnit = "KG"

        const defaultQty = item.remainingQty > 0 ? item.remainingQty : item.quantity
        form.setValue("purchase_unit", pUnit)
        form.setValue("purchase_qty", defaultQty)

        if (pUnit === "TON") {
            form.setValue("tonnage", Math.round(defaultQty * 1000 * 100) / 100)
            form.setValue("total_price", Math.round(defaultQty * (item.harga_satuan || 0)))
        } else if (pUnit === "KAPSUL") {
            form.setValue("total_price", Math.round(defaultQty * (item.harga_satuan || 0)))
        } else if (pUnit === "ZAK_50") {
            form.setValue("tonnage", Math.round(defaultQty * 50))
            form.setValue("total_price", Math.round(defaultQty * (item.harga_satuan || 0)))
        } else if (pUnit === "ZAK_40") {
            form.setValue("tonnage", Math.round(defaultQty * 40))
            form.setValue("total_price", Math.round(defaultQty * (item.harga_satuan || 0)))
        } else {
            form.setValue("tonnage", defaultQty)
            form.setValue("total_price", Math.round(defaultQty * (item.harga_satuan || 0)))
        }
    }

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setIsLoading(true)
        const formData = new FormData()
        formData.append("date", values.date)
        formData.append("name", values.name)
        formData.append("supplier", values.supplier)
        formData.append("tonnage", values.tonnage.toString())
        formData.append("delivery_note", values.delivery_note)
        formData.append("unit_price", (values.unit_price || 0).toString())
        formData.append("total_price", (values.total_price || 0).toString())
        formData.append("purchase_unit", values.purchase_unit || "KG")
        if (values.purchase_qty !== undefined && values.purchase_qty !== null) {
            formData.append("purchase_qty", values.purchase_qty.toString())
        }

        if (mode === "PO" && values.purchaseOrderId) {
            formData.append("purchaseOrderId", values.purchaseOrderId)
            if (values.poItemId) {
                formData.append("poItemId", values.poItemId)
            }
        }

        const targetLocationId = (userRole === "SuperAdminBP" && values.locationId)
            ? values.locationId
            : (userLocationId || values.locationId || "")

        if (targetLocationId) {
            formData.append("locationId", targetLocationId)
        }

        let result
        if (initialData) {
            result = await updateIncomingMaterial(initialData.id, formData)
        } else {
            result = await createIncomingMaterial(formData)
        }

        setIsLoading(false)
        if (result?.error) {
            alert(result.error)
        } else {
            onSuccess()
        }
    }

    const currentUnit = form.watch("purchase_unit")
    const currentQty = form.watch("purchase_qty") || 0
    const currentUnitPrice = form.watch("unit_price") || 0
    const currentTonnage = form.watch("tonnage") || 0
    const currentTotalPrice = form.watch("total_price") || 0

    const effectivePricePerKg = currentTonnage > 0 && currentTotalPrice > 0
        ? Math.round((currentTotalPrice / currentTonnage) * 100) / 100
        : 0
    const effectivePricePerTon = currentTonnage > 0 && currentTotalPrice > 0
        ? Math.round((currentTotalPrice / currentTonnage) * 1000)
        : 0

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
            <DialogContent className="sm:max-w-[700px] max-h-[92vh] overflow-y-auto">
                <DialogHeader className="pb-2 border-b">
                    <DialogTitle className="text-base font-bold text-slate-900">
                        {initialData ? "Edit Data Semen Masuk" : "Catat Semen Masuk & Stok Silo"}
                    </DialogTitle>
                </DialogHeader>

                {/* Mode Selector Toggle (Tarik dari PO vs Input Manual) */}
                {!initialData && (
                    <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-lg text-xs">
                        <button
                            type="button"
                            className={`py-1.5 px-3 rounded-md font-medium transition-all text-center cursor-pointer ${mode === "PO" ? "bg-white text-blue-700 shadow-xs font-semibold" : "text-slate-600 hover:text-slate-900"}`}
                            onClick={() => {
                                setMode("PO")
                                form.setValue("purchaseOrderId", selectedPoId || null)
                                form.setValue("poItemId", selectedPoItemId || null)
                            }}
                        >
                            Tarik dari PO Logistik {availablePos.length > 0 && `(${availablePos.length})`}
                        </button>
                        <button
                            type="button"
                            className={`py-1.5 px-3 rounded-md font-medium transition-all text-center cursor-pointer ${mode === "MANUAL" ? "bg-white text-slate-900 shadow-xs font-semibold" : "text-slate-600 hover:text-slate-900"}`}
                            onClick={() => {
                                setMode("MANUAL")
                                form.setValue("purchaseOrderId", null)
                                form.setValue("poItemId", null)
                            }}
                        >
                            Input Manual Bebas
                        </button>
                    </div>
                )}

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-1">
                        {/* PO Selection Card (Jika Mode PO) */}
                        {mode === "PO" && (
                            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                                <label className="text-xs font-semibold text-slate-700">Pilih Purchase Order (PO Semen Approved)</label>
                                {availablePos.length === 0 ? (
                                    <div className="p-2.5 bg-amber-50 border border-amber-200 rounded text-xs text-amber-800">
                                        Belum ada PO Semen Approved untuk cabang ini. Silakan gunakan <strong>Input Manual Bebas</strong>.
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        <Select value={selectedPoId} onValueChange={handlePoChange}>
                                            <SelectTrigger className="w-full bg-white h-8 text-xs">
                                                <SelectValue placeholder="Pilih Nomor PO Semen..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {availablePos.map((po: any) => (
                                                    <SelectItem key={po.id} value={po.id} className="text-xs">
                                                        <span className="font-mono font-bold mr-2">{po.po_number}</span>
                                                        <span>· {po.supplierName}</span>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>

                                        {selectedPo && selectedPo.items.length > 1 && (
                                            <Select
                                                value={selectedPoItemId}
                                                onValueChange={(itId) => {
                                                    setSelectedPoItemId(itId)
                                                    const item = selectedPo.items.find((i: any) => i.id === itId)
                                                    if (item) applyPoItem(selectedPo, item)
                                                }}
                                            >
                                                <SelectTrigger className="w-full bg-white h-8 text-xs">
                                                    <SelectValue placeholder="Pilih Item Semen..." />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {selectedPo.items.map((it: any) => (
                                                        <SelectItem key={it.id} value={it.id} className="text-xs">
                                                            {it.itemName} ({it.quantity} {it.satuan}) · Sisa: {it.remainingQty} {it.satuan}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Baris 1: Merek Semen & Distributor */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-xs font-medium">Merek / Nama Semen *</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Contoh: Semen Tonasa 50kg" {...field} className="h-8 text-xs" />
                                        </FormControl>
                                        <FormMessage className="text-[11px]" />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="supplier"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-xs font-medium">Distributor / Supplier *</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Nama Toko / Distributor" {...field} className="h-8 text-xs" />
                                        </FormControl>
                                        <FormMessage className="text-[11px]" />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* Baris 2: Rincian Pembelian & Harga */}
                        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2.5">
                            <div className="text-xs font-semibold text-slate-800">
                                Rincian Pembelian
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                                <FormField
                                    control={form.control}
                                    name="purchase_unit"
                                    render={({ field }) => (
                                        <FormItem className="space-y-1">
                                            <FormLabel className="text-[11px] text-slate-600">Satuan</FormLabel>
                                            <Select
                                                value={field.value}
                                                onValueChange={(val) => handleUnitChange(val)}
                                            >
                                                <FormControl>
                                                    <SelectTrigger className="h-8 text-xs bg-white">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="KAPSUL" className="text-xs">Truk Kapsul (Curah)</SelectItem>
                                                    <SelectItem value="TON" className="text-xs">Ton (1.000 KG)</SelectItem>
                                                    <SelectItem value="ZAK_50" className="text-xs">Zak 50 KG</SelectItem>
                                                    <SelectItem value="ZAK_40" className="text-xs">Zak 40 KG</SelectItem>
                                                    <SelectItem value="KG" className="text-xs">Kilogram (KG)</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="purchase_qty"
                                    render={({ field }) => (
                                        <FormItem className="space-y-1">
                                            <FormLabel className="text-[11px] text-slate-600">Jumlah Beli</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    step="0.01"
                                                    value={field.value ?? ""}
                                                    onChange={(e) => handleQtyChange(parseFloat(e.target.value) || 0)}
                                                    placeholder="0"
                                                    className="h-8 text-xs bg-white font-mono"
                                                />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="unit_price"
                                    render={({ field }) => (
                                        <FormItem className="space-y-1">
                                            <FormLabel className="text-[11px] text-slate-600">Harga Satuan (Rp)</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    step="1"
                                                    value={field.value ?? ""}
                                                    onChange={(e) => handleUnitPriceChange(parseFloat(e.target.value) || 0)}
                                                    placeholder="0"
                                                    className="h-8 text-xs bg-white font-mono"
                                                />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="total_price"
                                    render={({ field }) => (
                                        <FormItem className="space-y-1">
                                            <FormLabel className="text-[11px] font-semibold text-slate-800">Total Nilai (Rp)</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    step="1"
                                                    value={field.value ?? ""}
                                                    onChange={(e) => handleTotalPriceChange(parseFloat(e.target.value) || 0)}
                                                    placeholder="0"
                                                    className="h-8 text-xs bg-white font-mono font-semibold"
                                                />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                            </div>

                            {effectivePricePerKg > 0 && (
                                <div className="pt-1 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-500 font-mono">
                                    <span>Estimasi HPP Silo: <strong className="text-slate-800">Rp {effectivePricePerKg.toLocaleString('id-ID')}/KG</strong></span>
                                    <span>Total: <strong className="text-slate-900">Rp {currentTotalPrice.toLocaleString('id-ID')}</strong></span>
                                </div>
                            )}
                        </div>

                        {/* Baris 3: Tonase Silo Riil & No. Bon / Surat Jalan */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <FormField
                                control={form.control}
                                name="tonnage"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-xs font-medium">Tonase Silo Riil (KG) *</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                step="0.01"
                                                {...field}
                                                className="h-8 text-xs font-mono font-bold"
                                                placeholder="Hasil timbangan fisik (KG)"
                                            />
                                        </FormControl>
                                        <FormMessage className="text-[11px]" />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="delivery_note"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-xs font-medium">No. Bon / Surat Jalan Fisik *</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Contoh: SJ-24284654" {...field} className="h-8 text-xs font-mono" />
                                        </FormControl>
                                        <FormMessage className="text-[11px]" />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* Baris 4: Tanggal & Cabang */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <FormField
                                control={form.control}
                                name="date"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-xs font-medium">Tanggal & Waktu Masuk *</FormLabel>
                                        <FormControl>
                                            <Input type="datetime-local" {...field} className="h-8 text-xs" />
                                        </FormControl>
                                        <FormMessage className="text-[11px]" />
                                    </FormItem>
                                )}
                            />

                            {userRole === "SuperAdminBP" ? (
                                <FormField
                                    control={form.control}
                                    name="locationId"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs font-medium">Pilih Cabang (Hak SuperAdmin)</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger className="h-8 text-xs bg-white">
                                                        <SelectValue placeholder="Pilih Cabang" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {locations.map((loc) => (
                                                        <SelectItem key={loc.id} value={loc.id} className="text-xs">
                                                            {loc.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage className="text-[11px]" />
                                        </FormItem>
                                    )}
                                />
                            ) : (
                                <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-slate-700">Lokasi Silo</label>
                                    <div className="h-8 px-2.5 bg-slate-100 border border-slate-200 rounded-md text-xs font-medium text-slate-800 flex items-center gap-1.5">
                                        <Building2 className="w-3.5 h-3.5 text-slate-500" />
                                        <span>{locations.find((l: any) => l.id === userLocationId)?.name || "Cabang Anda"}</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end gap-2 pt-3 border-t">
                            <Button type="button" variant="outline" size="sm" onClick={onCancel} disabled={isLoading} className="h-8 text-xs">
                                Batal
                            </Button>
                            <Button type="submit" size="sm" disabled={isLoading} className="h-8 text-xs bg-blue-600 hover:bg-blue-700 text-white font-medium">
                                {isLoading ? "Menyimpan..." : initialData ? "Simpan Perubahan" : "Catat Semen Masuk"}
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
