const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
    // Check production transactions in 2026-07
    const txns = await prisma.productionTransaction.findMany({
        where: {
            date: {
                gte: new Date("2026-07-01T00:00:00Z"),
                lte: new Date("2026-07-31T23:59:59Z")
            }
        },
        include: {
            project: {
                include: {
                    customer: true,
                    prices: true
                }
            },
            concreteQuality: true
        }
    });

    console.log("Total txns in 2026-07:", txns.length);
    const totalVol = txns.reduce((s, t) => s + (t.volume_cubic || 0), 0);
    console.log("Total Volume m3:", totalVol);

    let totalDpp = 0;
    txns.forEach(t => {
        const p = t.project?.prices?.find(pr => pr.qualityId === t.qualityId);
        const price = p?.price || 0;
        console.log(`Txn ID ${t.id} - Vol: ${t.volume_cubic} - Quality: ${t.concreteQuality?.name} - Price: ${price} - Cust: ${t.project?.customer?.customer_name}`);
        totalDpp += (t.volume_cubic * price);
    });
    console.log("Total DPP:", totalDpp, "ASP:", totalVol > 0 ? totalDpp / totalVol : 0);
}

main().catch(console.error).finally(() => prisma.$disconnect());
