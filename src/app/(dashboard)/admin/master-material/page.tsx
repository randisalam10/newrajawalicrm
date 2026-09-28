import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { getMasterMaterialsData } from "./actions"
import { MasterMaterialClient } from "./master-material-client"

export const metadata = {
    title: "Master Harga Material | RajawaliMix",
    description: "Pengaturan harga dasar material agregat dan pasir per kubik (m³)",
}

export default async function MasterMaterialPage() {
    const session = await auth()
    if (!session?.user) {
        redirect("/login")
    }

    const { materials, histories, locations } = await getMasterMaterialsData()

    return (
        <MasterMaterialClient
            initialMaterials={materials}
            initialHistories={histories}
            locations={locations}
            userRole={session.user.role || ""}
            userLocationId={session.user.locationId || null}
        />
    )
}
