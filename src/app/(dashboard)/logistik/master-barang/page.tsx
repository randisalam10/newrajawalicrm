import { getMasterItems } from "./actions"
import { getSuppliers } from "../supplier/actions"
import { getPoCategories } from "../kategori/actions"
import { MasterBarangClient } from "./master-barang-client"
import { Card, CardContent } from "@/components/ui/card"
import { auth } from "@/auth"
import { Eye } from "lucide-react"

export default async function MasterBarangPage() {
    const session = await auth()
    const userRole = session?.user?.role || ""
    const canManage = !["CEO", "FVP", "Approver"].includes(userRole) && ["SuperAdminBP", "AdminBP", "AdminLogistik"].includes(userRole)

    const [items, suppliers, categories] = await Promise.all([
        getMasterItems(),
        getSuppliers(),
        getPoCategories(),
    ])

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Master Barang</h1>
                    <p className="text-muted-foreground text-sm">Kelola katalog barang yang tersedia dari setiap supplier.</p>
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
                    <MasterBarangClient initialData={items} suppliers={suppliers} categories={categories} canManage={canManage} />
                </CardContent>
            </Card>
        </div>
    )
}
