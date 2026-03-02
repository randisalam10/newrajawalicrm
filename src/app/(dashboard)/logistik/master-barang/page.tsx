import { MasterBarangClient } from "./master-barang-client"

export default async function MasterBarangPage() {
    const mockData = [
        { id: "1", kode_barang: "BRG-001", part_number: "GAZ981", name: "BAN 7.50R16LT 14PR GITI", merk: "GITI", harga: 2250000, satuan: "PCS", supplierId: "1", categoryId: "1" },
        { id: "2", kode_barang: "BRG-002", part_number: "SAK-102", name: "Oli Mesin Meditran SX", merk: "Pertamina", harga: 550000, satuan: "Pail", supplierId: "2", categoryId: "3" },
    ];

    const mockSuppliers = [
        { id: "1", name: "PT Jasindo Trans Papua" },
        { id: "2", name: "Toko Abadi Jaya" },
    ];

    const mockCategories = [
        { id: "1", name: "Sparepart" },
        { id: "3", name: "BBM dan Pelumas" },
    ];

    return (
        <div className="space-y-6">
            <div className="flex flex-col space-y-1">
                <h1 className="text-3xl font-bold tracking-tight">Master Barang Logistik</h1>
                <p className="text-slate-500">Kelola master data barang berdasarkan Toko penyebab dan Kategori.</p>
            </div>

            <MasterBarangClient initialData={mockData} suppliers={mockSuppliers} categories={mockCategories} />
        </div>
    )
}
