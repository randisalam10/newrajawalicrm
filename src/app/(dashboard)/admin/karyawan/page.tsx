import { getKaryawans } from "./actions"
import { KaryawanClient } from "./karyawan-client"
import { getLocations } from "../cabang/actions"
import { auth } from "@/auth"

export default async function KaryawanPage() {
    const session = await auth()
    const [data, locations] = await Promise.all([
        getKaryawans(),
        getLocations()
    ])
    const userRole = session?.user?.role || "OperatorBP"

    return (
        <div className="space-y-6">
            <div className="flex flex-col space-y-1">
                <h1 className="text-3xl font-bold tracking-tight">Data Karyawan</h1>
                <p className="text-slate-500">Kelola master data Pegawai (Sopir, Operator, Admin).</p>
            </div>

            <KaryawanClient initialData={data} locations={locations} userRole={userRole} />
        </div>
    )
}
