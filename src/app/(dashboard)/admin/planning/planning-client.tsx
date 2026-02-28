"use client"

import { useState, useTransition, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast"
import { createPlan, updatePlan, deletePlan } from "./actions"
import {
    CalendarClock, Plus, Pencil, Trash2, CheckCircle2,
    Clock, XCircle, PlayCircle, Filter, Calendar, Target,
    Layers, ChevronRight, ChevronLeft, LayoutList, LayoutGrid
} from "lucide-react"
import {
    format, isToday, isTomorrow, isPast, parseISO,
    startOfMonth, endOfMonth, eachDayOfInterval,
    getDay, addMonths, subMonths, isSameDay, isSameMonth
} from "date-fns"
import { id as idLocale } from "date-fns/locale"

// ─── Types ───────────────────────────────────────────────────────────────────

type PlanStatus = 'Planned' | 'OnGoing' | 'Done' | 'Cancelled'

type Plan = {
    id: string
    date: Date | string
    projectId: string
    qualityId: string
    workItemId: string
    volume_plan: number
    notes: string | null
    status: PlanStatus
    locationId: string
    project: {
        name: string
        customer: { customer_name: string }
    }
    concreteQuality: { id: string; name: string }
    workItem: { id: string; name: string }
    location: { id: string; name: string }
}

type Masters = {
    projects: Array<{ id: string; name: string; customer: { customer_name: string } }>
    qualities: Array<{ id: string; name: string }>
    workItems: Array<{ id: string; name: string }>
} | null

type ViewMode = 'calendar' | 'list'

// ─── Status Config ───────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<PlanStatus, {
    label: string
    icon: React.ReactNode
    badge: string
    dot: string
}> = {
    Planned: {
        label: "Direncanakan",
        icon: <Clock className="w-3 h-3" />,
        badge: "bg-blue-50 text-blue-700 border-blue-200",
        dot: "bg-blue-500",
    },
    OnGoing: {
        label: "Sedang Berjalan",
        icon: <PlayCircle className="w-3 h-3" />,
        badge: "bg-amber-50 text-amber-700 border-amber-200",
        dot: "bg-amber-500",
    },
    Done: {
        label: "Selesai",
        icon: <CheckCircle2 className="w-3 h-3" />,
        badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
        dot: "bg-emerald-500",
    },
    Cancelled: {
        label: "Dibatalkan",
        icon: <XCircle className="w-3 h-3" />,
        badge: "bg-slate-100 text-slate-500 border-slate-200",
        dot: "bg-slate-300",
    },
}

const DAYS_ID = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"]

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDateLabel(date: Date | string) {
    const d = typeof date === 'string' ? parseISO(date) : date
    if (isToday(d)) return `Hari ini · ${format(d, "dd MMM yyyy", { locale: idLocale })}`
    if (isTomorrow(d)) return `Besok · ${format(d, "dd MMM yyyy", { locale: idLocale })}`
    return format(d, "EEEE, dd MMMM yyyy", { locale: idLocale })
}

function StatusBadge({ status }: { status: PlanStatus }) {
    const cfg = STATUS_CONFIG[status]
    return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[11px] font-medium ${cfg.badge}`}>
            {cfg.icon}
            {cfg.label}
        </span>
    )
}

// ─── Summary Stats ────────────────────────────────────────────────────────────

function PlanStats({ plans }: { plans: Plan[] }) {
    const stats = useMemo(() => {
        const today = plans.filter(p => isToday(new Date(p.date)))
        return {
            planned: plans.filter(p => p.status === 'Planned').length,
            ongoing: plans.filter(p => p.status === 'OnGoing').length,
            done: plans.filter(p => p.status === 'Done').length,
            todayVol: today.reduce((s, p) => s + p.volume_plan, 0),
            todayCount: today.length,
        }
    }, [plans])

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card className="border shadow-sm">
                <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-1">
                        <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Hari Ini</p>
                        <CalendarClock className="h-4 w-4 text-blue-400" />
                    </div>
                    <div className="text-2xl font-bold text-slate-800">{stats.todayCount}</div>
                    <p className="text-[11px] text-slate-400 mt-0.5">{stats.todayVol.toFixed(1)} m³ target</p>
                </CardContent>
            </Card>
            <Card className="border shadow-sm">
                <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-1">
                        <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Direncanakan</p>
                        <Clock className="h-4 w-4 text-blue-400" />
                    </div>
                    <div className="text-2xl font-bold text-blue-600">{stats.planned}</div>
                    <p className="text-[11px] text-slate-400 mt-0.5">Menunggu eksekusi</p>
                </CardContent>
            </Card>
            <Card className="border shadow-sm">
                <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-1">
                        <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Berjalan</p>
                        <PlayCircle className="h-4 w-4 text-amber-400" />
                    </div>
                    <div className="text-2xl font-bold text-amber-600">{stats.ongoing}</div>
                    <p className="text-[11px] text-slate-400 mt-0.5">Sedang dikerjakan</p>
                </CardContent>
            </Card>
            <Card className="border shadow-sm">
                <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-1">
                        <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Selesai</p>
                        <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    </div>
                    <div className="text-2xl font-bold text-emerald-600">{stats.done}</div>
                    <p className="text-[11px] text-slate-400 mt-0.5">Total selesai</p>
                </CardContent>
            </Card>
        </div>
    )
}

// ─── Plan Form Dialog ─────────────────────────────────────────────────────────

function PlanFormDialog({
    open,
    onClose,
    masters,
    editData,
    defaultDate,
}: {
    open: boolean
    onClose: () => void
    masters: Masters
    editData?: Plan | null
    defaultDate?: string
}) {
    const { toast } = useToast()
    const [isPending, startTransition] = useTransition()

    const [form, setForm] = useState({
        date: editData?.date
            ? format(new Date(editData.date), "yyyy-MM-dd")
            : (defaultDate || format(new Date(), "yyyy-MM-dd")),
        projectId: editData?.projectId || "",
        qualityId: editData?.qualityId || "",
        workItemId: editData?.workItemId || "",
        volume_plan: editData?.volume_plan?.toString() || "",
        notes: editData?.notes || "",
    })

    const isEdit = !!editData

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (!form.projectId || !form.qualityId || !form.workItemId || !form.date || !form.volume_plan) {
            toast({ title: "Lengkapi semua field wajib", variant: "destructive" })
            return
        }
        startTransition(async () => {
            try {
                const payload = {
                    date: form.date,
                    projectId: form.projectId,
                    qualityId: form.qualityId,
                    workItemId: form.workItemId,
                    volume_plan: parseFloat(form.volume_plan),
                    notes: form.notes,
                }
                if (isEdit && editData) {
                    await updatePlan(editData.id, payload)
                    toast({ title: "Planning berhasil diperbarui" })
                } else {
                    await createPlan(payload)
                    toast({ title: "Planning berhasil dibuat" })
                }
                onClose()
            } catch (err: any) {
                toast({ title: "Terjadi kesalahan", description: err?.message, variant: "destructive" })
            }
        })
    }

    return (
        <Dialog open={open} onOpenChange={o => { if (!o) onClose() }}>
            <DialogContent className="sm:max-w-[520px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <CalendarClock className="h-5 w-5 text-primary" />
                        {isEdit ? "Edit Planning" : "Tambah Planning Pengecoran"}
                    </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 mt-2">
                    <div className="space-y-1.5">
                        <Label htmlFor="plan-date">Tanggal Rencana <span className="text-red-500">*</span></Label>
                        <Input id="plan-date" type="date" value={form.date}
                            onChange={e => setForm(f => ({ ...f, date: e.target.value }))} required />
                    </div>

                    <div className="space-y-1.5">
                        <Label>Proyek <span className="text-red-500">*</span></Label>
                        <Select value={form.projectId} onValueChange={v => setForm(f => ({ ...f, projectId: v }))}>
                            <SelectTrigger id="plan-project">
                                <SelectValue placeholder="Pilih proyek..." />
                            </SelectTrigger>
                            <SelectContent>
                                {masters?.projects.map(p => (
                                    <SelectItem key={p.id} value={p.id}>
                                        <span className="font-medium">{p.name}</span>
                                        <span className="text-slate-400 ml-1.5 text-xs">— {p.customer.customer_name}</span>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <Label>Mutu Beton <span className="text-red-500">*</span></Label>
                            <Select value={form.qualityId} onValueChange={v => setForm(f => ({ ...f, qualityId: v }))}>
                                <SelectTrigger id="plan-quality"><SelectValue placeholder="Pilih mutu..." /></SelectTrigger>
                                <SelectContent>
                                    {masters?.qualities.map(q => (
                                        <SelectItem key={q.id} value={q.id}>{q.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <Label>Item Pekerjaan <span className="text-red-500">*</span></Label>
                            <Select value={form.workItemId} onValueChange={v => setForm(f => ({ ...f, workItemId: v }))}>
                                <SelectTrigger id="plan-workitem"><SelectValue placeholder="Pilih item..." /></SelectTrigger>
                                <SelectContent>
                                    {masters?.workItems.map(w => (
                                        <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="plan-volume">Volume Rencana (m³) <span className="text-red-500">*</span></Label>
                        <Input id="plan-volume" type="number" step="0.5" min="0" placeholder="Contoh: 24.5"
                            value={form.volume_plan}
                            onChange={e => setForm(f => ({ ...f, volume_plan: e.target.value }))} required />
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="plan-notes">Catatan (opsional)</Label>
                        <Textarea id="plan-notes" rows={2} placeholder="Informasi tambahan..."
                            value={form.notes}
                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setForm(f => ({ ...f, notes: e.target.value }))} />
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>Batal</Button>
                        <Button type="submit" disabled={isPending}>
                            {isPending ? "Menyimpan..." : isEdit ? "Simpan Perubahan" : "Tambah Planning"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

// ─── Plan Card (list view) ────────────────────────────────────────────────────

function PlanCard({
    plan, onEdit, onDelete, onStatusChange,
}: {
    plan: Plan
    onEdit: (p: Plan) => void
    onDelete: (p: Plan) => void
    onStatusChange: (id: string, status: PlanStatus) => void
}) {
    const [isPending, startTransition] = useTransition()
    const dateObj = new Date(plan.date)

    return (
        <div className={`group relative bg-white border rounded-xl p-4 shadow-sm hover:shadow-md transition-all
            ${isPast(dateObj) && plan.status === 'Planned' ? 'border-amber-200 bg-amber-50/30' : 'border-slate-200'}`}>
            <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                        <StatusBadge status={plan.status} />
                        <span className="text-[11px] text-slate-400 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {format(dateObj, "dd MMM yyyy", { locale: idLocale })}
                        </span>
                    </div>
                    <div className="font-semibold text-sm text-slate-800 truncate">{plan.project.customer.customer_name}</div>
                    <div className="flex items-center gap-1 text-xs text-slate-500 mt-0.5">
                        <ChevronRight className="w-3 h-3 text-slate-300" />
                        {plan.project.name}
                    </div>
                    <div className="flex items-center gap-3 mt-2 flex-wrap">
                        <span className="flex items-center gap-1 text-[11px] bg-blue-50 text-blue-700 border border-blue-100 rounded-full px-2 py-0.5">
                            <Layers className="w-3 h-3" />{plan.concreteQuality.name}
                        </span>
                        <span className="flex items-center gap-1 text-[11px] bg-slate-50 text-slate-600 border border-slate-200 rounded-full px-2 py-0.5">
                            {plan.workItem.name}
                        </span>
                        <span className="flex items-center gap-1 text-[11px] bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-full px-2 py-0.5">
                            <Target className="w-3 h-3" />{plan.volume_plan} m³
                        </span>
                    </div>
                    {plan.notes && (
                        <p className="text-[11px] text-slate-400 mt-2 italic border-l-2 border-slate-100 pl-2">{plan.notes}</p>
                    )}
                </div>
                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    <Select value={plan.status} onValueChange={v => startTransition(() => onStatusChange(plan.id, v as PlanStatus))} disabled={isPending}>
                        <SelectTrigger className="h-7 text-[11px] w-[130px] border-slate-200"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            {(Object.keys(STATUS_CONFIG) as PlanStatus[]).map(s => (
                                <SelectItem key={s} value={s} className="text-xs">{STATUS_CONFIG[s].label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-blue-600" onClick={() => onEdit(plan)}>
                            <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-red-600" onClick={() => onDelete(plan)}>
                            <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}

// ─── Calendar View ────────────────────────────────────────────────────────────

function CalendarView({
    plans,
    onDayClick,
    onEditPlan,
    onDeletePlan,
    onStatusChange,
}: {
    plans: Plan[]
    onDayClick: (dateStr: string) => void
    onEditPlan: (p: Plan) => void
    onDeletePlan: (p: Plan) => void
    onStatusChange: (id: string, status: PlanStatus) => void
}) {
    const [currentMonth, setCurrentMonth] = useState(new Date())
    const [selectedDay, setSelectedDay] = useState<string | null>(
        format(new Date(), "yyyy-MM-dd")
    )

    const monthStart = startOfMonth(currentMonth)
    const monthEnd = endOfMonth(currentMonth)
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd })

    // Pad start: Sunday=0
    const startPad = getDay(monthStart)

    // Plans keyed by date
    const plansByDate = useMemo(() => {
        const map = new Map<string, Plan[]>()
        for (const p of plans) {
            const key = format(new Date(p.date), "yyyy-MM-dd")
            if (!map.has(key)) map.set(key, [])
            map.get(key)!.push(p)
        }
        return map
    }, [plans])

    const selectedPlans = selectedDay ? (plansByDate.get(selectedDay) || []) : []
    const totalVolThisMonth = useMemo(() => {
        return [...plansByDate.entries()]
            .filter(([k]) => {
                const d = parseISO(k)
                return isSameMonth(d, currentMonth)
            })
            .reduce((s, [, ps]) => s + ps.reduce((ss, p) => ss + p.volume_plan, 0), 0)
    }, [plansByDate, currentMonth])

    function handleDayClick(dateStr: string) {
        setSelectedDay(dateStr)
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* ── Calendar grid ── */}
            <div className="lg:col-span-2">
                {/* Month nav */}
                <div className="flex items-center justify-between mb-4 px-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setCurrentMonth(m => subMonths(m, 1))}>
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <div className="text-center">
                        <div className="font-bold text-slate-800 capitalize">
                            {format(currentMonth, "MMMM yyyy", { locale: idLocale })}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                            {totalVolThisMonth.toFixed(1)} m³ target bulan ini
                        </div>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setCurrentMonth(m => addMonths(m, 1))}>
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>

                {/* Day headers */}
                <div className="grid grid-cols-7 mb-1">
                    {DAYS_ID.map(d => (
                        <div key={d} className="text-center text-[10px] font-bold text-slate-400 uppercase py-1">{d}</div>
                    ))}
                </div>

                {/* Calendar cells */}
                <div className="grid grid-cols-7 gap-px bg-slate-100 rounded-xl overflow-hidden border border-slate-200">
                    {/* Empty leading cells */}
                    {Array.from({ length: startPad }).map((_, i) => (
                        <div key={`pad-${i}`} className="bg-slate-50/80 min-h-[80px] p-1" />
                    ))}

                    {days.map(day => {
                        const dateStr = format(day, "yyyy-MM-dd")
                        const dayPlans = plansByDate.get(dateStr) || []
                        const isSelected = selectedDay === dateStr
                        const todayDay = isToday(day)
                        const isPastDay = isPast(day) && !todayDay

                        return (
                            <div
                                key={dateStr}
                                onClick={() => handleDayClick(dateStr)}
                                className={`min-h-[80px] p-1.5 cursor-pointer transition-all relative
                                    ${isSelected ? 'bg-primary/5 ring-2 ring-inset ring-primary/30' : 'bg-white hover:bg-slate-50'}
                                    ${isPastDay && dayPlans.length === 0 ? 'opacity-60' : ''}
                                `}
                            >
                                {/* Day number */}
                                <div className={`text-[11px] font-bold w-5 h-5 flex items-center justify-center rounded-full mb-1
                                    ${todayDay ? 'bg-primary text-white' : isSelected ? 'text-primary' : 'text-slate-600'}
                                `}>
                                    {format(day, "d")}
                                </div>

                                {/* Plan dots/pills */}
                                <div className="space-y-0.5">
                                    {dayPlans.slice(0, 3).map(p => (
                                        <div
                                            key={p.id}
                                            className={`text-[9px] font-medium rounded px-1 py-0.5 truncate leading-tight
                                                ${STATUS_CONFIG[p.status].dot === 'bg-blue-500' ? 'bg-blue-100 text-blue-700' :
                                                    STATUS_CONFIG[p.status].dot === 'bg-amber-500' ? 'bg-amber-100 text-amber-700' :
                                                        STATUS_CONFIG[p.status].dot === 'bg-emerald-500' ? 'bg-emerald-100 text-emerald-700' :
                                                            'bg-slate-100 text-slate-500'}`}
                                        >
                                            {p.project.customer.customer_name}
                                        </div>
                                    ))}
                                    {dayPlans.length > 3 && (
                                        <div className="text-[9px] text-slate-400 font-medium pl-1">+{dayPlans.length - 3} lagi</div>
                                    )}
                                </div>

                                {/* Volume badge for days with plans */}
                                {dayPlans.length > 0 && (
                                    <div className="absolute bottom-1 right-1 text-[9px] font-bold text-emerald-600 opacity-70">
                                        {dayPlans.reduce((s, p) => s + p.volume_plan, 0).toFixed(0)}m³
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>

                {/* Legend */}
                <div className="flex items-center gap-4 mt-3 px-1 flex-wrap">
                    {(Object.entries(STATUS_CONFIG) as [PlanStatus, typeof STATUS_CONFIG[PlanStatus]][]).map(([k, v]) => (
                        <div key={k} className="flex items-center gap-1.5 text-[10px] text-slate-500">
                            <div className={`w-2 h-2 rounded-sm ${v.dot}`} />
                            {v.label}
                        </div>
                    ))}
                </div>
            </div>

            {/* ── Day detail panel ── */}
            <div className="lg:col-span-1">
                <div className="sticky top-0">
                    {/* Selected day header */}
                    <div className="flex items-center justify-between mb-3">
                        <div>
                            <div className="font-semibold text-sm text-slate-800 capitalize">
                                {selectedDay
                                    ? format(parseISO(selectedDay), "EEEE, dd MMMM yyyy", { locale: idLocale })
                                    : "Pilih tanggal"}
                            </div>
                            <div className="text-[11px] text-slate-400">
                                {selectedPlans.length > 0
                                    ? `${selectedPlans.length} rencana · ${selectedPlans.reduce((s, p) => s + p.volume_plan, 0).toFixed(1)} m³`
                                    : "Belum ada planning"}
                            </div>
                        </div>
                        {selectedDay && (
                            <Button size="sm" className="h-8 gap-1 text-xs" onClick={() => onDayClick(selectedDay)}>
                                <Plus className="h-3.5 w-3.5" /> Tambah
                            </Button>
                        )}
                    </div>

                    {selectedPlans.length === 0 ? (
                        <div className="border border-dashed rounded-xl h-40 flex flex-col items-center justify-center text-slate-400 gap-2">
                            <CalendarClock className="w-8 h-8 opacity-20" />
                            <p className="text-xs">Klik tanggal lain atau</p>
                            {selectedDay && (
                                <Button variant="outline" size="sm" className="text-xs h-7 gap-1"
                                    onClick={() => onDayClick(selectedDay)}>
                                    <Plus className="w-3 h-3" /> Tambah Planning
                                </Button>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
                            {selectedPlans.map(plan => (
                                <div key={plan.id} className="group border rounded-xl p-3 bg-white shadow-sm hover:shadow-md transition-all">
                                    <div className="flex items-start justify-between gap-2 mb-2">
                                        <StatusBadge status={plan.status} />
                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                                            <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-400 hover:text-blue-600"
                                                onClick={() => onEditPlan(plan)}>
                                                <Pencil className="h-3 w-3" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-400 hover:text-red-600"
                                                onClick={() => onDeletePlan(plan)}>
                                                <Trash2 className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    </div>
                                    <div className="font-semibold text-xs text-slate-800">{plan.project.customer.customer_name}</div>
                                    <div className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                                        <ChevronRight className="w-3 h-3 text-slate-300" />{plan.project.name}
                                    </div>
                                    <div className="flex flex-wrap gap-1.5 mt-2">
                                        <span className="text-[10px] bg-blue-50 text-blue-700 border border-blue-100 rounded-full px-1.5 py-0.5 flex items-center gap-1">
                                            <Layers className="w-2.5 h-2.5" />{plan.concreteQuality.name}
                                        </span>
                                        <span className="text-[10px] bg-slate-50 text-slate-600 border border-slate-200 rounded-full px-1.5 py-0.5">
                                            {plan.workItem.name}
                                        </span>
                                        <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-full px-1.5 py-0.5 flex items-center gap-1 font-bold">
                                            <Target className="w-2.5 h-2.5" />{plan.volume_plan} m³
                                        </span>
                                    </div>
                                    {plan.notes && <p className="text-[10px] text-slate-400 mt-1.5 italic">{plan.notes}</p>}

                                    {/* Quick status change */}
                                    <div className="mt-2 pt-2 border-t border-slate-50">
                                        <Select value={plan.status}
                                            onValueChange={v => onStatusChange(plan.id, v as PlanStatus)}>
                                            <SelectTrigger className="h-6 text-[10px] w-full border-slate-200">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {(Object.keys(STATUS_CONFIG) as PlanStatus[]).map(s => (
                                                    <SelectItem key={s} value={s} className="text-xs">
                                                        {STATUS_CONFIG[s].label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

// ─── Main Client Component ────────────────────────────────────────────────────

export function PlanningClient({
    plans: initialPlans,
    masters,
}: {
    plans: Plan[]
    masters: Masters
}) {
    const { toast } = useToast()
    const [plans] = useState<Plan[]>(initialPlans)
    const [, startTransition] = useTransition()

    // View mode
    const [viewMode, setViewMode] = useState<ViewMode>('calendar')

    // Dialogs
    const [showForm, setShowForm] = useState(false)
    const [editTarget, setEditTarget] = useState<Plan | null>(null)
    const [deleteTarget, setDeleteTarget] = useState<Plan | null>(null)
    const [isDeleting, setIsDeleting] = useState(false)
    const [defaultFormDate, setDefaultFormDate] = useState<string>("")

    // List filters
    const [filterStatus, setFilterStatus] = useState<PlanStatus | "All">("All")
    const [filterDateFrom, setFilterDateFrom] = useState("")
    const [filterDateTo, setFilterDateTo] = useState("")
    const [searchText, setSearchText] = useState("")

    // Filtered plans (for list view)
    const filtered = useMemo(() => {
        return plans.filter(p => {
            if (filterStatus !== "All" && p.status !== filterStatus) return false
            if (filterDateFrom && new Date(p.date) < new Date(filterDateFrom)) return false
            if (filterDateTo && new Date(p.date) > new Date(filterDateTo + "T23:59:59")) return false
            if (searchText) {
                const q = searchText.toLowerCase()
                if (
                    !p.project.name.toLowerCase().includes(q) &&
                    !p.project.customer.customer_name.toLowerCase().includes(q) &&
                    !p.concreteQuality.name.toLowerCase().includes(q) &&
                    !p.workItem.name.toLowerCase().includes(q)
                ) return false
            }
            return true
        })
    }, [plans, filterStatus, filterDateFrom, filterDateTo, searchText])

    const grouped = useMemo(() => {
        const map = new Map<string, Plan[]>()
        for (const p of filtered) {
            const key = format(new Date(p.date), "yyyy-MM-dd")
            if (!map.has(key)) map.set(key, [])
            map.get(key)!.push(p)
        }
        return [...map.entries()].sort((a, b) => b[0].localeCompare(a[0]))
    }, [filtered])

    function openEdit(plan: Plan) {
        setEditTarget(plan)
        setDefaultFormDate("")
        setShowForm(true)
    }

    function closeForm() {
        setShowForm(false)
        setEditTarget(null)
        setDefaultFormDate("")
    }

    function handleAddForDay(dateStr: string) {
        setEditTarget(null)
        setDefaultFormDate(dateStr)
        setShowForm(true)
    }

    function handleStatusChange(id: string, status: PlanStatus) {
        startTransition(async () => {
            try {
                await updatePlan(id, { status })
                toast({ title: `Status → ${STATUS_CONFIG[status].label}` })
            } catch {
                toast({ title: "Gagal memperbarui status", variant: "destructive" })
            }
        })
    }

    async function handleDelete() {
        if (!deleteTarget) return
        setIsDeleting(true)
        try {
            await deletePlan(deleteTarget.id)
            toast({ title: "Planning berhasil dihapus" })
        } catch {
            toast({ title: "Gagal menghapus planning", variant: "destructive" })
        } finally {
            setIsDeleting(false)
            setDeleteTarget(null)
        }
    }

    return (
        <div className="space-y-5">
            {/* Stats */}
            <PlanStats plans={plans} />

            {/* Main card */}
            <Card className="border shadow-sm">
                <CardHeader className="pb-3 px-5 pt-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                            <CardTitle className="text-sm font-semibold">
                                {viewMode === 'calendar' ? 'Kalender Planning' : 'Daftar Planning'}
                            </CardTitle>
                            <CardDescription className="text-[11px]">
                                {viewMode === 'calendar'
                                    ? 'Klik tanggal untuk melihat atau menambah planning'
                                    : `${filtered.length} rencana ditemukan`}
                            </CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                            {/* View toggle */}
                            <div className="flex items-center border rounded-lg p-0.5 bg-slate-50 gap-0.5">
                                <Button
                                    variant={viewMode === 'calendar' ? 'default' : 'ghost'}
                                    size="sm"
                                    className="h-7 px-2.5 gap-1.5 text-xs"
                                    onClick={() => setViewMode('calendar')}
                                >
                                    <LayoutGrid className="w-3.5 h-3.5" /> Kalender
                                </Button>
                                <Button
                                    variant={viewMode === 'list' ? 'default' : 'ghost'}
                                    size="sm"
                                    className="h-7 px-2.5 gap-1.5 text-xs"
                                    onClick={() => setViewMode('list')}
                                >
                                    <LayoutList className="w-3.5 h-3.5" /> List
                                </Button>
                            </div>
                            <Button
                                onClick={() => { setEditTarget(null); setDefaultFormDate(""); setShowForm(true) }}
                                className="gap-1.5 h-9 text-sm"
                            >
                                <Plus className="h-4 w-4" />
                                Tambah
                            </Button>
                        </div>
                    </div>
                </CardHeader>

                {/* List-mode filters */}
                {viewMode === 'list' && (
                    <div className="px-5 pb-4 border-t pt-3 flex flex-wrap gap-3 items-center">
                        <Filter className="w-4 h-4 text-slate-400 flex-shrink-0" />
                        <Input
                            id="plan-search"
                            placeholder="Cari proyek, customer, mutu..."
                            className="h-8 text-sm w-48"
                            value={searchText}
                            onChange={e => setSearchText(e.target.value)}
                        />
                        <Select value={filterStatus} onValueChange={v => setFilterStatus(v as any)}>
                            <SelectTrigger className="h-8 text-sm w-36" id="plan-filter-status">
                                <SelectValue placeholder="Semua Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="All">Semua Status</SelectItem>
                                {(Object.keys(STATUS_CONFIG) as PlanStatus[]).map(s => (
                                    <SelectItem key={s} value={s}>{STATUS_CONFIG[s].label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <div className="flex items-center gap-1.5">
                            <Input id="plan-filter-from" type="date" className="h-8 text-sm w-36"
                                value={filterDateFrom} onChange={e => setFilterDateFrom(e.target.value)} />
                            <span className="text-slate-400 text-xs">s/d</span>
                            <Input id="plan-filter-to" type="date" className="h-8 text-sm w-36"
                                value={filterDateTo} onChange={e => setFilterDateTo(e.target.value)} />
                        </div>
                        {(filterStatus !== "All" || filterDateFrom || filterDateTo || searchText) && (
                            <Button variant="ghost" size="sm" className="h-8 text-xs text-slate-500"
                                onClick={() => { setFilterStatus("All"); setFilterDateFrom(""); setFilterDateTo(""); setSearchText("") }}>
                                Reset
                            </Button>
                        )}
                    </div>
                )}

                <CardContent className={`px-5 pb-5 ${viewMode === 'list' ? 'pt-0' : 'pt-2'}`}>
                    {/* ── CALENDAR VIEW ── */}
                    {viewMode === 'calendar' && (
                        <CalendarView
                            plans={plans}
                            onDayClick={handleAddForDay}
                            onEditPlan={openEdit}
                            onDeletePlan={setDeleteTarget}
                            onStatusChange={handleStatusChange}
                        />
                    )}

                    {/* ── LIST VIEW ── */}
                    {viewMode === 'list' && (
                        grouped.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-40 text-slate-400 gap-2">
                                <CalendarClock className="w-10 h-10 opacity-30" />
                                <p className="text-sm">Belum ada planning ditemukan</p>
                                <Button variant="outline" size="sm" onClick={() => setShowForm(true)} className="mt-1 gap-1">
                                    <Plus className="w-3.5 h-3.5" /> Tambah Planning Pertama
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {grouped.map(([dateKey, dayPlans]) => (
                                    <div key={dateKey}>
                                        <div className="flex items-center gap-2 mb-3">
                                            <span className="text-xs font-bold text-slate-700 capitalize">
                                                {formatDateLabel(dateKey)}
                                            </span>
                                            <span className="text-[10px] text-slate-400 bg-slate-100 rounded-full px-2 py-0.5">
                                                {dayPlans.length} plan · {dayPlans.reduce((s, p) => s + p.volume_plan, 0).toFixed(1)} m³
                                            </span>
                                            <div className="flex-1 h-px bg-slate-100" />
                                        </div>
                                        <div className="grid gap-2">
                                            {dayPlans.map(plan => (
                                                <PlanCard
                                                    key={plan.id}
                                                    plan={plan}
                                                    onEdit={openEdit}
                                                    onDelete={setDeleteTarget}
                                                    onStatusChange={handleStatusChange}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )
                    )}
                </CardContent>
            </Card>

            {/* Form Dialog */}
            {showForm && (
                <PlanFormDialog
                    open={showForm}
                    onClose={closeForm}
                    masters={masters}
                    editData={editTarget}
                    defaultDate={defaultFormDate}
                />
            )}

            {/* Delete Confirm */}
            <AlertDialog open={!!deleteTarget} onOpenChange={o => { if (!o) setDeleteTarget(null) }}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Hapus Planning?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Rencana pengecoran untuk <strong>{deleteTarget?.project?.name}</strong> tanggal{" "}
                            <strong>{deleteTarget ? format(new Date(deleteTarget.date), "dd MMM yyyy", { locale: idLocale }) : ""}</strong> akan dihapus.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>Batal</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} disabled={isDeleting}
                            className="bg-red-600 hover:bg-red-700">
                            {isDeleting ? "Menghapus..." : "Ya, Hapus"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
