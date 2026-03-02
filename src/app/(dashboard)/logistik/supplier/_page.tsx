import { SupplierClient } from "./supplier-client"

export default async function SupplierPage() {
    const mockData = [
        { id: "1", name: "PT Jasindo Trans Papua", address: "Jayapura Selatan", contact: "08123456789" },
        { id: "2", name: "Toko Abadi Jaya", address: "Entrop", contact: "08987654321" },
    ];

    return (
        <div className="space-y-6">
            <div className="flex flex-col space-y-1">
                <h1 className="text-3xl font-bold tracking-tight">Master Supplier (Toko)</h1>
                <p className="text-slate-500">Kelola daftar toko penyedia barang untuk PO.</p>
            </div>

            <SupplierClient initialData={mockData} />
        </div>
    )
}
