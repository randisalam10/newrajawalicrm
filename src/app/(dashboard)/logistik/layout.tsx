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

    const allowedRoles = [
        "SuperAdminBP",
        "AdminLogistik",
        "AdminBP",
        "AdminCrusher",
        "OperatorCrusher",
        "CEO",
        "FVP",
        "Approver"
    ]
    let hasLogistikAccess = allowedRoles.includes(session.user.role || "")

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

        const role = dbUser?.role || session.user.role || ""
        const perms = dbUser?.roleRef?.permissions.map(rp => rp.permission.code) || session.user.permissions || []
        hasLogistikAccess = allowedRoles.includes(role) || 
            perms.includes("LOGISTIK_VIEW") ||
            perms.includes("LOGISTIK_CREATE") ||
            perms.includes("LOGISTIK_APPROVE") ||
            perms.some(p => p.startsWith("CRUSHER_"))
    }

    if (!hasLogistikAccess) {
        const fallbackTarget = session.user.role === "OperatorBP" ? "/operator" : (session.user.role === "OperatorCrusher" ? "/crusher" : "/admin")
        redirect(fallbackTarget)
    }

    return <>{children}</>
}
