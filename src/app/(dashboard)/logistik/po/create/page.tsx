import { getPoFormData } from "../actions"
import { POCreateClient } from "./po-create-client"
import { auth } from "@/auth"
import { redirect } from "next/navigation"

type Props = {
    searchParams?: Promise<{ peruntukan?: string; locationId?: string }>
}

export default async function POCreatePage({ searchParams }: Props) {
    const session = await auth()
    const role = session?.user?.role || ""
    if (["CEO", "FVP", "Approver"].includes(role)) {
        redirect("/logistik/approval")
    }
    const resolvedParams = searchParams ? await searchParams : {}
    const { companies, categories, suppliers, items, signers, vehicles, locations } = await getPoFormData(resolvedParams.locationId, resolvedParams.peruntukan)

    return (
        <div className="space-y-4 w-full">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Buat Purchase Order Baru</h1>
                <p className="text-muted-foreground text-sm">Isi form berikut untuk membuat PO. Nomor PO akan di-generate otomatis setelah disimpan.</p>
            </div>
            <POCreateClient
                companies={companies}
                categories={categories}
                suppliers={suppliers}
                items={items}
                signers={signers}
                vehicles={vehicles || []}
                locations={locations || []}
                userRole={role}
                userLocationId={session?.user?.locationId || null}
                pembuatAdmin={session?.user?.username || "Admin"}
                initialPeruntukan={resolvedParams.peruntukan as any}
                initialLocationId={resolvedParams.locationId}
            />
        </div>
    )
}
