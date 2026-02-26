import { getKendaraan } from "./actions"
import { KendaraanClient } from "./kendaraan-client"
import { getLocations } from "../cabang/actions"
import { auth } from "@/auth"

export default async function KendaraanPage() {
    const session = await auth()
    const [data, locations] = await Promise.all([
        getKendaraan(),
        getLocations()
    ])
    const userRole = session?.user?.role || "OperatorBP"

    return (
        <div className="space-y-6">
            <div className="flex flex-col space-y-1">
                <h1 className="text-3xl font-bold tracking-tight">Data Kendaraan</h1>
                <p className="text-slate-500">Kelola master data armada (Truk Mixer & Loader).</p>
            </div>

            <KendaraanClient initialData={data} locations={locations} userRole={userRole} />
        </div>
    )
}
