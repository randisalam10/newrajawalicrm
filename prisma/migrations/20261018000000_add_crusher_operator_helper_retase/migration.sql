-- Migration: 20261018000000_add_crusher_operator_helper_retase
-- Add Helper to enum Position
ALTER TYPE "Position" ADD VALUE IF NOT EXISTS 'Helper';

-- =========================================================================
-- 1. Base Stone Crusher Tables (Idempotent: CREATE TABLE IF NOT EXISTS)
-- =========================================================================

-- CrusherMaterialSource
CREATE TABLE IF NOT EXISTS "CrusherMaterialSource" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "default_distance_km" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "locationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CrusherMaterialSource_pkey" PRIMARY KEY ("id")
);

DO $$ BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'CrusherMaterialSource_locationId_fkey') THEN 
        ALTER TABLE "CrusherMaterialSource" ADD CONSTRAINT "CrusherMaterialSource_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE CASCADE ON UPDATE CASCADE; 
    END IF; 
END $$;

CREATE INDEX IF NOT EXISTS "CrusherMaterialSource_locationId_idx" ON "CrusherMaterialSource"("locationId");
CREATE INDEX IF NOT EXISTS "CrusherMaterialSource_isActive_idx" ON "CrusherMaterialSource"("isActive");

-- CrusherDailyReport
CREATE TABLE IF NOT EXISTS "CrusherDailyReport" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "locationId" TEXT NOT NULL,
    "hm_start" DOUBLE PRECISION NOT NULL,
    "hm_end" DOUBLE PRECISION NOT NULL,
    "total_hm" DOUBLE PRECISION NOT NULL,
    "hm_notes" TEXT,
    "sunny_from" TEXT,
    "sunny_to" TEXT,
    "rain_from" TEXT,
    "rain_to" TEXT,
    "weather_notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'SUBMITTED',
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CrusherDailyReport_pkey" PRIMARY KEY ("id")
);

DO $$ BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'CrusherDailyReport_locationId_fkey') THEN 
        ALTER TABLE "CrusherDailyReport" ADD CONSTRAINT "CrusherDailyReport_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE CASCADE ON UPDATE CASCADE; 
    END IF; 
END $$;

DO $$ BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'CrusherDailyReport_createdById_fkey') THEN 
        ALTER TABLE "CrusherDailyReport" ADD CONSTRAINT "CrusherDailyReport_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE; 
    END IF; 
END $$;

CREATE INDEX IF NOT EXISTS "CrusherDailyReport_date_idx" ON "CrusherDailyReport"("date");
CREATE INDEX IF NOT EXISTS "CrusherDailyReport_locationId_idx" ON "CrusherDailyReport"("locationId");
CREATE INDEX IF NOT EXISTS "CrusherDailyReport_status_idx" ON "CrusherDailyReport"("status");
CREATE UNIQUE INDEX IF NOT EXISTS "CrusherDailyReport_locationId_date_key" ON "CrusherDailyReport"("locationId", "date");

-- CrusherReportEditLog
CREATE TABLE IF NOT EXISTS "CrusherReportEditLog" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "changes" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CrusherReportEditLog_pkey" PRIMARY KEY ("id")
);

DO $$ BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'CrusherReportEditLog_reportId_fkey') THEN 
        ALTER TABLE "CrusherReportEditLog" ADD CONSTRAINT "CrusherReportEditLog_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "CrusherDailyReport"("id") ON DELETE CASCADE ON UPDATE CASCADE; 
    END IF; 
END $$;

DO $$ BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'CrusherReportEditLog_userId_fkey') THEN 
        ALTER TABLE "CrusherReportEditLog" ADD CONSTRAINT "CrusherReportEditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE; 
    END IF; 
END $$;

CREATE INDEX IF NOT EXISTS "CrusherReportEditLog_reportId_idx" ON "CrusherReportEditLog"("reportId");
CREATE INDEX IF NOT EXISTS "CrusherReportEditLog_userId_idx" ON "CrusherReportEditLog"("userId");
CREATE INDEX IF NOT EXISTS "CrusherReportEditLog_createdAt_idx" ON "CrusherReportEditLog"("createdAt");

-- CrusherDowntime
CREATE TABLE IF NOT EXISTS "CrusherDowntime" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "start_time" TEXT NOT NULL,
    "end_time" TEXT NOT NULL,
    "total_hours" DOUBLE PRECISION NOT NULL,
    "problem_desc" TEXT NOT NULL,
    "action_taken" TEXT,

    CONSTRAINT "CrusherDowntime_pkey" PRIMARY KEY ("id")
);

DO $$ BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'CrusherDowntime_reportId_fkey') THEN 
        ALTER TABLE "CrusherDowntime" ADD CONSTRAINT "CrusherDowntime_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "CrusherDailyReport"("id") ON DELETE CASCADE ON UPDATE CASCADE; 
    END IF; 
END $$;

CREATE INDEX IF NOT EXISTS "CrusherDowntime_reportId_idx" ON "CrusherDowntime"("reportId");

-- CrusherFuelLog
CREATE TABLE IF NOT EXISTS "CrusherFuelLog" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "unit_name" TEXT NOT NULL,
    "unit_category" TEXT NOT NULL,
    "vehicleId" TEXT,
    "liters" DOUBLE PRECISION NOT NULL,
    "current_hm" DOUBLE PRECISION,
    "current_km" DOUBLE PRECISION,
    "work_hours" DOUBLE PRECISION,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CrusherFuelLog_pkey" PRIMARY KEY ("id")
);

DO $$ BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'CrusherFuelLog_reportId_fkey') THEN 
        ALTER TABLE "CrusherFuelLog" ADD CONSTRAINT "CrusherFuelLog_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "CrusherDailyReport"("id") ON DELETE CASCADE ON UPDATE CASCADE; 
    END IF; 
END $$;

DO $$ BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'CrusherFuelLog_vehicleId_fkey') THEN 
        ALTER TABLE "CrusherFuelLog" ADD CONSTRAINT "CrusherFuelLog_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE SET NULL ON UPDATE CASCADE; 
    END IF; 
END $$;

CREATE INDEX IF NOT EXISTS "CrusherFuelLog_reportId_idx" ON "CrusherFuelLog"("reportId");
CREATE INDEX IF NOT EXISTS "CrusherFuelLog_unit_name_idx" ON "CrusherFuelLog"("unit_name");
CREATE INDEX IF NOT EXISTS "CrusherFuelLog_vehicleId_idx" ON "CrusherFuelLog"("vehicleId");

-- CrusherMaterialIn
CREATE TABLE IF NOT EXISTS "CrusherMaterialIn" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "feed_type" TEXT NOT NULL,
    "vehicleId" TEXT,
    "plate_number" TEXT NOT NULL,
    "driverId" TEXT,
    "driver_name" TEXT NOT NULL,
    "sourceId" TEXT,
    "source_name" TEXT NOT NULL,
    "distance_km" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "ritase" INTEGER NOT NULL,
    "volume_m3" DOUBLE PRECISION,
    "rate_price" DOUBLE PRECISION NOT NULL DEFAULT 4500,
    "retase_amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "is_paid" BOOLEAN NOT NULL DEFAULT false,
    "paid_date" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CrusherMaterialIn_pkey" PRIMARY KEY ("id")
);

DO $$ BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'CrusherMaterialIn_reportId_fkey') THEN 
        ALTER TABLE "CrusherMaterialIn" ADD CONSTRAINT "CrusherMaterialIn_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "CrusherDailyReport"("id") ON DELETE CASCADE ON UPDATE CASCADE; 
    END IF; 
END $$;

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

DO $$ BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'CrusherMaterialIn_sourceId_fkey') THEN 
        ALTER TABLE "CrusherMaterialIn" ADD CONSTRAINT "CrusherMaterialIn_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "CrusherMaterialSource"("id") ON DELETE SET NULL ON UPDATE CASCADE; 
    END IF; 
END $$;

CREATE INDEX IF NOT EXISTS "CrusherMaterialIn_reportId_idx" ON "CrusherMaterialIn"("reportId");
CREATE INDEX IF NOT EXISTS "CrusherMaterialIn_plate_number_idx" ON "CrusherMaterialIn"("plate_number");
CREATE INDEX IF NOT EXISTS "CrusherMaterialIn_sourceId_idx" ON "CrusherMaterialIn"("sourceId");
CREATE INDEX IF NOT EXISTS "CrusherMaterialIn_feed_type_idx" ON "CrusherMaterialIn"("feed_type");
CREATE INDEX IF NOT EXISTS "CrusherMaterialIn_driverId_idx" ON "CrusherMaterialIn"("driverId");
CREATE INDEX IF NOT EXISTS "CrusherMaterialIn_vehicleId_idx" ON "CrusherMaterialIn"("vehicleId");
CREATE INDEX IF NOT EXISTS "CrusherMaterialIn_is_paid_idx" ON "CrusherMaterialIn"("is_paid");

-- CrusherMaterialOut
CREATE TABLE IF NOT EXISTS "CrusherMaterialOut" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "material_name" TEXT NOT NULL,
    "volume_m3" DOUBLE PRECISION NOT NULL,
    "vehicleId" TEXT,
    "plate_number" TEXT,
    "driverId" TEXT,
    "driver_name" TEXT,
    "dump_truck_size" TEXT,
    "ritase" INTEGER NOT NULL DEFAULT 1,
    "distance_km" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "retase_rate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "retase_amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "is_retase_paid" BOOLEAN NOT NULL DEFAULT false,
    "paid_retase_date" TIMESTAMP(3),
    "operatorId" TEXT,
    "operator_name" TEXT,
    "operator_rate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "operator_fee" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "is_operator_paid" BOOLEAN NOT NULL DEFAULT false,
    "destination_type" TEXT NOT NULL DEFAULT 'BATCHING_PLANT',
    "targetLocationId" TEXT,
    "is_received_by_bp" BOOLEAN NOT NULL DEFAULT false,
    "aggregateIncomingId" TEXT,
    "receipt_status" TEXT NOT NULL DEFAULT 'PENDING',
    "receivedAt" TIMESTAMP(3),
    "receivedById" TEXT,
    "destinationId" TEXT,
    "customer_name" TEXT,
    "unit_price" DOUBLE PRECISION DEFAULT 0,
    "total_price" DOUBLE PRECISION DEFAULT 0,
    "payment_method" TEXT,
    "payment_status" TEXT DEFAULT 'LUNAS',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CrusherMaterialOut_pkey" PRIMARY KEY ("id")
);

DO $$ BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'CrusherMaterialOut_reportId_fkey') THEN 
        ALTER TABLE "CrusherMaterialOut" ADD CONSTRAINT "CrusherMaterialOut_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "CrusherDailyReport"("id") ON DELETE CASCADE ON UPDATE CASCADE; 
    END IF; 
END $$;

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

DO $$ BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'CrusherMaterialOut_targetLocationId_fkey') THEN 
        ALTER TABLE "CrusherMaterialOut" ADD CONSTRAINT "CrusherMaterialOut_targetLocationId_fkey" FOREIGN KEY ("targetLocationId") REFERENCES "Location"("id") ON DELETE SET NULL ON UPDATE CASCADE; 
    END IF; 
END $$;

CREATE INDEX IF NOT EXISTS "CrusherMaterialOut_reportId_idx" ON "CrusherMaterialOut"("reportId");
CREATE INDEX IF NOT EXISTS "CrusherMaterialOut_destination_type_idx" ON "CrusherMaterialOut"("destination_type");
CREATE INDEX IF NOT EXISTS "CrusherMaterialOut_targetLocationId_idx" ON "CrusherMaterialOut"("targetLocationId");
CREATE INDEX IF NOT EXISTS "CrusherMaterialOut_material_name_idx" ON "CrusherMaterialOut"("material_name");
CREATE INDEX IF NOT EXISTS "CrusherMaterialOut_vehicleId_idx" ON "CrusherMaterialOut"("vehicleId");
CREATE INDEX IF NOT EXISTS "CrusherMaterialOut_driverId_idx" ON "CrusherMaterialOut"("driverId");
CREATE INDEX IF NOT EXISTS "CrusherMaterialOut_operatorId_idx" ON "CrusherMaterialOut"("operatorId");
CREATE INDEX IF NOT EXISTS "CrusherMaterialOut_receipt_status_idx" ON "CrusherMaterialOut"("receipt_status");
CREATE INDEX IF NOT EXISTS "CrusherMaterialOut_is_retase_paid_idx" ON "CrusherMaterialOut"("is_retase_paid");

-- =========================================================================
-- 2. OperatorWorkLog table
-- =========================================================================

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

-- =========================================================================
-- 3. Incremental Alter Columns (for pre-existing tables if any)
-- =========================================================================

-- CrusherFuelLog
ALTER TABLE "CrusherFuelLog" ADD COLUMN IF NOT EXISTS "vehicleId" TEXT;

-- CrusherMaterialIn
ALTER TABLE "CrusherMaterialIn" ADD COLUMN IF NOT EXISTS "vehicleId" TEXT;
ALTER TABLE "CrusherMaterialIn" ADD COLUMN IF NOT EXISTS "driverId" TEXT;
ALTER TABLE "CrusherMaterialIn" ADD COLUMN IF NOT EXISTS "rate_price" DOUBLE PRECISION NOT NULL DEFAULT 4500;
ALTER TABLE "CrusherMaterialIn" ADD COLUMN IF NOT EXISTS "retase_amount" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "CrusherMaterialIn" ADD COLUMN IF NOT EXISTS "is_paid" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "CrusherMaterialIn" ADD COLUMN IF NOT EXISTS "paid_date" TIMESTAMP(3);

-- CrusherMaterialOut
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
