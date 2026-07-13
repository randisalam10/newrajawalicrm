import { getPoCompanies, getUsersForSigners } from "./actions"
import { PerusahaanClient } from "./perusahaan-client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default async function PerusahaanPage() {
    const companies = await getPoCompanies()
    const signers = await getUsersForSigners()

    return (
        <div className="space-y-4">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Daftar Perusahaan</h1>
                <p className="text-muted-foreground text-sm">Kelola data perusahaan penerbit PO dan proyek/lokasi pengiriman.</p>
            </div>
            <Card>
                <CardContent className="p-0">
                    <PerusahaanClient initialData={companies} signers={signers} />
                </CardContent>
            </Card>
        </div>
    )
}
