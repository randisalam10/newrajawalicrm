import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { getTransactions, getRetaseSettings } from "./actions"
import { getCustomersForReport } from "@/app/(dashboard)/admin/reports/retase/actions"
import { prisma } from "@/lib/prisma"
import { RetaseClient } from "./retase-client"
import { isCorporateUser } from "@/lib/rbac"

export default async function RetasePage() {
    const session = await auth()
    if (!session || !session.user || session.user.role === 'OperatorBP') {
        redirect("/login")
    }

    const role = session.user.role || ""
    const isCorp = isCorporateUser(session.user)

    const canConfirm = (role === "SuperAdminBP" || role === "AdminBP") && !["CEO", "FVP", "Approver"].includes(role)
    const canDelete = (role === "SuperAdminBP" || role === "AdminBP") && !["CEO", "FVP", "Approver"].includes(role)
    const canManageSettings = (role === "SuperAdminBP" || role === "AdminBP") && !["CEO", "FVP", "Approver"].includes(role)

    const [pendingTransactions, confirmedTransactions, settings, customers] = await Promise.all([
        getTransactions("Pending"),
        getTransactions("Confirmed"),
        getRetaseSettings(),
        getCustomersForReport(),
    ])

    // Fetch locations for corporate users or branch admin
    let locations: any[] = []
    if (isCorp) {
        locations = await (prisma as any).location.findMany({ orderBy: { name: 'asc' } })
    } else if (session.user.locationId) {
        locations = await (prisma as any).location.findMany({ where: { id: session.user.locationId } })
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col space-y-2">
                <div className="flex items-center gap-3">
                    <h1 className="text-3xl font-bold tracking-tight">Konfirmasi Retase & Surat Jalan</h1>
                    {!canConfirm && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                            Mode Pemantauan (Hanya Lihat)
                        </span>
                    )}
                </div>
                <p className="text-slate-500">Hitung penghasilan sopir dan cetak faktur/surat jalan untuk customer.</p>
            </div>

            <RetaseClient
                pendingTransactions={pendingTransactions}
                confirmedTransactions={confirmedTransactions}
                settings={settings || []}
                locations={locations}
                userRole={role}
                customers={customers}
                canConfirm={canConfirm}
                canDelete={canDelete}
                canManageSettings={canManageSettings}
            />
        </div>
    )
}
