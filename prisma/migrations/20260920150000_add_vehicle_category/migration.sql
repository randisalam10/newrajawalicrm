-- CreateTable VehicleCategory
CREATE TABLE IF NOT EXISTS "VehicleCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "description" TEXT,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VehicleCategory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "VehicleCategory_name_key" ON "VehicleCategory"("name");

-- AlterTable Vehicle
ALTER TABLE "Vehicle" ADD COLUMN IF NOT EXISTS "categoryId" TEXT;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Vehicle_categoryId_idx" ON "Vehicle"("categoryId");

-- AddForeignKey
DO $$ BEGIN
    ALTER TABLE "Vehicle" ADD CONSTRAINT "Vehicle_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "VehicleCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Seed Default Vehicle Categories
INSERT INTO "VehicleCategory" ("id", "name", "code", "description", "isSystem", "updatedAt")
VALUES
    (gen_random_uuid()::TEXT, 'Truck Mixer', 'MX', 'Truk Molen / Pengaduk & Pengangkut Beton Cor', true, CURRENT_TIMESTAMP),
    (gen_random_uuid()::TEXT, 'Wheel Loader', 'LD', 'Alat Berat Loader Pengisi Hopper Agregat Plant', true, CURRENT_TIMESTAMP),
    (gen_random_uuid()::TEXT, 'Dump Truck', 'DT', 'Truk Jungkit Pengangkut Material Pasir & Batu Pecah', true, CURRENT_TIMESTAMP),
    (gen_random_uuid()::TEXT, 'Concrete Pump', 'CP', 'Pompa Beton Cor (Boom Pump / Pompa Kodok)', true, CURRENT_TIMESTAMP),
    (gen_random_uuid()::TEXT, 'Mobil Operasional', 'OPS', 'Kendaraan Pickup, Double Cabin, & Mobil Dinas Plant', true, CURRENT_TIMESTAMP),
    (gen_random_uuid()::TEXT, 'Genset & Alat Berat', 'HV', 'Genset Daya, Excavator, & Alat Mekanikal', true, CURRENT_TIMESTAMP),
    (gen_random_uuid()::TEXT, 'Sepeda Motor', 'MTR', 'Sepeda Motor Operasional Lapangan & Kurir', true, CURRENT_TIMESTAMP)
ON CONFLICT ("name") DO NOTHING;

-- Associate existing vehicles with corresponding default categories if categoryId is null
UPDATE "Vehicle"
SET "categoryId" = (SELECT "id" FROM "VehicleCategory" WHERE "name" = 'Truck Mixer' LIMIT 1)
WHERE "categoryId" IS NULL AND "vehicle_type" = 'Mixer';

UPDATE "Vehicle"
SET "categoryId" = (SELECT "id" FROM "VehicleCategory" WHERE "name" = 'Wheel Loader' LIMIT 1)
WHERE "categoryId" IS NULL AND "vehicle_type" = 'Loader';
