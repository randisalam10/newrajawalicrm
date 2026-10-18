"use client"

import { useMemo, useTransition } from "react"
import { OperatorWorkLogItem } from "../../types"
import { markOperatorWorkLogsPaid } from "../../actions"
import { formatNumber, formatRupiah } from "../../utils/crusher-helpers"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { toast } from "sonner"
import { CheckCircle2, Clock, Users, Banknote, HardHat, Loader2 } from "lucide-react"

type Props = {
    logs: OperatorWorkLogItem[]
    onRefresh: () => void
}

type EmployeeSummary = {
    employeeId: string
    employeeName: string
    roleType: string
    totalDays: number
    totalNormalHours: number
    totalOvertimeHours: number
    totalHours: number
    totalWage: number
    unpaidWage: number
    paidWage: number
    unpaidLogIds: string[]
}

export function OperatorRekapTab({ logs, onRefresh }: Props) {
    const [isPending, startTransition] = useTransition()

    // Aggregate KPI totals
    const kpi = useMemo(() => {
        let totalHours = 0
        let totalNormal = 0
        let totalOvertime = 0
        let totalWage = 0
        let unpaidWage = 0
        let paidWage = 0

        logs.forEach((l) => {
            totalHours += l.total_hours
            totalNormal += l.work_hours_normal
            totalOvertime += l.work_hours_overtime
            totalWage += l.total_fee
            if (l.is_paid) {
                paidWage += l.total_fee
            } else {
                unpaidWage += l.total_fee
            }
        })

        return { totalHours, totalNormal, totalOvertime, totalWage, unpaidWage, paidWage }
    }, [logs])

    // Group logs per employee
    const employeeSummaries = useMemo(() => {
        const map = new Map<string, EmployeeSummary>()

        logs.forEach((log) => {
            const key = log.employeeId || log.employee_name
            const existing = map.get(key)
            if (!existing) {
                map.set(key, {
                    employeeId: log.employeeId,
                    employeeName: log.employee_name,
                    roleType: log.role_type,
                    totalDays: 1,
                    totalNormalHours: log.work_hours_normal,
                    totalOvertimeHours: log.work_hours_overtime,
                    totalHours: log.total_hours,
                    totalWage: log.total_fee,
                    unpaidWage: log.is_paid ? 0 : log.total_fee,
                    paidWage: log.is_paid ? log.total_fee : 0,
                    unpaidLogIds: log.is_paid ? [] : [log.id],
                })
            } else {
                existing.totalDays += 1
                existing.totalNormalHours += log.work_hours_normal
                existing.totalOvertimeHours += log.work_hours_overtime
                existing.totalHours += log.total_hours
                existing.totalWage += log.total_fee
                if (log.is_paid) {
                    existing.paidWage += log.total_fee
                } else {
                    existing.unpaidWage += log.total_fee
                    existing.unpaidLogIds.push(log.id)
                }
            }
        })

        return Array.from(map.values()).sort((a, b) => b.totalWage - a.totalWage)
    }, [logs])

    const handleBatchPay = (employeeName: string, logIds: string[]) => {
        if (logIds.length === 0) return
        if (!confirm(`Lunaskan seluruh ${logIds.length} catatan upah tertunda untuk ${employeeName}?`)) return

        startTransition(async () => {
            try {
                await markOperatorWorkLogsPaid(logIds)
                toast.success(`Upah ${employeeName} berhasil dilunasi`)
                onRefresh()
            } catch (err: any) {
                toast.error(err.message || "Gagal melunasi upah")
            }
        })
    }

    return (
        <div className="space-y-4 w-full">
            {/* KPI Stat Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xs">
                    <CardContent className="p-3.5 space-y-1">
                        <div className="flex items-center justify-between text-slate-500 text-xs">
                            <span>Total Jam Kerja</span>
                            <Clock className="h-4 w-4 text-blue-600" />
                        </div>
                        <div className="text-xl font-bold text-slate-900 dark:text-slate-100">
                            {formatNumber(kpi.totalHours, 1)} <span className="text-xs font-normal text-slate-500">jam</span>
                        </div>
                        <div className="text-[11px] text-slate-500">
                            Normal: {formatNumber(kpi.totalNormal, 1)}j • Lembur: {formatNumber(kpi.totalOvertime, 1)}j
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xs">
                    <CardContent className="p-3.5 space-y-1">
                        <div className="flex items-center justify-between text-slate-500 text-xs">
                            <span>Total Upah Terhitung</span>
                            <Banknote className="h-4 w-4 text-emerald-600" />
                        </div>
                        <div className="text-xl font-bold text-slate-900 dark:text-slate-100">
                            {formatRupiah(kpi.totalWage)}
                        </div>
                        <div className="text-[11px] text-slate-500">
                            Dari {employeeSummaries.length} karyawan/operator
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-white dark:bg-slate-900 border-amber-200 dark:border-amber-900/50 shadow-xs">
                    <CardContent className="p-3.5 space-y-1">
                        <div className="flex items-center justify-between text-amber-700 dark:text-amber-400 text-xs font-semibold">
                            <span>Upah Belum Lunas</span>
                            <Clock className="h-4 w-4 text-amber-600" />
                        </div>
                        <div className="text-xl font-bold text-amber-700 dark:text-amber-400">
                            {formatRupiah(kpi.unpaidWage)}
                        </div>
                        <div className="text-[11px] text-slate-500">
                            Perlu proses pembayaran
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-white dark:bg-slate-900 border-emerald-200 dark:border-emerald-900/50 shadow-xs">
                    <CardContent className="p-3.5 space-y-1">
                        <div className="flex items-center justify-between text-emerald-700 dark:text-emerald-400 text-xs font-semibold">
                            <span>Upah Sudah Lunas</span>
                            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        </div>
                        <div className="text-xl font-bold text-emerald-700 dark:text-emerald-400">
                            {formatRupiah(kpi.paidWage)}
                        </div>
                        <div className="text-[11px] text-slate-500">
                            Telah terbayar penuh
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Rekap Per Karyawan */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="p-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                        <Users className="h-4 w-4 text-slate-600" />
                        Rekapitulasi Upah per Operator / Helper
                    </h3>
                    <span className="text-xs text-slate-500">{employeeSummaries.length} orang</span>
                </div>

                {employeeSummaries.length === 0 ? (
                    <div className="p-8 text-center text-xs text-slate-400">
                        Tidak ada data rekapitulasi upah pada filter ini.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-xs text-left">
                            <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 border-b border-slate-200 dark:border-slate-700 font-semibold">
                                <tr>
                                    <th className="py-2.5 px-3">Nama Karyawan</th>
                                    <th className="py-2.5 px-3 text-center">Kehadiran</th>
                                    <th className="py-2.5 px-3 text-right">Jam Normal</th>
                                    <th className="py-2.5 px-3 text-right">Jam Lembur</th>
                                    <th className="py-2.5 px-3 text-right">Total Jam</th>
                                    <th className="py-2.5 px-3 text-right">Total Upah</th>
                                    <th className="py-2.5 px-3 text-right">Tertunda (Unpaid)</th>
                                    <th className="py-2.5 px-3 text-center">Aksi Pelunasan</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {employeeSummaries.map((emp) => (
                                    <tr key={emp.employeeId || emp.employeeName} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                                        <td className="py-2.5 px-3 whitespace-nowrap font-bold text-slate-900 dark:text-slate-100">
                                            {emp.employeeName}
                                        </td>
                                        <td className="py-2.5 px-3 text-center whitespace-nowrap text-slate-600">
                                            {emp.totalDays} hari kerja
                                        </td>
                                        <td className="py-2.5 px-3 text-right whitespace-nowrap font-medium text-slate-700 dark:text-slate-300">
                                            {formatNumber(emp.totalNormalHours, 1)} jam
                                        </td>
                                        <td className="py-2.5 px-3 text-right whitespace-nowrap font-medium text-amber-700 dark:text-amber-400">
                                            {emp.totalOvertimeHours > 0 ? `${formatNumber(emp.totalOvertimeHours, 1)} jam` : "-"}
                                        </td>
                                        <td className="py-2.5 px-3 text-right whitespace-nowrap font-bold text-slate-800 dark:text-slate-200">
                                            {formatNumber(emp.totalHours, 1)} j
                                        </td>
                                        <td className="py-2.5 px-3 text-right whitespace-nowrap font-bold text-emerald-700 dark:text-emerald-400">
                                            {formatRupiah(emp.totalWage)}
                                        </td>
                                        <td className="py-2.5 px-3 text-right whitespace-nowrap">
                                            {emp.unpaidWage > 0 ? (
                                                <span className="font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-900/60">
                                                    {formatRupiah(emp.unpaidWage)}
                                                </span>
                                            ) : (
                                                <span className="text-emerald-600 font-medium text-[11px] flex items-center justify-end gap-1">
                                                    <CheckCircle2 className="h-3 w-3" /> Lunas
                                                </span>
                                            )}
                                        </td>
                                        <td className="py-2.5 px-3 text-center whitespace-nowrap">
                                            {emp.unpaidLogIds.length > 0 ? (
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    disabled={isPending}
                                                    onClick={() => handleBatchPay(emp.employeeName, emp.unpaidLogIds)}
                                                    className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold gap-1 px-2.5"
                                                >
                                                    {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3" />}
                                                    Bayar ({emp.unpaidLogIds.length})
                                                </Button>
                                            ) : (
                                                <span className="text-slate-400 text-[11px] italic">Semua Lunas</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    )
}
