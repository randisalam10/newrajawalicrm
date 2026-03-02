"use client"
// PDF Template: Surat Jalan (Delivery Note) - 3 Rangkap (Admin, Sopir, Pelanggan)
// Data source: ProductionTransaction with includes

import {
    Document, Page, Text, View, StyleSheet
} from "@react-pdf/renderer"
import { COLORS } from "./pdf-shared"
import { format } from "date-fns"
import { id as idLocale } from "date-fns/locale"

// ─── Types ────────────────────────────────────────────────────────────────────
export type SuratJalanData = {
    id: string
    date: Date | string
    trip_sequence: number
    volume_cubic: number
    cumulative_volume: number
    slump: string
    project: {
        name: string
        address: string
        customer: { customer_name: string }
    }
    vehicle: { plate_number: string; code: string }
    driver: { name: string }
    createdBy: { name: string }
    concreteQuality: { name: string }
    workItem: { name: string }
    location: { name: string }
}

// ─── Compact Styles untuk 3 rangkap ───────────────────────────────────────────
const s = StyleSheet.create({
    page: {
        backgroundColor: COLORS.white,
        fontFamily: "Helvetica",
        color: COLORS.dark,
        paddingTop: 10,
        paddingBottom: 10,
    },
    copyContainer: {
        flex: 1,
        paddingHorizontal: 30,
        paddingVertical: 5,
        display: "flex",
        flexDirection: "column",
    },

    // Potong garis
    cutContainer: {
        position: "relative",
        alignItems: "center",
        justifyContent: "center",
        marginVertical: 2,
    },
    cutLine: {
        position: "absolute",
        left: 20, right: 20, top: "50%",
        borderBottomWidth: 1,
        borderBottomColor: COLORS.muted,
        borderStyle: "dashed",
    },
    cutText: {
        fontSize: 7,
        color: COLORS.muted,
        backgroundColor: COLORS.white,
        paddingHorizontal: 8,
    },

    // Label Jenis Copy (Admin/Sopir/Pelanggan)
    copyLabelBadge: {
        alignSelf: "flex-end",
        backgroundColor: COLORS.primaryLight,
        padding: "2 6",
        borderRadius: 4,
        borderWidth: 0.5,
        borderColor: COLORS.primary,
        marginBottom: 2,
    },
    copyLabelText: { fontSize: 6, fontFamily: "Helvetica-Bold", color: COLORS.primary },

    // Header
    headerRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        borderBottomWidth: 1.5,
        borderBottomColor: COLORS.primary,
        paddingBottom: 4,
        marginBottom: 4,
    },
    companyName: { fontSize: 12, fontFamily: "Helvetica-Bold", color: COLORS.primary },
    companySub: { fontSize: 7, color: COLORS.muted, marginTop: 1 },
    docTitleBox: { alignItems: "flex-end" },
    docTitle: { fontSize: 10, fontFamily: "Helvetica-Bold", color: COLORS.primary, textTransform: "uppercase" },
    noSJ: { fontSize: 7, fontFamily: "Helvetica", color: COLORS.mid, marginTop: 2 },
    docMeta: { fontSize: 7, color: COLORS.muted, marginTop: 1 },

    // Info Grid
    infoGrid: { flexDirection: "row", gap: 8, marginBottom: 5 },
    infoBox: { flex: 1, backgroundColor: COLORS.bg, borderRadius: 3, padding: 5 },
    infoLabel: { fontSize: 6, fontFamily: "Helvetica-Bold", color: COLORS.muted, textTransform: "uppercase", marginBottom: 3 },
    kv: { flexDirection: "row", marginBottom: 2 },
    kvKey: { fontSize: 7, color: COLORS.muted, width: 55 },
    kvVal: { fontSize: 7, fontFamily: "Helvetica-Bold", color: COLORS.dark, flex: 1 },

    // Table
    sectionTitle: {
        fontSize: 7, fontFamily: "Helvetica-Bold", color: COLORS.mid, textTransform: "uppercase",
        borderBottomWidth: 0.5, borderBottomColor: COLORS.border, paddingBottom: 2, marginBottom: 3, marginTop: 2
    },
    table: { width: "100%", marginBottom: 3 },
    tableHead: { flexDirection: "row", backgroundColor: COLORS.primary },
    tableHeadCell: { fontSize: 7, fontFamily: "Helvetica-Bold", color: COLORS.white, padding: "3 4", flex: 1 },
    tableRow: { flexDirection: "row", borderBottomWidth: 0.5, borderBottomColor: COLORS.border },
    tableCell: { fontSize: 7, color: COLORS.dark, padding: "3 4", flex: 1 },
    tableCellBold: { fontSize: 7, fontFamily: "Helvetica-Bold", color: COLORS.dark, padding: "3 4", flex: 1 },

    noteBox: { borderWidth: 0.5, borderColor: COLORS.border, borderRadius: 3, height: 16, marginBottom: 2, padding: 2 },

    // Signatures
    signRow: { flexDirection: "row", marginTop: "auto", gap: 10, paddingBottom: 2 },
    signBox: { flex: 1, alignItems: "center" },
    signLabel: { fontSize: 7, color: COLORS.mid, marginBottom: 20 },
    signLine: { width: "80%", borderBottomWidth: 0.5, borderBottomColor: COLORS.primary },
    signName: { fontSize: 7, fontFamily: "Helvetica-Bold", color: COLORS.dark, marginTop: 3, textAlign: "center" },
})

function KV({ k, v }: { k: string; v: string }) {
    return (
        <View style={s.kv}>
            <Text style={s.kvKey}>{k}</Text>
            <Text style={{ fontSize: 7, color: COLORS.dark }}>: </Text>
            <Text style={s.kvVal}>{v}</Text>
        </View>
    )
}

function SuratJalanCopy({ tx, copyLabel, noSJ, tanggal, waktu }: { tx: SuratJalanData, copyLabel: string, noSJ: string, tanggal: string, waktu: string }) {
    return (
        <View style={s.copyContainer}>
            <View style={s.copyLabelBadge}>
                <Text style={s.copyLabelText}>{copyLabel}</Text>
            </View>

            {/* Header */}
            <View style={s.headerRow}>
                <View>
                    <Text style={s.companyName}>PT. RAJAWALI MIX</Text>
                    <Text style={s.companySub}>Batching Plant &amp; Beton Cor Readymix</Text>
                    <Text style={s.companySub}>Cabang: {tx.location.name}</Text>
                </View>
                <View style={s.docTitleBox}>
                    <Text style={s.docTitle}>Surat Jalan</Text>
                    <Text style={s.noSJ}>No: {noSJ}</Text>
                    <Text style={s.docMeta}>Tanggal: {tanggal}</Text>
                </View>
            </View>

            {/* Info */}
            <View style={s.infoGrid}>
                <View style={s.infoBox}>
                    <Text style={s.infoLabel}>DATA CUSTOMER / PROYEK</Text>
                    <KV k="Customer" v={tx.project.customer.customer_name} />
                    <KV k="Proyek" v={tx.project.name} />
                    <KV k="Alamat" v={tx.project.address} />
                </View>
                <View style={s.infoBox}>
                    <Text style={s.infoLabel}>DETAIL PENGIRIMAN</Text>
                    <KV k="Kendaraan" v={`${tx.vehicle.plate_number} (${tx.vehicle.code})`} />
                    <KV k="Nama Sopir" v={tx.driver.name} />
                    <KV k="Ritase (TM) Ke" v={`TM-${tx.trip_sequence}`} />
                    <KV k="Waktu Muat" v={`${waktu} WIT`} />
                </View>
            </View>

            {/* Table */}
            <Text style={s.sectionTitle}>RINCIAN MUATAN</Text>
            <View style={s.table}>
                <View style={s.tableHead}>
                    <Text style={[s.tableHeadCell, { flex: 1.4 }]}>Mutu Beton</Text>
                    <Text style={[s.tableHeadCell, { flex: 1.4 }]}>Item Pekerjaan</Text>
                    <Text style={[s.tableHeadCell, { flex: 0.8, textAlign: "center" }]}>Slump</Text>
                    <Text style={[s.tableHeadCell, { flex: 0.9, textAlign: "right" }]}>Volume (M³)</Text>
                    <Text style={[s.tableHeadCell, { flex: 1, textAlign: "right" }]}>Kumulatif (M³)</Text>
                </View>
                <View style={s.tableRow}>
                    <Text style={[s.tableCellBold, { flex: 1.4 }]}>{tx.concreteQuality.name}</Text>
                    <Text style={[s.tableCell, { flex: 1.4 }]}>{tx.workItem.name}</Text>
                    <Text style={[s.tableCell, { flex: 0.8, textAlign: "center" }]}>{tx.slump}</Text>
                    <Text style={[s.tableCellBold, { flex: 0.9, textAlign: "right" }]}>{tx.volume_cubic.toFixed(2)}</Text>
                    <Text style={[s.tableCell, { flex: 1, textAlign: "right", color: COLORS.muted }]}>{tx.cumulative_volume.toFixed(2)}</Text>
                </View>
            </View>

            <Text style={s.sectionTitle}>CATATAN TAMBAHAN</Text>
            <View style={s.noteBox}></View>

            {/* Signatures */}
            <View style={s.signRow}>
                <View style={s.signBox}>
                    <Text style={s.signLabel}>Penerima Cor/Proyek,</Text>
                    <View style={s.signLine} />
                    <Text style={s.signName}>( Nama Jelas &amp; TTD )</Text>
                </View>
                <View style={s.signBox}>
                    <Text style={s.signLabel}>Sopir Mixer,</Text>
                    <View style={s.signLine} />
                    <Text style={s.signName}>( {tx.driver.name} )</Text>
                </View>
                <View style={s.signBox}>
                    <Text style={s.signLabel}>Admin/Operator,</Text>
                    <View style={s.signLine} />
                    <Text style={s.signName}>( {tx.createdBy.name} )</Text>
                </View>
            </View>
        </View>
    )
}

function CutLine() {
    return (
        <View style={s.cutContainer}>
            <View style={s.cutLine} />
            <Text style={s.cutText}>✂ Potong di sini ----------------------------------</Text>
        </View>
    )
}

// ─── Document ─────────────────────────────────────────────────────────────────
export function SuratJalanDocument({ tx }: { tx: SuratJalanData }) {
    const date = new Date(tx.date)
    const noSJ = `${tx.id.split("-")[0].toUpperCase()}/SJ/${format(date, "MM/yy")}`
    const tanggal = format(date, "dd MMMM yyyy", { locale: idLocale })
    const waktu = format(date, "HH:mm")

    return (
        <Document title={`Surat Jalan ${noSJ}`} author="PT. Rajawali Mix">
            <Page size="A4" style={s.page}>
                <SuratJalanCopy tx={tx} copyLabel="LEMBAR 1: ADMIN" noSJ={noSJ} tanggal={tanggal} waktu={waktu} />
                <CutLine />
                <SuratJalanCopy tx={tx} copyLabel="LEMBAR 2: SOPIR" noSJ={noSJ} tanggal={tanggal} waktu={waktu} />
                <CutLine />
                <SuratJalanCopy tx={tx} copyLabel="LEMBAR 3: PELANGGAN" noSJ={noSJ} tanggal={tanggal} waktu={waktu} />
            </Page>
        </Document>
    )
}

