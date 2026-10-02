"use client"

import React, { useTransition } from "react"
import { Button } from "@/components/ui/button"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Calendar, ChevronRight, Layers, Target, Pencil, Trash2 } from "lucide-react"
import { format, isPast } from "date-fns"
import { id as idLocale } from "date-fns/locale"
import { Plan, PlanStatus } from "../types"
import { STATUS_CONFIG, StatusBadge } from "../constants"

interface PlanCardProps {
    plan: Plan
    onEdit: (p: Plan) => void
    onDelete: (p: Plan) => void
    onStatusChange: (id: string, status: PlanStatus) => void
    canManage?: boolean
}

export function PlanCard({
    plan,
    onEdit,
    onDelete,
    onStatusChange,
    canManage = true,
}: PlanCardProps) {
    const [isPending, startTransition] = useTransition()
    const dateObj = new Date(plan.date)

    return (
        <div
            className={`group relative bg-white border rounded-xl p-4 shadow-sm hover:shadow-md transition-all
            ${isPast(dateObj) && plan.status === 'Planned' ? 'border-amber-200 bg-amber-50/30' : 'border-slate-200'}`}
        >
            <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                        <StatusBadge status={plan.status} />
                        <span className="text-[11px] text-slate-400 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {format(dateObj, "dd MMM yyyy", { locale: idLocale })}
                        </span>
                    </div>
                    <div className="font-semibold text-sm text-slate-800 truncate">
                        {plan.project.customer.customer_name}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-slate-500 mt-0.5">
                        <ChevronRight className="w-3 h-3 text-slate-300" />
                        {plan.project.name}
                    </div>
                    <div className="flex items-center gap-3 mt-2 flex-wrap">
                        <span className="flex items-center gap-1 text-[11px] bg-blue-50 text-blue-700 border border-blue-100 rounded-full px-2 py-0.5">
                            <Layers className="w-3 h-3" />
                            {plan.concreteQuality.name}
                        </span>
                        <span className="flex items-center gap-1 text-[11px] bg-slate-50 text-slate-600 border border-slate-200 rounded-full px-2 py-0.5">
                            {plan.workItem.name}
                        </span>
                        <span className="flex items-center gap-1 text-[11px] bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-full px-2 py-0.5">
                            <Target className="w-3 h-3" />
                            {plan.volume_plan} m³
                        </span>
                    </div>
                    {plan.notes && (
                        <p className="text-[11px] text-slate-400 mt-2 italic border-l-2 border-slate-100 pl-2">
                            {plan.notes}
                        </p>
                    )}
                </div>
                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    {canManage ? (
                        <Select
                            value={plan.status}
                            onValueChange={(v) => startTransition(() => onStatusChange(plan.id, v as PlanStatus))}
                            disabled={isPending}
                        >
                            <SelectTrigger className="h-7 text-[11px] w-[130px] border-slate-200">
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
                    ) : (
                        <StatusBadge status={plan.status} />
                    )}
                    {canManage && (
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-slate-400 hover:text-blue-600"
                                onClick={() => onEdit(plan)}
                            >
                                <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-slate-400 hover:text-red-600"
                                onClick={() => onDelete(plan)}
                            >
                                <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
