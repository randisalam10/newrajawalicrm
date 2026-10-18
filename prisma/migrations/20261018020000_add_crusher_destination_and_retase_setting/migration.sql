-- Migration: 20261018020000_add_crusher_destination_and_retase_setting

-- CreateTable CrusherDestination
CREATE TABLE IF NOT EXISTS "CrusherDestination" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "distance_km" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "address" TEXT,
    "contact_person" TEXT,
    "phone" TEXT,
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "locationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CrusherDestination_pkey" PRIMARY KEY ("id")
);

-- CreateTable CrusherRetaseSetting
CREATE TABLE IF NOT EXISTS "CrusherRetaseSetting" (
    "id" TEXT NOT NULL,
    "locationId" TEXT,
    "formula_type" TEXT NOT NULL DEFAULT 'PER_KM_TIERED',
    "rate_dt_kecil" DOUBLE PRECISION NOT NULL DEFAULT 320,
    "rate_dt_besar" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "rate_per_km" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "rate_per_m3_km" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "rate_flat_rit" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "effective_date" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CrusherRetaseSetting_pkey" PRIMARY KEY ("id")
);

-- AlterTable CrusherMaterialOut
ALTER TABLE "CrusherMaterialOut" ADD COLUMN IF NOT EXISTS "destinationId" TEXT;
ALTER TABLE "CrusherMaterialOut" ADD COLUMN IF NOT EXISTS "paid_retase_date" TIMESTAMP(3);

-- AddForeignKey CrusherDestination
DO $$ BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'CrusherDestination_locationId_fkey') THEN 
        ALTER TABLE "CrusherDestination" ADD CONSTRAINT "CrusherDestination_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE CASCADE ON UPDATE CASCADE; 
    END IF; 
END $$;

-- AddForeignKey CrusherRetaseSetting
DO $$ BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'CrusherRetaseSetting_locationId_fkey') THEN 
        ALTER TABLE "CrusherRetaseSetting" ADD CONSTRAINT "CrusherRetaseSetting_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE CASCADE ON UPDATE CASCADE; 
    END IF; 
END $$;

-- AddForeignKey CrusherMaterialOut destinationId
DO $$ BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'CrusherMaterialOut_destinationId_fkey') THEN 
        ALTER TABLE "CrusherMaterialOut" ADD CONSTRAINT "CrusherMaterialOut_destinationId_fkey" FOREIGN KEY ("destinationId") REFERENCES "CrusherDestination"("id") ON DELETE SET NULL ON UPDATE CASCADE; 
    END IF; 
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS "CrusherDestination_locationId_idx" ON "CrusherDestination"("locationId");
CREATE INDEX IF NOT EXISTS "CrusherDestination_isActive_idx" ON "CrusherDestination"("isActive");
CREATE INDEX IF NOT EXISTS "CrusherDestination_name_idx" ON "CrusherDestination"("name");

CREATE INDEX IF NOT EXISTS "CrusherRetaseSetting_locationId_idx" ON "CrusherRetaseSetting"("locationId");
CREATE INDEX IF NOT EXISTS "CrusherRetaseSetting_isActive_idx" ON "CrusherRetaseSetting"("isActive");

CREATE INDEX IF NOT EXISTS "CrusherMaterialOut_destinationId_idx" ON "CrusherMaterialOut"("destinationId");
CREATE INDEX IF NOT EXISTS "CrusherMaterialOut_is_retase_paid_idx" ON "CrusherMaterialOut"("is_retase_paid");
