import { getPurchaseOrders, getPoFormData } from "./actions"
import { POListClient } from "./po-list-client"
import { POReportClient } from "./po-report-client"
import { Card, CardContent } from "@/components/ui/card"
import { POTabsWrapper } from "./po-tabs-wrapper"
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { isCorporateUser } from "@/lib/rbac"

export default async function POListPage() {
    const session = await auth()
    if (!session?.user) redirect("/login")

    const userRole = session.user.role || ""
    const userPermissions = (session.user as any)?.permissions || []
    const isCorp = isCorporateUser(session.user)
    const roleLower = userRole.toLowerCase()
    const isCrusherUser = roleLower === "operatorcrusher" || roleLower === "admincrusher" || roleLower.includes("crusher") || roleLower.startsWith("sc")

    // Akun unit Stone Crusher dialihkan ke modul PO Stone Crusher terdedikasi
    if (!isCorp && isCrusherUser) {
        redirect("/crusher/po")
    }

    const [ordersResult, formData] = await Promise.all([
        getPurchaseOrders({ page: 1, pageSize: 10 }),
        getPoFormData(),
    ])

    return (
        <div className="space-y-4">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Manajemen Purchase Order</h1>
                <p className="text-muted-foreground text-sm">Daftar PO dan laporan bulanan pengeluaran.</p>
            </div>

            <POTabsWrapper
                childrenDaftar={
                    <Card>
                        <CardContent className="p-0">
                            <POListClient 
                                initialData={ordersResult.orders} 
                                totalCount={ordersResult.totalCount}
                                totalPages={ordersResult.totalPages}
                                userRole={userRole}
                                userPermissions={userPermissions}
                                companies={formData.companies}
                                categories={formData.categories}
                            />
                        </CardContent>
                    </Card>
                }
                childrenLaporan={
                    <Card>
                        <CardContent className="p-0">
                            <POReportClient
                                companies={formData.companies}
                                categories={formData.categories}
                            />
                        </CardContent>
                    </Card>
                }
            />
        </div>
    )
}
