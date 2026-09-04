import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export const PERMISSIONS = [
    // Dashboard
    { code: 'DASHBOARD_VIEW', module: 'DASHBOARD', action: 'view', name: 'Lihat Dashboard' },

    // Produksi
    { code: 'PRODUKSI_VIEW', module: 'PRODUKSI', action: 'view', name: 'Lihat Input Produksi' },
    { code: 'PRODUKSI_CREATE', module: 'PRODUKSI', action: 'create', name: 'Tambah Transaksi Produksi' },
    { code: 'PRODUKSI_EDIT', module: 'PRODUKSI', action: 'edit', name: 'Ubah Transaksi Produksi' },
    { code: 'PRODUKSI_DELETE', module: 'PRODUKSI', action: 'delete', name: 'Hapus Transaksi Produksi' },
    { code: 'PRODUKSI_APPROVE', module: 'PRODUKSI', action: 'approve', name: 'Konfirmasi Transaksi Produksi' },

    // Retase
    { code: 'RETASE_VIEW', module: 'RETASE', action: 'view', name: 'Lihat Surat Jalan & Retase' },
    { code: 'RETASE_EDIT', module: 'RETASE', action: 'edit', name: 'Atur Tarif & Hitung Retase' },
    { code: 'RETASE_EXPORT', module: 'RETASE', action: 'export', name: 'Cetak / Rekap Gaji Supir' },

    // Customer & Proyek
    { code: 'CUSTOMER_VIEW', module: 'CUSTOMER', action: 'view', name: 'Lihat Data Customer' },
    { code: 'CUSTOMER_CREATE', module: 'CUSTOMER', action: 'create', name: 'Tambah Customer & Proyek' },
    { code: 'CUSTOMER_EDIT', module: 'CUSTOMER', action: 'edit', name: 'Ubah Customer & Harga' },
    { code: 'CUSTOMER_DELETE', module: 'CUSTOMER', action: 'delete', name: 'Hapus Customer / Proyek' },

    // Tagihan & Invoice (Billing)
    { code: 'BILLING_VIEW', module: 'BILLING', action: 'view', name: 'Lihat Tagihan & Invoice' },
    { code: 'BILLING_CREATE', module: 'BILLING', action: 'create', name: 'Buat Invoice Baru' },
    { code: 'BILLING_EDIT', module: 'BILLING', action: 'edit', name: 'Ubah / Terbitkan Invoice' },
    { code: 'BILLING_DELETE', module: 'BILLING', action: 'delete', name: 'Batalkan Invoice' },
    { code: 'BILLING_APPROVE', module: 'BILLING', action: 'approve', name: 'Catat Pembayaran & Deposit' },

    // Material Semen
    { code: 'MATERIAL_SEMEN_VIEW', module: 'MATERIAL_SEMEN', action: 'view', name: 'Lihat Semen Masuk & Kartu Stok' },
    { code: 'MATERIAL_SEMEN_CREATE', module: 'MATERIAL_SEMEN', action: 'create', name: 'Catat Semen Masuk' },
    { code: 'MATERIAL_SEMEN_EDIT', module: 'MATERIAL_SEMEN', action: 'edit', name: 'Koreksi Stok Semen' },
    { code: 'MATERIAL_SEMEN_DELETE', module: 'MATERIAL_SEMEN', action: 'delete', name: 'Hapus Catatan Semen Masuk' },

    // Material Agregat
    { code: 'MATERIAL_AGREGAT_VIEW', module: 'MATERIAL_AGREGAT', action: 'view', name: 'Lihat Material Agregat & Stok' },
    { code: 'MATERIAL_AGREGAT_CREATE', module: 'MATERIAL_AGREGAT', action: 'create', name: 'Catat Agregat Masuk' },
    { code: 'MATERIAL_AGREGAT_EDIT', module: 'MATERIAL_AGREGAT', action: 'edit', name: 'Penyesuaian Stok Agregat' },
    { code: 'MATERIAL_AGREGAT_DELETE', module: 'MATERIAL_AGREGAT', action: 'delete', name: 'Hapus Catatan Agregat' },

    // Penggunaan Material
    { code: 'MATERIAL_USAGE_VIEW', module: 'MATERIAL_USAGE', action: 'view', name: 'Lihat Monitoring Penggunaan Material' },

    // Planning Pengecoran
    { code: 'PLANNING_VIEW', module: 'PLANNING', action: 'view', name: 'Lihat Planning Pengecoran' },
    { code: 'PLANNING_CREATE', module: 'PLANNING', action: 'create', name: 'Tambah Jadwal Planning' },
    { code: 'PLANNING_EDIT', module: 'PLANNING', action: 'edit', name: 'Update Status Planning' },
    { code: 'PLANNING_DELETE', module: 'PLANNING', action: 'delete', name: 'Hapus Planning Pengecoran' },

    // Master Data
    { code: 'MASTER_DATA_VIEW', module: 'MASTER_DATA', action: 'view', name: 'Lihat Data Master' },
    { code: 'MASTER_DATA_CREATE', module: 'MASTER_DATA', action: 'create', name: 'Tambah Karyawan/Armada/Mutu' },
    { code: 'MASTER_DATA_EDIT', module: 'MASTER_DATA', action: 'edit', name: 'Ubah Data Master' },
    { code: 'MASTER_DATA_DELETE', module: 'MASTER_DATA', action: 'delete', name: 'Hapus Data Master' },

    // Master Cabang
    { code: 'MASTER_CABANG_VIEW', module: 'MASTER_CABANG', action: 'view', name: 'Lihat Master Cabang' },
    { code: 'MASTER_CABANG_CREATE', module: 'MASTER_CABANG', action: 'create', name: 'Tambah Cabang Baru' },
    { code: 'MASTER_CABANG_EDIT', module: 'MASTER_CABANG', action: 'edit', name: 'Ubah Data Cabang' },
    { code: 'MASTER_CABANG_DELETE', module: 'MASTER_CABANG', action: 'delete', name: 'Hapus Cabang' },

    // Logistik & PO
    { code: 'LOGISTIK_VIEW', module: 'LOGISTIK', action: 'view', name: 'Lihat Modul Logistik & PO' },
    { code: 'LOGISTIK_CREATE', module: 'LOGISTIK', action: 'create', name: 'Buat PO Baru' },
    { code: 'LOGISTIK_EDIT', module: 'LOGISTIK', action: 'edit', name: 'Ubah PO / Master Barang' },
    { code: 'LOGISTIK_DELETE', module: 'LOGISTIK', action: 'delete', name: 'Batalkan PO / Hapus Barang' },
    { code: 'LOGISTIK_APPROVE', module: 'LOGISTIK', action: 'approve', name: 'Approval PO' },

    // Laporan
    { code: 'REPORTS_VIEW', module: 'REPORTS', action: 'view', name: 'Lihat Laporan & Rekapitulasi' },
    { code: 'REPORTS_EXPORT', module: 'REPORTS', action: 'export', name: 'Export Laporan ke Excel/PDF' },

    // User Management
    { code: 'USER_MGMT_VIEW', module: 'USER_MGMT', action: 'view', name: 'Lihat Daftar User Sistem' },
    { code: 'USER_MGMT_CREATE', module: 'USER_MGMT', action: 'create', name: 'Tambah User Baru' },
    { code: 'USER_MGMT_EDIT', module: 'USER_MGMT', action: 'edit', name: 'Ubah User & Reset Password' },
    { code: 'USER_MGMT_DELETE', module: 'USER_MGMT', action: 'delete', name: 'Hapus User' },

    // RBAC Settings
    { code: 'RBAC_MGMT_VIEW', module: 'RBAC_MGMT', action: 'view', name: 'Lihat Konfigurasi Role & Izin' },
    { code: 'RBAC_MGMT_EDIT', module: 'RBAC_MGMT', action: 'edit', name: 'Atur Matriks Izin Akses Role' },

    // Rekap Bulanan (RBL)
    { code: 'RBL_VIEW', module: 'RBL', action: 'view', name: 'Lihat Rekap Bulanan (RBL)' },
    { code: 'RBL_CREATE', module: 'RBL', action: 'create', name: 'Buka Budget RBL Baru' },
    { code: 'RBL_EDIT', module: 'RBL', action: 'edit', name: 'Input & Ubah Pengeluaran RBL' },
    { code: 'RBL_DELETE', module: 'RBL', action: 'delete', name: 'Hapus Pengeluaran RBL' },
    { code: 'RBL_CLOSE', module: 'RBL', action: 'approve', name: 'Tutup Buku / Close RBL' },
    { code: 'RBL_EXPORT', module: 'RBL', action: 'export', name: 'Cetak / Export Laporan RBL' },
]

export const ROLES = [
    {
        name: 'SuperAdminBP',
        label: 'Super Admin',
        description: 'Akses penuh tanpa batas ke seluruh modul dan seluruh cabang (Head Office).',
        isSystem: true,
        scope: 'ALL_BRANCHES' as const,
        allPermissions: true,
    },
    {
        name: 'AdminBP',
        label: 'Admin Cabang',
        description: 'Pengelola operasional cabang tertentu, termasuk kontrol produksi, logistik, dan tagihan cabang.',
        isSystem: true,
        scope: 'OWN_BRANCH' as const,
        permissions: [
            'DASHBOARD_VIEW',
            'PRODUKSI_VIEW', 'PRODUKSI_CREATE', 'PRODUKSI_EDIT', 'PRODUKSI_DELETE', 'PRODUKSI_APPROVE',
            'RETASE_VIEW', 'RETASE_EDIT', 'RETASE_EXPORT',
            'CUSTOMER_VIEW', 'CUSTOMER_CREATE', 'CUSTOMER_EDIT',
            // Default: Kita aktifkan juga CRUD Tagihan & Invoice untuk Admin Cabang per kebutuhan!
            'BILLING_VIEW', 'BILLING_CREATE', 'BILLING_EDIT', 'BILLING_DELETE', 'BILLING_APPROVE',
            'MATERIAL_SEMEN_VIEW', 'MATERIAL_SEMEN_CREATE', 'MATERIAL_SEMEN_EDIT',
            'MATERIAL_AGREGAT_VIEW', 'MATERIAL_AGREGAT_CREATE', 'MATERIAL_AGREGAT_EDIT',
            'MATERIAL_USAGE_VIEW',
            'PLANNING_VIEW', 'PLANNING_CREATE', 'PLANNING_EDIT',
            'MASTER_DATA_VIEW', 'MASTER_DATA_CREATE', 'MASTER_DATA_EDIT',
            'LOGISTIK_VIEW', 'LOGISTIK_CREATE',
            'REPORTS_VIEW', 'REPORTS_EXPORT',
            'RBL_VIEW', 'RBL_CREATE', 'RBL_EDIT', 'RBL_DELETE', 'RBL_CLOSE', 'RBL_EXPORT',
        ],
    },
    {
        name: 'OperatorBP',
        label: 'Operator / Kasir',
        description: 'Petugas lapangan yang menginput transaksi produksi harian di batching plant.',
        isSystem: true,
        scope: 'OWN_BRANCH' as const,
        permissions: [
            'DASHBOARD_VIEW',
            'PRODUKSI_VIEW', 'PRODUKSI_CREATE',
            'RETASE_VIEW',
            'PLANNING_VIEW',
        ],
    },
    {
        name: 'AdminLogistik',
        label: 'Admin Logistik',
        description: 'Pengelola pengadaan barang, pembelian (Purchase Order), dan stok material.',
        isSystem: true,
        scope: 'ALL_BRANCHES' as const,
        permissions: [
            'LOGISTIK_VIEW', 'LOGISTIK_CREATE', 'LOGISTIK_EDIT', 'LOGISTIK_DELETE', 'LOGISTIK_APPROVE',
            'MATERIAL_SEMEN_VIEW', 'MATERIAL_SEMEN_CREATE', 'MATERIAL_SEMEN_EDIT',
            'MATERIAL_AGREGAT_VIEW', 'MATERIAL_AGREGAT_CREATE', 'MATERIAL_AGREGAT_EDIT',
            'MATERIAL_USAGE_VIEW',
            'REPORTS_VIEW',
        ],
    },
    {
        name: 'CEO',
        label: 'CEO',
        description: 'Akses pemantauan eksekutif dan approval tingkat tinggi (PO, Billing, Audit).',
        isSystem: true,
        scope: 'ALL_BRANCHES' as const,
        permissions: [
            'DASHBOARD_VIEW', 'PRODUKSI_VIEW', 'RETASE_VIEW', 'CUSTOMER_VIEW',
            'BILLING_VIEW', 'MATERIAL_USAGE_VIEW', 'PLANNING_VIEW', 'MASTER_DATA_VIEW',
            'MASTER_CABANG_VIEW', 'LOGISTIK_VIEW', 'LOGISTIK_APPROVE', 'REPORTS_VIEW', 'REPORTS_EXPORT',
            'RBL_VIEW', 'RBL_EXPORT',
        ],
    },
    {
        name: 'FVP',
        label: 'FVP',
        description: 'First Vice President dengan akses pengawasan dan approval multi-cabang.',
        isSystem: true,
        scope: 'ALL_BRANCHES' as const,
        permissions: [
            'DASHBOARD_VIEW', 'PRODUKSI_VIEW', 'RETASE_VIEW', 'CUSTOMER_VIEW',
            'BILLING_VIEW', 'MATERIAL_USAGE_VIEW', 'PLANNING_VIEW', 'MASTER_DATA_VIEW',
            'MASTER_CABANG_VIEW', 'LOGISTIK_VIEW', 'LOGISTIK_APPROVE', 'REPORTS_VIEW', 'REPORTS_EXPORT',
            'RBL_VIEW', 'RBL_EXPORT',
        ],
    },
]

async function main() {
    console.log('Seeding RBAC Permissions...')
    for (const p of PERMISSIONS) {
        await prisma.permission.upsert({
            where: { code: p.code },
            update: { name: p.name, module: p.module, action: p.action },
            create: p,
        })
    }
    console.log(`✓ ${PERMISSIONS.length} Permissions created/updated.`)

    console.log('Seeding Default Roles...')
    const allDbPermissions = await prisma.permission.findMany()

    for (const r of ROLES) {
        const role = await prisma.role.upsert({
            where: { name: r.name },
            update: {
                label: r.label,
                description: r.description,
                isSystem: r.isSystem,
                scope: r.scope,
            },
            create: {
                name: r.name,
                label: r.label,
                description: r.description,
                isSystem: r.isSystem,
                scope: r.scope,
            },
        })

        // Assign permissions
        const targetPermCodes = r.allPermissions
            ? allDbPermissions.map(p => p.code)
            : (r.permissions || [])

        const targetPermIds = allDbPermissions
            .filter(p => targetPermCodes.includes(p.code))
            .map(p => p.id)

        // Reset and re-assign
        await prisma.rolePermission.deleteMany({ where: { roleId: role.id } })
        if (targetPermIds.length > 0) {
            await prisma.rolePermission.createMany({
                data: targetPermIds.map(permissionId => ({
                    roleId: role.id,
                    permissionId,
                })),
                skipDuplicates: true,
            })
        }
        console.log(`✓ Role ${role.name} (${role.label}) configured with ${targetPermIds.length} permissions.`)
    }

    // Connect existing users to their roleId
    console.log('Connecting existing users to Role records...')
    const dbRoles = await prisma.role.findMany()
    for (const r of dbRoles) {
        const updated = await prisma.user.updateMany({
            where: { role: r.name },
            data: { roleId: r.id },
        })
        if (updated.count > 0) {
            console.log(`✓ Connected ${updated.count} users with role '${r.name}' to roleId ${r.id}`)
        }
    }

    console.log('RBAC Seed completed successfully!')
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
