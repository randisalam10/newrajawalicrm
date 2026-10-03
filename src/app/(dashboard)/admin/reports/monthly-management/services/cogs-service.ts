export interface MaterialPriceMap {
    [code: string]: number
}

export const DIRECT_COGS_CATEGORIES = [
    "GAJI_KARYAWAN",
    "BIAYA_POKOK_LAINNYA",
    "SUBKONTRAKTOR_PRODUKSI",
    "KIMIA_ADDITIVE_KHUSUS",
    "LAB_UJI_BETON"
]

export function isDirectCogsCategory(cat: string): boolean {
    const upper = (cat || "").toUpperCase()
    return (
        DIRECT_COGS_CATEGORIES.includes(upper) ||
        upper === "GAJI" ||
        upper.startsWith("COGS_") ||
        upper.startsWith("BIAYA_POKOK") ||
        upper.startsWith("GAJI_")
    )
}

export interface CogsCalculationParams {
    currentTxns: any[]
    activePrices: any[]
    currentBbmExpenses: any[]
    mixerRetaseList: any[]
    dtRetaseIncoming: any[]
    dtRetaseOutgoing: any[]
    maintenancePoItems: any[]
    rblMaintenance: any[]
    cementPoItems: any[]
    cementIncomings?: any[]
    currentVolumeTotal: number
    activeFixedContracts?: any[]
}

export function calculateDirectCogs(params: CogsCalculationParams) {
    const {
        currentTxns,
        activePrices,
        currentBbmExpenses,
        mixerRetaseList,
        dtRetaseIncoming,
        dtRetaseOutgoing,
        maintenancePoItems,
        rblMaintenance,
        cementPoItems,
        cementIncomings,
        currentVolumeTotal,
        activeFixedContracts = []
    } = params

    // 1. Material Pricing & Cost
    const priceMap: MaterialPriceMap = {}
    activePrices.forEach(p => {
        if (p.material?.code && !priceMap[p.material.code]) {
            priceMap[p.material.code] = p.price_per_m3
        }
    })

    /**
     * Helper untuk mendapatkan harga material agregat per m³ yang berlaku pada tanggal transaksi tertentu (Point-in-Time Pricing).
     * Mendukung kenaikan/perubahan harga di tengah bulan:
     * 1. Prioritaskan harga spesifik cabang (locationId) di mana effective_date <= txDate
     * 2. Fallback ke harga standar nasional/global (locationId == null) di mana effective_date <= txDate
     * 3. Jika belum ada harga <= txDate, gunakan harga terdekat yang tersedia.
     */
    function resolveMaterialPriceAtDate(
        materialCode: string,
        txDate: Date | string,
        txLocationId: string | null | undefined,
        prices: any[]
    ): number {
        const tTime = new Date(txDate).getTime()

        // 1. Cek spesifik cabang dengan tanggal efektif <= tanggal transaksi
        if (txLocationId) {
            const branchMatch = prices.find(p =>
                (p.material?.code === materialCode || p.material_code === materialCode) &&
                p.locationId === txLocationId &&
                new Date(p.effective_date).getTime() <= tTime
            )
            if (branchMatch && branchMatch.price_per_m3 > 0) {
                return branchMatch.price_per_m3
            }
        }

        // 2. Cek harga global/semua cabang dengan tanggal efektif <= tanggal transaksi
        const globalMatch = prices.find(p =>
            (p.material?.code === materialCode || p.material_code === materialCode) &&
            (!p.locationId || p.locationId === null) &&
            new Date(p.effective_date).getTime() <= tTime
        )
        if (globalMatch && globalMatch.price_per_m3 > 0) {
            return globalMatch.price_per_m3
        }

        // 3. Fallback: gunakan harga pertama yang cocok
        const anyMatch = prices.find(p =>
            (p.material?.code === materialCode || p.material_code === materialCode) &&
            (txLocationId ? p.locationId === txLocationId || !p.locationId : true)
        )
        return anyMatch?.price_per_m3 ?? 0
    }

    // Hitung harga satuan semen per Kg riil dari rata-rata tertimbang penerimaan Silo periode ini
    // Sesuai Opsi B: jika belum ada penerimaan fisik, cek harga master semen (KG/TON). Jika tidak ada, wajib 0 (tanpa tebakan 2020)
    let semenPricePerKg = 0
    if (cementIncomings && cementIncomings.length > 0) {
        const totalTonnage = cementIncomings.reduce((s, c) => s + (c.tonnage || 0), 0)
        const totalPrice = cementIncomings.reduce((s, c) => s + (c.total_price || 0), 0)
        if (totalTonnage > 0 && totalPrice > 0) {
            semenPricePerKg = Math.round(totalPrice / totalTonnage)
        }
    }
    if (semenPricePerKg === 0) {
        if (priceMap["SEMEN_KG"] && priceMap["SEMEN_KG"] > 0) {
            semenPricePerKg = priceMap["SEMEN_KG"]
        } else if (priceMap["SEMEN"] && priceMap["SEMEN"] > 0) {
            semenPricePerKg = priceMap["SEMEN"] > 50000 ? Math.round(priceMap["SEMEN"] / 1000) : priceMap["SEMEN"]
        } else if (priceMap["SEMEN_TON"] && priceMap["SEMEN_TON"] > 0) {
            semenPricePerKg = Math.round(priceMap["SEMEN_TON"] / 1000)
        }
    }

    let totalSemenCost = 0
    let totalPasirCost = 0
    let totalSplitCost = 0
    let totalSplit12Cost = 0
    let totalSplit23Cost = 0
    let totalCiping05Cost = 0

    let totalSemenConsumedKg = 0
    let totalPasirConsumedM3 = 0
    let totalSplitConsumedM3 = 0
    let totalSplit12ConsumedM3 = 0
    let totalSplit23ConsumedM3 = 0
    let totalCiping05ConsumedM3 = 0

    currentTxns.forEach(t => {
        const vol = t.volume_cubic || 0
        const q = t.concreteQuality
        const txDate = t.date
        const txLocId = t.locationId

        // Perhitungan material murni 100% dari resep mix design (ConcreteQuality) tanpa asumsi/fallback sepihak
        const semenPerM3 = q?.composition_cement ?? 0
        const semenKg = vol * semenPerM3

        // Pasir: kg pasir ÷ berat jenis pasir (density_sand di schema default 1400 kg/m³)
        const sandKg = q?.composition_sand ?? 0
        const densitySand = (q?.density_sand && q.density_sand > 0) ? q.density_sand : 1400
        const pasirM3 = sandKg > 0 ? (vol * sandKg) / densitySand : 0

        // Split / Batu: fraksi stone12, stone23, stone05 dikonversi dengan berat jenis masing-masing
        const stone12Kg = q?.composition_stone_12 ?? 0
        const stone23Kg = q?.composition_stone_23 ?? 0
        const stone05Kg = q?.composition_stone_05 ?? 0

        const densityStone12 = (q?.density_stone_12 && q.density_stone_12 > 0) ? q.density_stone_12 : 1450
        const densityStone23 = (q?.density_stone_23 && q.density_stone_23 > 0) ? q.density_stone_23 : 1450
        const densityStone05 = (q?.density_stone_05 && q.density_stone_05 > 0) ? q.density_stone_05 : 1400

        const stone12M3 = stone12Kg > 0 ? (vol * stone12Kg) / densityStone12 : 0
        const stone23M3 = stone23Kg > 0 ? (vol * stone23Kg) / densityStone23 : 0
        const stone05M3 = stone05Kg > 0 ? (vol * stone05Kg) / densityStone05 : 0

        // Jika mutu beton tidak menggunakan split (misalnya Mortar di mana batu = 0), pemakaian split adalah 0 m³
        const splitM3 = stone12M3 + stone23M3 + stone05M3

        // Point-in-Time Material Pricing sesuai tanggal transaksi (Mendukung multi-harga jika ada kenaikan di tengah bulan)
        const pasirPrice = resolveMaterialPriceAtDate("PASIR", txDate, txLocId, activePrices)
        const split12Price = resolveMaterialPriceAtDate("SPLIT_1_2", txDate, txLocId, activePrices)
        const split23Price = resolveMaterialPriceAtDate("SPLIT_2_3", txDate, txLocId, activePrices) || split12Price
        const ciping05Price = resolveMaterialPriceAtDate("CIPING_0_5", txDate, txLocId, activePrices) ||
                              resolveMaterialPriceAtDate("SPLIT_0_5", txDate, txLocId, activePrices) ||
                              split12Price

        const cost12 = stone12M3 * split12Price
        const cost23 = stone23M3 * split23Price
        const cost05 = stone05M3 * ciping05Price
        const lineSplitCost = cost12 + cost23 + cost05
        const linePasirCost = pasirM3 * pasirPrice

        totalSemenConsumedKg += semenKg
        totalPasirConsumedM3 += pasirM3
        totalSplitConsumedM3 += splitM3
        totalSplit12ConsumedM3 += stone12M3
        totalSplit23ConsumedM3 += stone23M3
        totalCiping05ConsumedM3 += stone05M3

        totalSemenCost += semenKg * semenPricePerKg // komposisi dalam Kg x harga riil
        totalPasirCost += linePasirCost // volume pasir x harga master per tanggal transaksi
        totalSplitCost += lineSplitCost
        totalSplit12Cost += cost12
        totalSplit23Cost += cost23
        totalCiping05Cost += cost05
    })

    // Rata-rata tertimbang harga per m³ sepanjang periode
    const pasirPricePerM3 = totalPasirConsumedM3 > 0 && totalPasirCost > 0
        ? Math.round(totalPasirCost / totalPasirConsumedM3)
        : (priceMap["PASIR"] ?? 0)

    const split12PricePerM3 = totalSplit12ConsumedM3 > 0 && totalSplit12Cost > 0
        ? Math.round(totalSplit12Cost / totalSplit12ConsumedM3)
        : (priceMap["SPLIT_1_2"] ?? 0)

    const split23PricePerM3 = totalSplit23ConsumedM3 > 0 && totalSplit23Cost > 0
        ? Math.round(totalSplit23Cost / totalSplit23ConsumedM3)
        : (priceMap["SPLIT_2_3"] ?? split12PricePerM3)

    const ciping05PricePerM3 = totalCiping05ConsumedM3 > 0 && totalCiping05Cost > 0
        ? Math.round(totalCiping05Cost / totalCiping05ConsumedM3)
        : (priceMap["CIPING_0_5"] ?? split12PricePerM3)

    const splitPricePerM3 = totalSplitConsumedM3 > 0 && totalSplitCost > 0
        ? Math.round(totalSplitCost / totalSplitConsumedM3)
        : split12PricePerM3

    totalSemenCost = Math.round(totalSemenCost)
    totalPasirCost = Math.round(totalPasirCost)
    totalSplitCost = Math.round(totalSplitCost)
    totalSplit12Cost = Math.round(totalSplit12Cost)
    totalSplit23Cost = Math.round(totalSplit23Cost)
    totalCiping05Cost = Math.round(totalCiping05Cost)

    totalSemenConsumedKg = Math.round(totalSemenConsumedKg)
    totalPasirConsumedM3 = Math.round(totalPasirConsumedM3 * 10) / 10
    totalSplitConsumedM3 = Math.round(totalSplitConsumedM3 * 10) / 10
    totalSplit12ConsumedM3 = Math.round(totalSplit12ConsumedM3 * 10) / 10
    totalSplit23ConsumedM3 = Math.round(totalSplit23ConsumedM3 * 10) / 10
    totalCiping05ConsumedM3 = Math.round(totalCiping05ConsumedM3 * 10) / 10

    // Agregat (Pasir + Split) dipisahkan dari Semen
    const totalAggregateCost = totalPasirCost + totalSplitCost
    const totalMaterialCost = totalSemenCost + totalAggregateCost

    // Total Realisasi PO Semen BP Khusus Batching Plant
    const totalCementPoCost = cementPoItems.reduce((s, p) => s + (p.subtotal || 0), 0)

    // 2. BBM Solar Armada (RBL Kas Operasional Cabang)
    const totalFuelCost = currentBbmExpenses.reduce((s, e) => s + (e.amount || 0), 0)

    // 3. Upah Retase Supir (Mixer & Dump Truck)
    const mixerRetaseTotal = mixerRetaseList.reduce((s, r) => s + (r.income_amount || 0), 0)
    const dtRetaseTotal = dtRetaseIncoming.reduce((s, r) => s + (r.retase_amount || 0), 0) +
                          dtRetaseOutgoing.reduce((s, r) => s + (r.retase_amount || 0), 0)
    const totalRetaseCost = mixerRetaseTotal + dtRetaseTotal

    // 4. Pemeliharaan & Suku Cadang dipisahkan tegas antara PO BP dan Kas RBL:
    // 4a. Pengadaan PO Suku Cadang & Bengkel (Khusus BP)
    const maintenancePoCost = maintenancePoItems.reduce((s, p) => s + (p.subtotal || 0), 0)
    // 4b. Realisasi Kas Cabang Bengkel / Servis Rutin (RBL)
    const maintenanceRblCost = rblMaintenance.reduce((s, r) => s + (r.amount || 0), 0)
    const totalMaintenanceCost = maintenancePoCost + maintenanceRblCost

    // Total Pengeluaran Bersumber dari PO BP
    const totalPoBpCost = totalCementPoCost + maintenancePoCost
    // Total Pengeluaran Bersumber dari RBL Kas Cabang Langsung
    const totalRblDirectCost = totalFuelCost + maintenanceRblCost

    // 4c. Biaya Pokok Langsung Lainnya (Input Manual via Master Biaya Operasional)
    const manualDirectContracts = (activeFixedContracts || []).filter(c => isDirectCogsCategory(c.category))
    const manualDirectCost = manualDirectContracts.reduce((s, c) => s + (c.monthly_amount || 0), 0)

    // 5. Total Biaya Pokok Langsung (Direct COGS)
    const totalDirectCost = totalMaterialCost + totalFuelCost + totalRetaseCost + totalMaintenanceCost + manualDirectCost
    const unitDirectCostPerM3 = currentVolumeTotal > 0 ? Math.round(totalDirectCost / currentVolumeTotal) : 0

    return {
        semenPricePerKg,
        pasirPricePerM3,
        splitPricePerM3,
        totalSemenCost,
        totalPasirCost,
        totalSplitCost,
        totalSplit12Cost,
        totalSplit23Cost,
        totalCiping05Cost,
        totalAggregateCost,
        totalMaterialCost,
        totalSemenConsumedKg,
        totalPasirConsumedM3,
        totalSplitConsumedM3,
        totalSplit12ConsumedM3,
        totalSplit23ConsumedM3,
        totalCiping05ConsumedM3,
        totalCementPoCost,
        totalFuelCost,
        mixerRetaseTotal,
        dtRetaseTotal,
        totalRetaseCost,
        maintenancePoCost,
        maintenanceRblCost,
        totalMaintenanceCost,
        manualDirectCost,
        manualDirectContracts,
        totalPoBpCost,
        totalRblDirectCost,
        totalDirectCost,
        unitDirectCostPerM3,
        isSemenPriceMissing: semenPricePerKg === 0 && totalSemenConsumedKg > 0,
        isPasirPriceMissing: pasirPricePerM3 === 0 && totalPasirConsumedM3 > 0,
        isSplitPriceMissing: splitPricePerM3 === 0 && totalSplitConsumedM3 > 0
    }
}
