-- CreateTable: MasterMaterial
CREATE TABLE IF NOT EXISTS "MasterMaterial" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'AGREGAT',
    "unit" TEXT NOT NULL DEFAULT 'm³',
    "defaultDensity" DOUBLE PRECISION,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MasterMaterial_pkey" PRIMARY KEY ("id")
);

-- CreateTable: MaterialPriceHistory
CREATE TABLE IF NOT EXISTS "MaterialPriceHistory" (
    "id" TEXT NOT NULL,
    "materialId" TEXT NOT NULL,
    "material_code" TEXT NOT NULL,
    "material_name" TEXT NOT NULL,
    "price_per_m3" DOUBLE PRECISION NOT NULL,
    "effective_date" TIMESTAMP(3) NOT NULL,
    "locationId" TEXT,
    "old_price" DOUBLE PRECISION DEFAULT 0,
    "notes" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MaterialPriceHistory_pkey" PRIMARY KEY ("id")
);

-- Unique index
CREATE UNIQUE INDEX IF NOT EXISTS "MasterMaterial_code_key" ON "MasterMaterial"("code");

-- Indexes
CREATE INDEX IF NOT EXISTS "MasterMaterial_code_idx" ON "MasterMaterial"("code");
CREATE INDEX IF NOT EXISTS "MasterMaterial_isActive_idx" ON "MasterMaterial"("isActive");

CREATE INDEX IF NOT EXISTS "MaterialPriceHistory_materialId_effective_date_idx" ON "MaterialPriceHistory"("materialId", "effective_date");
CREATE INDEX IF NOT EXISTS "MaterialPriceHistory_material_code_effective_date_idx" ON "MaterialPriceHistory"("material_code", "effective_date");
CREATE INDEX IF NOT EXISTS "MaterialPriceHistory_locationId_effective_date_idx" ON "MaterialPriceHistory"("locationId", "effective_date");

-- Foreign Keys
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'MaterialPriceHistory_materialId_fkey'
    ) THEN
        ALTER TABLE "MaterialPriceHistory" ADD CONSTRAINT "MaterialPriceHistory_materialId_fkey" 
        FOREIGN KEY ("materialId") REFERENCES "MasterMaterial"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'MaterialPriceHistory_locationId_fkey'
    ) THEN
        ALTER TABLE "MaterialPriceHistory" ADD CONSTRAINT "MaterialPriceHistory_locationId_fkey" 
        FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'MaterialPriceHistory_createdById_fkey'
    ) THEN
        ALTER TABLE "MaterialPriceHistory" ADD CONSTRAINT "MaterialPriceHistory_createdById_fkey" 
        FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;
