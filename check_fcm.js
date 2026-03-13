const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
    const admins = await prisma.user.findMany({
        where: { role: { in: ['CEO', 'FVP', 'SuperAdminBP'] } },
        select: { username: true, role: true, fcmToken: true }
    });
    console.log(JSON.stringify(admins, null, 2));
}

check().catch(console.error).finally(() => prisma.$disconnect());
