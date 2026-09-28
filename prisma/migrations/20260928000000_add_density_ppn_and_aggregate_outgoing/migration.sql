-- AlterTable ConcreteQuality: Add Material Density / Berat Jenis (Kg/m3)
ALTER TABLE "ConcreteQuality" ADD COLUMN IF NOT EXISTS "density_sand" DOUBLE PRECISION DEFAULT 1400;
ALTER TABLE "ConcreteQuality" ADD COLUMN IF NOT EXISTS "density_stone_05" DOUBLE PRECISION DEFAULT 1400;
ALTER TABLE "ConcreteQuality" ADD COLUMN IF NOT EXISTS "density_stone_12" DOUBLE PRECISION DEFAULT 1450;
ALTER TABLE "ConcreteQuality" ADD COLUMN IF NOT EXISTS "density_stone_23" DOUBLE PRECISION DEFAULT 1450;

-- AlterTable SewaTransaction: Add PPN Configuration
ALTER TABLE "SewaTransaction" ADD COLUMN IF NOT EXISTS "is_ppn" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "SewaTransaction" ADD COLUMN IF NOT EXISTS "ppn_mode" TEXT NOT NULL DEFAULT 'NON_PPN';
ALTER TABLE "SewaTransaction" ADD COLUMN IF NOT EXISTS "ppn_rate" DOUBLE PRECISION DEFAULT 11;
ALTER TABLE "SewaTransaction" ADD COLUMN IF NOT EXISTS "dpp_amount" DOUBLE PRECISION DEFAULT 0;
ALTER TABLE "SewaTransaction" ADD COLUMN IF NOT EXISTS "ppn_amount" DOUBLE PRECISION DEFAULT 0;

-- CreateTable AggregateOutgoing
CREATE TABLE IF NOT EXISTS "AggregateOutgoing" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "no_bon" TEXT,
    "aggregate_type" "AggregateType" NOT NULL,
    "volume_cubic" DOUBLE PRECISION NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'PENJUALAN',
    "recipient" TEXT,
    "plate_number" TEXT,
    "driver_name" TEXT,
    "notes" TEXT,
    "locationId" TEXT NOT NULL,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AggregateOutgoing_pkey" PRIMARY KEY ("id")
);

-- Indexes for AggregateOutgoing
CREATE INDEX IF NOT EXISTS "AggregateOutgoing_date_idx" ON "AggregateOutgoing"("date");
CREATE INDEX IF NOT EXISTS "AggregateOutgoing_locationId_date_idx" ON "AggregateOutgoing"("locationId", "date");
CREATE INDEX IF NOT EXISTS "AggregateOutgoing_aggregate_type_idx" ON "AggregateOutgoing"("aggregate_type");

-- Foreign key for AggregateOutgoing
DO $$ BEGIN
    ALTER TABLE "AggregateOutgoing" ADD CONSTRAINT "AggregateOutgoing_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;
