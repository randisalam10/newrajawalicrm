'use server'

import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { hasPermission, isCorporateUser } from "@/lib/rbac"
import { getEffectiveIncentiveRate } from "@/app/(dashboard)/admin/master-insentif/actions"

function isCorporate(session: any): boolean {
    return isCorporateUser(session?.user)
}

async function canManageRetase(session: any, action: "EDIT" | "DELETE" = "EDIT"): Promise<boolean> {
    if (!session?.user) return false
    const user = session.user

    if (hasPermission(user, "RETASE", action)) return true
    if (hasPermission(user, "PRODUKSI", action)) return true
    if (action === "DELETE" && hasPermission(user, "RETASE", "EDIT")) return true

    return false
}

// --- SETTINGS ---

export async function getRetaseSettings() {
    const session = await auth()
    if (!session?.user?.employeeId) return null

    let filter = {}
    if (!isCorporate(session) && session.user.locationId) {
        filter = { locationId: session.user.locationId }
    }

    const settings = await (prisma as any).retaseSetting.findMany({
        where: filter,
        include: { location: true }
    })

    return settings
}

const mixerSettingSchema = z.object({
    locationId: z.string().min(1, "Location required"),
    price_per_cubic_km: z.coerce.number().min(0, "Tarif per KM tidak boleh negatif"),
    calculation_mode: z.enum(["DISTANCE_ONLY", "DISTANCE_AND_VOLUME", "PER_TRIP"]).default("DISTANCE_ONLY"),
    apply_mode: z.enum(["FUTURE", "BACKDATE"]).default("FUTURE"),
    effective_date: z.string().optional()
})

export async function saveMixerRetaseSetting(formData: FormData) {
    const session = await auth()
    if (!session?.user?.employeeId) return { error: "Unauthorized" }
    if (!await canManageRetase(session)) return { error: "Akses ditolak: Anda hanya memiliki hak akses lihat." }

    try {
        const parsed = mixerSettingSchema.parse(Object.fromEntries(formData.entries()))
        const isCorp = isCorporateUser(session.user)

        if (!isCorp && session.user.locationId !== parsed.locationId) {
            return { error: "Permission Denied: Tidak dapat mengubah setting cabang lain." }
        }

        const effectiveFrom = parsed.apply_mode === 'BACKDATE' && parsed.effective_date
            ? new Date(parsed.effective_date)
            : new Date()

        // 1. Update/create RetaseSetting KHUSUS mixer (price_per_cubic_km & calculation_mode)
        await (prisma as any).retaseSetting.upsert({
            where: { locationId: parsed.locationId },
            update: {
                price_per_cubic_km: parsed.price_per_cubic_km,
                calculation_mode: parsed.calculation_mode,
                effective_from: effectiveFrom,
            },
            create: {
                locationId: parsed.locationId,
                price_per_cubic_km: parsed.price_per_cubic_km,
                calculation_mode: parsed.calculation_mode,
                operator_rate_per_cubic: 1500,
                effective_from: effectiveFrom,
            }
        })

        // 2. Auto-sync KHUSUS ke MasterIncentiveRate untuk SOPIR_MIXER
        if ((prisma as any).masterIncentiveRate) {
            const loc = await prisma.location.findUnique({ where: { id: parsed.locationId } })
            const locName = loc?.name || 'Cabang'

            const formulaType = parsed.calculation_mode === "PER_TRIP"
                ? "PER_TRIP"
                : parsed.calculation_mode === "DISTANCE_AND_VOLUME"
                    ? "PER_M3_KM"
                    : "PER_KM"

            const existingMixer = await (prisma as any).masterIncentiveRate.findFirst({
                where: { kategori_peran: "SOPIR_MIXER", locationId: parsed.locationId }
            })

            if (existingMixer) {
                await (prisma as any).masterIncentiveRate.update({
                    where: { id: existingMixer.id },
                    data: {
                        tarif_utama: parsed.price_per_cubic_km,
                        formula_type: formulaType,
                        effective_date: effectiveFrom,
                        isActive: true
                    }
                })
            } else {
                await (prisma as any).masterIncentiveRate.create({
                    data: {
                        nama_insentif: `Retase Sopir Truk Mixer (${locName})`,
                        kategori_peran: "SOPIR_MIXER",
                        formula_type: formulaType,
                        tarif_utama: parsed.price_per_cubic_km,
                        tarif_sekunder: 0,
                        locationId: parsed.locationId,
                        effective_date: effectiveFrom,
                        keterangan: `Pengaturan tarif retase mixer cabang ${locName}`,
                        isActive: true,
                    }
                })
            }
        }

        revalidatePath("/admin/retase")
        revalidatePath("/admin/reports/retase")
        revalidatePath("/admin/master-insentif")
        revalidatePath("/admin/produksi")

        const dateStr = effectiveFrom.toISOString().slice(0, 10)
        return {
            success: true,
            message: `Tarif retase Sopir Mixer berhasil disimpan (berlaku mulai ${dateStr}). Tarif Operator BP tetap aman & tidak berubah.`
        }
    } catch (e: any) {
        return { error: e.message || "Gagal menyimpan tarif Mixer." }
    }
}

const operatorSettingSchema = z.object({
    locationId: z.string().min(1, "Location required"),
    operator_rate_per_cubic: z.coerce.number().min(0, "Tarif operator tidak boleh negatif"),
    apply_mode: z.enum(["FUTURE", "BACKDATE"]).default("FUTURE"),
    effective_date: z.string().optional()
})

export async function saveOperatorBPRateSetting(formData: FormData) {
    const session = await auth()
    if (!session?.user?.employeeId) return { error: "Unauthorized" }
    if (!await canManageRetase(session)) return { error: "Akses ditolak: Anda hanya memiliki hak akses lihat." }

    try {
        const parsed = operatorSettingSchema.parse(Object.fromEntries(formData.entries()))
        const isCorp = isCorporateUser(session.user)

        if (!isCorp && session.user.locationId !== parsed.locationId) {
            return { error: "Permission Denied: Tidak dapat mengubah setting cabang lain." }
        }

        const effectiveFrom = parsed.apply_mode === 'BACKDATE' && parsed.effective_date
            ? new Date(parsed.effective_date)
            : new Date()

        // 1. Update/create RetaseSetting KHUSUS field operator_rate_per_cubic
        // Nilai price_per_cubic_km & calculation_mode TETAP aman tidak disentuh!
        await (prisma as any).retaseSetting.upsert({
            where: { locationId: parsed.locationId },
            update: {
                operator_rate_per_cubic: parsed.operator_rate_per_cubic,
            },
            create: {
                locationId: parsed.locationId,
                price_per_cubic_km: 10000,
                calculation_mode: "DISTANCE_ONLY",
                operator_rate_per_cubic: parsed.operator_rate_per_cubic,
                effective_from: effectiveFrom,
            }
        })

        // 2. Auto-sync KHUSUS ke MasterIncentiveRate untuk OPERATOR_BP
        if ((prisma as any).masterIncentiveRate) {
            const loc = await prisma.location.findUnique({ where: { id: parsed.locationId } })
            const locName = loc?.name || 'Cabang'

            const existingOp = await (prisma as any).masterIncentiveRate.findFirst({
                where: { kategori_peran: "OPERATOR_BP", locationId: parsed.locationId }
            })

            if (existingOp) {
                await (prisma as any).masterIncentiveRate.update({
                    where: { id: existingOp.id },
                    data: {
                        tarif_utama: parsed.operator_rate_per_cubic,
                        effective_date: effectiveFrom,
                        isActive: true
                    }
                })
            } else {
                await (prisma as any).masterIncentiveRate.create({
                    data: {
                        nama_insentif: `Insentif Operator BP (${locName})`,
                        kategori_peran: "OPERATOR_BP",
                        formula_type: "PER_M3",
                        tarif_utama: parsed.operator_rate_per_cubic,
                        tarif_sekunder: 0,
                        locationId: parsed.locationId,
                        effective_date: effectiveFrom,
                        keterangan: `Pengaturan tarif operator BP cabang ${locName}`,
                        isActive: true,
                    }
                })
            }
        }

        revalidatePath("/admin/retase")
        revalidatePath("/admin/reports/retase")
        revalidatePath("/admin/master-insentif")
        revalidatePath("/admin/produksi")

        const dateStr = effectiveFrom.toISOString().slice(0, 10)
        return {
            success: true,
            message: `Tarif Insentif Operator BP berhasil disimpan (berlaku mulai ${dateStr}). Tarif Sopir Mixer tetap aman & tidak berubah.`
        }
    } catch (e: any) {
        return { error: e.message || "Gagal menyimpan tarif Operator BP." }
    }
}

const updateSettingSchema = z.object({
    locationId: z.string().min(1, "Location required"),
    price_per_cubic_km: z.coerce.number().min(0, "Price cannot be negative"),
    calculation_mode: z.enum(["DISTANCE_ONLY", "DISTANCE_AND_VOLUME", "PER_TRIP"]).default("DISTANCE_ONLY"),
    operator_rate_per_cubic: z.coerce.number().min(0, "Tarif operator tidak boleh negatif").default(0),
    apply_mode: z.enum(["FUTURE", "BACKDATE"]).default("FUTURE"),
    effective_date: z.string().optional()
})

export async function upsertRetaseSetting(formData: FormData) {
    const session = await auth()
    if (!session?.user?.employeeId) return { error: "Unauthorized" }
    if (!await canManageRetase(session)) return { error: "Akses ditolak: Anda hanya memiliki hak akses lihat." }

    try {
        const parsed = updateSettingSchema.parse(Object.fromEntries(formData.entries()))
        const isSuperAdmin = session.user.role === 'SuperAdminBP'

        // Anti-tamper check for regular Admins
        if (!isSuperAdmin && session.user.locationId !== parsed.locationId) {
            return { error: "Permission Denied: Cannot change settings for another branch." }
        }

        // Fetch existing setting to know old values for audit log
        const oldSetting = await (prisma as any).retaseSetting.findUnique({
            where: { locationId: parsed.locationId },
            include: { location: true }
        })

        const effectiveFrom = parsed.apply_mode === 'BACKDATE' && parsed.effective_date
            ? new Date(parsed.effective_date)
            : new Date()

        // 1. Upsert RetaseSetting
        const newSetting = await (prisma as any).retaseSetting.upsert({
            where: { locationId: parsed.locationId },
            update: {
                price_per_cubic_km: parsed.price_per_cubic_km,
                calculation_mode: parsed.calculation_mode,
                operator_rate_per_cubic: parsed.operator_rate_per_cubic,
                effective_from: effectiveFrom,
            },
            create: {
                locationId: parsed.locationId,
                price_per_cubic_km: parsed.price_per_cubic_km,
                calculation_mode: parsed.calculation_mode,
                operator_rate_per_cubic: parsed.operator_rate_per_cubic,
                effective_from: effectiveFrom,
            }
        })

        // Auto-sync to MasterIncentiveRate agar konsisten di Data Master
        if ((prisma as any).masterIncentiveRate) {
            const loc = await prisma.location.findUnique({ where: { id: parsed.locationId } })
            const locName = loc?.name || 'Cabang'

            const formulaType = parsed.calculation_mode === "PER_TRIP"
                ? "PER_TRIP"
                : parsed.calculation_mode === "DISTANCE_AND_VOLUME"
                    ? "PER_M3_KM"
                    : "PER_KM"

            if (parsed.price_per_cubic_km > 0) {
                const existingMixer = await (prisma as any).masterIncentiveRate.findFirst({
                    where: { kategori_peran: "SOPIR_MIXER", locationId: parsed.locationId }
                })
                if (existingMixer) {
                    await (prisma as any).masterIncentiveRate.update({
                        where: { id: existingMixer.id },
                        data: {
                            tarif_utama: parsed.price_per_cubic_km,
                            formula_type: formulaType,
                            effective_date: effectiveFrom,
                            isActive: true
                        }
                    })
                } else {
                    await (prisma as any).masterIncentiveRate.create({
                        data: {
                            nama_insentif: `Retase Sopir Truk Mixer (${locName})`,
                            kategori_peran: "SOPIR_MIXER",
                            formula_type: formulaType,
                            tarif_utama: parsed.price_per_cubic_km,
                            tarif_sekunder: 0,
                            locationId: parsed.locationId,
                            effective_date: effectiveFrom,
                            keterangan: `Sinkronisasi otomatis dari setting retase cabang ${locName}`,
                            isActive: true,
                        }
                    })
                }
            }

            if (parsed.operator_rate_per_cubic > 0) {
                const existingOp = await (prisma as any).masterIncentiveRate.findFirst({
                    where: { kategori_peran: "OPERATOR_BP", locationId: parsed.locationId }
                })
                if (existingOp) {
                    await (prisma as any).masterIncentiveRate.update({
                        where: { id: existingOp.id },
                        data: { tarif_utama: parsed.operator_rate_per_cubic, effective_date: effectiveFrom, isActive: true }
                    })
                } else {
                    await (prisma as any).masterIncentiveRate.create({
                        data: {
                            nama_insentif: `Insentif Operator BP (${locName})`,
                            kategori_peran: "OPERATOR_BP",
                            formula_type: "PER_M3",
                            tarif_utama: parsed.operator_rate_per_cubic,
                            tarif_sekunder: 0,
                            locationId: parsed.locationId,
                            effective_date: effectiveFrom,
                            keterangan: `Sinkronisasi otomatis dari setting tarif cabang ${locName}`,
                            isActive: true,
                        }
                    })
                }
            }
        }

        let revisedCount = 0

        // 2. If BACKDATE: recalculate past confirmed transactions from effective_date
        if (parsed.apply_mode === 'BACKDATE' && parsed.effective_date) {
            const startOfEffectiveDate = new Date(`${parsed.effective_date}T00:00:00.000Z`)

            // Find all confirmed transactions for this branch on or after startOfEffectiveDate that have retase
            const pastTransactions = await (prisma as any).productionTransaction.findMany({
                where: {
                    locationId: parsed.locationId,
                    date: { gte: startOfEffectiveDate },
                    retase: { isNot: null }
                },
                include: { retase: true }
            })

            if (pastTransactions.length > 0) {
                const updateOps: any[] = []
                const recalculationLogs: any[] = []

                for (const tx of pastTransactions) {
                    if (!tx.retase) continue
                    const oldRetase = tx.retase
                    const distance = oldRetase.calculated_distance
                    const volume = tx.volume_cubic ?? oldRetase.volume

                    const newIncome = parsed.calculation_mode === "PER_TRIP"
                        ? parsed.price_per_cubic_km
                        : parsed.calculation_mode === "DISTANCE_ONLY"
                            ? distance * parsed.price_per_cubic_km
                            : distance * volume * parsed.price_per_cubic_km

                    updateOps.push(
                        (prisma as any).retase.update({
                            where: { id: oldRetase.id },
                            data: {
                                price_per_cubic_km: parsed.price_per_cubic_km,
                                calculation_mode: parsed.calculation_mode,
                                income_amount: newIncome
                            }
                        })
                    )

                    recalculationLogs.push({
                        transactionId: tx.id,
                        retaseId: oldRetase.id,
                        distance,
                        volume,
                        oldIncome: oldRetase.income_amount,
                        newIncome,
                        oldPrice: oldRetase.price_per_cubic_km,
                        newPrice: parsed.price_per_cubic_km,
                        oldMode: oldRetase.calculation_mode,
                        newMode: parsed.calculation_mode
                    })
                }

                if (updateOps.length > 0) {
                    await prisma.$transaction(updateOps)
                    revisedCount = updateOps.length
                }

                // Record audit log for backdate revision
                await (prisma as any).auditLog.create({
                    data: {
                        action: "REVISE_RETROACTIVE",
                        entity: "RetaseSetting",
                        recordId: newSetting.id,
                        old_values: JSON.stringify({
                            oldSetting,
                            recalculatedItems: recalculationLogs.map(i => ({
                                transactionId: i.transactionId,
                                oldIncome: i.oldIncome,
                                oldMode: i.oldMode,
                                oldPrice: i.oldPrice
                            }))
                        }),
                        new_values: JSON.stringify({
                            newSetting,
                            effectiveDate: parsed.effective_date,
                            revisedTransactionsCount: revisedCount,
                            recalculatedItems: recalculationLogs.map(i => ({
                                transactionId: i.transactionId,
                                newIncome: i.newIncome,
                                newMode: i.newMode,
                                newPrice: i.newPrice
                            }))
                        }),
                        userId: session.user.id
                    }
                })
            }
        } else {
            // Normal update: log setting change
            await (prisma as any).auditLog.create({
                data: {
                    action: "EDIT",
                    entity: "RetaseSetting",
                    recordId: newSetting.id,
                    old_values: oldSetting ? JSON.stringify(oldSetting) : null,
                    new_values: JSON.stringify(newSetting),
                    userId: session.user.id
                }
            })
        }

        revalidatePath("/admin/retase")
        revalidatePath("/admin/reports/retase")
        revalidatePath("/admin/master-insentif")
        revalidatePath("/admin/produksi")
        return {
            success: true,
            revisedCount,
            message: revisedCount > 0
                ? `Pengaturan disimpan dan otomatis disinkronkan ke Data Master (${revisedCount} transaksi pada/setelah tanggal berlaku telah disesuaikan).`
                : "Pengaturan harga retase berhasil disimpan dan otomatis disinkronkan ke Data Master."
        }
    } catch (e: any) {
        return { error: e.message || "Something went wrong" }
    }
}

// --- PENDING / CONFIRMATIONS ---

export async function getTransactions(status: "Pending" | "Confirmed") {
    const session = await auth()
    if (!session?.user?.id) return []

    let filter: any = { status }
    if (!isCorporate(session) && session.user.locationId) {
        filter.locationId = session.user.locationId
    }

    return await (prisma as any).productionTransaction.findMany({
        where: filter,
        include: {
            project: { include: { customer: true } },
            vehicle: true,
            driver: true,
            concreteQuality: true,
            workItem: true,
            location: true,
            retase: true,
            invoiceItem: true,
        },
        orderBy: { date: 'desc' }
    })
}

export async function confirmTransaction(transactionId: string, distance: number) {
    const session = await auth()
    if (!session?.user?.id) return { error: "Unauthorized" }
    if (!await canManageRetase(session, "EDIT")) return { error: "Akses ditolak: Anda hanya memiliki hak akses lihat." }

    try {
        const transaction: any = await prisma.productionTransaction.findUnique({
            where: { id: transactionId },
            include: { vehicle: true }
        })

        if (!transaction) return { error: "Transaction not found" }
        if (transaction.status === "Confirmed") return { error: "Already confirmed" }

        // Resolve rate: Prioritaskan MasterIncentiveRate (plant spesifik -> global), fallback ke RetaseSetting
        const txDate = transaction.date ? new Date(transaction.date) : new Date()
        const masterRate = await getEffectiveIncentiveRate("SOPIR_MIXER", transaction.locationId, txDate)

        // Needs RetaseSetting based on Transaction's Location
        const setting = await (prisma as any).retaseSetting.findUnique({
            where: { locationId: transaction.locationId }
        })

        let calcMode: "DISTANCE_ONLY" | "DISTANCE_AND_VOLUME" | "PER_TRIP" = "DISTANCE_ONLY"
        let price_per_cubic_km = 0

        if (masterRate && Number(masterRate.tarif_utama) > 0) {
            price_per_cubic_km = Number(masterRate.tarif_utama)
            if (masterRate.formula_type === "PER_TRIP") {
                calcMode = "PER_TRIP"
            } else if (masterRate.formula_type === "PER_M3_KM") {
                calcMode = "DISTANCE_AND_VOLUME"
            } else {
                calcMode = "DISTANCE_ONLY"
            }
        } else if (setting && Number(setting.price_per_cubic_km) > 0) {
            calcMode = (setting.calculation_mode as any) || "DISTANCE_ONLY"
            price_per_cubic_km = Number(setting.price_per_cubic_km) || 0
        } else {
            return { error: "Belum ada pengaturan tarif retase Sopir Mixer untuk cabang pesanan ini! Harap atur di Data Master Insentif & Tarif." }
        }

        const volume = transaction.volume_cubic
        const calcDistance = Number(distance)

        const income_amount = calcMode === "PER_TRIP"
            ? price_per_cubic_km
            : calcMode === "DISTANCE_ONLY"
                ? calcDistance * price_per_cubic_km
                : calcDistance * volume * price_per_cubic_km

        await prisma.$transaction([
            (prisma as any).retase.create({
                data: {
                    transactionId,
                    driverId: transaction.driverId,
                    calculated_distance: calcDistance,
                    volume: volume,
                    price_per_cubic_km: price_per_cubic_km,
                    income_amount: income_amount,
                    calculation_mode: calcMode
                }
            }),
            prisma.productionTransaction.update({
                where: { id: transactionId },
                data: { status: "Confirmed" }
            })
        ])

        revalidatePath("/admin/retase")
        return { success: true }
    } catch (e: any) {
        console.error(e)
        return { error: e.message || "Failed to confirm" }
    }
}

// --- AUDIT LOG, UPDATE & DELETE ---

const updateTransactionSchema = z.object({
    id: z.string().min(1, "ID transaksi wajib ada"),
    trip_sequence: z.coerce.number().int().min(1, "Nomor TM minimal 1"),
    volume_cubic: z.coerce.number().min(0.1, "Volume minimal 0.1"),
    slump: z.string().min(1, "Slump wajib diisi"),
    date: z.string().optional(),
    projectId: z.string().min(1, "Proyek wajib dipilih"),
    qualityId: z.string().min(1, "Mutu wajib dipilih"),
    vehicleId: z.string().min(1, "Mixer wajib dipilih"),
    driverId: z.string().min(1, "Supir wajib dipilih"),
    operatorId: z.string().nullable().optional(),
    workItemId: z.string().min(1, "Item pekerjaan wajib dipilih"),
})

export async function updatePendingTransaction(formData: FormData) {
    const session = await auth()
    if (!session?.user?.id) return { error: "Unauthorized: Silakan login terlebih dahulu." }
    if (!await canManageRetase(session, "EDIT")) {
        return { error: "Akses ditolak: Anda tidak memiliki izin untuk mengedit transaksi." }
    }

    try {
        const rawData = Object.fromEntries(formData.entries())
        const parsed = updateTransactionSchema.parse(rawData)

        const existing: any = await prisma.productionTransaction.findUnique({
            where: { id: parsed.id },
            include: {
                project: { include: { customer: true } },
                concreteQuality: true,
                driver: true,
                vehicle: true,
                workItem: true,
                invoiceItem: true,
            }
        })

        if (!existing) return { error: "Transaksi tidak ditemukan." }

        // Aturan Integritas: Surat jalan yang sudah Confirmed terkunci permanen
        if (existing.status !== "Pending") {
            return { error: "Akses ditolak: Surat jalan yang sudah berstatus Confirmed terkunci permanen dan tidak dapat diubah." }
        }

        // Aturan Integritas: Surat jalan yang sudah masuk invoice terkunci mutlak
        if (existing.invoiceItem) {
            return { error: "Akses ditolak: Surat jalan ini sudah masuk dalam invoice penagihan dan terkunci permanen." }
        }

        const isSuperAdmin = session.user.role === 'SuperAdminBP'
        if (!isSuperAdmin && session.user.locationId && existing.locationId !== session.user.locationId) {
            return { error: "Akses ditolak: Tidak dapat mengedit transaksi cabang lain." }
        }

        const updateData: any = {
            trip_sequence: parsed.trip_sequence,
            volume_cubic: parsed.volume_cubic,
            slump: parsed.slump,
            projectId: parsed.projectId,
            qualityId: parsed.qualityId,
            vehicleId: parsed.vehicleId,
            driverId: parsed.driverId,
            operatorId: parsed.operatorId || null,
            workItemId: parsed.workItemId,
        }

        if (parsed.date) {
            const parsedDate = new Date(parsed.date)
            if (!isNaN(parsedDate.getTime())) {
                updateData.date = parsedDate
            }
        }

        await prisma.$transaction([
            (prisma as any).auditLog.create({
                data: {
                    action: "UPDATE",
                    entity: "ProductionTransaction",
                    recordId: parsed.id,
                    old_values: JSON.stringify(existing),
                    new_values: JSON.stringify(updateData),
                    userId: session.user.id
                }
            }),
            prisma.productionTransaction.update({
                where: { id: parsed.id },
                data: updateData
            })
        ])

        revalidatePath("/admin/retase")
        revalidatePath("/admin/produksi")
        return { success: true }
    } catch (e: any) {
        console.error("Gagal mengupdate transaksi:", e)
        return { error: e.message || "Gagal mengupdate transaksi" }
    }
}

export async function deleteConfirmedTransaction(transactionId: string) {
    const session = await auth()
    if (!session?.user?.id) return { error: "Unauthorized" }
    if (!await canManageRetase(session, "DELETE")) return { error: "Akses ditolak: Anda tidak memiliki izin untuk menghapus transaksi." }

    try {
        const transaction: any = await prisma.productionTransaction.findUnique({
            where: { id: transactionId },
            include: { 
                retase: true,
                invoiceItem: true,
            }
        })

        if (!transaction) return { error: "Transaksi tidak ditemukan." }

        if (transaction.invoiceItem) {
            return { error: "Akses ditolak: Surat jalan tidak dapat dihapus karena sudah masuk dalam invoice penagihan." }
        }

        const isSuperAdmin = session.user.role === 'SuperAdminBP'
        if (!isSuperAdmin && session.user.locationId && session.user.locationId !== transaction.locationId) {
            return { error: "Akses ditolak: Tidak dapat menghapus transaksi cabang lain." }
        }

        // Create Audit Log and Delete 
        await prisma.$transaction([
            (prisma as any).auditLog.create({
                data: {
                    action: "DELETE",
                    entity: "ProductionTransaction",
                    recordId: transactionId,
                    old_values: JSON.stringify(transaction),
                    userId: session.user.id
                }
            }),
            ...(transaction.retase ? [
                (prisma as any).retase.deleteMany({
                    where: { transactionId: transactionId }
                })
            ] : []),
            prisma.productionTransaction.delete({
                where: { id: transactionId }
            })
        ])

        revalidatePath("/admin/retase")
        revalidatePath("/admin/produksi")
        return { success: true }
    } catch (e: any) {
        console.error(e)
        return { error: e.message || "Failed to delete" }
    }
}

export const deletePendingTransaction = deleteConfirmedTransaction

// ─── AGGREGATE DUMP TRUCK RETASE ACTIONS ─────────────────────────────────────

export async function getAggregateRetaseSettings() {
    const session = await auth()
    if (!session?.user) return []

    let filter = {}
    if (!isCorporate(session) && session.user.locationId) {
        filter = { locationId: session.user.locationId }
    }

    return await prisma.aggregateRetaseSetting.findMany({
        where: filter,
        include: { location: true },
        orderBy: { location: { name: 'asc' } }
    })
}

const updateAggregateSettingSchema = z.object({
    locationId: z.string().min(1, "Cabang wajib diisi"),
    price_dt_besar: z.coerce.number().min(0, "Tarif DT Besar tidak boleh negatif"),
    price_dt_kecil: z.coerce.number().min(0, "Tarif DT Kecil tidak boleh negatif"),
    default_distance_km: z.coerce.number().min(0, "Jarak default tidak boleh negatif"),
})

export async function upsertAggregateRetaseSetting(formData: FormData) {
    const session = await auth()
    if (!session?.user) return { error: "Unauthorized" }
    if (!await canManageRetase(session)) return { error: "Akses ditolak: Anda tidak memiliki izin." }

    try {
        const parsed = updateAggregateSettingSchema.parse(Object.fromEntries(formData.entries()))
        const isSuperAdmin = session.user.role === 'SuperAdminBP'

        if (!isSuperAdmin && session.user.locationId !== parsed.locationId) {
            return { error: "Permission Denied: Tidak dapat mengubah setting cabang lain." }
        }

        await prisma.aggregateRetaseSetting.upsert({
            where: { locationId: parsed.locationId },
            update: {
                price_dt_besar: parsed.price_dt_besar,
                price_dt_kecil: parsed.price_dt_kecil,
                default_distance_km: parsed.default_distance_km,
            },
            create: {
                locationId: parsed.locationId,
                price_dt_besar: parsed.price_dt_besar,
                price_dt_kecil: parsed.price_dt_kecil,
                default_distance_km: parsed.default_distance_km,
            }
        })

        revalidatePath("/admin/retase")
        revalidatePath("/admin/material-agregat")
        return { success: true, message: "Pengaturan tarif retase Dump Truck berhasil disimpan." }
    } catch (e: any) {
        console.error(e)
        return { error: e.message || "Gagal menyimpan tarif retase Dump Truck" }
    }
}

export async function getAggregateRetaseTransactions() {
    const session = await auth()
    if (!session?.user) return []

    let inFilter: any = { source_type: "Internal" }
    let outFilter: any = { transport_mode: "INTERNAL_DT" }
    if (!isCorporate(session) && session.user.locationId) {
        inFilter.locationId = session.user.locationId
        outFilter.locationId = session.user.locationId
    }

    const [incomings, outgoings] = await Promise.all([
        prisma.aggregateIncoming.findMany({
            where: inFilter,
            include: {
                location: true,
                vehicle: true,
                driver: true,
            },
            orderBy: { date: "desc" }
        }),
        prisma.aggregateOutgoing.findMany({
            where: outFilter,
            include: {
                location: true,
                vehicle: true,
                driver: true,
            },
            orderBy: { date: "desc" }
        })
    ])

    return [
        ...incomings.map(i => ({ ...i, direction: "INCOMING" as const })),
        ...outgoings.map(o => ({ ...o, direction: "OUTGOING" as const }))
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}

export async function toggleAggregateRetasePaid(id: string, isPaid: boolean, type?: "incoming" | "outgoing") {
    const session = await auth()
    if (!session?.user) return { error: "Unauthorized" }
    if (!await canManageRetase(session)) return { error: "Akses ditolak." }

    try {
        if (type === "outgoing") {
            await prisma.aggregateOutgoing.update({
                where: { id },
                data: { is_retase_paid: isPaid }
            })
        } else if (type === "incoming") {
            await prisma.aggregateIncoming.update({
                where: { id },
                data: { is_retase_paid: isPaid }
            })
        } else {
            const incoming = await prisma.aggregateIncoming.findUnique({ where: { id } })
            if (incoming) {
                await prisma.aggregateIncoming.update({
                    where: { id },
                    data: { is_retase_paid: isPaid }
                })
            } else {
                await prisma.aggregateOutgoing.update({
                    where: { id },
                    data: { is_retase_paid: isPaid }
                })
            }
        }
        revalidatePath("/admin/retase")
        revalidatePath("/admin/reports/retase")
        return { success: true }
    } catch (e: any) {
        return { error: e.message }
    }
}

// ─── KOP SURAT & LOGO PER CABANG ACTIONS ─────────────────────────────────────

const locationKopSchema = z.object({
    locationId: z.string().min(1, "Cabang wajib dipilih"),
    company_name: z.string().optional().nullable(),
    company_sub: z.string().optional().nullable(),
    address: z.string().optional().nullable(),
    phone: z.string().optional().nullable(),
    email: z.string().optional().nullable(),
    logo_url: z.string().optional().nullable(),
    kop_footer: z.string().optional().nullable(),
})

export async function getLocationKopSettings(locationId?: string) {
    const session = await auth()
    if (!session?.user?.id) return null

    const isCorp = isCorporate(session)
    let targetLocationId = locationId

    if (!isCorp) {
        targetLocationId = session.user.locationId || undefined
    }

    if (!targetLocationId) {
        const firstLoc = await prisma.location.findFirst({ orderBy: { name: 'asc' } })
        targetLocationId = firstLoc?.id
    }

    if (!targetLocationId) return null

    const location = await prisma.location.findUnique({
        where: { id: targetLocationId },
        select: {
            id: true,
            name: true,
            company_name: true,
            company_sub: true,
            address: true,
            phone: true,
            email: true,
            logo_url: true,
            kop_footer: true,
        }
    })

    return location
}

export async function updateLocationKopSettings(formData: FormData) {
    const session = await auth()
    if (!session?.user?.id) return { error: "Unauthorized: Silakan login terlebih dahulu." }
    if (!await canManageRetase(session, "EDIT")) {
        return { error: "Akses ditolak: Anda tidak memiliki izin untuk mengubah pengaturan kop surat." }
    }

    try {
        const rawData = Object.fromEntries(formData.entries())
        const parsed = locationKopSchema.parse(rawData)

        const isCorp = isCorporate(session)
        if (!isCorp && session.user.locationId !== parsed.locationId) {
            return { error: "Akses ditolak: Tidak dapat mengubah kop surat cabang lain." }
        }

        const existingLoc = await prisma.location.findUnique({
            where: { id: parsed.locationId }
        })
        if (!existingLoc) return { error: "Cabang tidak ditemukan." }

        const updateData = {
            company_name: parsed.company_name ? String(parsed.company_name).trim() || null : null,
            company_sub: parsed.company_sub ? String(parsed.company_sub).trim() || null : null,
            address: parsed.address ? String(parsed.address).trim() || null : null,
            phone: parsed.phone ? String(parsed.phone).trim() || null : null,
            email: parsed.email ? String(parsed.email).trim() || null : null,
            logo_url: parsed.logo_url ? String(parsed.logo_url).trim() || null : null,
            kop_footer: parsed.kop_footer ? String(parsed.kop_footer).trim() || null : null,
        }

        await prisma.$transaction([
            (prisma as any).auditLog.create({
                data: {
                    action: "UPDATE",
                    entity: "LocationKop",
                    recordId: parsed.locationId,
                    old_values: JSON.stringify({
                        company_name: (existingLoc as any).company_name,
                        company_sub: (existingLoc as any).company_sub,
                        address: (existingLoc as any).address,
                        phone: (existingLoc as any).phone,
                        email: (existingLoc as any).email,
                        logo_url: (existingLoc as any).logo_url,
                        kop_footer: (existingLoc as any).kop_footer,
                    }),
                    new_values: JSON.stringify(updateData),
                    userId: session.user.id
                }
            }),
            (prisma.location as any).update({
                where: { id: parsed.locationId },
                data: updateData
            })
        ])

        revalidatePath("/admin/retase")
        revalidatePath("/admin/produksi")
        return { success: true }
    } catch (e: any) {
        console.error("Gagal menyimpan kop surat cabang:", e)
        return { error: e.message || "Gagal menyimpan kop surat cabang" }
    }
}

