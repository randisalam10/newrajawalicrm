import { getMutu } from "./actions"
import { MutuClient } from "./mutu-client"
import { getLocations } from "../cabang/actions"
import { auth } from "@/auth"
import { isCorporateUser, hasPermission } from "@/lib/rbac"
import { Eye } from "lucide-react"
import { redirect } from "next/navigation"

export default async function MutuPage() {
    const session = await auth()
    if (!session?.user) redirect("/login")

    const userRole = session.user.role || "OperatorBP"
    const canView = userRole === "SuperAdminBP" ||
        hasPermission(session.user, "MUTU", "VIEW") ||
        (["AdminBP", "CEO", "FVP"].includes(userRole) && userRole !== "AdminLogistik")

    if (!canView) {
        redirect(userRole === "AdminLogistik" ? "/logistik" : "/admin")
    }

    const [data, locations] = await Promise.all([
        getMutu(),
        getLocations()
    ])
    const isCorporate = isCorporateUser(session.user)
    const canManage = userRole === "SuperAdminBP" || (
        !["CEO", "FVP", "Approver"].includes(userRole) && (
            userRole === "AdminBP" ||
            hasPermission(session.user, "MUTU", "CREATE") ||
            hasPermission(session.user, "MUTU", "EDIT")
        )
    )

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex flex-col space-y-1">
                    <h1 className="text-3xl font-bold tracking-tight">Mutu Beton</h1>
                    <p className="text-slate-500">Kelola spesifikasi campuran komposisi mutu beton.</p>
                </div>
                {!canManage && (
                    <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-800 px-3 py-1.5 rounded-lg text-xs font-medium w-fit">
                        <Eye className="w-4 h-4 text-amber-600" />
                        <span>Mode Pemantauan (Hanya Lihat)</span>
                    </div>
                )}
            </div>

            <MutuClient
                initialData={data}
                locations={locations}
                userRole={userRole}
                canManage={canManage}
                isCorporate={isCorporate}
            />
        </div>
    )
}
