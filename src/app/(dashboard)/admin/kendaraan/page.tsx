import { getKendaraan, getVehicleCategories } from "./actions"
import { KendaraanClient } from "./kendaraan-client"
import { getLocations } from "../cabang/actions"
import { auth } from "@/auth"
import { isCorporateUser, hasPermission } from "@/lib/rbac"
import { Eye } from "lucide-react"
import { redirect } from "next/navigation"

export default async function KendaraanPage() {
    const session = await auth()
    if (!session?.user) redirect("/login")

    const userRole = session.user.role || "OperatorBP"
    const isCorporate = isCorporateUser(session.user)
    const perms = session.user.permissions || []

    const canView = userRole === "SuperAdminBP" || isCorporate ||
        perms.includes("VEHICLE_VIEW") ||
        perms.includes("MASTER_DATA_VIEW") ||
        hasPermission(session.user, "VEHICLE", "VIEW") ||
        ["AdminBP", "AdminLogistik", "CEO", "FVP"].includes(userRole)

    if (!canView) redirect("/admin")

    const canManage = userRole === "SuperAdminBP" || (
        !["CEO", "FVP", "Approver"].includes(userRole) && (
            userRole === "AdminBP" ||
            perms.includes("VEHICLE_CREATE") ||
            perms.includes("VEHICLE_EDIT") ||
            perms.includes("MASTER_DATA_CREATE") ||
            perms.includes("MASTER_DATA_EDIT") ||
            hasPermission(session.user, "VEHICLE", "CREATE") ||
            hasPermission(session.user, "MASTER_DATA", "CREATE")
        )
    )

    const [data, locations, categories] = await Promise.all([
        getKendaraan(),
        getLocations(),
        getVehicleCategories(),
    ])

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex flex-col space-y-1">
                    <h1 className="text-3xl font-bold tracking-tight">Data Kendaraan & Alat</h1>
                    <p className="text-slate-500">Kelola master data armada kendaraan, alat berat, batching plant, genset, dan peralatan operasional.</p>
                </div>
                {!canManage && (
                    <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-800 px-3 py-1.5 rounded-lg text-xs font-medium w-fit">
                        <Eye className="w-4 h-4 text-amber-600" />
                        <span>Mode Pemantauan (Hanya Lihat)</span>
                    </div>
                )}
            </div>

            <KendaraanClient
                initialData={data}
                locations={locations}
                initialCategories={categories}
                userRole={userRole}
                canManage={canManage}
                isCorporate={isCorporate}
            />
        </div>
    )
}
