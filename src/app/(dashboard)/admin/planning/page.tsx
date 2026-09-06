import { getPlans, getPlanMasters } from "./actions"
import { PlanningClient } from "./planning-client"
import { auth } from "@/auth"
import { Eye } from "lucide-react"

export const dynamic = 'force-dynamic'

export default async function PlanningPage() {
    const session = await auth()
    const userRole = session?.user?.role || "OperatorBP"
    const canManage = !["CEO", "FVP", "Approver"].includes(userRole) && ["SuperAdminBP", "AdminBP"].includes(userRole)

    const [plans, masters] = await Promise.all([
        getPlans(),
        getPlanMasters(),
    ])

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex flex-col space-y-1">
                    <h1 className="text-3xl font-bold tracking-tight">Planning Pengecoran</h1>
                    <p className="text-slate-500">Kelola rencana pengecoran harian — jadwal, mutu beton, dan volume target.</p>
                </div>
                {!canManage && (
                    <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-800 px-3 py-1.5 rounded-lg text-xs font-medium w-fit">
                        <Eye className="w-4 h-4 text-amber-600" />
                        <span>Mode Pemantauan (Hanya Lihat)</span>
                    </div>
                )}
            </div>
            <PlanningClient plans={plans} masters={masters} canManage={canManage} />
        </div>
    )
}
