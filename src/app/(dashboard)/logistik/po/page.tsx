import { getPurchaseOrders, getPoFormData } from "./actions"
import { POListClient } from "./po-list-client"
import { POReportClient } from "./po-report-client"
import { Card, CardContent } from "@/components/ui/card"
import { POTabsWrapper } from "./po-tabs-wrapper"
import { auth } from "@/auth"

export default async function POListPage() {
    const session = await auth()
    const userRole = session?.user?.role || ""

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
