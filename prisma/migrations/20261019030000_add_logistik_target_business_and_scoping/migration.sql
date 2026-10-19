-- Migration: 20261019030000_add_logistik_target_business_and_scoping

-- 1. Create Enum LogistikBusinessUnit
DO $$ BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'LogistikBusinessUnit') THEN 
        CREATE TYPE "LogistikBusinessUnit" AS ENUM ('BP', 'CRUSHER', 'ALL'); 
    END IF; 
END $$;

-- 2. Alter Supplier: target_business, is_global, locationId
ALTER TABLE "Supplier" ADD COLUMN IF NOT EXISTS "target_business" "LogistikBusinessUnit" NOT NULL DEFAULT 'ALL';
ALTER TABLE "Supplier" ADD COLUMN IF NOT EXISTS "is_global" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Supplier" ADD COLUMN IF NOT EXISTS "locationId" TEXT;

DO $$ BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Supplier_locationId_fkey') THEN 
        ALTER TABLE "Supplier" ADD CONSTRAINT "Supplier_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE SET NULL ON UPDATE CASCADE; 
    END IF; 
END $$;

CREATE INDEX IF NOT EXISTS "Supplier_locationId_idx" ON "Supplier"("locationId");
CREATE INDEX IF NOT EXISTS "Supplier_is_global_idx" ON "Supplier"("is_global");
CREATE INDEX IF NOT EXISTS "Supplier_target_business_idx" ON "Supplier"("target_business");

-- 3. Alter MasterItem: target_business, is_global, locationId
ALTER TABLE "MasterItem" ADD COLUMN IF NOT EXISTS "target_business" "LogistikBusinessUnit" NOT NULL DEFAULT 'ALL';
ALTER TABLE "MasterItem" ADD COLUMN IF NOT EXISTS "is_global" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "MasterItem" ADD COLUMN IF NOT EXISTS "locationId" TEXT;

DO $$ BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'MasterItem_locationId_fkey') THEN 
        ALTER TABLE "MasterItem" ADD CONSTRAINT "MasterItem_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE SET NULL ON UPDATE CASCADE; 
    END IF; 
END $$;

CREATE INDEX IF NOT EXISTS "MasterItem_locationId_idx" ON "MasterItem"("locationId");
CREATE INDEX IF NOT EXISTS "MasterItem_is_global_idx" ON "MasterItem"("is_global");
CREATE INDEX IF NOT EXISTS "MasterItem_target_business_idx" ON "MasterItem"("target_business");

-- 4. Many-to-Many: _SupplierSharedLocations
CREATE TABLE IF NOT EXISTS "_SupplierSharedLocations" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "_SupplierSharedLocations_AB_unique" ON "_SupplierSharedLocations"("A", "B");
CREATE INDEX IF NOT EXISTS "_SupplierSharedLocations_B_index" ON "_SupplierSharedLocations"("B");

DO $$ BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_SupplierSharedLocations_A_fkey') THEN 
        ALTER TABLE "_SupplierSharedLocations" ADD CONSTRAINT "_SupplierSharedLocations_A_fkey" FOREIGN KEY ("A") REFERENCES "Location"("id") ON DELETE CASCADE ON UPDATE CASCADE; 
    END IF; 
END $$;

DO $$ BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_SupplierSharedLocations_B_fkey') THEN 
        ALTER TABLE "_SupplierSharedLocations" ADD CONSTRAINT "_SupplierSharedLocations_B_fkey" FOREIGN KEY ("B") REFERENCES "Supplier"("id") ON DELETE CASCADE ON UPDATE CASCADE; 
    END IF; 
END $$;

-- 5. Many-to-Many: _MasterItemSharedLocations
CREATE TABLE IF NOT EXISTS "_MasterItemSharedLocations" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "_MasterItemSharedLocations_AB_unique" ON "_MasterItemSharedLocations"("A", "B");
CREATE INDEX IF NOT EXISTS "_MasterItemSharedLocations_B_index" ON "_MasterItemSharedLocations"("B");

DO $$ BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_MasterItemSharedLocations_A_fkey') THEN 
        ALTER TABLE "_MasterItemSharedLocations" ADD CONSTRAINT "_MasterItemSharedLocations_A_fkey" FOREIGN KEY ("A") REFERENCES "Location"("id") ON DELETE CASCADE ON UPDATE CASCADE; 
    END IF; 
END $$;

DO $$ BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_MasterItemSharedLocations_B_fkey') THEN 
        ALTER TABLE "_MasterItemSharedLocations" ADD CONSTRAINT "_MasterItemSharedLocations_B_fkey" FOREIGN KEY ("B") REFERENCES "MasterItem"("id") ON DELETE CASCADE ON UPDATE CASCADE; 
    END IF; 
END $$;
