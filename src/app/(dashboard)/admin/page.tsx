import { getDashboardData } from "./actions"
import { DashboardClient } from "./dashboard-client"
import { redirect } from "next/navigation"

export const dynamic = 'force-dynamic'

export default async function AdminDashboardPage() {
    const data = await getDashboardData()

    if (!data) {
        redirect("/login")
    }

    return <DashboardClient data={data} />
}
