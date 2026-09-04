import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { getRoles, getAllPermissions } from "./actions"
import { RolesClient } from "./roles-client"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export default async function RolesPage() {
    const session = await auth()

    if (!session?.user) {
        redirect("/login")
    }

    if (session.user.role !== "SuperAdminBP") {
        redirect("/admin")
    }

    const [roles, groupedPermissions, rolePermissionsData] = await Promise.all([
        getRoles(),
        getAllPermissions(),
        prisma.rolePermission.findMany({
            include: { permission: true }
        })
    ])

    // Build roleId -> array of permission codes map
    const initialRolePermissions: Record<string, string[]> = {}
    for (const r of roles) {
        initialRolePermissions[r.id] = []
    }
    for (const rp of rolePermissionsData) {
        if (!initialRolePermissions[rp.roleId]) {
            initialRolePermissions[rp.roleId] = []
        }
        initialRolePermissions[rp.roleId].push(rp.permission.code)
    }

    return (
        <RolesClient
            roles={roles as any}
            groupedPermissions={groupedPermissions as any}
            initialRolePermissions={initialRolePermissions}
        />
    )
}
