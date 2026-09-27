"use client"
// PDF Template: Retase Sopir (Driver Commission Slip)
// Data source: aggregated retase records per driver per month (Mixer or Dump Truck)

import {
    Document, Page, Text, View, StyleSheet
} from "@react-pdf/renderer"
import { shared, COLORS } from "./pdf-shared"
import { format } from "date-fns"
import { id as idLocale } from "date-fns/locale"

// ─── Types ────────────────────────────────────────────────────────────────────
export type RetaseRecord = {
    id: string
    date: Date | string
    volume_cubic: number
    // Mixer fields
    project?: {
        name: string
        customer?: { customer_name: string }
    }
    concreteQuality?: { name: string }
    retase?: {
        calculated_distance: number
        price_per_cubic_km: number
        income_amount: number
    }
    // Dump Truck fields
    no_bon?: string
    aggregate_type?: string
    dump_truck_size?: string
    plate_number?: string
    vehicleCode?: string
    distance_km?: number
    rate_price?: number
    retase_amount?: number
}

export type RetaseDriverData = {
    driverId: string
    driverType?: "MIXER" | "DUMP_TRUCK" | "OPERATOR_BP"
    name: string
    vehicleCode: string
    totalTrip: number
    totalVolume: number
    totalKm: number
    totalIncome: number
    records: RetaseRecord[]
}

// ─── Local styles ─────────────────────────────────────────────────────────────
const s = StyleSheet.create({
    statGrid: {
        flexDirection: "row",
        gap: 8,
        marginBottom: 14,
    },
    statBox: {
        flex: 1,
        borderWidth: 0.5,
        borderColor: COLORS.border,
        borderRadius: 4,
        padding: 8,
        backgroundColor: COLORS.bg,
    },
    statBoxHighlight: {
        flex: 1,
        borderWidth: 0.5,
        borderColor: "#10b981",
        borderRadius: 4,
        padding: 8,
        backgroundColor: COLORS.successBg,
    },
    statVal: {
        fontSize: 12,
        fontFamily: "Helvetica-Bold",
        color: COLORS.dark,
    },
    statValGreen: {
        fontSize: 12,
        fontFamily: "Helvetica-Bold",
        color: COLORS.success,
    },
    statLbl: {
        fontSize: 7,
        color: COLORS.muted,
        textTransform: "uppercase",
        marginTop: 2,
    },
    driverInfo: {
        fontSize: 9,
        color: COLORS.mid,
        marginBottom: 12,
    },
    driverName: {
        fontSize: 12,
        fontFamily: "Helvetica-Bold",
        color: COLORS.dark,
    },
})

const MONTH_NAMES = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
]

// ─── Document ─────────────────────────────────────────────────────────────────
export function RetaseDocument({
    driver,
    year,
    month,
    locationName = "PT. Rajawali Mix"
}: {
    driver: RetaseDriverData
    year: number
    month: number
    locationName?: string
}) {
    const monthName = MONTH_NAMES[month - 1]
    const cetakDate = format(new Date(), "dd MMMM yyyy", { locale: idLocale })
    const isDumpTruck = driver.driverType === "DUMP_TRUCK"
    const isOperator = driver.driverType === "OPERATOR_BP"

    return (
        <Document title={`Slip Insentif — ${driver.name} — ${monthName} ${year}`} author="PT. Rajawali Mix">
            <Page size="A4" style={shared.page}>

                {/* ── HEADER ─────────────────────────────────────────────────────── */}
                <View style={shared.headerRow}>
                    <View>
                        <Text style={shared.companyName}>PT. RAJAWALI MIX</Text>
                        <Text style={shared.companySub}>
                            {isOperator
                                ? "Rekap Insentif Operator Batching Plant"
                                : `Rekap Gaji Retase Supir ${isDumpTruck ? "(Dump Truck)" : "(Mixer)"}`}
                        </Text>
                        <Text style={shared.companySub}>{locationName}</Text>
                    </View>
                    <View style={shared.docTitleBox}>
                        <Text style={shared.docTitle}>{isOperator ? "Slip Insentif" : "Slip Retase"}</Text>
                        <Text style={shared.docNumber}>{monthName} {year}</Text>
                        <Text style={shared.docMeta}>Dicetak: {cetakDate}</Text>
                    </View>
                </View>

                {/* ── IDENTITAS PENERIMA ─────────────────────────────────────────── */}
                <Text style={s.driverName}>{driver.name}</Text>
                <Text style={s.driverInfo}>
                    Kategori: {isOperator ? "Operator Batching Plant" : isDumpTruck ? "Sopir Dump Truck" : "Sopir Truk Mixer"}   |   {isOperator ? "Penempatan: Batching Plant" : `Armada: ${driver.vehicleCode}`}   |   Periode: {monthName} {year}
                </Text>

                {/* ── STAT SUMMARY ───────────────────────────────────────────────── */}
                <View style={s.statGrid}>
                    <View style={s.statBox}>
                        <Text style={s.statVal}>{driver.totalTrip}×</Text>
                        <Text style={s.statLbl}>Total Trip</Text>
                    </View>
                    <View style={s.statBox}>
                        <Text style={s.statVal}>{driver.totalVolume.toFixed(1)} m³</Text>
                        <Text style={s.statLbl}>Total Volume</Text>
                    </View>
                    <View style={s.statBox}>
                        <Text style={s.statVal}>{driver.totalKm.toFixed(0)} km</Text>
                        <Text style={s.statLbl}>Total Jarak</Text>
                    </View>
                    <View style={s.statBoxHighlight}>
                        <Text style={s.statValGreen}>Rp {driver.totalIncome.toLocaleString("id-ID")}</Text>
                        <Text style={s.statLbl}>Total Komisi</Text>
                    </View>
                </View>

                {/* ── TABEL DETAIL ───────────────────────────────────────────────── */}
                <Text style={shared.sectionTitle}>
                    {isDumpTruck ? "Rincian Pengangkutan Material Agregat" : "Rincian Perjalanan Pengiriman Beton"}
                </Text>

                {isDumpTruck ? (
                    /* DUMP TRUCK TABLE */
                    <View style={shared.table}>
                        <View style={shared.tableHead}>
                            <Text style={[shared.tableHeadCell, { flex: 0.4 }]}>#</Text>
                            <Text style={[shared.tableHeadCell, { flex: 0.9 }]}>Tanggal</Text>
                            <Text style={[shared.tableHeadCell, { flex: 1.1 }]}>No. Bon</Text>
                            <Text style={[shared.tableHeadCell, { flex: 1.1 }]}>Armada & Plat</Text>
                            <Text style={[shared.tableHeadCell, { flex: 0.8 }]}>Tipe DT</Text>
                            <Text style={[shared.tableHeadCell, { flex: 1.1 }]}>Material</Text>
                            <Text style={[shared.tableHeadCell, { flex: 0.7, textAlign: "right" }]}>Vol (m³)</Text>
                            <Text style={[shared.tableHeadCell, { flex: 0.7, textAlign: "right" }]}>Jarak</Text>
                            <Text style={[shared.tableHeadCell, { flex: 0.9, textAlign: "right" }]}>Tarif</Text>
                            <Text style={[shared.tableHeadCell, { flex: 1.1, textAlign: "right" }]}>Komisi</Text>
                        </View>

                        {driver.records.map((tx, i) => (
                            <View key={tx.id || i} style={i % 2 === 0 ? shared.tableRow : shared.tableRowAlt}>
                                <Text style={[shared.tableCell, { flex: 0.4 }]}>{i + 1}</Text>
                                <Text style={[shared.tableCell, { flex: 0.9 }]}>
                                    {format(new Date(tx.date), "dd MMM", { locale: idLocale })}
                                </Text>
                                <Text style={[shared.tableCell, { flex: 1.1 }]}>{tx.no_bon || "-"}</Text>
                                <Text style={[shared.tableCell, { flex: 1.1 }]}>{tx.plate_number || tx.vehicleCode || "-"}</Text>
                                <Text style={[shared.tableCell, { flex: 0.8 }]}>{tx.dump_truck_size === "BESAR" ? "DT Besar" : "DT Kecil"}</Text>
                                <Text style={[shared.tableCell, { flex: 1.1 }]}>{tx.aggregate_type || "-"}</Text>
                                <Text style={[shared.tableCell, { flex: 0.7, textAlign: "right" }]}>
                                    {Number(tx.volume_cubic || 0).toFixed(2)}
                                </Text>
                                <Text style={[shared.tableCell, { flex: 0.7, textAlign: "right" }]}>
                                    {Number(tx.distance_km || 0).toFixed(0)} km
                                </Text>
                                <Text style={[shared.tableCell, { flex: 0.9, textAlign: "right" }]}>
                                    {Number(tx.rate_price || 0).toLocaleString("id-ID")}
                                </Text>
                                <Text style={[shared.tableCellBold, { flex: 1.1, textAlign: "right", color: COLORS.success }]}>
                                    {Number(tx.retase_amount || 0).toLocaleString("id-ID")}
                                </Text>
                            </View>
                        ))}

                        {/* Total row */}
                        <View style={shared.tableTotalRow}>
                            <Text style={[shared.tableTotalCell, { flex: 0.4 }]}> </Text>
                            <Text style={[shared.tableTotalCell, { flex: 0.9 }]}> </Text>
                            <Text style={[shared.tableTotalCell, { flex: 1.1 }]}> </Text>
                            <Text style={[shared.tableTotalCell, { flex: 1.1 }]}> </Text>
                            <Text style={[shared.tableTotalCell, { flex: 0.8 }]}> </Text>
                            <Text style={[shared.tableTotalCell, { flex: 1.1, textAlign: "right" }]}>TOTAL</Text>
                            <Text style={[shared.tableTotalCell, { flex: 0.7, textAlign: "right" }]}>
                                {driver.totalVolume.toFixed(1)}
                            </Text>
                            <Text style={[shared.tableTotalCell, { flex: 0.7, textAlign: "right" }]}>
                                {driver.totalKm.toFixed(0)} km
                            </Text>
                            <Text style={[shared.tableTotalCell, { flex: 0.9 }]}> </Text>
                            <Text style={[shared.tableTotalCell, { flex: 1.1, textAlign: "right" }]}>
                                Rp {driver.totalIncome.toLocaleString("id-ID")}
                            </Text>
                        </View>
                    </View>
                ) : (
                    /* MIXER TABLE */
                    <View style={shared.table}>
                        <View style={shared.tableHead}>
                            <Text style={[shared.tableHeadCell, { flex: 0.4 }]}>#</Text>
                            <Text style={[shared.tableHeadCell, { flex: 0.8 }]}>Tanggal</Text>
                            <Text style={[shared.tableHeadCell, { flex: 1.5 }]}>Customer</Text>
                            <Text style={[shared.tableHeadCell, { flex: 1.6 }]}>Proyek</Text>
                            <Text style={[shared.tableHeadCell, { flex: 0.7 }]}>Mutu</Text>
                            <Text style={[shared.tableHeadCell, { flex: 0.6, textAlign: "right" }]}>Vol (m³)</Text>
                            <Text style={[shared.tableHeadCell, { flex: 0.6, textAlign: "right" }]}>Jarak</Text>
                            <Text style={[shared.tableHeadCell, { flex: 0.9, textAlign: "right" }]}>Komisi</Text>
                        </View>

                        {driver.records.map((tx, i) => (
                            <View key={tx.id || i} style={i % 2 === 0 ? shared.tableRow : shared.tableRowAlt}>
                                <Text style={[shared.tableCell, { flex: 0.4 }]}>{i + 1}</Text>
                                <Text style={[shared.tableCell, { flex: 0.8 }]}>
                                    {format(new Date(tx.date), "dd MMM", { locale: idLocale })}
                                </Text>
                                <Text style={[shared.tableCell, { flex: 1.5 }]}>
                                    {tx.project?.customer?.customer_name ?? "-"}
                                </Text>
                                <Text style={[shared.tableCell, { flex: 1.6 }]}>
                                    {tx.project?.name ?? "-"}
                                </Text>
                                <Text style={[shared.tableCell, { flex: 0.7 }]}>
                                    {tx.concreteQuality?.name ?? "-"}
                                </Text>
                                <Text style={[shared.tableCell, { flex: 0.6, textAlign: "right" }]}>
                                    {tx.volume_cubic.toFixed(2)}
                                </Text>
                                <Text style={[shared.tableCell, { flex: 0.6, textAlign: "right" }]}>
                                    {tx.retase?.calculated_distance ? `${tx.retase.calculated_distance.toFixed(0)} km` : "-"}
                                </Text>
                                <Text style={[shared.tableCellBold, { flex: 0.9, textAlign: "right", color: COLORS.success }]}>
                                    {tx.retase?.income_amount ? `Rp ${tx.retase.income_amount.toLocaleString("id-ID")}` : "-"}
                                </Text>
                            </View>
                        ))}

                        {/* Total row */}
                        <View style={shared.tableTotalRow}>
                            <Text style={[shared.tableTotalCell, { flex: 0.4 }]}> </Text>
                            <Text style={[shared.tableTotalCell, { flex: 0.8 }]}> </Text>
                            <Text style={[shared.tableTotalCell, { flex: 1.5 }]}> </Text>
                            <Text style={[shared.tableTotalCell, { flex: 1.6 }]}> </Text>
                            <Text style={[shared.tableTotalCell, { flex: 0.7, textAlign: "right" }]}>TOTAL</Text>
                            <Text style={[shared.tableTotalCell, { flex: 0.6, textAlign: "right" }]}>
                                {driver.totalVolume.toFixed(1)}
                            </Text>
                            <Text style={[shared.tableTotalCell, { flex: 0.6, textAlign: "right" }]}>
                                {driver.totalKm.toFixed(0)} km
                            </Text>
                            <Text style={[shared.tableTotalCell, { flex: 0.9, textAlign: "right" }]}>
                                Rp {driver.totalIncome.toLocaleString("id-ID")}
                            </Text>
                        </View>
                    </View>
                )}

                {/* ── TANDA TANGAN ───────────────────────────────────────────────── */}
                <View style={shared.signRow}>
                    <View style={shared.signBox}>
                        <Text style={shared.signLabel}>Mengetahui,</Text>
                        <View style={shared.signLine} />
                        <Text style={shared.signName}>( Admin / Manager )</Text>
                    </View>
                    <View style={shared.signBox}>
                        <Text style={shared.signLabel}>Penerima,</Text>
                        <View style={shared.signLine} />
                        <Text style={shared.signName}>( {driver.name} )</Text>
                    </View>
                </View>

                <Text style={shared.pageNumber} render={({ pageNumber, totalPages }) =>
                    `Halaman ${pageNumber} dari ${totalPages}`
                } fixed />

            </Page>
        </Document>
    )
}
