import { POCreateClient } from "./po-create-client"

export default async function POCreatePage() {
    // Mock Data for the form
    const companies = [
        { id: "1", name: "PT. RAJAWALI PUNCAK JAYAWIJAYA", kode_cabang: "RPJ", pimpinan_default: "JEFFRY FERDY S.T.", kota: "Jayapura" }
    ];

    const projects = [
        { id: "101", companyGroupId: "1", name: "PRESERVASI JALAN YETTI-UBRUB YAMBRA (TOWE HITAM 2025) (005)" }
    ];

    const categories = [
        { id: "1", name: "Sparepart", kode_kategori: "SPR", require_hm_km: true },
        { id: "2", name: "Service Alat dan Kendaraan", kode_kategori: "SAK", require_hm_km: false },
        { id: "3", name: "BBM dan Pelumas", kode_kategori: "BBP", require_hm_km: false },
        { id: "4", name: "Pengadaan Baru", kode_kategori: "PEN", require_hm_km: false },
    ];

    const suppliers = [
        { id: "1", name: "PT Jasindo Trans Papua" }
    ];

    const items = [
        { id: "1", supplierId: "1", kode_barang: "BRG-001", name: "BAN 7.50R16LT 14PR GITI (SET TUBE + FLAP)", merk: "GITI", part_number: "GAZ981", satuan: "PCS", harga: 2250000 }
    ];

    return (
        <div className="space-y-6">
            <div className="flex flex-col space-y-1">
                <h1 className="text-3xl font-bold tracking-tight">Buat Purchase Order Baru</h1>
                <p className="text-slate-500">Pilih perusahaan group penerbit Nota, tentukan toko dan item belanja.</p>
            </div>

            <POCreateClient
                companies={companies}
                projects={projects}
                categories={categories}
                suppliers={suppliers}
                items={items}
            />
        </div>
    )
}
