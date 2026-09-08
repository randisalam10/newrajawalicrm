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
    pic_name?: string | null
    pic_phone?: string | null
    status?: string
    updatedAt?: string | null
    fvp_signature_url?: string | null
    fvp_approved_at?: string | null
    ceo_signature_url?: string | null
    ceo_approved_at?: string | null
    is_bypassed?: boolean
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (n: number) => "Rp " + n.toLocaleString("id-ID")
const fmtDate = (d: Date | string) =>
    format(new Date(d), "dd MMMM yyyy", { locale: idLocale })

// ─── Local styles ─────────────────────────────────────────────────────────────
const s = StyleSheet.create({
    page: {
        paddingTop: 18,
        paddingBottom: 22,
        paddingHorizontal: 22,
        fontSize: 6.5,
        fontFamily: "Helvetica",
        color: COLORS.dark,
        backgroundColor: COLORS.white,
    },
    // ── KOP SURAT ──
    kopRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        borderBottomWidth: 1,
        borderBottomColor: COLORS.primary,
        paddingBottom: 4,
        marginBottom: 5,
    },
    kopLeft: {
        flex: 1,
        flexDirection: "row",
        alignItems: "flex-start",
        gap: 8,
    },
    logo: {
        width: 36,
        height: 36,
        objectFit: "contain",
    },
    companyName: {
        fontSize: 10.5,
        fontFamily: "Helvetica-Bold",
        color: COLORS.primary,
        lineHeight: 1.1,
    },
    companySub: {
        fontSize: 6.5,
        color: COLORS.mid,
        marginTop: 1.5,
        lineHeight: 1.15,
    },
    kopRight: {
        alignItems: "flex-end",
        justifyContent: "flex-start",
    },
    poTitle: {
        fontSize: 11,
        fontFamily: "Helvetica-Bold",
        color: COLORS.primary,
        textTransform: "uppercase",
        letterSpacing: 0.8,
    },
    poNum: {
        fontSize: 7.5,
        fontFamily: "Helvetica-Bold",
        color: COLORS.dark,
        marginTop: 2,
    },
    poDate: {
        fontSize: 6.5,
        color: COLORS.muted,
        marginTop: 1,
    },
    // ── INFO GRID (2 Kolom Terintegrasi) ──
    infoGrid: {
        flexDirection: "row",
        borderWidth: 0.5,
        borderColor: COLORS.border,
        borderRadius: 2.5,
        backgroundColor: "#fcfdfe",
        marginBottom: 4,
        padding: "3 6",
        gap: 10,
    },
    infoCol: {
        flex: 1,
    },
    infoSectionTitle: {
        fontSize: 6.5,
        fontFamily: "Helvetica-Bold",
        color: COLORS.primary,
        textTransform: "uppercase",
        letterSpacing: 0.4,
        marginBottom: 2,
        borderBottomWidth: 0.4,
        borderBottomColor: COLORS.border,
        paddingBottom: 1,
    },
    infoRow: {
        flexDirection: "row",
        marginTop: 1,
    },
    infoLabel: {
        width: 58,
        fontSize: 6.2,
        color: COLORS.muted,
    },
    infoValue: {
        flex: 1,
        fontSize: 6.5,
        color: COLORS.dark,
    },
    infoValueBold: {
        flex: 1,
        fontSize: 6.8,
        fontFamily: "Helvetica-Bold",
        color: COLORS.dark,
    },
    // ── TABEL BARANG (Ultra Compact) ──
    table: {
        width: "100%",
        borderWidth: 0.5,
        borderColor: COLORS.border,
        marginBottom: 4,
    },
    tableHead: {
        flexDirection: "row",
        backgroundColor: COLORS.primary,
        borderBottomWidth: 0.5,
        borderBottomColor: COLORS.primary,
    },
    tableHeadCell: {
        fontSize: 6.2,
        fontFamily: "Helvetica-Bold",
        color: COLORS.white,
        padding: "2.2 3",
        textTransform: "uppercase",
        letterSpacing: 0.3,
    },
    tableRow: {
        flexDirection: "row",
        borderBottomWidth: 0.3,
        borderBottomColor: COLORS.border,
    },
    tableRowAlt: {
        flexDirection: "row",
        borderBottomWidth: 0.3,
        borderBottomColor: COLORS.border,
        backgroundColor: "#f8fafc",
    },
    tableCell: {
        fontSize: 6.2,
        color: COLORS.dark,
        padding: "1.8 3",
        lineHeight: 1.15,
    },
    tableCellBold: {
        fontSize: 6.2,
        fontFamily: "Helvetica-Bold",
        color: COLORS.dark,
        padding: "1.8 3",
        lineHeight: 1.15,
    },
    tableTotalRow: {
        flexDirection: "row",
        backgroundColor: COLORS.primaryLight,
        borderTopWidth: 0.8,
        borderTopColor: COLORS.primary,
    },
    tableTotalCell: {
        fontSize: 6.8,
        fontFamily: "Helvetica-Bold",
        color: COLORS.primary,
        padding: "2 3",
    },
    bypassNote: {
        fontSize: 5.8,
        color: COLORS.muted,
        fontFamily: "Helvetica-Oblique",
        marginTop: 2,
        marginBottom: 2,
    },
    // ── CATATAN ──
    noteBox: {
        backgroundColor: "#f8fafc",
        borderRadius: 2,
        padding: "2.5 5",
        borderWidth: 0.4,
        borderColor: COLORS.border,
        marginBottom: 3,
    },
    noteText: {
        fontSize: 6.2,
        color: COLORS.mid,
        lineHeight: 1.15,
    },
    // ── TANDA TANGAN ──
    signRow: {
        flexDirection: "row",
        marginTop: 6,
        gap: 12,
    },
    signBox: {
        flex: 1,
        alignItems: "center",
    },
    signLabel: {
        fontSize: 6.5,
        color: COLORS.muted,
        marginBottom: 1,
    },
    signArea: {
        height: 28,
        justifyContent: "center",
        alignItems: "center",
        marginVertical: 1,
    },
    signImage: {
        width: 65,
        height: 26,
        objectFit: "contain",
    },
    signLine: {
        width: "75%",
        borderBottomWidth: 0.8,
        borderBottomColor: COLORS.primary,
    },
    signName: {
        fontSize: 7,
        fontFamily: "Helvetica-Bold",
        color: COLORS.dark,
        marginTop: 2,
        textAlign: "center",
    },
    signTitle: {
        fontSize: 6.2,
        fontFamily: "Helvetica",
        color: COLORS.muted,
        marginTop: 1,
        textAlign: "center",
    },
})

// ─── Document ─────────────────────────────────────────────────────────────────
export function PODocument({ po }: { po: POData }) {
    const totalBarang = po.items.reduce((acc, i) => acc + i.harga * i.quantity, 0)

    return (
        <Document title={`PO ${po.po_number}`} author={po.perusahaan_nama}>
            <Page size="A4" style={s.page}>

                {/* ── KOP SURAT ──────────────────────────────────────────────────── */}
                <View style={s.kopRow}>
                    <View style={s.kopLeft}>
                        {po.perusahaan_logo && (
                            <Image
                                src={po.perusahaan_logo}
                                style={s.logo}
                            />
                        )}
                        <View style={{ flex: 1 }}>
                            <Text style={s.companyName}>{po.perusahaan_nama}</Text>
                            {po.perusahaan_alamat && (
                                <Text style={s.companySub}>{po.perusahaan_alamat}</Text>
                            )}
                            {po.perusahaan_telepon && (
                                <Text style={s.companySub}>Email/Telp: {po.perusahaan_telepon}</Text>
                            )}
                        </View>
                    </View>
                    <View style={s.kopRight}>
                        <Text style={s.poTitle}>PURCHASE ORDER</Text>
                        <Text style={s.poNum}>No. PO: {po.po_number}</Text>
                        <Text style={s.poDate}>Tanggal: {fmtDate(po.tanggal_terbit)}</Text>
                    </View>
                </View>

                {/* ── INFO GRID: 2 KOLOM TERINTEGRASI ─────────────────────────────── */}
                <View style={s.infoGrid}>
                    {/* Kolom Kiri: Rekanan / Supplier */}
                    <View style={s.infoCol}>
                        <Text style={s.infoSectionTitle}>Kepada (Supplier / Rekanan)</Text>
                        <View style={s.infoRow}>
                            <Text style={s.infoValueBold}>{po.supplier_nama}</Text>
                        </View>
                        {po.supplier_alamat && (
                            <View style={s.infoRow}>
                                <Text style={s.infoValue}>{po.supplier_alamat}</Text>
                            </View>
                        )}
                        <View style={s.infoRow}>
                            <Text style={s.infoLabel}>Kategori</Text>
                            <Text style={s.infoValue}>: {po.kategori_nama}</Text>
                        </View>
                    </View>

                    {/* Kolom Kanan: Tujuan & Ketentuan */}
                    <View style={s.infoCol}>
                        <Text style={s.infoSectionTitle}>Tujuan & Pengiriman</Text>
                        <View style={s.infoRow}>
                            <Text style={s.infoLabel}>Proyek / Lokasi</Text>
                            <Text style={s.infoValueBold}>: {po.proyek_nama} {po.proyek_kode ? `(${po.proyek_kode})` : ""}</Text>
                        </View>
                        <View style={s.infoRow}>
                            <Text style={s.infoLabel}>Pembayaran</Text>
                            <Text style={s.infoValue}>: {po.metode_pembayaran}</Text>
                        </View>
                        {(po.pic_name || po.pic_phone) && (
                            <View style={s.infoRow}>
                                <Text style={s.infoLabel}>PIC Proyek</Text>
                                <Text style={s.infoValue}>: {[po.pic_name, po.pic_phone].filter(Boolean).join(" - ")}</Text>
                            </View>
                        )}
                    </View>
                </View>

                {/* ── TABEL BARANG (ULTRA COMPACT) ────────────────────────────────── */}
                <View style={s.table}>
                    <View style={s.tableHead} fixed>
                        <Text style={[s.tableHeadCell, { width: 20, textAlign: "center" }]}>No</Text>
                        <Text style={[s.tableHeadCell, { flex: 2.2 }]}>Nama Barang</Text>
                        <Text style={[s.tableHeadCell, { flex: 1.1 }]}>Part / Merk</Text>
                        <Text style={[s.tableHeadCell, { flex: 1.3 }]}>Keterangan</Text>
                        <Text style={[s.tableHeadCell, { width: 28, textAlign: "center" }]}>Qty</Text>
                        <Text style={[s.tableHeadCell, { width: 34, textAlign: "center" }]}>Satuan</Text>
                        <Text style={[s.tableHeadCell, { width: 68, textAlign: "right" }]}>Harga Sat.</Text>
                        <Text style={[s.tableHeadCell, { width: 78, textAlign: "right" }]}>Total</Text>
                    </View>

                    {po.items.map((item, i) => (
                        <View key={item.id} style={i % 2 === 0 ? s.tableRow : s.tableRowAlt}>
                            <Text style={[s.tableCell, { width: 20, textAlign: "center" }]}>{i + 1}</Text>
                            <Text style={[s.tableCellBold, { flex: 2.2 }]}>{item.name}</Text>
                            <Text style={[s.tableCell, { flex: 1.1, color: COLORS.muted }]}>
                                {[item.part_number, item.merk].filter(Boolean).join(" / ") || "-"}
                            </Text>
                            <Text style={[s.tableCell, { flex: 1.3, color: COLORS.mid }]}>
                                {item.keterangan || "-"}
                            </Text>
                            <Text style={[s.tableCell, { width: 28, textAlign: "center" }]}>
                                {item.quantity}
                            </Text>
                            <Text style={[s.tableCell, { width: 34, textAlign: "center" }]}>
                                {item.satuan}
                            </Text>
                            <Text style={[s.tableCell, { width: 68, textAlign: "right" }]}>
                                {fmt(item.harga)}
                            </Text>
                            <Text style={[s.tableCellBold, { width: 78, textAlign: "right" }]}>
                                {fmt(item.harga * item.quantity)}
                            </Text>
                        </View>
                    ))}

                    <View style={s.tableTotalRow} wrap={false}>
                        <Text style={[s.tableTotalCell, { flex: 1, textAlign: "right" }]}>
                            TOTAL HARGA :
                        </Text>
                        <Text style={[s.tableTotalCell, { width: 78, textAlign: "right" }]}>
                            {fmt(totalBarang)}
                        </Text>
                    </View>
                </View>

                {/* ── CATATAN PERSETUJUAN ADMINISTRATIF (JIKA BYPASSED) ──────────── */}
                {po.is_bypassed && (
                    <Text style={s.bypassNote}>
                        * Catatan: Dokumen ini telah disetujui secara administratif{po.updatedAt ? ` pada ${format(new Date(po.updatedAt), "dd MMMM yyyy", { locale: idLocale })}` : ""}.
                    </Text>
                )}

                {/* ── CATATAN ────────────────────────────────────────────────────── */}
                {po.catatan && (
                    <View style={s.noteBox}>
                        <Text style={s.noteText}>
                            <Text style={{ fontFamily: "Helvetica-Bold" }}>Catatan: </Text>
                            {po.catatan}
                        </Text>
                    </View>
                )}

                {/* ── TANDA TANGAN (Wrap false agar tidak terpisah antar halaman) ─── */}
                <View style={s.signRow} wrap={false}>
                    {/* MENYETUJUI (KIRI) - PIMPINAN / CEO */}
                    <View style={s.signBox}>
                        <Text style={s.signLabel}>Menyetujui,</Text>
                        <View style={s.signArea}>
                            {po.ceo_signature_url ? (
                                <Image src={po.ceo_signature_url} style={s.signImage} />
                            ) : null}
                        </View>
                        <View style={s.signLine} />
                        <Text style={s.signName}>{po.pimpinan}</Text>
                        <Text style={s.signTitle}>
                            Pemilik Perusahaan
                        </Text>
                    </View>

                    {/* MENGETAHUI (TENGAH) - FVP / APPROVER */}
                    <View style={s.signBox}>
                        <Text style={s.signLabel}>Mengetahui,</Text>
                        <View style={s.signArea}>
                            {po.fvp_signature_url ? (
                                <Image src={po.fvp_signature_url} style={s.signImage} />
                            ) : null}
                        </View>
                        <View style={s.signLine} />
                        <Text style={s.signName}>{po.kepala_peralatan}</Text>
                        <Text style={s.signTitle}>
                            {po.jabatan_kepala || "Yang Mengajukan"}
                        </Text>
                    </View>

                    {/* DIBUAT OLEH (KANAN) - ADMIN */}
                    <View style={s.signBox}>
                        <Text style={s.signLabel}>Dibuat oleh,</Text>
                        <View style={s.signArea}>
                            {/* Ruang stempel / paraf */}
                        </View>
                        <View style={s.signLine} />
                        <Text style={s.signName}>{po.pembuat}</Text>
                        <Text style={s.signTitle}>
                            Admin
                        </Text>
                    </View>
                </View>

            </Page>
        </Document>
    )
}
