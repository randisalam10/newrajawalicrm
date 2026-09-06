import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { MaterialAgregatClient } from "./material-agregat-client"
import { isCorporateUser, getLocationFilter, hasPermission } from "@/lib/rbac"
import { redirect } from "next/navigation"

export const metadata = {
    title: "Material Agregat | BP ERP System",
    description: "Pencatatan material agregat masuk per batching plant",
}

export default async function MaterialAgregatPage() {
    const session = await auth()
    if (!session?.user) {
        redirect("/login")
    }

    const isCorp = isCorporateUser(session.user)
    const isReadOnly = ["CEO", "FVP", "Approver"].includes(session.user.role || "")
    const canManage = !isReadOnly && (
        session.user.role === "SuperAdminBP" ||
        hasPermission(session.user, "MATERIAL_AGREGAT", "CREATE") ||
        hasPermission(session.user, "MATERIAL_AGREGAT", "EDIT")
    )

    const locationFilter = getLocationFilter(session.user)

    const [data, locations] = await Promise.all([
        prisma.aggregateIncoming.findMany({
            where: locationFilter,
            include: { location: true },
            orderBy: { date: "desc" },
        }),
        prisma.location.findMany({ orderBy: { name: "asc" } }),
    ])

    return (
        <div className="p-6 space-y-6">
            <MaterialAgregatClient
                initialData={JSON.parse(JSON.stringify(data))}
                locations={locations}
                userRole={session.user.role as string}
                isCorporate={isCorp}
                canManage={canManage}
                isReadOnly={isReadOnly}
            />
        </div>
    )
}
