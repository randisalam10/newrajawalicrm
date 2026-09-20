import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { getActiveBudget, getBudgetHistory, getRblSummaryData, getRblCategories, getRblVehicles } from "./actions"
import { getLocations } from "../cabang/actions"
import { RblClient } from "./rbl-client"
import { hasPermission } from "@/lib/rbac"

export const dynamic = "force-dynamic"

export default async function RblPage({
    searchParams,
}: {
    searchParams: Promise<{ locationId?: string; year?: string }>
}) {
    const session = await auth()
    if (!session?.user) redirect("/login")

    const canView = hasPermission(session.user, "RBL", "VIEW") ||
        ["SuperAdminBP", "AdminBP", "AdminLogistik", "CEO", "FVP"].includes(session.user.role ?? "")

    if (!canView) {
        redirect("/admin")
    }

    const { locationId, year } = await searchParams
    const isCorporate = session.user.role === "SuperAdminBP" ||
        session.user.roleScope === "ALL_BRANCHES" ||
        ["CEO", "FVP"].includes(session.user.role ?? "")
    const parsedYear = year ? parseInt(year) : new Date().getFullYear()

    // Corporate users can view all or specific branch; branch-scoped users locked to locationId
    const targetLocationId = isCorporate ? (locationId || "all") : (session.user.locationId || "")

    const [activeBudget, history, summaryData, allLocations, categories, vehicles] = await Promise.all([
        getActiveBudget(targetLocationId === "all" ? undefined : targetLocationId),
        getBudgetHistory({
            locationId: targetLocationId === "all" ? undefined : targetLocationId,
            year: parsedYear
        }),
        getRblSummaryData({
            locationId: targetLocationId === "all" ? undefined : targetLocationId,
            year: parsedYear
        }),
        getLocations(),
        getRblCategories(),
        getRblVehicles(),
    ])

    // Filter locations for branch-scoped users
    const locations = isCorporate
        ? allLocations
        : allLocations.filter(loc => loc.id === session.user.locationId)

    const user = session.user
    const isSuperAdminBP = user.role === "SuperAdminBP"
    const canCreate = isSuperAdminBP || hasPermission(user, "RBL", "CREATE") || ["AdminBP", "AdminLogistik"].includes(user.role ?? "")
    const canEdit = isSuperAdminBP || hasPermission(user, "RBL", "EDIT") || ["AdminBP", "AdminLogistik"].includes(user.role ?? "")
    const canDelete = isSuperAdminBP || hasPermission(user, "RBL", "DELETE") || ["AdminBP", "AdminLogistik"].includes(user.role ?? "")
    const canClose = isSuperAdminBP || hasPermission(user, "RBL", "CLOSE") || ["AdminBP", "AdminLogistik"].includes(user.role ?? "")
    const canExport = isSuperAdminBP || hasPermission(user, "RBL", "EXPORT") || ["AdminBP", "AdminLogistik", "CEO", "FVP"].includes(user.role ?? "")

    return (
        <div className="space-y-6">
            <RblClient
                initialActiveBudget={activeBudget}
                initialHistory={history}
                summaryData={summaryData}
                locations={locations}
                initialCategories={categories}
                vehicles={vehicles}
                userRole={session.user.role || ""}
                userLocationId={session.user.locationId || ""}
                isSuperAdmin={isCorporate}
                canCreate={Boolean(canCreate)}
                canEdit={Boolean(canEdit)}
                canDelete={Boolean(canDelete)}
                canClose={Boolean(canClose)}
                canExport={Boolean(canExport)}
            />
        </div>
    )
}
