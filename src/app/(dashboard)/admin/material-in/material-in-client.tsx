"use client"

import { useMemo, useState } from "react"

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { SimpleDataTable, SortableHeader } from "@/components/ui/simple-data-table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { getIncomingColumns, getLedgerColumns, MaterialInRow, LedgerRow } from "./columns"
import { Plus, PackagePlus, ClipboardList, Edit, Trash2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MaterialInForm } from "./material-in-form"

export function MaterialInClient({
    initialData,
    initialLedger,
    locations,
    userRole
}: {
    initialData: any[]
    initialLedger: any[]
    locations: any[]
    userRole: string
}) {
    // ----------------------------------------------------
    // STATE: Semen Masuk
    // ----------------------------------------------------
    const [isFormOpen, setIsFormOpen] = useState(false)
    const [editingData, setEditingData] = useState<MaterialInRow | null>(null)

    // Format IN Data
    const formattedInData: MaterialInRow[] = useMemo(() => {
        return initialData.map((t: any) => ({
            id: t.id,
            date: new Date(t.date).toISOString().split('T')[0],
            name: t.name,
            supplier: t.supplier,
            tonnage: t.tonnage,
            delivery_note: t.delivery_note,
            locationName: t.location?.name || 'N/A',
            locationId: t.locationId
        }))
    }, [initialData])

    const formattedLedger: LedgerRow[] = useMemo(() => {
        return initialLedger as LedgerRow[]
    }, [initialLedger])

    const handleEdit = (row: MaterialInRow) => {
        setEditingData(row)
        setIsFormOpen(true)
    }

    const handleDelete = async (row: MaterialInRow) => {
        if (confirm(`Apakah Anda yakin ingin menghapus data Semen Masuk "${row.name}" dari ${row.supplier}?`)) {
            try {
                await import('./actions').then(m => m.deleteIncomingMaterial(row.id))
            } catch (e) {
                console.error(e)
            }
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Semen Masuk & Stok</h1>
                    <p className="text-muted-foreground">Kelola penerimaan semen dan pantau sisa stok berdasarkan pemakaian produksi.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button onClick={() => { setEditingData(null); setIsFormOpen(true) }} className="gap-2">
                        <Plus className="h-4 w-4" />
                        Tambah Data
                    </Button>
                </div>
            </div>

            <Tabs defaultValue="masuk" className="space-y-4">
                <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
                    <TabsTrigger value="masuk" className="gap-2"><PackagePlus className="h-4 w-4" /> Data Semen Masuk</TabsTrigger>
                    <TabsTrigger value="stok" className="gap-2"><ClipboardList className="h-4 w-4" /> Kartu Stok (Ledger)</TabsTrigger>
                </TabsList>

                {/* TAB 1: DATA SEMEN MASUK */}
                <TabsContent value="masuk">
                    <Card className="border-none shadow-md overflow-hidden bg-white">
                        <SimpleDataTable<MaterialInRow>
                            data={formattedInData}
                            searchKeys={["supplier", "name", "delivery_note"]}
                            searchPlaceholder="Cari distributor, semen, atau bon..."
                        >
                            {(items, sortConfig, toggleSort) => (
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-slate-50/50">
                                            <TableHead>
                                                <SortableHeader<MaterialInRow> label="Tanggal" sortKey="date" sortConfig={sortConfig} onSort={toggleSort} />
                                            </TableHead>
                                            {userRole === "SuperAdminBP" && (
                                                <TableHead>
                                                    <SortableHeader<MaterialInRow> label="Cabang" sortKey="locationName" sortConfig={sortConfig} onSort={toggleSort} />
                                                </TableHead>
                                            )}
                                            <TableHead>
                                                <SortableHeader<MaterialInRow> label="Nama Semen" sortKey="name" sortConfig={sortConfig} onSort={toggleSort} />
                                            </TableHead>
                                            <TableHead>
                                                <SortableHeader<MaterialInRow> label="Distributor" sortKey="supplier" sortConfig={sortConfig} onSort={toggleSort} />
                                            </TableHead>
                                            <TableHead>
                                                <SortableHeader<MaterialInRow> label="Jumlah (KG)" sortKey="tonnage" sortConfig={sortConfig} onSort={toggleSort} />
                                            </TableHead>
                                            <TableHead>
                                                <SortableHeader<MaterialInRow> label="No Bon" sortKey="delivery_note" sortConfig={sortConfig} onSort={toggleSort} />
                                            </TableHead>
                                            <TableHead className="w-[100px] text-right text-xs uppercase font-semibold">Aksi</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {items.length === 0 && (
                                            <TableRow>
                                                <TableCell colSpan={userRole === "SuperAdminBP" ? 7 : 6} className="h-24 text-center text-muted-foreground">
                                                    Belum ada data Semen Masuk.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                        {items.map((item) => (
                                            <TableRow key={item.id} className="hover:bg-slate-50/50 transition-colors">
                                                <TableCell className="text-sm">{item.date}</TableCell>
                                                {userRole === "SuperAdminBP" && (
                                                    <TableCell>
                                                        <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-[10px] font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10 uppercase">
                                                            {item.locationName}
                                                        </span>
                                                    </TableCell>
                                                )}
                                                <TableCell className="font-medium text-sm text-slate-800">{item.name}</TableCell>
                                                <TableCell className="text-sm">{item.supplier}</TableCell>
                                                <TableCell className="font-bold text-sm">{item.tonnage.toLocaleString('id-ID')}</TableCell>
                                                <TableCell className="text-sm text-slate-500">{item.delivery_note}</TableCell>
                                                <TableCell>
                                                    <div className="flex items-center justify-end gap-1">
                                                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(item)}>
                                                            <Edit className="h-4 w-4 text-slate-500" />
                                                        </Button>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDelete(item)}>
                                                            <Trash2 className="h-4 w-4 text-red-500" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </SimpleDataTable>
                    </Card>
                </TabsContent>

                {/* TAB 2: KARTU STOK (LEDGER) */}
                <TabsContent value="stok">
                    <Card className="border-none shadow-md overflow-hidden bg-white">
                        <SimpleDataTable<LedgerRow>
                            data={formattedLedger}
                            searchKeys={["description", "reference"]}
                            searchPlaceholder="Cari keterangan atau referensi..."
                        >
                            {(items, sortConfig, toggleSort) => (
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-slate-50/50">
                                            <TableHead>
                                                <SortableHeader label="Tanggal / Jam" sortKey="formattedDate" sortConfig={sortConfig} onSort={toggleSort} />
                                            </TableHead>
                                            {userRole === "SuperAdminBP" && (
                                                <TableHead>
                                                    <SortableHeader label="Cabang" sortKey="locationName" sortConfig={sortConfig} onSort={toggleSort} />
                                                </TableHead>
                                            )}
                                            <TableHead>
                                                <SortableHeader label="Tipe" sortKey="type" sortConfig={sortConfig} onSort={toggleSort} />
                                            </TableHead>
                                            <TableHead>
                                                <SortableHeader label="Keterangan" sortKey="description" sortConfig={sortConfig} onSort={toggleSort} />
                                            </TableHead>
                                            <TableHead>
                                                <SortableHeader label="Referensi" sortKey="reference" sortConfig={sortConfig} onSort={toggleSort} />
                                            </TableHead>
                                            <TableHead>
                                                <SortableHeader label="Masuk (KG)" sortKey="qty_in" sortConfig={sortConfig} onSort={toggleSort} />
                                            </TableHead>
                                            <TableHead>
                                                <SortableHeader label="Keluar (KG)" sortKey="qty_out" sortConfig={sortConfig} onSort={toggleSort} />
                                            </TableHead>
                                            <TableHead>
                                                <SortableHeader label="Stok (KG)" sortKey="balance" sortConfig={sortConfig} onSort={toggleSort} />
                                            </TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {items.length === 0 && (
                                            <TableRow>
                                                <TableCell colSpan={userRole === "SuperAdminBP" ? 8 : 7} className="h-24 text-center text-muted-foreground">
                                                    Belum ada rincian mutasi stok.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                        {items.map((item) => {
                                            const isOut = item.type === "OUT"
                                            return (
                                                <TableRow key={item.id} className="hover:bg-slate-50/50 transition-colors">
                                                    <TableCell className="text-xs whitespace-nowrap">{item.formattedDate}</TableCell>
                                                    {userRole === "SuperAdminBP" && (
                                                        <TableCell>
                                                            <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-[10px] font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10 uppercase">
                                                                {item.locationName}
                                                            </span>
                                                        </TableCell>
                                                    )}
                                                    <TableCell>
                                                        <Badge variant={isOut ? "destructive" : "default"} className="text-[10px] uppercase font-bold py-0 h-5">
                                                            {isOut ? "OUT" : "IN"}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="font-medium text-sm max-w-[200px] truncate">{item.description}</TableCell>
                                                    <TableCell className="text-xs text-muted-foreground">{item.reference}</TableCell>
                                                    <TableCell className="text-sm">
                                                        {item.qty_in > 0 ? <span className="font-bold text-green-600">+{item.qty_in.toLocaleString('id-ID')}</span> : <span className="text-slate-300">-</span>}
                                                    </TableCell>
                                                    <TableCell className="text-sm">
                                                        {item.qty_out > 0 ? <span className="font-bold text-red-600">-{item.qty_out.toLocaleString('id-ID', { maximumFractionDigits: 1 })}</span> : <span className="text-slate-300">-</span>}
                                                    </TableCell>
                                                    <TableCell className="font-bold text-sm text-slate-900 border-l border-slate-100 pl-4 bg-slate-50/30">
                                                        {item.balance.toLocaleString('id-ID', { maximumFractionDigits: 1 })}
                                                    </TableCell>
                                                </TableRow>
                                            )
                                        })}
                                    </TableBody>
                                </Table>
                            )}
                        </SimpleDataTable>
                    </Card>
                </TabsContent>
            </Tabs>

            <MaterialInForm
                isOpen={isFormOpen}
                initialData={editingData}
                locations={locations}
                userRole={userRole}
                onSuccess={() => setIsFormOpen(false)}
                onCancel={() => setIsFormOpen(false)}
            />
        </div>
    )
}
