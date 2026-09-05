import { getCustomersWithProjects, getConcreteQualitiesForLocation } from "./actions"
import { CustomerClient } from "./customer-client"
import { getLocations } from "../cabang/actions"
import { auth } from "@/auth"

export const dynamic = "force-dynamic"

export default async function CustomerPage() {
    const session = await auth()
    const isSuperAdmin = session?.user?.role === "SuperAdminBP" || session?.user?.roleScope === "ALL_BRANCHES" || ["CEO", "FVP"].includes(session?.user?.role || "")
    const userRole = isSuperAdmin ? "SuperAdminBP" : (session?.user?.role || "OperatorBP")

    const [data, locations, qualities] = await Promise.all([
        getCustomersWithProjects(),
        getLocations(),
        getConcreteQualitiesForLocation(),
    ])

    return (
        <div className="space-y-6">
            <div className="flex flex-col space-y-1">
                <h1 className="text-3xl font-bold tracking-tight">Data Customer & Proyek</h1>
                <p className="text-slate-500">Kelola master data Customer & Proyek Batching Plant.</p>
            </div>

            <CustomerClient initialData={data} locations={locations} userRole={userRole} qualities={qualities} />
        </div>
    )
}
