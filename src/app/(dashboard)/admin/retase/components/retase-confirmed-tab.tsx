"use client"

import React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { SimpleDataTable, SortableHeader } from "@/components/ui/simple-data-table"
import { MoreHorizontal, Printer, Edit, Trash2, ChevronsUpDown, Check } from "lucide-react"
import { format } from "date-fns"
import { id as idLocale } from "date-fns/locale"
import { RetaseLocation } from "../types"

interface RetaseConfirmedTabProps {
    filteredConfirmed: any[]
    isCorporate: boolean
    canDelete: boolean
    locations: RetaseLocation[]
    filterCabang: string
    onFilterCabangChange: (val: string) => void
    filterCustomer: string
    onFilterCustomerChange: (val: string) => void
    customerPopoverOpen: boolean
    onCustomerPopoverOpenChange: (open: boolean) => void
    uniqueCustomers: Array<{ id: string; name: string }>
    onResetFilters: () => void
    onDeleteRequest: (id: string) => void
}

export function RetaseConfirmedTab({
    filteredConfirmed,
    isCorporate,
    canDelete,
    locations,
    filterCabang,
    onFilterCabangChange,
    filterCustomer,
    onFilterCustomerChange,
    customerPopoverOpen,
    onCustomerPopoverOpenChange,
    uniqueCustomers,
    onResetFilters,
    onDeleteRequest,
}: RetaseConfirmedTabProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Riwayat Transaksi & Surat Jalan</CardTitle>
                <CardDescription>
                    Cetak surat jalan dan pantau histori transaksi yang telah selesai. Segala modifikasi akan tercatat abadi di Audit Log.
                </CardDescription>
            </CardHeader>

            {/* SuperAdmin & Corporate Filters */}
            {isCorporate && (
                <div className="flex flex-wrap gap-3 px-6 pt-4 pb-0">
                    <div className="flex items-center gap-2">
                        <label className="text-xs font-medium text-slate-500 whitespace-nowrap">Cabang:</label>
                        <Select value={filterCabang} onValueChange={onFilterCabangChange}>
                            <SelectTrigger className="h-8 text-xs w-44">
                                <SelectValue placeholder="Semua Cabang" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Semua Cabang</SelectItem>
                                {locations.map((loc: any) => (
                                    <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex items-center gap-2">
                        <label className="text-xs font-medium text-slate-500 whitespace-nowrap">Customer:</label>
                        <Popover open={customerPopoverOpen} onOpenChange={onCustomerPopoverOpenChange}>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    role="combobox"
                                    className="h-8 text-xs w-56 justify-between font-normal"
                                >
                                    <span className="truncate">
                                        {filterCustomer === "all"
                                            ? "Semua Customer"
                                            : uniqueCustomers.find(c => c.id === filterCustomer)?.name ?? "Semua Customer"
                                        }
                                    </span>
                                    <ChevronsUpDown className="ml-1 h-3 w-3 shrink-0 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-64 p-0" align="start">
                                <Command>
                                    <CommandInput placeholder="Cari customer..." className="h-8 text-xs" />
                                    <CommandList>
                                        <CommandEmpty className="text-xs py-3 text-center text-slate-400">
                                            Customer tidak ditemukan
                                        </CommandEmpty>
                                        <CommandGroup>
                                            <CommandItem
                                                value="all"
                                                onSelect={() => {
                                                    onFilterCustomerChange("all")
                                                    onCustomerPopoverOpenChange(false)
                                                }}
                                                className="text-xs"
                                            >
                                                <Check className={`mr-2 h-3 w-3 ${filterCustomer === "all" ? "opacity-100" : "opacity-0"}`} />
                                                Semua Customer
                                            </CommandItem>
                                            {uniqueCustomers.map(c => (
                                                <CommandItem
                                                    key={c.id}
                                                    value={c.name}
                                                    onSelect={() => {
                                                        onFilterCustomerChange(c.id)
                                                        onCustomerPopoverOpenChange(false)
                                                    }}
                                                    className="text-xs"
                                                >
                                                    <Check className={`mr-2 h-3 w-3 ${filterCustomer === c.id ? "opacity-100" : "opacity-0"}`} />
                                                    {c.name}
                                                </CommandItem>
                                            ))}
                                        </CommandGroup>
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>
                    </div>

                    {(filterCabang !== "all" || filterCustomer !== "all") && (
                        <button
                            onClick={onResetFilters}
                            className="text-xs text-slate-400 hover:text-slate-700 underline cursor-pointer"
                        >
                            Reset Filter
                        </button>
                    )}
                </div>
            )}

            <CardContent className="pt-4">
                <SimpleDataTable<any>
                    data={filteredConfirmed}
                    searchKeys={["customer.customer_name", "customer.project_name", "driver.name", "id"]}
                    searchPlaceholder="Cari no. SJ, customer atau sopir..."
                >
                    {(items, sortConfig, toggleSort) => (
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-slate-50/50">
                                    <TableHead className="text-xs">
                                        <SortableHeader<any> label="No. SJ" sortKey="id" sortConfig={sortConfig} onSort={toggleSort} />
                                    </TableHead>
                                    <TableHead>
                                        <SortableHeader<any> label="Tanggal" sortKey="date" sortConfig={sortConfig} onSort={toggleSort} />
                                    </TableHead>
                                    <TableHead>
                                        <SortableHeader<any> label="Customer / Proyek" sortKey="customer.customer_name" sortConfig={sortConfig} onSort={toggleSort} />
                                    </TableHead>
                                    <TableHead>
                                        <SortableHeader<any> label="TM / Kumulatif" sortKey="trip_sequence" sortConfig={sortConfig} onSort={toggleSort} />
                                    </TableHead>
                                    <TableHead>
                                        <SortableHeader<any> label="Mutu / Vol" sortKey="concreteQuality.name" sortConfig={sortConfig} onSort={toggleSort} />
                                    </TableHead>
                                    <TableHead>
                                        <SortableHeader<any> label="Retase (Sopir)" sortKey="driver.name" sortConfig={sortConfig} onSort={toggleSort} />
                                    </TableHead>
                                    {isCorporate && (
                                        <TableHead>
                                            <SortableHeader<any> label="Cabang" sortKey="location.name" sortConfig={sortConfig} onSort={toggleSort} />
                                        </TableHead>
                                    )}
                                    <TableHead className="text-right">Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {items.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={isCorporate ? 9 : 8} className="text-center text-slate-500 py-8">
                                            Tidak ada histori.
                                        </TableCell>
                                    </TableRow>
                                )}
                                {items.map(t => (
                                    <TableRow key={t.id}>
                                        <TableCell className="text-[11px] font-mono">
                                            <span className="font-semibold text-slate-700">{t.id.split('-')[0].toUpperCase()}</span>
                                            <div className="text-[9px] text-slate-400">/SJ/{format(new Date(t.date), "MM/yy")}</div>
                                        </TableCell>
                                        <TableCell className="text-xs">
                                            {format(new Date(t.date), "dd MMM HH:mm", { locale: idLocale })}
                                        </TableCell>
                                        <TableCell>
                                            <div className="font-medium text-xs uppercase">{t.project?.customer?.customer_name ?? '-'}</div>
                                            <div className="text-[10px] text-slate-400 font-medium uppercase">{t.project?.name ?? '-'}</div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="font-bold bg-slate-50">TM-{t.trip_sequence}</Badge>
                                            <div className="text-[10px] text-slate-500 mt-0.5">{t.cumulative_volume} m³ kum.</div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="font-medium text-xs">{t.concreteQuality.name}</div>
                                            <div className="text-[10px] text-slate-500">{t.volume_cubic} M³</div>
                                        </TableCell>
                                        <TableCell>
                                            {t.retase ? (
                                                <>
                                                    <div className="font-medium flex items-center gap-2 text-xs">
                                                        {t.driver.name}
                                                        <Badge variant="outline" className="text-[10px]">{t.retase.calculated_distance} KM</Badge>
                                                    </div>
                                                    <div className="text-[10px] text-slate-400 uppercase">
                                                        {t.vehicle.code} ({t.vehicle.plate_number})
                                                    </div>
                                                </>
                                            ) : (
                                                <span className="text-slate-400 italic text-xs">Retase Error</span>
                                            )}
                                        </TableCell>
                                        {isCorporate && <TableCell className="text-xs">{t.location.name}</TableCell>}
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" className="h-8 w-8 p-0 cursor-pointer">
                                                        <span className="sr-only">Open menu</span>
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => window.open(`/print/produksi/${t.id}`, '_blank')} className="cursor-pointer">
                                                        <Printer className="mr-2 h-4 w-4" /> Cetak Surat Jalan
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem disabled>
                                                        <Edit className="mr-2 h-4 w-4" /> Edit Transaksi
                                                    </DropdownMenuItem>
                                                    {canDelete && (
                                                        <DropdownMenuItem onClick={() => onDeleteRequest(t.id)} className="text-red-600 focus:bg-red-50 cursor-pointer">
                                                            <Trash2 className="mr-2 h-4 w-4" /> Hapus Transaksi (Log)
                                                        </DropdownMenuItem>
                                                    )}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </SimpleDataTable>
            </CardContent>
        </Card>
    )
}
