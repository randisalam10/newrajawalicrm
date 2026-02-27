import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import { format } from "date-fns"
import { id as idLocale } from "date-fns/locale"

export default async function PrintSuratJalanPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const transaction = await prisma.productionTransaction.findUnique({
        where: { id },
        include: {
            customer: true,
            vehicle: true,
            driver: true,
            concreteQuality: true,
            workItem: true,
            location: true,
            createdBy: true,
            retase: true
        }
    })

    if (!transaction) return notFound()

    return (
        <div className="max-w-4xl mx-auto p-4 bg-white text-black bg-white">
            <style dangerouslySetInnerHTML={{
                __html: `
                @media print {
                    @page { margin: 1cm; size: auto; }
                    body { background: white !important; }
                    .no-print { display: none !important; }
                }
                `
            }} />
            {/* Header Surat Jalan */}
            <div className="flex justify-between items-start border-b-2 border-slate-800 pb-4 mb-8">
                <div>
                    <h1 className="text-2xl font-black uppercase tracking-wider">PT. RAJAWALI MIX</h1>
                    <p className="text-sm font-medium mt-1">Cabang: {transaction.location.name}</p>
                    <p className="text-xs text-slate-600">Batching Plant & Beton Cor Readymix</p>
                </div>
                <div className="text-right">
                    <h2 className="text-3xl font-bold uppercase mb-2">Surat Jalan</h2>
                    <p className="text-sm font-mono font-medium">No: {transaction.id.split('-')[0].toUpperCase()}/SJ/{format(transaction.date, "MM/yy")}</p>
                    <p className="text-sm mt-1">Tanggal: {format(transaction.date, "dd MMMM yyyy", { locale: idLocale })}</p>
                </div>
            </div>

            {/* Info Container */}
            <div className="grid grid-cols-2 gap-8 mb-8">
                {/* Penerima / Customer */}
                <div className="p-4 border border-slate-300 rounded-lg">
                    <h3 className="font-bold text-sm uppercase mb-3 border-b pb-1">Data Customer / Proyek</h3>
                    <table className="w-full text-sm">
                        <tbody>
                            <tr>
                                <td className="py-1 text-slate-600 w-24">Customer</td>
                                <td className="py-1 font-semibold">: {transaction.customer.customer_name}</td>
                            </tr>
                            <tr>
                                <td className="py-1 text-slate-600">Proyek</td>
                                <td className="py-1 font-semibold">: {transaction.customer.project_name}</td>
                            </tr>
                            <tr>
                                <td className="py-1 text-slate-600 align-top">Alamat</td>
                                <td className="py-1 font-semibold">: {transaction.customer.address || "-"}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* Info Pengiriman */}
                <div className="p-4 border border-slate-300 rounded-lg">
                    <h3 className="font-bold text-sm uppercase mb-3 border-b pb-1">Detail Pengiriman</h3>
                    <table className="w-full text-sm">
                        <tbody>
                            <tr>
                                <td className="py-1 text-slate-600 w-24">Kendaraan</td>
                                <td className="py-1 font-semibold">: {transaction.vehicle.plate_number} ({transaction.vehicle.code})</td>
                            </tr>
                            <tr>
                                <td className="py-1 text-slate-600">Nama Sopir</td>
                                <td className="py-1 font-semibold">: {transaction.driver.name}</td>
                            </tr>
                            <tr>
                                <td className="py-1 text-slate-600">Ritase (TM) Ke</td>
                                {/* @ts-ignore */}
                                <td className="py-1 font-bold">: TM-{transaction.trip_sequence}</td>
                            </tr>
                            <tr>
                                <td className="py-1 text-slate-600">Waktu Muat</td>
                                <td className="py-1 font-semibold">: {format(transaction.date, "HH:mm")} WIT</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Tabel Muatan */}
            <table className="w-full border-collapse border border-slate-800 mb-8">
                <thead className="bg-slate-100">
                    <tr>
                        <th className="border border-slate-800 p-2 text-left text-sm font-bold uppercase">Mutu Beton</th>
                        <th className="border border-slate-800 p-2 text-left text-sm font-bold uppercase">Item Pekerjaan</th>
                        <th className="border border-slate-800 p-2 text-center text-sm font-bold uppercase">Slump</th>
                        <th className="border border-slate-800 p-2 text-right text-sm font-bold uppercase">Volume (M³)</th>
                        <th className="border border-slate-800 p-2 text-right text-sm font-bold uppercase">Kumulatif (M³)</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td className="border border-slate-800 p-3 text-sm font-semibold">{transaction.concreteQuality.name}</td>
                        <td className="border border-slate-800 p-3 text-sm">{transaction.workItem.name}</td>
                        <td className="border border-slate-800 p-3 text-sm text-center">{transaction.slump}</td>
                        <td className="border border-slate-800 p-3 text-sm font-bold text-right text-lg">{transaction.volume_cubic}</td>
                        {/* @ts-ignore */}
                        <td className="border border-slate-800 p-3 text-sm font-bold text-right text-lg text-slate-600">{transaction.cumulative_volume}</td>
                    </tr>
                </tbody>
            </table>

            <div className="mb-12">
                <p className="text-sm font-medium mb-1">Catatan Tambahan:</p>
                <div className="w-full h-16 border border-slate-300 rounded-md"></div>
            </div>

            {/* Tanda Tangan */}
            <div className="grid grid-cols-3 text-center text-sm">
                <div>
                    <p className="mb-20 font-medium">Penerima Cor / Proyek,</p>
                    <div className="border-b border-slate-800 w-3/4 mx-auto"></div>
                    <p className="mt-1 font-semibold text-xs">( Nama Jelas & TTD )</p>
                </div>
                <div>
                    <p className="mb-20 font-medium">Sopir Mixer,</p>
                    <div className="border-b border-slate-800 w-3/4 mx-auto"></div>
                    <p className="mt-1 font-semibold uppercase text-xs">{transaction.driver.name}</p>
                </div>
                <div>
                    <p className="mb-20 font-medium">Admin / Operator,</p>
                    <div className="border-b border-slate-800 w-3/4 mx-auto"></div>
                    <p className="mt-1 font-semibold uppercase text-xs">{transaction.createdBy.name}</p>
                </div>
            </div>

            {/* Print Trigger via JS on Mount */}
            <script
                dangerouslySetInnerHTML={{
                    __html: `window.print();`
                }}
            />
        </div>
    )
}
