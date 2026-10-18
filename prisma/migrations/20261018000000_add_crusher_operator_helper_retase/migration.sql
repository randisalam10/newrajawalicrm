-- Migration: 20261018000000_add_crusher_operator_helper_retase
-- Add Helper to enum Position
ALTER TYPE "Position" ADD VALUE IF NOT EXISTS 'Helper';

-- CrusherFuelLog relation to Vehicle
ALTER TABLE "CrusherFuelLog" ADD COLUMN IF NOT EXISTS "vehicleId" TEXT;
DO $$ BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'CrusherFuelLog_vehicleId_fkey') THEN 
        ALTER TABLE "CrusherFuelLog" ADD CONSTRAINT "CrusherFuelLog_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE SET NULL ON UPDATE CASCADE; 
    END IF; 
END $$;
CREATE INDEX IF NOT EXISTS "CrusherFuelLog_vehicleId_idx" ON "CrusherFuelLog"("vehicleId");

-- CrusherMaterialIn new fields & relations
ALTER TABLE "CrusherMaterialIn" ADD COLUMN IF NOT EXISTS "vehicleId" TEXT;
ALTER TABLE "CrusherMaterialIn" ADD COLUMN IF NOT EXISTS "driverId" TEXT;
ALTER TABLE "CrusherMaterialIn" ADD COLUMN IF NOT EXISTS "rate_price" DOUBLE PRECISION NOT NULL DEFAULT 4500;
ALTER TABLE "CrusherMaterialIn" ADD COLUMN IF NOT EXISTS "retase_amount" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "CrusherMaterialIn" ADD COLUMN IF NOT EXISTS "is_paid" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "CrusherMaterialIn" ADD COLUMN IF NOT EXISTS "paid_date" TIMESTAMP(3);

DO $$ BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'CrusherMaterialIn_vehicleId_fkey') THEN 
        ALTER TABLE "CrusherMaterialIn" ADD CONSTRAINT "CrusherMaterialIn_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE SET NULL ON UPDATE CASCADE; 
    END IF; 
END $$;

DO $$ BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'CrusherMaterialIn_driverId_fkey') THEN 
        ALTER TABLE "CrusherMaterialIn" ADD CONSTRAINT "CrusherMaterialIn_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE; 
    END IF; 
END $$;

CREATE INDEX IF NOT EXISTS "CrusherMaterialIn_driverId_idx" ON "CrusherMaterialIn"("driverId");
CREATE INDEX IF NOT EXISTS "CrusherMaterialIn_vehicleId_idx" ON "CrusherMaterialIn"("vehicleId");
CREATE INDEX IF NOT EXISTS "CrusherMaterialIn_is_paid_idx" ON "CrusherMaterialIn"("is_paid");

-- CrusherMaterialOut new fields & relations
ALTER TABLE "CrusherMaterialOut" ADD COLUMN IF NOT EXISTS "vehicleId" TEXT;
ALTER TABLE "CrusherMaterialOut" ADD COLUMN IF NOT EXISTS "driverId" TEXT;
ALTER TABLE "CrusherMaterialOut" ADD COLUMN IF NOT EXISTS "dump_truck_size" TEXT;
ALTER TABLE "CrusherMaterialOut" ADD COLUMN IF NOT EXISTS "ritase" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "CrusherMaterialOut" ADD COLUMN IF NOT EXISTS "distance_km" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "CrusherMaterialOut" ADD COLUMN IF NOT EXISTS "retase_rate" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "CrusherMaterialOut" ADD COLUMN IF NOT EXISTS "retase_amount" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "CrusherMaterialOut" ADD COLUMN IF NOT EXISTS "is_retase_paid" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "CrusherMaterialOut" ADD COLUMN IF NOT EXISTS "operatorId" TEXT;
ALTER TABLE "CrusherMaterialOut" ADD COLUMN IF NOT EXISTS "operator_name" TEXT;
ALTER TABLE "CrusherMaterialOut" ADD COLUMN IF NOT EXISTS "operator_rate" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "CrusherMaterialOut" ADD COLUMN IF NOT EXISTS "operator_fee" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "CrusherMaterialOut" ADD COLUMN IF NOT EXISTS "is_operator_paid" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "CrusherMaterialOut" ADD COLUMN IF NOT EXISTS "receipt_status" TEXT NOT NULL DEFAULT 'PENDING';
ALTER TABLE "CrusherMaterialOut" ADD COLUMN IF NOT EXISTS "receivedAt" TIMESTAMP(3);
ALTER TABLE "CrusherMaterialOut" ADD COLUMN IF NOT EXISTS "receivedById" TEXT;

DO $$ BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'CrusherMaterialOut_vehicleId_fkey') THEN 
        ALTER TABLE "CrusherMaterialOut" ADD CONSTRAINT "CrusherMaterialOut_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE SET NULL ON UPDATE CASCADE; 
    END IF; 
END $$;

DO $$ BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'CrusherMaterialOut_driverId_fkey') THEN 
        ALTER TABLE "CrusherMaterialOut" ADD CONSTRAINT "CrusherMaterialOut_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE; 
    END IF; 
END $$;

DO $$ BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'CrusherMaterialOut_operatorId_fkey') THEN 
        ALTER TABLE "CrusherMaterialOut" ADD CONSTRAINT "CrusherMaterialOut_operatorId_fkey" FOREIGN KEY ("operatorId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE; 
    END IF; 
END $$;

CREATE INDEX IF NOT EXISTS "CrusherMaterialOut_vehicleId_idx" ON "CrusherMaterialOut"("vehicleId");
CREATE INDEX IF NOT EXISTS "CrusherMaterialOut_driverId_idx" ON "CrusherMaterialOut"("driverId");
CREATE INDEX IF NOT EXISTS "CrusherMaterialOut_operatorId_idx" ON "CrusherMaterialOut"("operatorId");
CREATE INDEX IF NOT EXISTS "CrusherMaterialOut_receipt_status_idx" ON "CrusherMaterialOut"("receipt_status");

-- Create OperatorWorkLog table
CREATE TABLE IF NOT EXISTS "OperatorWorkLog" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "locationId" TEXT NOT NULL,
    "reportId" TEXT,
    "employeeId" TEXT NOT NULL,
    "employee_name" TEXT NOT NULL,
    "role_type" TEXT NOT NULL,
    "vehicleId" TEXT,
    "vehicle_code" TEXT,
    "hm_start" DOUBLE PRECISION,
    "hm_end" DOUBLE PRECISION,
    "work_hours_normal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "work_hours_overtime" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total_hours" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "rate_normal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "rate_overtime" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "fee_normal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "fee_overtime" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total_fee" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "incentiveRateId" TEXT,
    "is_paid" BOOLEAN NOT NULL DEFAULT false,
    "paid_date" TIMESTAMP(3),
    "notes" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OperatorWorkLog_pkey" PRIMARY KEY ("id")
);

DO $$ BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'OperatorWorkLog_locationId_fkey') THEN 
        ALTER TABLE "OperatorWorkLog" ADD CONSTRAINT "OperatorWorkLog_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE CASCADE ON UPDATE CASCADE; 
    END IF; 
END $$;

DO $$ BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'OperatorWorkLog_reportId_fkey') THEN 
        ALTER TABLE "OperatorWorkLog" ADD CONSTRAINT "OperatorWorkLog_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "CrusherDailyReport"("id") ON DELETE SET NULL ON UPDATE CASCADE; 
    END IF; 
END $$;

DO $$ BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'OperatorWorkLog_employeeId_fkey') THEN 
        ALTER TABLE "OperatorWorkLog" ADD CONSTRAINT "OperatorWorkLog_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE; 
    END IF; 
END $$;

DO $$ BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'OperatorWorkLog_vehicleId_fkey') THEN 
        ALTER TABLE "OperatorWorkLog" ADD CONSTRAINT "OperatorWorkLog_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE SET NULL ON UPDATE CASCADE; 
    END IF; 
END $$;

CREATE INDEX IF NOT EXISTS "OperatorWorkLog_locationId_date_idx" ON "OperatorWorkLog"("locationId", "date");
CREATE INDEX IF NOT EXISTS "OperatorWorkLog_employeeId_idx" ON "OperatorWorkLog"("employeeId");
CREATE INDEX IF NOT EXISTS "OperatorWorkLog_vehicleId_idx" ON "OperatorWorkLog"("vehicleId");
CREATE INDEX IF NOT EXISTS "OperatorWorkLog_role_type_idx" ON "OperatorWorkLog"("role_type");
CREATE INDEX IF NOT EXISTS "OperatorWorkLog_is_paid_idx" ON "OperatorWorkLog"("is_paid");
