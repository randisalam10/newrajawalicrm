import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { FuelClient } from "./fuel-client"
import { getFuelMasterOptions, getVehicleFuelLogs } from "./actions"

export const metadata = {
    title: "Monitoring Penggunaan BBM - New Rajawali CRM",
    description: "Pencatatan konsumsi BBM solar armada kendaraan dan alat berat baik dari kas RBL maupun Non-RBL dengan harga manual.",
}

export default async function FuelPage() {
    const session = await auth()
    if (!session?.user) redirect("/login")

    const userRole = session.user.role || ""
    const permissions = session.user.permissions || []

    const canView =
        ["SuperAdminBP", "AdminBP", "AdminLogistik", "CEO", "FVP", "Finance"].includes(userRole) ||
        permissions.includes("FUEL_VIEW") ||
        permissions.includes("VEHICLE_VIEW") ||
        permissions.includes("RBL_VIEW") ||
        permissions.includes("CRUSHER_VIEW")

    if (!canView) {
        redirect("/admin")
    }

    const isCorporate =
        userRole === "SuperAdminBP" ||
        session.user.roleScope === "ALL_BRANCHES" ||
        ["CEO", "FVP", "Finance"].includes(userRole)

    const canCreate =
        ["SuperAdminBP", "AdminBP", "AdminLogistik", "CEO", "FVP"].includes(userRole) ||
        permissions.includes("FUEL_CREATE") ||
        permissions.includes("VEHICLE_CREATE") ||
        permissions.includes("RBL_CREATE")

    const canDelete =
        ["SuperAdminBP", "CEO", "FVP", "Finance"].includes(userRole) ||
        permissions.includes("FUEL_DELETE")

    // Range default bulan ini
    const now = new Date()
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0]
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0]

    const [masterOptions, initialData] = await Promise.all([
        getFuelMasterOptions(session.user.locationId || undefined),
        getVehicleFuelLogs({
            locationId: isCorporate ? undefined : session.user.locationId || undefined,
            startDate: firstDay,
            endDate: lastDay,
        }),
    ])

    return (
        <FuelClient
            initialItems={initialData.items}
            initialStats={initialData.stats}
            locations={masterOptions.locations}
            vehicles={masterOptions.vehicles}
            drivers={masterOptions.drivers}
            currentLocationId={session.user.locationId || ""}
            isCorporate={isCorporate}
            canCreate={canCreate}
            canDelete={canDelete}
        />
    )
}
