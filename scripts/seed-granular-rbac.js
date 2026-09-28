const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const NEW_PERMISSIONS = [
    // Dashboard
    { code: 'DASHBOARD_VIEW', module: 'DASHBOARD', action: 'view', name: 'Lihat Dashboard', description: 'Melihat dashboard monitoring & grafik' },

    // Planning Pengecoran
    { code: 'PLANNING_VIEW', module: 'PLANNING', action: 'view', name: 'Lihat Planning Pengecoran', description: 'Melihat jadwal pengecoran' },
    { code: 'PLANNING_CREATE', module: 'PLANNING', action: 'create', name: 'Tambah Jadwal Planning', description: 'Membuat jadwal cor baru' },
    { code: 'PLANNING_EDIT', module: 'PLANNING', action: 'edit', name: 'Update Status Planning', description: 'Mengubah jadwal & status planning' },
    { code: 'PLANNING_DELETE', module: 'PLANNING', action: 'delete', name: 'Hapus Planning Pengecoran', description: 'Menghapus jadwal planning' },

    // Produksi
    { code: 'PRODUKSI_VIEW', module: 'PRODUKSI', action: 'view', name: 'Lihat Input Produksi', description: 'Melihat data transaksi produksi' },
    { code: 'PRODUKSI_CREATE', module: 'PRODUKSI', action: 'create', name: 'Tambah Transaksi Produksi', description: 'Input data tiket & muatan mixer' },
    { code: 'PRODUKSI_EDIT', module: 'PRODUKSI', action: 'edit', name: 'Ubah Transaksi Produksi', description: 'Mengubah data transaksi tiket' },
    { code: 'PRODUKSI_DELETE', module: 'PRODUKSI', action: 'delete', name: 'Hapus Transaksi Produksi', description: 'Menghapus transaksi tiket' },
    { code: 'PRODUKSI_APPROVE', module: 'PRODUKSI', action: 'approve', name: 'Konfirmasi Transaksi Produksi', description: 'Konfirmasi tiket selesai produksi' },

    // Sewa Alat & Kendaraan
    { code: 'SEWA_VIEW', module: 'SEWA', action: 'view', name: 'Lihat Sewa Alat & Kendaraan', description: 'Melihat menu dan daftar rental sewa' },
    { code: 'SEWA_CREATE', module: 'SEWA', action: 'create', name: 'Buat Transaksi Sewa Baru', description: 'Membuat transaksi rental baru' },
    { code: 'SEWA_EDIT', module: 'SEWA', action: 'edit', name: 'Ubah Data Sewa & Master Alat', description: 'Mengubah rental & tarif sewa' },
    { code: 'SEWA_DELETE', module: 'SEWA', action: 'delete', name: 'Hapus / Batalkan Sewa', description: 'Membatalkan transaksi rental' },
    { code: 'SEWA_PRINT', module: 'SEWA', action: 'print', name: 'Cetak DO / Surat Jalan Sewa', description: 'Mencetak surat jalan & DO rental' },

    // Retase Mixer
    { code: 'RETASE_VIEW', module: 'RETASE', action: 'view', name: 'Lihat Surat Jalan & Retase', description: 'Melihat transaksi retase & surat jalan mixer' },
    { code: 'RETASE_EDIT', module: 'RETASE', action: 'edit', name: 'Atur Tarif & Hitung Retase', description: 'Konfirmasi jarak & hitung komisi supir' },
    { code: 'RETASE_EXPORT', module: 'RETASE', action: 'export', name: 'Cetak / Rekap Gaji Supir', description: 'Export dan cetak laporan retase mixer' },

    // Master Insentif & Tarif (BARU - PER MENU)
    { code: 'INSENTIF_VIEW', module: 'INSENTIF', action: 'view', name: 'Lihat Master Insentif & Tarif', description: 'Melihat tarif komisi mixer dan insentif operator' },
    { code: 'INSENTIF_EDIT', module: 'INSENTIF', action: 'edit', name: 'Atur Tarif Insentif & Retase', description: 'Mengubah tarif dasar komisi dan insentif' },

    // Customer & Proyek
    { code: 'CUSTOMER_VIEW', module: 'CUSTOMER', action: 'view', name: 'Lihat Data Customer', description: 'Melihat katalog customer & proyek' },
    { code: 'CUSTOMER_CREATE', module: 'CUSTOMER', action: 'create', name: 'Tambah Customer & Proyek', description: 'Mendaftarkan customer & proyek baru' },
    { code: 'CUSTOMER_EDIT', module: 'CUSTOMER', action: 'edit', name: 'Ubah Customer & Harga', description: 'Mengubah customer & harga mutu khusus' },
    { code: 'CUSTOMER_DELETE', module: 'CUSTOMER', action: 'delete', name: 'Hapus Customer / Proyek', description: 'Menghapus customer / proyek' },

    // Material Semen
    { code: 'MATERIAL_SEMEN_VIEW', module: 'MATERIAL_SEMEN', action: 'view', name: 'Lihat Semen Masuk & Kartu Stok', description: 'Melihat penerimaan semen & stok' },
    { code: 'MATERIAL_SEMEN_CREATE', module: 'MATERIAL_SEMEN', action: 'create', name: 'Catat Semen Masuk', description: 'Input delivery semen masuk' },
    { code: 'MATERIAL_SEMEN_EDIT', module: 'MATERIAL_SEMEN', action: 'edit', name: 'Koreksi Stok Semen', description: 'Penyesuaian stok semen' },
    { code: 'MATERIAL_SEMEN_DELETE', module: 'MATERIAL_SEMEN', action: 'delete', name: 'Hapus Catatan Semen Masuk', description: 'Hapus data semen masuk' },

    // Material Agregat
    { code: 'MATERIAL_AGREGAT_VIEW', module: 'MATERIAL_AGREGAT', action: 'view', name: 'Lihat Material Agregat & Stok', description: 'Melihat stok pasir & batu split' },
    { code: 'MATERIAL_AGREGAT_CREATE', module: 'MATERIAL_AGREGAT', action: 'create', name: 'Catat Agregat Masuk', description: 'Input penerimaan pasir & split' },
    { code: 'MATERIAL_AGREGAT_EDIT', module: 'MATERIAL_AGREGAT', action: 'edit', name: 'Penyesuaian Stok Agregat', description: 'Koreksi stok agregat' },
    { code: 'MATERIAL_AGREGAT_DELETE', module: 'MATERIAL_AGREGAT', action: 'delete', name: 'Hapus Catatan Agregat', description: 'Hapus data agregat masuk' },

    // Penggunaan Material
    { code: 'MATERIAL_USAGE_VIEW', module: 'MATERIAL_USAGE', action: 'view', name: 'Lihat Monitoring Penggunaan Material', description: 'Monitoring pemakaian bahan baku vs rencana' },

    // Billing & Tagihan
    { code: 'BILLING_VIEW', module: 'BILLING', action: 'view', name: 'Lihat Tagihan & Invoice', description: 'Melihat daftar invoice tagihan' },
    { code: 'BILLING_CREATE', module: 'BILLING', action: 'create', name: 'Buat Invoice Baru', description: 'Membuat draft invoice tagihan' },
    { code: 'BILLING_EDIT', module: 'BILLING', action: 'edit', name: 'Ubah / Terbitkan Invoice', description: 'Mengubah & menerbitkan invoice' },
    { code: 'BILLING_DELETE', module: 'BILLING', action: 'delete', name: 'Batalkan Invoice', description: 'Membatalkan faktur invoice' },
    { code: 'BILLING_APPROVE', module: 'BILLING', action: 'approve', name: 'Catat Pembayaran & Deposit', description: 'Mencatat pelunasan & deposit customer' },

    // Rekap Bulanan (RBL)
    { code: 'RBL_VIEW', module: 'RBL', action: 'view', name: 'Lihat Rekap Bulanan (RBL)', description: 'Melihat buku kas operasional cabang' },
    { code: 'RBL_CREATE', module: 'RBL', action: 'create', name: 'Buka Budget RBL Baru', description: 'Membuka anggaran RBL bulan baru' },
    { code: 'RBL_EDIT', module: 'RBL', action: 'edit', name: 'Input & Ubah Pengeluaran RBL', description: 'Mencatat biaya operasional & BBM' },
    { code: 'RBL_DELETE', module: 'RBL', action: 'delete', name: 'Hapus Pengeluaran RBL', description: 'Menghapus catatan kasbon/pengeluaran' },
    { code: 'RBL_CLOSE', module: 'RBL', action: 'approve', name: 'Tutup Buku / Close RBL', description: 'Menutup buku RBL bulanan' },
    { code: 'RBL_EXPORT', module: 'RBL', action: 'export', name: 'Cetak / Export Laporan RBL', description: 'Export rekap bulanan ke Excel' },

    // Laporan
    { code: 'REPORTS_VIEW', module: 'REPORTS', action: 'view', name: 'Lihat Laporan & Rekapitulasi', description: 'Melihat rekap audit & laporan' },
    { code: 'REPORTS_EXPORT', module: 'REPORTS', action: 'export', name: 'Export Laporan ke Excel/PDF', description: 'Export laporan operasional' },

    // Master Karyawan & Supir (DATA MASTER)
    { code: 'KARYAWAN_VIEW', module: 'KARYAWAN', action: 'view', name: 'Lihat Data Karyawan & Supir', description: 'Melihat master pegawai & driver' },
    { code: 'KARYAWAN_CREATE', module: 'KARYAWAN', action: 'create', name: 'Tambah Data Karyawan Baru', description: 'Mendaftarkan pegawai baru' },
    { code: 'KARYAWAN_EDIT', module: 'KARYAWAN', action: 'edit', name: 'Ubah Data Karyawan', description: 'Mengubah identitas & jabatan pegawai' },
    { code: 'KARYAWAN_DELETE', module: 'KARYAWAN', action: 'delete', name: 'Hapus Data Karyawan', description: 'Menghapus pegawai dari sistem' },

    // Master Kendaraan & Alat Berat (DATA MASTER)
    { code: 'VEHICLE_VIEW', module: 'VEHICLE', action: 'view', name: 'Lihat Data Kendaraan & Alat', description: 'Melihat armada truk & alat berat' },
    { code: 'VEHICLE_CREATE', module: 'VEHICLE', action: 'create', name: 'Tambah Kendaraan & Alat Baru', description: 'Menambah armada unit baru' },
    { code: 'VEHICLE_EDIT', module: 'VEHICLE', action: 'edit', name: 'Ubah Data Kendaraan & Kategori', description: 'Mengubah nomor plat, kategori, & spesifikasi' },
    { code: 'VEHICLE_DELETE', module: 'VEHICLE', action: 'delete', name: 'Hapus Data Kendaraan & Kategori', description: 'Menghapus kendaraan & kategori unit' },

    // Master Mutu Beton (BARU - PER MENU DATA MASTER)
    { code: 'MUTU_VIEW', module: 'MUTU', action: 'view', name: 'Lihat Master Mutu Beton', description: 'Melihat spesifikasi campuran mutu beton' },
    { code: 'MUTU_CREATE', module: 'MUTU', action: 'create', name: 'Tambah Spesifikasi Mutu', description: 'Membuat formula mutu beton baru' },
    { code: 'MUTU_EDIT', module: 'MUTU', action: 'edit', name: 'Ubah Komposisi & Formula Mutu', description: 'Mengubah komposisi pasir, split, & semen' },
    { code: 'MUTU_DELETE', module: 'MUTU', action: 'delete', name: 'Hapus Mutu Beton', description: 'Menghapus spesifikasi mutu beton' },

    // Master Item Pekerjaan (BARU - PER MENU DATA MASTER)
    { code: 'ITEM_PEKERJAAN_VIEW', module: 'ITEM_PEKERJAAN', action: 'view', name: 'Lihat Item Pekerjaan', description: 'Melihat katalog item pekerjaan (Rigid, Sloof, dll)' },
    { code: 'ITEM_PEKERJAAN_CREATE', module: 'ITEM_PEKERJAAN', action: 'create', name: 'Tambah Item Pekerjaan', description: 'Membuat jenis pekerjaan proyek baru' },
    { code: 'ITEM_PEKERJAAN_EDIT', module: 'ITEM_PEKERJAAN', action: 'edit', name: 'Ubah Item Pekerjaan', description: 'Mengubah nama item pekerjaan' },
    { code: 'ITEM_PEKERJAAN_DELETE', module: 'ITEM_PEKERJAAN', action: 'delete', name: 'Hapus Item Pekerjaan', description: 'Menghapus item pekerjaan' },

    // Master Cabang (DATA MASTER)
    { code: 'MASTER_CABANG_VIEW', module: 'MASTER_CABANG', action: 'view', name: 'Lihat Master Cabang', description: 'Melihat daftar lokasi batching plant' },
    { code: 'MASTER_CABANG_CREATE', module: 'MASTER_CABANG', action: 'create', name: 'Tambah Cabang Baru', description: 'Mendaftarkan cabang baru' },
    { code: 'MASTER_CABANG_EDIT', module: 'MASTER_CABANG', action: 'edit', name: 'Ubah Data Cabang', description: 'Mengubah nama lokasi cabang' },
    { code: 'MASTER_CABANG_DELETE', module: 'MASTER_CABANG', action: 'delete', name: 'Hapus Cabang', description: 'Menghapus cabang' },

    // Logistik & PO
    { code: 'LOGISTIK_VIEW', module: 'LOGISTIK', action: 'view', name: 'Lihat Modul Logistik & PO', description: 'Melihat daftar PO, supplier, & barang' },
    { code: 'LOGISTIK_CREATE', module: 'LOGISTIK', action: 'create', name: 'Buat PO Baru', description: 'Membuat Purchase Order baru' },
    { code: 'LOGISTIK_EDIT', module: 'LOGISTIK', action: 'edit', name: 'Ubah PO / Master Barang', description: 'Mengubah status PO & master logistik' },
    { code: 'LOGISTIK_DELETE', module: 'LOGISTIK', action: 'delete', name: 'Batalkan PO / Hapus Barang', description: 'Membatalkan PO / menghapus data barang' },
    { code: 'LOGISTIK_APPROVE', module: 'LOGISTIK', action: 'approve', name: 'Approval PO Logistik', description: 'Menyetujui PO pengadaan barang' },

    // User Management
    { code: 'USER_MGMT_VIEW', module: 'USER_MGMT', action: 'view', name: 'Lihat Daftar User Sistem', description: 'Melihat akun pengguna sistem' },
    { code: 'USER_MGMT_CREATE', module: 'USER_MGMT', action: 'create', name: 'Tambah User Baru', description: 'Membuat user login baru' },
    { code: 'USER_MGMT_EDIT', module: 'USER_MGMT', action: 'edit', name: 'Ubah User & Reset Password', description: 'Mengubah profil user & reset password' },
    { code: 'USER_MGMT_DELETE', module: 'USER_MGMT', action: 'delete', name: 'Hapus User', description: 'Menghapus user' },

    // RBAC Settings
    { code: 'RBAC_MGMT_VIEW', module: 'RBAC_MGMT', action: 'view', name: 'Lihat Konfigurasi Role & Izin', description: 'Melihat matriks izin role' },
    { code: 'RBAC_MGMT_EDIT', module: 'RBAC_MGMT', action: 'edit', name: 'Atur Matriks Izin Akses Role', description: 'Mengubah checkbox izin role' },
];

async function run() {
    console.log("Seeding Granular RBAC Permissions (Per-Menu)...");

    for (const p of NEW_PERMISSIONS) {
        await prisma.permission.upsert({
            where: { code: p.code },
            update: { name: p.name, description: p.description, module: p.module, action: p.action },
            create: p
        });
    }
    console.log(`✔ ${NEW_PERMISSIONS.length} Permissions upserted successfully.`);

    const allDbPerms = await prisma.permission.findMany();
    const permMap = new Map(allDbPerms.map(p => [p.code, p.id]));

    // Fetch existing roles
    const roles = await prisma.role.findMany();
    console.log(`Configuring permissions for ${roles.length} roles...`);

    for (const role of roles) {
        let codesToAssign = [];

        if (role.name === 'SuperAdminBP') {
            // SuperAdminBP gets ALL permissions
            codesToAssign = allDbPerms.map(p => p.code);
        } else if (role.name === 'AdminBP') {
            // AdminBP gets full operational & data master permissions
            codesToAssign = [
                'DASHBOARD_VIEW',
                'PLANNING_VIEW', 'PLANNING_CREATE', 'PLANNING_EDIT', 'PLANNING_DELETE',
                'PRODUKSI_VIEW', 'PRODUKSI_CREATE', 'PRODUKSI_EDIT', 'PRODUKSI_DELETE', 'PRODUKSI_APPROVE',
                'SEWA_VIEW', 'SEWA_CREATE', 'SEWA_EDIT', 'SEWA_DELETE', 'SEWA_PRINT',
                'RETASE_VIEW', 'RETASE_EDIT', 'RETASE_EXPORT',
                'INSENTIF_VIEW', 'INSENTIF_EDIT',
                'CUSTOMER_VIEW', 'CUSTOMER_CREATE', 'CUSTOMER_EDIT',
                'BILLING_VIEW', 'BILLING_CREATE', 'BILLING_EDIT', 'BILLING_DELETE', 'BILLING_APPROVE',
                'MATERIAL_SEMEN_VIEW', 'MATERIAL_SEMEN_CREATE', 'MATERIAL_SEMEN_EDIT',
                'MATERIAL_AGREGAT_VIEW', 'MATERIAL_AGREGAT_CREATE', 'MATERIAL_AGREGAT_EDIT',
                'MATERIAL_USAGE_VIEW',
                'RBL_VIEW', 'RBL_CREATE', 'RBL_EDIT', 'RBL_DELETE', 'RBL_CLOSE', 'RBL_EXPORT',
                'REPORTS_VIEW', 'REPORTS_EXPORT',
                'KARYAWAN_VIEW', 'KARYAWAN_CREATE', 'KARYAWAN_EDIT', 'KARYAWAN_DELETE',
                'VEHICLE_VIEW', 'VEHICLE_CREATE', 'VEHICLE_EDIT', 'VEHICLE_DELETE',
                'MUTU_VIEW', 'MUTU_CREATE', 'MUTU_EDIT', 'MUTU_DELETE',
                'ITEM_PEKERJAAN_VIEW', 'ITEM_PEKERJAAN_CREATE', 'ITEM_PEKERJAAN_EDIT', 'ITEM_PEKERJAAN_DELETE',
                'LOGISTIK_VIEW', 'LOGISTIK_CREATE', 'LOGISTIK_EDIT', 'LOGISTIK_DELETE', 'LOGISTIK_APPROVE',
            ];
        } else if (role.name === 'AdminLogistik') {
            // KHUSUS ADMIN LOGISTIK:
            // Logistik & PO, Material (Semen, Agregat, Usage), Vehicle, Reports
            // PASTI TIDAK MEMILIKI: MUTU_*, ITEM_PEKERJAAN_*, INSENTIF_*, KARYAWAN_*!
            codesToAssign = [
                'LOGISTIK_VIEW', 'LOGISTIK_CREATE', 'LOGISTIK_EDIT', 'LOGISTIK_DELETE', 'LOGISTIK_APPROVE',
                'MATERIAL_SEMEN_VIEW', 'MATERIAL_SEMEN_CREATE', 'MATERIAL_SEMEN_EDIT',
                'MATERIAL_AGREGAT_VIEW', 'MATERIAL_AGREGAT_CREATE', 'MATERIAL_AGREGAT_EDIT',
                'MATERIAL_USAGE_VIEW',
                'VEHICLE_VIEW', 'VEHICLE_CREATE', 'VEHICLE_EDIT',
                'REPORTS_VIEW',
            ];
        } else if (role.name === 'OperatorBP') {
            codesToAssign = [
                'DASHBOARD_VIEW',
                'PRODUKSI_VIEW', 'PRODUKSI_CREATE',
                'RETASE_VIEW',
                'PLANNING_VIEW',
                'SEWA_VIEW', 'SEWA_CREATE', 'SEWA_PRINT',
            ];
        } else if (role.name === 'CEO' || role.name === 'FVP') {
            codesToAssign = [
                'DASHBOARD_VIEW', 'PRODUKSI_VIEW', 'RETASE_VIEW', 'CUSTOMER_VIEW',
                'BILLING_VIEW', 'MATERIAL_USAGE_VIEW', 'PLANNING_VIEW',
                'MUTU_VIEW', 'ITEM_PEKERJAAN_VIEW', 'INSENTIF_VIEW',
                'VEHICLE_VIEW', 'KARYAWAN_VIEW', 'MASTER_CABANG_VIEW',
                'LOGISTIK_VIEW', 'LOGISTIK_APPROVE', 'REPORTS_VIEW', 'REPORTS_EXPORT',
                'RBL_VIEW', 'RBL_EXPORT', 'SEWA_VIEW', 'SEWA_PRINT',
            ];
        } else if (role.name === 'Approver') {
            codesToAssign = [
                'DASHBOARD_VIEW', 'LOGISTIK_VIEW', 'LOGISTIK_APPROVE', 'REPORTS_VIEW',
            ];
        }

        if (codesToAssign.length > 0) {
            const validIds = codesToAssign.map(c => permMap.get(c)).filter(Boolean);
            await prisma.$transaction([
                prisma.rolePermission.deleteMany({ where: { roleId: role.id } }),
                prisma.rolePermission.createMany({
                    data: validIds.map(pid => ({ roleId: role.id, permissionId: pid })),
                    skipDuplicates: true,
                })
            ]);
            console.log(`  ✓ Role "${role.label || role.name}": assigned ${validIds.length} permissions.`);
        }
    }

    console.log("✔ Granular RBAC configuration complete!");
}

run()
    .catch(e => { console.error("Error seeding RBAC:", e); process.exit(1); })
    .finally(() => prisma.$disconnect());
