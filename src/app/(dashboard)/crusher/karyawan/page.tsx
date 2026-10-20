import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { CrusherKaryawanClient } from "./crusher-karyawan-client"
import { getCrusherEmployees } from "../actions"

import { resolveCrusherLocation } from "../utils/crusher-location-helper"

export const metadata = {
    title: "Master Karyawan - Stone Crusher",
    description: "Master karyawan sopir dump truck dan operator stone crusher terhubung sistem pusat.",
}

export default async function CrusherKaryawanPage(props: {
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
        permissions.some(p => p.startsWith("CRUSHER_") || p.startsWith("KARYAWAN_"))

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

    const employees = await getCrusherEmployees(activeLocationId)

    const canAccessHQ = ["SuperAdminBP", "AdminBP", "CEO", "FVP"].includes(userRole) ||
        permissions.includes("KARYAWAN_VIEW")

    return (
        <CrusherKaryawanClient
            initialEmployees={employees}
            locationId={activeLocationId}
            locationName={activeLocationName}
            canAccessHQ={canAccessHQ}
            locations={crusherLocations}
        />
    )
}
