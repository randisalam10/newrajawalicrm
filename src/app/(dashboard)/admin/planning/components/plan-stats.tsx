"use client"

import React, { useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { CalendarClock, Clock, PlayCircle, CheckCircle2 } from "lucide-react"
import { isToday } from "date-fns"
import { Plan } from "../types"

interface PlanStatsProps {
    plans: Plan[]
}

export function PlanStats({ plans }: PlanStatsProps) {
    const stats = useMemo(() => {
        const today = plans.filter((p) => isToday(new Date(p.date)))
        return {
            planned: plans.filter((p) => p.status === "Planned").length,
            ongoing: plans.filter((p) => p.status === "OnGoing").length,
            done: plans.filter((p) => p.status === "Done").length,
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
