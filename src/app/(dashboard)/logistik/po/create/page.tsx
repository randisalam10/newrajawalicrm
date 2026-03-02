import { getPoFormData } from "../actions"
import { POCreateClient } from "./po-create-client"
import { auth } from "@/auth"

export default async function POCreatePage() {
    const session = await auth()
    const { companies, categories, suppliers, items } = await getPoFormData()

    return (
        <div className="space-y-4">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Buat Purchase Order Baru</h1>
                <p className="text-muted-foreground text-sm">Isi form berikut untuk membuat PO. Nomor PO akan di-generate otomatis setelah disimpan.</p>
            </div>
            <POCreateClient
                companies={companies}
                categories={categories}
                suppliers={suppliers}
                items={items}
                pembuatAdmin={session?.user?.username || "Admin"}
            />
        </div>
    )
}
