import { getFixedCostContracts, getOperationalTargetSetting } from "./actions"
import { FixedCostsClient } from "./fixed-costs-client"
import { getLocations } from "../cabang/actions"
import { auth } from "@/auth"
import { isCorporateUser } from "@/lib/rbac"
import { redirect } from "next/navigation"

export const metadata = {
    title: "Master Biaya & Target Operasional | Rajawali Mix",
    description: "Pengaturan standar target operasional, analisis unit economics, biaya pokok langsung manual (COGS), dan kontrak beban tetap plant.",
}

export default async function FixedCostsPage() {
    const session = await auth()
    if (!session?.user) redirect("/login")

    const userRole = session.user.role || "OperatorBP"
    const isCorporate = isCorporateUser(session.user)
    const perms = session.user.permissions || []

    const canView = userRole === "SuperAdminBP" ||
        perms.includes("MASTER_DATA_VIEW") ||
        perms.includes("RBL_VIEW") ||
        ["AdminBP", "AdminLogistik", "CEO", "FVP", "Approver"].includes(userRole)

    if (!canView) redirect("/admin")

    const canManage = userRole === "SuperAdminBP" || (
        !["CEO", "FVP", "Approver"].includes(userRole) && (
            userRole === "AdminBP" ||
            perms.includes("MASTER_DATA_CREATE") ||
            perms.includes("MASTER_DATA_EDIT")
        )
    )

    const [data, locations, targetSetting] = await Promise.all([
        getFixedCostContracts(),
        getLocations(),
        getOperationalTargetSetting(null),
    ])

    return (
        <div className="space-y-6">
            <FixedCostsClient
                initialData={data}
                initialTargetSetting={targetSetting}
                locations={locations}
                userRole={userRole}
                canManage={canManage}
                isCorporate={isCorporate}
            />
        </div>
    )
}
