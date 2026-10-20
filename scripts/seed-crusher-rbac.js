const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const CRUSHER_PERMISSIONS = [
    { code: 'CRUSHER_VIEW', module: 'CRUSHER', action: 'view', name: 'Lihat Modul Stone Crusher' },
    { code: 'CRUSHER_DAILY_CREATE', module: 'CRUSHER', action: 'create', name: 'Catat Laporan Harian Crusher' },
    { code: 'CRUSHER_DAILY_EDIT', module: 'CRUSHER', action: 'edit', name: 'Ubah Laporan Harian Crusher' },
    { code: 'CRUSHER_BBM_CREATE', module: 'CRUSHER', action: 'create', name: 'Input Pengisian BBM Solar Crusher' },
    { code: 'CRUSHER_MASTER_MANAGE', module: 'CRUSHER', action: 'edit', name: 'Kelola Master Sumber Material' },
    { code: 'CRUSHER_WAGES_VIEW', module: 'CRUSHER', action: 'view', name: 'Lihat Hasil Pribadi & Slip Upah Operator / Helper' },
];

async function seedCrusherRbac() {
    console.log("Seeding Stone Crusher Permissions...");
    for (const p of CRUSHER_PERMISSIONS) {
        await prisma.permission.upsert({
            where: { code: p.code },
            update: { name: p.name, module: p.module, action: p.action },
            create: p,
        });
    }
    console.log("✓ Crusher Permissions created.");

    // Create or update OperatorCrusher role
    const crusherRole = await prisma.role.upsert({
        where: { name: 'OperatorCrusher' },
        update: {
            label: 'Operator Stone Crusher',
            description: 'Petugas lapangan yang mencatat operasional harian, BBM solar, material masuk dan keluar di Stone Crusher.',
            scope: 'OWN_BRANCH',
        },
        create: {
            name: 'OperatorCrusher',
            label: 'Operator Stone Crusher',
            description: 'Petugas lapangan yang mencatat operasional harian, BBM solar, material masuk dan keluar di Stone Crusher.',
            scope: 'OWN_BRANCH',
            isSystem: true,
        },
    });

    const operatorPerms = await prisma.permission.findMany({
        where: { code: { in: CRUSHER_PERMISSIONS.filter(p => p.code !== 'CRUSHER_WAGES_VIEW').map(p => p.code) } },
    });

    for (const perm of operatorPerms) {
        await prisma.rolePermission.upsert({
            where: {
                roleId_permissionId: {
                    roleId: crusherRole.id,
                    permissionId: perm.id,
                },
            },
            update: {},
            create: {
                roleId: crusherRole.id,
                permissionId: perm.id,
            },
        });
    }
    console.log("✓ OperatorCrusher Role permissions linked.");

    // Create or update AdminCrusher role
    const adminCrusherRole = await prisma.role.upsert({
        where: { name: 'AdminCrusher' },
        update: {
            label: 'Admin Stone Crusher',
            description: 'Pengelola operasional Stone Crusher, material quarry, solar BBM, dan pengadaan sparepart/PO SC.',
            scope: 'OWN_BRANCH',
        },
        create: {
            name: 'AdminCrusher',
            label: 'Admin Stone Crusher',
            description: 'Pengelola operasional Stone Crusher, material quarry, solar BBM, dan pengadaan sparepart/PO SC.',
            scope: 'OWN_BRANCH',
            isSystem: true,
        },
    });

    const adminPerms = await prisma.permission.findMany({
        where: {
            OR: [
                { module: 'CRUSHER' },
                { code: { in: ['LOGISTIK_VIEW', 'LOGISTIK_CREATE', 'LOGISTIK_EDIT', 'DASHBOARD_VIEW'] } }
            ]
        }
    });

    for (const perm of adminPerms) {
        await prisma.rolePermission.upsert({
            where: {
                roleId_permissionId: {
                    roleId: adminCrusherRole.id,
                    permissionId: perm.id,
                },
            },
            update: {},
            create: {
                roleId: adminCrusherRole.id,
                permissionId: perm.id,
            },
        });
    }
    console.log("✓ AdminCrusher Role permissions linked.");

    // Also auto-link Crusher permissions to SCHARAPAN role if exists
    const scharapanRole = await prisma.role.findFirst({
        where: { name: { in: ['SCHARAPAN', 'scharapan'] } }
    });
    if (scharapanRole) {
        for (const perm of adminPerms) {
            await prisma.rolePermission.upsert({
                where: {
                    roleId_permissionId: {
                        roleId: scharapanRole.id,
                        permissionId: perm.id,
                    },
                },
                update: {},
                create: {
                    roleId: scharapanRole.id,
                    permissionId: perm.id,
                },
            });
        }
        console.log("✓ SCHARAPAN Role permissions updated with Crusher permissions.");
    }

    // Seed initial default Quarry Material Source if empty
    const existingSources = await prisma.crusherMaterialSource.count();
    if (existingSources === 0) {
        const defaultSources = [
            { name: "Kali Harapan", default_distance_km: 12.0, description: "Sumber batu kali / bulat utama" },
            { name: "Sungai Tami", default_distance_km: 18.5, description: "Batu bulat & pasir kali" },
            { name: "Quarry Koya Barat", default_distance_km: 8.0, description: "Quarry batu gunung" },
            { name: "Kali Arso", default_distance_km: 15.0, description: "Batu kali Arso" },
        ];
        for (const s of defaultSources) {
            await prisma.crusherMaterialSource.create({ data: s });
        }
        console.log("✓ Default Crusher Material Sources seeded.");
    }

    console.log("Seeding Crusher RBAC finished successfully!");
}

seedCrusherRbac()
    .catch(e => {
        console.error("Error seeding crusher rbac:", e);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
