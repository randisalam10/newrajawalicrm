"use client"
// PDF Template: Laporan Bulanan PO — Compact version

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
    grupBy: "kategori" | "perusahaan" | "metode_pembayaran"
    filterPerusahaan?: string
    filterKategori?: string
    filterStatus?: string
    pembuat?: string
    groups: {
        label: string
        items: {
            po_number: string
            tanggal_terbit: string | Date
            perusahaan_nama: string
            kategori_nama: string
            proyek_nama?: string | null
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
const fmtDate = (d: Date | string) => format(new Date(d), "dd/MM/yy", { locale: idLocale })

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
    headerRight: { alignItems: "flex-end" },
    badge: { backgroundColor: COLORS.primaryLight, color: COLORS.primary, fontSize: 6.5, fontFamily: "Helvetica-Bold", padding: "1.5 5", borderRadius: 2 },
    groupHeader: { flexDirection: "row", justifyContent: "space-between", backgroundColor: "#334155", padding: "3.5 7", marginTop: 8 },
    groupLabel: { fontSize: 7.5, fontFamily: "Helvetica-Bold", color: COLORS.white },
    groupSubtotal: { fontSize: 7.5, fontFamily: "Helvetica-Bold", color: "#86efac" },
    tableHead: { flexDirection: "row", backgroundColor: "#e8edf5", borderBottomWidth: 0.5, borderBottomColor: COLORS.border },
    th: { fontSize: 5.8, fontFamily: "Helvetica-Bold", color: COLORS.muted, padding: "2.5 3.5", textTransform: "uppercase" },
    tr: { flexDirection: "row", borderBottomWidth: 0.3, borderBottomColor: COLORS.border },
    trAlt: { flexDirection: "row", borderBottomWidth: 0.3, borderBottomColor: COLORS.border, backgroundColor: "#f8fafc" },
    td: { fontSize: 7, color: COLORS.dark, padding: "2 3.5" },
    tdMono: { fontSize: 6.5, fontFamily: "Helvetica-Bold", color: COLORS.dark, padding: "2 3.5" },
    subtotalRow: {
        flexDirection: "row",
        backgroundColor: "#f1f5f9",
        borderTopWidth: 0.8,
        borderTopColor: "#cbd5e1",
        padding: "2 3.5",
    },
    grandTotalBox: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        backgroundColor: COLORS.primary,
        padding: "5 10",
        marginTop: 10,
        borderRadius: 3,
    },
    grandLabel: { fontSize: 8, fontFamily: "Helvetica-Bold", color: "#93c5fd" },
    grandValue: { fontSize: 12, fontFamily: "Helvetica-Bold", color: "#86efac" },
    // TTD
    ttdRow: { flexDirection: "row", marginTop: 20, gap: 0 },
    ttdBox: { flex: 1, alignItems: "center" },
    ttdTitle: { fontSize: 7, color: COLORS.muted, marginBottom: 22 },
    ttdLine: { width: "70%", borderBottomWidth: 1, borderBottomColor: COLORS.primary },
    ttdName: { fontSize: 7, fontFamily: "Helvetica-Bold", color: COLORS.dark, marginTop: 3 },
    ttdJabatan: { fontSize: 6.5, color: COLORS.muted },
})

const statusLabel: Record<string, string> = {
    DRAFT: "Draft", APPROVED: "Disetujui", CANCELLED: "Batal"
}

const grupLabel: Record<string, string> = {
    kategori: "Per Kategori", perusahaan: "Per Perusahaan", metode_pembayaran: "Per Metode Pembayaran"
}

export function LaporanPODocument({ data }: { data: LaporanPOData }) {
    // Determine dynamic column config
    const isMixed = data.grupBy === "metode_pembayaran"
    const showSubtotalPerGroup = data.groups.length > 1

    return (
        <Document title={`Laporan PO ${MONTHS[data.bulan]} ${data.tahun}`}>
            <Page size="A4" orientation="landscape"
                style={[shared.page, { paddingTop: 20, paddingBottom: 30, paddingHorizontal: 28 }]}>

                {/* Header fixed */}
                <View style={s.headerBox} fixed>
                    <View>
                        <Text style={s.headerTitle}>Rekapitulasi Purchase Order Bulanan</Text>
                        <Text style={s.headerSub}>
                            Periode: {MONTHS[data.bulan]} {data.tahun}
                            {data.filterPerusahaan ? ` · ${data.filterPerusahaan}` : ""}
                            {data.filterKategori ? ` · ${data.filterKategori}` : ""}
                        </Text>
                    </View>
                    <View style={s.headerRight}>
                        <Text style={[s.headerSub, { fontSize: 7, color: COLORS.white, fontFamily: "Helvetica-Bold" }]}>
                            {data.totalPO} PO  |  {fmt(data.grandTotal)}
                        </Text>
                        <Text style={s.headerSub}>
                            {format(new Date(data.generatedAt), "dd MMM yyyy, HH:mm", { locale: idLocale })}
                        </Text>
                    </View>
                </View>

                {/* Meta row */}
                <View style={{ flexDirection: "row", alignItems: "center", gap: 5, marginBottom: 8 }}>
                    <Text style={s.badge}>Grup: {grupLabel[data.grupBy]}</Text>
                    {data.filterStatus && <Text style={s.badge}>Status: {data.filterStatus}</Text>}
                    <View style={{ flex: 1 }} />
                    <Text style={{ fontSize: 6.5, color: COLORS.muted }}>
                        Rata-rata / PO: {data.totalPO > 0 ? fmt(Math.round(data.grandTotal / data.totalPO)) : "-"}
                    </Text>
                </View>

                {/* Groups */}
                {data.groups.map((group, gi) => (
                    <View key={gi}>
                        {/* Group Header */}
                        <View style={s.groupHeader}>
                            <Text style={s.groupLabel}>{group.label}</Text>
                            <Text style={s.groupSubtotal}>{group.items.length} PO · {fmt(group.subtotal)}</Text>
                        </View>

                        {/* Table Head */}
                        <View style={s.tableHead}>
                            <Text style={[s.th, { width: 14 }]}>#</Text>
                            <Text style={[s.th, { flex: 1.6 }]}>Nomor PO</Text>
                            <Text style={[s.th, { width: 40 }]}>Tgl</Text>
                            {/* Dynamic cols */}
                            {data.grupBy === "kategori" && <Text style={[s.th, { flex: 1.8 }]}>Perusahaan</Text>}
                            {data.grupBy === "perusahaan" && <Text style={[s.th, { flex: 1.2 }]}>Kategori</Text>}
                            {isMixed && <Text style={[s.th, { flex: 1.6 }]}>Perusahaan</Text>}
                            {isMixed && <Text style={[s.th, { flex: 1.2 }]}>Kategori</Text>}
                            <Text style={[s.th, { flex: 1.4 }]}>Proyek</Text>
                            <Text style={[s.th, { flex: 1.4 }]}>Supplier</Text>
                            {!isMixed && <Text style={[s.th, { width: 36 }]}>Metode</Text>}
                            <Text style={[s.th, { width: 40 }]}>Status</Text>
                            <Text style={[s.th, { flex: 1, textAlign: "right" }]}>Total</Text>
                        </View>

                        {/* Rows */}
                        {group.items.map((po, idx) => (
                            <View key={idx} style={idx % 2 === 0 ? s.tr : s.trAlt}>
                                <Text style={[s.td, { width: 14, color: COLORS.muted, fontSize: 6 }]}>{idx + 1}</Text>
                                <Text style={[s.tdMono, { flex: 1.6 }]}>{po.po_number}</Text>
                                <Text style={[s.td, { width: 40 }]}>{fmtDate(po.tanggal_terbit)}</Text>
                                {data.grupBy === "kategori" && <Text style={[s.td, { flex: 1.8 }]}>{po.perusahaan_nama}</Text>}
                                {data.grupBy === "perusahaan" && <Text style={[s.td, { flex: 1.2 }]}>{po.kategori_nama}</Text>}
                                {isMixed && <Text style={[s.td, { flex: 1.6 }]}>{po.perusahaan_nama}</Text>}
                                {isMixed && <Text style={[s.td, { flex: 1.2 }]}>{po.kategori_nama}</Text>}
                                <Text style={[s.td, { flex: 1.4, color: COLORS.muted, fontFamily: "Helvetica-Oblique" }]}>
                                    {po.proyek_nama || "-"}
                                </Text>
                                <Text style={[s.td, { flex: 1.4 }]}>{po.supplier_nama}</Text>
                                {!isMixed && <Text style={[s.td, { width: 36 }]}>{po.metode_pembayaran}</Text>}
                                <Text style={[s.td, { width: 40 }]}>{statusLabel[po.status] || po.status}</Text>
                                <Text style={[s.td, { flex: 1, textAlign: "right", fontFamily: "Helvetica-Bold", color: "#15803d" }]}>
                                    {fmt(po.total)}
                                </Text>
                            </View>
                        ))}

                        {/* Subtotal per group — hanya jika ada lebih dari 1 grup */}
                        {showSubtotalPerGroup && (
                            <View style={s.subtotalRow}>
                                <Text style={{ flex: 1, fontSize: 7, fontFamily: "Helvetica-Bold", color: COLORS.muted, textAlign: "right" }}>
                                    Subtotal {group.label}: {fmt(group.subtotal)}
                                </Text>
                            </View>
                        )}
                    </View>
                ))}

                {/* Grand Total — hanya 1 */}
                <View style={s.grandTotalBox}>
                    <Text style={s.grandLabel}>GRAND TOTAL — {data.totalPO} Purchase Order</Text>
                    <Text style={s.grandValue}>{fmt(data.grandTotal)}</Text>
                </View>

                {/* TTD Admin */}
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
                        <Text style={s.ttdName}>{data.pembuat || "Admin"}</Text>
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
