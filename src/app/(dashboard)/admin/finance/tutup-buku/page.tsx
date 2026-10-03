import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { getTutupBukuPageData } from "./actions"
import { TutupBukuClient } from "./tutup-buku-client"

export const metadata = {
    title: "Tutup Buku & Arsip Finansial | New Rajawali CRM",
    description: "Manajemen tutup buku dan penguncian periode akuntansi bulanan batching plant"
}

export default async function TutupBukuPage() {
    const session = await auth()

    if (!session?.user) {
        redirect("/login")
    }

    if (session.user.role !== "SuperAdminBP") {
        redirect("/admin")
    }

    const initialData = await getTutupBukuPageData()

    return (
        <TutupBukuClient
            initialRecords={initialData.records}
            initialStats={initialData.stats}
            availablePeriods={initialData.availablePeriods}
            closingMap={initialData.closingMap}
            currentYear={initialData.currentYear}
            locations={initialData.locations}
        />
    )
}
