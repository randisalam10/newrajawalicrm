import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
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

    let hasLogistikAccess = session.user.role === "SuperAdminBP" || session.user.role === "AdminLogistik"

    if (!hasLogistikAccess && session.user.id) {
        const dbUser = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: {
                role: true,
                roleRef: {
                    include: {
                        permissions: {
                            include: { permission: true }
                        }
                    }
                }
            }
        })

        const perms = dbUser?.roleRef?.permissions.map(rp => rp.permission.code) || session.user.permissions || []
        hasLogistikAccess = dbUser?.role === "SuperAdminBP" || 
            dbUser?.role === "AdminLogistik" || 
            perms.includes("LOGISTIK_VIEW") ||
            perms.includes("LOGISTIK_CREATE") ||
            perms.includes("LOGISTIK_APPROVE")
    }

    if (!hasLogistikAccess) {
        redirect("/admin")
    }

    return <>{children}</>
}
