import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { RetaseCrusherClient } from "./retase-crusher-client"
import {
    getCrusherRetaseReport,
    getCrusherRetaseSetting,
    getCrusherLocationsForRetase,
} from "./actions"

export const metadata = {
    title: "Retase Stone Crusher - New Rajawali",
    description: "Laporan dan rekap upah retase dump truck stone crusher (Material Masuk Quarry & Material Keluar Non-BP).",
}

export default async function RetaseCrusherPage(props: {
    searchParams?: Promise<{ month?: string; locationId?: string }>
}) {
    const session = await auth()
    if (!session?.user) redirect("/login")

    const userRole = session.user.role || ""
    const permissions = session.user.permissions || []

    const hasAccess =
        ["SuperAdminBP", "AdminBP", "CEO", "FVP", "Finance"].includes(userRole) ||
        permissions.some(
            (p) =>
                p.startsWith("RETASE_") ||
                p.startsWith("CRUSHER_") ||
                p.startsWith("FINANCE_") ||
                p.startsWith("REPORTS_")
        )

    if (!hasAccess) redirect("/admin")

    const searchParams = props.searchParams ? await props.searchParams : {}
    const now = new Date()
    const targetMonth = searchParams.month || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`

    const [locations, initialReport, initialSetting] = await Promise.all([
        getCrusherLocationsForRetase(),
        getCrusherRetaseReport({
            month: targetMonth,
            locationId: searchParams.locationId,
        }),
        getCrusherRetaseSetting(searchParams.locationId),
    ])

    const canManageSettings =
        ["SuperAdminBP", "CEO", "FVP", "Finance"].includes(userRole) ||
        permissions.includes("RETASE_MANAGE") ||
        permissions.includes("FINANCE_VIEW")

    return (
        <RetaseCrusherClient
            initialReport={initialReport}
            initialSetting={initialSetting}
            locations={locations}
            canManageSettings={canManageSettings}
        />
    )
}
