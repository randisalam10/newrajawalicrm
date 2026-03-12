import { auth } from "@/auth"
import { redirect } from "next/navigation"

export default async function LogistikLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const session = await auth()

    if (!session?.user) {
        redirect("/login")
    }

    const allowedRoles = ["SuperAdminBP", "AdminLogistik"]
    if (!allowedRoles.includes(session.user.role as string)) {
        redirect("/admin")
    }

    return <>{children}</>
}
