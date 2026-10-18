import { getPoCategories } from "./actions"
import { KategoriClient } from "./kategori-client"
import { Card, CardContent } from "@/components/ui/card"
import { auth } from "@/auth"
import { Eye } from "lucide-react"

export default async function KategoriPage() {
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

    const categories = await getPoCategories()

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Kategori PO</h1>
                    <p className="text-muted-foreground text-sm">Kelola kategori Purchase Order (ATK, BBM, SPR, dll).</p>
                </div>
                {!canManage && (
                    <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-800 px-3 py-1.5 rounded-lg text-xs font-medium w-fit">
                        <Eye className="w-4 h-4 text-amber-600" />
                        <span>Mode Pemantauan (Hanya Lihat)</span>
                    </div>
                )}
            </div>
            <Card>
                <CardContent className="p-0">
                    <KategoriClient initialData={categories} canManage={canManage} />
                </CardContent>
            </Card>
        </div>
    )
}
