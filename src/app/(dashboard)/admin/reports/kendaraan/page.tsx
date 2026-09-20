import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { getLocations } from "../../cabang/actions"
import { getRblVehicles } from "../../rbl/actions"
import { getVehicleCategories } from "../../kendaraan/actions"
import { hasPermission } from "@/lib/rbac"
import { VehicleReportClient } from "./vehicle-report-client"

export const dynamic = "force-dynamic"

export default async function VehicleReportPage() {
    const session = await auth()
    if (!session?.user) redirect("/login")

    const canView = hasPermission(session.user, "REPORTS", "VIEW") ||
        hasPermission(session.user, "RBL", "VIEW") ||
        ["SuperAdminBP", "AdminBP", "AdminLogistik", "CEO", "FVP"].includes(session.user.role ?? "")

    if (!canView) {
        redirect("/admin")
    }

    const isCorporate = session.user.role === "SuperAdminBP" ||
        session.user.roleScope === "ALL_BRANCHES" ||
        ["CEO", "FVP"].includes(session.user.role ?? "")

    const [allLocations, vehicles, categories] = await Promise.all([
        getLocations(),
        getRblVehicles(),
        getVehicleCategories(),
    ])

    const locations = isCorporate
        ? allLocations
        : allLocations.filter(loc => loc.id === session.user.locationId)

    return (
        <div className="space-y-4">
            <VehicleReportClient
                initialVehicles={vehicles}
                categories={categories}
                locations={locations}
                userLocationId={session.user.locationId || ""}
                isSuperAdmin={isCorporate}
            />
        </div>
    )
}
