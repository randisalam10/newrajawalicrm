import { getKaryawans } from "./actions"
import { KaryawanClient } from "./karyawan-client"
import { getLocations } from "../cabang/actions"
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { hasPermission } from "@/lib/rbac"

export default async function KaryawanPage() {
    const session = await auth()
    if (!session?.user) redirect("/login")

    const role = session.user.role || "OperatorBP"
    const canView = hasPermission(session.user, "MASTER_DATA", "VIEW") || ["SuperAdminBP", "AdminBP", "CEO", "FVP"].includes(role)
    if (!canView) redirect("/admin")

    const canManage = (role === "SuperAdminBP" || role === "AdminBP") && !["CEO", "FVP", "Approver"].includes(role)

    const [data, locations] = await Promise.all([
        getKaryawans(),
        getLocations()
    ])

    return (
        <div className="space-y-6">
            <div className="flex flex-col space-y-1">
                <div className="flex items-center gap-3">
                    <h1 className="text-3xl font-bold tracking-tight">Data Karyawan</h1>
                    {!canManage && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                            Mode Pemantauan (Hanya Lihat)
                        </span>
                    )}
                </div>
                <p className="text-slate-500">Kelola master data Pegawai (Sopir, Operator, Admin).</p>
            </div>

            <KaryawanClient initialData={data} locations={locations} userRole={role} canManage={canManage} />
        </div>
    )
}
