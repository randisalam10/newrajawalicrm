import { getPoCategories } from "./actions"
import { KategoriClient } from "./kategori-client"
import { Card, CardContent } from "@/components/ui/card"

export default async function KategoriPage() {
    const categories = await getPoCategories()

    return (
        <div className="space-y-4">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Kategori PO</h1>
                <p className="text-muted-foreground text-sm">Kelola kategori Purchase Order (ATK, BBM, SPR, dll).</p>
            </div>
            <Card>
                <CardContent className="p-0">
                    <KategoriClient initialData={categories} />
                </CardContent>
            </Card>
        </div>
    )
}
