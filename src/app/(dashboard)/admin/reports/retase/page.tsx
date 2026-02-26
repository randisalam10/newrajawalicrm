import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { RetaseReportClient } from "./retase-client"
import { getRetaseAvailableYears } from "./actions"

export const dynamic = 'force-dynamic'

export default async function RetaseReportPage() {
    const session = await auth()
    if (!session?.user) redirect("/login")

    const role = session.user.role
    if (role !== 'AdminBP' && role !== 'SuperAdminBP') redirect("/login")

    // Fetch master data for filters
    let locations: any[] = []

    if (role === 'SuperAdminBP') {
        locations = await (prisma as any).location.findMany({ orderBy: { name: 'asc' } })
    } else if (session.user.locationId) {
        locations = await (prisma as any).location.findMany({ where: { id: session.user.locationId } })
    }

    // Fetch available years dari data yang ada
    const availableYears = await getRetaseAvailableYears()

    return (
        <div className="space-y-6">
            <RetaseReportClient
                locations={locations}
                availableYears={availableYears}
                userRole={role}
                userLocationId={session.user.locationId}
            />
        </div>
    )
}
