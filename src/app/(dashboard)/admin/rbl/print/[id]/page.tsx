import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { getBudgetDetail } from "../../actions"
import { format } from "date-fns"
import { id as idLocale } from "date-fns/locale"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { PrintButton } from "./print-button"

const fmt = (n: number) => "Rp " + new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 }).format(Math.round(n || 0))
const fmtDate = (d: any) => d ? format(new Date(d), "dd MMMM yyyy", { locale: idLocale }) : "-"
const fmtShortDate = (d: any) => d ? format(new Date(d), "dd/MM/yyyy") : "-"

const MONTH_NAMES = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
]

export default async function RblPrintPage({
    params
}: {
    params: Promise<{ id: string }>
}) {
    const session = await auth()
    if (!session?.user) redirect("/login")

    const { id } = await params
    const budget = await getBudgetDetail(id)

    if (!budget) {
        return (
            <div className="p-8 text-center">
                <h1 className="text-xl font-bold text-rose-600">Laporan RBL Tidak Ditemukan</h1>
                <p className="text-sm text-slate-500 mt-2">Data tidak ditemukan atau Anda tidak memiliki hak akses ke cabang ini.</p>
                <Link href="/admin/rbl" className="inline-block mt-4 text-blue-600 underline text-sm">
                    Kembali ke Modul RBL
                </Link>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-white text-slate-900 p-6 md:p-10 font-sans print:p-0">
            {/* Action Bar (hidden when printed) */}
            <div className="max-w-4xl mx-auto mb-6 flex items-center justify-between print:hidden border-b pb-4">
                <Link
                    href="/admin/rbl"
                    className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Kembali ke Rekap RBL
                </Link>
                <PrintButton />
            </div>

            <div className="max-w-4xl mx-auto border border-slate-200 p-8 rounded-xl shadow-xs print:border-none print:shadow-none print:p-0">
                {/* Header Perusahaan */}
                <div className="border-b-2 border-slate-900 pb-4 flex justify-between items-start">
                    <div>
                        <h1 className="text-xl font-black tracking-tight text-slate-900 uppercase">
                            PT RAJAWALI MIX
                        </h1>
                        <p className="text-xs text-slate-600 mt-0.5">
                            Batching Plant Ready Mix Concrete & Konstruksi
                        </p>
                        <p className="text-xs text-slate-500">
                            Cabang: <span className="font-bold text-slate-900">{budget.location?.name}</span>
                        </p>
                    </div>
                    <div className="text-right">
                        <div className="inline-block px-3 py-1 bg-slate-900 text-white text-xs font-mono font-bold tracking-wider rounded uppercase">
                            REKAP BIAYA OPERASIONAL (RBL)
                        </div>
                        <div className="text-xs font-mono font-bold text-slate-700 mt-2">
                            {budget.code}
                        </div>
                    </div>
                </div>

                {/* Metadata & Status Periode */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 py-4 border-b text-xs">
                    <div>
                        <span className="text-slate-400 block text-[11px]">Bulan & Tahun:</span>
                        <span className="font-bold text-slate-800">
                            {MONTH_NAMES[budget.periodMonth - 1]} {budget.periodYear}
                        </span>
                    </div>
                    <div>
                        <span className="text-slate-400 block text-[11px]">Tanggal Diterima:</span>
                        <span className="font-medium text-slate-800">
                            {fmtDate(budget.receivedDate)}
                        </span>
                    </div>
                    <div>
                        <span className="text-slate-400 block text-[11px]">Tanggal Buka RBL:</span>
                        <span className="font-medium text-slate-800">
                            {fmtDate(budget.createdAt)}
                        </span>
                    </div>
                    <div>
                        <span className="text-slate-400 block text-[11px]">Status & Tgl Tutup:</span>
                        <span className="font-bold uppercase block text-slate-900">
                            {budget.status === "CLOSED" ? "TUTUP BUKU" : "BERJALAN (OPEN)"}
                        </span>
                        {budget.closedAt && (
                            <span className="text-[10px] text-slate-500 font-mono block">
                                {fmtDate(budget.closedAt)}
                            </span>
                        )}
                    </div>
                    <div>
                        <span className="text-slate-400 block text-[11px]">Dicetak Tanggal:</span>
                        <span className="font-medium text-slate-800">
                            {fmtDate(new Date())}
                        </span>
                    </div>
                </div>

                {/* Ringkasan Finansial Anggaran */}
                <div className="grid grid-cols-3 gap-3 my-6 text-xs">
                    <div className="p-3 bg-slate-50 border rounded-lg">
                        <span className="text-slate-500 font-medium block">1. Anggaran Diterima HO</span>
                        <span className="text-base font-bold font-mono text-slate-900 block mt-1">
                            {fmt(budget.amount)}
                        </span>
                    </div>
                    <div className="p-3 bg-slate-50 border rounded-lg">
                        <span className="text-slate-500 font-medium block">2. Total Realisasi Pengeluaran</span>
                        <span className="text-base font-bold font-mono text-blue-700 block mt-1">
                            {fmt(budget.totalExpense)}
                        </span>
                    </div>
                    <div className={`p-3 border rounded-lg ${budget.remainingBalance > 0
                            ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                            : budget.remainingBalance < 0
                                ? "bg-rose-50 text-rose-800 border-rose-200"
                                : "bg-slate-50 text-slate-800"
                        }`}>
                        <span className="font-medium block">
                            3. {budget.remainingBalance >= 0 ? "Sisa Pengembalian ke HO" : "Defisit / Minus (Klaim HO)"}
                        </span>
                        <span className="text-base font-bold font-mono block mt-1">
                            {budget.remainingBalance >= 0 ? "+" : ""}{fmt(budget.remainingBalance)}
                        </span>
                    </div>
                </div>

                {/* Tabel Rincian Pengeluaran */}
                <div className="space-y-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                        Rincian Pengeluaran Operasional Harian
                    </h3>
                    <table className="w-full text-left border-collapse border border-slate-200 text-xs">
                        <thead>
                            <tr className="bg-slate-100 text-slate-700 text-[11px]">
                                <th className="border p-2 w-8 text-center">No</th>
                                <th className="border p-2 w-24">Tanggal</th>
                                <th className="border p-2">Uraian / Nama Item</th>
                                <th className="border p-2 w-32">Kategori</th>
                                <th className="border p-2 w-20 text-center">Qty</th>
                                <th className="border p-2 w-24 text-right">Harga Satuan</th>
                                <th className="border p-2 w-28 text-right">Total</th>
                                <th className="border p-2 w-20">No. Bon</th>
                            </tr>
                        </thead>
                        <tbody>
                            {budget.expenses.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="border p-4 text-center text-slate-400">
                                        Tidak ada catatan pengeluaran pada periode ini.
                                    </td>
                                </tr>
                            ) : (
                                budget.expenses.map((item: any, idx: number) => (
                                    <tr key={item.id} className="border-b hover:bg-slate-50">
                                        <td className="border p-2 text-center text-slate-500">{idx + 1}</td>
                                        <td className="border p-2 font-mono whitespace-nowrap">{fmtShortDate(item.date)}</td>
                                        <td className="border p-2 font-medium text-slate-900">
                                            {item.itemDescription}
                                            {item.notes && <span className="block text-[10px] text-slate-500">{item.notes}</span>}
                                        </td>
                                        <td className="border p-2 text-slate-600">{item.category}</td>
                                        <td className="border p-2 text-center font-mono">{item.quantity} {item.unit}</td>
                                        <td className="border p-2 text-right font-mono text-slate-600">{fmt(item.unitPrice)}</td>
                                        <td className="border p-2 text-right font-mono font-bold text-slate-900">{fmt(item.amount)}</td>
                                        <td className="border p-2 text-slate-500 font-mono text-[10px]">{item.receiptNo || "-"}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                        <tfoot>
                            <tr className="bg-slate-100 font-bold text-xs">
                                <td colSpan={6} className="border p-2 text-right uppercase">Total Realisasi Pengeluaran:</td>
                                <td className="border p-2 text-right font-mono text-blue-700">{fmt(budget.totalExpense)}</td>
                                <td className="border p-2"></td>
                            </tr>
                        </tfoot>
                    </table>
                </div>

                {/* Catatan Penutupan jika Closed */}
                {budget.closeNotes && (
                    <div className="mt-4 p-3 bg-slate-50 border rounded-lg text-xs">
                        <span className="font-bold text-slate-700 block">Berita Acara / Catatan Penutupan:</span>
                        <p className="text-slate-600 mt-1 italic">{budget.closeNotes}</p>
                    </div>
                )}

                {/* Lembar Pengesahan / Tanda Tangan */}
                <div className="grid grid-cols-3 gap-6 mt-12 pt-6 text-center text-xs">

                    <div>
                        <span className="text-slate-500 block mb-14">Disetujui Oleh,</span>
                        <div className="border-t border-slate-400 mx-4 pt-1 font-bold text-slate-800">
                            ( .................................... )
                        </div>
                        <span className="text-[11px] text-slate-400">Finance & Keuangan HO</span>
                    </div>
                    <div>
                        <span className="text-slate-500 block mb-14">Diperiksa Oleh,</span>
                        <div className="border-t border-slate-400 mx-4 pt-1 font-bold text-slate-800">
                            ( .................................... )
                        </div>
                        <span className="text-[11px] text-slate-400">Kepala Batching Plant</span>
                    </div>
                    <div>
                        <span className="text-slate-500 block mb-14">Dibuat Oleh,</span>
                        <div className="border-t border-slate-400 mx-4 pt-1 font-bold text-slate-800">
                            {budget.createdBy?.employee?.name || budget.createdBy?.username || "Admin Cabang"}
                        </div>
                        <span className="text-[11px] text-slate-400">Admin Cabang BP</span>
                    </div>

                </div>
            </div>

        </div>
    )
}
