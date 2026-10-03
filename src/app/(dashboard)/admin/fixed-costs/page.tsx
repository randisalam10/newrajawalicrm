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

    const userRole = session.user.role || ""
    if (userRole !== "SuperAdminBP") {
        redirect("/admin")
    }

    const isCorporate = true
    const canManage = true

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
