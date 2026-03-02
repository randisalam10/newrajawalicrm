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
    kepala_peralatan_default: z.string().optional(),
    jabatan_kepala_default: z.string().optional(),
    logo_url: z.string().optional(),
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
        const { kepala_peralatan_default, jabatan_kepala_default, logo_url, ...prismaData } = parsed.data
        const created = await prisma.poCompanyGroup.create({ data: prismaData })
        // Simpan field baru via raw SQL karena Prisma client belum di-regenerate
        await prisma.$executeRaw`UPDATE "PoCompanyGroup" SET
            "kepala_peralatan_default" = ${kepala_peralatan_default ?? null},
            "jabatan_kepala_default" = ${jabatan_kepala_default ?? null},
            "logo_url" = ${logo_url ?? null}
            WHERE id = ${created.id}`
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
        const { kepala_peralatan_default, jabatan_kepala_default, logo_url, ...prismaData } = parsed.data
        await prisma.poCompanyGroup.update({ where: { id }, data: prismaData })
        // Simpan field baru via raw SQL karena Prisma client belum di-regenerate
        await prisma.$executeRaw`UPDATE "PoCompanyGroup" SET
            "kepala_peralatan_default" = ${kepala_peralatan_default ?? null},
            "jabatan_kepala_default" = ${jabatan_kepala_default ?? null},
            "logo_url" = ${logo_url ?? null}
            WHERE id = ${id}`
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
