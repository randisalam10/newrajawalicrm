"use client"

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DataGapNote } from "../../types"
import { Info, ShieldAlert } from "lucide-react"

interface MethodologyAndNotesProps {
    dataGapNotes: DataGapNote[]
}

export function MethodologyAndNotes({ dataGapNotes }: MethodologyAndNotesProps) {
    return (
        <Card className="border-slate-200 bg-white shadow-xs w-full">
            <CardHeader className="py-3 px-4 border-b border-slate-100 flex flex-row items-center justify-between">
                <div className="flex items-center gap-2">
                    <Info className="h-4 w-4 text-blue-600" />
                    <CardTitle className="text-sm font-bold text-slate-800">
                        Catatan Metodologi, Keterbatasan Data &amp; Mitigasi Sistem (Data Gap Disclosure)
                    </CardTitle>
                </div>
                <Badge variant="outline" className="text-xs bg-slate-50 text-slate-600">
                    Transparansi Zero Guesswork
                </Badge>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
                <div className="text-xs text-slate-600 leading-relaxed bg-blue-50/60 p-3 rounded-lg border border-blue-100 flex items-start gap-2.5">
                    <ShieldAlert className="h-4 w-4 text-blue-700 shrink-0 mt-0.5" />
                    <div>
                        <span className="font-bold text-blue-900">Prinsip Integritas Data Rajawali Mix: </span>
                        Simulator ini beroperasi di atas data transaksi riil dari database (949 pengiriman beton, Rp 3,59 M invoice, Rp 1,34 M hutang supplier PO, dan Rp 187 M kas lapangan RBL). Area di mana database belum memiliki pencatatan granular <strong>tidak diisi dengan angka tebakan fiktif</strong>, melainkan dimitigasi melalui kontrol skenario interaktif di bawah ini:
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
                    {dataGapNotes.map((note, idx) => (
                        <div key={idx} className="p-3 rounded-lg border border-slate-200 bg-slate-50/50 space-y-1.5 text-xs">
                            <div className="flex items-center justify-between">
                                <span className="font-bold text-slate-800">{note.title}</span>
                                <Badge variant="secondary" className="text-[9px] bg-slate-200/70 text-slate-700">
                                    Catatan #{idx + 1}
                                </Badge>
                            </div>
                            <div className="text-slate-600 text-[11px]">
                                <span className="font-semibold text-slate-700">Kondisi DB: </span>
                                {note.currentStatus}
                            </div>
                            <div className="text-amber-800 text-[11px]">
                                <span className="font-semibold">Dampak Bisnis: </span>
                                {note.impact}
                            </div>
                            <div className="text-blue-700 text-[11px] font-medium pt-1 border-t border-slate-200/60">
                                <span className="font-semibold">Solusi Simulator: </span>
                                {note.simulatorMitigation}
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}
