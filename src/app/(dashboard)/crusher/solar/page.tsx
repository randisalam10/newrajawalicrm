import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { CrusherSolarClient } from "./crusher-solar-client"
import { getCrusherDailyReport } from "../actions"

import { resolveCrusherLocation } from "../utils/crusher-location-helper"
import { getCrusherVehicles } from "../actions"

export const metadata = {
    title: "Pengisian BBM (Solar) - Stone Crusher",
    description: "Monitoring pengisian solar alat berat dan truk di stone crusher.",
}

export default async function CrusherSolarPage(props: {
    searchParams?: Promise<{ locationId?: string; date?: string }>
}) {
    const session = await auth()
    if (!session?.user) redirect("/login")

    const userRole = session.user.role || ""
    const permissions = session.user.permissions || []
    const userRoleLower = userRole.toLowerCase()
    const isCrusherRole = userRoleLower === "operatorcrusher" || userRoleLower === "admincrusher" || userRoleLower.includes("crusher") || userRoleLower.startsWith("sc")

    const hasAccess = ["SuperAdminBP", "AdminBP", "AdminCrusher", "OperatorCrusher", "CEO", "FVP"].includes(userRole) ||
        isCrusherRole ||
        permissions.some(p => p.startsWith("CRUSHER_"))

    if (!hasAccess) {
        if (permissions.includes("LOGISTIK_VIEW")) redirect("/logistik")
        redirect("/admin")
    }

    const searchParams = props.searchParams ? await props.searchParams : {}
    const todayStr = searchParams.date || new Date().toISOString().split("T")[0]

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

    const [initialReport, dbVehicles] = await Promise.all([
        activeLocationId ? getCrusherDailyReport(todayStr, activeLocationId) : null,
        getCrusherVehicles(activeLocationId),
    ])

    return (
        <CrusherSolarClient
            initialReport={initialReport}
            initialDate={todayStr}
            locationId={activeLocationId}
            locationName={activeLocationName}
            vehicles={dbVehicles}
            locations={crusherLocations}
        />
    )
}
