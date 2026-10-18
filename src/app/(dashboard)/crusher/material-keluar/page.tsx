import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { CrusherMaterialOutClient } from "./crusher-material-out-client"
import { getCrusherDailyReport, getBatchingPlantLocations, getCrusherVehicles, getCrusherEmployees, getCrusherDestinations } from "../actions"
import { resolveCrusherLocation } from "../utils/crusher-location-helper"

export const metadata = {
    title: "Material Keluar - Stone Crusher",
    description: "Pencatatan pengiriman material ke batching plant dan penjualan bebas stone crusher.",
}

export default async function CrusherMaterialOutPage(props: {
    searchParams?: Promise<{ locationId?: string; date?: string }>
}) {
    const session = await auth()
    if (!session?.user) redirect("/login")

    const userRole = session.user.role || ""
    const permissions = session.user.permissions || []
    const hasAccess = ["SuperAdminBP", "AdminBP", "OperatorCrusher", "CEO", "FVP"].includes(userRole) ||
        permissions.some(p => p.startsWith("CRUSHER_"))

    if (!hasAccess) redirect("/admin")

    const searchParams = props.searchParams ? await props.searchParams : {}
    const todayStr = searchParams.date || new Date().toISOString().split("T")[0]

    const crusherLocResult = await resolveCrusherLocation(
        searchParams.locationId,
        session.user.locationId,
        userRole,
        session.user.roleScope
    )

    const {
        activeLocationId,
        activeLocationName,
        locations: crusherLocations,
    } = crusherLocResult

    const [bpLocations, initialReport, vehicles, employees, destinations] = await Promise.all([
        getBatchingPlantLocations(activeLocationId),
        activeLocationId ? getCrusherDailyReport(todayStr, activeLocationId) : null,
        getCrusherVehicles(activeLocationId),
        getCrusherEmployees(activeLocationId),
        getCrusherDestinations(activeLocationId),
    ])

    const canViewWages = ["SuperAdminBP", "CEO", "FVP", "Finance"].includes(userRole) ||
        permissions.includes("CRUSHER_WAGES_VIEW") ||
        permissions.includes("FINANCE_VIEW")

    return (
        <CrusherMaterialOutClient
            initialReport={initialReport}
            initialDate={todayStr}
            locationId={activeLocationId}
            locationName={activeLocationName}
            locations={bpLocations}
            crusherLocations={crusherLocations}
            vehicles={vehicles}
            employees={employees}
            destinations={destinations}
            canViewWages={canViewWages}
        />
    )
}
