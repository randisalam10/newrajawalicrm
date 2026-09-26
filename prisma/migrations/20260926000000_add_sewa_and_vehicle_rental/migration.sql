-- Safe, Non-Destructive Migration for Sewa & Vehicle Rental Integration
-- 1. DriverCategory
CREATE TABLE IF NOT EXISTS "DriverCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "description" TEXT,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DriverCategory_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "DriverCategory_name_key" ON "DriverCategory"("name");

-- 2. Alter Employee
ALTER TABLE "Employee" ADD COLUMN IF NOT EXISTS "driverCategoryId" TEXT;
CREATE INDEX IF NOT EXISTS "Employee_driverCategoryId_idx" ON "Employee"("driverCategoryId");

DO $$ BEGIN
    ALTER TABLE "Employee" ADD CONSTRAINT "Employee_driverCategoryId_fkey" FOREIGN KEY ("driverCategoryId") REFERENCES "DriverCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- 3. Alter Vehicle
ALTER TABLE "Vehicle" ADD COLUMN IF NOT EXISTS "meter_type" TEXT DEFAULT 'KM';
ALTER TABLE "Vehicle" ADD COLUMN IF NOT EXISTS "merk_model" TEXT;
ALTER TABLE "Vehicle" ADD COLUMN IF NOT EXISTS "is_for_rent" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Vehicle" ADD COLUMN IF NOT EXISTS "default_day_rate" DOUBLE PRECISION DEFAULT 0;
ALTER TABLE "Vehicle" ADD COLUMN IF NOT EXISTS "rental_status" TEXT DEFAULT 'Tersedia';
ALTER TABLE "Vehicle" ADD COLUMN IF NOT EXISTS "rental_notes" TEXT;

CREATE INDEX IF NOT EXISTS "Vehicle_is_for_rent_idx" ON "Vehicle"("is_for_rent");

-- 4. MasterSewaAlat
CREATE TABLE IF NOT EXISTS "MasterSewaAlat" (
    "id" TEXT NOT NULL,
    "kode_alat" TEXT NOT NULL,
    "nama_alat" TEXT NOT NULL,
    "kategori" TEXT NOT NULL,
    "merk_model" TEXT,
    "nomor_seri_plat" TEXT,
    "default_day_rate" DOUBLE PRECISION DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'Tersedia',
    "keterangan" TEXT,
    "locationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MasterSewaAlat_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "MasterSewaAlat_kode_alat_key" ON "MasterSewaAlat"("kode_alat");
CREATE INDEX IF NOT EXISTS "MasterSewaAlat_locationId_idx" ON "MasterSewaAlat"("locationId");
CREATE INDEX IF NOT EXISTS "MasterSewaAlat_kategori_idx" ON "MasterSewaAlat"("kategori");
CREATE INDEX IF NOT EXISTS "MasterSewaAlat_status_idx" ON "MasterSewaAlat"("status");

DO $$ BEGIN
    ALTER TABLE "MasterSewaAlat" ADD CONSTRAINT "MasterSewaAlat_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- 5. SewaTransaction
CREATE TABLE IF NOT EXISTS "SewaTransaction" (
    "id" TEXT NOT NULL,
    "sewa_number" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "customerId" TEXT NOT NULL,
    "projectId" TEXT,
    "lokasi_proyek" TEXT,
    "equipmentId" TEXT,
    "vehicleId" TEXT,
    "operatorId" TEXT NOT NULL,
    "date_mode" TEXT NOT NULL DEFAULT 'RANGE',
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "rental_dates" TEXT NOT NULL,
    "total_days" INTEGER NOT NULL,
    "price_per_day" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total_price" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'Active',
    "notes" TEXT,
    "locationId" TEXT NOT NULL,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SewaTransaction_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "SewaTransaction_sewa_number_key" ON "SewaTransaction"("sewa_number");
CREATE INDEX IF NOT EXISTS "SewaTransaction_date_idx" ON "SewaTransaction"("date");
CREATE INDEX IF NOT EXISTS "SewaTransaction_locationId_date_idx" ON "SewaTransaction"("locationId", "date");
CREATE INDEX IF NOT EXISTS "SewaTransaction_customerId_idx" ON "SewaTransaction"("customerId");
CREATE INDEX IF NOT EXISTS "SewaTransaction_equipmentId_idx" ON "SewaTransaction"("equipmentId");
CREATE INDEX IF NOT EXISTS "SewaTransaction_vehicleId_idx" ON "SewaTransaction"("vehicleId");
CREATE INDEX IF NOT EXISTS "SewaTransaction_operatorId_idx" ON "SewaTransaction"("operatorId");
CREATE INDEX IF NOT EXISTS "SewaTransaction_status_idx" ON "SewaTransaction"("status");

DO $$ BEGIN
    ALTER TABLE "SewaTransaction" ADD CONSTRAINT "SewaTransaction_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "SewaTransaction" ADD CONSTRAINT "SewaTransaction_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "SewaTransaction" ADD CONSTRAINT "SewaTransaction_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "MasterSewaAlat"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "SewaTransaction" ADD CONSTRAINT "SewaTransaction_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "SewaTransaction" ADD CONSTRAINT "SewaTransaction_operatorId_fkey" FOREIGN KEY ("operatorId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "SewaTransaction" ADD CONSTRAINT "SewaTransaction_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- 6. Alter Invoice
ALTER TABLE "Invoice" ALTER COLUMN "projectId" DROP NOT NULL;
ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "customerId" TEXT;
ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "invoice_type" TEXT NOT NULL DEFAULT 'READYMIX';
CREATE INDEX IF NOT EXISTS "Invoice_customerId_idx" ON "Invoice"("customerId");

DO $$ BEGIN
    ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Backfill customerId on existing invoices from project
UPDATE "Invoice" i
SET "customerId" = p."customerId"
FROM "Project" p
WHERE i."projectId" = p.id AND i."customerId" IS NULL;

-- 7. Alter InvoiceItem
ALTER TABLE "InvoiceItem" ALTER COLUMN "transactionId" DROP NOT NULL;
ALTER TABLE "InvoiceItem" ADD COLUMN IF NOT EXISTS "sewaTransactionId" TEXT;
ALTER TABLE "InvoiceItem" ADD COLUMN IF NOT EXISTS "description" TEXT;
ALTER TABLE "InvoiceItem" ADD COLUMN IF NOT EXISTS "item_type" TEXT NOT NULL DEFAULT 'READYMIX';

CREATE UNIQUE INDEX IF NOT EXISTS "InvoiceItem_sewaTransactionId_key" ON "InvoiceItem"("sewaTransactionId");
CREATE INDEX IF NOT EXISTS "InvoiceItem_sewaTransactionId_idx" ON "InvoiceItem"("sewaTransactionId");

DO $$ BEGIN
    ALTER TABLE "InvoiceItem" ADD CONSTRAINT "InvoiceItem_sewaTransactionId_fkey" FOREIGN KEY ("sewaTransactionId") REFERENCES "SewaTransaction"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- 8. Alter PurchaseOrder & PoItem
ALTER TABLE "PurchaseOrder" ADD COLUMN IF NOT EXISTS "vehicleId" TEXT;
CREATE INDEX IF NOT EXISTS "PurchaseOrder_vehicleId_idx" ON "PurchaseOrder"("vehicleId");

DO $$ BEGIN
    ALTER TABLE "PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

ALTER TABLE "PoItem" ADD COLUMN IF NOT EXISTS "vehicleId" TEXT;
ALTER TABLE "PoItem" ADD COLUMN IF NOT EXISTS "km_hm" TEXT;
CREATE INDEX IF NOT EXISTS "PoItem_vehicleId_idx" ON "PoItem"("vehicleId");

DO $$ BEGIN
    ALTER TABLE "PoItem" ADD CONSTRAINT "PoItem_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;
