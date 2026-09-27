import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { getIncomingMaterials, getStockLedger, getApprovedBpCementPOs } from "./actions"
import { MaterialInClient } from "./material-in-client"
import { getLocations } from "../cabang/actions"
import { isCorporateUser, hasPermission } from "@/lib/rbac"

export default async function MaterialInPage() {
    const session = await auth()

    if (!session?.user) {
        redirect("/login")
    }

    const isCorp = isCorporateUser(session.user)
    const isReadOnly = ["CEO", "FVP", "Approver"].includes(session.user.role || "")
    const canManage = !isReadOnly && (
        session.user.role === "SuperAdminBP" ||
        hasPermission(session.user, "MATERIAL_SEMEN", "CREATE") ||
        hasPermission(session.user, "MATERIAL_SEMEN", "EDIT")
    )

    const [materials, ledger, locations, approvedCementPos] = await Promise.all([
        getIncomingMaterials(),
        getStockLedger("all"),
        getLocations(),
        getApprovedBpCementPOs(),
    ])

    return (
        <MaterialInClient
            initialData={materials}
            initialLedger={ledger}
            locations={locations}
            approvedCementPos={approvedCementPos}
            userRole={session.user.role as string}
            userLocationId={session.user.locationId || null}
            isCorporate={isCorp}
            canManage={canManage}
            isReadOnly={isReadOnly}
        />
    )
}
