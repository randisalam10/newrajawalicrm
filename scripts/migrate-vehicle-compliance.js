const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
    console.log("=== MIGRATING VEHICLE COMPLIANCE RECORD TABLE ===");

    // Create VehicleComplianceRecord table
    await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "VehicleComplianceRecord" (
            "id" TEXT NOT NULL PRIMARY KEY,
            "vehicleId" TEXT NOT NULL,
            "type" TEXT NOT NULL,
            "cost" DOUBLE PRECISION NOT NULL,
            "payment_date" TIMESTAMP(3),
            "valid_from" TIMESTAMP(3) NOT NULL,
            "valid_until" TIMESTAMP(3) NOT NULL,
            "period_months" INTEGER NOT NULL DEFAULT 12,
            "monthly_amount" DOUBLE PRECISION NOT NULL,
            "receipt_number" TEXT,
            "notes" TEXT,
            "created_by" TEXT,
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT "VehicleComplianceRecord_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE
        );
    `);
    console.log("Table VehicleComplianceRecord created or verified.");

    // Indices
    await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS "VehicleComplianceRecord_vehicleId_idx" ON "VehicleComplianceRecord"("vehicleId");
    `);
    await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS "VehicleComplianceRecord_type_idx" ON "VehicleComplianceRecord"("type");
    `);
    await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS "VehicleComplianceRecord_valid_from_valid_until_idx" ON "VehicleComplianceRecord"("valid_from", "valid_until");
    `);
    console.log("Indices created successfully.");

    // Seed existing vehicle tax/KIR configurations into historical records if any vehicle has them
    const vehiclesWithTax = await prisma.vehicle.findMany({
        where: {
            OR: [
                { annual_tax_cost: { gt: 0 } },
                { kir_cost: { gt: 0 } }
            ]
        }
    });

    console.log(`Found ${vehiclesWithTax.length} vehicles with existing tax/kir configurations. Syncing to initial records...`);

    for (const v of vehiclesWithTax) {
        // Check if records already exist
        const existingRecords = await prisma.$queryRawUnsafe(
            `SELECT id FROM "VehicleComplianceRecord" WHERE "vehicleId" = $1`,
            v.id
        );

        if (existingRecords.length === 0) {
            // Add Tax record if annual_tax_cost > 0
            if (v.annual_tax_cost && v.annual_tax_cost > 0) {
                const validUntil = v.tax_expiry_date || new Date("2027-03-31");
                const validFrom = new Date(validUntil);
                validFrom.setFullYear(validFrom.getFullYear() - 1);

                await prisma.$executeRawUnsafe(`
                    INSERT INTO "VehicleComplianceRecord" (
                        "id", "vehicleId", "type", "cost", "payment_date", "valid_from", "valid_until", "period_months", "monthly_amount", "notes", "createdAt", "updatedAt"
                    ) VALUES (
                        gen_random_uuid()::text, $1, 'PAJAK_STNK', $2, $3, $4, $5, 12, $6, 'Migrasi Data Awal STNK', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
                    )
                `, v.id, v.annual_tax_cost, validFrom, validFrom, validUntil, Math.round(v.annual_tax_cost / 12));
                console.log(`Migrated STNK record for vehicle ${v.plate_number}`);
            }

            // Add KIR record if kir_cost > 0
            if (v.kir_cost && v.kir_cost > 0) {
                const period = v.kir_period_months || 6;
                const validUntil = v.kir_expiry_date || new Date("2026-12-31");
                const validFrom = new Date(validUntil);
                validFrom.setMonth(validFrom.getMonth() - period);

                await prisma.$executeRawUnsafe(`
                    INSERT INTO "VehicleComplianceRecord" (
                        "id", "vehicleId", "type", "cost", "payment_date", "valid_from", "valid_until", "period_months", "monthly_amount", "notes", "createdAt", "updatedAt"
                    ) VALUES (
                        gen_random_uuid()::text, $1, 'UJI_KIR', $2, $3, $4, $5, $6, $7, 'Migrasi Data Awal KIR', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
                    )
                `, v.id, v.kir_cost, validFrom, validFrom, validUntil, period, Math.round(v.kir_cost / period));
                console.log(`Migrated KIR record for vehicle ${v.plate_number}`);
            }
        }
    }

    console.log("=== MIGRATION COMPLETE ===");
    await prisma.$disconnect();
}

main().catch(e => {
    console.error("Migration failed:", e);
    prisma.$disconnect();
    process.exit(1);
});
