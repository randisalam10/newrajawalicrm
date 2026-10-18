/**
 * Modul kalkulasi terpusat untuk Modul Stone Crusher.
 *
 * Tujuan: menyatukan aturan perhitungan retase & insentif operator yang sebelumnya
 * tersebar (server actions, UI, backdate, penerimaan BP) agar tidak terjadi selisih
 * (lihat docs/features/stone-crusher-module-analysis.md — B1, B2, B11, B12).
 *
 * PENTING: File ini HARUS bebas dari dependensi server (prisma) agar aman diimpor
 * oleh komponen client. Resolver setting yang butuh prisma ada di
 * `src/lib/crusher-retase-setting.ts`.
 */

/** Tarif insentif operator crusher per m³ (default). */
export const OPERATOR_FEE_PER_M3 = 5000

/** Tarif retase material masuk (Langsir Kali / Kolbin) per rit (default). */
export const DEFAULT_MATERIAL_IN_RATE = 4500

/**
 * Menentukan apakah sebuah material termasuk produk pecahan batu yang berhak
 * atas insentif operator crusher (Rp5.000/m³).
 *
 * Aturan bisnis (dikonfirmasi): HANYA pecahan batu (Abu Batu, Ciping 0.5,
 * Batu 1-2, Batu 2-3, Base Course, Sirtu, Agregat). Material seperti
 * "Batu Bulat" TIDAK berhak.
 */
export function isStoneFractionMaterial(materialName?: string | null): boolean {
    const mat = (materialName || "").toLowerCase()
    return (
        mat.includes("1-2") || mat.includes("1/2") ||
        mat.includes("2-3") || mat.includes("2/3") ||
        mat.includes("0.5") || mat.includes("0,5") || mat.includes("ciping") ||
        mat.includes("abu") || mat.includes("base") || mat.includes("sirtu") || mat.includes("agregat")
    )
}

/**
 * Menghitung insentif operator crusher.
 * Mengembalikan 0 untuk material non-pecahan batu (mis. Batu Bulat).
 */
export function computeOperatorFee(
    materialName: string | null | undefined,
    volumeM3: number,
    rate: number = OPERATOR_FEE_PER_M3
): number {
    if (!isStoneFractionMaterial(materialName)) return 0
    const vol = Number(volumeM3) || 0
    const r = Number(rate) > 0 ? Number(rate) : OPERATOR_FEE_PER_M3
    return vol * r
}

export type CrusherRetaseFormula =
    | "PER_KM_TIERED"
    | "PER_KM_FLAT"
    | "PER_M3_KM"
    | "PER_RIT_FLAT"

export interface CrusherRetaseParams {
    formulaType: string
    distanceKm: number
    ritase: number
    volumeM3: number
    dumpTruckSize?: string | null
    rateDtKecil: number
    rateDtBesar: number
    ratePerKm: number
    ratePerM3Km: number
    rateFlatRit: number
}

/**
 * Fungsi tunggal perhitungan retase dump truck Stone Crusher.
 * Dipakai oleh: backdate (retase-crusher), penerimaan material di BP, dan input material keluar.
 *
 * Formula:
 * - PER_KM_TIERED : rate (DT kecil/besar) × jarak × rit
 * - PER_KM_FLAT   : rate_per_km × jarak × rit
 * - PER_M3_KM     : rate_per_m3_km × volume × jarak
 * - PER_RIT_FLAT  : rate_flat_rit × rit
 */
export function computeRetase(params: CrusherRetaseParams): { rate: number; amount: number } {
    const distance = Number(params.distanceKm) || 0
    const rit = Number(params.ritase) || 1
    const vol = Number(params.volumeM3) || 0

    let rate = 0
    let amount = 0

    switch (params.formulaType) {
        case "PER_KM_TIERED":
            rate = params.dumpTruckSize === "KECIL" ? Number(params.rateDtKecil) || 0 : Number(params.rateDtBesar) || 0
            amount = rate * distance * rit
            break
        case "PER_KM_FLAT":
            rate = Number(params.ratePerKm) || 0
            amount = rate * distance * rit
            break
        case "PER_M3_KM":
            rate = Number(params.ratePerM3Km) || 0
            amount = rate * vol * distance
            break
        case "PER_RIT_FLAT":
            rate = Number(params.rateFlatRit) || 0
            amount = rate * rit
            break
        default:
            rate = 0
            amount = 0
    }

    return { rate, amount: Math.round(amount) }
}
