import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { CrusherSumberClient } from "./crusher-sumber-client"
import { getCrusherMaterialSources } from "../actions"

import { resolveCrusherLocation } from "../utils/crusher-location-helper"

export const metadata = {
    title: "Master Sumber Material - Stone Crusher",
    description: "Master data quarry dan titik ambil material stone crusher.",
}

export default async function CrusherSumberPage(props: {
    searchParams?: Promise<{ locationId?: string }>
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

    const sources = await getCrusherMaterialSources()

    return (
        <CrusherSumberClient
            initialSources={sources}
            locationName={activeLocationName}
            locations={crusherLocations}
            locationId={activeLocationId}
        />
    )
}
