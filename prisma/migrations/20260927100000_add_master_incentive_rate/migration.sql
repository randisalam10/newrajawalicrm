-- CreateTable MasterIncentiveRate
CREATE TABLE IF NOT EXISTS "MasterIncentiveRate" (
    "id" TEXT NOT NULL,
    "nama_insentif" TEXT NOT NULL,
    "kategori_peran" TEXT NOT NULL,
    "formula_type" TEXT NOT NULL,
    "tarif_utama" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "tarif_sekunder" DOUBLE PRECISION DEFAULT 0,
    "locationId" TEXT,
    "effective_date" TIMESTAMP(3) NOT NULL,
    "keterangan" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MasterIncentiveRate_pkey" PRIMARY KEY ("id")
);

-- Indexes
CREATE INDEX IF NOT EXISTS "MasterIncentiveRate_kategori_peran_locationId_effective_date_idx" ON "MasterIncentiveRate"("kategori_peran", "locationId", "effective_date");
CREATE INDEX IF NOT EXISTS "MasterIncentiveRate_isActive_idx" ON "MasterIncentiveRate"("isActive");

-- Foreign key
DO $$ BEGIN
    ALTER TABLE "MasterIncentiveRate" ADD CONSTRAINT "MasterIncentiveRate_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;
