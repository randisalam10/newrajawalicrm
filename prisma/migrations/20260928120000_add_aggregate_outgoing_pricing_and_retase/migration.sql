-- AlterEnum: Add Semen to AggregateType
ALTER TYPE "AggregateType" ADD VALUE IF NOT EXISTS 'Semen';

-- AlterTable: Add pricing, unit, and internal transport / retase to AggregateOutgoing
ALTER TABLE "AggregateOutgoing" ADD COLUMN IF NOT EXISTS "unit" TEXT DEFAULT 'm³';
ALTER TABLE "AggregateOutgoing" ADD COLUMN IF NOT EXISTS "unit_price" DOUBLE PRECISION DEFAULT 0;
ALTER TABLE "AggregateOutgoing" ADD COLUMN IF NOT EXISTS "total_price" DOUBLE PRECISION DEFAULT 0;
ALTER TABLE "AggregateOutgoing" ADD COLUMN IF NOT EXISTS "transport_mode" TEXT DEFAULT 'BUYER';
ALTER TABLE "AggregateOutgoing" ADD COLUMN IF NOT EXISTS "vehicleId" TEXT;
ALTER TABLE "AggregateOutgoing" ADD COLUMN IF NOT EXISTS "driverId" TEXT;
ALTER TABLE "AggregateOutgoing" ADD COLUMN IF NOT EXISTS "dump_truck_size" TEXT;
ALTER TABLE "AggregateOutgoing" ADD COLUMN IF NOT EXISTS "distance_km" DOUBLE PRECISION;
ALTER TABLE "AggregateOutgoing" ADD COLUMN IF NOT EXISTS "rate_price" DOUBLE PRECISION;
ALTER TABLE "AggregateOutgoing" ADD COLUMN IF NOT EXISTS "retase_amount" DOUBLE PRECISION;
ALTER TABLE "AggregateOutgoing" ADD COLUMN IF NOT EXISTS "is_retase_paid" BOOLEAN NOT NULL DEFAULT false;

-- Indexes
CREATE INDEX IF NOT EXISTS "AggregateOutgoing_category_idx" ON "AggregateOutgoing"("category");
CREATE INDEX IF NOT EXISTS "AggregateOutgoing_vehicleId_idx" ON "AggregateOutgoing"("vehicleId");
CREATE INDEX IF NOT EXISTS "AggregateOutgoing_driverId_idx" ON "AggregateOutgoing"("driverId");

-- Foreign Keys
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'AggregateOutgoing_vehicleId_fkey'
    ) THEN
        ALTER TABLE "AggregateOutgoing" ADD CONSTRAINT "AggregateOutgoing_vehicleId_fkey" 
        FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'AggregateOutgoing_driverId_fkey'
    ) THEN
        ALTER TABLE "AggregateOutgoing" ADD CONSTRAINT "AggregateOutgoing_driverId_fkey" 
        FOREIGN KEY ("driverId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;
