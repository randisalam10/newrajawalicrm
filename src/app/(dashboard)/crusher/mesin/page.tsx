import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { CrusherMesinClient } from "./crusher-mesin-client"
import { getCrusherDailyReport } from "../actions"
import type { CrusherDailyReportData } from "../types"
import { getCrusherMachineHistory, getPreviousCrusherHm } from "./actions"
import type { MachineHistoryRow, PreviousHm } from "./types"
import { todayJakarta } from "./utils/mesin-date"

import { resolveCrusherLocation } from "../utils/crusher-location-helper"

export const metadata = {
    title: "Jam Mesin & Downtime - Stone Crusher",
    description: "Pencatatan HM kerja dan jam rusak mesin stone crusher.",
}

export default async function CrusherMesinPage(props: {
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

    const [initialReport, initialHistory, initialPrevHm]: [CrusherDailyReportData | null, MachineHistoryRow[], PreviousHm] = activeLocationId
        ? await Promise.all([
            getCrusherDailyReport(todayStr, activeLocationId),
            getCrusherMachineHistory(todayStr.slice(0, 7), activeLocationId),
            getPreviousCrusherHm(todayStr, activeLocationId),
        ])
        : [null, [], null]

    return (
        <CrusherMesinClient
            initialReport={initialReport}
            initialHistory={initialHistory}
            initialPrevHm={initialPrevHm}
            initialDate={todayStr}
            locationId={activeLocationId}
            locationName={activeLocationName}
            locations={crusherLocations}
        />
    )
}
