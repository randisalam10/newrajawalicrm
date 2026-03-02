"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { z } from "zod"

const companySchema = z.object({
    name: z.string().min(1, "Nama wajib diisi"),
    kode_cabang: z.string().min(1).max(10),
    kota: z.string().min(1, "Kota wajib diisi"),
    address: z.string().optional(),
    email: z.string().email().optional().or(z.literal("")),
    pimpinan_default: z.string().optional(),
})

const projectSchema = z.object({
    name: z.string().min(1, "Nama proyek wajib diisi"),
    kode_proyek: z.string().optional(),
    companyGroupId: z.string().min(1, "Perusahaan wajib dipilih"),
})

export async function getPoCompanies() {
    return await prisma.poCompanyGroup.findMany({
        include: { projects: { orderBy: { name: 'asc' } } },
        orderBy: { name: 'asc' }
    })
}

export async function createPoCompany(formData: FormData) {
    const data = Object.fromEntries(formData.entries())
    const parsed = companySchema.safeParse(data)
    if (!parsed.success) return { success: false, error: parsed.error.format() }

    try {
        await prisma.poCompanyGroup.create({ data: parsed.data })
        revalidatePath("/logistik/perusahaan")
        return { success: true }
    } catch (e: any) {
        return { success: false, error: e.message }
    }
}

export async function updatePoCompany(id: string, formData: FormData) {
    const data = Object.fromEntries(formData.entries())
    const parsed = companySchema.safeParse(data)
    if (!parsed.success) return { success: false, error: parsed.error.format() }

    try {
        await prisma.poCompanyGroup.update({ where: { id }, data: parsed.data })
        revalidatePath("/logistik/perusahaan")
        return { success: true }
    } catch (e: any) {
        return { success: false, error: e.message }
    }
}

export async function deletePoCompany(id: string) {
    try {
        await prisma.poCompanyGroup.delete({ where: { id } })
        revalidatePath("/logistik/perusahaan")
        return { success: true }
    } catch (e: any) {
        return { success: false, error: "Gagal menghapus. Pastikan tidak ada PO terkait." }
    }
}

export async function createPoCompanyProject(formData: FormData) {
    const data = Object.fromEntries(formData.entries())
    const parsed = projectSchema.safeParse(data)
    if (!parsed.success) return { success: false, error: parsed.error.format() }

    try {
        await prisma.poCompanyProject.create({ data: parsed.data })
        revalidatePath("/logistik/perusahaan")
        return { success: true }
    } catch (e: any) {
        return { success: false, error: e.message }
    }
}

export async function updatePoCompanyProject(id: string, formData: FormData) {
    const data = Object.fromEntries(formData.entries())
    const parsed = projectSchema.safeParse(data)
    if (!parsed.success) return { success: false, error: parsed.error.format() }

    try {
        await prisma.poCompanyProject.update({ where: { id }, data: parsed.data })
        revalidatePath("/logistik/perusahaan")
        return { success: true }
    } catch (e: any) {
        return { success: false, error: e.message }
    }
}

export async function deletePoCompanyProject(id: string) {
    try {
        await prisma.poCompanyProject.delete({ where: { id } })
        revalidatePath("/logistik/perusahaan")
        return { success: true }
    } catch (e: any) {
        return { success: false, error: "Gagal menghapus proyek." }
    }
}
