import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { BillingReportClient } from "./billing-client"

export default async function BillingReportPage() {
    const session = await auth()
    if (!session?.user) redirect("/login")

    const role = session.user.role
    if (role !== 'AdminBP' && role !== 'SuperAdminBP') redirect("/login")

    // Fetch master data for filters
    let locations: any[] = []
    let customers: any[] = []

    if (role === 'SuperAdminBP') {
        locations = await (prisma as any).location.findMany({ orderBy: { name: 'asc' } })
        customers = await (prisma as any).customer.findMany({ orderBy: { customer_name: 'asc' } })
    } else if (session.user.locationId) {
        locations = await (prisma as any).location.findMany({ where: { id: session.user.locationId } })
        customers = await (prisma as any).customer.findMany({
            where: { locationId: session.user.locationId },
            orderBy: { customer_name: 'asc' }
        })
    }

    return (
        <div className="p-6 max-w-[1600px] w-full mx-auto space-y-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">Rekap Tagihan Customer</h1>
                <p className="text-slate-500">
                    Laporan volume pengecoran berdasarkan data transaksi (Surat Jalan yang telah di konfirmasi).
                </p>
            </div>

            <BillingReportClient
                locations={locations}
                customers={customers}
                userRole={role}
                userLocationId={session.user.locationId}
            />
        </div>
    )
}
