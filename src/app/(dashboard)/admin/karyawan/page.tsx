import { getKaryawans } from "./actions"
import { KaryawanClient } from "./karyawan-client"

export default async function KaryawanPage() {
    const data = await getKaryawans()

    return (
        <div className="space-y-6">
            <div className="flex flex-col space-y-1">
                <h1 className="text-3xl font-bold tracking-tight">Data Karyawan</h1>
                <p className="text-slate-500">Kelola master data Pegawai (Sopir, Operator, Admin).</p>
            </div>

            <KaryawanClient initialData={data} />
        </div>
    )
}
