import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { getMaterialUsageData } from "./actions"
import { MaterialUsageClient } from "./usage-client"
import { getLocations } from "../cabang/actions"

export default async function MaterialUsagePage() {
    const session = await auth()

    if (!session?.user) {
        redirect("/login")
    }

    const [transactions, locations] = await Promise.all([
        getMaterialUsageData(),
        getLocations()
    ])

    return (
        <MaterialUsageClient
            initialData={transactions}
            locations={locations}
            userRole={session.user.role as string}
        />
    )
}
