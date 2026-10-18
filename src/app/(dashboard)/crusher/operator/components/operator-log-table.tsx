"use client"

import { useTransition } from "react"
import { OperatorWorkLogItem } from "../../types"
import { deleteOperatorWorkLog, markOperatorWorkLogsPaid } from "../../actions"
import { formatNumber, formatRupiah } from "../../utils/crusher-helpers"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { Trash2, CheckCircle2, Clock, HardHat, UserCheck, Loader2 } from "lucide-react"

type Props = {
    logs: OperatorWorkLogItem[]
    canViewWages?: boolean
    onRefresh: () => void
}

export function OperatorLogTable({ logs, canViewWages = false, onRefresh }: Props) {
    const [isPending, startTransition] = useTransition()

    const handleDelete = (id: string, name: string) => {
        if (!confirm(`Hapus catatan jam kerja untuk ${name}?`)) return
        startTransition(async () => {
            try {
                await deleteOperatorWorkLog(id)
                toast.success(`Log kerja ${name} dihapus`)
                onRefresh()
            } catch (err: any) {
                toast.error(err.message || "Gagal menghapus log")
            }
        })
    }

    const handleMarkPaid = (id: string, name: string) => {
        startTransition(async () => {
            try {
                await markOperatorWorkLogsPaid([id])
                toast.success(`Upah ${name} ditandai lunas`)
                onRefresh()
            } catch (err: any) {
                toast.error(err.message || "Gagal mengubah status upah")
            }
        })
    }

    const getRoleBadge = (role: string) => {
        switch (role) {
            case "OPERATOR_EXCAVATOR":
                return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 border-amber-300 text-[10px]">Excavator</Badge>
            case "OPERATOR_LOADER":
                return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100 border-blue-300 text-[10px]">Wheel Loader</Badge>
            case "HELPER":
                return <Badge className="bg-teal-100 text-teal-800 hover:bg-teal-100 border-teal-300 text-[10px]">Helper Harian</Badge>
            case "OPERATOR_CRUSHER":
                return <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border-emerald-300 text-[10px]">Mesin SC</Badge>
            default:
                return <Badge variant="outline" className="text-[10px]">{role}</Badge>
        }
    }

    if (logs.length === 0) {
        return (
            <div className="p-8 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 text-slate-400 text-xs">
                Belum ada data log jam kerja operator atau helper pada periode ini.
            </div>
        )
    }

    return (
        <div className="space-y-2 w-full">
            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 border-b border-slate-200 dark:border-slate-800 font-semibold">
                        <tr>
                            <th className="py-2.5 px-3">Tanggal / Lokasi</th>
                            <th className="py-2.5 px-3">Karyawan & Peran</th>
                            <th className="py-2.5 px-3">Unit / Alat</th>
                            <th className="py-2.5 px-3 text-right">Jam Normal</th>
                            <th className="py-2.5 px-3 text-right">Jam Lembur</th>
                            <th className="py-2.5 px-3 text-right">Total Jam</th>
                            {canViewWages && (
                                <>
                                    <th className="py-2.5 px-3 text-right">Total Upah</th>
                                    <th className="py-2.5 px-3 text-center">Status Upah</th>
                                </>
                            )}
                            <th className="py-2.5 px-3 text-center">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {logs.map((log) => (
                            <tr key={log.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                                <td className="py-2.5 px-3 whitespace-nowrap">
                                    <div className="font-semibold text-slate-900 dark:text-slate-100">{log.date}</div>
                                    <div className="text-[11px] text-slate-500">{log.locationName || "Cabang"}</div>
                                </td>
                                <td className="py-2.5 px-3 whitespace-nowrap">
                                    <div className="font-bold text-slate-800 dark:text-slate-200">{log.employee_name}</div>
                                    <div className="mt-0.5">{getRoleBadge(log.role_type)}</div>
                                </td>
                                <td className="py-2.5 px-3 whitespace-nowrap">
                                    {log.vehicle_code ? (
                                        <div>
                                            <span className="font-semibold text-slate-700 dark:text-slate-300">{log.vehicle_code}</span>
                                            {log.hm_start !== null && log.hm_end !== null && (
                                                <div className="text-[10px] text-slate-500 font-mono">
                                                    HM: {formatNumber(log.hm_start ?? 0, 1)} → {formatNumber(log.hm_end ?? 0, 1)}
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <span className="text-slate-400 italic text-[11px]">- Perorangan -</span>
                                    )}
                                </td>
                                <td className="py-2.5 px-3 text-right font-medium">
                                    {formatNumber(log.work_hours_normal, 1)} jam
                                    {canViewWages && (
                                        <div className="text-[10px] text-slate-400">@{formatRupiah(log.rate_normal)}</div>
                                    )}
                                </td>
                                <td className="py-2.5 px-3 text-right font-medium">
                                    {log.work_hours_overtime > 0 ? (
                                        <span className="text-amber-700 dark:text-amber-400 font-bold">
                                            {formatNumber(log.work_hours_overtime, 1)} jam
                                            {canViewWages && (
                                                <div className="text-[10px] text-amber-600/80">@{formatRupiah(log.rate_overtime)}</div>
                                            )}
                                        </span>
                                    ) : (
                                        <span className="text-slate-400">0</span>
                                    )}
                                </td>
                                <td className="py-2.5 px-3 text-right font-bold text-slate-800 dark:text-slate-200">
                                    {formatNumber(log.total_hours, 1)} j
                                </td>
                                {canViewWages && (
                                    <>
                                        <td className="py-2.5 px-3 text-right whitespace-nowrap font-bold text-emerald-700 dark:text-emerald-400">
                                            {formatRupiah(log.total_fee)}
                                        </td>
                                        <td className="py-2.5 px-3 text-center whitespace-nowrap">
                                            {log.is_paid ? (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                    <CheckCircle2 className="h-3 w-3" /> Lunas
                                                </span>
                                            ) : (
                                                <button
                                                    type="button"
                                                    onClick={() => handleMarkPaid(log.id, log.employee_name)}
                                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 transition-colors"
                                                    title="Klik untuk tandai Lunas"
                                                >
                                                    <Clock className="h-3 w-3" /> Belum Lunas
                                                </button>
                                            )}
                                        </td>
                                    </>
                                )}
                                <td className="py-2.5 px-3 text-center whitespace-nowrap">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleDelete(log.id, log.employee_name)}
                                        className="h-7 w-7 p-0 text-slate-400 hover:text-rose-600"
                                        title="Hapus Log"
                                    >
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
