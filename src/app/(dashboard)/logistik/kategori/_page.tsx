import { KategoriClient } from "./kategori-client"

// This is a mockup page. No database connection yet.
export default async function KategoriPage() {
    const mockData = [
        { id: "1", name: "Sparepart", kode_kategori: "SPR", require_hm_km: true },
        { id: "2", name: "Service Alat dan Kendaraan", kode_kategori: "SAK", require_hm_km: false },
        { id: "3", name: "BBM dan Pelumas", kode_kategori: "BBP", require_hm_km: false },
        { id: "4", name: "Pengadaan Baru", kode_kategori: "PEN", require_hm_km: false },
    ];

    return (
        <div className="space-y-6">
            <div className="flex flex-col space-y-1">
                <h1 className="text-3xl font-bold tracking-tight">Master Kategori PO</h1>
                <p className="text-slate-500">Kelola kategori pengadaan untuk Modul Logistik.</p>
            </div>

            <KategoriClient initialData={mockData} />
        </div>
    )
}
