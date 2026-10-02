import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { getMonthlyManagementReportData } from "./actions"
import { MonthlyManagementClient } from "./monthly-management-client"
import { ShieldAlert } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export const dynamic = "force-dynamic"

export default async function MonthlyManagementReportPage({
    searchParams
}: {
    searchParams: Promise<{ month?: string; locationId?: string }>
}) {
    const session = await auth()

    // ── STRICT SECURITY: ONLY SUPERADMIN IS ALLOWED ──
    if (session?.user?.role !== "SuperAdminBP") {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
                <div className="p-4 bg-red-50 text-red-600 rounded-full border border-red-200">
                    <ShieldAlert className="h-12 w-12" />
                </div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">Akses Dibatasi — Khusus Super Admin</h1>
                <p className="text-slate-500 max-w-md text-sm">
                    Laporan Bulanan Manajemen terintegrasi ini menyajikan data finansial, harga pokok produksi, dan kinerja eksekutif yang hanya dapat dibuka oleh akun Super Admin / Direksi.
                </p>
                <Button asChild className="mt-2 bg-blue-600 hover:bg-blue-700">
                    <Link href="/admin">Kembali ke Dashboard</Link>
                </Button>
            </div>
        )
    }

    const { month, locationId } = await searchParams
    const data = await getMonthlyManagementReportData({
        month: month || "2026-09", // default to September 2026 where records exist
        locationId: locationId || "all"
    })

    return <MonthlyManagementClient initialData={data} />
}
