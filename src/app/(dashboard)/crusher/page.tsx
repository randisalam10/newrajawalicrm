import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { CrusherClient } from "./crusher-client"
import {
    getCrusherDailyReport,
    getCrusherMaterialSources,
    getCrusherEmployees,
    getCrusherVehicles,
    getBatchingPlantLocations,
} from "./actions"

import { resolveCrusherLocation } from "./utils/crusher-location-helper"

export const metadata = {
    title: "Stone Crusher - New Rajawali CRM",
    description: "Modul operasional harian, monitoring BBM solar, dan pengeluaran material Stone Crusher.",
}

export default async function StoneCrusherPage(props: {
    searchParams?: Promise<{ locationId?: string; date?: string }>
}) {
    const session = await auth()
    if (!session?.user) {
        redirect("/login")
    }

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

    // Prefetch Data Laporan Hari Ini & Batching Plant Relevan
    const [initialReport, sources, employees, dbVehicles, bpLocations] = await Promise.all([
        activeLocationId ? getCrusherDailyReport(todayStr, activeLocationId) : null,
        getCrusherMaterialSources(),
        getCrusherEmployees(activeLocationId),
        getCrusherVehicles(activeLocationId),
        getBatchingPlantLocations(activeLocationId),
    ])

    const canViewWages = ["SuperAdminBP", "CEO", "FVP", "Finance"].includes(userRole) ||
        permissions.includes("CRUSHER_WAGES_VIEW") ||
        permissions.includes("FINANCE_VIEW")

    return (
        <CrusherClient
            initialReport={initialReport}
            initialDate={todayStr}
            locationId={activeLocationId}
            locationName={activeLocationName}
            locations={crusherLocations}
            bpLocations={bpLocations}
            sources={sources}
            vehicles={dbVehicles}
            employees={employees}
            canViewWages={canViewWages}
        />
    )
}
