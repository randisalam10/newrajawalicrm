"use client"
// PDF Template: Purchase Order
// Data source: PO data (currently mock — will be connected to DB when PO model is implemented)

import {
    Document, Page, Text, View, StyleSheet, Image
} from "@react-pdf/renderer"
import { shared, COLORS } from "./pdf-shared"
import { format } from "date-fns"
import { id as idLocale } from "date-fns/locale"

// ─── Types ────────────────────────────────────────────────────────────────────
export type POItem = {
    id: string
    name: string
    part_number?: string | null
    merk?: string | null
    quantity: number
    satuan: string
    harga: number
    keterangan?: string | null
}

export type POData = {
    po_number: string
    tanggal_terbit: Date | string
    // Perusahaan penerbit
    perusahaan_nama: string
    perusahaan_alamat?: string
    perusahaan_telepon?: string
    perusahaan_logo?: string  // URL absolut logo
    // Tujuan
    proyek_nama: string
    proyek_kode?: string
    // Supplier
    supplier_nama: string
    supplier_alamat?: string
    // Kategori
    kategori_nama: string
    // Pembayaran
    metode_pembayaran: string
    // Items
    items: POItem[]
    // Penandatangan
    pimpinan: string
    kepala_peralatan: string
    jabatan_kepala?: string  // Label jabatan dinamis
    pembuat: string
    // Optional
    catatan?: string | null
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (n: number) => "Rp " + n.toLocaleString("id-ID")
const fmtDate = (d: Date | string) =>
    format(new Date(d), "dd MMMM yyyy", { locale: idLocale })

// ─── Local styles ─────────────────────────────────────────────────────────────
const s = StyleSheet.create({
    kopRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        borderBottomWidth: 2.5,
        borderBottomColor: COLORS.primary,
        paddingBottom: 10,
        marginBottom: 14,
    },
    kopLeft: {
        flex: 1,
    },
    kopRight: {
        alignItems: "flex-end",
        justifyContent: "flex-end",
    },
    poTitle: {
        fontSize: 20,
        fontFamily: "Helvetica-Bold",
        color: COLORS.primary,
        textTransform: "uppercase",
    },
    poNum: {
        fontSize: 9,
        fontFamily: "Helvetica",
        color: COLORS.muted,
        marginTop: 2,
    },
    poDate: {
        fontSize: 8,
        color: COLORS.muted,
        marginTop: 3,
    },
    addressGrid: {
        flexDirection: "row",
        gap: 16,
        marginBottom: 14,
    },
    addressBox: {
        flex: 1,
    },
    addressTitle: {
        fontSize: 7,
        fontFamily: "Helvetica-Bold",
        color: COLORS.muted,
        textTransform: "uppercase",
        letterSpacing: 0.5,
        marginBottom: 4,
        borderBottomWidth: 0.5,
        borderBottomColor: COLORS.border,
        paddingBottom: 3,
    },
    addressLine: {
        fontSize: 8,
        color: COLORS.dark,
        marginTop: 2,
    },
    addressBold: {
        fontSize: 9,
        fontFamily: "Helvetica-Bold",
        color: COLORS.dark,
    },
    metaBadge: {
        fontSize: 7,
        backgroundColor: COLORS.primaryLight,
        color: COLORS.primary,
        padding: "2 7",
        borderRadius: 3,
        marginRight: 6,
        marginBottom: 4,
    },
    metaRow: {
        flexDirection: "row",
        flexWrap: "wrap",
        marginBottom: 12,
    },
    totalBox: {
        alignSelf: "flex-end",
        marginTop: 4,
        marginBottom: 14,
        minWidth: 220,
        borderWidth: 0.5,
        borderColor: COLORS.border,
        borderRadius: 4,
    },
    totalRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        padding: "5 10",
        borderBottomWidth: 0.5,
        borderBottomColor: COLORS.border,
    },
    totalRowFinal: {
        flexDirection: "row",
        justifyContent: "space-between",
        padding: "7 10",
        backgroundColor: COLORS.primaryLight,
    },
    totalLabel: { fontSize: 8, color: COLORS.muted },
    totalValue: { fontSize: 8, color: COLORS.dark },
    totalValueBold: {
        fontSize: 11,
        fontFamily: "Helvetica-Bold",
        color: COLORS.primary,
    },
    noteBox: {
        backgroundColor: COLORS.bg,
        borderRadius: 4,
        padding: 8,
        marginBottom: 12,
        borderWidth: 0.5,
        borderColor: COLORS.border,
    },
    noteText: { fontSize: 8, color: COLORS.mid },
})

// ─── Document ─────────────────────────────────────────────────────────────────
export function PODocument({ po }: { po: POData }) {
    const totalBarang = po.items.reduce((acc, i) => acc + i.harga * i.quantity, 0)

    return (
        <Document title={`PO ${po.po_number}`} author={po.perusahaan_nama}>
            <Page size="A4" style={shared.page}>

                {/* ── KOP SURAT ──────────────────────────────────────────────────── */}
                <View style={s.kopRow}>
                    <View style={[s.kopLeft, { flexDirection: "row", alignItems: "flex-start", gap: 10 }]}>
                        {po.perusahaan_logo && (
                            <Image
                                src={po.perusahaan_logo}
                                style={{ width: 56, height: 56, objectFit: "contain" }}
                            />
                        )}
                        <View style={{ flex: 1 }}>
                            <Text style={[shared.companyName, { fontSize: 13, lineHeight: 1 }]}>{po.perusahaan_nama}</Text>
                            {po.perusahaan_alamat && (
                                <Text style={shared.companySub}>{po.perusahaan_alamat}</Text>
                            )}
                            {po.perusahaan_telepon && (
                                <Text style={shared.companySub}>Telp: {po.perusahaan_telepon}</Text>
                            )}
                        </View>
                    </View>
                    <View style={s.kopRight}>
                        <Text style={s.poTitle}>Purchase Order</Text>
                        <Text style={s.poNum}>No. PO: {po.po_number}</Text>
                        <Text style={s.poDate}>Tanggal: {fmtDate(po.tanggal_terbit)}</Text>
                    </View>
                </View>

                {/* ── META BADGES ────────────────────────────────────────────────── */}
                <View style={s.metaRow}>
                    <Text style={s.metaBadge}>Kategori: {po.kategori_nama}</Text>
                    <Text style={s.metaBadge}>Pembayaran: {po.metode_pembayaran}</Text>
                    {po.proyek_kode && <Text style={s.metaBadge}>Kode Proyek: {po.proyek_kode}</Text>}
                </View>

                {/* ── ADDRESS GRID ───────────────────────────────────────────────── */}
                <View style={s.addressGrid}>
                    <View style={s.addressBox}>
                        <Text style={s.addressTitle}>Kepada (Supplier / Toko)</Text>
                        <Text style={s.addressBold}>{po.supplier_nama}</Text>
                        {po.supplier_alamat && (
                            <Text style={s.addressLine}>{po.supplier_alamat}</Text>
                        )}
                    </View>
                    <View style={s.addressBox}>
                        <Text style={s.addressTitle}>Tujuan / Lokasi Pengiriman</Text>
                        <Text style={s.addressBold}>{po.proyek_nama}</Text>
                    </View>
                </View>

                {/* ── TABEL BARANG ───────────────────────────────────────────────── */}
                <Text style={shared.sectionTitle}>Rincian Barang Pesanan</Text>
                <View style={shared.table}>
                    <View style={shared.tableHead}>
                        <Text style={[shared.tableHeadCell, { flex: 0.4 }]}>No</Text>
                        <Text style={[shared.tableHeadCell, { flex: 2 }]}>Nama Barang</Text>
                        <Text style={[shared.tableHeadCell, { flex: 1.2 }]}>Part / Merk</Text>
                        <Text style={[shared.tableHeadCell, { flex: 1.6 }]}>Keterangan</Text>
                        <Text style={[shared.tableHeadCell, { flex: 0.5, textAlign: "center" }]}>Qty</Text>
                        <Text style={[shared.tableHeadCell, { flex: 0.6, textAlign: "center" }]}>Satuan</Text>
                        <Text style={[shared.tableHeadCell, { flex: 1, textAlign: "right" }]}>Harga Sat.</Text>
                        <Text style={[shared.tableHeadCell, { flex: 1.1, textAlign: "right" }]}>Total</Text>
                    </View>

                    {po.items.map((item, i) => (
                        <View key={item.id} style={i % 2 === 0 ? shared.tableRow : shared.tableRowAlt}>
                            <Text style={[shared.tableCell, { flex: 0.4 }]}>{i + 1}</Text>
                            <Text style={[shared.tableCellBold, { flex: 2 }]}>{item.name}</Text>
                            <Text style={[shared.tableCell, { flex: 1.2, color: COLORS.muted }]}>
                                {[item.part_number, item.merk].filter(Boolean).join(" / ") || "-"}
                            </Text>
                            <Text style={[shared.tableCell, { flex: 1.6, color: COLORS.mid }]}>
                                {item.keterangan || "-"}
                            </Text>
                            <Text style={[shared.tableCell, { flex: 0.5, textAlign: "center" }]}>
                                {item.quantity}
                            </Text>
                            <Text style={[shared.tableCell, { flex: 0.6, textAlign: "center" }]}>
                                {item.satuan}
                            </Text>
                            <Text style={[shared.tableCell, { flex: 1, textAlign: "right" }]}>
                                {fmt(item.harga)}
                            </Text>
                            <Text style={[shared.tableCellBold, { flex: 1.1, textAlign: "right" }]}>
                                {fmt(item.harga * item.quantity)}
                            </Text>
                        </View>
                    ))}

                    <View style={shared.tableTotalRow}>
                        <Text style={[shared.tableTotalCell, { flex: 0.4 + 2 + 1.2 + 1.6 + 0.5 + 0.6 + 1, textAlign: "right" }]}>
                            TOTAL HARGA
                        </Text>
                        <Text style={[shared.tableTotalCell, { flex: 1.1, textAlign: "right" }]}>
                            {fmt(totalBarang)}
                        </Text>
                    </View>
                </View>

                {/* ── CATATAN ────────────────────────────────────────────────────── */}
                {po.catatan && (
                    <View style={s.noteBox}>
                        <Text style={s.noteText}>Catatan: {po.catatan}</Text>
                    </View>
                )}

                {/* ── TANDA TANGAN ───────────────────────────────────────────────── */}
                <View style={shared.signRow}>
                    <View style={shared.signBox}>
                        <Text style={shared.signLabel}>Menyetujui,</Text>
                        <View style={shared.signLine} />
                        <Text style={shared.signName}>{po.pimpinan}</Text>
                        <Text style={[shared.signName, { fontFamily: "Helvetica", color: COLORS.muted }]}>
                            Pimpinan Perusahaan
                        </Text>
                    </View>
                    <View style={shared.signBox}>
                        <Text style={shared.signLabel}>Mengajukan,</Text>
                        <View style={shared.signLine} />
                        <Text style={shared.signName}>{po.kepala_peralatan}</Text>
                        <Text style={[shared.signName, { fontFamily: "Helvetica", color: COLORS.muted }]}>
                            {po.jabatan_kepala || "Kepala Peralatan"}
                        </Text>
                    </View>
                    <View style={shared.signBox}>
                        <Text style={shared.signLabel}>Dibuat oleh,</Text>
                        <View style={shared.signLine} />
                        <Text style={shared.signName}>{po.pembuat}</Text>
                        <Text style={[shared.signName, { fontFamily: "Helvetica", color: COLORS.muted }]}>
                            Admin
                        </Text>
                    </View>
                </View>

                <Text style={shared.pageNumber} render={({ pageNumber, totalPages }) =>
                    `Halaman ${pageNumber} dari ${totalPages}`
                } fixed />

            </Page>
        </Document>
    )
}
