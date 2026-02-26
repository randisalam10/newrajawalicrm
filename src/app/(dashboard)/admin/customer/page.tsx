import { getCustomers } from "./actions"
import { CustomerClient } from "./customer-client"

export default async function CustomerPage() {
    const data = await getCustomers()

    return (
        <div className="space-y-6">
            <div className="flex flex-col space-y-1">
                <h1 className="text-3xl font-bold tracking-tight">Data Customer</h1>
                <p className="text-slate-500">Kelola master data Customer & Proyek Batching Plant.</p>
            </div>

            <CustomerClient initialData={data} />
        </div>
    )
}
