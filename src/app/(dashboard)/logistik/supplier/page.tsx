import { getSuppliersData, getLocationsForLogistik } from "./actions"
import { SupplierClient } from "./supplier-client"
import { auth } from "@/auth"
import { Eye, Store } from "lucide-react"
import { isLogistikCentralUser } from "@/lib/logistik-scoping"

export default async function SupplierPage() {
    const session = await auth()
    const user = session?.user
    const userRole = user?.role || ""
    const permissions: string[] = (user as any)?.permissions || []
    const isRestricted = ["CEO", "FVP", "Approver"].includes(userRole)
    const canManage = !isRestricted && (
        ["SuperAdminBP", "AdminBP", "AdminLogistik", "OperatorCrusher", "AdminCrusher"].includes(userRole) ||
        permissions.includes("LOGISTIK_CREATE") ||
        permissions.includes("LOGISTIK_EDIT") ||
        permissions.includes("CRUSHER_VIEW")
    )

    const isCentral = isLogistikCentralUser(session?.user)
    const [locations, { suppliers, stats }] = await Promise.all([
        getLocationsForLogistik(),
        getSuppliersData()
    ])

    return (
        <div className="space-y-4 w-full">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-1 border-b border-slate-200/80">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
                        <Store className="w-6 h-6 text-blue-600" />
                        Master Supplier / Toko
                    </h1>
                    <p className="text-muted-foreground text-xs sm:text-sm">
                        Database rekanan toko, vendor suku cadang, bahan bangunan, dan supplier logistik operasional.
                    </p>
                </div>
                {!canManage && (
                    <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 text-amber-800 px-3 py-1 rounded-md text-xs font-medium w-fit">
                        <Eye className="w-3.5 h-3.5 text-amber-600" />
                        <span>Mode Pemantauan (Hanya Lihat)</span>
                    </div>
                )}
            </div>

            <SupplierClient
                initialData={suppliers}
                stats={stats}
                canManage={canManage}
                isCentral={isCentral}
                locations={locations}
                userLocationId={session?.user?.locationId || null}
            />
        </div>
    )
}
