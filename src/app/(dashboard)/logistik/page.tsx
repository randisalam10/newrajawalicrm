import { DashboardClient } from "./dashboard-client"

export default function LogistikDashboardPage() {
    return (
        <div className="space-y-4">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Dashboard Logistik & Peralatan</h1>
                <p className="text-muted-foreground text-sm">Pemantauan pengeluaran pembelian barang, status Purchase Order, dan persentase kategori belanja.</p>
            </div>
            <DashboardClient />
        </div>
    )
}
