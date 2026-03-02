import { PerusahaanClient } from "./perusahaan-client"

export default async function PerusahaanPage() {
    const mockData = [
        {
            id: "1",
            name: "PT. RAJAWALI PUNCAK JAYAWIJAYA",
            kode_cabang: "RPJ",
            kota: "Jayapura",
            address: "Jl. Raya Entrop No. 19C ENTROP - JAYAPURA SELATAN",
            email: "ptrajawalipuncakjayawijaya@gmail.com",
            pimpinan_default: "JEFFRY FERDY S.T.",
            logo_url: "/placeholder-logo.png",
            projects: [
                { id: "101", name: "PRESERVASI JALAN YETTI-UBRUB YAMBRA (TOWE HITAM 2025)", kode_proyek: "005" }
            ]
        }
    ];

    return (
        <div className="space-y-6">
            <div className="flex flex-col space-y-1">
                <h1 className="text-3xl font-bold tracking-tight">Perusahaan & Proyek Internal</h1>
                <p className="text-slate-500">Kelola master KOP Surat perusahaan group serta daftar proyek (Tujuan/Lokasi Pemesanan).</p>
            </div>

            <PerusahaanClient initialData={mockData} />
        </div>
    )
}
