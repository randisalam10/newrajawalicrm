import { getWorkItems } from "./actions"
import { ItemPekerjaanClient } from "./item-pekerjaan-client"
import { getLocations } from "../cabang/actions"
import { auth } from "@/auth"

export default async function ItemPekerjaanPage() {
    const session = await auth()
    const [data, locations] = await Promise.all([
        getWorkItems(),
        getLocations()
    ])
    const userRole = session?.user?.role || "OperatorBP"

    return (
        <div className="space-y-6">
            <div className="flex flex-col space-y-1">
                <h1 className="text-3xl font-bold tracking-tight">Item Pekerjaan</h1>
                <p className="text-slate-500">Kelola master data Item Pekerjaan (Rigid, Kolom, Sloof, dll).</p>
            </div>

            <ItemPekerjaanClient initialData={data} locations={locations} userRole={userRole} />
        </div>
    )
}
