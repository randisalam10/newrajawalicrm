"use client"

import React, { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    ChevronLeft,
    ChevronRight,
    Plus,
    Pencil,
    Trash2,
    CalendarClock,
    ChevronRight as ChevronRightIcon,
    Layers,
    Target,
} from "lucide-react"
import {
    format,
    isToday,
    isPast,
    parseISO,
    startOfMonth,
    endOfMonth,
    eachDayOfInterval,
    getDay,
    addMonths,
    subMonths,
    isSameMonth,
} from "date-fns"
import { id as idLocale } from "date-fns/locale"
import { Plan, PlanStatus } from "../types"
import { STATUS_CONFIG, DAYS_ID, StatusBadge } from "../constants"

interface CalendarViewProps {
    plans: Plan[]
    onDayClick: (dateStr: string) => void
    onEditPlan: (p: Plan) => void
    onDeletePlan: (p: Plan) => void
    onStatusChange: (id: string, status: PlanStatus) => void
    canManage?: boolean
}

export function CalendarView({
    plans,
    onDayClick,
    onEditPlan,
    onDeletePlan,
    onStatusChange,
    canManage = true,
}: CalendarViewProps) {
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
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setCurrentMonth((m) => subMonths(m, 1))}>
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
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setCurrentMonth((m) => addMonths(m, 1))}>
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>

                {/* Day headers */}
                <div className="grid grid-cols-7 mb-1">
                    {DAYS_ID.map((d) => (
                        <div key={d} className="text-center text-[10px] font-bold text-slate-400 uppercase py-1">{d}</div>
                    ))}
                </div>

                {/* Calendar cells */}
                <div className="grid grid-cols-7 gap-px bg-slate-100 rounded-xl overflow-hidden border border-slate-200">
                    {/* Empty leading cells */}
                    {Array.from({ length: startPad }).map((_, i) => (
                        <div key={`pad-${i}`} className="bg-slate-50/80 min-h-[80px] p-1" />
                    ))}

                    {days.map((day) => {
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
                                    {dayPlans.slice(0, 3).map((p) => (
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
                        {selectedDay && canManage && (
                            <Button size="sm" className="h-8 gap-1 text-xs" onClick={() => onDayClick(selectedDay)}>
                                <Plus className="h-3.5 w-3.5" /> Tambah
                            </Button>
                        )}
                    </div>

                    {selectedPlans.length === 0 ? (
                        <div className="border border-dashed rounded-xl h-40 flex flex-col items-center justify-center text-slate-400 gap-2">
                            <CalendarClock className="w-8 h-8 opacity-20" />
                            <p className="text-xs">Klik tanggal lain atau</p>
                            {selectedDay && canManage && (
                                <Button variant="outline" size="sm" className="text-xs h-7 gap-1"
                                    onClick={() => onDayClick(selectedDay)}>
                                    <Plus className="w-3 h-3" /> Tambah Planning
                                </Button>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
                            {selectedPlans.map((plan) => (
                                <div key={plan.id} className="group border rounded-xl p-3 bg-white shadow-sm hover:shadow-md transition-all">
                                    <div className="flex items-start justify-between gap-2 mb-2">
                                        <StatusBadge status={plan.status} />
                                        {canManage && (
                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-6 w-6 text-slate-400 hover:text-blue-600"
                                                    onClick={() => onEditPlan(plan)}
                                                >
                                                    <Pencil className="h-3 w-3" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-6 w-6 text-slate-400 hover:text-red-600"
                                                    onClick={() => onDeletePlan(plan)}
                                                >
                                                    <Trash2 className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                    <div className="font-semibold text-xs text-slate-800">{plan.project.customer.customer_name}</div>
                                    <div className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                                        <ChevronRightIcon className="w-3 h-3 text-slate-300" />{plan.project.name}
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
                                    {canManage && (
                                        <div className="mt-2 pt-2 border-t border-slate-50">
                                            <Select
                                                value={plan.status}
                                                onValueChange={(v) => onStatusChange(plan.id, v as PlanStatus)}
                                            >
                                                <SelectTrigger className="h-6 text-[10px] w-full border-slate-200">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {(Object.keys(STATUS_CONFIG) as PlanStatus[]).map((s) => (
                                                        <SelectItem key={s} value={s} className="text-xs">
                                                            {STATUS_CONFIG[s].label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
