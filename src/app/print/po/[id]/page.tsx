// Print page: Purchase Order
// Route: /print/po/[id]

import { POPrintClient } from "./client"
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

    const formattedPO = {
        po_number: po.po_number,
        tanggal_terbit: po.tanggal_terbit.toISOString(),
        perusahaan_nama: po.companyGroup?.name || "-",
        perusahaan_alamat: po.companyGroup?.address || undefined,
        perusahaan_telepon: po.companyGroup?.email || undefined,
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
        pembuat: po.pembuat_admin || "ADMIN",
        catatan: po.notes || undefined,
    }

    return <POPrintClient po={formattedPO} />
}
