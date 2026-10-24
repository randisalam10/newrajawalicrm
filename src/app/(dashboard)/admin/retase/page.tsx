import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { getTransactions, getRetaseSettings } from "./actions"
import { getCustomersForReport } from "@/app/(dashboard)/admin/reports/retase/actions"
import { getMasterIncentives } from "@/app/(dashboard)/admin/master-insentif/actions"
import { getProductionMasters } from "@/app/(dashboard)/admin/produksi/actions"
import { prisma } from "@/lib/prisma"
import { RetaseClient } from "./retase-client"
import { isCorporateUser, hasPermission } from "@/lib/rbac"

export default async function RetasePage() {
    const session = await auth()
    if (!session || !session.user || session.user.role === 'OperatorBP') {
        redirect("/login")
    }

    const role = session.user.role || ""
    const isCorp = isCorporateUser(session.user)

    const hasEdit = hasPermission(session.user, "RETASE", "EDIT") || hasPermission(session.user, "PRODUKSI", "EDIT") || ["SuperAdminBP", "AdminBP"].includes(role)
    const canConfirm = hasEdit && !["CEO", "FVP", "Approver"].includes(role)
    const canEdit = hasEdit && !["CEO", "FVP", "Approver"].includes(role)
    const canDelete = (hasEdit || hasPermission(session.user, "RETASE", "DELETE") || hasPermission(session.user, "PRODUKSI", "DELETE")) && !["CEO", "FVP", "Approver"].includes(role)
    const canManageSettings = hasEdit && !["CEO", "FVP", "Approver"].includes(role)

    const [
        pendingTransactions,
        confirmedTransactions,
        settings,
        customers,
        masterIncentives,
        productionMasters,
    ] = await Promise.all([
        getTransactions("Pending"),
        getTransactions("Confirmed"),
        getRetaseSettings(),
        getCustomersForReport(),
        getMasterIncentives(),
        getProductionMasters(),
    ])

    // Fetch locations for corporate users or branch admin
    let locations: any[] = []
    if (isCorp) {
        locations = await (prisma as any).location.findMany({ orderBy: { name: 'asc' } })
    } else if (session.user.locationId) {
        locations = await (prisma as any).location.findMany({ where: { id: session.user.locationId } })
    }

    return (
        <div className="space-y-4">
            {!canConfirm && (
                <div className="flex items-center gap-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                        Mode Pemantauan (Hanya Lihat)
                    </span>
                </div>
            )}

            <RetaseClient
                pendingTransactions={pendingTransactions}
                confirmedTransactions={confirmedTransactions}
                settings={settings || []}
                masterIncentives={masterIncentives || []}
                locations={locations}
                userRole={role}
                customers={customers}
                productionMasters={productionMasters}
                canConfirm={canConfirm}
                canEdit={canEdit}
                canDelete={canDelete}
                canManageSettings={canManageSettings}
            />
        </div>
    )
}
