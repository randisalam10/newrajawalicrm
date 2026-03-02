import { getPurchaseOrders, getPoFormData } from "./actions"
import { POListClient } from "./po-list-client"
import { POReportClient } from "./po-report-client"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ClipboardList, BarChart2 } from "lucide-react"

export default async function POListPage() {
    const [orders, formData] = await Promise.all([
        getPurchaseOrders(),
        getPoFormData(),
    ])

    return (
        <div className="space-y-4">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Manajemen Purchase Order</h1>
                <p className="text-muted-foreground text-sm">Daftar PO dan laporan bulanan pengeluaran.</p>
            </div>

            <Tabs defaultValue="daftar">
                <TabsList className="mb-2">
                    <TabsTrigger value="daftar" className="gap-2">
                        <ClipboardList className="w-4 h-4" /> Daftar PO
                    </TabsTrigger>
                    <TabsTrigger value="laporan" className="gap-2">
                        <BarChart2 className="w-4 h-4" /> Laporan Bulanan
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="daftar">
                    <Card>
                        <CardContent className="p-0">
                            <POListClient initialData={orders} />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="laporan">
                    <Card>
                        <CardContent className="p-0">
                            <POReportClient
                                companies={formData.companies}
                                categories={formData.categories}
                            />
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
