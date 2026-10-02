import { getDashboardData } from "./actions"
import { DashboardClient } from "./dashboard-client"
import { redirect } from "next/navigation"

export const dynamic = 'force-dynamic'

export default async function AdminDashboardPage({
    searchParams,
}: {
    searchParams: Promise<{ month?: string }>
}) {
    const params = await searchParams
    const data = await getDashboardData(params?.month)

    if (!data) {
        redirect("/login")
    }

    return <DashboardClient data={data as any} />
}
