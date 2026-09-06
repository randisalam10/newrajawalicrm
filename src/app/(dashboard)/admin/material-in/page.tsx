import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { getIncomingMaterials, getStockLedger } from "./actions"
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

    const [materials, ledger, locations] = await Promise.all([
        getIncomingMaterials(),
        getStockLedger("all"),
        getLocations(),
    ])

    return (
        <MaterialInClient
            initialData={materials}
            initialLedger={ledger}
            locations={locations}
            userRole={session.user.role as string}
            isCorporate={isCorp}
            canManage={canManage}
            isReadOnly={isReadOnly}
        />
    )
}
