import { format } from "date-fns"

export interface SewaCalculationResult {
    dppTotal: number
    ppnTotal: number
    grossTotal: number
}

export interface GroupedReadymixSale {
    key: string
    customerId: string
    customer: string
    projectId: string
    project: string
    qualityId: string
    quality: string
    dateRange?: string
    firstDate?: string
    lastDate?: string
    tripsCount: number
    volume: number
    unitPrice: number
    dppTotal: number
    ppnTotal: number
    grossTotal: number
    ppnMode: string
}

/**
 * Calculates DPP, PPN, and Gross for Readymix transactions and groups by customer and quality
 */
export function calculateReadymixRevenue(txns: any[]) {
    let dpp = 0
    let ppn = 0
    let gross = 0
    const volumeTotal = txns.reduce((sum, t) => sum + (t.volume_cubic || 0), 0)

    const groupMap: { [key: string]: GroupedReadymixSale } = {}

    txns.forEach(t => {
        const priceEntry = t.project?.prices?.find((p: any) => 
            p.qualityId === t.qualityId || 
            (p.concreteQuality?.name && t.concreteQuality?.name && p.concreteQuality.name.toLowerCase() === t.concreteQuality.name.toLowerCase())
        )
        const rawPrice = priceEntry?.price || 0
        const ppnMode = priceEntry?.ppn_mode || "NON_PPN"
        const ppnRate = priceEntry?.ppn_rate ?? 11

        let dppPrice = rawPrice
        let ppnPrice = 0

        if (ppnMode === "INCLUDE") {
            dppPrice = rawPrice / (1 + ppnRate / 100)
            ppnPrice = rawPrice - dppPrice
        } else if (ppnMode === "EXCLUDE") {
            dppPrice = rawPrice
            ppnPrice = rawPrice * (ppnRate / 100)
        }

        const vol = Number(t.volume_cubic) || 0
        const lineDpp = vol * dppPrice
        const linePpn = vol * ppnPrice
        const lineGross = vol * (dppPrice + ppnPrice)

        dpp += lineDpp
        ppn += linePpn
        gross += lineGross

        // Grouping: Pelanggan + Proyek + Mutu Beton (Tanpa Tanggal)
        const dateObj = t.date ? new Date(t.date) : new Date()
        const rawDate = format(dateObj, "yyyy-MM-dd")
        const customerId = t.project?.customer?.id || ""
        const customerName = t.project?.customer?.customer_name || "Tanpa Pelanggan"
        const projectId = t.project?.id || ""
        const projectName = t.project?.name || "-"
        const qualityId = t.qualityId || t.concreteQuality?.id || ""
        const qualityName = t.concreteQuality?.name || "Mutu Standar"

        const groupKey = `${customerId || customerName}__${projectId || projectName}__${qualityId || qualityName}`

        if (!groupMap[groupKey]) {
            groupMap[groupKey] = {
                key: groupKey,
                customerId,
                customer: customerName,
                projectId,
                project: projectName,
                qualityId,
                quality: qualityName,
                firstDate: rawDate,
                lastDate: rawDate,
                tripsCount: 0,
                volume: 0,
                unitPrice: 0,
                dppTotal: 0,
                ppnTotal: 0,
                grossTotal: 0,
                ppnMode,
            }
        }

        if (rawDate < (groupMap[groupKey].firstDate || "")) {
            groupMap[groupKey].firstDate = rawDate
        }
        if (rawDate > (groupMap[groupKey].lastDate || "")) {
            groupMap[groupKey].lastDate = rawDate
        }

        groupMap[groupKey].tripsCount += 1
        groupMap[groupKey].volume += vol
        groupMap[groupKey].dppTotal += lineDpp
        groupMap[groupKey].ppnTotal += linePpn
        groupMap[groupKey].grossTotal += lineGross
    })

    const groupedSales = Object.values(groupMap).map(g => {
        const fDateStr = g.firstDate ? format(new Date(g.firstDate), "dd/MM/yy") : "-"
        const lDateStr = g.lastDate ? format(new Date(g.lastDate), "dd/MM/yy") : "-"
        const dateRange = fDateStr === lDateStr ? fDateStr : `${fDateStr} - ${lDateStr}`

        return {
            ...g,
            dateRange,
            volume: Number(g.volume.toFixed(2)),
            dppTotal: Math.round(g.dppTotal),
            ppnTotal: Math.round(g.ppnTotal),
            grossTotal: Math.round(g.grossTotal),
            unitPrice: g.volume > 0 ? Math.round(g.dppTotal / g.volume) : 0,
        }
    })

    // Sort: Nama Pelanggan ASC, lalu Proyek ASC, lalu Volume Terbesar
    groupedSales.sort((a, b) => {
        if (a.customer !== b.customer) {
            return a.customer.localeCompare(b.customer)
        }
        if (a.project !== b.project) {
            return a.project.localeCompare(b.project)
        }
        return b.volume - a.volume
    })

    const currentDPP = Math.round(dpp)
    const currentPPN = Math.round(ppn)
    const currentGross = Math.round(gross)
    const asp = volumeTotal > 0 ? Math.round(currentDPP / volumeTotal) : 0

    return {
        volumeTotal,
        dpp: currentDPP,
        ppn: currentPPN,
        gross: currentGross,
        asp,
        groupedSales
    }
}

/**
 * Calculates rental revenues prorated for the target month
 */
export function computeSewaDetailed(txns: any[], mStart: Date, mEnd: Date): SewaCalculationResult {
    const startStr = format(mStart, "yyyy-MM-dd")
    const endStr = format(mEnd, "yyyy-MM-dd")

    let dppTotal = 0
    let ppnTotal = 0
    let grossTotal = 0

    txns.forEach((s: any) => {
        let daysInThisMonth = 0
        try {
            const parsedDates: string[] = JSON.parse(s.rental_dates || "[]")
            if (Array.isArray(parsedDates) && parsedDates.length > 0) {
                daysInThisMonth = parsedDates.filter((d: string) => d >= startStr && d <= endStr).length
            }
        } catch {
            daysInThisMonth = 0
        }

        if (daysInThisMonth === 0) {
            const sStart = new Date(Math.max(new Date(s.start_date || s.date).getTime(), mStart.getTime()))
            const sEnd = new Date(Math.min(new Date(s.end_date || s.date).getTime(), mEnd.getTime()))
            if (sEnd >= sStart) {
                daysInThisMonth = Math.floor((sEnd.getTime() - sStart.getTime()) / (1000 * 60 * 60 * 24)) + 1
            }
        }

        const totalDays = s.total_days || 1
        const ratio = Math.min(1, Math.max(0, daysInThisMonth / totalDays))

        const rawTotal = s.total_price || 0
        let txDpp = s.dpp_amount && s.dpp_amount > 0 ? s.dpp_amount : rawTotal
        let txPpn = s.ppn_amount && s.ppn_amount > 0 ? s.ppn_amount : 0

        if (s.ppn_mode === "INCLUDE" && (!s.dpp_amount || s.dpp_amount === 0)) {
            txDpp = rawTotal / (1 + (s.ppn_rate ?? 11) / 100)
            txPpn = rawTotal - txDpp
        } else if (s.ppn_mode === "EXCLUDE" && (!s.ppn_amount || s.ppn_amount === 0)) {
            txDpp = rawTotal
            txPpn = rawTotal * ((s.ppn_rate ?? 11) / 100)
        }

        dppTotal += (txDpp * ratio)
        ppnTotal += (txPpn * ratio)
        grossTotal += ((txDpp + txPpn) * ratio)
    })

    return {
        dppTotal: Math.round(dppTotal),
        ppnTotal: Math.round(ppnTotal),
        grossTotal: Math.round(grossTotal)
    }
}
