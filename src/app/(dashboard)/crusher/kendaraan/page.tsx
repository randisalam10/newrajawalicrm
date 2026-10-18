import { Suspense } from "react"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { CrusherKendaraanClient } from "./crusher-kendaraan-client"
import { getCrusherVehicles } from "../actions"

import { resolveCrusherLocation } from "../utils/crusher-location-helper"

export const metadata = {
    title: "Master Kendaraan - Stone Crusher",
    description: "Master kendaraan armada dump truck dan alat stone crusher terhubung sistem pusat.",
}

export default async function CrusherKendaraanPage(props: {
    searchParams?: Promise<{ locationId?: string }>
}) {
    const session = await auth()
    if (!session?.user) redirect("/login")

    const userRole = session.user.role || ""
    const permissions = session.user.permissions || []
    const hasAccess = ["SuperAdminBP", "AdminBP", "OperatorCrusher", "CEO", "FVP"].includes(userRole) ||
        permissions.some(p => p.startsWith("CRUSHER_") || p.startsWith("VEHICLE_"))

    if (!hasAccess) redirect("/admin")

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

    const vehicles = await getCrusherVehicles(activeLocationId)

    const canAccessHQ = ["SuperAdminBP", "AdminBP", "CEO", "FVP"].includes(userRole) ||
        permissions.includes("VEHICLE_VIEW")

    return (
        <Suspense fallback={<div className="p-4 text-xs text-slate-400">Memuat data armada...</div>}>
            <CrusherKendaraanClient
                initialVehicles={vehicles}
                locationId={activeLocationId}
                locationName={activeLocationName}
                canAccessHQ={canAccessHQ}
                locations={crusherLocations}
            />
        </Suspense>
    )
}
