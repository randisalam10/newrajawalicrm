import { getBillingPageData } from "./actions"
import { getLocations } from "../cabang/actions"
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { hasPermission, isCorporateUser } from "@/lib/rbac"
import { BillingClient } from "./billing-client"

export default async function BillingPage() {
    const session = await auth()
    if (!session?.user) redirect("/login")

    const canView = hasPermission(session.user, "BILLING", "VIEW") || ["AdminBP", "CEO", "FVP"].includes(session.user.role ?? "")
    if (!canView) {
        redirect("/admin")
    }

    const [data, allLocations] = await Promise.all([
        getBillingPageData(),
        getLocations(),
    ])

    const isFullScope = isCorporateUser(session.user)
    const locations = isFullScope
        ? allLocations
        : allLocations.filter(loc => loc.id === session.user.locationId)

    // FVP and CEO are read-only; only AdminBP and SuperAdminBP can create/modify invoices, payments, deposits
    const canManage = (session.user.role === "SuperAdminBP" || session.user.role === "AdminBP") &&
        !["CEO", "FVP"].includes(session.user.role ?? "")

    return (
        <div className="space-y-6">
            <div className="flex flex-col space-y-1">
                <div className="flex items-center gap-3">
                    <h1 className="text-3xl font-bold tracking-tight">Tagihan & Invoice</h1>
                    {!canManage && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                            Mode Pemantauan (Hanya Lihat)
                        </span>
                    )}
                </div>
                <p className="text-slate-500">Kelola invoice, catat pembayaran, dan monitor saldo deposito pelanggan.</p>
            </div>
            <BillingClient
                initialData={data}
                locations={locations}
                userRole={session.user.role}
                userLocationId={session.user.locationId ?? ""}
                canManage={canManage}
            />
        </div>
    )
}
