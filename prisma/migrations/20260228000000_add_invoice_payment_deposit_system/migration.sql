-- ============================================================
-- Migration: Full schema update from init
-- Covers:
--   1. Alter Customer table (drop project_name, default_distance, tax_ppn)
--   2. Create Project + ProjectPrice tables
--   3. Migrate existing Customer data → Project (auto-create 1 project per customer)
--   4. Add projectId to ProductionTransaction, migrate from customerId
--   5. Drop old customerId FK from ProductionTransaction
--   6. Add Invoice system (Invoice, InvoiceItem, Payment, Deposit, BillingLog)
-- ============================================================

-- ── 1. New Enums ──────────────────────────────────────────────────────────────

CREATE TYPE "InvoiceStatus" AS ENUM ('DRAFT', 'ISSUED', 'PARTIAL', 'PAID', 'CANCELLED');
CREATE TYPE "PaymentMethod" AS ENUM ('TRANSFER', 'CASH', 'GIRO', 'DEPOSIT');
CREATE TYPE "BillingAction" AS ENUM ('INVOICE_CREATED', 'INVOICE_ISSUED', 'INVOICE_CANCELLED', 'PAYMENT_RECORDED', 'DEPOSIT_ADDED', 'DEPOSIT_USED');

-- ── 2. Alter Customer table ────────────────────────────────────────────────────
-- Remove old columns that are now on Project

-- Drop old FK constraint from ProductionTransaction first (references Customer)
ALTER TABLE "ProductionTransaction" DROP CONSTRAINT IF EXISTS "ProductionTransaction_customerId_fkey";

ALTER TABLE "Customer" DROP COLUMN IF EXISTS "project_name";
ALTER TABLE "Customer" DROP COLUMN IF EXISTS "default_distance";
ALTER TABLE "Customer" DROP COLUMN IF EXISTS "tax_ppn";

-- ── 3. Create Project table ────────────────────────────────────────────────────

CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "default_distance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "tax_ppn" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "customerId" TEXT NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Project" ADD CONSTRAINT "Project_customerId_fkey"
    FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ── 4. Create ProjectPrice table ───────────────────────────────────────────────

CREATE TABLE "ProjectPrice" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "qualityId" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "ProjectPrice_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ProjectPrice_projectId_qualityId_key" ON "ProjectPrice"("projectId", "qualityId");

ALTER TABLE "ProjectPrice" ADD CONSTRAINT "ProjectPrice_projectId_fkey"
    FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ProjectPrice" ADD CONSTRAINT "ProjectPrice_qualityId_fkey"
    FOREIGN KEY ("qualityId") REFERENCES "ConcreteQuality"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ── 5. Migrate existing Customer data → Project ────────────────────────────────
-- For each existing customer, create a default Project named "Default Project"
-- with the customer's address

INSERT INTO "Project" ("id", "name", "address", "default_distance", "tax_ppn", "customerId")
SELECT
    gen_random_uuid()::TEXT,
    'Default Project',
    "address",
    0,
    0,
    "id"
FROM "Customer";

-- ── 6. Add projectId to ProductionTransaction ──────────────────────────────────

ALTER TABLE "ProductionTransaction" ADD COLUMN "projectId" TEXT;

-- Assign each transaction to the default project of its customer
UPDATE "ProductionTransaction" pt
SET "projectId" = (
    SELECT p."id"
    FROM "Project" p
    WHERE p."customerId" = pt."customerId"
    LIMIT 1
);

-- Make projectId NOT NULL after populating
ALTER TABLE "ProductionTransaction" ALTER COLUMN "projectId" SET NOT NULL;

-- Add FK constraint for projectId
ALTER TABLE "ProductionTransaction" ADD CONSTRAINT "ProductionTransaction_projectId_fkey"
    FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Drop old customerId column from ProductionTransaction
ALTER TABLE "ProductionTransaction" DROP COLUMN IF EXISTS "customerId";

-- ── 7. Invoice table ───────────────────────────────────────────────────────────

CREATE TABLE "Invoice" (
    "id" TEXT NOT NULL,
    "invoice_number" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "issue_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "due_date" TIMESTAMP(3),
    "period_start" TIMESTAMP(3),
    "period_end" TIMESTAMP(3),
    "status" "InvoiceStatus" NOT NULL DEFAULT 'DRAFT',
    "include_ppn" BOOLEAN NOT NULL DEFAULT true,
    "subtotal" DOUBLE PRECISION NOT NULL,
    "tax_amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total_amount" DOUBLE PRECISION NOT NULL,
    "paid_amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "notes" TEXT,
    "locationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Invoice_invoice_number_key" ON "Invoice"("invoice_number");

ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_projectId_fkey"
    FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_locationId_fkey"
    FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ── 8. InvoiceItem table ───────────────────────────────────────────────────────

CREATE TABLE "InvoiceItem" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "unit_price" DOUBLE PRECISION NOT NULL,
    "subtotal" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "InvoiceItem_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "InvoiceItem_transactionId_key" ON "InvoiceItem"("transactionId");

ALTER TABLE "InvoiceItem" ADD CONSTRAINT "InvoiceItem_invoiceId_fkey"
    FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "InvoiceItem" ADD CONSTRAINT "InvoiceItem_transactionId_fkey"
    FOREIGN KEY ("transactionId") REFERENCES "ProductionTransaction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ── 9. Payment table ───────────────────────────────────────────────────────────

CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "payment_date" TIMESTAMP(3) NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "method" "PaymentMethod" NOT NULL,
    "reference_no" TEXT,
    "proof_url" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Payment" ADD CONSTRAINT "Payment_invoiceId_fkey"
    FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ── 10. Deposit table ──────────────────────────────────────────────────────────

CREATE TABLE "Deposit" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "amount" DOUBLE PRECISION NOT NULL,
    "description" TEXT NOT NULL,
    "reference" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Deposit_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Deposit" ADD CONSTRAINT "Deposit_projectId_fkey"
    FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ── 11. BillingLog table ───────────────────────────────────────────────────────

CREATE TABLE "BillingLog" (
    "id" TEXT NOT NULL,
    "action" "BillingAction" NOT NULL,
    "invoiceId" TEXT,
    "paymentId" TEXT,
    "actorId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BillingLog_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "BillingLog" ADD CONSTRAINT "BillingLog_invoiceId_fkey"
    FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "BillingLog" ADD CONSTRAINT "BillingLog_paymentId_fkey"
    FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
