import { getSuppliers } from "./actions"
import { SupplierClient } from "./supplier-client"
import { Card, CardContent } from "@/components/ui/card"

export default async function SupplierPage() {
    const suppliers = await getSuppliers()

    return (
        <div className="space-y-4">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Master Supplier / Toko</h1>
                <p className="text-muted-foreground text-sm">Kelola data toko dan supplier pembelian barang.</p>
            </div>
            <Card>
                <CardContent className="p-0">
                    <SupplierClient initialData={suppliers} />
                </CardContent>
            </Card>
        </div>
    )
}
