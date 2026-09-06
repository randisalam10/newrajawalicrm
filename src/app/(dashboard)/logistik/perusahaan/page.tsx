import { getPoCompanies, getUsersForSigners } from "./actions"
import { PerusahaanClient } from "./perusahaan-client"
import { Card, CardContent } from "@/components/ui/card"
import { auth } from "@/auth"
import { Eye } from "lucide-react"

export default async function PerusahaanPage() {
    const session = await auth()
    const userRole = session?.user?.role || ""
    const canManage = !["CEO", "FVP", "Approver"].includes(userRole) && ["SuperAdminBP", "AdminBP", "AdminLogistik"].includes(userRole)

    const [companies, signers] = await Promise.all([
        getPoCompanies(),
        getUsersForSigners(),
    ])

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Daftar Perusahaan</h1>
                    <p className="text-muted-foreground text-sm">Kelola data perusahaan penerbit PO dan proyek/lokasi pengiriman.</p>
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
                    <PerusahaanClient initialData={companies} signers={signers} canManage={canManage} />
                </CardContent>
            </Card>
        </div>
    )
}
