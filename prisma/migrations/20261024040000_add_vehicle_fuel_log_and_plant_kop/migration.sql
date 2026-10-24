-- Migration: 20261024040000_add_vehicle_fuel_log_and_plant_kop

-- 1. AlterEnum RetaseCalcMode (Add PER_TRIP safely)
DO $$ BEGIN
    ALTER TYPE "RetaseCalcMode" ADD VALUE IF NOT EXISTS 'PER_TRIP';
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. AlterTable Location (Add Kop Surat and Official Identity Columns)
ALTER TABLE "Location" ADD COLUMN IF NOT EXISTS "company_name" TEXT;
ALTER TABLE "Location" ADD COLUMN IF NOT EXISTS "company_sub" TEXT;
ALTER TABLE "Location" ADD COLUMN IF NOT EXISTS "address" TEXT;
ALTER TABLE "Location" ADD COLUMN IF NOT EXISTS "phone" TEXT;
ALTER TABLE "Location" ADD COLUMN IF NOT EXISTS "email" TEXT;
ALTER TABLE "Location" ADD COLUMN IF NOT EXISTS "logo_url" TEXT;
ALTER TABLE "Location" ADD COLUMN IF NOT EXISTS "kop_footer" TEXT;

-- 3. AlterTable ProductionTransaction (Add Kop Snapshot)
ALTER TABLE "ProductionTransaction" ADD COLUMN IF NOT EXISTS "kop_snapshot" JSONB;

-- 4. AlterTable CrusherFuelLog (Add Fuel Source, Cost per Liter, RBL Link)
ALTER TABLE "CrusherFuelLog" ADD COLUMN IF NOT EXISTS "fuel_source" TEXT DEFAULT 'NON_RBL';
ALTER TABLE "CrusherFuelLog" ADD COLUMN IF NOT EXISTS "cost_per_liter" DOUBLE PRECISION DEFAULT 0;
ALTER TABLE "CrusherFuelLog" ADD COLUMN IF NOT EXISTS "total_cost" DOUBLE PRECISION DEFAULT 0;
ALTER TABLE "CrusherFuelLog" ADD COLUMN IF NOT EXISTS "rblExpenseId" TEXT;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'CrusherFuelLog_rblExpenseId_fkey') THEN
        ALTER TABLE "CrusherFuelLog" ADD CONSTRAINT "CrusherFuelLog_rblExpenseId_fkey" FOREIGN KEY ("rblExpenseId") REFERENCES "RblExpense"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

-- 5. CreateTable VehicleFuelLog
CREATE TABLE IF NOT EXISTS "VehicleFuelLog" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "locationId" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "driverId" TEXT,
    "driver_name" TEXT,
    "meter_type" TEXT NOT NULL DEFAULT 'KM',
    "current_meter" DOUBLE PRECISION NOT NULL,
    "last_meter" DOUBLE PRECISION,
    "meter_delta" DOUBLE PRECISION,
    "is_meter_reset" BOOLEAN NOT NULL DEFAULT false,
    "liters" DOUBLE PRECISION NOT NULL,
    "fuel_source" TEXT NOT NULL DEFAULT 'NON_RBL',
    "cost_per_liter" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total_cost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "rblExpenseId" TEXT,
    "receipt_no" TEXT,
    "notes" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VehicleFuelLog_pkey" PRIMARY KEY ("id")
);

-- 6. Create Indexes & Unique Constraints on VehicleFuelLog
CREATE UNIQUE INDEX IF NOT EXISTS "VehicleFuelLog_rblExpenseId_key" ON "VehicleFuelLog"("rblExpenseId");
CREATE INDEX IF NOT EXISTS "VehicleFuelLog_locationId_date_idx" ON "VehicleFuelLog"("locationId", "date");
CREATE INDEX IF NOT EXISTS "VehicleFuelLog_vehicleId_date_idx" ON "VehicleFuelLog"("vehicleId", "date");
CREATE INDEX IF NOT EXISTS "VehicleFuelLog_fuel_source_idx" ON "VehicleFuelLog"("fuel_source");

-- 7. Add Foreign Keys for VehicleFuelLog
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'VehicleFuelLog_locationId_fkey') THEN
        ALTER TABLE "VehicleFuelLog" ADD CONSTRAINT "VehicleFuelLog_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'VehicleFuelLog_vehicleId_fkey') THEN
        ALTER TABLE "VehicleFuelLog" ADD CONSTRAINT "VehicleFuelLog_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'VehicleFuelLog_driverId_fkey') THEN
        ALTER TABLE "VehicleFuelLog" ADD CONSTRAINT "VehicleFuelLog_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'VehicleFuelLog_rblExpenseId_fkey') THEN
        ALTER TABLE "VehicleFuelLog" ADD CONSTRAINT "VehicleFuelLog_rblExpenseId_fkey" FOREIGN KEY ("rblExpenseId") REFERENCES "RblExpense"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'VehicleFuelLog_createdById_fkey') THEN
        ALTER TABLE "VehicleFuelLog" ADD CONSTRAINT "VehicleFuelLog_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END $$;