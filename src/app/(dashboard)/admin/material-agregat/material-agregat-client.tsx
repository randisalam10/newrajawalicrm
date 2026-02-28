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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Plus,
    PackagePlus,
    ClipboardList,
    Edit,
    Trash2,
    Mountain,
    ShoppingCart,
    BarChart2,
} from "lucide-react"
import {
    AggregateInRow,
    AggregateLedgerRow,
    AGGREGATE_TYPE_LABELS,
    AGGREGATE_TYPE_OPTIONS,
    SOURCE_TYPE_LABELS,
} from "./columns"
import { MaterialAgregatForm } from "./material-agregat-form"
import { deleteAggregateIncoming, getAggregateStockLedger } from "./actions"

type Props = {
    initialData: any[]
    locations: { id: string; name: string }[]
    userRole: string
}

const MATERIAL_COLORS: Record<string, string> = {
    SplitHalfOne: "bg-orange-50 text-orange-700 ring-orange-600/20",
    SplitTwoThree: "bg-red-50 text-red-700 ring-red-600/20",
    Pasir: "bg-yellow-50 text-yellow-700 ring-yellow-600/20",
    Other: "bg-slate-50 text-slate-700 ring-slate-600/20",
}

export function MaterialAgregatClient({ initialData, locations, userRole }: Props) {
    const [isFormOpen, setIsFormOpen] = useState(false)
    const [editingData, setEditingData] = useState<AggregateInRow | null>(null)

    // Ledger state
    const [ledgerType, setLedgerType] = useState("SplitHalfOne")
    const [ledgerData, setLedgerData] = useState<AggregateLedgerRow[]>([])
    const [ledgerLoading, setLedgerLoading] = useState(false)
    const [ledgerLoaded, setLedgerLoaded] = useState(false)

    const formattedData: AggregateInRow[] = useMemo(() => {
        return initialData.map((t: any) => ({
            id: t.id,
            date: new Date(t.date).toISOString().split("T")[0],
            no_bon: t.no_bon,
            driver_name: t.driver_name,
            plate_number: t.plate_number,
            volume_cubic: t.volume_cubic,
            aggregate_type: t.aggregate_type,
            aggregateLabel: AGGREGATE_TYPE_LABELS[t.aggregate_type] || t.aggregate_type,
            source_type: t.source_type,
            supplier: t.supplier,
            notes: t.notes,
            locationName: t.location?.name || "N/A",
            locationId: t.locationId,
        }))
    }, [initialData])

    // Summary by material type
    const summary = useMemo(() => {
        const totals: Record<string, number> = {}
        formattedData.forEach((row) => {
            totals[row.aggregate_type] = (totals[row.aggregate_type] || 0) + row.volume_cubic
        })
        return totals
    }, [formattedData])

    const handleEdit = (row: AggregateInRow) => {
        setEditingData(row)
        setIsFormOpen(true)
    }

    const handleDelete = async (row: AggregateInRow) => {
        if (
            confirm(
                `Yakin ingin menghapus data ${row.aggregateLabel} dari ${row.driver_name} (${row.plate_number})?`
            )
        ) {
            await deleteAggregateIncoming(row.id)
        }
    }

    const loadLedger = async (type?: string) => {
        const t = type ?? ledgerType
        setLedgerLoading(true)
        try {
            const data = await import("./actions").then((m) => m.getAggregateStockLedger(t))
            setLedgerData(data as AggregateLedgerRow[])
            setLedgerLoaded(true)
        } finally {
            setLedgerLoading(false)
        }
    }

    const handleLedgerTypeChange = (val: string) => {
        setLedgerType(val)
        loadLedger(val)
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Material Agregat</h1>
                    <p className="text-muted-foreground">
                        Pencatatan material masuk (batu split, pasir) per batching plant.
                    </p>
                </div>
                <Button
                    onClick={() => {
                        setEditingData(null)
                        setIsFormOpen(true)
                    }}
                    className="gap-2"
                >
                    <Plus className="h-4 w-4" />
                    Tambah Data
                </Button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {AGGREGATE_TYPE_OPTIONS.map((opt) => (
                    <Card key={opt.value} className="border-none shadow-sm">
                        <CardHeader className="pb-1 pt-4 px-4">
                            <CardTitle className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                                {opt.label}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="px-4 pb-4">
                            <p className="text-2xl font-bold text-slate-800">
                                {(summary[opt.value] || 0).toLocaleString("id-ID", { maximumFractionDigits: 2 })}
                                <span className="text-sm font-normal text-muted-foreground ml-1">m³</span>
                            </p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Tabs */}
            <Tabs defaultValue="masuk" className="space-y-4">
                <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
                    <TabsTrigger value="masuk" className="gap-2">
                        <PackagePlus className="h-4 w-4" />
                        Data Material Masuk
                    </TabsTrigger>
                    <TabsTrigger
                        value="stok"
                        className="gap-2"
                        onClick={() => !ledgerLoaded && loadLedger()}
                    >
                        <ClipboardList className="h-4 w-4" />
                        Kartu Stok (Ledger)
                    </TabsTrigger>
                </TabsList>

                {/* TAB 1: Data Masuk */}
                <TabsContent value="masuk">
                    <Card className="border-none shadow-md overflow-hidden bg-white">
                        <SimpleDataTable<AggregateInRow>
                            data={formattedData}
                            searchKeys={["no_bon", "driver_name", "plate_number", "aggregateLabel", "supplier"]}
                            searchPlaceholder="Cari no bon, sopir, plat, atau material..."
                        >
                            {(items, sortConfig, toggleSort) => (
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-slate-50/50">
                                            <TableHead>
                                                <SortableHeader<AggregateInRow>
                                                    label="Tanggal"
                                                    sortKey="date"
                                                    sortConfig={sortConfig}
                                                    onSort={toggleSort}
                                                />
                                            </TableHead>
                                            {userRole === "SuperAdminBP" && (
                                                <TableHead>
                                                    <SortableHeader<AggregateInRow>
                                                        label="Cabang"
                                                        sortKey="locationName"
                                                        sortConfig={sortConfig}
                                                        onSort={toggleSort}
                                                    />
                                                </TableHead>
                                            )}
                                            <TableHead>
                                                <SortableHeader<AggregateInRow>
                                                    label="Jenis"
                                                    sortKey="aggregateLabel"
                                                    sortConfig={sortConfig}
                                                    onSort={toggleSort}
                                                />
                                            </TableHead>
                                            <TableHead>Sumber</TableHead>
                                            <TableHead>
                                                <SortableHeader<AggregateInRow>
                                                    label="No Bon"
                                                    sortKey="no_bon"
                                                    sortConfig={sortConfig}
                                                    onSort={toggleSort}
                                                />
                                            </TableHead>
                                            <TableHead>
                                                <SortableHeader<AggregateInRow>
                                                    label="Sopir"
                                                    sortKey="driver_name"
                                                    sortConfig={sortConfig}
                                                    onSort={toggleSort}
                                                />
                                            </TableHead>
                                            <TableHead>Plat</TableHead>
                                            <TableHead>
                                                <SortableHeader<AggregateInRow>
                                                    label="Volume (m³)"
                                                    sortKey="volume_cubic"
                                                    sortConfig={sortConfig}
                                                    onSort={toggleSort}
                                                />
                                            </TableHead>
                                            <TableHead className="w-[90px] text-right text-xs uppercase font-semibold">
                                                Aksi
                                            </TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {items.length === 0 && (
                                            <TableRow>
                                                <TableCell
                                                    colSpan={userRole === "SuperAdminBP" ? 9 : 8}
                                                    className="h-24 text-center text-muted-foreground"
                                                >
                                                    Belum ada data material masuk.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                        {items.map((item) => (
                                            <TableRow key={item.id} className="hover:bg-slate-50/50 transition-colors">
                                                <TableCell className="text-sm">{item.date}</TableCell>
                                                {userRole === "SuperAdminBP" && (
                                                    <TableCell>
                                                        <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10 uppercase">
                                                            {item.locationName}
                                                        </span>
                                                    </TableCell>
                                                )}
                                                <TableCell>
                                                    <span
                                                        className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-semibold ring-1 ring-inset ${MATERIAL_COLORS[item.aggregate_type]}`}
                                                    >
                                                        {item.aggregateLabel}
                                                    </span>
                                                </TableCell>
                                                <TableCell>
                                                    {item.source_type === "Internal" ? (
                                                        <span className="inline-flex items-center gap-1 text-xs text-emerald-700">
                                                            <Mountain className="h-3 w-3" /> Internal
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 text-xs text-amber-700">
                                                            <ShoppingCart className="h-3 w-3" /> Eksternal
                                                            {item.supplier && <span className="text-slate-400">· {item.supplier}</span>}
                                                        </span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-sm text-slate-500">{item.no_bon}</TableCell>
                                                <TableCell className="font-medium text-sm text-slate-800">{item.driver_name}</TableCell>
                                                <TableCell className="text-sm">{item.plate_number}</TableCell>
                                                <TableCell className="font-bold text-sm">
                                                    {item.volume_cubic.toLocaleString("id-ID", { maximumFractionDigits: 2 })}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center justify-end gap-1">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8"
                                                            onClick={() => handleEdit(item)}
                                                        >
                                                            <Edit className="h-4 w-4 text-slate-500" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8"
                                                            onClick={() => handleDelete(item)}
                                                        >
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

                {/* TAB 2: Kartu Stok (Ledger) */}
                <TabsContent value="stok">
                    <div className="space-y-4">
                        {/* Ledger Filter */}
                        <div className="flex items-center gap-3">
                            <span className="text-sm font-medium text-slate-600">Tampilkan stok untuk:</span>
                            <Select value={ledgerType} onValueChange={handleLedgerTypeChange}>
                                <SelectTrigger className="w-[200px]">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {AGGREGATE_TYPE_OPTIONS.map((opt) => (
                                        <SelectItem key={opt.value} value={opt.value}>
                                            {opt.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <Card className="border-none shadow-md overflow-hidden bg-white">
                            {ledgerLoading ? (
                                <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
                                    <Loader className="animate-spin h-5 w-5 mr-2" />
                                    Memuat kartu stok...
                                </div>
                            ) : !ledgerLoaded ? (
                                <div className="h-48 flex flex-col items-center justify-center text-muted-foreground text-sm gap-2">
                                    <BarChart2 className="h-8 w-8 text-slate-300" />
                                    <p>Klik tab ini untuk memuat kartu stok</p>
                                </div>
                            ) : (
                                <SimpleDataTable<AggregateLedgerRow>
                                    data={ledgerData}
                                    searchKeys={["description", "reference"]}
                                    searchPlaceholder="Cari keterangan atau referensi..."
                                >
                                    {(items, sortConfig, toggleSort) => (
                                        <Table>
                                            <TableHeader>
                                                <TableRow className="bg-slate-50/50">
                                                    <TableHead>
                                                        <SortableHeader
                                                            label="Tanggal / Jam"
                                                            sortKey="formattedDate"
                                                            sortConfig={sortConfig}
                                                            onSort={toggleSort}
                                                        />
                                                    </TableHead>
                                                    {userRole === "SuperAdminBP" && (
                                                        <TableHead>Cabang</TableHead>
                                                    )}
                                                    <TableHead>Tipe</TableHead>
                                                    <TableHead>Keterangan</TableHead>
                                                    <TableHead>Referensi</TableHead>
                                                    <TableHead>
                                                        <SortableHeader
                                                            label="Masuk (m³)"
                                                            sortKey="qty_in"
                                                            sortConfig={sortConfig}
                                                            onSort={toggleSort}
                                                        />
                                                    </TableHead>
                                                    <TableHead>
                                                        <SortableHeader
                                                            label="Keluar (m³)"
                                                            sortKey="qty_out"
                                                            sortConfig={sortConfig}
                                                            onSort={toggleSort}
                                                        />
                                                    </TableHead>
                                                    <TableHead>
                                                        <SortableHeader
                                                            label="Stok (m³)"
                                                            sortKey="balance"
                                                            sortConfig={sortConfig}
                                                            onSort={toggleSort}
                                                        />
                                                    </TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {items.length === 0 && (
                                                    <TableRow>
                                                        <TableCell
                                                            colSpan={userRole === "SuperAdminBP" ? 8 : 7}
                                                            className="h-24 text-center text-muted-foreground"
                                                        >
                                                            Belum ada mutasi stok untuk material ini.
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
                                                                    <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10 uppercase">
                                                                        {item.locationName}
                                                                    </span>
                                                                </TableCell>
                                                            )}
                                                            <TableCell>
                                                                <Badge
                                                                    variant={isOut ? "destructive" : "default"}
                                                                    className="text-[10px] uppercase font-bold py-0 h-5"
                                                                >
                                                                    {isOut ? "OUT" : "IN"}
                                                                </Badge>
                                                            </TableCell>
                                                            <TableCell className="font-medium text-sm max-w-[200px] truncate">
                                                                {item.description}
                                                            </TableCell>
                                                            <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">
                                                                {item.reference}
                                                            </TableCell>
                                                            <TableCell className="text-sm">
                                                                {item.qty_in > 0 ? (
                                                                    <span className="font-bold text-green-600">
                                                                        +{item.qty_in.toLocaleString("id-ID", { maximumFractionDigits: 2 })}
                                                                    </span>
                                                                ) : (
                                                                    <span className="text-slate-300">-</span>
                                                                )}
                                                            </TableCell>
                                                            <TableCell className="text-sm">
                                                                {item.qty_out > 0 ? (
                                                                    <span className="font-bold text-red-600">
                                                                        -{item.qty_out.toLocaleString("id-ID", { maximumFractionDigits: 2 })}
                                                                    </span>
                                                                ) : (
                                                                    <span className="text-slate-300">-</span>
                                                                )}
                                                            </TableCell>
                                                            <TableCell className="font-bold text-sm text-slate-900 border-l border-slate-100 pl-4 bg-slate-50/30">
                                                                {item.balance.toLocaleString("id-ID", { maximumFractionDigits: 2 })}
                                                            </TableCell>
                                                        </TableRow>
                                                    )
                                                })}
                                            </TableBody>
                                        </Table>
                                    )}
                                </SimpleDataTable>
                            )}
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>

            <MaterialAgregatForm
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

// Inline loader icon to avoid import issues
function Loader({ className }: { className?: string }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            className={className}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
        >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707" />
        </svg>
    )
}
