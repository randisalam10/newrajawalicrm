import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { MaterialAgregatClient } from "./material-agregat-client"

export const metadata = {
    title: "Material Agregat | BP ERP System",
    description: "Pencatatan material agregat masuk per batching plant",
}

export default async function MaterialAgregatPage() {
    const session = await auth()
    const userRole = session?.user?.role ?? "AdminBP"

    const locationFilter: any =
        userRole === "AdminBP" ? { locationId: session?.user?.locationId } : {}

    const [data, locations] = await Promise.all([
        prisma.aggregateIncoming.findMany({
            where: locationFilter,
            include: { location: true },
            orderBy: { date: "desc" },
        }),
        prisma.location.findMany({ orderBy: { name: "asc" } }),
    ])

    return (
        <div className="p-6 space-y-6">
            <MaterialAgregatClient
                initialData={JSON.parse(JSON.stringify(data))}
                locations={locations}
                userRole={userRole}
            />
        </div>
    )
}
