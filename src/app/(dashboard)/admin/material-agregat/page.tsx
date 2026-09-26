import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { MaterialAgregatClient } from "./material-agregat-client"
import { isCorporateUser, getLocationFilter, hasPermission } from "@/lib/rbac"
import { redirect } from "next/navigation"

export const metadata = {
    title: "Material Agregat | RajawaliMix",
    description: "Pencatatan material agregat masuk per batching plant",
}

export default async function MaterialAgregatPage() {
    const session = await auth()
    if (!session?.user) {
        redirect("/login")
    }

    const isCorp = isCorporateUser(session.user)
    const isReadOnly = ["CEO", "FVP", "Approver"].includes(session.user.role || "")
    const canManage = !isReadOnly && (
        session.user.role === "SuperAdminBP" ||
        hasPermission(session.user, "MATERIAL_AGREGAT", "CREATE") ||
        hasPermission(session.user, "MATERIAL_AGREGAT", "EDIT")
    )

    const locationFilter = getLocationFilter(session.user)
    const vehicleFilter = isCorp ? {} : (session.user.locationId ? { locationId: session.user.locationId } : {})

    const [data, locations, vehicles, drivers, retaseSettings] = await Promise.all([
        prisma.aggregateIncoming.findMany({
            where: locationFilter,
            include: { 
                location: true,
                vehicle: true,
                driver: true
            },
            orderBy: { date: "desc" },
        }),
        prisma.location.findMany({ orderBy: { name: "asc" } }),
        prisma.vehicle.findMany({
            where: {
                OR: [
                    { category: { name: { contains: "dump", mode: "insensitive" } } },
                    { dump_truck_size: { not: null } },
                    { code: { startsWith: "DT", mode: "insensitive" } }
                ]
            },
            include: { category: true, location: true },
            orderBy: { code: "asc" }
        }),
        prisma.employee.findMany({
            where: {
                status: "Active",
            },
            orderBy: { name: "asc" }
        }),
        prisma.aggregateRetaseSetting.findMany({
            include: { location: true }
        }),
    ])

    return (
        <div className="p-6 space-y-6">
            <MaterialAgregatClient
                initialData={JSON.parse(JSON.stringify(data))}
                locations={locations}
                vehicles={JSON.parse(JSON.stringify(vehicles))}
                drivers={JSON.parse(JSON.stringify(drivers))}
                retaseSettings={JSON.parse(JSON.stringify(retaseSettings))}
                userRole={session.user.role as string}
                userLocationId={session.user.locationId ?? null}
                isCorporate={isCorp}
                canManage={canManage}
                isReadOnly={isReadOnly}
            />
        </div>
    )
}
