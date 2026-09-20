-- AlterTable Vehicle: Add dump_truck_size and capacity_cubic
ALTER TABLE "Vehicle" ADD COLUMN IF NOT EXISTS "dump_truck_size" TEXT;
ALTER TABLE "Vehicle" ADD COLUMN IF NOT EXISTS "capacity_cubic" DOUBLE PRECISION;

-- AlterTable AggregateIncoming: Add vehicleId, driverId, dump_truck_size, distance_km, rate_price, retase_amount, is_retase_paid
ALTER TABLE "AggregateIncoming" ADD COLUMN IF NOT EXISTS "vehicleId" TEXT;
ALTER TABLE "AggregateIncoming" ADD COLUMN IF NOT EXISTS "driverId" TEXT;
ALTER TABLE "AggregateIncoming" ADD COLUMN IF NOT EXISTS "dump_truck_size" TEXT;
ALTER TABLE "AggregateIncoming" ADD COLUMN IF NOT EXISTS "distance_km" DOUBLE PRECISION;
ALTER TABLE "AggregateIncoming" ADD COLUMN IF NOT EXISTS "rate_price" DOUBLE PRECISION;
ALTER TABLE "AggregateIncoming" ADD COLUMN IF NOT EXISTS "retase_amount" DOUBLE PRECISION;
ALTER TABLE "AggregateIncoming" ADD COLUMN IF NOT EXISTS "is_retase_paid" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "AggregateIncoming_vehicleId_idx" ON "AggregateIncoming"("vehicleId");
CREATE INDEX IF NOT EXISTS "AggregateIncoming_driverId_idx" ON "AggregateIncoming"("driverId");

-- AddForeignKey to AggregateIncoming
DO $$ BEGIN
    ALTER TABLE "AggregateIncoming" ADD CONSTRAINT "AggregateIncoming_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "AggregateIncoming" ADD CONSTRAINT "AggregateIncoming_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- CreateTable AggregateRetaseSetting
CREATE TABLE IF NOT EXISTS "AggregateRetaseSetting" (
    "id" TEXT NOT NULL,
    "price_dt_besar" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "price_dt_kecil" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "default_distance_km" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "effective_from" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "locationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AggregateRetaseSetting_pkey" PRIMARY KEY ("id")
);

-- CreateIndex Unique for locationId
CREATE UNIQUE INDEX IF NOT EXISTS "AggregateRetaseSetting_locationId_key" ON "AggregateRetaseSetting"("locationId");

-- AddForeignKey to AggregateRetaseSetting
DO $$ BEGIN
    ALTER TABLE "AggregateRetaseSetting" ADD CONSTRAINT "AggregateRetaseSetting_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Seed default AggregateRetaseSetting for all existing locations if not exists
INSERT INTO "AggregateRetaseSetting" ("id", "locationId", "price_dt_besar", "price_dt_kecil", "default_distance_km", "effective_from", "createdAt", "updatedAt")
SELECT
    gen_random_uuid()::TEXT,
    l."id",
    1500,
    1800,
    25,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "Location" l
WHERE NOT EXISTS (
    SELECT 1 FROM "AggregateRetaseSetting" ars WHERE ars."locationId" = l."id"
);
