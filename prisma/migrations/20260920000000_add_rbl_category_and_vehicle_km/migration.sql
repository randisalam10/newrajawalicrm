-- CreateTable RblCategory
CREATE TABLE IF NOT EXISTS "RblCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "requireVehicleKm" BOOLEAN NOT NULL DEFAULT false,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RblCategory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "RblCategory_name_key" ON "RblCategory"("name");

-- AlterTable RblExpense
ALTER TABLE "RblExpense" ADD COLUMN IF NOT EXISTS "categoryId" TEXT;
ALTER TABLE "RblExpense" ADD COLUMN IF NOT EXISTS "vehicleId" TEXT;
ALTER TABLE "RblExpense" ADD COLUMN IF NOT EXISTS "kmMeter" DOUBLE PRECISION;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "RblExpense_categoryId_idx" ON "RblExpense"("categoryId");
CREATE INDEX IF NOT EXISTS "RblExpense_vehicleId_idx" ON "RblExpense"("vehicleId");

-- AddForeignKey
DO $$ BEGIN
    ALTER TABLE "RblExpense" ADD CONSTRAINT "RblExpense_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "RblCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "RblExpense" ADD CONSTRAINT "RblExpense_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Seed Default RBL Categories
INSERT INTO "RblCategory" ("id", "name", "description", "requireVehicleKm", "isSystem", "updatedAt")
VALUES
    (gen_random_uuid()::TEXT, 'BBM / Solar', 'Bahan bakar kendaraan & alat operasional (Mixer, Loader, Genset)', true, true, CURRENT_TIMESTAMP),
    (gen_random_uuid()::TEXT, 'Pelumas / Oli', 'Oli mesin, hidrolik, gemuk/grease armada & alat plant', true, true, CURRENT_TIMESTAMP),
    (gen_random_uuid()::TEXT, 'Konsumsi & Dapur', 'Makan lembur, air minum galon, konsumsi kru & tamu plant', false, true, CURRENT_TIMESTAMP),
    (gen_random_uuid()::TEXT, 'Pemeliharaan & Sparepart', 'Perbaikan kecil, baut, las, cuci truk, servis darurat', false, true, CURRENT_TIMESTAMP),
    (gen_random_uuid()::TEXT, 'ATK & Keperluan Kantor', 'Kertas bon, tinta printer, map, alat tulis kantor plant', false, true, CURRENT_TIMESTAMP),
    (gen_random_uuid()::TEXT, 'Listrik, Air & Internet', 'Token listrik PLN, air PDAM/tangki, kuota pulsa/WiFi cabang', false, true, CURRENT_TIMESTAMP),
    (gen_random_uuid()::TEXT, 'Keamanan & Kebersihan', 'Retribusi sampah, koordinasi keamanan lingkungan, sabun cuci', false, true, CURRENT_TIMESTAMP),
    (gen_random_uuid()::TEXT, 'Operasional Umum', 'Biaya tak terduga, fotokopi, parkir, pengeluaran umum lapangan', false, true, CURRENT_TIMESTAMP)
ON CONFLICT ("name") DO UPDATE SET
    "requireVehicleKm" = EXCLUDED."requireVehicleKm",
    "isSystem" = EXCLUDED."isSystem",
    "updatedAt" = CURRENT_TIMESTAMP;
