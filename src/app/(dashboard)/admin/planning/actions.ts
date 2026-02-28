'use server'

import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { revalidatePath } from "next/cache"
import { startOfDay, endOfDay } from "date-fns"

// ─── HELPERS ────────────────────────────────────────────────────────────────

async function getSessionWithLocation() {
    const session = await auth()
    if (!session?.user?.employeeId) return null
    return session
}

// ─── QUERIES ─────────────────────────────────────────────────────────────────

export async function getPlanMasters() {
    const session = await getSessionWithLocation()
    if (!session) return null

    const isSuperAdmin = session.user.role === 'SuperAdminBP'
    const locationId = session.user.locationId

    const locationFilter = (!isSuperAdmin && locationId) ? { locationId } : {}

    const [projects, qualities, workItems] = await Promise.all([
        prisma.project.findMany({
            where: { customer: { ...locationFilter } },
            include: { customer: { select: { customer_name: true } } },
            orderBy: { name: 'asc' },
        }),
        prisma.concreteQuality.findMany({
            where: { ...locationFilter },
            orderBy: { name: 'asc' },
        }),
        prisma.workItem.findMany({
            where: { ...locationFilter },
            orderBy: { name: 'asc' },
        }),
    ])

    return { projects, qualities, workItems }
}

export async function getPlans(filter?: { dateFrom?: string; dateTo?: string }) {
    const session = await getSessionWithLocation()
    if (!session) return []

    const isSuperAdmin = session.user.role === 'SuperAdminBP'
    const locationId = session.user.locationId
    const locationFilter = (!isSuperAdmin && locationId) ? { locationId } : {}

    const dateFilter: any = {}
    if (filter?.dateFrom) dateFilter.gte = startOfDay(new Date(filter.dateFrom))
    if (filter?.dateTo) dateFilter.lte = endOfDay(new Date(filter.dateTo))

    const plans = await prisma.concretePlan.findMany({
        where: {
            ...locationFilter,
            ...(Object.keys(dateFilter).length > 0 ? { date: dateFilter } : {}),
        },
        include: {
            project: { include: { customer: { select: { customer_name: true } } } },
            concreteQuality: { select: { id: true, name: true } },
            workItem: { select: { id: true, name: true } },
            location: { select: { id: true, name: true } },
        },
        orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
    })

    return plans
}

export async function getTodayPlans() {
    const session = await getSessionWithLocation()
    if (!session) return []

    const isSuperAdmin = session.user.role === 'SuperAdminBP'
    const locationId = session.user.locationId
    const locationFilter = (!isSuperAdmin && locationId) ? { locationId } : {}

    const now = new Date()
    return prisma.concretePlan.findMany({
        where: {
            ...locationFilter,
            date: { gte: startOfDay(now), lte: endOfDay(now) },
        },
        include: {
            project: { include: { customer: { select: { customer_name: true } } } },
            concreteQuality: { select: { name: true } },
            workItem: { select: { name: true } },
        },
        orderBy: { createdAt: 'asc' },
    })
}

// ─── MUTATIONS ───────────────────────────────────────────────────────────────

export async function createPlan(data: {
    date: string
    projectId: string
    qualityId: string
    workItemId: string
    volume_plan: number
    notes?: string
}) {
    const session = await getSessionWithLocation()
    if (!session) throw new Error("Unauthorized")

    const isSuperAdmin = session.user.role === 'SuperAdminBP'
    const locationId = session.user.locationId

    // Determine locationId from project if SuperAdmin
    let resolvedLocationId = locationId
    if (isSuperAdmin || !resolvedLocationId) {
        const project = await prisma.project.findUnique({
            where: { id: data.projectId },
            include: { customer: { select: { locationId: true } } },
        })
        resolvedLocationId = project?.customer?.locationId ?? locationId
    }

    if (!resolvedLocationId) throw new Error("Location not found")

    await prisma.concretePlan.create({
        data: {
            date: new Date(data.date),
            projectId: data.projectId,
            qualityId: data.qualityId,
            workItemId: data.workItemId,
            volume_plan: data.volume_plan,
            notes: data.notes || null,
            status: 'Planned',
            locationId: resolvedLocationId,
        },
    })

    revalidatePath('/admin/planning')
    revalidatePath('/admin')
}

export async function updatePlan(id: string, data: {
    date?: string
    projectId?: string
    qualityId?: string
    workItemId?: string
    volume_plan?: number
    notes?: string
    status?: 'Planned' | 'OnGoing' | 'Done' | 'Cancelled'
}) {
    const session = await getSessionWithLocation()
    if (!session) throw new Error("Unauthorized")

    const updateData: any = {}
    if (data.date !== undefined) updateData.date = new Date(data.date)
    if (data.projectId !== undefined) updateData.projectId = data.projectId
    if (data.qualityId !== undefined) updateData.qualityId = data.qualityId
    if (data.workItemId !== undefined) updateData.workItemId = data.workItemId
    if (data.volume_plan !== undefined) updateData.volume_plan = data.volume_plan
    if (data.notes !== undefined) updateData.notes = data.notes || null
    if (data.status !== undefined) updateData.status = data.status

    await prisma.concretePlan.update({
        where: { id },
        data: updateData,
    })

    revalidatePath('/admin/planning')
    revalidatePath('/admin')
}

export async function deletePlan(id: string) {
    const session = await getSessionWithLocation()
    if (!session) throw new Error("Unauthorized")

    await prisma.concretePlan.delete({ where: { id } })

    revalidatePath('/admin/planning')
    revalidatePath('/admin')
}
