"use client"

import { useMemo, useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, PackagePlus, ClipboardList } from "lucide-react"
import { toast } from "sonner"

import { MaterialInRow, LedgerRow, MaterialInStats } from "./types"
import { MaterialInStatsCards } from "./components/material-in-stats"
import { MaterialInTable } from "./components/material-in-table"
import { MaterialInLedgerTable } from "./components/material-in-ledger-table"
import { MaterialInDetailDialog } from "./components/material-in-detail-dialog"
import { MaterialInDeleteDialog } from "./components/material-in-delete-dialog"
import { MaterialInForm } from "./material-in-form"
import { deleteIncomingMaterial } from "./actions"

interface MaterialInClientProps {
    initialData: any[]
    initialLedger: any[]
    locations: any[]
    approvedCementPos?: any[]
    userRole: string
    userLocationId?: string | null
    isCorporate?: boolean
    canManage?: boolean
    isReadOnly?: boolean
}

export function MaterialInClient({
    initialData,
    initialLedger,
    locations,
    approvedCementPos = [],
    userRole,
    userLocationId = null,
    isCorporate = false,
    canManage = true,
    isReadOnly = false,
}: MaterialInClientProps) {
    const [isFormOpen, setIsFormOpen] = useState(false)
    const [editingData, setEditingData] = useState<MaterialInRow | null>(null)
    const [detailItem, setDetailItem] = useState<MaterialInRow | null>(null)
    const [deleteItem, setDeleteItem] = useState<MaterialInRow | null>(null)
    const [isDeleting, startDeleteTransition] = useTransition()

    // Format Material Incoming Rows
    const formattedInData: MaterialInRow[] = useMemo(() => {
        return initialData.map((t: any) => {
            const dateObj = new Date(t.date)
            const formattedDate = dateObj.toLocaleDateString("id-ID", {
                day: "2-digit",
                month: "short",
                year: "numeric",
            })
            const formattedTime = dateObj.toLocaleTimeString("id-ID", {
                hour: "2-digit",
                minute: "2-digit",
            })

            const tonnage = t.tonnage || 0
            const totalPrice = t.total_price || 0
            const effectivePricePerKg = tonnage > 0 && totalPrice > 0 ? totalPrice / tonnage : null

            return {
                id: t.id,
                date: dateObj.toISOString().split("T")[0],
                formattedDate,
                formattedTime,
                name: t.name,
                supplier: t.supplier,
                tonnage,
                delivery_note: t.delivery_note,
                locationName: t.location?.name || "N/A",
                locationId: t.locationId,
                unit_price: t.unit_price || 0,
                total_price: totalPrice,
                purchase_unit: t.purchase_unit || "KG",
                purchase_qty: t.purchase_qty ?? null,
                purchaseOrderId: t.purchaseOrderId || null,
                poNumber: t.purchaseOrder?.po_number || null,
                poStatus: t.purchaseOrder?.status || null,
                poDate: t.purchaseOrder?.tanggal_terbit
                    ? new Date(t.purchaseOrder.tanggal_terbit).toLocaleDateString("id-ID", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                      })
                    : null,
                poCompany: t.purchaseOrder?.companyGroup?.name || null,
                poItemId: t.poItemId || null,
                poItemName: t.poItem?.masterItem?.name || null,
                poItemQty: t.poItem?.quantity ?? null,
                poItemUnitPrice: t.poItem?.harga_satuan ?? null,
                effectivePricePerKg,
            }
        })
    }, [initialData])

    // Calculate KPI Stats
    const stats: MaterialInStats = useMemo(() => {
        let totalKg = 0
        let totalNilai = 0
        let poLinkedCount = 0

        formattedInData.forEach((item) => {
            totalKg += item.tonnage || 0
            totalNilai += item.total_price || 0
            if (item.purchaseOrderId || item.poNumber) {
                poLinkedCount++
            }
        })

        const totalTon = totalKg / 1000
        const totalTransactions = formattedInData.length
        const avgPricePerKg = totalKg > 0 && totalNilai > 0 ? totalNilai / totalKg : 0
        const manualCount = Math.max(0, totalTransactions - poLinkedCount)

        return {
            totalTon,
            totalKg,
            totalNilai,
            avgPricePerKg,
            totalTransactions,
            poLinkedCount,
            manualCount,
        }
    }, [formattedInData])

    const formattedLedger: LedgerRow[] = useMemo(() => {
        return initialLedger as LedgerRow[]
    }, [initialLedger])

    // Handlers
    const handleOpenCreate = () => {
        setEditingData(null)
        setIsFormOpen(true)
    }

    const handleEdit = (row: MaterialInRow) => {
        if (!canManage) return
        setEditingData(row)
        setIsFormOpen(true)
    }

    const handleDeleteConfirm = (item: MaterialInRow) => {
        startDeleteTransition(async () => {
            try {
                const res = await deleteIncomingMaterial(item.id)
                if (res?.error) {
                    toast.error(res.error)
                } else {
                    toast.success(`Data semen masuk ${item.delivery_note} berhasil dihapus`)
                    setDeleteItem(null)
                }
            } catch (err: any) {
                toast.error(err.message || "Gagal menghapus data semen masuk")
            }
        })
    }

    const showCabang = userRole === "SuperAdminBP" || isCorporate

    return (
        <div className="space-y-4 w-full">
            {/* Header & Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <h1 className="text-xl font-bold tracking-tight text-slate-900">
                        Semen Masuk & Stok Silo
                    </h1>
                    <p className="text-xs text-slate-500">
                        Pencatatan penerimaan semen, verifikasi PO vendor, audit harga, dan kartu stok silo BP.
                    </p>
                </div>
                <div className="flex items-center gap-2 self-start sm:self-auto">
                    {isReadOnly && (
                        <Badge variant="outline" className="border-amber-300 bg-amber-50 text-amber-800 text-xs px-2.5 py-1">
                            Mode Pemantauan (Hanya Lihat)
                        </Badge>
                    )}
                    {canManage && (
                        <Button
                            onClick={handleOpenCreate}
                            size="sm"
                            className="h-9 gap-1.5 text-xs bg-slate-900 hover:bg-slate-800 text-white shadow-xs"
                        >
                            <Plus className="h-4 w-4" />
                            Tambah Data
                        </Button>
                    )}
                </div>
            </div>

            {/* KPI Summary Cards */}
            <MaterialInStatsCards stats={stats} />

            {/* Tabs & Content */}
            <Tabs defaultValue="masuk" className="space-y-3">
                <TabsList className="grid w-full grid-cols-2 lg:w-[380px] bg-slate-100/90 p-1">
                    <TabsTrigger value="masuk" className="gap-2 text-xs font-medium">
                        <PackagePlus className="h-4 w-4" />
                        Data Semen Masuk
                    </TabsTrigger>
                    <TabsTrigger value="stok" className="gap-2 text-xs font-medium">
                        <ClipboardList className="h-4 w-4" />
                        Kartu Stok (Ledger)
                    </TabsTrigger>
                </TabsList>

                {/* TAB 1: DATA SEMEN MASUK */}
                <TabsContent value="masuk" className="space-y-3 outline-hidden">
                    <MaterialInTable
                        data={formattedInData}
                        showCabang={showCabang}
                        canManage={canManage}
                        onViewDetail={(item) => setDetailItem(item)}
                        onEdit={(item) => handleEdit(item)}
                        onDelete={(item) => setDeleteItem(item)}
                    />
                </TabsContent>

                {/* TAB 2: KARTU STOK (LEDGER) */}
                <TabsContent value="stok" className="space-y-3 outline-hidden">
                    <MaterialInLedgerTable
                        data={formattedLedger}
                        showCabang={showCabang}
                    />
                </TabsContent>
            </Tabs>

            {/* Form Modal (Add / Edit) */}
            <MaterialInForm
                isOpen={isFormOpen}
                initialData={editingData}
                locations={locations}
                approvedPos={approvedCementPos}
                userRole={userRole}
                userLocationId={userLocationId}
                onSuccess={() => setIsFormOpen(false)}
                onCancel={() => setIsFormOpen(false)}
            />

            {/* Detail Tracing Dialog */}
            <MaterialInDetailDialog
                isOpen={Boolean(detailItem)}
                onClose={() => setDetailItem(null)}
                item={detailItem}
                onEdit={(item) => handleEdit(item)}
                canManage={canManage}
            />

            {/* Delete Confirmation Dialog */}
            <MaterialInDeleteDialog
                isOpen={Boolean(deleteItem)}
                onClose={() => setDeleteItem(null)}
                item={deleteItem}
                onConfirm={handleDeleteConfirm}
                isDeleting={isDeleting}
            />
        </div>
    )
}
