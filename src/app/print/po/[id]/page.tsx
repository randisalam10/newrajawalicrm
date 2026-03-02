// Print page: Purchase Order (Demo)
// Route: /print/po/[id]
// Currently uses mock data. Will connect to DB when PO model is implemented.

import { POPrintClient } from "./client"

// ─── Mock data untuk demo ─────────────────────────────────────────────────────
const MOCK_PO = {
    po_number: "PO/RJW-KM/2026/001",
    tanggal_terbit: new Date().toISOString(),
    perusahaan_nama: "PT. RAJAWALI MIX",
    perusahaan_alamat: "Jl. Perintis Kemerdekaan, Kecamatan Kairatu, Kabupaten SBB",
    perusahaan_telepon: "0813-xxxx-xxxx",
    proyek_nama: "Workshop Batching Plant Kairatu",
    proyek_kode: "RJW-KM-2026",
    supplier_nama: "CV. Berkah Jaya Motor",
    supplier_alamat: "Jl. Pattimura No. 12, Ambon",
    kategori_nama: "Suku Cadang & Peralatan (SPR)",
    metode_pembayaran: "CREDIT",
    items: [
        {
            id: "1",
            name: "Filter Solar Komatsu",
            part_number: "600-311-3820",
            merk: "Komatsu",
            quantity: 2,
            satuan: "PCS",
            harga: 350000,
            keterangan: "Untuk DT 8258 RI",
        },
        {
            id: "2",
            name: "Oli Mesin Mesran SAE 50",
            part_number: null,
            merk: "Pertamina",
            quantity: 20,
            satuan: "Liter",
            harga: 45000,
            keterangan: "Ganti berkala",
        },
        {
            id: "3",
            name: "V-Belt A-68",
            part_number: "A-68",
            merk: "Gates",
            quantity: 4,
            satuan: "PCS",
            harga: 85000,
            keterangan: "Spare pompa air",
        },
        {
            id: "4",
            name: "Grease Shell Alvania EP-2",
            part_number: null,
            merk: "Shell",
            quantity: 3,
            satuan: "Kg",
            harga: 120000,
            keterangan: null,
        },
    ],
    pimpinan: "MUSRAN",
    kepala_peralatan: "RUSLAN",
    pembuat: "RENI LEMPAN TIBOYONG",
    catatan: "Mohon konfirmasi ketersediaan stok sebelum pengiriman.",
}

export default async function PrintPOPage({
    params,
}: {
    params: Promise<{ id: string }>
}) {
    // TODO: When PO model is implemented, fetch from DB using id
    // For now, use mock data
    // const { id } = await params
    await params // keep async signature

    return <POPrintClient po={MOCK_PO} />
}
