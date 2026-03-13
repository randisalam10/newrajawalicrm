// Print page: Purchase Order
// Route: /print/po/[id]

import { POPrintClient } from "./client"
import { headers } from "next/headers"
import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"

export default async function PrintPOPage({
    params,
}: {
    params: Promise<{ id: string }>
}) {
    const { id } = await params

    const po = await prisma.purchaseOrder.findUnique({
        where: { id },
        include: {
            companyGroup: true,
            category: true,
            items: {
                include: {
                    masterItem: true
                }
            }
        }
    })

    if (!po) {
        return notFound()
    }

    const supplier = await prisma.supplier.findUnique({
        where: { id: po.supplierId }
    })

    const companyProject = po.companyProjectId ? await prisma.poCompanyProject.findUnique({
        where: { id: po.companyProjectId }
    }) : null

    // Fetch new fields via raw SQL karena Prisma client belum di-regenerate
    const rawPO = await prisma.$queryRaw<{ jabatan_kepala: string | null, updatedAt: Date | null }[]>`
        SELECT "jabatan_kepala", "updatedAt" FROM "PurchaseOrder" WHERE id = ${id} LIMIT 1`
    const rawCompany = await prisma.$queryRaw<{ logo_url: string | null }[]>`
        SELECT "logo_url" FROM "PoCompanyGroup" WHERE id = ${po.companyGroupId} LIMIT 1`

    const jabatanKepala = rawPO[0]?.jabatan_kepala || "Kepala Peralatan"
    const updatedAtRaw = rawPO[0]?.updatedAt || null
    let logoUrl = rawCompany[0]?.logo_url || null
    if (logoUrl && logoUrl.startsWith('/uploads/logos/')) {
        logoUrl = logoUrl.replace('/uploads/logos/', '/api/files/logo/')
    }

    // Build absolute URL for logo (react-pdf needs full URL)
    const headersList = await headers()
    const host = headersList.get("host") || "localhost:3000"
    const protocol = headersList.get("x-forwarded-proto") || "http"
    const dynamicBaseUrl = `${protocol}://${host}`
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || dynamicBaseUrl

    // Fetch Employee name based on pembuat_admin (username)
    let pembuatName = po.pembuat_admin || "ADMIN" // Default fallback
    if (po.pembuat_admin) {
        const adminUser = await prisma.user.findUnique({
            where: { username: po.pembuat_admin },
            include: { employee: true }
        })
        if (adminUser?.employee?.name) {
            pembuatName = adminUser.employee.name
        }
    }

    const formattedPO = {
        po_number: po.po_number,
        tanggal_terbit: po.tanggal_terbit.toISOString(),
        perusahaan_nama: po.companyGroup?.name || "-",
        perusahaan_alamat: po.companyGroup?.address || undefined,
        perusahaan_telepon: po.companyGroup?.email || undefined,
        perusahaan_logo: logoUrl ? `${baseUrl}${logoUrl}` : undefined,
        proyek_nama: companyProject?.name || po.companyGroup?.name || "-",
        proyek_kode: companyProject?.kode_proyek || po.companyGroup?.kode_cabang || "-",
        supplier_nama: supplier?.name || "-",
        supplier_alamat: supplier?.address || undefined,
        kategori_nama: po.category?.name || "-",
        metode_pembayaran: po.metode_pembayaran,
        items: po.items.map(item => ({
            id: item.id,
            name: item.masterItem?.name || "-",
            part_number: item.masterItem?.part_number || null,
            merk: item.masterItem?.merk || null,
            quantity: item.quantity,
            satuan: item.masterItem?.satuan || "PCS",
            harga: item.harga_satuan,
            keterangan: item.keterangan || undefined,
        })),
        pimpinan: po.pimpinan || "PIMPINAN",
        kepala_peralatan: po.kepala_peralatan || "KEPALA PERALATAN",
        jabatan_kepala: jabatanKepala,
        pembuat: pembuatName,
        catatan: po.notes || undefined,
        pic_name: po.pic_name,
        pic_phone: po.pic_phone,
        status: po.status,
        updatedAt: po.updatedAt?.toISOString() || null,

    }

    return <POPrintClient po={formattedPO} />
}
