import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { CrusherMaterialInClient } from "./crusher-material-in-client"
import { getCrusherDailyReport, getCrusherMaterialSources, getCrusherEmployees, getCrusherVehicles } from "../actions"
import { todayJakarta } from "../mesin/utils/mesin-date"

import { resolveCrusherLocation } from "../utils/crusher-location-helper"

export const metadata = {
    title: "Material Masuk - Stone Crusher",
    description: "Pencatatan material mentah dan cold bin stone crusher.",
}

export default async function CrusherMaterialInPage(props: {
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
    const todayStr = searchParams.date || todayJakarta()

    const {
        activeLocationId,
        activeLocationName,
        locations: crusherLocations,
    } = await resolveCrusherLocation(
        searchParams.locationId,
        session.user.locationId,
        userRole,
        session.user.roleScope
    )

    const initialReport = activeLocationId ? await getCrusherDailyReport(todayStr, activeLocationId) : null
    const sources = await getCrusherMaterialSources()
    const employees = await getCrusherEmployees(activeLocationId)
    const dbVehicles = await getCrusherVehicles(activeLocationId)
    const canViewWages = ["SuperAdminBP", "CEO", "FVP", "Finance"].includes(userRole) ||
        permissions.includes("CRUSHER_WAGES_VIEW") ||
        permissions.includes("FINANCE_VIEW")

    return (
        <CrusherMaterialInClient
            initialReport={initialReport}
            initialDate={todayStr}
            locationId={activeLocationId}
            locationName={activeLocationName}
            sources={sources}
            vehicles={dbVehicles}
            employees={employees}
            locations={crusherLocations}
            canViewWages={canViewWages}
        />
    )
}
