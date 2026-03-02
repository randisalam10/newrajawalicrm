"use client"
// PDF Template: Laporan Bulanan PO

import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer"
import { shared, COLORS } from "./pdf-shared"
import { format } from "date-fns"
import { id as idLocale } from "date-fns/locale"

const MONTHS = [
    "", "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
]

export type LaporanPOData = {
    bulan: number
    tahun: number
    grupBy: "kategori" | "perusahaan"
    filterPerusahaan?: string
    filterKategori?: string
    filterStatus?: string
    groups: {
        label: string
        items: {
            po_number: string
            tanggal_terbit: string | Date
            perusahaan_nama: string
            kategori_nama: string
            supplier_nama: string
            metode_pembayaran: string
            status: string
            total: number
        }[]
        subtotal: number
    }[]
    grandTotal: number
    totalPO: number
    generatedAt: string
}

const fmt = (n: number) => "Rp " + n.toLocaleString("id-ID")
const fmtDate = (d: Date | string) => format(new Date(d), "dd/MM/yyyy", { locale: idLocale })

const s = StyleSheet.create({
    headerBox: {
        backgroundColor: COLORS.primary,
        padding: "10 14",
        marginBottom: 12,
        borderRadius: 4,
    },
    headerTitle: {
        fontSize: 14,
        fontFamily: "Helvetica-Bold",
        color: COLORS.white,
        textTransform: "uppercase",
        letterSpacing: 1,
    },
    headerSub: {
        fontSize: 9,
        color: "#93c5fd",
        marginTop: 3,
    },
    filterRow: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 6,
        marginBottom: 10,
    },
    filterBadge: {
        backgroundColor: COLORS.primaryLight,
        color: COLORS.primary,
        fontSize: 7,
        fontFamily: "Helvetica-Bold",
        padding: "2 7",
        borderRadius: 3,
    },
    summaryRow: {
        flexDirection: "row",
        gap: 10,
        marginBottom: 14,
    },
    summaryBox: {
        flex: 1,
        backgroundColor: COLORS.bg,
        borderRadius: 4,
        padding: "7 10",
        borderLeftWidth: 3,
        borderLeftColor: COLORS.accent,
    },
    summaryLabel: { fontSize: 7, color: COLORS.muted, textTransform: "uppercase", letterSpacing: 0.5 },
    summaryValue: { fontSize: 13, fontFamily: "Helvetica-Bold", color: COLORS.primary, marginTop: 2 },
    groupHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        backgroundColor: COLORS.primary,
        padding: "5 8",
        marginTop: 10,
    },
    groupLabel: { fontSize: 9, fontFamily: "Helvetica-Bold", color: COLORS.white },
    groupSubtotal: { fontSize: 9, fontFamily: "Helvetica-Bold", color: "#86efac" },
    tableHead: {
        flexDirection: "row",
        backgroundColor: "#e8edf5",
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    th: { fontSize: 7, fontFamily: "Helvetica-Bold", color: COLORS.muted, padding: "3 5", textTransform: "uppercase" },
    tr: { flexDirection: "row", borderBottomWidth: 0.5, borderBottomColor: COLORS.border },
    trAlt: { flexDirection: "row", borderBottomWidth: 0.5, borderBottomColor: COLORS.border, backgroundColor: COLORS.bg },
    td: { fontSize: 7.5, color: COLORS.dark, padding: "3 5" },
    tdMono: { fontSize: 7, fontFamily: "Helvetica-Bold", color: COLORS.dark, padding: "3 5" },
    subtotalRow: {
        flexDirection: "row",
        backgroundColor: "#f1f5f9",
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
        padding: "3 5",
    },
    subtotalLabel: { fontSize: 8, fontFamily: "Helvetica-Bold", color: COLORS.muted, textTransform: "uppercase" },
    subtotalValue: { fontSize: 8, fontFamily: "Helvetica-Bold", color: COLORS.primary },
    grandTotalBox: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        backgroundColor: COLORS.primary,
        padding: "8 12",
        marginTop: 14,
        borderRadius: 4,
    },
    grandLabel: { fontSize: 10, fontFamily: "Helvetica-Bold", color: "#93c5fd" },
    grandValue: { fontSize: 14, fontFamily: "Helvetica-Bold", color: "#86efac" },
    footer: { fontSize: 7, color: COLORS.muted, marginTop: 6 },
})

const statusLabel: Record<string, string> = {
    DRAFT: "Draft", APPROVED: "Disetujui", CANCELLED: "Dibatalkan"
}

export function LaporanPODocument({ data }: { data: LaporanPOData }) {
    const isDynCol = data.grupBy === "kategori" ? "Perusahaan" : "Kategori"

    return (
        <Document title={`Laporan PO ${MONTHS[data.bulan]} ${data.tahun}`}>
            <Page size="A4" orientation="landscape" style={[shared.page, { paddingTop: 30, paddingHorizontal: 36 }]}>

                {/* Header */}
                <View style={s.headerBox}>
                    <Text style={s.headerTitle}>Rekapitulasi Purchase Order Bulanan</Text>
                    <Text style={s.headerSub}>
                        Periode: {MONTHS[data.bulan]} {data.tahun}
                        {data.filterPerusahaan ? `  |  Perusahaan: ${data.filterPerusahaan}` : ""}
                        {data.filterKategori ? `  |  Kategori: ${data.filterKategori}` : ""}
                    </Text>
                </View>

                {/* Filter Badges */}
                <View style={s.filterRow}>
                    <Text style={s.filterBadge}>Grup: {data.grupBy === "kategori" ? "Per Kategori" : "Per Perusahaan"}</Text>
                    <Text style={s.filterBadge}>Status: {data.filterStatus || "Semua"}</Text>
                    <Text style={s.filterBadge}>Total PO: {data.totalPO}</Text>
                </View>

                {/* Summary */}
                <View style={s.summaryRow}>
                    <View style={s.summaryBox}>
                        <Text style={s.summaryLabel}>Total PO</Text>
                        <Text style={s.summaryValue}>{data.totalPO}</Text>
                    </View>
                    <View style={[s.summaryBox, { borderLeftColor: "#059669" }]}>
                        <Text style={s.summaryLabel}>Grand Total</Text>
                        <Text style={[s.summaryValue, { color: "#059669" }]}>{fmt(data.grandTotal)}</Text>
                    </View>
                    <View style={[s.summaryBox, { borderLeftColor: "#7c3aed" }]}>
                        <Text style={s.summaryLabel}>Rata-rata per PO</Text>
                        <Text style={[s.summaryValue, { color: "#7c3aed", fontSize: 11 }]}>
                            {data.totalPO > 0 ? fmt(Math.round(data.grandTotal / data.totalPO)) : "-"}
                        </Text>
                    </View>
                </View>

                {/* Groups */}
                {data.groups.map((group, gi) => (
                    <View key={gi} wrap={false}>
                        {/* Group Header */}
                        <View style={s.groupHeader}>
                            <Text style={s.groupLabel}>{group.label}</Text>
                            <Text style={s.groupSubtotal}>{group.items.length} PO  |  {fmt(group.subtotal)}</Text>
                        </View>

                        {/* Table Head */}
                        <View style={s.tableHead}>
                            <Text style={[s.th, { flex: 0.4 }]}>No</Text>
                            <Text style={[s.th, { flex: 1.8 }]}>Nomor PO</Text>
                            <Text style={[s.th, { flex: 1 }]}>Tanggal</Text>
                            <Text style={[s.th, { flex: 2 }]}>{isDynCol}</Text>
                            <Text style={[s.th, { flex: 1.5 }]}>Supplier</Text>
                            <Text style={[s.th, { flex: 0.8 }]}>Metode</Text>
                            <Text style={[s.th, { flex: 0.8 }]}>Status</Text>
                            <Text style={[s.th, { flex: 1.2, textAlign: "right" }]}>Total</Text>
                        </View>

                        {/* Rows */}
                        {group.items.map((po, idx) => (
                            <View key={idx} style={idx % 2 === 0 ? s.tr : s.trAlt}>
                                <Text style={[s.td, { flex: 0.4, color: COLORS.muted }]}>{idx + 1}</Text>
                                <Text style={[s.tdMono, { flex: 1.8 }]}>{po.po_number}</Text>
                                <Text style={[s.td, { flex: 1 }]}>{fmtDate(po.tanggal_terbit)}</Text>
                                <Text style={[s.td, { flex: 2 }]}>
                                    {data.grupBy === "kategori" ? po.perusahaan_nama : po.kategori_nama}
                                </Text>
                                <Text style={[s.td, { flex: 1.5 }]}>{po.supplier_nama}</Text>
                                <Text style={[s.td, { flex: 0.8 }]}>{po.metode_pembayaran}</Text>
                                <Text style={[s.td, { flex: 0.8 }]}>{statusLabel[po.status] || po.status}</Text>
                                <Text style={[s.td, { flex: 1.2, textAlign: "right", fontFamily: "Helvetica-Bold", color: "#15803d" }]}>
                                    {fmt(po.total)}
                                </Text>
                            </View>
                        ))}

                        {/* Subtotal */}
                        <View style={s.subtotalRow}>
                            <Text style={[s.subtotalLabel, { flex: 7.7, textAlign: "right" }]}>
                                Subtotal {group.label}
                            </Text>
                            <Text style={[s.subtotalValue, { flex: 1.2, textAlign: "right" }]}>
                                {fmt(group.subtotal)}
                            </Text>
                        </View>
                    </View>
                ))}

                {/* Grand Total */}
                <View style={s.grandTotalBox}>
                    <Text style={s.grandLabel}>GRAND TOTAL — {data.totalPO} Purchase Order</Text>
                    <Text style={s.grandValue}>{fmt(data.grandTotal)}</Text>
                </View>

                {/* Footer */}
                <Text style={s.footer}>
                    Dicetak: {format(new Date(data.generatedAt), "dd MMMM yyyy, HH:mm", { locale: idLocale })} WIT
                </Text>

                <Text style={shared.pageNumber} render={({ pageNumber, totalPages }) =>
                    `Halaman ${pageNumber} dari ${totalPages}`
                } fixed />
            </Page>
        </Document>
    )
}
