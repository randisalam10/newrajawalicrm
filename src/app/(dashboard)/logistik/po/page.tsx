import { getPurchaseOrders } from "./actions"
import { POListClient } from "./po-list-client"
import { Card, CardContent } from "@/components/ui/card"

export default async function POListPage() {
    const orders = await getPurchaseOrders()

    return (
        <div className="space-y-4">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Daftar Purchase Order</h1>
                <p className="text-muted-foreground text-sm">Riwayat semua PO yang telah dibuat.</p>
            </div>
            <Card>
                <CardContent className="p-0">
                    <POListClient initialData={orders} />
                </CardContent>
            </Card>
        </div>
    )
}
