"use client"
// PDF Template: Surat Jalan Sewa Alat / Kendaraan
// 2 Rangkap per lembar A4 (Lembar 1: Arsip Kantor/Admin, Lembar 2: Pelanggan/Penyewa)

import {
    Document, Page, Text, View, StyleSheet
} from "@react-pdf/renderer"
import { COLORS } from "./pdf-shared"
import { format } from "date-fns"
import { id as idLocale } from "date-fns/locale"

export type SewaDocumentData = {
    id: string
    sewa_number: string
    date: Date | string
    customer: {
        customer_name: string
        address: string
    }
    project?: {
        name: string
        address: string
    } | null
    lokasi_proyek?: string | null
    equipment: {
        kode_alat: string
        nama_alat: string
        kategori: string
        merk_model?: string | null
        nomor_seri_plat?: string | null
    }
    operator: {
        name: string
        driverCategory?: { name: string } | null
    }
    date_mode: string
    start_date: Date | string
    end_date: Date | string
    rental_dates: string // JSON array
    total_days: number
    price_per_day: number
    total_price: number
    notes?: string | null
    location: {
        name: string
    }
}

const s = StyleSheet.create({
    page: {
        backgroundColor: COLORS.white,
        fontFamily: "Helvetica",
        color: COLORS.dark,
        paddingTop: 15,
        paddingBottom: 15,
    },
    copyContainer: {
        flex: 1,
        paddingHorizontal: 28,
        paddingVertical: 8,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
    },
    cutContainer: {
        position: "relative",
        alignItems: "center",
        justifyContent: "center",
        marginVertical: 4,
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
    copyLabelBadge: {
        alignSelf: "flex-end",
        backgroundColor: COLORS.primaryLight,
        padding: "2 6",
        borderRadius: 4,
        borderWidth: 0.5,
        borderColor: COLORS.primary,
        marginBottom: 2,
    },
    copyLabelText: { fontSize: 6.5, fontFamily: "Helvetica-Bold", color: COLORS.primary },
    headerRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        borderBottomWidth: 1.5,
        borderBottomColor: COLORS.primary,
        paddingBottom: 4,
        marginBottom: 6,
    },
    companyName: { fontSize: 11, fontFamily: "Helvetica-Bold", color: COLORS.primary },
    companySub: { fontSize: 7, color: COLORS.muted, marginTop: 1 },
    docTitleBox: { alignItems: "flex-end" },
    docTitle: { fontSize: 10, fontFamily: "Helvetica-Bold", color: COLORS.primary, textTransform: "uppercase" },
    noSJ: { fontSize: 7.5, fontFamily: "Helvetica-Bold", color: COLORS.mid, marginTop: 2 },
    docMeta: { fontSize: 6.5, color: COLORS.muted, marginTop: 1 },
    grid2: {
        flexDirection: "row",
        gap: 12,
        marginBottom: 6,
    },
    infoBox: {
        flex: 1,
        backgroundColor: "#f8fafc",
        borderWidth: 0.5,
        borderColor: "#cbd5e1",
        borderRadius: 4,
        padding: 5,
    },
    infoBoxTitle: {
        fontSize: 7,
        fontFamily: "Helvetica-Bold",
        color: COLORS.primary,
        marginBottom: 3,
        borderBottomWidth: 0.5,
        borderBottomColor: "#e2e8f0",
        paddingBottom: 2,
    },
    fieldRow: {
        flexDirection: "row",
        marginBottom: 2,
    },
    fieldLabel: {
        width: "35%",
        fontSize: 6.5,
        color: COLORS.muted,
    },
    fieldVal: {
        width: "65%",
        fontSize: 6.5,
        fontFamily: "Helvetica-Bold",
        color: COLORS.dark,
    },
    tableContainer: {
        borderWidth: 0.5,
        borderColor: "#cbd5e1",
        borderRadius: 4,
        overflow: "hidden",
        marginBottom: 6,
    },
    tableHeader: {
        flexDirection: "row",
        backgroundColor: COLORS.primary,
        padding: "3 6",
    },
    tableHeaderCell: {
        fontSize: 6.5,
        fontFamily: "Helvetica-Bold",
        color: COLORS.white,
    },
    tableRow: {
        flexDirection: "row",
        padding: "4 6",
        borderBottomWidth: 0.5,
        borderBottomColor: "#e2e8f0",
        alignItems: "center",
    },
    tableCell: {
        fontSize: 6.5,
        color: COLORS.dark,
    },
    datesBadgesBox: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 3,
        marginTop: 2,
    },
    dateBadge: {
        backgroundColor: "#e0f2fe",
        borderWidth: 0.5,
        borderColor: "#7dd3fc",
        borderRadius: 2,
        padding: "1 3",
        fontSize: 6,
        color: "#0369a1",
        fontFamily: "Helvetica-Bold",
    },
    footerGrid: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-end",
        marginTop: 4,
    },
    sigBox: {
        width: "28%",
        alignItems: "center",
    },
    sigLabel: {
        fontSize: 6.5,
        color: COLORS.muted,
        marginBottom: 24,
    },
    sigLine: {
        width: "100%",
        borderBottomWidth: 0.5,
        borderBottomColor: COLORS.dark,
        marginBottom: 2,
    },
    sigName: {
        fontSize: 6.5,
        fontFamily: "Helvetica-Bold",
        textAlign: "center",
    },
    notesBox: {
        width: "40%",
        borderWidth: 0.5,
        borderColor: "#e2e8f0",
        borderRadius: 3,
        padding: 4,
        backgroundColor: "#fafafa",
    },
    notesText: {
        fontSize: 6,
        color: COLORS.muted,
    },
})

function formatRupiah(num: number) {
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(num)
}

function SewaSingleCopy({
    tx,
    copyLabel
}: {
    tx: SewaDocumentData
    copyLabel: string
}) {
    let parsedDates: string[] = []
    try {
        parsedDates = JSON.parse(tx.rental_dates || "[]")
    } catch {
        parsedDates = []
    }

    const txDateFormatted = format(new Date(tx.date), "dd MMMM yyyy, HH:mm", { locale: idLocale })
    const startDateFormatted = format(new Date(tx.start_date), "dd/MM/yyyy")
    const endDateFormatted = format(new Date(tx.end_date), "dd/MM/yyyy")

    return (
        <View style={s.copyContainer}>
            {/* Copy Label */}
            <View style={s.copyLabelBadge}>
                <Text style={s.copyLabelText}>{copyLabel}</Text>
            </View>

            {/* Header Row */}
            <View style={s.headerRow}>
                <View>
                    <Text style={s.companyName}>PT. RAJAWALI PUNCAK JAYAWIJAYA</Text>
                    <Text style={s.companySub}>Batching Plant & Penyewaan Alat Berat • Cabang {tx.location?.name || "Pusat"}</Text>
                </View>
                <View style={s.docTitleBox}>
                    <Text style={s.docTitle}>SURAT JALAN SEWA ALAT</Text>
                    <Text style={s.noSJ}>NO: {tx.sewa_number}</Text>
                    <Text style={s.docMeta}>Tgl: {txDateFormatted} WIT</Text>
                </View>
            </View>

            {/* Info Grid (Pelanggan & Unit/Operator) */}
            <View style={s.grid2}>
                {/* Box Pelanggan */}
                <View style={s.infoBox}>
                    <Text style={s.infoBoxTitle}>INFORMASI PENYEWA (CUSTOMER)</Text>
                    <View style={s.fieldRow}>
                        <Text style={s.fieldLabel}>Nama Customer:</Text>
                        <Text style={s.fieldVal}>{tx.customer?.customer_name || "-"}</Text>
                    </View>
                    <View style={s.fieldRow}>
                        <Text style={s.fieldLabel}>Nama Proyek:</Text>
                        <Text style={s.fieldVal}>{tx.project?.name || tx.lokasi_proyek || "-"}</Text>
                    </View>
                    <View style={s.fieldRow}>
                        <Text style={s.fieldLabel}>Lokasi Kerja:</Text>
                        <Text style={s.fieldVal}>{tx.lokasi_proyek || tx.project?.address || tx.customer?.address || "-"}</Text>
                    </View>
                </View>

                {/* Box Alat & Operator */}
                <View style={s.infoBox}>
                    <Text style={s.infoBoxTitle}>INFORMASI ALAT & OPERATOR</Text>
                    <View style={s.fieldRow}>
                        <Text style={s.fieldLabel}>Unit Alat:</Text>
                        <Text style={s.fieldVal}>{tx.equipment?.nama_alat} ({tx.equipment?.kode_alat})</Text>
                    </View>
                    <View style={s.fieldRow}>
                        <Text style={s.fieldLabel}>Kategori / Model:</Text>
                        <Text style={s.fieldVal}>{tx.equipment?.kategori} {tx.equipment?.merk_model ? `• ${tx.equipment.merk_model}` : ""}</Text>
                    </View>
                    <View style={s.fieldRow}>
                        <Text style={s.fieldLabel}>Plat / No Seri:</Text>
                        <Text style={s.fieldVal}>{tx.equipment?.nomor_seri_plat || "-"}</Text>
                    </View>
                    <View style={s.fieldRow}>
                        <Text style={s.fieldLabel}>Nama Operator:</Text>
                        <Text style={s.fieldVal}>
                            {tx.operator?.name || "-"} {tx.operator?.driverCategory ? `(${tx.operator.driverCategory.name})` : ""}
                        </Text>
                    </View>
                </View>
            </View>

            {/* Table Detail Sewa & Perhitungan Hari */}
            <View style={s.tableContainer}>
                <View style={s.tableHeader}>
                    <Text style={[s.tableHeaderCell, { width: "35%" }]}>Rincian Periode / Jadwal Sewa</Text>
                    <Text style={[s.tableHeaderCell, { width: "20%", textAlign: "center" }]}>Perhitungan Hari</Text>
                    <Text style={[s.tableHeaderCell, { width: "20%", textAlign: "right" }]}>Tarif / Hari</Text>
                    <Text style={[s.tableHeaderCell, { width: "25%", textAlign: "right" }]}>Total Nilai Sewa</Text>
                </View>
                <View style={s.tableRow}>
                    <View style={{ width: "35%" }}>
                        {tx.date_mode === "RANGE" ? (
                            <Text style={[s.tableCell, { fontFamily: "Helvetica-Bold" }]}>
                                {startDateFormatted} s/d {endDateFormatted}
                            </Text>
                        ) : (
                            <View>
                                <Text style={[s.tableCell, { fontFamily: "Helvetica-Bold" }]}>
                                    Tanggal Tertentu ({parsedDates.length} Hari):
                                </Text>
                                <View style={s.datesBadgesBox}>
                                    {parsedDates.map((d, i) => (
                                        <Text key={i} style={s.dateBadge}>
                                            {format(new Date(d), "dd/MM")}
                                        </Text>
                                    ))}
                                </View>
                            </View>
                        )}
                    </View>
                    <View style={{ width: "20%", alignItems: "center" }}>
                        <Text style={[s.tableCell, { fontFamily: "Helvetica-Bold", color: COLORS.primary }]}>
                            {tx.total_days} HARI
                        </Text>
                    </View>
                    <View style={{ width: "20%", alignItems: "flex-end" }}>
                        <Text style={s.tableCell}>
                            {tx.price_per_day > 0 ? formatRupiah(tx.price_per_day) : "Free Input"}
                        </Text>
                    </View>
                    <View style={{ width: "25%", alignItems: "flex-end" }}>
                        <Text style={[s.tableCell, { fontFamily: "Helvetica-Bold", color: COLORS.primary }]}>
                            {tx.total_price > 0 ? formatRupiah(tx.total_price) : "Sesuai Kesepakatan"}
                        </Text>
                    </View>
                </View>
            </View>

            {/* Footer with Notes and Signatures */}
            <View style={s.footerGrid}>
                {/* Notes */}
                <View style={s.notesBox}>
                    <Text style={[s.notesText, { fontFamily: "Helvetica-Bold", marginBottom: 2 }]}>Catatan / Ketentuan:</Text>
                    <Text style={s.notesText}>{tx.notes || "Alat dan operator diserahkan dalam kondisi baik dan siap beroperasi. Segala kerusakan akibat kelalaian pemakaian di luar batas wajar menjadi tanggung jawab penyewa."}</Text>
                </View>

                {/* Signatures */}
                <View style={s.sigBox}>
                    <Text style={s.sigLabel}>Yang Menyerahkan (Admin),</Text>
                    <View style={s.sigLine} />
                    <Text style={s.sigName}>( Petugas Dispatcher )</Text>
                </View>

                <View style={s.sigBox}>
                    <Text style={s.sigLabel}>Operator Bertugas,</Text>
                    <View style={s.sigLine} />
                    <Text style={s.sigName}>( {tx.operator?.name || "Operator"} )</Text>
                </View>

                <View style={s.sigBox}>
                    <Text style={s.sigLabel}>Diterima Oleh (Penyewa),</Text>
                    <View style={s.sigLine} />
                    <Text style={s.sigName}>( {tx.customer?.customer_name?.slice(0, 18) || "Customer"} )</Text>
                </View>
            </View>
        </View>
    )
}

export function SewaDocument({ tx }: { tx: SewaDocumentData }) {
    return (
        <Document title={`Surat_Jalan_Sewa_${tx.sewa_number}.pdf`} author="PT. Rajawali Puncak Jayawijaya">
            <Page size="A4" style={s.page}>
                {/* Rangkap 1: Lembar Kantor / Admin */}
                <SewaSingleCopy tx={tx} copyLabel="LEMBAR 1 : ARSIP KANTOR / ADMIN" />

                {/* Garis Potong Tengah */}
                <View style={s.cutContainer}>
                    <View style={s.cutLine} />
                    <Text style={s.cutText}>--- Gunting di sini ---</Text>
                </View>

                {/* Rangkap 2: Lembar Pelanggan / Penyewa */}
                <SewaSingleCopy tx={tx} copyLabel="LEMBAR 2 : PENYEWA / CUSTOMER" />
            </Page>
        </Document>
    )
}
