"use client"

import { usePathname } from "next/navigation"
import { useMemo } from "react"
import { ChevronRight } from "lucide-react"

type RouteMeta = {
    section: string
    title: string
}

const ROUTE_MAP: Record<string, RouteMeta> = {
    // Admin & Monitoring
    "/admin": { section: "Monitoring", title: "Dashboard Operasional" },
    "/admin/reports/kendaraan": { section: "Laporan", title: "Laporan & Analisis Armada" },
    "/admin/material-usage": { section: "Operasional", title: "Penggunaan Material" },
    "/admin/material-in": { section: "Logistik Material", title: "Semen Masuk & Stok Silo" },
    "/admin/material-agregat": { section: "Logistik Material", title: "Agregat & Pasir Masuk" },
    "/admin/billing": { section: "Keuangan", title: "Tagihan & Invoice" },
    "/admin/rbl": { section: "Keuangan", title: "Kas Operasional RBL" },
    "/admin/kendaraan": { section: "Master Data", title: "Data Armada Kendaraan" },
    "/admin/produksi": { section: "Produksi", title: "Input Produksi Beton" },
    "/admin/retase": { section: "Produksi", title: "Konfirmasi Retase" },
    "/admin/planning": { section: "Produksi", title: "Planning Pengecoran" },
    "/admin/customer": { section: "Master Data", title: "Data Pelanggan" },
    "/admin/karyawan": { section: "Master Data", title: "Data Karyawan & Supir" },
    "/admin/mutu": { section: "Master Data", title: "Mutu Beton & Harga" },
    "/admin/item-pekerjaan": { section: "Master Data", title: "Master Item Pekerjaan" },
    "/admin/master-insentif": { section: "Master Data", title: "Master Tarif Insentif" },
    "/admin/cabang": { section: "Master Data", title: "Cabang Batching Plant" },
    "/admin/users": { section: "Pengaturan", title: "Manajemen Pengguna" },
    "/admin/roles": { section: "Pengaturan", title: "Hak Akses & Role" },

    // Logistik
    "/logistik": { section: "Logistik", title: "Dashboard Pengadaan" },
    "/logistik/po": { section: "Logistik", title: "Daftar Purchase Order" },
    "/logistik/po/create": { section: "Logistik", title: "Buat Purchase Order Baru" },
    "/logistik/approval": { section: "Logistik", title: "Persetujuan / Approval PO" },
    "/logistik/master-barang": { section: "Logistik", title: "Master Barang & Stok" },
    "/logistik/supplier": { section: "Logistik", title: "Data Supplier" },
    "/logistik/perusahaan": { section: "Logistik", title: "Perusahaan Group" },
    "/logistik/kategori": { section: "Logistik", title: "Kategori Barang" },
    "/logistik/laporan": { section: "Logistik", title: "Laporan Pengadaan Logistik" },

    // Operator
    "/operator": { section: "Operasional", title: "Dashboard Operator BP" },
}

export function DashboardNavbarTitle() {
    const pathname = usePathname()

    const meta = useMemo(() => {
        if (!pathname) return { section: "Rajawali", title: "Portal Operasional" }

        // Exact match
        if (ROUTE_MAP[pathname]) return ROUTE_MAP[pathname]

        // Prefix match for dynamic nested routes
        const matchedKey = Object.keys(ROUTE_MAP)
            .filter(key => key !== "/admin" && key !== "/logistik" && key !== "/operator")
            .find(key => pathname.startsWith(key))

        if (matchedKey) return ROUTE_MAP[matchedKey]

        // General fallback
        if (pathname.startsWith("/admin")) return { section: "Admin", title: "Panel Administrasi" }
        if (pathname.startsWith("/logistik")) return { section: "Logistik", title: "Portal Pengadaan" }
        if (pathname.startsWith("/operator")) return { section: "Operator", title: "Panel Batching" }

        return { section: "Rajawali", title: "Portal Operasional" }
    }, [pathname])

    return (
        <div className="flex items-center gap-2 min-w-0">
            <div className="h-4 w-px bg-slate-200 hidden sm:block shrink-0" />
            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium min-w-0">
                <span className="hidden md:inline truncate text-slate-400 font-normal">
                    {meta.section}
                </span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-300 hidden md:inline shrink-0" />
                <span className="font-bold text-slate-900 truncate text-xs sm:text-sm tracking-tight">
                    {meta.title}
                </span>
            </div>
        </div>
    )
}
