import { getKaryawans, getDriverCategories } from "./actions"
import { KaryawanClient } from "./karyawan-client"
import { getLocations } from "../cabang/actions"
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { hasPermission } from "@/lib/rbac"

export default async function KaryawanPage() {
    const session = await auth()
    if (!session?.user) redirect("/login")

    const role = session.user.role || "OperatorBP"
    const canView = role === "SuperAdminBP" ||
        hasPermission(session.user, "KARYAWAN", "VIEW") ||
        (["AdminBP", "CEO", "FVP"].includes(role) && role !== "AdminLogistik")

    if (!canView) {
        redirect(role === "AdminLogistik" ? "/logistik" : "/admin")
    }

    const canManage = role === "SuperAdminBP" || (
        !["CEO", "FVP", "Approver"].includes(role) && (
            role === "AdminBP" ||
            hasPermission(session.user, "KARYAWAN", "CREATE") ||
            hasPermission(session.user, "KARYAWAN", "EDIT")
        )
    )

    const [data, locations, driverCategories] = await Promise.all([
        getKaryawans(),
        getLocations(),
        getDriverCategories()
    ])

    return (
        <div className="space-y-6">
            <KaryawanClient initialData={data} locations={locations} driverCategories={driverCategories} userRole={role} canManage={canManage} />
        </div>
    )
}
