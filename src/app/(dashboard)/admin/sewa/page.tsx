import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { getSewaMasters, getSewaTransactions, getMasterSewaAlat } from "./actions"
import { SewaClient } from "./sewa-client"

export const dynamic = "force-dynamic"

export default async function SewaPage() {
    const session = await auth()
    if (!session?.user) redirect("/login")

    const userRole = session.user.role || "OperatorBP"
    const isCorp = userRole === "SuperAdminBP" || session.user.roleScope === "ALL_BRANCHES" || ["CEO", "FVP"].includes(userRole)

    // Check permission to view
    const canView = isCorp ||
        Boolean(session.user.permissions?.includes("SEWA_VIEW")) ||
        ["OperatorBP", "AdminBP"].includes(userRole)

    if (!canView) redirect("/admin")

    // Check permission to create/manage
    const canCreate = isCorp ||
        Boolean(session.user.permissions?.includes("SEWA_CREATE")) ||
        ["OperatorBP", "AdminBP"].includes(userRole)

    const [masters, transactions, masterEquipments] = await Promise.all([
        getSewaMasters(),
        getSewaTransactions({ limit: 100 }),
        getMasterSewaAlat()
    ])

    return (
        <SewaClient
            masters={masters}
            initialTransactions={transactions}
            masterEquipments={masterEquipments}
            userRole={userRole}
            canCreate={canCreate}
        />
    )
}
