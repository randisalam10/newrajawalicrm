const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log("Seeding Sewa & Driver Categories...");

    // 1. Seed Driver Categories
    const driverCategories = [
        { name: "Operator Concrete Pump", code: "CP", description: "Operator unit Concrete Pump / Pompa Beton", isSystem: true },
        { name: "Operator Excavator", code: "EXC", description: "Operator alat berat Excavator", isSystem: true },
        { name: "Operator Crane", code: "CRN", description: "Operator alat berat Mobile Crane", isSystem: true },
        { name: "Operator Wheel Loader", code: "LDR", description: "Operator alat berat Wheel Loader", isSystem: true },
        { name: "Sopir Truk Mixer", code: "MIX", description: "Sopir armada Truck Mixer", isSystem: true },
        { name: "Sopir Dump Truck", code: "DT", description: "Sopir armada Dump Truck", isSystem: true },
        { name: "Operator Lainnya", code: "OPR", description: "Operator alat berat & penunjang lainnya", isSystem: false },
    ];

    for (const cat of driverCategories) {
        await prisma.driverCategory.upsert({
            where: { name: cat.name },
            update: { code: cat.code, description: cat.description },
            create: cat
        });
    }
    console.log("✔ Driver categories seeded.");

    // 2. Seed Permissions
    const permissions = [
        { code: 'SEWA_VIEW', module: 'SEWA', action: 'view', name: 'Lihat Sewa Alat & Kendaraan', description: 'Melihat menu dan daftar transaksi sewa alat' },
        { code: 'SEWA_CREATE', module: 'SEWA', action: 'create', name: 'Buat Transaksi Sewa Baru', description: 'Membuat transaksi penyewaan alat / kendaraan' },
        { code: 'SEWA_EDIT', module: 'SEWA', action: 'edit', name: 'Ubah Data Sewa & Master Alat', description: 'Mengubah transaksi sewa dan mengelola master alat' },
        { code: 'SEWA_DELETE', module: 'SEWA', action: 'delete', name: 'Hapus / Batalkan Sewa', description: 'Membatalkan atau menghapus transaksi sewa' },
        { code: 'SEWA_PRINT', module: 'SEWA', action: 'print', name: 'Cetak DO / Surat Jalan Sewa', description: 'Mencetak Delivery Order / Surat Jalan sewa alat' },
    ];

    for (const p of permissions) {
        await prisma.permission.upsert({
            where: { code: p.code },
            update: { name: p.name, description: p.description, module: p.module, action: p.action },
            create: p
        });
    }
    console.log("✔ Sewa permissions seeded.");

    // 3. Link permissions to roles
    const roles = await prisma.role.findMany();
    const sewaPerms = await prisma.permission.findMany({
        where: { module: 'SEWA' }
    });

    for (const role of roles) {
        let permCodesToAssign = [];
        if (role.name === 'SuperAdminBP' || role.name === 'AdminBP') {
            permCodesToAssign = sewaPerms.map(p => p.code);
        } else if (role.name === 'OperatorBP') {
            permCodesToAssign = ['SEWA_VIEW', 'SEWA_CREATE', 'SEWA_PRINT'];
        } else if (role.name === 'CEO' || role.name === 'FVP') {
            permCodesToAssign = ['SEWA_VIEW', 'SEWA_PRINT'];
        }

        for (const code of permCodesToAssign) {
            const perm = sewaPerms.find(p => p.code === code);
            if (perm) {
                await prisma.rolePermission.upsert({
                    where: {
                        roleId_permissionId: {
                            roleId: role.id,
                            permissionId: perm.id
                        }
                    },
                    update: {},
                    create: {
                        roleId: role.id,
                        permissionId: perm.id
                    }
                }).catch(() => {});
            }
        }
    }
    console.log("✔ Permissions assigned to roles.");

    // 4. Sample Master Sewa Alat if empty
    const countAlat = await prisma.masterSewaAlat.count();
    if (countAlat === 0) {
        const firstLocation = await prisma.location.findFirst();
        await prisma.masterSewaAlat.createMany({
            data: [
                {
                    kode_alat: "CP-01",
                    nama_alat: "Concrete Pump Sany 37M",
                    kategori: "Concrete Pump",
                    merk_model: "Sany SY5290THB",
                    nomor_seri_plat: "B 9102 SAA",
                    default_day_rate: 4500000,
                    status: "Tersedia",
                    keterangan: "Boom reach 37 meter, output 120m3/h",
                    locationId: firstLocation ? firstLocation.id : null
                },
                {
                    kode_alat: "EXC-01",
                    nama_alat: "Excavator Komatsu PC200-8",
                    kategori: "Excavator",
                    merk_model: "Komatsu PC200-8",
                    nomor_seri_plat: "EXC-KMT-200",
                    default_day_rate: 3000000,
                    status: "Tersedia",
                    keterangan: "Bucket 0.93m3, kondisi prima",
                    locationId: firstLocation ? firstLocation.id : null
                },
                {
                    kode_alat: "CR-01",
                    nama_alat: "Mobile Crane Tadano 25 Ton",
                    kategori: "Crane",
                    merk_model: "Tadano GR-250N",
                    nomor_seri_plat: "B 8831 TDN",
                    default_day_rate: 5500000,
                    status: "Tersedia",
                    keterangan: "Kapasitas angkat 25 ton, boom 31m",
                    locationId: firstLocation ? firstLocation.id : null
                }
            ]
        });
        console.log("✔ Sample Master Sewa Alat created.");
    }

    console.log("Seeding completed successfully!");
}

main().catch(err => {
    console.error("Seeding error:", err);
    process.exit(1);
}).finally(async () => {
    await prisma.$disconnect();
});
