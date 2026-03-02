import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { getTransactions, getRetaseSettings } from "./actions"
import { getCustomersForReport } from "@/app/(dashboard)/admin/reports/retase/actions"
import { prisma } from "@/lib/prisma"
import { RetaseClient } from "./retase-client"

export default async function RetasePage() {
    const session = await auth()
    if (!session || !session.user || session.user.role === 'OperatorBP') {
        redirect("/login")
    }

    const role = session.user.role
    const [pendingTransactions, confirmedTransactions, settings, customers] = await Promise.all([
        getTransactions("Pending"),
        getTransactions("Confirmed"),
        getRetaseSettings(),
        getCustomersForReport(),
    ])

    // Fetch locations for SuperAdmin to set generic pricing
    let locations: any[] = []
    if (role === 'SuperAdminBP') {
        locations = await (prisma as any).location.findMany({ orderBy: { name: 'asc' } })
    } else if (session.user.locationId) {
        locations = await (prisma as any).location.findMany({ where: { id: session.user.locationId } })
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">Konfirmasi Retase & Surat Jalan</h1>
                <p className="text-slate-500">Hitung penghasilan sopir dan cetak faktur/surat jalan untuk customer.</p>
            </div>

            <RetaseClient
                pendingTransactions={pendingTransactions}
                confirmedTransactions={confirmedTransactions}
                settings={settings || []}
                locations={locations}
                userRole={role}
                customers={customers}
            />
        </div>
    )
}
