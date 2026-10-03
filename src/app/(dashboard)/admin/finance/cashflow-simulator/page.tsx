import { Metadata } from "next"
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { getSimulatorBaselineData } from "./actions"
import { CashflowSimulatorClient } from "./cashflow-simulator-client"
import { isCorporateUser } from "@/lib/rbac"

export const metadata: Metadata = {
    title: "Financial Break-Even & Cashflow Simulator | New Rajawali CRM",
    description: "Simulator Titik Impas Finansial, Proyeksi Arus Kas Riil, dan Analisis Likuiditas PT Rajawali Perkasa Jaya",
}

interface PageProps {
    searchParams: Promise<{ locationId?: string }>
}

export default async function CashflowSimulatorPage(props: PageProps) {
    const session = await auth()

    if (!session?.user) {
        redirect("/login")
    }

    // Role Guard: SuperAdminBP or Corporate users
    const isSuperAdmin = session.user.role === "SuperAdminBP"
    const isCorp = isCorporateUser(session.user)

    if (!isSuperAdmin && !isCorp) {
        redirect("/admin")
    }

    const searchParams = await props.searchParams
    const selectedLocationId = searchParams.locationId || null

    const result = await getSimulatorBaselineData(selectedLocationId)

    if (!result.success || !result.data) {
        return (
            <div className="p-8 text-center bg-white rounded-xl border border-rose-200 text-rose-700">
                <p className="font-bold text-sm">Gagal memuat simulator finansial</p>
                <p className="text-xs mt-1 text-slate-600">{result.error || "Data baseline tidak dapat diakses."}</p>
            </div>
        )
    }

    return <CashflowSimulatorClient baseline={result.data} />
}
