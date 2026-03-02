import { getMasterItems } from "./actions"
import { getSuppliers } from "../supplier/actions"
import { getPoCategories } from "../kategori/actions"
import { MasterBarangClient } from "./master-barang-client"
import { Card, CardContent } from "@/components/ui/card"

export default async function MasterBarangPage() {
    const [items, suppliers, categories] = await Promise.all([
        getMasterItems(),
        getSuppliers(),
        getPoCategories(),
    ])

    return (
        <div className="space-y-4">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Master Barang</h1>
                <p className="text-muted-foreground text-sm">Kelola katalog barang yang tersedia dari setiap supplier.</p>
            </div>
            <Card>
                <CardContent className="p-0">
                    <MasterBarangClient initialData={items} suppliers={suppliers} categories={categories} />
                </CardContent>
            </Card>
        </div>
    )
}
