import { getProductionMasters, getRecentProductions } from "./actions"
import { ProduksiClient } from "./produksi-client"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export const dynamic = 'force-dynamic'

export default async function ProduksiPage() {
    const [masters, recent] = await Promise.all([
        getProductionMasters(),
        getRecentProductions()
    ])

    return (
        <div className="space-y-6">
            <div className="flex flex-col space-y-1">
                <h1 className="text-3xl font-bold tracking-tight">Input Produksi</h1>
                <p className="text-slate-500">Mencatat pengiriman beton dan mengirim Notifikasi Surat Jalan ke Telegram.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <ProduksiClient masters={masters} />
                </div>

                <div className="lg:col-span-1">
                    <Card className="h-full">
                        <CardHeader>
                            <CardTitle>Riwayat Transaksi Terbaru</CardTitle>
                            <CardDescription>10 transaksi terakhir.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {recent.length === 0 && (
                                <div className="text-center text-sm text-muted-foreground p-4">Belum ada transaksi produksi.</div>
                            )}
                            {recent.map((tx: any) => (
                                <div key={tx.id} className="border-b last:border-0 pb-4 last:pb-0 space-y-1">
                                    <div className="flex justify-between items-start">
                                        <span className="font-semibold text-sm">{tx.customer.customer_name}</span>
                                        <Badge variant={tx.status === 'Pending' ? 'secondary' : 'default'} className="text-[10px]">
                                            {tx.status}
                                        </Badge>
                                    </div>
                                    <div className="text-xs text-slate-500 flex justify-between">
                                        <span>{tx.concreteQuality.name} | {tx.volume_cubic} m³</span>
                                        <span>{new Date(tx.date).toLocaleDateString()}</span>
                                    </div>
                                    <div className="text-xs text-slate-400">
                                        Sopir: {tx.driver.name} ({tx.vehicle.plate_number})
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
