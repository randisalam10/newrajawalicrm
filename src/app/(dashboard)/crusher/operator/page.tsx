import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { resolveCrusherLocation } from "../utils/crusher-location-helper"
import { getOperatorWorkLogs, getCrusherEmployees, getCrusherVehicles, getMasterOperatorRates } from "../actions"
import { CrusherOperatorClient } from "./crusher-operator-client"

export const metadata = {
    title: "Retase & Upah Operator / Helper - Stone Crusher & Batching Plant",
    description: "Pencatatan jam kerja normal dan lembur operator excavator, wheel loader, helper harian, dan operator crusher.",
}

export default async function CrusherOperatorPage(props: {
    searchParams?: Promise<{ locationId?: string; date?: string }>
}) {
    const session = await auth()
    if (!session?.user) redirect("/login")

    const userRole = session.user.role || ""
    const permissions = session.user.permissions || []
    const userRoleLower = userRole.toLowerCase()
    const isCrusherRole = userRoleLower === "operatorcrusher" || userRoleLower === "admincrusher" || userRoleLower.includes("crusher") || userRoleLower.startsWith("sc")

    const hasAccess = ["SuperAdminBP", "AdminBP", "AdminCrusher", "OperatorCrusher", "CEO", "FVP", "AdminLogistik"].includes(userRole) ||
        isCrusherRole ||
        permissions.some(p => p.startsWith("CRUSHER_") || p.startsWith("RETASE_"))

    if (!hasAccess) {
        if (permissions.includes("LOGISTIK_VIEW")) redirect("/logistik")
        redirect("/admin")
    }

    const searchParams = props.searchParams ? await props.searchParams : {}
    const todayStr = searchParams.date || new Date().toISOString().split("T")[0]

    // Resolve location (supports Stone Crusher and Batching Plant)
    const {
        activeLocationId,
        activeLocationName,
        locations: availableCrusherLocations,
        isLocationLocked,
    } = await resolveCrusherLocation(
        searchParams.locationId,
        session.user.locationId,
        userRole,
        session.user.roleScope
    )

    // Cabang aktif: Jika lokasi dikunci (admin crusher / non-superadmin), HANYA sediakan lokasi miliknya
    // Jika SuperAdmin/CEO/FVP, baru sediakan seluruh cabang
    let branchLocations = availableCrusherLocations
    if (!isLocationLocked) {
        branchLocations = await prisma.location.findMany({
            orderBy: [{ type: "asc" }, { name: "asc" }],
            select: { id: true, name: true },
        })
    }

    const targetLocationId = isLocationLocked ? activeLocationId : (searchParams.locationId || activeLocationId)

    const [initialLogs, employees, vehicles, masterRates] = await Promise.all([
        getOperatorWorkLogs({
            date: todayStr,
            locationId: targetLocationId,
        }),
        getCrusherEmployees(targetLocationId),
        getCrusherVehicles(targetLocationId),
        getMasterOperatorRates(targetLocationId),
    ])

    // Filter Karyawan: Hanya Operator dan Helper (Sopir tidak masuk di pencatatan operator/helper)
    const operatorEmployees = employees.filter((e) => e.position === "Operator" || e.position === "Helper")

    // Dynamic RBAC Permission check for wages and slips
    let userPermissions: string[] = permissions
    if (session.user.id) {
        const dbUser = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: {
                role: true,
                roleRef: {
                    include: {
                        permissions: {
                            include: { permission: true }
                        }
                    }
                }
            }
        })
        if (dbUser?.roleRef?.permissions) {
            userPermissions = dbUser.roleRef.permissions.map(rp => rp.permission.code)
        }
    }

    const canViewWages = ["SuperAdminBP", "CEO", "FVP", "Finance"].includes(userRole) ||
        userPermissions.includes("CRUSHER_WAGES_VIEW") ||
        userPermissions.includes("FINANCE_VIEW")

    return (
        <CrusherOperatorClient
            initialLogs={initialLogs}
            initialDate={todayStr}
            activeLocationId={targetLocationId}
            activeLocationName={activeLocationName}
            locations={branchLocations}
            employees={operatorEmployees}
            vehicles={vehicles}
            masterRates={masterRates}
            canViewWages={canViewWages}
            isLocationLocked={isLocationLocked}
        />
    )
}
