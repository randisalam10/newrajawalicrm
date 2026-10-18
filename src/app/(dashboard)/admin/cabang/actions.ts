"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import { z } from "zod"

const locationSchema = z.object({
    id: z.string().optional(),
    name: z.string().min(1, "Nama Cabang required"),
    type: z.enum(["BATCHING_PLANT", "STONE_CRUSHER", "HEAD_OFFICE"]).default("BATCHING_PLANT"),
})

import type { Location } from "@prisma/client"

export async function getLocations(): Promise<Location[]> {
    const session = await auth()
    if (!session?.user?.employeeId) return []

    try {
        return await prisma.location.findMany({
            orderBy: { name: 'asc' }
        })
    } catch {
        try {
            return await prisma.$queryRaw<Array<Location>>`
                SELECT "id", "name", "type" FROM "Location" ORDER BY "name" ASC
            `
        } catch {
            const fallback = await prisma.location.findMany({
                orderBy: { name: 'asc' },
                select: { id: true, name: true }
            })
            return fallback as unknown as Location[]
        }
    }
}

export async function createLocation(formData: FormData) {
    const session = await auth()
    if (session?.user?.role !== "SuperAdminBP") return { success: false, error: "Unauthorized" }

    const data = Object.fromEntries(formData.entries())
    const parsed = locationSchema.safeParse(data)

    if (!parsed.success) {
        return { success: false, error: parsed.error.format() }
    }

    try {
        await prisma.location.create({
            data: {
                name: parsed.data.name,
                type: parsed.data.type || "BATCHING_PLANT",
            }
        })
        revalidatePath("/admin/cabang")
        return { success: true }
    } catch (e: any) {
        if (e.message?.includes("Unknown argument `type`")) {
            try {
                await prisma.$executeRaw`
                    INSERT INTO "Location" ("id", "name", "type")
                    VALUES (gen_random_uuid(), ${parsed.data.name}, ${parsed.data.type || 'BATCHING_PLANT'})
                `
                revalidatePath("/admin/cabang")
                return { success: true }
            } catch (rawErr: any) {
                return { success: false, error: rawErr.message }
            }
        }
        if (e.code === 'P2002') return { success: false, error: "Nama Cabang sudah digunakan!" }
        return { success: false, error: e.message }
    }
}

export async function updateLocation(id: string, formData: FormData) {
    const session = await auth()
    if (session?.user?.role !== "SuperAdminBP") return { success: false, error: "Unauthorized" }

    const data = Object.fromEntries(formData.entries())
    const parsed = locationSchema.safeParse({ ...data, id })

    if (!parsed.success) {
        return { success: false, error: parsed.error.format() }
    }

    try {
        await prisma.location.update({
            where: { id },
            data: {
                name: parsed.data.name,
                type: parsed.data.type || "BATCHING_PLANT",
            }
        })
        revalidatePath("/admin/cabang")
        return { success: true }
    } catch (e: any) {
        if (e.message?.includes("Unknown argument `type`")) {
            try {
                await prisma.$executeRaw`
                    UPDATE "Location" SET "name" = ${parsed.data.name}, "type" = ${parsed.data.type || 'BATCHING_PLANT'}
                    WHERE "id" = ${id}
                `
                revalidatePath("/admin/cabang")
                return { success: true }
            } catch (rawErr: any) {
                return { success: false, error: rawErr.message }
            }
        }
        if (e.code === 'P2002') return { success: false, error: "Nama Cabang sudah digunakan!" }
        return { success: false, error: e.message }
    }
}

export async function deleteLocation(id: string) {
    const session = await auth()
    if (session?.user?.role !== "SuperAdminBP") return { success: false, error: "Unauthorized" }

    try {
        await prisma.location.delete({
            where: { id }
        })
        revalidatePath("/admin/cabang")
        return { success: true }
    } catch (e: any) {
        return { success: false, error: "Gagal menghapus! Cabang ini mungkin sedang digunakan oleh Master Data lain." }
    }
}
