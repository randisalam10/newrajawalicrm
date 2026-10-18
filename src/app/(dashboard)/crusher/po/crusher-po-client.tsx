"use client"

import { useRouter } from "next/navigation"
import { CrusherPoHeader } from "./components/crusher-po-header"
import { CrusherPoStatsCards } from "./components/crusher-po-stats"
import { POListClient } from "@/app/(dashboard)/logistik/po/po-list-client"
import { Card, CardContent } from "@/components/ui/card"
import { CrusherPoStats } from "./types"

type LocationOption = {
    id: string
    name: string
}

type Props = {
    initialOrders: any[]
    totalCount: number
    totalPages: number
    initialStats: CrusherPoStats
    locationId: string
    locationName: string
    locations: LocationOption[]
    companies: any[]
    categories: any[]
    userRole: string
    userPermissions?: string[]
}

export function CrusherPoClient({
    initialOrders,
    totalCount,
    totalPages,
    initialStats,
    locationId,
    locationName,
    locations,
    companies,
    categories,
    userRole,
    userPermissions = [],
}: Props) {
    const router = useRouter()

    const handleLocationChange = (newLocId: string) => {
        router.push(`/crusher/po?locationId=${newLocId}`)
    }

    const createHref = `/logistik/po/create?peruntukan=CRUSHER&locationId=${locationId}`

    return (
        <div className="space-y-3.5 w-full">
            {/* Header dengan Switcher Lokasi & Tombol Buat */}
            <CrusherPoHeader
                locations={locations}
                selectedLocationId={locationId}
                onLocationChange={handleLocationChange}
                createHref={createHref}
            />

            {/* Metrik & Stat Cards */}
            <CrusherPoStatsCards stats={initialStats} />

            {/* Tabel Data PO Terstandarisasi Logistik */}
            <Card className="border border-slate-200 shadow-2xs bg-white overflow-hidden">
                <CardContent className="p-0">
                    <POListClient
                        initialData={initialOrders}
                        totalCount={totalCount}
                        totalPages={totalPages}
                        userRole={userRole}
                        userPermissions={userPermissions}
                        companies={companies}
                        categories={categories}
                        fixedLocationId={locationId}
                        fixedPeruntukan="CRUSHER"
                        createHref={createHref}
                        createLabel="+ Buat PO Crusher"
                    />
                </CardContent>
            </Card>
        </div>
    )
}
