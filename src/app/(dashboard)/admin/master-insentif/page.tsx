import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { getMasterIncentives } from "./actions"
import { getLocations } from "../cabang/actions"
import { MasterInsentifClient } from "./master-insentif-client"
import { hasPermission, isCorporateUser } from "@/lib/rbac"

export const dynamic = "force-dynamic"

export default async function MasterInsentifPage() {
    const session = await auth()
    if (!session?.user) redirect("/login")

    const role = session.user.role || "OperatorBP"
    const canView = role === "SuperAdminBP" ||
        hasPermission(session.user, "INSENTIF", "VIEW") ||
        hasPermission(session.user, "RETASE", "VIEW") ||
        (["AdminBP", "CEO", "FVP"].includes(role) && role !== "AdminLogistik")

    if (!canView) {
        redirect(role === "AdminLogistik" ? "/logistik" : "/admin")
    }

    const canManage = role === "SuperAdminBP" || (
        !["CEO", "FVP", "Approver"].includes(role) && (
            role === "AdminBP" ||
            hasPermission(session.user, "INSENTIF", "EDIT") ||
            hasPermission(session.user, "RETASE", "EDIT")
        )
    )
    const isCorporate = isCorporateUser(session.user)

    const [rates, locations] = await Promise.all([
        getMasterIncentives(),
        getLocations()
    ])

    return (
        <div className="space-y-4">
            <MasterInsentifClient
                initialRates={rates}
                locations={locations}
                canManage={canManage}
                isCorporate={isCorporate}
            />
        </div>
    )
}
