"use client"
// PDF Template: Invoice
// Data source: Invoice model with full includes

import {
    Document, Page, Text, View, StyleSheet
} from "@react-pdf/renderer"
import { shared, COLORS } from "./pdf-shared"
import { format } from "date-fns"
import { id as idLocale } from "date-fns/locale"

// ─── Types ────────────────────────────────────────────────────────────────────
export type InvoiceData = {
    id: string
    invoice_number: string
    status: string
    invoice_type?: string
    issue_date: Date | string
    due_date?: Date | string | null
    include_ppn: boolean
    subtotal: number
    tax_amount: number
    total_amount: number
    paid_amount: number
    notes?: string | null
    project?: {
        name: string
        customer: { customer_name: string; address: string }
    } | null
    customer?: { customer_name: string; address: string } | null
    location: { name: string }
    items: Array<{
        id: string
        quantity: number
        unit_price: number
        subtotal: number
        item_type?: string
        description?: string | null
        transaction?: {
            id: string
            date: Date | string
            volume_cubic?: number
            trip_sequence?: number
            concreteQuality: { name: string }
            vehicle?: { plate_number: string } | null
        } | null
        sewaTransaction?: {
            id: string
            sewa_number: string
            date: Date | string
            start_date: Date | string
            end_date: Date | string
            total_days: number
            price_per_day: number
            total_price: number
            equipment?: { nama_alat: string; kode_alat: string } | null
            operator?: { name: string } | null
        } | null
    }>
    payments: Array<{
        id: string
        payment_date: Date | string
        amount: number
        method: string
        reference_no?: string | null
        is_cancelled?: boolean
    }>
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (n: number) => "Rp " + Math.round(n).toLocaleString("id-ID")
const fmtDate = (d: Date | string | null | undefined) =>
    d ? format(new Date(d), "dd MMMM yyyy", { locale: idLocale }) : "-"

// ─── Local styles ─────────────────────────────────────────────────────────────
const s = StyleSheet.create({
    badgeISSUED: { fontSize: 7, color: "#1d4ed8", backgroundColor: "#dbeafe", padding: "2 6", borderRadius: 8 },
    badgePARTIAL: { fontSize: 7, color: "#92400e", backgroundColor: "#fef3c7", padding: "2 6", borderRadius: 8 },
    badgePAID: { fontSize: 7, color: "#065f46", backgroundColor: "#d1fae5", padding: "2 6", borderRadius: 8 },
    badgeCANCELLED: { fontSize: 7, color: "#7f1d1d", backgroundColor: "#fee2e2", padding: "2 6", borderRadius: 8 },
    summaryBox: {
        alignSelf: "flex-end",
        marginTop: 4,
        marginBottom: 14,
        minWidth: 200,
        borderWidth: 0.5,
        borderColor: COLORS.border,
        borderRadius: 4,
        overflow: "hidden",
    },
    summaryRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        padding: "5 10",
        borderBottomWidth: 0.5,
        borderBottomColor: COLORS.border,
    },
    summaryRowTotal: {
        flexDirection: "row",
        justifyContent: "space-between",
        padding: "7 10",
        backgroundColor: COLORS.primaryLight,
    },
    summaryLabel: { fontSize: 8, color: COLORS.muted },
    summaryValue: { fontSize: 8, color: COLORS.dark },
    summaryValueBold: { fontSize: 10, fontFamily: "Helvetica-Bold", color: COLORS.primary },
})

// ─── Document ─────────────────────────────────────────────────────────────────
export function InvoiceDocument({ invoice }: { invoice: InvoiceData }) {
    const readyMixItems = invoice.items
        .filter(item => item.item_type !== "SEWA" && item.transaction)
        .sort((a, b) => {
            const tA = a.transaction?.date ? new Date(a.transaction.date).getTime() : 0
            const tB = b.transaction?.date ? new Date(b.transaction.date).getTime() : 0
            if (tA !== tB) return tA - tB
            return (a.transaction?.trip_sequence ?? 0) - (b.transaction?.trip_sequence ?? 0)
        })
    const sewaItems = invoice.items
        .filter(item => item.item_type === "SEWA" || item.sewaTransaction)
        .sort((a, b) => {
            const tA = a.sewaTransaction?.start_date
                ? new Date(a.sewaTransaction.start_date).getTime()
                : (a.sewaTransaction?.date ? new Date(a.sewaTransaction.date).getTime() : 0)
            const tB = b.sewaTransaction?.start_date
                ? new Date(b.sewaTransaction.start_date).getTime()
                : (b.sewaTransaction?.date ? new Date(b.sewaTransaction.date).getTime() : 0)
            return tA - tB
        })

    // Group readyMix items by date
    const byDate = new Map<string, { date: Date; tms: number; volume: number; nilai: number; mutu: string[] }>()
    for (const item of readyMixItems) {
        if (!item.transaction) continue
        const key = format(new Date(item.transaction.date), "yyyy-MM-dd")
        if (!byDate.has(key)) byDate.set(key, { date: new Date(item.transaction.date), tms: 0, volume: 0, nilai: 0, mutu: [] })
        const d = byDate.get(key)!
        d.tms += 1
        d.volume += item.quantity
        d.nilai += item.subtotal
        const qName = item.transaction.concreteQuality?.name ?? "-"
        if (!d.mutu.includes(qName)) d.mutu.push(qName)
    }
    const dateRows = Array.from(byDate.values()).sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    )
    const activePayments = invoice.payments.filter(p => !p.is_cancelled)
    const totalVolume = readyMixItems.reduce((s, i) => s + i.quantity, 0)

    const custName = invoice.customer?.customer_name || invoice.project?.customer?.customer_name || "Pelanggan"
    const custAddress = invoice.customer?.address || invoice.project?.customer?.address || "-"
    const projName = invoice.project?.name || "Penyewaan Alat & Kendaraan"

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const badgeStyle: Record<string, any> = {
        ISSUED: s.badgeISSUED, PARTIAL: s.badgePARTIAL,
        PAID: s.badgePAID, CANCELLED: s.badgeCANCELLED,
    }

    return (
        <Document title={invoice.invoice_number} author="PT. Rajawali Puncak Jayawijaya">

            {/* ═══════════ HALAMAN 1: INVOICE UTAMA ═══════════ */}
            <Page size="A4" style={shared.page}>

                {/* ── HEADER ─────────────────────────────────────────────────────── */}
                <View style={shared.headerRow}>
                    <View>
                        <Text style={shared.companyName}>PT. RAJAWALI PUNCAK JAYAWIJAYA</Text>
                        <Text style={shared.companySub}>Batching Plant & Penyewaan Alat Berat — Cabang {invoice.location?.name || "Pusat"}</Text>
                    </View>
                    <View style={shared.docTitleBox}>
                        <Text style={shared.docTitle}>Invoice</Text>
                        <Text style={shared.docNumber}>{invoice.invoice_number}</Text>
                        <View style={{ flexDirection: "row", justifyContent: "flex-end", marginTop: 3, gap: 6 }}>
                            <Text style={badgeStyle[invoice.status] ?? s.badgeISSUED}>{invoice.status}</Text>
                        </View>
                        <Text style={shared.docMeta}>Terbit: {fmtDate(invoice.issue_date)}</Text>
                        {invoice.due_date && (
                            <Text style={shared.docMeta}>Jatuh Tempo: {fmtDate(invoice.due_date)}</Text>
                        )}
                    </View>
                </View>

                {/* ── PARTIES ────────────────────────────────────────────────────── */}
                <View style={shared.infoGrid}>
                    <View style={shared.infoBox}>
                        <Text style={shared.infoLabel}>Dari</Text>
                        <Text style={shared.infoValue}>PT. Rajawali Puncak Jayawijaya</Text>
                        <Text style={shared.infoSub}>Cabang {invoice.location?.name || "Pusat"}</Text>
                    </View>
                    <View style={shared.infoBox}>
                        <Text style={shared.infoLabel}>Kepada</Text>
                        <Text style={shared.infoValue}>{custName}</Text>
                        <Text style={shared.infoSub}>{projName}</Text>
                        <Text style={shared.infoSub}>{custAddress}</Text>
                    </View>
                </View>

                {/* ── TABEL SEWA ALAT (JIKA ADA) ─────────────────────────────────── */}
                {sewaItems.length > 0 && (
                    <View style={{ marginBottom: 12 }}>
                        <Text style={shared.sectionTitle}>Rincian Sewa Alat & Kendaraan</Text>
                        <View style={shared.table}>
                            <View style={shared.tableHead}>
                                <Text style={[shared.tableHeadCell, { flex: 1.2 }]}>No. DO Sewa</Text>
                                <Text style={[shared.tableHeadCell, { flex: 1.8 }]}>Unit Alat & Operator</Text>
                                <Text style={[shared.tableHeadCell, { flex: 0.8, textAlign: "right" }]}>Durasi</Text>
                                <Text style={[shared.tableHeadCell, { flex: 1.1, textAlign: "right" }]}>Tarif / Hari</Text>
                                <Text style={[shared.tableHeadCell, { flex: 1.2, textAlign: "right" }]}>Total</Text>
                            </View>
                            {sewaItems.map((item, i) => {
                                const sw = item.sewaTransaction
                                const alatName = sw?.equipment ? `${sw.equipment.nama_alat} (${sw.equipment.kode_alat})` : (item.description || "Sewa Alat")
                                const opName = sw?.operator?.name ? ` • Op: ${sw.operator.name}` : ""
                                return (
                                    <View key={item.id} style={i % 2 === 0 ? shared.tableRow : shared.tableRowAlt}>
                                        <Text style={[shared.tableCell, { flex: 1.2, fontFamily: "Helvetica-Bold", color: "#1d4ed8" }]}>{sw?.sewa_number || "-"}</Text>
                                        <Text style={[shared.tableCell, { flex: 1.8 }]}>{alatName}{opName}</Text>
                                        <Text style={[shared.tableCell, { flex: 0.8, textAlign: "right" }]}>{item.quantity} Hari</Text>
                                        <Text style={[shared.tableCell, { flex: 1.1, textAlign: "right" }]}>{fmt(item.unit_price)}</Text>
                                        <Text style={[shared.tableCell, { flex: 1.2, textAlign: "right", fontFamily: "Helvetica-Bold" }]}>{fmt(item.subtotal)}</Text>
                                    </View>
                                )
                            })}
                            <View style={shared.tableTotalRow}>
                                <Text style={[shared.tableTotalCell, { flex: 1.2 }]}>Total Sewa</Text>
                                <Text style={[shared.tableTotalCell, { flex: 1.8 }]}>{sewaItems.length} Transaksi DO</Text>
                                <Text style={[shared.tableTotalCell, { flex: 0.8, textAlign: "right" }]}>{sewaItems.reduce((s, i) => s + i.quantity, 0)} Hari</Text>
                                <Text style={[shared.tableTotalCell, { flex: 1.1, textAlign: "right" }]}> </Text>
                                <Text style={[shared.tableTotalCell, { flex: 1.2, textAlign: "right" }]}>{fmt(sewaItems.reduce((s, i) => s + i.subtotal, 0))}</Text>
                            </View>
                        </View>
                    </View>
                )}

                {/* ── TABEL READYMIX (JIKA ADA) ───────────────────────────────────── */}
                {readyMixItems.length > 0 && (
                    <View style={{ marginBottom: 12 }}>
                        <Text style={shared.sectionTitle}>Ringkasan per Tanggal Kirim (ReadyMix)</Text>
                        <View style={shared.table}>
                            <View style={shared.tableHead}>
                                <Text style={[shared.tableHeadCell, { flex: 1.4 }]}>Tanggal</Text>
                                <Text style={[shared.tableHeadCell, { flex: 1.2 }]}>Mutu</Text>
                                <Text style={[shared.tableHeadCell, { flex: 0.7, textAlign: "right" }]}>Total TM</Text>
                                <Text style={[shared.tableHeadCell, { flex: 0.9, textAlign: "right" }]}>Kubikasi (m³)</Text>
                                <Text style={[shared.tableHeadCell, { flex: 1.2, textAlign: "right" }]}>Nilai</Text>
                            </View>
                            {dateRows.map((row, i) => (
                                <View key={i} style={i % 2 === 0 ? shared.tableRow : shared.tableRowAlt}>
                                    <Text style={[shared.tableCell, { flex: 1.4 }]}>{fmtDate(row.date)}</Text>
                                    <Text style={[shared.tableCell, { flex: 1.2 }]}>{row.mutu.join(", ")}</Text>
                                    <Text style={[shared.tableCell, { flex: 0.7, textAlign: "right" }]}>{row.tms} TM</Text>
                                    <Text style={[shared.tableCell, { flex: 0.9, textAlign: "right" }]}>{row.volume.toFixed(2)}</Text>
                                    <Text style={[shared.tableCell, { flex: 1.2, textAlign: "right" }]}>{fmt(row.nilai)}</Text>
                                </View>
                            ))}
                            <View style={shared.tableTotalRow}>
                                <Text style={[shared.tableTotalCell, { flex: 1.4 }]}>Total</Text>
                                <Text style={[shared.tableTotalCell, { flex: 1.2 }]}> </Text>
                                <Text style={[shared.tableTotalCell, { flex: 0.7, textAlign: "right" }]}>{readyMixItems.length} TM</Text>
                                <Text style={[shared.tableTotalCell, { flex: 0.9, textAlign: "right" }]}>{totalVolume.toFixed(2)}</Text>
                                <Text style={[shared.tableTotalCell, { flex: 1.2, textAlign: "right" }]}>{fmt(readyMixItems.reduce((s, i) => s + i.subtotal, 0))}</Text>
                            </View>
                        </View>
                    </View>
                )}

                {/* ── SUMMARY BOX ────────────────────────────────────────────────── */}
                <View style={s.summaryBox}>
                    <View style={s.summaryRow}>
                        <Text style={s.summaryLabel}>Subtotal</Text>
                        <Text style={s.summaryValue}>{fmt(invoice.subtotal)}</Text>
                    </View>
                    {invoice.include_ppn && invoice.tax_amount > 0 && (
                        <View style={s.summaryRow}>
                            <Text style={s.summaryLabel}>PPN (11%)</Text>
                            <Text style={s.summaryValue}>{fmt(invoice.tax_amount)}</Text>
                        </View>
                    )}
                    {invoice.paid_amount > 0 && (
                        <View style={s.summaryRow}>
                            <Text style={s.summaryLabel}>Sudah Dibayar</Text>
                            <Text style={s.summaryValue}>- {fmt(invoice.paid_amount)}</Text>
                        </View>
                    )}
                    <View style={s.summaryRowTotal}>
                        <Text style={s.summaryLabel}>Total Tagihan</Text>
                        <Text style={s.summaryValueBold}>{fmt(invoice.total_amount)}</Text>
                    </View>
                </View>

                {/* ── RIWAYAT PEMBAYARAN ─────────────────────────────────────────── */}
                {activePayments.length > 0 && (
                    <>
                        <Text style={shared.sectionTitle}>Riwayat Pembayaran</Text>
                        <View style={shared.table}>
                            <View style={shared.tableHead}>
                                <Text style={[shared.tableHeadCell, { flex: 1.4 }]}>Tanggal</Text>
                                <Text style={[shared.tableHeadCell, { flex: 0.9 }]}>Metode</Text>
                                <Text style={[shared.tableHeadCell, { flex: 1.2 }]}>Referensi</Text>
                                <Text style={[shared.tableHeadCell, { flex: 1, textAlign: "right" }]}>Jumlah</Text>
                            </View>
                            {activePayments.map((p, i) => (
                                <View key={p.id} style={i % 2 === 0 ? shared.tableRow : shared.tableRowAlt}>
                                    <Text style={[shared.tableCell, { flex: 1.4 }]}>{fmtDate(p.payment_date)}</Text>
                                    <Text style={[shared.tableCell, { flex: 0.9 }]}>{p.method}</Text>
                                    <Text style={[shared.tableCell, { flex: 1.2 }]}>{p.reference_no ?? "-"}</Text>
                                    <Text style={[shared.tableCell, { flex: 1, textAlign: "right" }]}>{fmt(p.amount)}</Text>
                                </View>
                            ))}
                        </View>
                    </>
                )}

                {/* ── CATATAN ────────────────────────────────────────────────────── */}
                {invoice.notes && (
                    <View style={{ backgroundColor: COLORS.bg, borderRadius: 4, padding: 8, marginBottom: 10 }}>
                        <Text style={{ fontSize: 8, color: COLORS.muted }}>Catatan: {invoice.notes}</Text>
                    </View>
                )}

                {/* ── TANDA TANGAN ───────────────────────────────────────────────── */}
                <View style={shared.signRow}>
                    <View style={shared.signBox}>
                        <Text style={shared.signLabel}>Diterima oleh,</Text>
                        <View style={shared.signLine} />
                        <Text style={shared.signName}>( {custName} )</Text>
                    </View>
                    <View style={shared.signBox}>
                        <Text style={shared.signLabel}>Hormat kami,</Text>
                        <View style={shared.signLine} />
                        <Text style={shared.signName}>( PT. Rajawali Puncak Jayawijaya )</Text>
                    </View>
                </View>

                <Text style={shared.pageNumber} render={({ pageNumber, totalPages }) =>
                    `Halaman ${pageNumber} dari ${totalPages}`
                } fixed />

            </Page>

            {/* ═══════════ HALAMAN 2: LAMPIRAN TRANSAKSI READYMIX ═══════════ */}
            {readyMixItems.length > 0 && (
                <Page size="A4" style={shared.page}>
                    <View style={shared.headerRow}>
                        <View>
                            <Text style={shared.companyName}>Lampiran Invoice</Text>
                            <Text style={shared.companySub}>No. Invoice: {invoice.invoice_number}</Text>
                        </View>
                        <View style={shared.docTitleBox}>
                            <Text style={shared.docMeta}>Kepada: {custName}</Text>
                            <Text style={shared.docMeta}>Proyek: {projName}</Text>
                        </View>
                    </View>

                    <Text style={shared.sectionTitle}>Daftar Surat Jalan / Transaksi</Text>
                    <View style={shared.table}>
                        <View style={shared.tableHead}>
                            <Text style={[shared.tableHeadCell, { flex: 0.4 }]}>No</Text>
                            <Text style={[shared.tableHeadCell, { flex: 1 }]}>Tanggal</Text>
                            <Text style={[shared.tableHeadCell, { flex: 1.2 }]}>No. SJ</Text>
                            <Text style={[shared.tableHeadCell, { flex: 1 }]}>No. Polisi</Text>
                            <Text style={[shared.tableHeadCell, { flex: 0.9 }]}>Mutu</Text>
                            <Text style={[shared.tableHeadCell, { flex: 0.8, textAlign: "right" }]}>Volume (m³)</Text>
                            <Text style={[shared.tableHeadCell, { flex: 0.9, textAlign: "right" }]}>Subtotal</Text>
                        </View>
                        {readyMixItems.map((item, idx) => (
                            <View key={item.id} style={idx % 2 === 0 ? shared.tableRow : shared.tableRowAlt}>
                                <Text style={[shared.tableCell, { flex: 0.4 }]}>{idx + 1}</Text>
                                <Text style={[shared.tableCell, { flex: 1 }]}>
                                    {item.transaction?.date ? format(new Date(item.transaction.date), "dd/MM/yyyy") : "-"}
                                </Text>
                                <Text style={[shared.tableCell, { flex: 1.2 }]}>
                                    {item.transaction?.id?.substring(0, 8).toUpperCase() ?? "-"}
                                </Text>
                                <Text style={[shared.tableCell, { flex: 1 }]}>
                                    {item.transaction?.vehicle?.plate_number ?? "-"}
                                </Text>
                                <Text style={[shared.tableCell, { flex: 0.9 }]}>
                                    {item.transaction?.concreteQuality?.name ?? "-"}
                                </Text>
                                <Text style={[shared.tableCell, { flex: 0.8, textAlign: "right" }]}>
                                    {item.quantity.toFixed(2)}
                                </Text>
                                <Text style={[shared.tableCell, { flex: 0.9, textAlign: "right" }]}>
                                    {fmt(item.subtotal)}
                                </Text>
                            </View>
                        ))}
                        <View style={shared.tableTotalRow}>
                            <Text style={[shared.tableTotalCell, { flex: 0.4 }]}> </Text>
                            <Text style={[shared.tableTotalCell, { flex: 1 }]}> </Text>
                            <Text style={[shared.tableTotalCell, { flex: 1.2 }]}> </Text>
                            <Text style={[shared.tableTotalCell, { flex: 1 }]}> </Text>
                            <Text style={[shared.tableTotalCell, { flex: 0.9 }]}>Total</Text>
                            <Text style={[shared.tableTotalCell, { flex: 0.8, textAlign: "right" }]}>
                                {totalVolume.toFixed(2)}
                            </Text>
                            <Text style={[shared.tableTotalCell, { flex: 0.9, textAlign: "right" }]}>
                                {fmt(readyMixItems.reduce((s, i) => s + i.subtotal, 0))}
                            </Text>
                        </View>
                    </View>

                    <Text style={shared.pageNumber} render={({ pageNumber, totalPages }) =>
                        `Halaman ${pageNumber} dari ${totalPages}`
                    } fixed />
                </Page>
            )}
        </Document>
    )
}
