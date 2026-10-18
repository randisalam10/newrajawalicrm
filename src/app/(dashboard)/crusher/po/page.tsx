import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { resolveCrusherLocation } from "../utils/crusher-location-helper"
import { getPurchaseOrders, getPoFormData } from "@/app/(dashboard)/logistik/po/actions"
import { getCrusherPoStats } from "./actions"
import { CrusherPoClient } from "./crusher-po-client"

export const metadata = {
    title: "Purchase Order (PO) Stone Crusher | New Rajawali CRM",
    description: "Modul pengadaan barang dan suku cadang pabrik pemecah batu Stone Crusher.",
}

type Props = {
    searchParams: Promise<{ locationId?: string }>
}

export default async function CrusherPoPage({ searchParams }: Props) {
    const session = await auth()
    if (!session?.user) {
        redirect("/login")
    }

    const userRole = session.user.role || ""
    const userPermissions = (session.user as any)?.permissions || []

    const resolvedParams = await searchParams
    const { activeLocationId: locationId, activeLocationName: locationName, locations: availableLocations } = await resolveCrusherLocation(
        resolvedParams.locationId,
        session.user.locationId,
        userRole,
        session.user.roleScope
    )

    if (!locationId) {
        return (
            <div className="p-6 bg-white rounded-xl border border-slate-200 text-center space-y-2">
                <p className="font-semibold text-slate-800">Belum ada Cabang / Lokasi Stone Crusher yang Terdaftar</p>
                <p className="text-xs text-slate-500">
                    Silakan daftarkan cabang dengan tipe Stone Crusher di menu Master Cabang terlebih dahulu.
                </p>
            </div>
        )
    }

    // Parallel fetch: PO khusus crusher di lokasi ini, stats crusher, & form data (perusahaan, kategori)
    const [ordersResult, stats, formData] = await Promise.all([
        getPurchaseOrders({
            page: 1,
            pageSize: 10,
            locationId,
            peruntukan: "CRUSHER",
        }),
        getCrusherPoStats(locationId),
        getPoFormData(locationId, "CRUSHER"),
    ])

    return (
        <CrusherPoClient
            initialOrders={ordersResult.orders}
            totalCount={ordersResult.totalCount}
            totalPages={ordersResult.totalPages}
            initialStats={stats}
            locationId={locationId}
            locationName={locationName}
            locations={availableLocations}
            companies={formData.companies}
            categories={formData.categories}
            userRole={userRole}
            userPermissions={userPermissions}
        />
    )
}
