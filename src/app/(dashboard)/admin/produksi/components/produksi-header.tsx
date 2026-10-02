"use client"

import React from "react"
import { CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Lock, ShieldAlert } from "lucide-react"

interface ProduksiHeaderProps {
    canCreate: boolean
    userRole?: string
}

export const ProduksiHeader: React.FC<ProduksiHeaderProps> = ({
    canCreate,
    userRole,
}) => {
    return (
        <>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle>
                            {canCreate ? "Form Input Produksi" : "Form Data Produksi (Terkunci)"}
                        </CardTitle>
                        <CardDescription>
                            {canCreate
                                ? "Buat transaksi pengiriman beton precast baru."
                                : "Mode tampilan hanya lihat untuk monitoring. Form penginputan dinonaktifkan untuk role " + (userRole || "Pemantau") + "."}
                        </CardDescription>
                    </div>
                    {!canCreate && (
                        <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-semibold border border-amber-200">
                            <Lock className="w-3.5 h-3.5" />
                            Read-Only
                        </div>
                    )}
                </div>
            </CardHeader>

            {!canCreate && (
                <div className="px-6 pb-2">
                    <div className="flex items-start gap-3 p-4 rounded-xl border border-amber-200 bg-amber-50/90 text-amber-900 text-sm mb-4">
                        <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                        <div className="space-y-1">
                            <p className="font-semibold text-amber-950">Akses Terkunci: Mode Pemantauan (Hanya Lihat)</p>
                            <p className="text-xs text-amber-800 leading-relaxed">
                                Akun Anda terdaftar sebagai <strong>{userRole}</strong> yang hanya memiliki hak akses pemantauan (VIEW). Form input dan tombol simpan dinonaktifkan agar tidak terjadi kesalahan penginputan transaksi tiket pengiriman.
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
