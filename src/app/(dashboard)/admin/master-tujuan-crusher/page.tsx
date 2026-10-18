import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { MasterTujuanClient } from "./master-tujuan-client"
import { getCrusherDestinations } from "@/app/(dashboard)/crusher/actions"
import { getCrusherLocationsForRetase } from "../retase-crusher/actions"

export const metadata = {
    title: "Master Tujuan Non-BP (Stone Crusher) - New Rajawali",
    description: "Pengelolaan master tujuan dan estimasi jarak pengiriman luar stone crusher.",
}

export default async function MasterTujuanCrusherPage(props: {
    searchParams?: Promise<{ locationId?: string }>
}) {
    const session = await auth()
    if (!session?.user) redirect("/login")

    const userRole = session.user.role || ""
    const permissions = session.user.permissions || []

    const hasAccess =
        ["SuperAdminBP", "AdminBP", "CEO", "FVP", "Finance", "AdminLogistik"].includes(userRole) ||
        permissions.some(
            (p) =>
                p.startsWith("RETASE_") ||
                p.startsWith("CRUSHER_") ||
                p.startsWith("FINANCE_")
        )

    if (!hasAccess) redirect("/admin")

    const searchParams = props.searchParams ? await props.searchParams : {}

    const [locations, destinations] = await Promise.all([
        getCrusherLocationsForRetase(),
        getCrusherDestinations(searchParams.locationId),
    ])

    return (
        <MasterTujuanClient
            initialDestinations={destinations}
            locations={locations}
        />
    )
}
