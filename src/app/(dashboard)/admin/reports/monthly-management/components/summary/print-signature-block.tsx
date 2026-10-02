"use client"

import React from "react"

export const PrintSignatureBlock: React.FC = () => {
    return (
        <div className="hidden print:grid grid-cols-3 gap-8 pt-8 mt-12 border-t text-xs text-center">
            <div className="space-y-16">
                <p className="font-semibold text-slate-600">Dibuat Oleh:</p>
                <div>
                    <p className="font-bold underline text-slate-900">Admin Cabang &amp; Logistik</p>
                    <p className="text-[10px] text-slate-500">Plant Administration</p>
                </div>
            </div>
            <div className="space-y-16">
                <p className="font-semibold text-slate-600">Diperiksa Oleh:</p>
                <div>
                    <p className="font-bold underline text-slate-900">Plant Manager / Kepala Cabang</p>
                    <p className="text-[10px] text-slate-500">Operasional Lapangan</p>
                </div>
            </div>
            <div className="space-y-16">
                <p className="font-semibold text-slate-600">Disetujui Oleh:</p>
                <div>
                    <p className="font-bold underline text-slate-900">Direktur Utama / Super Admin</p>
                    <p className="text-[10px] text-slate-500">Dewan Direksi PT RPM</p>
                </div>
            </div>
        </div>
    )
}
