import { auth } from "@/auth"
import { resolveUserDashboard } from "@/auth.config"
import { getDashboardData } from "./actions"
import { DashboardClient } from "./dashboard-client"
import { redirect } from "next/navigation"

export const dynamic = 'force-dynamic'

export default async function AdminDashboardPage({
    searchParams,
}: {
    searchParams: Promise<{ month?: string }>
}) {
    const session = await auth()
    if (!session?.user) {
        redirect("/login")
    }

    const params = await searchParams
    const data = await getDashboardData(params?.month)

    if (!data) {
        const target = resolveUserDashboard(session.user.role, session.user.permissions)
        if (target !== '/admin') {
            redirect(target)
        }
        redirect("/login")
    }

    return <DashboardClient data={data as any} />
}
