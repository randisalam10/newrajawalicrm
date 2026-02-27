import { prisma } from "../../../../lib/prisma"
import { format } from "date-fns"
import { id as idLocale } from "date-fns/locale"
import { notFound } from "next/navigation"
import { PrintActions } from "../PrintActions"

const fmt = (n: number) => "Rp " + n.toLocaleString("id-ID")
const fmtDate = (d: string | Date | null | undefined) => d ? format(new Date(d), "dd MMMM yyyy", { locale: idLocale }) : "-"

export default async function PrintInvoicePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const invoice = await prisma.invoice.findUnique({
        where: { id },
        include: {
            project: { include: { customer: true } },
            items: {
                include: { transaction: { include: { concreteQuality: true, vehicle: true } } },
                orderBy: { transaction: { date: "asc" } }
            },
            payments: { orderBy: { payment_date: "asc" } },
            location: true,
        },
    })
    if (!invoice) notFound()

    // Group items by date
    const byDate = new Map<string, { date: Date; tms: number; volume: number; nilai: number; mutu: string[] }>()
    for (const item of invoice.items) {
        const key = format(new Date(item.transaction.date), "yyyy-MM-dd")
        if (!byDate.has(key)) byDate.set(key, { date: new Date(item.transaction.date), tms: 0, volume: 0, nilai: 0, mutu: [] })
        const d = byDate.get(key)!
        d.tms += 1
        d.volume += item.quantity
        d.nilai += item.subtotal
        const qName = item.transaction.concreteQuality.name
        if (!d.mutu.includes(qName)) d.mutu.push(qName)
    }
    const dateRows = Array.from(byDate.values())

    return (
        <html>
            <head>
                <title>{invoice.invoice_number}</title>
                <style>{`
                    * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Arial', sans-serif; }
                    body { background: white; color: #1a1a1a; font-size: 12px; }
                    .page { max-width: 794px; margin: 0 auto; padding: 40px; }
                    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px; border-bottom: 3px solid #1e3a6e; padding-bottom: 16px; }
                    .company-name { font-size: 22px; font-weight: 700; color: #1e3a6e; }
                    .company-sub { font-size: 11px; color: #555; margin-top: 2px; }
                    .inv-box { text-align: right; }
                    .inv-number { font-size: 18px; font-weight: 700; color: #1e3a6e; font-family: monospace; }
                    .inv-meta { font-size: 11px; color: #777; margin-top: 4px; }
                    .parties { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 24px; }
                    .party-box { background: #f8f9fa; border-radius: 8px; padding: 14px; }
                    .party-label { font-size: 10px; font-weight: 700; color: #888; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 6px; }
                    .party-name { font-weight: 700; font-size: 13px; color: #111; }
                    .party-sub { color: #555; margin-top: 2px; font-size: 11px; }
                    table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
                    th { background: #1e3a6e; color: white; text-align: left; padding: 8px 10px; font-size: 11px; font-weight: 600; }
                    th.right, td.right { text-align: right; }
                    td { padding: 7px 10px; border-bottom: 1px solid #e9ecef; font-size: 11px; }
                    tr:nth-child(even) td { background: #f8f9fa; }
                    .total-row td { background: #eef2ff; font-weight: 700; font-size: 12px; border-top: 2px solid #1e3a6e; }
                    .summary-box { display: flex; justify-content: flex-end; margin-bottom: 24px; }
                    .summary-inner { min-width: 280px; border: 1px solid #e9ecef; border-radius: 8px; overflow: hidden; }
                    .summary-row { display: flex; justify-content: space-between; padding: 7px 14px; font-size: 12px; border-bottom: 1px solid #f0f0f0; }
                    .summary-row:last-child { border-bottom: none; font-weight: 700; font-size: 14px; background: #eef2ff; color: #1e3a6e; }
                    .summary-label { color: #555; }
                    .payment-section { margin-bottom: 24px; }
                    .section-title { font-weight: 700; font-size: 12px; color: #444; margin-bottom: 8px; padding-bottom: 4px; border-bottom: 1px solid #e9ecef; }
                    .sign-row { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; margin-top: 32px; }
                    .sign-box { border-top: 2px solid #1e3a6e; padding-top: 6px; text-align: center; height: 80px; display: flex; flex-direction: column; justify-content: flex-end; font-size: 11px; color: #555; }
                    .status-badge { display: inline-block; padding: 3px 10px; border-radius: 12px; font-size: 10px; font-weight: 700; }
                    .badge-ISSUED { background: #dbeafe; color: #1d4ed8; }
                    .badge-PARTIAL { background: #fef3c7; color: #92400e; }
                    .badge-PAID { background: #d1fae5; color: #065f46; }
                    .badge-CANCELLED { background: #fee2e2; color: #7f1d1d; }
                    @media print {
                        body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
                        .no-print { display: none; }
                    }
                `}</style>
            </head>
            <body>
                <div className="page">
                    {/* Print button */}
                    <PrintActions />

                    {/* Header */}
                    <div className="header">
                        <div>
                            <div className="company-name">PT. Rajawali Mix</div>
                            <div className="company-sub">Batching Plant — {invoice.location.name}</div>
                        </div>
                        <div className="inv-box">
                            <div className="inv-number">{invoice.invoice_number}</div>
                            <div className="inv-meta">
                                <span className={`status-badge badge-${invoice.status}`}>{invoice.status}</span>
                            </div>
                            <div className="inv-meta" style={{ marginTop: 4 }}>Terbit: {fmtDate(invoice.issue_date)}</div>
                            {invoice.due_date && <div className="inv-meta">Jatuh Tempo: {fmtDate(invoice.due_date)}</div>}
                        </div>
                    </div>

                    {/* Parties */}
                    <div className="parties">
                        <div className="party-box">
                            <div className="party-label">Dari</div>
                            <div className="party-name">PT. Rajawali Mix</div>
                            <div className="party-sub">Batching Plant — {invoice.location.name}</div>
                        </div>
                        <div className="party-box">
                            <div className="party-label">Kepada</div>
                            <div className="party-name">{invoice.project.customer.customer_name}</div>
                            <div className="party-sub">{invoice.project.name}</div>
                            <div className="party-sub" style={{ marginTop: 4 }}>{invoice.project.customer.address}</div>
                        </div>
                    </div>

                    {/* Summary by date */}
                    <div className="section-title">Ringkasan per Tanggal Kirim</div>
                    <table>
                        <thead>
                            <tr>
                                <th>Tanggal</th>
                                <th>Mutu</th>
                                <th className="right">Total TM</th>
                                <th className="right">Kubikasi (m³)</th>
                                <th className="right">Nilai</th>
                            </tr>
                        </thead>
                        <tbody>
                            {dateRows.map((row, i) => (
                                <tr key={i}>
                                    <td>{fmtDate(row.date)}</td>
                                    <td>{row.mutu.join(", ")}</td>
                                    <td className="right">{row.tms} TM</td>
                                    <td className="right">{row.volume.toFixed(2)}</td>
                                    <td className="right">{fmt(row.nilai)}</td>
                                </tr>
                            ))}
                            <tr className="total-row">
                                <td colSpan={2}>Total</td>
                                <td className="right">{invoice.items.length} TM</td>
                                <td className="right">{invoice.items.reduce((s: number, i: any) => s + i.quantity, 0).toFixed(2)}</td>
                                <td className="right">{fmt(invoice.subtotal)}</td>
                            </tr>
                        </tbody>
                    </table>

                    {/* Summary box */}
                    <div className="summary-box">
                        <div className="summary-inner">
                            <div className="summary-row"><span className="summary-label">Subtotal</span><span>{fmt(invoice.subtotal)}</span></div>
                            {invoice.include_ppn && <div className="summary-row"><span className="summary-label">PPN</span><span>{fmt(invoice.tax_amount)}</span></div>}
                            <div className="summary-row"><span>Total Tagihan</span><span>{fmt(invoice.total_amount)}</span></div>
                        </div>
                    </div>

                    {/* Payment history */}
                    {invoice.payments.length > 0 && (
                        <div className="payment-section">
                            <div className="section-title">Riwayat Pembayaran</div>
                            <table>
                                <thead><tr>
                                    <th>Tanggal</th>
                                    <th>Metode</th>
                                    <th>Referensi</th>
                                    <th className="right">Jumlah</th>
                                </tr></thead>
                                <tbody>
                                    {invoice.payments.map((p: any) => (
                                        <tr key={p.id}>
                                            <td>{fmtDate(p.payment_date)}</td>
                                            <td>{p.method}</td>
                                            <td>{p.reference_no ?? "-"}</td>
                                            <td className="right">{fmt(p.amount)}</td>
                                        </tr>
                                    ))}
                                    <tr className="total-row">
                                        <td colSpan={3}>Terbayar</td>
                                        <td className="right">{fmt(invoice.paid_amount)}</td>
                                    </tr>
                                    <tr style={{ background: invoice.total_amount - invoice.paid_amount > 0 ? '#fee2e2' : '#d1fae5' }}>
                                        <td colSpan={3} style={{ fontWeight: 700 }}>Sisa</td>
                                        <td className="right" style={{ fontWeight: 700, color: invoice.total_amount - invoice.paid_amount > 0 ? '#7f1d1d' : '#065f46' }}>
                                            {fmt(invoice.total_amount - invoice.paid_amount)}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Notes */}
                    {invoice.notes && (
                        <div style={{ background: '#f8f9fa', borderRadius: 6, padding: '10px 14px', fontSize: 11, color: '#555', marginBottom: 24 }}>
                            <strong>Catatan:</strong> {invoice.notes}
                        </div>
                    )}

                    {/* Signature */}
                    <div className="sign-row">
                        <div className="sign-box">Diterima oleh<br />({invoice.project.customer.customer_name})</div>
                        <div className="sign-box">Hormat kami<br />(PT. Rajawali Mix)</div>
                    </div>
                </div>

                {/* --- Attachment Page for Transactions --- */}
                <div className="page" style={{ pageBreakBefore: 'always' }}>
                    <div className="header" style={{ marginBottom: 16, borderBottom: 'none' }}>
                        <div>
                            <div className="company-name">Lampiran Invoice</div>
                            <div className="company-sub">No. Invoice: {invoice.invoice_number}</div>
                        </div>
                    </div>

                    <table style={{ marginTop: 16 }}>
                        <thead>
                            <tr>
                                <th>No</th>
                                <th>Tanggal</th>
                                <th>No. Surat Jalan</th>
                                <th>No. Polisi</th>
                                <th>Mutu/Item</th>
                                <th className="right">Volume (m³)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {invoice.items.map((item: any, idx: number) => (
                                <tr key={item.id}>
                                    <td>{idx + 1}</td>
                                    <td>{format(new Date(item.transaction.date), 'dd/MM/yyyy')}</td>
                                    <td>{item.transaction.id.substring(0, 8).toUpperCase()}</td>
                                    <td>{item.transaction.vehicle?.plate_number || "-"}</td>
                                    <td>{item.transaction.concreteQuality.name}</td>
                                    <td className="right">{item.quantity.toFixed(2)}</td>
                                </tr>
                            ))}
                            <tr className="total-row">
                                <td colSpan={5}>Total Volume</td>
                                <td className="right">{invoice.items.reduce((s: number, i: any) => s + i.quantity, 0).toFixed(2)}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </body>
        </html>
    )
}
