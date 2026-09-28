import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { MaterialReportClient } from "./material-report-client"

export const dynamic = "force-dynamic"

export const metadata = {
    title: "Laporan Biaya Material | RajawaliMix",
    description: "Analisa akumulasi nilai pokok material agregat, ongkos retase Dump Truck, dan biaya mendarat riil (landed cost).",
}

export default async function MaterialReportPage() {
    const session = await auth()
    if (!session?.user) redirect("/login")

    const role = session.user.role || ""
    const isSuperAdmin = role === "SuperAdminBP" || ["CEO", "FVP"].includes(role)
    const isAdminYoutefa = role === "AdminBP" || role === "Admin"
    const isLogistik = role === "AdminLogistik"
    const hasPerm = (session.user as any).permissions?.some((p: string) =>
        ["REPORTS_VIEW", "MATERIAL_AGREGAT_VIEW", "MATERIAL_VIEW"].includes(p)
    )

    if (!isSuperAdmin && !isAdminYoutefa && !isLogistik && !hasPerm) {
        redirect("/admin")
    }

    // Fetch master locations
    let locations: any[] = []
    if (isSuperAdmin) {
        locations = await prisma.location.findMany({
            select: { id: true, name: true },
            orderBy: { name: "asc" }
        })
    } else if (session.user.locationId) {
        locations = await prisma.location.findMany({
            where: { id: session.user.locationId },
            select: { id: true, name: true }
        })
    }

    return (
        <div className="space-y-6">
            <MaterialReportClient
                locations={locations}
                userRole={role}
                userLocationId={session.user.locationId || null}
            />
        </div>
    )
}
