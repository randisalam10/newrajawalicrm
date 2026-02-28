import { getPlans, getPlanMasters } from "./actions"
import { PlanningClient } from "./planning-client"

export const dynamic = 'force-dynamic'

export default async function PlanningPage() {
    const [plans, masters] = await Promise.all([
        getPlans(),
        getPlanMasters(),
    ])

    return (
        <div className="space-y-6">
            <div className="flex flex-col space-y-1">
                <h1 className="text-3xl font-bold tracking-tight">Planning Pengecoran</h1>
                <p className="text-slate-500">Kelola rencana pengecoran harian — jadwal, mutu beton, dan volume target.</p>
            </div>
            <PlanningClient plans={plans} masters={masters} />
        </div>
    )
}
