import { getBillingPageData } from "./actions"
import { BillingClient } from "./billing-client"
import { getLocations } from "../cabang/actions"
import { auth } from "@/auth"
import { redirect } from "next/navigation"

export default async function BillingPage() {
    const session = await auth()
    if (!session?.user) redirect("/login")
    if (!["AdminBP", "SuperAdminBP"].includes(session.user.role))
        redirect("/admin")

    const [data, locations] = await Promise.all([
        getBillingPageData(),
        getLocations(),
    ])

    return (
        <div className="space-y-6">
            <div className="flex flex-col space-y-1">
                <h1 className="text-3xl font-bold tracking-tight">Tagihan & Invoice</h1>
                <p className="text-slate-500">Kelola invoice, catat pembayaran, dan monitor saldo deposito pelanggan.</p>
            </div>
            <BillingClient
                initialData={data}
                locations={locations}
                userRole={session.user.role}
                userLocationId={session.user.locationId ?? ""}
            />
        </div>
    )
}
