"use client"

import React, { useEffect, useState } from "react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { getVehicleAuditLogs } from "../actions"
import { VehicleAuditLog } from "../types"
import { format } from "date-fns"
import { id as idLocale } from "date-fns/locale"
import { History, Loader2, RefreshCw } from "lucide-react"

interface VehicleAuditLogDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function VehicleAuditLogDialog({
    open,
    onOpenChange,
}: VehicleAuditLogDialogProps) {
    const [logs, setLogs] = useState<VehicleAuditLog[]>([])
    const [isLoading, setIsLoading] = useState(false)

    const fetchLogs = async () => {
        setIsLoading(true)
        try {
            const data: any = await getVehicleAuditLogs()
            setLogs(data || [])
        } catch (err) {
            console.error("Gagal memuat audit log kendaraan", err)
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        if (open) {
            fetchLogs()
        }
    }, [open])

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl w-full p-5 max-h-[85vh] flex flex-col">
                <DialogHeader className="space-y-1">
                    <div className="flex items-center justify-between">
                        <DialogTitle className="text-sm font-bold flex items-center gap-2 text-slate-900">
                            <History className="w-4 h-4 text-indigo-600" />
                            <span>Audit Log Penghapusan & Perubahan Master Kendaraan</span>
                        </DialogTitle>
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={fetchLogs}
                            disabled={isLoading}
                            className="h-7 w-7 text-slate-500 hover:text-slate-800"
                            title="Segarkan Log"
                        >
                            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
                        </Button>
                    </div>
                    <DialogDescription className="text-xs text-slate-500">
                        Rekam jejak resmi aktivitas penghapusan unit kendaraan beserta akun penghapus dan alasan penghapusan.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto mt-3 pr-1 space-y-2.5">
                    {isLoading ? (
                        <div className="p-8 text-center text-xs text-slate-400 flex flex-col items-center gap-2">
                            <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
                            <span>Memuat catatan audit log...</span>
                        </div>
                    ) : logs.length === 0 ? (
                        <div className="p-8 text-center bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-400 italic">
                            Belum ada riwayat penghapusan unit armada yang tercatat di Audit Log.
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden bg-white">
                            {logs.map((log) => {
                                let parsedSnapshot: any = null
                                try {
                                    if (log.old_values) parsedSnapshot = JSON.parse(log.old_values)
                                } catch { }

                                return (
                                    <div key={log.id} className="p-3 hover:bg-slate-50 transition-colors space-y-1.5">
                                        <div className="flex items-center justify-between gap-2">
                                            <div className="flex items-center gap-2">
                                                <Badge
                                                    className={`text-[10px] font-bold ${
                                                        log.action === "DELETE"
                                                            ? "bg-rose-50 text-rose-800 border-rose-200"
                                                            : "bg-blue-50 text-blue-800 border-blue-200"
                                                    }`}
                                                >
                                                    {log.action === "DELETE" ? "HAPUS UNIT" : log.action}
                                                </Badge>
                                                <span className="font-bold text-xs text-slate-900">
                                                    {parsedSnapshot?.plate_number || "Tanpa Plat"}
                                                </span>
                                                {parsedSnapshot?.code && (
                                                    <Badge variant="outline" className="text-[10px] font-mono bg-slate-50 text-slate-600">
                                                        {parsedSnapshot.code}
                                                    </Badge>
                                                )}
                                                {parsedSnapshot?.categoryName && (
                                                    <span className="text-[11px] text-slate-500">
                                                        • {parsedSnapshot.categoryName}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="text-[10px] text-slate-400 font-mono">
                                                {format(new Date(log.timestamp), "dd MMM yyyy, HH:mm", { locale: idLocale })}
                                            </div>
                                        </div>

                                        {parsedSnapshot?.locationName && (
                                            <div className="text-[11px] text-slate-500">
                                                Pangkalan / Cabang: <strong>{parsedSnapshot.locationName}</strong>
                                            </div>
                                        )}

                                        {parsedSnapshot?.reason && (
                                            <div className="p-2 bg-slate-50 rounded border border-slate-200 text-xs text-slate-700">
                                                <span className="font-semibold text-slate-500 text-[10px] uppercase tracking-wider block mb-0.5">
                                                    Alasan Penghapusan:
                                                </span>
                                                &ldquo;{parsedSnapshot.reason}&rdquo;
                                            </div>
                                        )}

                                        <div className="text-[10px] text-slate-400 flex items-center justify-between pt-0.5">
                                            <span>
                                                Dieksekusi oleh: <strong className="text-slate-600">{log.user?.employee?.name || log.user?.username || parsedSnapshot?.deletedBy || "System"}</strong>
                                            </span>
                                            <span className="font-mono text-[9px] text-slate-300">
                                                ID: {log.id.slice(0, 8)}
                                            </span>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>

                <DialogFooter className="pt-3">
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => onOpenChange(false)}
                        className="text-xs w-full"
                    >
                        Tutup Log
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
