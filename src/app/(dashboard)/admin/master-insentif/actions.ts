"use server"
 
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { revalidatePath } from "next/cache"
import { ROLE_CATEGORIES, FORMULA_TEMPLATES } from "./constants"

export async function getMasterIncentives(filters?: {
    locationId?: string
    roleCategory?: string
}) {
    const session = await auth()
    if (!session?.user) return []

    // Seed default records if table is completely empty
    await seedInitialIncentivesIfEmpty()
    // Auto-sinkronisasi settingan retase cabang yang sudah ada ke data master
    await syncExistingRetaseSettingsToMasterIncentives()

    if (!(prisma as any).masterIncentiveRate) {
        return []
    }

    const where: any = {}
    if (filters?.locationId && filters.locationId !== "all") {
        where.OR = [
            { locationId: filters.locationId },
            { locationId: null }
        ]
    }
    if (filters?.roleCategory && filters.roleCategory !== "ALL") {
        where.kategori_peran = filters.roleCategory
    }

    const items = await prisma.masterIncentiveRate.findMany({
        where,
        include: {
            location: {
                select: { id: true, name: true }
            }
        },
        orderBy: [
            { kategori_peran: "asc" },
            { effective_date: "desc" },
            { createdAt: "desc" }
        ]
    })

    return items
}

export async function upsertMasterIncentive(data: {
    id?: string
    nama_insentif: string
    kategori_peran: string
    formula_type: string
    tarif_utama: number
    tarif_sekunder?: number
    locationId?: string | null
    effective_date: string // YYYY-MM-DD
    keterangan?: string
    isActive?: boolean
}) {
    const session = await auth()
    if (!session?.user) {
        return { error: "Sesi telah berakhir, silakan login kembali." }
    }

    try {
        const effectiveDateObj = new Date(`${data.effective_date}T00:00:00.000Z`)
        const cleanLocationId = data.locationId === "ALL" || !data.locationId ? null : data.locationId

        if (data.id) {
            // Update
            const updated = await prisma.masterIncentiveRate.update({
                where: { id: data.id },
                data: {
                    nama_insentif: data.nama_insentif.trim(),
                    kategori_peran: data.kategori_peran,
                    formula_type: data.formula_type,
                    tarif_utama: Number(data.tarif_utama) || 0,
                    tarif_sekunder: Number(data.tarif_sekunder) || 0,
                    locationId: cleanLocationId,
                    effective_date: effectiveDateObj,
                    keterangan: data.keterangan?.trim() || null,
                    isActive: data.isActive !== undefined ? data.isActive : true,
                }
            })

            // Sinkronisasi balik (two-way sync) ke tabel setting eksisting cabang
            if (cleanLocationId) {
                if (data.kategori_peran === "OPERATOR_BP") {
                    await (prisma as any).retaseSetting?.upsert({
                        where: { locationId: cleanLocationId },
                        update: {
                            operator_rate_per_cubic: Number(data.tarif_utama) || 0,
                            effective_from: effectiveDateObj,
                        },
                        create: {
                            locationId: cleanLocationId,
                            price_per_cubic_km: 10000,
                            operator_rate_per_cubic: Number(data.tarif_utama) || 0,
                            effective_from: effectiveDateObj,
                        }
                    }).catch(() => null)
                } else if (data.kategori_peran === "SOPIR_MIXER") {
                    await (prisma as any).retaseSetting?.upsert({
                        where: { locationId: cleanLocationId },
                        update: {
                            price_per_cubic_km: Number(data.tarif_utama) || 0,
                            effective_from: effectiveDateObj,
                        },
                        create: {
                            locationId: cleanLocationId,
                            price_per_cubic_km: Number(data.tarif_utama) || 0,
                            operator_rate_per_cubic: 0,
                            effective_from: effectiveDateObj,
                        }
                    }).catch(() => null)
                } else if (data.kategori_peran === "SOPIR_DT" && (prisma as any).aggregateRetaseSetting) {
                    await (prisma as any).aggregateRetaseSetting.upsert({
                        where: { locationId: cleanLocationId },
                        update: {
                            price_dt_besar: Number(data.tarif_utama) || 0,
                            price_dt_kecil: Number(data.tarif_sekunder) || 0,
                            effective_from: effectiveDateObj,
                        },
                        create: {
                            locationId: cleanLocationId,
                            price_dt_besar: Number(data.tarif_utama) || 0,
                            price_dt_kecil: Number(data.tarif_sekunder) || 0,
                            default_distance_km: 25,
                            effective_from: effectiveDateObj,
                        }
                    }).catch(() => null)
                }
            }

            revalidatePath("/admin/master-insentif")
            revalidatePath("/admin/produksi")
            revalidatePath("/admin/retase")
            revalidatePath("/admin/reports/retase")
            revalidatePath("/admin/material-agregat")
            return { success: true, data: updated, message: "Tarif insentif berhasil diperbarui." }
        } else {
            // Create
            const created = await prisma.masterIncentiveRate.create({
                data: {
                    nama_insentif: data.nama_insentif.trim(),
                    kategori_peran: data.kategori_peran,
                    formula_type: data.formula_type,
                    tarif_utama: Number(data.tarif_utama) || 0,
                    tarif_sekunder: Number(data.tarif_sekunder) || 0,
                    locationId: cleanLocationId,
                    effective_date: effectiveDateObj,
                    keterangan: data.keterangan?.trim() || null,
                    isActive: data.isActive !== undefined ? data.isActive : true,
                    createdById: session.user.id || null,
                }
            })

            // Sinkronisasi balik (two-way sync) ke tabel setting eksisting cabang
            if (cleanLocationId) {
                if (data.kategori_peran === "OPERATOR_BP") {
                    await (prisma as any).retaseSetting?.upsert({
                        where: { locationId: cleanLocationId },
                        update: {
                            operator_rate_per_cubic: Number(data.tarif_utama) || 0,
                            effective_from: effectiveDateObj,
                        },
                        create: {
                            locationId: cleanLocationId,
                            price_per_cubic_km: 10000,
                            operator_rate_per_cubic: Number(data.tarif_utama) || 0,
                            effective_from: effectiveDateObj,
                        }
                    }).catch(() => null)
                } else if (data.kategori_peran === "SOPIR_MIXER") {
                    await (prisma as any).retaseSetting?.upsert({
                        where: { locationId: cleanLocationId },
                        update: {
                            price_per_cubic_km: Number(data.tarif_utama) || 0,
                            effective_from: effectiveDateObj,
                        },
                        create: {
                            locationId: cleanLocationId,
                            price_per_cubic_km: Number(data.tarif_utama) || 0,
                            operator_rate_per_cubic: 0,
                            effective_from: effectiveDateObj,
                        }
                    }).catch(() => null)
                } else if (data.kategori_peran === "SOPIR_DT" && (prisma as any).aggregateRetaseSetting) {
                    await (prisma as any).aggregateRetaseSetting.upsert({
                        where: { locationId: cleanLocationId },
                        update: {
                            price_dt_besar: Number(data.tarif_utama) || 0,
                            price_dt_kecil: Number(data.tarif_sekunder) || 0,
                            effective_from: effectiveDateObj,
                        },
                        create: {
                            locationId: cleanLocationId,
                            price_dt_besar: Number(data.tarif_utama) || 0,
                            price_dt_kecil: Number(data.tarif_sekunder) || 0,
                            default_distance_km: 25,
                            effective_from: effectiveDateObj,
                        }
                    }).catch(() => null)
                }
            }

            revalidatePath("/admin/master-insentif")
            revalidatePath("/admin/produksi")
            revalidatePath("/admin/retase")
            revalidatePath("/admin/reports/retase")
            revalidatePath("/admin/material-agregat")
            return { success: true, data: created, message: "Tarif insentif baru berhasil ditambahkan." }
        }
    } catch (e: any) {
        console.error("Error upsertMasterIncentive:", e)
        return { error: e.message || "Gagal menyimpan tarif insentif." }
    }
}

export async function deleteMasterIncentive(id: string) {
    const session = await auth()
    if (!session?.user) {
        return { error: "Sesi telah berakhir, silakan login kembali." }
    }

    try {
        await prisma.masterIncentiveRate.delete({
            where: { id }
        })
        revalidatePath("/admin/master-insentif")
        return { success: true, message: "Tarif insentif berhasil dihapus." }
    } catch (e: any) {
        console.error("Error deleteMasterIncentive:", e)
        return { error: e.message || "Gagal menghapus tarif insentif." }
    }
}

export async function toggleMasterIncentiveStatus(id: string, nextStatus: boolean) {
    const session = await auth()
    if (!session?.user) {
        return { error: "Sesi telah berakhir, silakan login kembali." }
    }

    try {
        await prisma.masterIncentiveRate.update({
            where: { id },
            data: { isActive: nextStatus }
        })
        revalidatePath("/admin/master-insentif")
        return { success: true, message: nextStatus ? "Tarif diaktifkan." : "Tarif dinonaktifkan." }
    } catch (e: any) {
        return { error: e.message || "Gagal mengubah status tarif." }
    }
}

/**
 * Resolver tarif insentif berdasarkan batas tanggal transaksi (Effective Date Rule):
 * Mengambil tarif aktif yang memiliki effective_date <= txDate,
 * memprioritaskan tarif cabang spesifik daripada tarif global.
 */
export async function getEffectiveIncentiveRate(
    roleCategory: string,
    locationId: string | null | undefined,
    txDate: Date
) {
    const startOfDay = new Date(txDate)
    startOfDay.setHours(23, 59, 59, 999)

    const rates = await prisma.masterIncentiveRate.findMany({
        where: {
            kategori_peran: roleCategory,
            isActive: true,
            effective_date: { lte: startOfDay },
            OR: [
                ...(locationId ? [{ locationId }] : []),
                { locationId: null }
            ]
        },
        orderBy: [
            { effective_date: "desc" },
            { locationId: "desc" }, // non-null locationId takes precedence over null
            { createdAt: "desc" }
        ]
    })

    if (!rates || rates.length === 0) return null

    // Jika ada rate spesifik untuk locationId, gunakan itu
    if (locationId) {
        const specificBranchRate = rates.find(r => r.locationId === locationId)
        if (specificBranchRate) return specificBranchRate
    }

    // Jika tidak ada spesifik cabang, gunakan global rate
    return rates[0]
}

/**
 * Inisialisasi data master jika tabel masih kosong
 */
async function seedInitialIncentivesIfEmpty() {
    try {
        if (!(prisma as any).masterIncentiveRate) return
        const count = await (prisma as any).masterIncentiveRate.count()
        if (count > 0) return

        const initialEffectiveDate = new Date("2026-01-01T00:00:00.000Z")

        await prisma.masterIncentiveRate.createMany({
            data: [
                {
                    nama_insentif: "Insentif Operator Batching Plant (Per Kubik)",
                    kategori_peran: "OPERATOR_BP",
                    formula_type: "PER_M3",
                    tarif_utama: 1500,
                    tarif_sekunder: 0,
                    locationId: null,
                    effective_date: initialEffectiveDate,
                    keterangan: "Insentif operator batching plant Rp 1.500 per m³ beton diproduksi.",
                    isActive: true,
                },
                {
                    nama_insentif: "Insentif Operator Concrete Pump (Per Trip)",
                    kategori_peran: "OPERATOR_CP",
                    formula_type: "PER_TRIP",
                    tarif_utama: 150000,
                    tarif_sekunder: 0,
                    locationId: null,
                    effective_date: initialEffectiveDate,
                    keterangan: "Insentif flat operator pompa cor per 1x kegiatan/lokasi cor.",
                    isActive: true,
                },
                {
                    nama_insentif: "Insentif Operator Excavator & Alat Berat (Per Jam HM)",
                    kategori_peran: "OPERATOR_ALAT_BERAT",
                    formula_type: "PER_JAM_HM",
                    tarif_utama: 35000,
                    tarif_sekunder: 0,
                    locationId: null,
                    effective_date: initialEffectiveDate,
                    keterangan: "Insentif jam kerja operator excavator / wheel loader per jam HM.",
                    isActive: true,
                },
                {
                    nama_insentif: "Retase Sopir Truk Mixer (Jarak Tempuh)",
                    kategori_peran: "SOPIR_MIXER",
                    formula_type: "PER_KM",
                    tarif_utama: 10000,
                    tarif_sekunder: 0,
                    locationId: null,
                    effective_date: initialEffectiveDate,
                    keterangan: "Retase dasar sopir truk mixer per kilometer jarak tempuh.",
                    isActive: true,
                },
                {
                    nama_insentif: "Retase Sopir Dump Truck Agregat (Bertingkat)",
                    kategori_peran: "SOPIR_DT",
                    formula_type: "DT_TIERED",
                    tarif_utama: 45000, // DT Besar
                    tarif_sekunder: 35000, // DT Kecil
                    locationId: null,
                    effective_date: initialEffectiveDate,
                    keterangan: "Retase supir DT: Rp 45.000 (DT Besar), Rp 35.000 (DT Kecil).",
                    isActive: true,
                },
            ]
        })
    } catch (e) {
        console.error("Gagal melakukan inisialisasi awal MasterIncentiveRate:", e)
    }
}

/**
 * Sinkronisasi otomatis settingan cabang yang ada di RetaseSetting & AggregateRetaseSetting ke MasterIncentiveRate
 */
export async function syncExistingRetaseSettingsToMasterIncentives() {
    try {
        if (!(prisma as any).masterIncentiveRate) return

        // 1. Sinkronisasi dari RetaseSetting (Mixer & Operator BP)
        if ((prisma as any).retaseSetting) {
            const settings = await (prisma as any).retaseSetting.findMany({
                include: { location: true }
            })

            for (const s of settings) {
                const effectiveDate = s.effective_from || new Date("2026-01-01T00:00:00.000Z")
                const locName = s.location?.name || 'Cabang'

                // A. Sinkronkan Price KM Mixer jika ada (> 0)
                if (s.price_per_cubic_km && Number(s.price_per_cubic_km) > 0) {
                    const existingMixer = await (prisma as any).masterIncentiveRate.findFirst({
                        where: {
                            kategori_peran: "SOPIR_MIXER",
                            locationId: s.locationId,
                        }
                    })

                    if (!existingMixer) {
                        await (prisma as any).masterIncentiveRate.create({
                            data: {
                                nama_insentif: `Retase Sopir Truk Mixer (${locName})`,
                                kategori_peran: "SOPIR_MIXER",
                                formula_type: "PER_KM",
                                tarif_utama: Number(s.price_per_cubic_km),
                                tarif_sekunder: 0,
                                locationId: s.locationId,
                                effective_date: effectiveDate,
                                keterangan: `Sinkronisasi otomatis dari tarif per KM cabang ${locName}`,
                                isActive: true,
                            }
                        })
                    } else if (Number(existingMixer.tarif_utama) !== Number(s.price_per_cubic_km)) {
                        await (prisma as any).masterIncentiveRate.update({
                            where: { id: existingMixer.id },
                            data: {
                                tarif_utama: Number(s.price_per_cubic_km),
                                effective_date: effectiveDate,
                            }
                        })
                    }
                }

                // B. Sinkronkan Operator BP jika ada (> 0)
                if (s.operator_rate_per_cubic && Number(s.operator_rate_per_cubic) > 0) {
                    const existingOp = await (prisma as any).masterIncentiveRate.findFirst({
                        where: {
                            kategori_peran: "OPERATOR_BP",
                            locationId: s.locationId,
                        }
                    })

                    if (!existingOp) {
                        await (prisma as any).masterIncentiveRate.create({
                            data: {
                                nama_insentif: `Insentif Operator BP (${locName})`,
                                kategori_peran: "OPERATOR_BP",
                                formula_type: "PER_M3",
                                tarif_utama: Number(s.operator_rate_per_cubic),
                                tarif_sekunder: 0,
                                locationId: s.locationId,
                                effective_date: effectiveDate,
                                keterangan: `Sinkronisasi otomatis dari setting tarif cabang ${locName}`,
                                isActive: true,
                            }
                        })
                    } else if (Number(existingOp.tarif_utama) !== Number(s.operator_rate_per_cubic)) {
                        await (prisma as any).masterIncentiveRate.update({
                            where: { id: existingOp.id },
                            data: {
                                tarif_utama: Number(s.operator_rate_per_cubic),
                                effective_date: effectiveDate,
                            }
                        })
                    }
                }
            }
        }

        // 2. Sinkronisasi dari AggregateRetaseSetting (Dump Truck DT Besar / DT Kecil)
        if ((prisma as any).aggregateRetaseSetting) {
            const aggSettings = await (prisma as any).aggregateRetaseSetting.findMany({
                include: { location: true }
            })

            for (const s of aggSettings) {
                const effectiveDate = s.effective_from || new Date("2026-01-01T00:00:00.000Z")
                const locName = s.location?.name || 'Cabang'

                if ((s.price_dt_besar && Number(s.price_dt_besar) > 0) || (s.price_dt_kecil && Number(s.price_dt_kecil) > 0)) {
                    const existingDt = await (prisma as any).masterIncentiveRate.findFirst({
                        where: {
                            kategori_peran: "SOPIR_DT",
                            locationId: s.locationId,
                        }
                    })

                    if (!existingDt) {
                        await (prisma as any).masterIncentiveRate.create({
                            data: {
                                nama_insentif: `Retase Sopir Dump Truck (${locName})`,
                                kategori_peran: "SOPIR_DT",
                                formula_type: "DT_TIERED",
                                tarif_utama: Number(s.price_dt_besar || 0),
                                tarif_sekunder: Number(s.price_dt_kecil || 0),
                                locationId: s.locationId,
                                effective_date: effectiveDate,
                                keterangan: `Sinkronisasi otomatis dari setting Dump Truck agregat ${locName} (Jarak default: ${s.default_distance_km || 0} km)`,
                                isActive: true,
                            }
                        })
                    } else if (
                        Number(existingDt.tarif_utama) !== Number(s.price_dt_besar || 0) ||
                        Number(existingDt.tarif_sekunder) !== Number(s.price_dt_kecil || 0)
                    ) {
                        await (prisma as any).masterIncentiveRate.update({
                            where: { id: existingDt.id },
                            data: {
                                tarif_utama: Number(s.price_dt_besar || 0),
                                tarif_sekunder: Number(s.price_dt_kecil || 0),
                                effective_date: effectiveDate,
                            }
                        })
                    }
                }
            }
        }
    } catch (e) {
        console.error("Gagal sinkronisasi RetaseSetting ke MasterIncentiveRate:", e)
    }
}

