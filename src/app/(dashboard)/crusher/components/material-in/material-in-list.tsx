"use client"

import { Button } from "@/components/ui/button"
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
import { Loader2, Trash2 } from "lucide-react"
import type { MaterialInController } from "./use-material-in"
import { FEED_LABEL } from "./use-material-in"

type Props = {
    ctl: MaterialInController
    canViewWages?: boolean
}

export function MaterialInList({ ctl, canViewWages = false }: Props) {
    const label = FEED_LABEL[ctl.feedType]

    return (
        <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700">Daftar {label.title} hari ini</span>
                <span className="text-slate-500">{ctl.activeList.length} baris</span>
            </div>

            {ctl.activeList.length === 0 ? (
                <p className="text-xs text-slate-400 py-4 text-center border border-dashed border-slate-200 rounded-lg">
                    Belum ada catatan.
                </p>
            ) : (
                <ul className="divide-y divide-slate-100 border border-slate-200 rounded-lg bg-white">
                    {ctl.activeList.map((m) => (
                        <li key={m.id} className="flex items-center gap-2 px-2.5 py-2 text-xs">
                            <span className="shrink-0 min-w-11 text-center px-1.5 py-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold">
                                {m.ritase} Ret
                            </span>
                            <div className="min-w-0 flex-1">
                                <div className="flex items-baseline gap-1.5">
                                    <span className="font-bold text-slate-900 whitespace-nowrap">{m.plate_number}</span>
                                    <span className="text-slate-500 truncate">{m.driver_name}</span>
                                </div>
                                <div className="text-[11px] text-slate-500 truncate flex items-center gap-1.5 flex-wrap">
                                    <span>{m.source_name} • {m.distance_km} km</span>
                                    {canViewWages && (
                                        <span className="font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200 text-[10px]">
                                            Retase: Rp {(m.retase_amount ?? (m.ritase * 4500)).toLocaleString("id-ID")}
                                        </span>
                                    )}
                                    {m.notes ? <span>• {m.notes}</span> : null}
                                </div>
                            </div>
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => ctl.setDeleteTarget({ id: m.id, plate: m.plate_number })}
                                className="h-8 w-8 p-0 shrink-0 text-slate-400 hover:text-rose-600"
                                aria-label={`Hapus ${m.plate_number}`}
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </li>
                    ))}
                </ul>
            )}

            <AlertDialog open={ctl.deleteTarget !== null} onOpenChange={(o) => !o && ctl.setDeleteTarget(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Hapus catatan {ctl.deleteTarget?.plate}?</AlertDialogTitle>
                        <AlertDialogDescription>Data retase ini akan dihapus permanen dari laporan harian.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={ctl.isDeleting}>Batal</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={(e) => { e.preventDefault(); ctl.confirmDelete() }}
                            disabled={ctl.isDeleting}
                            className="bg-rose-600 hover:bg-rose-700"
                        >
                            {ctl.isDeleting && <Loader2 className="h-4 w-4 animate-spin mr-1.5" />}
                            Hapus
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
