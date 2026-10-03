import { Metadata } from "next"
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { getCreditPageData } from "./actions"
import { KreditClient } from "./kredit-client"

export const metadata: Metadata = {
    title: "Kredit & Kewajiban Perusahaan | Finance Rajawali CRM",
    description: "Modul pemantauan kewajiban kredit pengadaan, cicilan, dan arus kas pelunasan hutang rekanan.",
}

export default async function FinanceKreditPage() {
    const session = await auth()
    if (!session?.user?.id) {
        redirect("/login")
    }

    // Role & permission check
    const isSuperAdmin = session.user.role === "SuperAdminBP"
    const userPermissions: string[] = session.user.permissions || []
    const canView =
        isSuperAdmin ||
        userPermissions.includes("FINANCE_VIEW") ||
        userPermissions.includes("FINANCE_CREDIT_VIEW")

    if (!canView) {
        redirect("/admin")
    }

    const data = await getCreditPageData()

    if (!data) {
        return (
            <div className="py-20 text-center text-slate-500 text-sm">
                Gagal memuat data finansial kredit. Silakan muat ulang halaman.
            </div>
        )
    }

    return (
        <KreditClient
            initialCredits={data.credits}
            initialStats={data.stats}
            companies={data.companies}
            suppliers={data.suppliers}
            locations={data.locations}
            projects={data.projects}
            userRole={data.userRole}
            userPermissions={data.userPermissions}
            userLocationId={data.userLocationId || undefined}
        />
    )
}
