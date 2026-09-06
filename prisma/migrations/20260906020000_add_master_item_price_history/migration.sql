-- CreateTable MasterItemPriceHistory
CREATE TABLE IF NOT EXISTS "MasterItemPriceHistory" (
    "id" TEXT NOT NULL,
    "masterItemId" TEXT NOT NULL,
    "oldPrice" DOUBLE PRECISION NOT NULL,
    "newPrice" DOUBLE PRECISION NOT NULL,
    "priceDiff" DOUBLE PRECISION NOT NULL,
    "percentage" DOUBLE PRECISION NOT NULL,
    "effectiveDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reason" TEXT,
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MasterItemPriceHistory_pkey" PRIMARY KEY ("id")
);

-- Foreign Keys
DO $$ BEGIN
    ALTER TABLE "MasterItemPriceHistory" ADD CONSTRAINT "MasterItemPriceHistory_masterItemId_fkey" FOREIGN KEY ("masterItemId") REFERENCES "MasterItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "MasterItemPriceHistory" ADD CONSTRAINT "MasterItemPriceHistory_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS "MasterItemPriceHistory_masterItemId_idx" ON "MasterItemPriceHistory"("masterItemId");
CREATE INDEX IF NOT EXISTS "MasterItemPriceHistory_effectiveDate_idx" ON "MasterItemPriceHistory"("effectiveDate");

-- Backfill initial baseline price history for existing MasterItems
INSERT INTO "MasterItemPriceHistory" ("id", "masterItemId", "oldPrice", "newPrice", "priceDiff", "percentage", "effectiveDate", "reason", "createdAt")
SELECT 
    gen_random_uuid()::TEXT,
    m."id",
    0,
    m."harga",
    m."harga",
    0,
    m."createdAt",
    'Harga awal pendaftaran barang',
    m."createdAt"
FROM "MasterItem" m
WHERE NOT EXISTS (
    SELECT 1 FROM "MasterItemPriceHistory" h WHERE h."masterItemId" = m."id"
);
