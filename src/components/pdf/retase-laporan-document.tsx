"use client"
// PDF Template: Laporan Retase & Surat Jalan — Compact

import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer"
import { shared, COLORS } from "./pdf-shared"
import { format } from "date-fns"
import { id as idLocale } from "date-fns/locale"

export type RetaseLaporanRow = {
    id: string
    date: string | Date
    customer_name: string
    project_name: string
    mutu: string
    volume_cubic: number
    sopir: string
    kendaraan: string
    km: number | null
    income_amount: number | null
    price_per_cubic_km: number | null
    volume_rts: number | null
    cabang: string
}

export type RetaseLaporanData = {
    dateFrom: string
    dateTo: string
    filterCustomer?: string
    filterCabang?: string
    rows: RetaseLaporanRow[]
    totalVolume: number
    totalRetase: number
    pembuat: string
    generatedAt: string
}

const fmt = (n: number) => "Rp " + n.toLocaleString("id-ID")
const fmtDate = (d: Date | string) => format(new Date(d), "dd/MM/yy HH:mm", { locale: idLocale })

const s = StyleSheet.create({
    headerBox: {
        backgroundColor: COLORS.primary,
        padding: "6 10",
        marginBottom: 6,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    headerTitle: { fontSize: 11, fontFamily: "Helvetica-Bold", color: COLORS.white, textTransform: "uppercase", letterSpacing: 0.5 },
    headerSub: { fontSize: 7, color: "#93c5fd", marginTop: 1 },
    badge: { backgroundColor: COLORS.primaryLight, color: COLORS.primary, fontSize: 6.5, fontFamily: "Helvetica-Bold", padding: "1.5 5", borderRadius: 2 },
    metaRow: { flexDirection: "row", gap: 5, marginBottom: 7, flexWrap: "wrap" },
    summaryRow: { flexDirection: "row", gap: 6, marginBottom: 8 },
    summaryBox: { flex: 1, backgroundColor: COLORS.bg, borderRadius: 3, padding: "4 7", borderLeftWidth: 2, borderLeftColor: COLORS.accent },
    summaryLabel: { fontSize: 6, color: COLORS.muted, textTransform: "uppercase", letterSpacing: 0.4 },
    summaryValue: { fontSize: 10, fontFamily: "Helvetica-Bold", color: COLORS.primary, marginTop: 1 },
    tableHead: { flexDirection: "row", backgroundColor: "#334155" },
    th: { fontSize: 6, fontFamily: "Helvetica-Bold", color: "#e2e8f0", padding: "2.5 3.5", textTransform: "uppercase" },
    tr: { flexDirection: "row", borderBottomWidth: 0.3, borderBottomColor: COLORS.border },
    trAlt: { flexDirection: "row", borderBottomWidth: 0.3, borderBottomColor: COLORS.border, backgroundColor: "#f8fafc" },
    td: { fontSize: 7, color: COLORS.dark, padding: "2 3.5" },
    tdMono: { fontSize: 6.5, fontFamily: "Helvetica-Bold", color: COLORS.dark, padding: "2 3.5" },
    totalRow: { flexDirection: "row", backgroundColor: "#1e293b", padding: "3.5 3.5" },
    tdTotal: { fontSize: 7.5, fontFamily: "Helvetica-Bold", color: "#e2e8f0", padding: "0 0" },
    grandTotalBox: {
        flexDirection: "row", justifyContent: "space-between", alignItems: "center",
        backgroundColor: COLORS.primary, padding: "5 10", marginTop: 10, borderRadius: 3,
    },
    grandLabel: { fontSize: 8, fontFamily: "Helvetica-Bold", color: "#93c5fd" },
    grandValue: { fontSize: 12, fontFamily: "Helvetica-Bold", color: "#86efac" },
    ttdRow: { flexDirection: "row", marginTop: 18 },
    ttdBox: { flex: 1, alignItems: "center" },
    ttdTitle: { fontSize: 7, color: COLORS.muted, marginBottom: 20 },
    ttdLine: { width: "65%", borderBottomWidth: 0.8, borderBottomColor: COLORS.primary },
    ttdName: { fontSize: 7, fontFamily: "Helvetica-Bold", color: COLORS.dark, marginTop: 2 },
    ttdJabatan: { fontSize: 6.5, color: COLORS.muted },
})

export function RetaseLaporanDocument({ data }: { data: RetaseLaporanData }) {
    const hasCabang = !!data.filterCabang || data.rows.some(r => r.cabang && r.cabang !== "-")

    return (
        <Document title={`Laporan Retase ${data.dateFrom} - ${data.dateTo}`}>
            <Page size="A4" orientation="landscape"
                style={[shared.page, { paddingTop: 20, paddingBottom: 30, paddingHorizontal: 28 }]}>

                {/* Header */}
                <View style={s.headerBox} fixed>
                    <View>
                        <Text style={s.headerTitle}>Laporan Retase & Surat Jalan</Text>
                        <Text style={s.headerSub}>
                            Periode: {data.dateFrom} s/d {data.dateTo}
                            {data.filterCustomer ? ` · ${data.filterCustomer}` : ""}
                            {data.filterCabang ? ` · ${data.filterCabang}` : ""}
                        </Text>
                    </View>
                    <View style={{ alignItems: "flex-end" }}>
                        <Text style={[s.headerSub, { color: COLORS.white, fontFamily: "Helvetica-Bold" }]}>
                            {data.rows.length} SJ  |  {data.totalVolume.toFixed(2)} M³  |  {fmt(data.totalRetase)}
                        </Text>
                        <Text style={s.headerSub}>
                            {format(new Date(data.generatedAt), "dd MMM yyyy, HH:mm", { locale: idLocale })}
                        </Text>
                    </View>
                </View>

                {/* Meta */}
                <View style={s.metaRow}>
                    <Text style={s.badge}>{data.rows.length} Surat Jalan</Text>
                    {data.filterCustomer && <Text style={s.badge}>Customer: {data.filterCustomer}</Text>}
                    {data.filterCabang && <Text style={s.badge}>Cabang: {data.filterCabang}</Text>}
                    <View style={{ flex: 1 }} />
                    <Text style={{ fontSize: 6.5, color: COLORS.muted }}>
                        Rata-rata retase: {data.rows.length > 0 ? fmt(Math.round(data.totalRetase / data.rows.length)) : "-"} / SJ
                    </Text>
                </View>

                {/* Table */}
                <View style={s.tableHead}>
                    <Text style={[s.th, { width: 14 }]}>#</Text>
                    <Text style={[s.th, { width: 52 }]}>Tanggal</Text>
                    <Text style={[s.th, { flex: 1.8 }]}>Customer</Text>
                    <Text style={[s.th, { flex: 1.6 }]}>Proyek</Text>
                    <Text style={[s.th, { width: 38 }]}>Mutu</Text>
                    <Text style={[s.th, { width: 32 }]}>Vol M³</Text>
                    <Text style={[s.th, { flex: 1.2 }]}>Sopir</Text>
                    <Text style={[s.th, { width: 48 }]}>Kendaraan</Text>
                    <Text style={[s.th, { width: 26 }]}>KM</Text>
                    <Text style={[s.th, { flex: 1.5 }]}>Rincian (Vol×KM×Harga)</Text>
                    <Text style={[s.th, { flex: 1, textAlign: "right" }]}>Retase</Text>
                    {hasCabang && <Text style={[s.th, { width: 45 }]}>Cabang</Text>}
                </View>

                {data.rows.map((r, idx) => (
                    <View key={idx} style={idx % 2 === 0 ? s.tr : s.trAlt}>
                        <Text style={[s.td, { width: 14, color: COLORS.muted, fontSize: 6 }]}>{idx + 1}</Text>
                        <Text style={[s.td, { width: 52, fontSize: 6.5 }]}>{fmtDate(r.date)}</Text>
                        <Text style={[s.tdMono, { flex: 1.8, fontSize: 6.5 }]}>{r.customer_name}</Text>
                        <Text style={[s.td, { flex: 1.6 }]}>{r.project_name}</Text>
                        <Text style={[s.td, { width: 38 }]}>{r.mutu}</Text>
                        <Text style={[s.td, { width: 32, fontFamily: "Helvetica-Bold" }]}>{r.volume_cubic.toFixed(2)}</Text>
                        <Text style={[s.td, { flex: 1.2 }]}>{r.sopir}</Text>
                        <Text style={[s.td, { width: 48, fontSize: 6 }]}>{r.kendaraan}</Text>
                        <Text style={[s.td, { width: 26 }]}>{r.km ?? "-"}</Text>
                        <Text style={[s.td, { flex: 1.5, fontSize: 6, color: COLORS.muted }]}>
                            {r.price_per_cubic_km != null
                                ? `${(r.volume_rts ?? r.volume_cubic).toFixed(2)} × ${r.km} × ${r.price_per_cubic_km.toLocaleString("id-ID")}`
                                : "-"}
                        </Text>
                        <Text style={[s.td, { flex: 1, textAlign: "right", fontFamily: "Helvetica-Bold", color: "#15803d" }]}>
                            {r.income_amount != null ? fmt(r.income_amount) : "-"}
                        </Text>
                        {hasCabang && <Text style={[s.td, { width: 45, fontSize: 6 }]}>{r.cabang}</Text>}
                    </View>
                ))}

                {/* Total Row */}
                <View style={s.totalRow}>
                    <Text style={[s.tdTotal, { width: 14 }]} />
                    <Text style={[s.tdTotal, { width: 52 }]} />
                    <Text style={[s.tdTotal, { flex: 1.8 }]} />
                    <Text style={[s.tdTotal, { flex: 1.6, textAlign: "right", color: "#94a3b8" }]}>Total:</Text>
                    <Text style={[s.tdTotal, { width: 38 }]} />
                    <Text style={[s.tdTotal, { width: 32, color: "#86efac" }]}>{data.totalVolume.toFixed(2)}</Text>
                    <Text style={[s.tdTotal, { flex: 1.2 }]} />
                    <Text style={[s.tdTotal, { width: 48 }]} />
                    <Text style={[s.tdTotal, { width: 26 }]} />
                    <Text style={[s.tdTotal, { flex: 1.5 }]} />
                    <Text style={[s.tdTotal, { flex: 1, textAlign: "right", color: "#86efac" }]}>{fmt(data.totalRetase)}</Text>
                    {hasCabang && <Text style={[s.tdTotal, { width: 45 }]} />}
                </View>

                {/* Grand Total */}
                <View style={s.grandTotalBox}>
                    <Text style={s.grandLabel}>
                        GRAND TOTAL  ·  {data.rows.length} Surat Jalan  ·  {data.totalVolume.toFixed(2)} M³
                    </Text>
                    <Text style={s.grandValue}>{fmt(data.totalRetase)}</Text>
                </View>

                {/* TTD */}
                <View style={s.ttdRow}>
                    <View style={{ flex: 2 }} />
                    <View style={s.ttdBox}>
                        <Text style={s.ttdTitle}>Mengetahui,</Text>
                        <View style={s.ttdLine} />
                        <Text style={s.ttdName}>( .......................... )</Text>
                        <Text style={s.ttdJabatan}>Pimpinan</Text>
                    </View>
                    <View style={s.ttdBox}>
                        <Text style={s.ttdTitle}>Dibuat oleh,</Text>
                        <View style={s.ttdLine} />
                        <Text style={s.ttdName}>{data.pembuat}</Text>
                        <Text style={s.ttdJabatan}>Admin</Text>
                    </View>
                </View>

                <Text style={shared.pageNumber} render={({ pageNumber, totalPages }) =>
                    `Halaman ${pageNumber} dari ${totalPages}`
                } fixed />
            </Page>
        </Document>
    )
}
