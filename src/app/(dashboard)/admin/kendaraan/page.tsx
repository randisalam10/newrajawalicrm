import { getKendaraan } from "./actions"
import { KendaraanClient } from "./kendaraan-client"
import { getLocations } from "../cabang/actions"
import { auth } from "@/auth"
import { isCorporateUser } from "@/lib/rbac"
import { Eye } from "lucide-react"

export default async function KendaraanPage() {
    const session = await auth()
    const [data, locations] = await Promise.all([
        getKendaraan(),
        getLocations()
    ])
    const userRole = session?.user?.role || "OperatorBP"
    const isCorporate = isCorporateUser(session?.user)
    const canManage = !["CEO", "FVP", "Approver"].includes(userRole) && ["SuperAdminBP", "AdminBP"].includes(userRole)

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex flex-col space-y-1">
                    <h1 className="text-3xl font-bold tracking-tight">Data Kendaraan</h1>
                    <p className="text-slate-500">Kelola master data armada (Truk Mixer & Loader).</p>
                </div>
                {!canManage && (
                    <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-800 px-3 py-1.5 rounded-lg text-xs font-medium w-fit">
                        <Eye className="w-4 h-4 text-amber-600" />
                        <span>Mode Pemantauan (Hanya Lihat)</span>
                    </div>
                )}
            </div>

            <KendaraanClient
                initialData={data}
                locations={locations}
                userRole={userRole}
                canManage={canManage}
                isCorporate={isCorporate}
            />
        </div>
    )
}
