"use client"

import React from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Sparkles, ArrowDownLeft, ArrowUpRight, ExternalLink } from "lucide-react"

export function MaterialIntegrationBanner() {
    return (
        <Card className="border-blue-200/90 bg-linear-to-r from-blue-50/70 via-sky-50/40 to-indigo-50/50 shadow-xs overflow-hidden">
            <CardContent className="p-4 space-y-3.5">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                        <div className="p-2.5 bg-blue-600 text-white rounded-xl shadow-xs shrink-0">
                            <Sparkles className="w-4 h-4" />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 flex-wrap">
                                <span>Pusat Integrasi Harga Material (Masuk & Keluar)</span>
                                <Badge className="bg-emerald-600 text-white text-[10px] px-2 py-0 h-4 font-semibold">
                                    Terhubung Otomatis
                                </Badge>
                            </h3>
                            <p className="text-xs text-slate-600 mt-0.5">
                                Harga acuan per m³ di master ini langsung menjadi sumber penentuan tarif default untuk seluruh transaksi material masuk dan keluar.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                        <Link
                            href="/admin/material-agregat"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-blue-200 hover:border-blue-400 text-blue-700 text-xs font-semibold rounded-lg shadow-2xs hover:bg-blue-50/60 transition-all"
                        >
                            <ArrowDownLeft className="w-3.5 h-3.5 text-blue-600" />
                            <span>Penerimaan Masuk</span>
                            <ExternalLink className="w-3 h-3 text-slate-400" />
                        </Link>

                        <Link
                            href="/admin/material-agregat"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-rose-200 hover:border-rose-400 text-rose-700 text-xs font-semibold rounded-lg shadow-2xs hover:bg-rose-50/60 transition-all"
                        >
                            <ArrowUpRight className="w-3.5 h-3.5 text-rose-600" />
                            <span>Pengeluaran Keluar</span>
                            <ExternalLink className="w-3 h-3 text-slate-400" />
                        </Link>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
                    <div className="bg-white/95 p-3 rounded-xl border border-slate-200/90 shadow-2xs space-y-1.5">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                Material Masuk (Incoming)
                            </span>
                            <Badge variant="outline" className="text-[9px] bg-emerald-50 border-emerald-200 text-emerald-800">
                                Internal & Eksternal
                            </Badge>
                        </div>
                        <p className="text-[11px] text-slate-600 leading-relaxed">
                            <strong>Quarry Sendiri (Internal)</strong> & <strong>Pembelian Vendor (Eksternal)</strong> otomatis mengambil harga acuan per m³ saat transaksi dicatat, menghasilkan total nilai pengeluaran pokok material.
                        </p>
                    </div>

                    <div className="bg-white/95 p-3 rounded-xl border border-slate-200/90 shadow-2xs space-y-1.5">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                                Material Keluar (Outgoing)
                            </span>
                            <Badge variant="outline" className="text-[9px] bg-rose-50 border-rose-200 text-rose-800">
                                Jual & Proyek Internal
                            </Badge>
                        </div>
                        <p className="text-[11px] text-slate-600 leading-relaxed">
                            <strong>Penjualan Bebas (Eksternal)</strong> memakai harga ini sebagai harga jual default, sedangkan <strong>Proyek Lapangan Non-BP & Transfer (Internal)</strong> memakainya sebagai valuasi biaya pengeluaran.
                        </p>
                    </div>

                    <div className="bg-white/95 p-3 rounded-xl border border-slate-200/90 shadow-2xs space-y-1.5">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                                Point-in-Time & Cabang
                            </span>
                            <Badge variant="outline" className="text-[9px] bg-blue-50 border-blue-200 text-blue-800">
                                Backdate Safe
                            </Badge>
                        </div>
                        <p className="text-[11px] text-slate-600 leading-relaxed">
                            Harga berlaku point-in-time berdasarkan tanggal surat jalan. Perubahan harga baru tidak merusak data historis sebelum tanggal efektif. Mendukung tarif per cabang atau global.
                        </p>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
