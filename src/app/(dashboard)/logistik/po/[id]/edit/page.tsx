import { getPoFormData } from "../../actions"
import { POEditClient } from "./po-edit-client"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"

export default async function POEditPage({ params }: { params: Promise<{ id: string }> }) {
    const session = await auth()
    const { id } = await params

    // Fetch initial PO
    const po = await prisma.purchaseOrder.findUnique({
        where: { id },
        include: {
            items: {
                include: { masterItem: true }
            }
        }
    })

    if (!po) return <div>PO tidak ditemukan</div>
    if (po.status !== "DRAFT") {
        redirect("/logistik/po")
    }

    const { companies, categories, suppliers, items } = await getPoFormData()

    return (
        <div className="space-y-4">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Edit Purchase Order (DRAFT)</h1>
                <p className="text-muted-foreground text-sm">Nomor PO: <span className="font-mono font-semibold">{po.po_number}</span></p>
            </div>
            <POEditClient
                initialPo={po}
                companies={companies}
                categories={categories}
                suppliers={suppliers}
                items={items}
                pembuatAdmin={session?.user?.username || po.pembuat_admin}
            />
        </div>
    )
}
