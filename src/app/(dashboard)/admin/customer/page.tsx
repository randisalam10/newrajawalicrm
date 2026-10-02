import { getCustomersWithProjects, getConcreteQualitiesForLocation } from "./actions"
import { CustomerClient } from "./customer-client"
import { getLocations } from "../cabang/actions"
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { hasPermission, isCorporateUser } from "@/lib/rbac"

export const dynamic = "force-dynamic"

export default async function CustomerPage() {
    const session = await auth()
    if (!session?.user) redirect("/login")

    const role = session.user.role || ""
    const canView = hasPermission(session.user, "CUSTOMER", "VIEW") || ["CEO", "FVP", "AdminBP", "SuperAdminBP"].includes(role)
    if (!canView) redirect("/admin")

    const isSuperAdmin = session.user.role === "SuperAdminBP"
    const canCreate = (hasPermission(session.user, "CUSTOMER", "CREATE") || ["SuperAdminBP", "AdminBP"].includes(role)) && !["CEO", "FVP", "Approver"].includes(role)
    const canEdit = (hasPermission(session.user, "CUSTOMER", "EDIT") || ["SuperAdminBP", "AdminBP"].includes(role)) && !["CEO", "FVP", "Approver"].includes(role)
    const canDelete = (hasPermission(session.user, "CUSTOMER", "DELETE") || ["SuperAdminBP", "AdminBP"].includes(role)) && !["CEO", "FVP", "Approver"].includes(role)

    const [data, locations, qualities] = await Promise.all([
        getCustomersWithProjects(),
        getLocations(),
        getConcreteQualitiesForLocation(),
    ])

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between pb-0.5">
                <div className="flex items-center gap-2.5">
                    <h1 className="text-xl font-bold tracking-tight text-slate-900">Data Customer & Proyek</h1>
                    {!canCreate && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                            Hanya Lihat
                        </span>
                    )}
                </div>
            </div>

            <CustomerClient
                initialData={data}
                locations={locations}
                userRole={session.user.role}
                qualities={qualities}
                canCreate={canCreate}
                canEdit={canEdit}
                canDelete={canDelete}
            />
        </div>
    )
}
