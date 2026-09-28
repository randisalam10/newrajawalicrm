'use server'

import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { revalidatePath } from "next/cache"
import { z } from "zod"

function isCorporate(session: any): boolean {
    if (!session?.user) return false
    const role = session.user.role || ""
    const scope = session.user.roleScope || ""
    return role === "SuperAdminBP" || scope === "ALL_BRANCHES" || ["CEO", "FVP", "Approver"].includes(role)
}

function canManageRetase(session: any): boolean {
    if (!session?.user) return false
    const role = session.user.role || ""
    if (["CEO", "FVP", "Approver"].includes(role)) return false
    return role === "SuperAdminBP" || role === "AdminBP"
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
    calculation_mode: z.enum(["DISTANCE_ONLY", "DISTANCE_AND_VOLUME"]).default("DISTANCE_ONLY"),
    apply_mode: z.enum(["FUTURE", "BACKDATE"]).default("FUTURE"),
    effective_date: z.string().optional()
})

export async function saveMixerRetaseSetting(formData: FormData) {
    const session = await auth()
    if (!session?.user?.employeeId) return { error: "Unauthorized" }
    if (!canManageRetase(session)) return { error: "Akses ditolak: Anda hanya memiliki hak akses lihat." }

    try {
        const parsed = mixerSettingSchema.parse(Object.fromEntries(formData.entries()))
        const isSuperAdmin = session.user.role === 'SuperAdminBP'

        if (!isSuperAdmin && session.user.locationId !== parsed.locationId) {
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

            const existingMixer = await (prisma as any).masterIncentiveRate.findFirst({
                where: { kategori_peran: "SOPIR_MIXER", locationId: parsed.locationId }
            })

            if (existingMixer) {
                await (prisma as any).masterIncentiveRate.update({
                    where: { id: existingMixer.id },
                    data: {
                        tarif_utama: parsed.price_per_cubic_km,
                        effective_date: effectiveFrom,
                        isActive: true
                    }
                })
            } else {
                await (prisma as any).masterIncentiveRate.create({
                    data: {
                        nama_insentif: `Retase Sopir Truk Mixer (${locName})`,
                        kategori_peran: "SOPIR_MIXER",
                        formula_type: "PER_KM",
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
    if (!canManageRetase(session)) return { error: "Akses ditolak: Anda hanya memiliki hak akses lihat." }

    try {
        const parsed = operatorSettingSchema.parse(Object.fromEntries(formData.entries()))
        const isSuperAdmin = session.user.role === 'SuperAdminBP'

        if (!isSuperAdmin && session.user.locationId !== parsed.locationId) {
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
    calculation_mode: z.enum(["DISTANCE_ONLY", "DISTANCE_AND_VOLUME"]).default("DISTANCE_ONLY"),
    operator_rate_per_cubic: z.coerce.number().min(0, "Tarif operator tidak boleh negatif").default(0),
    apply_mode: z.enum(["FUTURE", "BACKDATE"]).default("FUTURE"),
    effective_date: z.string().optional()
})

export async function upsertRetaseSetting(formData: FormData) {
    const session = await auth()
    if (!session?.user?.employeeId) return { error: "Unauthorized" }
    if (!canManageRetase(session)) return { error: "Akses ditolak: Anda hanya memiliki hak akses lihat." }

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

            if (parsed.price_per_cubic_km > 0) {
                const existingMixer = await (prisma as any).masterIncentiveRate.findFirst({
                    where: { kategori_peran: "SOPIR_MIXER", locationId: parsed.locationId }
                })
                if (existingMixer) {
                    await (prisma as any).masterIncentiveRate.update({
                        where: { id: existingMixer.id },
                        data: { tarif_utama: parsed.price_per_cubic_km, effective_date: effectiveFrom, isActive: true }
                    })
                } else {
                    await (prisma as any).masterIncentiveRate.create({
                        data: {
                            nama_insentif: `Retase Sopir Truk Mixer (${locName})`,
                            kategori_peran: "SOPIR_MIXER",
                            formula_type: "PER_KM",
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

                    const newIncome = parsed.calculation_mode === "DISTANCE_ONLY"
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
    if (!session?.user?.employeeId) return []

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
            retase: true
        },
        orderBy: { date: 'desc' }
    })
}

export async function confirmTransaction(transactionId: string, distance: number) {
    const session = await auth()
    if (!session?.user?.employeeId) return { error: "Unauthorized" }
    if (!canManageRetase(session)) return { error: "Akses ditolak: Anda hanya memiliki hak akses lihat." }

    try {
        const transaction: any = await prisma.productionTransaction.findUnique({
            where: { id: transactionId },
            include: { vehicle: true }
        })

        if (!transaction) return { error: "Transaction not found" }
        if (transaction.status === "Confirmed") return { error: "Already confirmed" }

        // Needs RetaseSetting based on Transaction's Location
        const setting = await (prisma as any).retaseSetting.findUnique({
            where: { locationId: transaction.locationId }
        })

        if (!setting) {
            return { error: "Belum ada pengaturan Harga Retase untuk cabang pesanan ini! Harap atur di tab Pengaturan terlebih dahulu." }
        }

        const calcMode = setting.calculation_mode || "DISTANCE_ONLY"
        const price_per_cubic_km = setting.price_per_cubic_km
        const volume = transaction.volume_cubic
        const calcDistance = Number(distance)

        const income_amount = calcMode === "DISTANCE_ONLY"
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

// --- AUDIT LOG & DELETE ---

export async function deleteConfirmedTransaction(transactionId: string) {
    const session = await auth()
    if (!session?.user?.employeeId) return { error: "Unauthorized" }
    if (!canManageRetase(session)) return { error: "Akses ditolak: Anda hanya memiliki hak akses lihat." }

    try {
        const transaction: any = await prisma.productionTransaction.findUnique({
            where: { id: transactionId },
            include: { retase: true }
        })

        if (!transaction) return { error: "Not found" }

        const isSuperAdmin = session.user.role === 'SuperAdminBP'
        if (!isSuperAdmin && session.user.locationId !== transaction.locationId) {
            return { error: "Access Denied" }
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
            prisma.productionTransaction.delete({
                where: { id: transactionId }
            })
        ])

        revalidatePath("/admin/retase")
        return { success: true }
    } catch (e: any) {
        console.error(e)
        return { error: e.message || "Failed to delete" }
    }
}

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
    if (!canManageRetase(session)) return { error: "Akses ditolak: Anda tidak memiliki izin." }

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

    let filter: any = { source_type: "Internal" }
    if (!isCorporate(session) && session.user.locationId) {
        filter.locationId = session.user.locationId
    }

    return await prisma.aggregateIncoming.findMany({
        where: filter,
        include: {
            location: true,
            vehicle: true,
            driver: true,
        },
        orderBy: { date: "desc" }
    })
}

export async function toggleAggregateRetasePaid(id: string, isPaid: boolean) {
    const session = await auth()
    if (!session?.user) return { error: "Unauthorized" }
    if (!canManageRetase(session)) return { error: "Akses ditolak." }

    try {
        await prisma.aggregateIncoming.update({
            where: { id },
            data: { is_retase_paid: isPaid }
        })
        revalidatePath("/admin/retase")
        return { success: true }
    } catch (e: any) {
        return { error: e.message }
    }
}

