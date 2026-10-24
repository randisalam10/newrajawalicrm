export interface PermissionItem {
    id: string
    code: string
    module: string
    action: string
    name: string
    description?: string | null
}

export interface RoleItem {
    id: string
    name: string
    label: string
    description?: string | null
    isSystem: boolean
    scope: "ALL_BRANCHES" | "OWN_BRANCH"
    _count: {
        permissions: number
        users: number
    }
}

export interface RolesClientProps {
    roles: RoleItem[]
    groupedPermissions: Record<string, PermissionItem[]>
    initialRolePermissions: Record<string, string[]>
}

export interface ModuleGroupDef {
    id: string
    title: string
    description: string
    iconKey: "factory" | "mountain" | "shopping-cart" | "landmark" | "file-bar-chart" | "database"
    badgeColor: string
    modules: string[]
}

export const MODULE_GROUPS: ModuleGroupDef[] = [
    {
        id: "OPERASIONAL_BP",
        title: "Operasional Batching Plant (BP)",
        description: "Monitoring produksi beton ready-mix, jadwal pengecoran, tiket mixer, sewa alat, retase supir, serta kartu stok semen & agregat.",
        iconKey: "factory",
        badgeColor: "bg-blue-50 text-blue-700 border-blue-200",
        modules: [
            "DASHBOARD",
            "PLANNING",
            "PRODUKSI",
            "RETASE",
            "SEWA",
            "MATERIAL_SEMEN",
            "MATERIAL_AGREGAT",
            "MATERIAL_USAGE",
            "FUEL"
        ]
    },
    {
        id: "OPERASIONAL_SC",
        title: "Operasional Stone Crusher (SC)",
        description: "Produksi batu pecah/agregat, pencatatan material masuk dari quarry, pengiriman material keluar, jam kerja mesin, dan BBM solar.",
        iconKey: "mountain",
        badgeColor: "bg-amber-50 text-amber-700 border-amber-200",
        modules: [
            "CRUSHER"
        ]
    },
    {
        id: "LOGISTIK",
        title: "Pengadaan & Logistik",
        description: "Pengadaan barang/sparepart, Purchase Order (BP & SC), persetujuan direksi, master barang/supplier, dan otorisasi Daftar Perusahaan (KOP Surat).",
        iconKey: "shopping-cart",
        badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
        modules: [
            "LOGISTIK"
        ]
    },
    {
        id: "FINANCE",
        title: "Keuangan, Tagihan & Kas Lapangan",
        description: "Penagihan invoice customer, pencatatan pembayaran piutang, kas operasional lapangan (RBL), kewajiban/kredit, dan tutup buku.",
        iconKey: "landmark",
        badgeColor: "bg-purple-50 text-purple-700 border-purple-200",
        modules: [
            "BILLING",
            "RBL",
            "FINANCE"
        ]
    },
    {
        id: "REPORTS",
        title: "Laporan & Rekapitulasi",
        description: "Rekapitulasi gaji supir mixer & dump truck, rekapitulasi armada kendaraan, dan laporan audit manajemen.",
        iconKey: "file-bar-chart",
        badgeColor: "bg-sky-50 text-sky-700 border-sky-200",
        modules: [
            "REPORTS"
        ]
    },
    {
        id: "MASTER_DATA",
        title: "Master Data & Administrasi Sistem",
        description: "Data induk customer & proyek, armada kendaraan, karyawan, formula mutu beton, tarif insentif, cabang, user, dan konfigurasi hak akses.",
        iconKey: "database",
        badgeColor: "bg-slate-100 text-slate-700 border-slate-200",
        modules: [
            "CUSTOMER",
            "KARYAWAN",
            "VEHICLE",
            "MUTU",
            "ITEM_PEKERJAAN",
            "INSENTIF",
            "MASTER_CABANG",
            "MASTER_DATA",
            "USER_MGMT",
            "RBAC_MGMT"
        ]
    }
]

export const MODULE_LABELS: Record<string, { title: string; desc: string }> = {
    DASHBOARD: { title: "Monitoring Dashboard", desc: "Ringkasan KPI & grafik produksi harian/bulanan" },
    PLANNING: { title: "Planning Pengecoran", desc: "Jadwal rencana pengecoran batching plant" },
    PRODUKSI: { title: "Input Produksi", desc: "Input pengiriman mixer, edit data tiket, dan konfirmasi transaksi" },
    SEWA: { title: "Sewa Alat / Kendaraan", desc: "Master alat sewa, order rental alat berat, surat jalan / DO sewa, dan penagihan" },
    RETASE: { title: "Surat Jalan & Retase", desc: "Pencatatan surat jalan & perhitungan komisi retase driver mixer" },
    INSENTIF: { title: "Master Insentif & Tarif", desc: "Pengaturan tarif komisi Sopir Mixer dan insentif Operator BP, CP, Exca, DT" },
    CUSTOMER: { title: "Data Customer & Proyek", desc: "Master customer, data proyek, dan harga khusus mutu per proyek" },
    MATERIAL_SEMEN: { title: "Semen Masuk & Stok", desc: "Pencatatan penerimaan semen masuk & monitoring kartu stok" },
    MATERIAL_AGREGAT: { title: "Material Agregat", desc: "Penerimaan pasir & batu split serta penyesuaian stok agregat" },
    MATERIAL_USAGE: { title: "Penggunaan Material", desc: "Monitoring rasio pemakaian aktual bahan baku terhadap rencana mutu" },
    FUEL: { title: "Monitoring BBM Armada", desc: "Pencatatan konsumsi BBM solar armada (RBL maupun Non-RBL dengan harga manual) & pelacakan KM/HM" },
    CRUSHER: { title: "Stone Crusher (SC)", desc: "Dashboard SC, PO Crusher, jam mesin/downtime, BBM solar, material masuk & keluar, dan master quarry" },
    LOGISTIK: { title: "Logistik, PO & Perusahaan (KOP)", desc: "Pengadaan barang, Purchase Order (BP/SC), persetujuan direksi, master barang/supplier, dan otorisasi Daftar Perusahaan (KOP Surat)" },
    BILLING: { title: "Tagihan & Invoice", desc: "Pembuatan invoice, penerbitan, pencatatan pembayaran & saldo deposit" },
    RBL: { title: "Rekap Bulanan (RBL)", desc: "Budgeting cabang, pencatatan pengeluaran operasional, tracking BBM, dan tutup buku" },
    FINANCE: { title: "Keuangan & Kredit", desc: "Pencatatan kredit modal, cicilan kewajiban, dan tutup buku finansial" },
    REPORTS: { title: "Laporan & Rekapitulasi", desc: "Rekap gaji sopir, laporan kendaraan, laporan penagihan, dan export audit" },
    KARYAWAN: { title: "Data Master Karyawan & Supir", desc: "Master data pegawai, supir mixer, supir dump truck, dan operator" },
    VEHICLE: { title: "Data Master Kendaraan & Alat", desc: "Master armada mixer, dump truck, alat berat, genset, dan kategori kendaraan" },
    MUTU: { title: "Data Master Mutu Beton", desc: "Spesifikasi campuran, rasio material, dan formula mutu beton" },
    ITEM_PEKERJAAN: { title: "Data Master Item Pekerjaan", desc: "Katalog item pekerjaan proyek (Rigid, Sloof, Kolom, Lantai, dll)" },
    MASTER_CABANG: { title: "Data Master Cabang BP", desc: "Pengaturan cabang/lokasi batching plant & stone crusher" },
    MASTER_DATA: { title: "Master Data Tambahan", desc: "Konfigurasi data master umum sistem" },
    USER_MGMT: { title: "Manajemen User", desc: "Akun login pengguna sistem & reset password" },
    RBAC_MGMT: { title: "Pengaturan Hak Akses (RBAC)", desc: "Konfigurasi role dan matriks izin per modul sistem" },
}

export const ACTION_LABELS: Record<string, string> = {
    view: "Lihat",
    create: "Buat / Tambah",
    edit: "Ubah / Kelola",
    delete: "Hapus / Batalkan",
    approve: "Konfirmasi / Setujui",
    export: "Export / Cetak",
}
