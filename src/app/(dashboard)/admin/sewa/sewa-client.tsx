"use client"

import { useState, useMemo, useTransition } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
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
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Plus,
    Printer,
    Eye,
    CheckCircle2,
    Search,
    X,
    Calendar,
    CalendarRange,
    CalendarDays,
    Trash2,
    DollarSign,
    FileText,
    Loader2,
    ChevronsUpDown,
    Check
} from "lucide-react"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import {
    createSewaTransaction,
    updateSewaStatus,
    deleteSewaTransaction
} from "./actions"
import { toast } from "sonner"
import { format, differenceInCalendarDays } from "date-fns"
import { id as idLocale } from "date-fns/locale"
import Link from "next/link"

export function SewaClient({
    masters,
    initialTransactions,
    userRole,
    canCreate = true,
}: {
    masters: {
        customers: any[]
        equipments: any[]
        operators: any[]
        locations: any[]
    }
    initialTransactions: any[]
    masterEquipments?: any[]
    userRole: string
    canCreate?: boolean
}) {
    const isCorp = userRole === "SuperAdminBP" || ["CEO", "FVP", "Approver"].includes(userRole)
    const [isPending, startTransition] = useTransition()

    // ─── TRANSACTIONS LIST & FILTER STATES ────────────────────────────────────────
    const [transactions, setTransactions] = useState<any[]>(initialTransactions)
    const [searchQuery, setSearchQuery] = useState<string>("")
    const [filterStatus, setFilterStatus] = useState<string>("ALL")
    const [filterBranch, setFilterBranch] = useState<string>("ALL")
    const [filterStartDate, setFilterStartDate] = useState<string>("")
    const [filterEndDate, setFilterEndDate] = useState<string>("")

    // ─── MODAL INPUT SEWA BARU STATES ─────────────────────────────────────────────
    const [isInputModalOpen, setIsInputModalOpen] = useState<boolean>(false)

    // Combobox popover open states
    const [openCustomer, setOpenCustomer] = useState<boolean>(false)
    const [openProject, setOpenProject] = useState<boolean>(false)
    const [openEquipment, setOpenEquipment] = useState<boolean>(false)
    const [openOperator, setOpenOperator] = useState<boolean>(false)

    const [selectedCustomerId, setSelectedCustomerId] = useState<string>("")
    const [selectedProjectId, setSelectedProjectId] = useState<string>("NONE")
    const [lokasiProyek, setLokasiProyek] = useState<string>("")
    const [selectedEquipmentId, setSelectedEquipmentId] = useState<string>("")
    const [selectedOperatorId, setSelectedOperatorId] = useState<string>("")
    const [selectedLocationId, setSelectedLocationId] = useState<string>(
        masters.locations[0]?.id || ""
    )

    // Date Mode: "RANGE" (consecutive range) vs "DATES" (non-consecutive discrete dates)
    const [dateMode, setDateMode] = useState<"RANGE" | "DATES">("RANGE")
    const todayStr = new Date().toISOString().split("T")[0]
    const [rangeStart, setRangeStart] = useState<string>(todayStr)
    const [rangeEnd, setRangeEnd] = useState<string>(todayStr)

    // Specific discrete dates (for non-consecutive dates)
    const [specificDates, setSpecificDates] = useState<string[]>([todayStr])
    const [dateInputVal, setDateInputVal] = useState<string>(todayStr)

    // Helper to parse decimal numbers supporting comma (3153153,15 or 3.153.153,15)
    const parseDecimal = (val: string): number => {
        if (!val) return 0
        let clean = String(val).trim()
        if (clean.includes(",") && clean.includes(".")) {
            clean = clean.replace(/\./g, "").replace(/,/g, ".")
        } else if (clean.includes(",")) {
            clean = clean.replace(/,/g, ".")
        }
        const num = parseFloat(clean)
        return isNaN(num) ? 0 : num
    }

    // Pricing & PPN (Free Input)
    const [pricePerDayInput, setPricePerDayInput] = useState<string>("")
    const [totalPriceInput, setTotalPriceInput] = useState<string>("")
    const [isTotalPriceManual, setIsTotalPriceManual] = useState<boolean>(false)
    const [ppnMode, setPpnMode] = useState<"NON_PPN" | "INCLUDE" | "EXCLUDE">("NON_PPN")
    const [ppnRate, setPpnRate] = useState<number>(11)
    const [notes, setNotes] = useState<string>("")

    // Detail Modal State
    const [selectedTxDetail, setSelectedTxDetail] = useState<any>(null)
    const [isDetailOpen, setIsDetailOpen] = useState<boolean>(false)

    // ─── Auto-calculate Days & Total Price ────────────────────────────────────────
    const calculatedDays = useMemo(() => {
        if (dateMode === "RANGE") {
            if (!rangeStart || !rangeEnd) return 1
            const d1 = new Date(rangeStart)
            const d2 = new Date(rangeEnd)
            const diff = differenceInCalendarDays(d2, d1)
            return Math.max(1, diff + 1) // Inclusive days
        } else {
            return Math.max(1, specificDates.length)
        }
    }, [dateMode, rangeStart, rangeEnd, specificDates])

    const numPricePerDay = useMemo(() => parseDecimal(pricePerDayInput), [pricePerDayInput])
    const rawBaseTotal = useMemo(() => {
        if (isTotalPriceManual) {
            return parseDecimal(totalPriceInput)
        }
        return numPricePerDay * calculatedDays
    }, [isTotalPriceManual, totalPriceInput, numPricePerDay, calculatedDays])

    const { dppAmount, ppnAmount, grandTotal } = useMemo(() => {
        if (ppnMode === "INCLUDE") {
            const factor = 1 + (ppnRate / 100)
            const dpp = factor > 0 ? (rawBaseTotal / factor) : rawBaseTotal
            const ppn = rawBaseTotal - dpp
            return { dppAmount: dpp, ppnAmount: ppn, grandTotal: rawBaseTotal }
        } else if (ppnMode === "EXCLUDE") {
            const ppn = rawBaseTotal * (ppnRate / 100)
            return { dppAmount: rawBaseTotal, ppnAmount: ppn, grandTotal: rawBaseTotal + ppn }
        } else {
            return { dppAmount: rawBaseTotal, ppnAmount: 0, grandTotal: rawBaseTotal }
        }
    }, [rawBaseTotal, ppnMode, ppnRate])

    const handleDailyRateChange = (rateStr: string) => {
        setPricePerDayInput(rateStr)
        const rate = parseDecimal(rateStr)
        if (!isTotalPriceManual) {
            setTotalPriceInput(rate > 0 ? String(rate * calculatedDays) : "")
        }
    }

    const handleDaysChanged = (days: number) => {
        if (!isTotalPriceManual && numPricePerDay > 0) {
            setTotalPriceInput(String(numPricePerDay * days))
        }
    }

    const handleCustomerChange = (customerId: string) => {
        setSelectedCustomerId(customerId)
        const cust = masters.customers.find(c => c.id === customerId)
        if (cust) {
            if (cust.projects && cust.projects.length > 0) {
                setSelectedProjectId(cust.projects[0].id)
                setLokasiProyek(cust.projects[0].address || cust.address)
            } else {
                setSelectedProjectId("NONE")
                setLokasiProyek(cust.address || "")
            }
        }
    }

    const handleEquipmentChange = (equipmentId: string) => {
        setSelectedEquipmentId(equipmentId)
        const eq = masters.equipments.find(e => e.id === equipmentId)
        if (eq && eq.default_day_rate && eq.default_day_rate > 0) {
            handleDailyRateChange(String(eq.default_day_rate))
        }
    }

    const handleAddSpecificDate = () => {
        if (!dateInputVal) return
        if (specificDates.includes(dateInputVal)) {
            toast.info("Tanggal ini sudah dipilih")
            return
        }
        const updated = [...specificDates, dateInputVal].sort()
        setSpecificDates(updated)
        handleDaysChanged(updated.length)
    }

    const handleRemoveSpecificDate = (dToRemove: string) => {
        if (specificDates.length <= 1) {
            toast.warning("Minimal harus ada 1 tanggal sewa")
            return
        }
        const updated = specificDates.filter(d => d !== dToRemove)
        setSpecificDates(updated)
        handleDaysChanged(updated.length)
    }

    const handleResetForm = () => {
        setSelectedCustomerId("")
        setSelectedProjectId("NONE")
        setLokasiProyek("")
        setSelectedEquipmentId("")
        setSelectedOperatorId("")
        setDateMode("RANGE")
        setRangeStart(todayStr)
        setRangeEnd(todayStr)
        setSpecificDates([todayStr])
        setPricePerDayInput("")
        setTotalPriceInput("")
        setIsTotalPriceManual(false)
        setPpnMode("NON_PPN")
        setPpnRate(11)
        setNotes("")
        setOpenCustomer(false)
        setOpenProject(false)
        setOpenEquipment(false)
        setOpenOperator(false)
    }

    const handleOpenInputModal = () => {
        handleResetForm()
        setIsInputModalOpen(true)
    }

    const handleCreateSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        if (!selectedCustomerId) {
            toast.error("Customer wajib dipilih")
            return
        }
        if (!selectedEquipmentId) {
            toast.error("Unit alat / kendaraan wajib dipilih")
            return
        }
        if (!selectedOperatorId) {
            toast.error("Operator wajib dipilih")
            return
        }

        const formData = new FormData()
        formData.append("customerId", selectedCustomerId)
        if (selectedProjectId && selectedProjectId !== "NONE") {
            formData.append("projectId", selectedProjectId)
        }
        formData.append("lokasi_proyek", lokasiProyek || "")
        formData.append("equipmentId", selectedEquipmentId)
        formData.append("operatorId", selectedOperatorId)
        formData.append("date_mode", dateMode)

        if (dateMode === "RANGE") {
            formData.append("start_date", rangeStart)
            formData.append("end_date", rangeEnd)
            const daysArr: string[] = []
            let curr = new Date(rangeStart)
            const stop = new Date(rangeEnd)
            while (curr <= stop) {
                daysArr.push(curr.toISOString().split("T")[0])
                curr.setDate(curr.getDate() + 1)
            }
            formData.append("rental_dates", JSON.stringify(daysArr))
            formData.append("total_days", String(calculatedDays))
        } else {
            const sorted = [...specificDates].sort()
            formData.append("start_date", sorted[0])
            formData.append("end_date", sorted[sorted.length - 1])
            formData.append("rental_dates", JSON.stringify(sorted))
            formData.append("total_days", String(sorted.length))
        }

        formData.append("price_per_day", String(numPricePerDay))
        formData.append("total_price", String(grandTotal))
        formData.append("is_ppn", String(ppnMode !== "NON_PPN"))
        formData.append("ppn_mode", ppnMode)
        formData.append("ppn_rate", String(ppnRate))
        formData.append("dpp_amount", String(dppAmount))
        formData.append("ppn_amount", String(ppnAmount))
        formData.append("notes", notes)
        if (selectedLocationId) {
            formData.append("locationId", selectedLocationId)
        }

        startTransition(async () => {
            const res = await createSewaTransaction(formData)
            if (res.success && res.sewa) {
                toast.success(`Transaksi Sewa No. ${res.sewa.sewa_number} berhasil dibuat!`)
                setTransactions(prev => [res.sewa, ...prev])
                setIsInputModalOpen(false)
            } else {
                toast.error(res.error || "Gagal membuat transaksi sewa")
            }
        })
    }

    // Filtered Transactions
    const filteredTransactions = useMemo(() => {
        return transactions.filter(tx => {
            if (filterStatus !== "ALL" && tx.status !== filterStatus) return false
            if (filterBranch !== "ALL" && tx.locationId !== filterBranch) return false
            if (filterStartDate) {
                const txEnd = tx.end_date ? tx.end_date.split("T")[0] : (tx.date ? tx.date.split("T")[0] : "")
                if (txEnd && txEnd < filterStartDate) return false
            }
            if (filterEndDate) {
                const txStart = tx.start_date ? tx.start_date.split("T")[0] : (tx.date ? tx.date.split("T")[0] : "")
                if (txStart && txStart > filterEndDate) return false
            }
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase().trim()
                const matchNum = tx.sewa_number?.toLowerCase().includes(q)
                const matchCust = tx.customer?.customer_name?.toLowerCase().includes(q)
                const matchEq = tx.equipment?.nama_alat?.toLowerCase().includes(q) || tx.equipment?.kode_alat?.toLowerCase().includes(q)
                const matchOp = tx.operator?.name?.toLowerCase().includes(q)
                const matchLoc = tx.lokasi_proyek?.toLowerCase().includes(q)
                if (!matchNum && !matchCust && !matchEq && !matchOp && !matchLoc) return false
            }
            return true
        })
    }, [transactions, filterStatus, filterBranch, filterStartDate, filterEndDate, searchQuery])

    const formatRp = (num: number, withDecimals = false) => {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            maximumFractionDigits: withDecimals || (num % 1 !== 0) ? 2 : 0,
        }).format(num || 0)
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "Active":
                return <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">Aktif (Disewa)</Badge>
            case "Completed":
                return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Selesai</Badge>
            case "Cancelled":
                return <Badge variant="destructive" className="bg-rose-50 text-rose-700 border-rose-200">Dibatalkan</Badge>
            default:
                return <Badge variant="secondary">{status}</Badge>
        }
    }

    return (
        <div className="space-y-4">
            {/* ── Header Toolbar: Clean Title & Action Button ── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
                    Sewa Alat & Kendaraan
                </h1>

                {canCreate && (
                    <Button
                        onClick={handleOpenInputModal}
                        className="bg-blue-600 hover:bg-blue-700 text-white text-xs h-9 gap-1.5 shadow-xs cursor-pointer shrink-0"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Input Sewa Baru</span>
                    </Button>
                )}
            </div>

            {/* ── Filters Bar ── */}
            <div className="flex flex-col gap-2.5 bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
                <div className="flex flex-wrap items-center justify-between gap-2.5">
                    <div className="flex flex-wrap items-center gap-2 flex-1">
                        <div className="relative min-w-[200px] flex-1 max-w-sm">
                            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <Input
                                placeholder="Cari No. Surat Jalan, customer, alat, operator..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="pl-9 h-8 text-xs"
                            />
                        </div>

                        {isCorp && (
                            <Select value={filterBranch} onValueChange={setFilterBranch}>
                                <SelectTrigger className="h-8 text-xs w-[130px]">
                                    <SelectValue placeholder="Cabang" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ALL">Semua Cabang</SelectItem>
                                    {masters.locations.map(loc => (
                                        <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}

                        <Select value={filterStatus} onValueChange={setFilterStatus}>
                            <SelectTrigger className="h-8 text-xs w-[120px]">
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL">Semua Status</SelectItem>
                                <SelectItem value="Active">Aktif</SelectItem>
                                <SelectItem value="Completed">Selesai</SelectItem>
                                <SelectItem value="Cancelled">Dibatalkan</SelectItem>
                            </SelectContent>
                        </Select>

                        {/* Date Range Picker */}
                        <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-md">
                            <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="text-[11px] text-slate-500 font-medium">Dari:</span>
                            <input
                                type="date"
                                value={filterStartDate}
                                onChange={e => setFilterStartDate(e.target.value)}
                                className="h-7 text-xs bg-transparent border-0 focus:outline-none text-slate-700"
                            />
                            <span className="text-[11px] text-slate-400 font-medium">s/d</span>
                            <input
                                type="date"
                                value={filterEndDate}
                                onChange={e => setFilterEndDate(e.target.value)}
                                className="h-7 text-xs bg-transparent border-0 focus:outline-none text-slate-700"
                            />
                        </div>

                        {/* Date Presets */}
                        <div className="inline-flex rounded-md border border-slate-200 bg-slate-50 p-0.5 text-[11px]">
                            <button
                                type="button"
                                onClick={() => {
                                    setFilterStartDate(todayStr)
                                    setFilterEndDate(todayStr)
                                }}
                                className={`px-2 py-0.5 rounded transition-colors ${filterStartDate === todayStr && filterEndDate === todayStr ? "bg-white font-bold text-blue-600 shadow-2xs" : "text-slate-600 hover:text-slate-900"}`}
                            >
                                Hari Ini
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    const now = new Date()
                                    const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0]
                                    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0]
                                    setFilterStartDate(start)
                                    setFilterEndDate(end)
                                }}
                                className={`px-2 py-0.5 rounded transition-colors ${(() => {
                                    const now = new Date()
                                    const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0]
                                    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0]
                                    return filterStartDate === start && filterEndDate === end
                                })() ? "bg-white font-bold text-blue-600 shadow-2xs" : "text-slate-600 hover:text-slate-900"}`}
                            >
                                Bulan Ini
                            </button>
                        </div>

                        {(searchQuery || filterStatus !== "ALL" || filterBranch !== "ALL" || filterStartDate || filterEndDate) && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                    setSearchQuery("")
                                    setFilterStatus("ALL")
                                    setFilterBranch("ALL")
                                    setFilterStartDate("")
                                    setFilterEndDate("")
                                }}
                                className="h-8 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                            >
                                <X className="w-3.5 h-3.5 mr-1" /> Reset
                            </Button>
                        )}
                    </div>

                    <div className="text-xs text-slate-500 font-medium shrink-0">
                        Total: <span className="font-bold text-slate-900">{filteredTransactions.length}</span> transaksi
                    </div>
                </div>
            </div>

            {/* ── Main View: Daftar Transaksi Sewa (Tampil Duluan) ── */}
            <Card className="shadow-xs border-slate-200 overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-slate-50/80 border-b border-slate-200">
                            <TableHead className="w-[140px]">No. DO Sewa</TableHead>
                            <TableHead>Customer & Lokasi Proyek</TableHead>
                            <TableHead>Unit Alat</TableHead>
                            <TableHead>Operator</TableHead>
                            <TableHead className="text-center">Jadwal & Durasi</TableHead>
                            <TableHead className="text-right">Nilai Sewa</TableHead>
                            <TableHead className="text-center">Status</TableHead>
                            <TableHead className="text-center w-[120px]">Aksi</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredTransactions.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={8} className="text-center py-12 text-xs text-slate-400">
                                    <div className="flex flex-col items-center gap-2">
                                        <FileText className="w-8 h-8 text-slate-300" />
                                        <p className="font-medium text-slate-600">Belum ada transaksi sewa alat.</p>
                                        {canCreate && (
                                            <Button
                                                size="sm"
                                                onClick={handleOpenInputModal}
                                                className="mt-2 text-xs bg-blue-600 hover:bg-blue-700 text-white gap-1"
                                            >
                                                <Plus className="w-3.5 h-3.5" /> Input Transaksi Baru
                                            </Button>
                                        )}
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredTransactions.map(tx => (
                                <TableRow key={tx.id} className="hover:bg-slate-50/60 transition-colors">
                                    <TableCell className="font-mono text-xs font-bold text-blue-600">
                                        {tx.sewa_number}
                                    </TableCell>
                                    <TableCell>
                                        <p className="font-semibold text-xs text-slate-900">{tx.customer?.customer_name}</p>
                                        <p className="text-[11px] text-slate-400 line-clamp-1">{tx.lokasi_proyek || tx.customer?.address}</p>
                                    </TableCell>
                                    <TableCell>
                                        <div className="font-medium text-xs text-slate-800">
                                            {tx.vehicle ? `${tx.vehicle.category?.name || "Unit"} ${tx.vehicle.code}` : (tx.equipment?.nama_alat || "-")}
                                        </div>
                                        <div className="text-[10px] text-slate-400 font-mono">
                                            {tx.vehicle?.plate_number || tx.equipment?.nomor_seri_plat || tx.equipment?.kode_alat || ""}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="text-xs font-medium text-slate-800">{tx.operator?.name}</span>
                                            {tx.operator?.driverCategory && (
                                                <span className="text-[10px] text-blue-600">{tx.operator.driverCategory.name}</span>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <div className="flex flex-col items-center">
                                            <span className="font-bold text-xs text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                                                {tx.total_days} Hari
                                            </span>
                                            <span className="text-[10px] text-slate-400 mt-0.5">
                                                {format(new Date(tx.start_date), "dd/MM")} - {format(new Date(tx.end_date), "dd/MM/yy")}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right font-mono text-xs font-bold text-slate-900">
                                        <div>{formatRp(tx.total_price)}</div>
                                        {tx.is_ppn && (
                                            <span className="text-[10px] font-medium text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                                                {tx.ppn_mode === "INCLUDE" ? "Inc." : "Exc."} PPN {tx.ppn_rate ?? 11}%
                                            </span>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-center">
                                        {getStatusBadge(tx.status)}
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <div className="flex items-center justify-center gap-1">
                                            <Link
                                                href={`/print/sewa/${tx.id}`}
                                                target="_blank"
                                                className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                                title="Cetak Surat Jalan"
                                            >
                                                <Printer className="w-4 h-4" />
                                            </Link>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setSelectedTxDetail(tx)
                                                    setIsDetailOpen(true)
                                                }}
                                                className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                                title="Lihat Detail Transaksi"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </button>
                                            {canCreate && tx.status === "Active" && (
                                                <button
                                                    type="button"
                                                    onClick={async () => {
                                                        if (!confirm("Tandai transaksi sewa ini sebagai Selesai?")) return
                                                        const res = await updateSewaStatus(tx.id, "Completed")
                                                        if (res.success) {
                                                            toast.success("Status sewa diubah menjadi Selesai")
                                                            setTransactions(prev => prev.map(t => t.id === tx.id ? { ...t, status: "Completed" } : t))
                                                        }
                                                    }}
                                                    className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded transition-colors"
                                                    title="Tandai Selesai"
                                                >
                                                    <CheckCircle2 className="w-4 h-4" />
                                                </button>
                                            )}
                                            {canCreate && (
                                                <button
                                                    type="button"
                                                    onClick={async () => {
                                                        if (!confirm(`Hapus transaksi sewa "${tx.sewa_number}"?`)) return
                                                        const res = await deleteSewaTransaction(tx.id)
                                                        if (res.success) {
                                                            toast.success("Transaksi sewa berhasil dihapus")
                                                            setTransactions(prev => prev.filter(t => t.id !== tx.id))
                                                        } else {
                                                            toast.error(res.error || "Gagal menghapus")
                                                        }
                                                    }}
                                                    className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                                                    title="Hapus Transaksi"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </Card>

            {/* ── MODAL INPUT SEWA BARU ── */}
            <Dialog open={isInputModalOpen} onOpenChange={setIsInputModalOpen}>
                <DialogContent className="sm:max-w-[840px] max-h-[92vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                            <Plus className="w-5 h-5 text-blue-600" />
                            Input Transaksi Sewa Baru
                        </DialogTitle>
                    </DialogHeader>

                    <form onSubmit={handleCreateSubmit} className="space-y-4 py-1 text-xs">
                        {/* Cabang (if corporate) */}
                        {isCorp && (
                            <div className="space-y-1">
                                <Label className="text-xs font-semibold text-slate-700">Cabang Penyelenggara *</Label>
                                <Select value={selectedLocationId} onValueChange={setSelectedLocationId}>
                                    <SelectTrigger className="h-9 text-xs bg-white">
                                        <SelectValue placeholder="Pilih Cabang" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {masters.locations.map(loc => (
                                            <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        {/* Customer & Proyek */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="space-y-1 flex flex-col">
                                <Label className="text-xs font-semibold text-slate-700">Customer / Penyewa *</Label>
                                <Popover open={openCustomer} onOpenChange={setOpenCustomer}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            role="combobox"
                                            aria-expanded={openCustomer}
                                            className="w-full justify-between h-9 text-xs font-normal bg-white border-slate-200 hover:bg-slate-50"
                                        >
                                            <span className="truncate">
                                                {selectedCustomerId
                                                    ? (masters.customers.find(c => c.id === selectedCustomerId)?.customer_name ?? "Pilih Customer")
                                                    : <span className="text-slate-400">Pilih Customer</span>}
                                            </span>
                                            <ChevronsUpDown className="ml-2 h-3.5 w-3.5 shrink-0 opacity-50" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0 z-[60]" align="start">
                                        <Command>
                                            <CommandInput placeholder="Cari nama customer..." className="h-8 text-xs" />
                                            <CommandList className="max-h-[220px]">
                                                <CommandEmpty className="py-3 text-center text-xs text-slate-500">Customer tidak ditemukan.</CommandEmpty>
                                                <CommandGroup>
                                                    {masters.customers.map(c => (
                                                        <CommandItem
                                                            key={c.id}
                                                            value={`${c.customer_name} ${c.address || ""}`}
                                                            onSelect={() => {
                                                                handleCustomerChange(c.id)
                                                                setOpenCustomer(false)
                                                            }}
                                                            className="text-xs cursor-pointer py-1.5"
                                                        >
                                                            <Check className={cn("mr-2 h-3.5 w-3.5 text-blue-600 shrink-0", selectedCustomerId === c.id ? "opacity-100" : "opacity-0")} />
                                                            <div className="flex flex-col min-w-0">
                                                                <span className="font-medium text-slate-900 truncate">{c.customer_name}</span>
                                                                {c.address && <span className="text-[10px] text-slate-400 truncate">{c.address}</span>}
                                                            </div>
                                                        </CommandItem>
                                                    ))}
                                                </CommandGroup>
                                            </CommandList>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                            </div>

                            <div className="space-y-1 flex flex-col">
                                <Label className="text-xs font-semibold text-slate-700">Proyek (Opsional)</Label>
                                <Popover open={openProject} onOpenChange={setOpenProject}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            role="combobox"
                                            aria-expanded={openProject}
                                            disabled={!selectedCustomerId}
                                            className="w-full justify-between h-9 text-xs font-normal bg-white border-slate-200 hover:bg-slate-50"
                                        >
                                            <span className="truncate">
                                                {selectedProjectId && selectedProjectId !== "NONE"
                                                    ? (() => {
                                                        const cust = masters.customers.find(c => c.id === selectedCustomerId)
                                                        const prj = cust?.projects?.find((p: any) => p.id === selectedProjectId)
                                                        return prj ? prj.name : "-- Tanpa Proyek Terdaftar --"
                                                    })()
                                                    : (selectedCustomerId ? "-- Tanpa Proyek Terdaftar --" : <span className="text-slate-400">Pilih customer dulu</span>)}
                                            </span>
                                            <ChevronsUpDown className="ml-2 h-3.5 w-3.5 shrink-0 opacity-50" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0 z-[60]" align="start">
                                        <Command>
                                            <CommandInput placeholder="Cari nama proyek..." className="h-8 text-xs" />
                                            <CommandList className="max-h-[200px]">
                                                <CommandEmpty className="py-2 text-center text-xs text-slate-500">Proyek tidak ditemukan.</CommandEmpty>
                                                <CommandGroup>
                                                    <CommandItem
                                                        value="Tanpa Proyek Terdaftar None"
                                                        onSelect={() => {
                                                            setSelectedProjectId("NONE")
                                                            const cust = masters.customers.find(c => c.id === selectedCustomerId)
                                                            if (cust) setLokasiProyek(cust.address || "")
                                                            setOpenProject(false)
                                                        }}
                                                        className="text-xs cursor-pointer py-1.5 italic text-slate-500"
                                                    >
                                                        <Check className={cn("mr-2 h-3.5 w-3.5 text-blue-600 shrink-0", selectedProjectId === "NONE" ? "opacity-100" : "opacity-0")} />
                                                        -- Tanpa Proyek Terdaftar --
                                                    </CommandItem>
                                                    {masters.customers
                                                        .find(c => c.id === selectedCustomerId)
                                                        ?.projects?.map((p: any) => (
                                                            <CommandItem
                                                                key={p.id}
                                                                value={`${p.name} ${p.address || ""}`}
                                                                onSelect={() => {
                                                                    setSelectedProjectId(p.id)
                                                                    if (p.address) setLokasiProyek(p.address)
                                                                    setOpenProject(false)
                                                                }}
                                                                className="text-xs cursor-pointer py-1.5"
                                                            >
                                                                <Check className={cn("mr-2 h-3.5 w-3.5 text-blue-600 shrink-0", selectedProjectId === p.id ? "opacity-100" : "opacity-0")} />
                                                                <div className="flex flex-col min-w-0">
                                                                    <span className="font-medium text-slate-900 truncate">{p.name}</span>
                                                                    {p.address && <span className="text-[10px] text-slate-400 truncate">{p.address}</span>}
                                                                </div>
                                                            </CommandItem>
                                                        ))}
                                                </CommandGroup>
                                            </CommandList>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                            </div>
                        </div>

                        {/* Alamat Kerja */}
                        <div className="space-y-1">
                            <Label className="text-xs font-semibold text-slate-700">Lokasi / Alamat Kerja Alat *</Label>
                            <Input
                                placeholder="Contoh: Jl. Trans Seram Km 12, Pengecoran Jembatan"
                                value={lokasiProyek}
                                onChange={e => setLokasiProyek(e.target.value)}
                                className="h-9 text-xs"
                                required
                            />
                        </div>

                        {/* Alat & Operator */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="space-y-1 flex flex-col">
                                <Label className="text-xs font-semibold text-slate-700">Unit Alat / Kendaraan Sewa *</Label>
                                <Popover open={openEquipment} onOpenChange={setOpenEquipment}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            role="combobox"
                                            aria-expanded={openEquipment}
                                            className="w-full justify-between h-9 text-xs font-normal bg-white border-slate-200 hover:bg-slate-50"
                                        >
                                            <span className="truncate">
                                                {selectedEquipmentId
                                                    ? (() => {
                                                        const eq = masters.equipments.find(e => e.id === selectedEquipmentId)
                                                        return eq ? `${eq.nama_alat} (${eq.kode_alat})` : "Pilih Alat / Kendaraan"
                                                    })()
                                                    : <span className="text-slate-400">Pilih Alat / Kendaraan</span>}
                                            </span>
                                            <ChevronsUpDown className="ml-2 h-3.5 w-3.5 shrink-0 opacity-50" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0 z-[60]" align="start">
                                        <Command>
                                            <CommandInput placeholder="Cari nama atau kode alat..." className="h-8 text-xs" />
                                            <CommandList className="max-h-[220px]">
                                                <CommandEmpty className="py-3 text-center text-xs text-slate-500">Alat/kendaraan tidak ditemukan.</CommandEmpty>
                                                <CommandGroup>
                                                    {masters.equipments.map(eq => (
                                                        <CommandItem
                                                            key={eq.id}
                                                            value={`${eq.nama_alat} ${eq.kode_alat} ${eq.kategori || ""}`}
                                                            onSelect={() => {
                                                                handleEquipmentChange(eq.id)
                                                                setOpenEquipment(false)
                                                            }}
                                                            className="text-xs cursor-pointer py-1.5"
                                                        >
                                                            <Check className={cn("mr-2 h-3.5 w-3.5 text-blue-600 shrink-0", selectedEquipmentId === eq.id ? "opacity-100" : "opacity-0")} />
                                                            <div className="flex items-center justify-between w-full min-w-0">
                                                                <div className="truncate">
                                                                    <span className="font-medium text-slate-900">{eq.nama_alat}</span>
                                                                    <span className="ml-1 text-[11px] text-slate-400">({eq.kode_alat})</span>
                                                                </div>
                                                                {eq.status !== "Tersedia" && (
                                                                    <span className="ml-2 shrink-0 text-[10px] text-amber-600 font-semibold bg-amber-50 px-1.5 py-0.5 rounded">
                                                                        {eq.status}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </CommandItem>
                                                    ))}
                                                </CommandGroup>
                                            </CommandList>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                            </div>

                            <div className="space-y-1 flex flex-col">
                                <Label className="text-xs font-semibold text-slate-700">Nama Operator *</Label>
                                <Popover open={openOperator} onOpenChange={setOpenOperator}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            role="combobox"
                                            aria-expanded={openOperator}
                                            className="w-full justify-between h-9 text-xs font-normal bg-white border-slate-200 hover:bg-slate-50"
                                        >
                                            <span className="truncate">
                                                {selectedOperatorId
                                                    ? (() => {
                                                        const op = masters.operators.find(o => o.id === selectedOperatorId)
                                                        return op ? `${op.name} ${op.driverCategory ? `• [${op.driverCategory.name}]` : `[${op.position}]`}` : "Pilih Operator Bertugas"
                                                    })()
                                                    : <span className="text-slate-400">Pilih Operator Bertugas</span>}
                                            </span>
                                            <ChevronsUpDown className="ml-2 h-3.5 w-3.5 shrink-0 opacity-50" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0 z-[60]" align="start">
                                        <Command>
                                            <CommandInput placeholder="Cari nama operator / sopir..." className="h-8 text-xs" />
                                            <CommandList className="max-h-[240px]">
                                                <CommandEmpty className="py-3 text-center text-xs text-slate-500">Operator tidak ditemukan.</CommandEmpty>
                                                <CommandGroup>
                                                    {masters.operators.map(op => (
                                                        <CommandItem
                                                            key={op.id}
                                                            value={`${op.name} ${op.driverCategory?.name || ""} ${op.position || ""}`}
                                                            onSelect={() => {
                                                                setSelectedOperatorId(op.id)
                                                                setOpenOperator(false)
                                                            }}
                                                            className="text-xs cursor-pointer py-1.5"
                                                        >
                                                            <Check className={cn("mr-2 h-3.5 w-3.5 text-blue-600 shrink-0", selectedOperatorId === op.id ? "opacity-100" : "opacity-0")} />
                                                            <div className="flex items-center justify-between w-full min-w-0">
                                                                <span className="font-medium text-slate-900 truncate">{op.name}</span>
                                                                {op.driverCategory ? (
                                                                    <span className="ml-2 shrink-0 text-[10px] text-blue-600 font-medium bg-blue-50 px-1.5 py-0.5 rounded">
                                                                        {op.driverCategory.name}
                                                                    </span>
                                                                ) : (
                                                                    <span className="ml-2 shrink-0 text-[10px] text-slate-400">
                                                                        {op.position}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </CommandItem>
                                                    ))}
                                                </CommandGroup>
                                            </CommandList>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                            </div>
                        </div>

                        {/* ── Perhitungan Hari Sewa ── */}
                        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
                            <div className="flex items-center justify-between">
                                <Label className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                                    <Calendar className="w-3.5 h-3.5 text-blue-600" />
                                    Metode Jadwal Sewa
                                </Label>

                                <div className="inline-flex rounded-md border border-slate-200 bg-white p-0.5">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setDateMode("RANGE")
                                            handleDaysChanged(calculatedDays)
                                        }}
                                        className={`px-2.5 py-0.5 rounded text-[11px] font-medium transition-all ${
                                            dateMode === "RANGE"
                                                ? "bg-blue-600 text-white shadow-xs"
                                                : "text-slate-600 hover:text-slate-900"
                                        }`}
                                    >
                                        <CalendarRange className="w-3 h-3 inline mr-1" />
                                        Rentang Tanggal
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setDateMode("DATES")
                                            handleDaysChanged(specificDates.length)
                                        }}
                                        className={`px-2.5 py-0.5 rounded text-[11px] font-medium transition-all ${
                                            dateMode === "DATES"
                                                ? "bg-blue-600 text-white shadow-xs"
                                                : "text-slate-600 hover:text-slate-900"
                                        }`}
                                    >
                                        <CalendarDays className="w-3 h-3 inline mr-1" />
                                        Tanggal Tertentu (Acak)
                                    </button>
                                </div>
                            </div>

                            {/* Mode Rentang Tanggal */}
                            {dateMode === "RANGE" ? (
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <Label className="text-[11px] text-slate-600">Dari Tanggal *</Label>
                                        <Input
                                            type="date"
                                            value={rangeStart}
                                            onChange={e => {
                                                setRangeStart(e.target.value)
                                                if (e.target.value > rangeEnd) setRangeEnd(e.target.value)
                                            }}
                                            className="h-8 text-xs bg-white"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-[11px] text-slate-600">Sampai Tanggal *</Label>
                                        <Input
                                            type="date"
                                            value={rangeEnd}
                                            min={rangeStart}
                                            onChange={e => setRangeEnd(e.target.value)}
                                            className="h-8 text-xs bg-white"
                                            required
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <Input
                                            type="date"
                                            value={dateInputVal}
                                            onChange={e => setDateInputVal(e.target.value)}
                                            className="h-8 text-xs bg-white flex-1"
                                        />
                                        <Button
                                            type="button"
                                            onClick={handleAddSpecificDate}
                                            size="sm"
                                            className="h-8 text-xs bg-slate-800 hover:bg-slate-900"
                                        >
                                            + Tambah
                                        </Button>
                                    </div>

                                    <div className="flex flex-wrap gap-1.5 p-2 bg-white rounded border border-slate-200 min-h-[38px] items-center">
                                        {specificDates.map(d => (
                                            <span
                                                key={d}
                                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200"
                                            >
                                                <span>{format(new Date(d), "dd/MM/yyyy")}</span>
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveSpecificDate(d)}
                                                    className="text-blue-400 hover:text-rose-600"
                                                >
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Live Badge Durasi */}
                            <div className="flex items-center justify-between p-2 bg-blue-50/70 border border-blue-200 rounded">
                                <span className="text-xs font-semibold text-blue-900">Total Durasi Terhitung:</span>
                                <span className="font-extrabold text-xs text-blue-700 bg-white px-2 py-0.5 rounded border border-blue-300">
                                    {calculatedDays} HARI
                                </span>
                            </div>
                        </div>

                        {/* ── Biaya (Free Input with Koma / Decimal Support) ── */}
                        <div className="space-y-3 p-3.5 bg-slate-50 border border-slate-200 rounded-lg">
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <Label className="text-xs font-semibold text-slate-700">Tarif / Hari (Rp)</Label>
                                    <Input
                                        type="text"
                                        inputMode="decimal"
                                        placeholder="Contoh: 3.500.000 atau 3153153,15"
                                        value={pricePerDayInput}
                                        onChange={e => handleDailyRateChange(e.target.value)}
                                        className="h-8 text-xs bg-white font-mono"
                                    />
                                    <span className="text-[10px] text-slate-500">
                                        {numPricePerDay > 0 ? formatRp(numPricePerDay, true) : "Opsional / Tarif harian"}
                                    </span>
                                </div>

                                <div className="space-y-1">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-xs font-semibold text-slate-700">
                                            {ppnMode === "INCLUDE" ? "Nilai Sewa (Gross/Include PPN) *" : "Nilai Dasar Sewa (DPP) *"}
                                        </Label>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setIsTotalPriceManual(false)
                                                setTotalPriceInput(numPricePerDay > 0 ? String(numPricePerDay * calculatedDays) : "")
                                            }}
                                            className="text-[10px] text-blue-600 hover:underline"
                                        >
                                            Hitung Ulang
                                        </button>
                                    </div>
                                    <Input
                                        type="text"
                                        inputMode="decimal"
                                        placeholder="Total biaya sewa"
                                        value={isTotalPriceManual ? totalPriceInput : (rawBaseTotal > 0 ? String(rawBaseTotal) : "")}
                                        onChange={e => {
                                            setIsTotalPriceManual(true)
                                            setTotalPriceInput(e.target.value)
                                        }}
                                        className="h-8 text-xs bg-white font-mono font-bold text-slate-800"
                                        required
                                    />
                                    <span className="text-[10px] text-slate-500">
                                        {rawBaseTotal > 0 ? formatRp(rawBaseTotal, true) : "Free input nilai sewa"}
                                    </span>
                                </div>
                            </div>

                            {/* Opsi PPN */}
                            <div className="pt-2 border-t border-slate-200">
                                <div className="flex items-center justify-between mb-2">
                                    <Label className="text-xs font-semibold text-slate-800">Opsi Pajak (PPN)</Label>
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-[11px] text-slate-500">Tarif PPN:</span>
                                        <div className="flex items-center gap-1">
                                            <Input
                                                type="number"
                                                step="any"
                                                min="0"
                                                value={ppnRate}
                                                onChange={e => setPpnRate(Number(e.target.value) || 0)}
                                                disabled={ppnMode === "NON_PPN"}
                                                className="h-7 w-14 text-xs font-mono text-center bg-white"
                                            />
                                            <span className="text-xs text-slate-600 font-bold">%</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setPpnMode("NON_PPN")}
                                        className={`px-2 py-1.5 rounded-md text-xs font-medium border text-center transition-all ${
                                            ppnMode === "NON_PPN"
                                                ? "bg-slate-800 text-white border-slate-800 shadow-xs"
                                                : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                                        }`}
                                    >
                                        Non-PPN
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setPpnMode("INCLUDE")}
                                        className={`px-2 py-1.5 rounded-md text-xs font-medium border text-center transition-all ${
                                            ppnMode === "INCLUDE"
                                                ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                                                : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                                        }`}
                                    >
                                        Include PPN (Sudah PPN)
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setPpnMode("EXCLUDE")}
                                        className={`px-2 py-1.5 rounded-md text-xs font-medium border text-center transition-all ${
                                            ppnMode === "EXCLUDE"
                                                ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                                                : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                                        }`}
                                    >
                                        Exclude PPN (+ PPN)
                                    </button>
                                </div>

                                {/* Live Breakdown Preview */}
                                <div className="mt-2.5 p-2 bg-white rounded border border-slate-200 grid grid-cols-3 gap-2 text-center">
                                    <div>
                                        <span className="text-[10px] text-slate-400 block">Dasar Pajak (DPP)</span>
                                        <span className="text-xs font-semibold font-mono text-slate-800">{formatRp(dppAmount, true)}</span>
                                    </div>
                                    <div>
                                        <span className="text-[10px] text-slate-400 block">PPN ({ppnMode === "NON_PPN" ? "0%" : `${ppnRate}%`})</span>
                                        <span className="text-xs font-semibold font-mono text-blue-700">{formatRp(ppnAmount, true)}</span>
                                    </div>
                                    <div>
                                        <span className="text-[10px] text-slate-400 block">Total Tagihan</span>
                                        <span className="text-xs font-extrabold font-mono text-emerald-700">{formatRp(grandTotal, true)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Catatan */}
                        <div className="space-y-1">
                            <Label className="text-xs font-semibold text-slate-700">Catatan / Keterangan</Label>
                            <Textarea
                                placeholder="Catatan instruksi sewa..."
                                value={notes}
                                onChange={e => setNotes(e.target.value)}
                                rows={2}
                                className="text-xs resize-none"
                            />
                        </div>

                        <DialogFooter className="pt-2">
                            <Button type="button" variant="outline" size="sm" onClick={() => setIsInputModalOpen(false)}>
                                Batal
                            </Button>
                            <Button type="submit" size="sm" disabled={isPending} className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5">
                                {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                                Simpan Transaksi Sewa
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* ── MODAL DETAIL TRANSAKSI SEWA ── */}
            <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
                <DialogContent className="sm:max-w-[540px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center justify-between text-base">
                            <span className="flex items-center gap-2">
                                <FileText className="w-5 h-5 text-blue-600" />
                                Detail Transaksi Sewa
                            </span>
                            {selectedTxDetail && getStatusBadge(selectedTxDetail.status)}
                        </DialogTitle>
                    </DialogHeader>

                    {selectedTxDetail && (
                        <div className="space-y-3 py-1 text-xs">
                            <div className="p-2.5 bg-slate-50 rounded border border-slate-200 flex justify-between items-center">
                                <div>
                                    <span className="text-[11px] text-slate-400">No. Surat Jalan:</span>
                                    <p className="font-mono text-xs font-bold text-blue-700">{selectedTxDetail.sewa_number}</p>
                                </div>
                                <div className="text-right">
                                    <span className="text-[11px] text-slate-400">Tanggal:</span>
                                    <p className="font-semibold text-slate-800">
                                        {format(new Date(selectedTxDetail.date), "dd MMMM yyyy", { locale: idLocale })}
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2.5">
                                <div className="p-2.5 border border-slate-200 rounded space-y-1">
                                    <span className="text-[10px] font-bold text-slate-500 uppercase">Penyewa (Customer)</span>
                                    <p className="font-semibold text-slate-900">{selectedTxDetail.customer?.customer_name}</p>
                                    <p className="text-[11px] text-slate-400">{selectedTxDetail.lokasi_proyek || selectedTxDetail.customer?.address}</p>
                                </div>

                                <div className="p-2.5 border border-slate-200 rounded space-y-1">
                                    <span className="text-[10px] font-bold text-slate-500 uppercase">Unit & Operator</span>
                                    <p className="font-semibold text-slate-900">
                                        {selectedTxDetail.vehicle ? `${selectedTxDetail.vehicle.category?.name || "Unit"} ${selectedTxDetail.vehicle.code}` : (selectedTxDetail.equipment?.nama_alat || "-")}
                                    </p>
                                    <p className="text-[11px] text-slate-500">
                                        Operator: {selectedTxDetail.operator?.name}
                                        {(selectedTxDetail.vehicle?.plate_number || selectedTxDetail.equipment?.nomor_seri_plat) && ` • ${selectedTxDetail.vehicle?.plate_number || selectedTxDetail.equipment?.nomor_seri_plat}`}
                                    </p>
                                </div>
                            </div>

                            {/* Jadwal & Perhitungan Hari */}
                            <div className="p-2.5 border border-blue-200 bg-blue-50/50 rounded space-y-1.5">
                                <div className="flex justify-between items-center">
                                    <span className="font-bold text-blue-900">Perhitungan Hari:</span>
                                    <span className="font-extrabold text-xs text-blue-700 bg-white px-2 py-0.5 rounded border border-blue-300">
                                        {selectedTxDetail.total_days} HARI
                                    </span>
                                </div>

                                {selectedTxDetail.date_mode === "RANGE" ? (
                                    <p className="text-slate-700 text-[11px]">
                                        Periode: <strong>{format(new Date(selectedTxDetail.start_date), "dd/MM/yyyy")}</strong> s/d <strong>{format(new Date(selectedTxDetail.end_date), "dd/MM/yyyy")}</strong>
                                    </p>
                                ) : (
                                    <div className="space-y-1">
                                        <p className="text-slate-700 text-[11px]">Tanggal Sewa ({selectedTxDetail.total_days} Hari):</p>
                                        <div className="flex flex-wrap gap-1 mt-1">
                                            {(() => {
                                                try {
                                                    const dates = JSON.parse(selectedTxDetail.rental_dates || "[]")
                                                    return dates.map((d: string) => (
                                                        <span key={d} className="px-1.5 py-0.5 bg-white border border-blue-200 text-blue-800 rounded font-semibold text-[10px]">
                                                            {format(new Date(d), "dd/MM/yyyy")}
                                                        </span>
                                                    ))
                                                } catch {
                                                    return <span>-</span>
                                                }
                                            })()}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Biaya */}
                            <div className="p-3 border border-slate-200 rounded-lg bg-slate-50/70 space-y-2">
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-slate-500">Tarif Satuan / Hari:</span>
                                    <span className="font-semibold text-slate-800">{formatRp(selectedTxDetail.price_per_day, true)}</span>
                                </div>
                                {selectedTxDetail.is_ppn && (
                                    <>
                                        <div className="flex justify-between items-center text-xs border-t border-slate-200 pt-1.5">
                                            <span className="text-slate-500">Dasar Pengenaan Pajak (DPP):</span>
                                            <span className="font-mono text-slate-700">{formatRp(selectedTxDetail.dpp_amount || selectedTxDetail.total_price, true)}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-xs">
                                            <span className="text-slate-500">PPN ({selectedTxDetail.ppn_mode === "INCLUDE" ? "Include" : "Exclude"} {selectedTxDetail.ppn_rate ?? 11}%):</span>
                                            <span className="font-mono text-blue-700 font-semibold">{formatRp(selectedTxDetail.ppn_amount, true)}</span>
                                        </div>
                                    </>
                                )}
                                <div className="flex justify-between items-center text-xs border-t border-slate-200 pt-1.5">
                                    <span className="font-bold text-slate-900">Total Nilai Tagihan Sewa:</span>
                                    <span className="font-extrabold text-sm text-emerald-700 font-mono">{formatRp(selectedTxDetail.total_price, true)}</span>
                                </div>
                            </div>

                            {selectedTxDetail.notes && (
                                <div className="p-2 bg-slate-100 rounded text-slate-600 text-[11px]">
                                    <span className="font-semibold">Catatan:</span> {selectedTxDetail.notes}
                                </div>
                            )}

                            <div className="flex justify-end pt-2">
                                <Link
                                    href={`/print/sewa/${selectedTxDetail.id}`}
                                    target="_blank"
                                    className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs transition-colors"
                                >
                                    <Printer className="w-3.5 h-3.5" /> Cetak Surat Jalan PDF
                                </Link>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}
