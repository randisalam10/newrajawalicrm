"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { PoPaymentMethod } from "@prisma/client"
import { pusherServer } from "@/lib/pusher"
import { sendPushNotification } from "@/lib/firebase/admin"

const poItemSchema = z.object({
    masterItemId: z.string(),
    quantity: z.coerce.number().min(0.01),
    harga_satuan: z.coerce.number().min(0),
    keterangan: z.string().optional(),
    subtotal: z.coerce.number().min(0),
})

const poSchema = z.object({
    companyGroupId: z.string().min(1, "Perusahaan wajib dipilih"),
    companyProjectId: z.string().optional(),
    categoryId: z.string().min(1, "Kategori wajib dipilih"),
    supplierId: z.string().min(1, "Supplier wajib dipilih"),
    pimpinan: z.string().min(1, "Pimpinan wajib diisi"),
    kepala_peralatan: z.string().min(1, "Kepala Peralatan wajib diisi"),
    jabatan_kepala: z.string().optional(),
    metode_pembayaran: z.nativeEnum(PoPaymentMethod).default("CREDIT"),
    km_hm_kendaraan: z.string().optional(),
    tanggal_terbit: z.string().transform(v => new Date(v)),
    locationId: z.string().optional(),
    notes: z.string().optional(),
    pic_name: z.string().optional(),
    pic_phone: z.string().optional(),
    ceoId: z.string().optional().nullable(),
    fvpId: z.string().optional().nullable(),
    items: z.array(poItemSchema).min(1, "Minimal 1 item barang"),
})

async function generatePoNumber(companyGroupId: string, categoryId: string, tanggalTerbit: Date): Promise<string> {
    const month = String(tanggalTerbit.getUTCMonth() + 1).padStart(2, '0')
    const year = String(tanggalTerbit.getUTCFullYear())

    const [company, category] = await Promise.all([
        prisma.poCompanyGroup.findUnique({ where: { id: companyGroupId } }),
        prisma.poCategory.findUnique({ where: { id: categoryId } })
    ])

    const kodePerusahaan = company?.kode_cabang ?? 'XX'
    const kodeKategori = category?.kode_kategori ?? 'XX'

    // Fetch existing POs for this company group OR matching company code, ending with /year
    const existingPos = await prisma.purchaseOrder.findMany({
        where: {
            OR: [
                { companyGroupId },
                { po_number: { contains: `/${kodePerusahaan}/` } }
            ],
            po_number: {
                endsWith: `/${year}`
            }
        },
        select: {
            po_number: true
        }
    })

    // Find the highest sequence number currently used
    let maxSeq = 0
    
    // Offset khusus tahun 2026 karena data sebelumnya belum dimigrasi (ada 91 PO tertinggal)
    if (tanggalTerbit.getUTCFullYear() === 2026 || tanggalTerbit.getFullYear() === 2026) {
        maxSeq = 91
    }

    for (const po of existingPos) {
        const match = po.po_number.trim().match(/^(\d+)/)
        if (match) {
            const seqNum = parseInt(match[1], 10)
            if (!isNaN(seqNum) && seqNum > maxSeq) {
                maxSeq = seqNum
            }
        }
    }

    let currentSeq = maxSeq + 1
    let candidatePoNumber = ""

    // Collision check loop against DB to guarantee uniqueness before returning
    while (true) {
        const seqStr = String(currentSeq).padStart(3, '0')
        candidatePoNumber = `${seqStr}/${kodePerusahaan}/${kodeKategori}/${month}/${year}`
        
        // Check if exact candidate OR any PO starting with sequence/company code exists
        const existing = await prisma.purchaseOrder.findFirst({
            where: {
                OR: [
                    { po_number: { equals: candidatePoNumber, mode: 'insensitive' } },
                    { po_number: { startsWith: `${seqStr}/${kodePerusahaan}/` } }
                ]
            },
            select: { id: true }
        })

        if (!existing) {
            break
        }
        currentSeq++
    }

    return candidatePoNumber
}

export async function getPurchaseOrders(params?: {
    page?: number
    pageSize?: number
    search?: string
    companyGroupId?: string
    categoryId?: string
    status?: string
    paymentMethod?: string
    startDate?: string
    endDate?: string
}) {
    const session = await auth()
    if (!session?.user) return { orders: [], totalCount: 0, totalPages: 0 }

    const {
        page = 1,
        pageSize = 10,
        search,
        companyGroupId,
        categoryId,
        status,
        paymentMethod,
        startDate,
        endDate
    } = params || {}

    const skip = (page - 1) * pageSize

    const where: any = {}

    // Date Filter (Tanggal Terbit PO)
    if (startDate && endDate) {
        const start = new Date(startDate)
        start.setHours(0, 0, 0, 0)
        const end = new Date(endDate)
        end.setHours(23, 59, 59, 999)
        where.tanggal_terbit = {
            gte: start,
            lte: end
        }
    } else if (startDate) {
        const start = new Date(startDate)
        start.setHours(0, 0, 0, 0)
        const end = new Date(startDate)
        end.setHours(23, 59, 59, 999)
        where.tanggal_terbit = {
            gte: start,
            lte: end
        }
    }

    // Payment Method Filter (CASH / CREDIT)
    if (paymentMethod && paymentMethod !== "ALL") {
        where.metode_pembayaran = paymentMethod
    }

    // Status Filter (APPROVED / DRAFT / CANCELLED)
    if (status && status !== "ALL") {
        where.status = status
    }

    if (search && search.trim()) {
        const term = search.trim()

        // 1. Lookup matching suppliers
        const matchingSuppliers = await prisma.supplier.findMany({
            where: { name: { contains: term, mode: 'insensitive' } },
            select: { id: true }
        })
        const matchingSupplierIds = matchingSuppliers.map(s => s.id)

        // 2. Lookup matching company projects
        const matchingProjects = await prisma.poCompanyProject.findMany({
            where: { name: { contains: term, mode: 'insensitive' } },
            select: { id: true }
        })
        const matchingProjectIds = matchingProjects.map(p => p.id)

        where.OR = [
            // Nomor PO
            { po_number: { contains: term, mode: 'insensitive' } },
            // Nama Perusahaan
            { companyGroup: { name: { contains: term, mode: 'insensitive' } } },
            // Kategori
            { category: { name: { contains: term, mode: 'insensitive' } } },
            // Nama / Rincian Barang Pesanan
            {
                items: {
                    some: {
                        OR: [
                            { masterItem: { name: { contains: term, mode: 'insensitive' } } },
                            { masterItem: { kode_barang: { contains: term, mode: 'insensitive' } } },
                            { masterItem: { part_number: { contains: term, mode: 'insensitive' } } },
                            { masterItem: { merk: { contains: term, mode: 'insensitive' } } },
                            { keterangan: { contains: term, mode: 'insensitive' } }
                        ]
                    }
                }
            },
            // Catatan / Personel
            { notes: { contains: term, mode: 'insensitive' } },
            { pimpinan: { contains: term, mode: 'insensitive' } },
            { kepala_peralatan: { contains: term, mode: 'insensitive' } },
            { km_hm_kendaraan: { contains: term, mode: 'insensitive' } },
        ]

        if (matchingSupplierIds.length > 0) {
            where.OR.push({ supplierId: { in: matchingSupplierIds } })
        }

        if (matchingProjectIds.length > 0) {
            where.OR.push({ companyProjectId: { in: matchingProjectIds } })
        }
    }

    if (companyGroupId && companyGroupId !== "ALL") where.companyGroupId = companyGroupId
    if (categoryId && categoryId !== "ALL") where.categoryId = categoryId

    const [orders, totalCount] = await Promise.all([
        prisma.purchaseOrder.findMany({
            where,
            include: {
                companyGroup: true,
                category: true,
                items: { include: { masterItem: { include: { supplier: true } } } },
                location: true,
                approvedBy: { select: { id: true, username: true, role: true, employee: { select: { name: true } } } },
                ceo: { select: { id: true, username: true, employee: { select: { name: true } } } },
                fvp: { select: { id: true, username: true, employee: { select: { name: true } } } },
            },
            orderBy: { createdAt: 'desc' },
            skip,
            take: pageSize,
        }),
        prisma.purchaseOrder.count({ where })
    ])

    // Fetch project names
    const projectIds = [...new Set(orders.map(o => o.companyProjectId).filter(Boolean))] as string[]
    const projects = projectIds.length > 0
        ? await prisma.poCompanyProject.findMany({ where: { id: { in: projectIds } } })
        : []
    const projectMap = Object.fromEntries(projects.map(p => [p.id, p.name]))

    // Fetch supplier names
    const supplierIds = [...new Set(orders.map(o => o.supplierId).filter(Boolean))] as string[]
    const suppliers = supplierIds.length > 0
        ? await prisma.supplier.findMany({ where: { id: { in: supplierIds } } })
        : []
    const supplierMap = Object.fromEntries(suppliers.map(s => [s.id, s.name]))

    const enrichedOrders = orders.map(po => ({
        ...po,
        proyek_nama: po.companyProjectId ? projectMap[po.companyProjectId] || "-" : "-",
        supplier_nama: po.supplierId ? supplierMap[po.supplierId] || "-" : "-"
    }))

    return {
        orders: enrichedOrders,
        totalCount,
        totalPages: Math.ceil(totalCount / pageSize)
    }
}

export async function getPurchaseOrderById(id: string) {
    try {
        const session = await auth()
        if (!session?.user) return { success: false, error: "Unauthorized" }

        const po = await prisma.purchaseOrder.findUnique({
            where: { id },
            include: {
                companyGroup: true,
                category: true,
                location: true,
                ceo: { select: { id: true, username: true, employee: { select: { name: true } } } },
                fvp: { select: { id: true, username: true, employee: { select: { name: true } } } },
                approvedBy: { select: { id: true, username: true, role: true, employee: { select: { name: true } } } },
                ceoApprovedBy: { select: { id: true, username: true, role: true, employee: { select: { name: true } } } },
                fvpApprovedBy: { select: { id: true, username: true, role: true, employee: { select: { name: true } } } },
                items: {
                    include: {
                        masterItem: {
                            include: {
                                supplier: true,
                                category: true,
                            }
                        }
                    }
                }
            }
        })

        if (!po) return { success: false, error: "Purchase Order tidak ditemukan" }

        let supplier = null
        if (po.supplierId) {
            supplier = await prisma.supplier.findUnique({ where: { id: po.supplierId } })
        }

        let project = null
        if (po.companyProjectId) {
            project = await prisma.poCompanyProject.findUnique({ where: { id: po.companyProjectId } })
        }

        return {
            success: true,
            data: {
                ...po,
                supplier,
                project
            }
        }
    } catch (err: any) {
        console.error("getPurchaseOrderById error:", err)
        return { success: false, error: err?.message || "Gagal mengambil rincian Purchase Order" }
    }
}

export async function createPurchaseOrder(data: {
    companyGroupId: string
    companyProjectId?: string
    categoryId: string
    supplierId: string
    pimpinan: string
    kepala_peralatan: string
    jabatan_kepala?: string
    metode_pembayaran: PoPaymentMethod
    km_hm_kendaraan?: string
    tanggal_terbit: Date
    locationId?: string
    notes?: string
    pic_name?: string
    pic_phone?: string
    ceoId?: string | null
    fvpId?: string | null
    items: { masterItemId: string; quantity: number; harga_satuan: number; keterangan?: string; subtotal: number; updateMasterPrice?: boolean }[]
    pembuat_admin: string
    isDraft?: boolean
}) {
    const session = await auth()
    if (!session?.user?.employeeId) return { success: false, error: "Unauthorized" }

    const { items, jabatan_kepala } = data

    // Validate foreign keys to prevent P2003 FK errors
    let ceoId = data.ceoId || null
    let fvpId = data.fvpId || null
    let companyProjectId = data.companyProjectId || null

    if (companyProjectId) {
        const projectExists = await prisma.poCompanyProject.findUnique({ where: { id: companyProjectId } })
        if (!projectExists) companyProjectId = null
    }

    let retries = 5
    let attempt = 0
    let lastError: any = null

    while (attempt < retries) {
        try {
            const po_number = await generatePoNumber(data.companyGroupId, data.categoryId, data.tanggal_terbit)
            const poStatus = data.isDraft ? 'DRAFT' : 'SUBMITTED'

            const created = await prisma.purchaseOrder.create({
                data: {
                    po_number,
                    tanggal_terbit: data.tanggal_terbit,
                    companyGroupId: data.companyGroupId,
                    categoryId: data.categoryId,
                    supplierId: data.supplierId,
                    pimpinan: data.pimpinan,
                    kepala_peralatan: data.kepala_peralatan,
                    pembuat_admin: data.pembuat_admin,
                    metode_pembayaran: data.metode_pembayaran,
                    companyProjectId,
                    locationId: data.locationId || null,
                    km_hm_kendaraan: data.km_hm_kendaraan || null,
                    notes: data.notes || null,
                    pic_name: data.pic_name || null,
                    pic_phone: data.pic_phone || null,
                    ceoId,
                    fvpId,
                    status: poStatus,
                    submittedAt: data.isDraft ? null : new Date(),
                    submittedById: data.isDraft ? null : session.user.id,
                    items: {
                        create: items.map(item => ({
                            masterItemId: item.masterItemId,
                            quantity: item.quantity,
                            harga_satuan: item.harga_satuan,
                            keterangan: item.keterangan || null,
                            subtotal: item.subtotal,
                        }))
                    }
                }
            })

            if (jabatan_kepala) {
                await prisma.$executeRaw`UPDATE "PurchaseOrder" SET "jabatan_kepala" = ${jabatan_kepala} WHERE id = ${created.id}`
            }

            // --- Update Master Item Price & Record History if requested ---
            for (const item of items) {
                if (item.updateMasterPrice) {
                    try {
                        const mItem = await prisma.masterItem.findUnique({ where: { id: item.masterItemId } })
                        if (mItem && Math.abs(mItem.harga - item.harga_satuan) > 0.001) {
                            const oldPrice = mItem.harga
                            const newPrice = item.harga_satuan
                            const priceDiff = newPrice - oldPrice
                            const percentage = oldPrice > 0 ? ((newPrice - oldPrice) / oldPrice) * 100 : 0

                            await prisma.masterItemPriceHistory.create({
                                data: {
                                    masterItemId: item.masterItemId,
                                    oldPrice,
                                    newPrice,
                                    priceDiff,
                                    percentage,
                                    reason: `Diperbarui otomatis saat pembuatan PO: ${po_number}`,
                                    updatedById: session.user.id
                                }
                            })

                            await prisma.masterItem.update({
                                where: { id: item.masterItemId },
                                data: { harga: newPrice }
                            })
                        }
                    } catch (err) {
                        console.error("Failed to update master item price from PO:", err)
                    }
                }
            }

            // --- PUSH NOTIFICATION (Hanya jika langsung diajukan / bukan DRAFT) ---
            if (!data.isDraft) {
                const targetedIds = [data.ceoId, data.fvpId].filter(Boolean) as string[]
                
                const admins = await prisma.user.findMany({
                    where: {
                        OR: [
                            { id: { in: targetedIds } },
                            { role: 'SuperAdminBP' }
                        ],
                        fcmToken: { not: null }
                    },
                    select: { fcmToken: true }
                })

                const tokens = admins.map(u => u.fcmToken).filter(Boolean) as string[]
                if (tokens.length > 0) {
                    await sendPushNotification(
                        tokens,
                        "PO Baru Membutuhkan Persetujuan",
                        `PO ${po_number} telah diajukan oleh Logistik.`,
                        { poId: created.id, type: "PO_APPROVAL" }
                    )
                }
            }
            // -------------------------
            revalidatePath("/logistik/po")
            revalidatePath("/logistik/po/create")
            revalidatePath("/logistik/master-barang")
            return { success: true, po_number }
        } catch (e: any) {
            lastError = e
            // Check for Prisma unique constraint violation (code P2002) specifically on po_number
            const isUniqueConstraintPoNumber = 
                e.code === 'P2002' && 
                (
                    (e.meta?.target && Array.isArray(e.meta.target) && e.meta.target.includes('po_number')) ||
                    e.message?.includes('po_number')
                )
            
            if (isUniqueConstraintPoNumber) {
                attempt++
                // Wait a tiny bit (exponential backoff or randomized) before retrying to let other transaction finish
                await new Promise(resolve => setTimeout(resolve, 50 * attempt + Math.random() * 50))
                continue
            }
            
            // If it's a different error, fail immediately
            return { success: false, error: e.message }
        }
    }

    return { success: false, error: `Gagal menyimpan PO setelah ${retries} kali percobaan karena nomor PO duplikat: ${lastError?.message || 'Unique constraint failed'}` }
}

export async function submitPurchaseOrder(id: string) {
    const session = await auth()
    if (!session?.user) return { success: false, error: "Unauthorized" }

    try {
        const existingPo = await prisma.purchaseOrder.findUnique({ where: { id } })
        if (!existingPo) return { success: false, error: "PO tidak ditemukan" }
        if (existingPo.status !== 'DRAFT' && existingPo.status !== 'REJECTED') {
            return { success: false, error: "Hanya PO berstatus Draft atau Ditolak yang dapat diajukan." }
        }

        const updated = await prisma.purchaseOrder.update({
            where: { id },
            data: {
                status: 'SUBMITTED',
                submittedAt: new Date(),
                submittedById: session.user.id,
                rejectionReason: null,
                rejectedAt: null,
                rejectedById: null,
            }
        })

        // Notifikasi ke approver
        const targetedIds = [updated.ceoId, updated.fvpId].filter(Boolean) as string[]
        const approvers = await prisma.user.findMany({
            where: {
                OR: [
                    { id: { in: targetedIds } },
                    { role: 'SuperAdminBP' }
                ],
                fcmToken: { not: null }
            },
            select: { fcmToken: true }
        })

        const tokens = approvers.map(u => u.fcmToken).filter(Boolean) as string[]
        if (tokens.length > 0) {
            await sendPushNotification(
                tokens,
                "PO Diajukan untuk Persetujuan",
                `PO ${updated.po_number} telah diajukan dan menunggu persetujuan Anda.`,
                { poId: updated.id, type: "PO_APPROVAL" }
            )
        }

        if (pusherServer) {
            await pusherServer.trigger('logistik-channel', 'po-updated', {
                message: `PO ${updated.po_number} telah diajukan untuk persetujuan.`,
                poId: updated.id,
                status: 'SUBMITTED'
            })
        }

        revalidatePath("/logistik/po")
        revalidatePath("/logistik/approval")
        return { success: true, status: 'SUBMITTED' }
    } catch (e: any) {
        return { success: false, error: e.message }
    }
}

export async function updatePoStatus(
    id: string,
    status: "APPROVED" | "CANCELLED" | "REJECTED",
    options?: { notes?: string; signatureUrl?: string; channel?: "WEB" | "MOBILE" }
) {
    const session = await auth()
    if (!session?.user?.employeeId) return { success: false, error: "Unauthorized" }

    const userRole = session.user.role as string
    if (!['SuperAdminBP', 'CEO', 'FVP', 'Approver', 'AdminLogistik'].includes(userRole)) {
        return { success: false, error: "Forbidden: Anda tidak memiliki izin untuk mengubah status PO" }
    }

    try {
        const existingPo = await prisma.purchaseOrder.findUnique({ where: { id } })
        if (!existingPo) return { success: false, error: "PO tidak ditemukan" }

        // Enforce: Draft PO cannot be approved!
        if (status === 'APPROVED' && existingPo.status === 'DRAFT') {
            return { success: false, error: "PO masih berstatus Draft dan belum diajukan. Silakan ajukan PO terlebih dahulu sebelum disetujui." }
        }

        let newStatus = existingPo.status
        let updateData: any = {}
        const now = new Date()
        const channel = options?.channel || 'WEB'
        const signatureUrl = options?.signatureUrl || null
        const notes = options?.notes || null

        if (status === 'CANCELLED') {
            newStatus = 'CANCELLED'
            updateData = { 
                status: 'CANCELLED', 
                fvpApprovedAt: null, 
                ceoApprovedAt: null,
                approvedById: null,
                approvalChannel: null,
                ceoApprovedById: null,
                ceoApprovalChannel: null,
                fvpApprovedById: null,
                fvpApprovalChannel: null,
                isBypassed: false
            }
            if (notes) updateData.notes = notes
        } else if (status === 'REJECTED') {
            newStatus = 'REJECTED'
            updateData = {
                status: 'REJECTED',
                rejectionReason: notes || 'Ditolak oleh approver',
                rejectedAt: now,
                rejectedById: session.user.id
            }
        } else if (status === 'APPROVED') {
            const currentUserId = session.user.id
            const isDesignatedCeo = existingPo.ceoId === currentUserId
            const isDesignatedFvp = existingPo.fvpId === currentUserId

            if (isDesignatedCeo || (userRole === 'CEO' && !isDesignatedFvp)) {
                updateData.ceoApprovedAt = now
                updateData.ceoApprovedById = currentUserId
                updateData.ceoApprovalChannel = channel
                if (signatureUrl) updateData.ceoSignatureUrl = signatureUrl
                if (notes) updateData.ceoNotes = notes

                if (existingPo.fvpApprovedAt || !existingPo.fvpId) {
                    newStatus = 'APPROVED'
                    updateData.approvedById = currentUserId
                    updateData.approvalChannel = channel
                    updateData.isBypassed = false
                }
            } else if (isDesignatedFvp || userRole === 'FVP' || userRole === 'Approver') {
                updateData.fvpApprovedAt = now
                updateData.fvpApprovedById = currentUserId
                updateData.fvpApprovalChannel = channel
                if (signatureUrl) updateData.fvpSignatureUrl = signatureUrl
                if (notes) updateData.fvpNotes = notes

                if (existingPo.ceoApprovedAt || !existingPo.ceoId) {
                    newStatus = 'APPROVED'
                    updateData.approvedById = currentUserId
                    updateData.approvalChannel = channel
                    updateData.isBypassed = false
                }
            } else if (userRole === 'SuperAdminBP' || userRole === 'AdminLogistik') {
                // Admin bypass: Sesuai instruksi, admin yg approve TIDAK menambahkan gambar TTD
                updateData.fvpApprovedAt = now
                updateData.ceoApprovedAt = now
                updateData.ceoApprovedById = currentUserId
                updateData.fvpApprovedById = currentUserId
                updateData.ceoApprovalChannel = channel
                updateData.fvpApprovalChannel = channel
                updateData.approvedById = currentUserId
                updateData.approvalChannel = channel
                updateData.isBypassed = true
                newStatus = 'APPROVED'
            }

            if (newStatus === 'APPROVED') {
                updateData.status = 'APPROVED'
                if (!updateData.approvedById) {
                    updateData.approvedById = currentUserId
                    updateData.approvalChannel = channel
                    updateData.isBypassed = false
                }
            }
        }

        const po = await prisma.purchaseOrder.update({ where: { id }, data: updateData })
        
        try {
            if (pusherServer) {
                await pusherServer.trigger('logistik-channel', 'po-updated', {
                    message: `PO ${po.po_number} telah di-${newStatus === 'APPROVED' ? 'setujui' : (status === 'CANCELLED' ? 'batalkan' : 'proses')}`,
                })
            }
        } catch (pusherErr) {
            console.error("Pusher Trigger Error:", pusherErr)
        }
        revalidatePath("/logistik/po")

        // --- PUSH NOTIFICATION ---
        const targetedIds = [po.ceoId, po.fvpId].filter(Boolean) as string[]
        const admins = await prisma.user.findMany({
            where: {
                OR: [
                    { id: { in: targetedIds } },
                    { role: 'SuperAdminBP' }
                ],
                fcmToken: { not: null }
            },
            select: { fcmToken: true }
        })

        const tokens = admins.map(u => u.fcmToken).filter(Boolean) as string[]
        if (tokens.length > 0) {
            let notifTitle = "Info PO"
            let notifBody = ""

            if (status === 'CANCELLED') {
                notifTitle = "PO Dibatalkan"
                notifBody = `PO ${po.po_number} telah dibatalkan oleh ${session.user.username || 'System'}.`
            } else if (newStatus === 'APPROVED') {
                notifTitle = "PO Disetujui Penuh"
                notifBody = `PO ${po.po_number} telah disetujui sepenuhnya dan siap diproses.`
            } else {
                notifTitle = "PO Disetujui Parsial"
                notifBody = `PO ${po.po_number} telah disetujui oleh ${session.user.username || 'System'}. Menunggu persetujuan selanjutnya.`
            }

            await sendPushNotification(tokens, notifTitle, notifBody, { poId: po.id, type: "PO_UPDATE" })
        }
        // -------------------------

        return { success: true }
    } catch (e: any) {
        return { success: false, error: e.message }
    }
}

export async function deletePurchaseOrder(id: string) {
    const session = await auth()
    if (!session?.user?.employeeId) return { success: false, error: "Unauthorized" }

    try {
        await prisma.purchaseOrder.delete({ where: { id } })
        revalidatePath("/logistik/po")
        return { success: true }
    } catch (e: any) {
        return { success: false, error: "Gagal menghapus PO." }
    }
}

// For PO Create form: load master data
export async function getPoFormData() {
    const [companies, categories, suppliers, items, signers] = await Promise.all([
        prisma.poCompanyGroup.findMany({ include: { projects: true }, orderBy: { name: 'asc' } }),
        prisma.poCategory.findMany({ orderBy: { name: 'asc' } }),
        prisma.supplier.findMany({ orderBy: { name: 'asc' } }),
        prisma.masterItem.findMany({ include: { supplier: true }, orderBy: { name: 'asc' } }),
        prisma.user.findMany({ 
            where: { role: { in: ['CEO', 'FVP', 'Approver'] } }, 
            select: { 
                id: true, 
                username: true, 
                role: true,
                employee: { select: { name: true } }
            }, 
            orderBy: { username: 'asc' } 
        }),
    ])
    return { companies, categories, suppliers, items, signers }
}

// For PO Report tab: get filtered & grouped PO data
export async function getPOReport(filters: {
    bulan: number      // 1-12
    tahun: number
    grupBy: "kategori" | "perusahaan" | "metode_pembayaran"
    categoryId?: string
    companyGroupId?: string
    status?: "DRAFT" | "APPROVED" | "CANCELLED" | "ALL"
}) {
    const session = await auth()
    const startDate = new Date(filters.tahun, filters.bulan - 1, 1)
    const endDate = new Date(filters.tahun, filters.bulan, 0, 23, 59, 59)

    const where: any = {
        tanggal_terbit: { gte: startDate, lte: endDate },
    }
    if (filters.categoryId) where.categoryId = filters.categoryId
    if (filters.companyGroupId) where.companyGroupId = filters.companyGroupId
    if (filters.status && filters.status !== "ALL") where.status = filters.status

    const orders = await prisma.purchaseOrder.findMany({
        where,
        include: {
            companyGroup: true,
            category: true,
            items: true,
        },
        orderBy: [{ companyGroupId: 'asc' }, { categoryId: 'asc' }, { tanggal_terbit: 'asc' }]
    })

    // Fetch supplier names
    const supplierIds = [...new Set(orders.map(o => o.supplierId))]
    const suppliers = supplierIds.length > 0
        ? await prisma.supplier.findMany({ where: { id: { in: supplierIds } } })
        : []
    const supplierMap = Object.fromEntries(suppliers.map(s => [s.id, s.name]))

    // Fetch project names via raw SQL
    const orderIds = orders.map(o => o.id)
    const rawProjects = orderIds.length > 0
        ? await prisma.$queryRaw<{ id: string; companyProjectId: string | null }[]>`
            SELECT id, "companyProjectId" FROM "PurchaseOrder" WHERE id = ANY(${orderIds}::text[])`
        : []
    const projectIds = [...new Set(rawProjects.map(r => r.companyProjectId).filter(Boolean))] as string[]
    const projects = projectIds.length > 0
        ? await prisma.poCompanyProject.findMany({ where: { id: { in: projectIds } } })
        : []
    const projectMap = Object.fromEntries(projects.map(p => [p.id, p.name]))
    const poProjectMap = Object.fromEntries(rawProjects.map(r => [r.id, r.companyProjectId ? projectMap[r.companyProjectId] || null : null]))

    const enriched = orders.map(po => ({
        id: po.id,
        po_number: po.po_number,
        tanggal_terbit: po.tanggal_terbit,
        status: po.status,
        metode_pembayaran: po.metode_pembayaran,
        supplier_nama: supplierMap[po.supplierId] || "-",
        perusahaan_nama: (po as any).companyGroup?.name || "-",
        perusahaan_id: po.companyGroupId,
        kategori_nama: (po as any).category?.name || "-",
        kategori_id: po.categoryId,
        proyek_nama: poProjectMap[po.id] || null,
        total: (po as any).items?.reduce((acc: number, item: any) => acc + item.subtotal, 0) || 0,
    }))

    // Group
    const groups: Record<string, { label: string; items: typeof enriched; subtotal: number }> = {}
    for (const po of enriched) {
        let key: string
        let label: string
        if (filters.grupBy === "kategori") {
            key = po.kategori_id; label = po.kategori_nama
        } else if (filters.grupBy === "perusahaan") {
            key = po.perusahaan_id; label = po.perusahaan_nama
        } else {
            key = po.metode_pembayaran; label = po.metode_pembayaran === "CASH" ? "CASH" : "KREDIT"
        }
        if (!groups[key]) groups[key] = { label, items: [], subtotal: 0 }
        groups[key].items.push(po)
        groups[key].subtotal += po.total
    }

    const grandTotal = enriched.reduce((acc, po) => acc + po.total, 0)
    return {
        groups: Object.values(groups),
        grandTotal,
        totalPO: enriched.length,
        filters,
        pembuat: session?.user?.username || "-",
    }
}

export async function updatePurchaseOrder(poId: string, data: {
    companyGroupId: string
    companyProjectId?: string
    categoryId: string
    supplierId: string
    pimpinan: string
    kepala_peralatan: string
    jabatan_kepala?: string
    metode_pembayaran: PoPaymentMethod
    km_hm_kendaraan?: string
    tanggal_terbit: Date
    locationId?: string
    notes?: string
    pic_name?: string
    pic_phone?: string
    ceoId?: string
    fvpId?: string
    items: { masterItemId: string; quantity: number; harga_satuan: number; keterangan?: string; subtotal: number; updateMasterPrice?: boolean }[]
    pembuat_admin: string
}) {
    const session = await auth()
    if (!session?.user?.employeeId) return { success: false, error: "Unauthorized" }

    try {
        const existingPO = await prisma.purchaseOrder.findUnique({ where: { id: poId } })
        if (!existingPO) return { success: false, error: "PO tidak ditemukan" }
        if (existingPO.status !== "DRAFT") {
            return { success: false, error: "Hanya PO berstatus Draft yang bisa diubah." }
        }

        const { items, jabatan_kepala, ...poData } = data

        await prisma.$transaction(async (tx) => {
            await tx.poItem.deleteMany({
                where: { purchaseOrderId: poId }
            })

            await tx.purchaseOrder.update({
                where: { id: poId },
                data: {
                    ...poData,
                    companyProjectId: poData.companyProjectId || null,
                    locationId: poData.locationId || null,
                    ceoId: poData.ceoId || null,
                    fvpId: poData.fvpId || null,
                    items: {
                        create: items.map(item => ({
                            masterItemId: item.masterItemId,
                            quantity: item.quantity,
                            harga_satuan: item.harga_satuan,
                            keterangan: item.keterangan || undefined,
                            subtotal: item.subtotal,
                        }))
                    }
                }
            })

            if (jabatan_kepala !== undefined) {
                await tx.$executeRaw`UPDATE "PurchaseOrder" SET "jabatan_kepala" = ${jabatan_kepala} WHERE id = ${poId}`
            }

            // Update Master Item Price & Record History if requested
            for (const item of items) {
                if (item.updateMasterPrice) {
                    const mItem = await tx.masterItem.findUnique({ where: { id: item.masterItemId } })
                    if (mItem && Math.abs(mItem.harga - item.harga_satuan) > 0.001) {
                        const oldPrice = mItem.harga
                        const newPrice = item.harga_satuan
                        const priceDiff = newPrice - oldPrice
                        const percentage = oldPrice > 0 ? ((newPrice - oldPrice) / oldPrice) * 100 : 0

                        await tx.masterItemPriceHistory.create({
                            data: {
                                masterItemId: item.masterItemId,
                                oldPrice,
                                newPrice,
                                priceDiff,
                                percentage,
                                reason: `Diperbarui otomatis saat perubahan PO: ${existingPO.po_number}`,
                                updatedById: session.user.id
                            }
                        })

                        await tx.masterItem.update({
                            where: { id: item.masterItemId },
                            data: { harga: newPrice }
                        })
                    }
                }
            }
        })

        revalidatePath("/logistik/po")
        revalidatePath(`/logistik/po/${poId}/edit`)
        revalidatePath("/logistik/master-barang")
        return { success: true }
    } catch (e: any) {
        console.error("Update PO Error:", e)
        return { success: false, error: e.message }
    }
}

export async function getApproverQueue() {
    const session = await auth()
    if (!session?.user) return { success: false, data: [], error: "Unauthorized" }

    const user = session.user
    const userRole = user.role as string

    try {
        let where: any = { status: 'SUBMITTED' }

        if (userRole === 'FVP' || userRole === 'Approver') {
            where.fvpApprovedAt = null
            where.OR = [
                { fvpId: user.id },
                { fvpId: null }
            ]
        } else if (userRole === 'CEO') {
            where.ceoApprovedAt = null
            where.OR = [
                { ceoId: user.id },
                { ceoId: null }
            ]
        } else if (!['SuperAdminBP', 'AdminLogistik'].includes(userRole)) {
            return { success: true, data: [] }
        }

        const orders = await prisma.purchaseOrder.findMany({
            where,
            include: {
                companyGroup: true,
                category: true,
                items: {
                    include: {
                        masterItem: {
                            include: {
                                supplier: true
                            }
                        }
                    }
                }
            },
            orderBy: { tanggal_terbit: 'desc' }
        })

        // Fetch supplier & project names
        const projectIds = [...new Set(orders.map(o => o.companyProjectId).filter(Boolean))] as string[]
        const projects = projectIds.length > 0
            ? await prisma.poCompanyProject.findMany({ where: { id: { in: projectIds } } })
            : []
        const projectMap = Object.fromEntries(projects.map(p => [p.id, p.name]))

        const supplierIds = [...new Set(orders.map(o => o.supplierId).filter(Boolean))] as string[]
        const suppliers = supplierIds.length > 0
            ? await prisma.supplier.findMany({ where: { id: { in: supplierIds } } })
            : []
        const supplierMap = Object.fromEntries(suppliers.map(s => [s.id, s.name]))

        // Fetch users (submittedBy, approvers) by ID safely
        const userIds = [...new Set([
            ...orders.map((o: any) => o.submittedById),
            ...orders.map((o: any) => o.fvpApprovedById),
            ...orders.map((o: any) => o.ceoApprovedById),
            ...orders.map((o: any) => o.rejectedById),
            ...orders.map((o: any) => o.approvedById),
            ...orders.map((o: any) => o.ceoId),
            ...orders.map((o: any) => o.fvpId),
        ].filter(Boolean))] as string[]

        const users = userIds.length > 0
            ? await prisma.user.findMany({
                where: { id: { in: userIds } },
                select: { id: true, username: true, employee: { select: { name: true } } }
            })
            : []
        const userMap = Object.fromEntries(users.map(u => [u.id, u]))

        const enrichedOrders = orders.map((po: any) => ({
            ...po,
            proyek_nama: po.companyProjectId ? projectMap[po.companyProjectId] || "-" : "-",
            supplier_nama: po.supplierId ? supplierMap[po.supplierId] || "-" : "-",
            submittedBy: po.submittedById ? userMap[po.submittedById] || null : null,
            fvpApprovedBy: po.fvpApprovedById ? userMap[po.fvpApprovedById] || null : null,
            ceoApprovedBy: po.ceoApprovedById ? userMap[po.ceoApprovedById] || null : null,
            rejectedBy: po.rejectedById ? userMap[po.rejectedById] || null : null,
        }))

        return { success: true, data: enrichedOrders }
    } catch (e: any) {
        console.error("getApproverQueue Error:", e)
        return { success: false, data: [], error: e.message }
    }
}

export async function getApproverHistory() {
    const session = await auth()
    if (!session?.user) return { success: false, data: [], error: "Unauthorized" }

    const user = session.user
    const userRole = user.role as string

    try {
        let where: any = {}

        if (['SuperAdminBP', 'AdminLogistik'].includes(userRole)) {
            where.status = { in: ['APPROVED', 'REJECTED', 'CANCELLED'] }
        } else {
            where.OR = [
                { fvpApprovedById: user.id },
                { ceoApprovedById: user.id },
                { approvedById: user.id },
                { rejectedById: user.id }
            ]
        }

        const orders = await prisma.purchaseOrder.findMany({
            where,
            include: {
                companyGroup: true,
                category: true,
                items: {
                    include: {
                        masterItem: {
                            include: {
                                supplier: true
                            }
                        }
                    }
                }
            },
            orderBy: { updatedAt: 'desc' },
            take: 100
        })

        // Fetch supplier & project names
        const projectIds = [...new Set(orders.map(o => o.companyProjectId).filter(Boolean))] as string[]
        const projects = projectIds.length > 0
            ? await prisma.poCompanyProject.findMany({ where: { id: { in: projectIds } } })
            : []
        const projectMap = Object.fromEntries(projects.map(p => [p.id, p.name]))

        const supplierIds = [...new Set(orders.map(o => o.supplierId).filter(Boolean))] as string[]
        const suppliers = supplierIds.length > 0
            ? await prisma.supplier.findMany({ where: { id: { in: supplierIds } } })
            : []
        const supplierMap = Object.fromEntries(suppliers.map(s => [s.id, s.name]))

        // Fetch users (submittedBy, approvers) by ID safely
        const userIds = [...new Set([
            ...orders.map((o: any) => o.submittedById),
            ...orders.map((o: any) => o.fvpApprovedById),
            ...orders.map((o: any) => o.ceoApprovedById),
            ...orders.map((o: any) => o.rejectedById),
            ...orders.map((o: any) => o.approvedById),
            ...orders.map((o: any) => o.ceoId),
            ...orders.map((o: any) => o.fvpId),
        ].filter(Boolean))] as string[]

        const users = userIds.length > 0
            ? await prisma.user.findMany({
                where: { id: { in: userIds } },
                select: { id: true, username: true, employee: { select: { name: true } } }
            })
            : []
        const userMap = Object.fromEntries(users.map(u => [u.id, u]))

        const enrichedOrders = orders.map((po: any) => ({
            ...po,
            proyek_nama: po.companyProjectId ? projectMap[po.companyProjectId] || "-" : "-",
            supplier_nama: po.supplierId ? supplierMap[po.supplierId] || "-" : "-",
            submittedBy: po.submittedById ? userMap[po.submittedById] || null : null,
            fvpApprovedBy: po.fvpApprovedById ? userMap[po.fvpApprovedById] || null : null,
            ceoApprovedBy: po.ceoApprovedById ? userMap[po.ceoApprovedById] || null : null,
            rejectedBy: po.rejectedById ? userMap[po.rejectedById] || null : null,
        }))

        return { success: true, data: enrichedOrders }
    } catch (e: any) {
        console.error("getApproverHistory Error:", e)
        return { success: false, data: [], error: e.message }
    }
}

export async function updateUserSignature(signatureUrl: string) {
    const session = await auth()
    if (!session?.user?.id) return { success: false, error: "Unauthorized" }

    try {
        await prisma.user.update({
            where: { id: session.user.id },
            data: { signatureUrl }
        })
        return { success: true, signatureUrl }
    } catch (e: any) {
        return { success: false, error: e.message }
    }
}

export async function getUserSignature() {
    const session = await auth()
    if (!session?.user?.id) return { success: false, error: "Unauthorized" }

    try {
        const u = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { signatureUrl: true }
        })
        return { success: true, signatureUrl: u?.signatureUrl || null }
    } catch (e: any) {
        return { success: false, error: e.message }
    }
}

