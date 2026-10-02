const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
    console.log("Starting DB migration for Vehicle legalitas and FixedCostContract...");

    // 1. Alter Vehicle table to add legalitas and tax fields
    await prisma.$executeRawUnsafe(`
        ALTER TABLE "Vehicle" 
        ADD COLUMN IF NOT EXISTS "annual_tax_cost" DOUBLE PRECISION DEFAULT 0,
        ADD COLUMN IF NOT EXISTS "tax_expiry_date" TIMESTAMP(3),
        ADD COLUMN IF NOT EXISTS "kir_cost" DOUBLE PRECISION DEFAULT 0,
        ADD COLUMN IF NOT EXISTS "kir_expiry_date" TIMESTAMP(3),
        ADD COLUMN IF NOT EXISTS "kir_period_months" INTEGER DEFAULT 6;
    `);
    console.log("✅ Vehicle columns added / verified.");

    // 2. Create FixedCostContract table if not exists
    await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "FixedCostContract" (
            "id" TEXT NOT NULL PRIMARY KEY,
            "name" TEXT NOT NULL,
            "category" TEXT NOT NULL,
            "vendor_name" TEXT,
            "contract_number" TEXT,
            "total_amount" DOUBLE PRECISION NOT NULL,
            "start_date" TIMESTAMP(3) NOT NULL,
            "end_date" TIMESTAMP(3) NOT NULL,
            "duration_months" INTEGER NOT NULL,
            "monthly_amount" DOUBLE PRECISION NOT NULL,
            "payment_status" TEXT DEFAULT 'LUNAS',
            "notes" TEXT,
            "isActive" BOOLEAN NOT NULL DEFAULT true,
            "locationId" TEXT,
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT "FixedCostContract_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE SET NULL ON UPDATE CASCADE
        );
    `);
    console.log("✅ FixedCostContract table created / verified.");

    // 3. Create indices
    await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS "FixedCostContract_locationId_idx" ON "FixedCostContract"("locationId");
    `);
    await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS "FixedCostContract_category_idx" ON "FixedCostContract"("category");
    `);
    await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS "FixedCostContract_isActive_idx" ON "FixedCostContract"("isActive");
    `);
    await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS "FixedCostContract_start_date_end_date_idx" ON "FixedCostContract"("start_date", "end_date");
    `);
    console.log("✅ FixedCostContract indices created / verified.");
}

main()
    .catch(e => {
        console.error("Migration failed:", e);
        process.exit(1);
    })
    .finally(() => {
        prisma.$disconnect();
    });
