import { getCustomers } from "./actions"
import { CustomerClient } from "./customer-client"
import { getLocations } from "../cabang/actions"
import { auth } from "@/auth"

export default async function CustomerPage() {
    const session = await auth()
    const [data, locations] = await Promise.all([
        getCustomers(),
        getLocations()
    ])
    const userRole = session?.user?.role || "OperatorBP"

    return (
        <div className="space-y-6">
            <div className="flex flex-col space-y-1">
                <h1 className="text-3xl font-bold tracking-tight">Data Customer</h1>
                <p className="text-slate-500">Kelola master data Customer & Proyek Batching Plant.</p>
            </div>

            <CustomerClient initialData={data} locations={locations} userRole={userRole} />
        </div>
    )
}
