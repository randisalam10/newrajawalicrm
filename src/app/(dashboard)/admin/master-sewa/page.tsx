import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { getMasterSewaAlat } from "../sewa/actions"
import { getLocations } from "../cabang/actions"
import { MasterSewaClient } from "./master-sewa-client"
import { hasPermission, isCorporateUser } from "@/lib/rbac"
import { Eye } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function MasterSewaPage() {
    const session = await auth()
    if (!session?.user) redirect("/login")

    const role = session.user.role || "OperatorBP"
    const canView = hasPermission(session.user, "MASTER_DATA", "VIEW") ||
        Boolean(session.user.permissions?.includes("SEWA_VIEW")) ||
        ["SuperAdminBP", "AdminBP", "CEO", "FVP"].includes(role)

    if (!canView) redirect("/admin")

    const canManage = (role === "SuperAdminBP" || role === "AdminBP") && !["CEO", "FVP", "Approver"].includes(role)
    const isCorporate = isCorporateUser(session.user)

    const [equipments, locations] = await Promise.all([
        getMasterSewaAlat(),
        getLocations()
    ])

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
                        Master Sewa Alat & Kendaraan
                    </h1>
                </div>
                {!canManage && (
                    <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-800 px-3 py-1.5 rounded-lg text-xs font-medium w-fit">
                        <Eye className="w-4 h-4 text-amber-600" />
                        <span>Mode Pemantauan (Hanya Lihat)</span>
                    </div>
                )}
            </div>

            <MasterSewaClient
                initialEquipments={equipments}
                locations={locations}
                canManage={canManage}
                isCorporate={isCorporate}
            />
        </div>
    )
}
