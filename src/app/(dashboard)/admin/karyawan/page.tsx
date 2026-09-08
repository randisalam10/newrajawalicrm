import { getKaryawans } from "./actions"
import { KaryawanClient } from "./karyawan-client"
import { getLocations } from "../cabang/actions"
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { hasPermission } from "@/lib/rbac"

export default async function KaryawanPage() {
    const session = await auth()
    if (!session?.user) redirect("/login")

    const role = session.user.role || "OperatorBP"
    const canView = hasPermission(session.user, "MASTER_DATA", "VIEW") || ["SuperAdminBP", "AdminBP", "CEO", "FVP"].includes(role)
    if (!canView) redirect("/admin")

    const canManage = (role === "SuperAdminBP" || role === "AdminBP") && !["CEO", "FVP", "Approver"].includes(role)

    const [data, locations] = await Promise.all([
        getKaryawans(),
        getLocations()
    ])

    return (
        <div className="space-y-6">
            <KaryawanClient initialData={data} locations={locations} userRole={role} canManage={canManage} />
        </div>
    )
}
