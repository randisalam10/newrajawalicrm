import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { getIncomingMaterials, getStockLedger } from "./actions"
import { MaterialInClient } from "./material-in-client"
import { getLocations } from "../cabang/actions"

export default async function MaterialInPage() {
    const session = await auth()

    if (!session?.user) {
        redirect("/login")
    }

    const [materials, ledger, locations] = await Promise.all([
        getIncomingMaterials(),
        getStockLedger("all"),
        getLocations(),
    ])

    return (
        <MaterialInClient
            initialData={materials}
            initialLedger={ledger}
            locations={locations}
            userRole={session.user.role as string}
        />
    )
}
