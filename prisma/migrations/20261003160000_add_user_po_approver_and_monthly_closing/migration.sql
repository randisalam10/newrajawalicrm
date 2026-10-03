-- ============================================================
-- Migration: 20261003160000_add_user_po_approver_and_monthly_closing
-- 1. User: isPoApprover & poApproverRole
-- 2. ClosingStatus Enum & MonthlyClosing Table
-- All statements are safe and idempotent (IF NOT EXISTS)
-- ============================================================

-- ─── 1. User: PO Approver Fields ─────────────────────────────────────────────
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "isPoApprover" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "poApproverRole" TEXT DEFAULT 'FVP';

-- ─── 2. ClosingStatus Enum ───────────────────────────────────────────────────
DO $$ BEGIN
    CREATE TYPE "ClosingStatus" AS ENUM ('OPEN', 'CLOSED');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- ─── 3. MonthlyClosing Table ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "MonthlyClosing" (
    "id" TEXT NOT NULL,
    "closingKey" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "locationId" TEXT,
    "status" "ClosingStatus" NOT NULL DEFAULT 'CLOSED',
    "closedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedById" TEXT NOT NULL,
    "totalVolume" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalRevenue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalCogs" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalGrossProfit" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalOverhead" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalNetProfit" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "semenCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "pasirCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "split12Cost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "split23Cost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "solarCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "retaseCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "maintenanceCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "snapshotData" JSONB NOT NULL,
    "notes" TEXT,
    "reopenedAt" TIMESTAMP(3),
    "reopenedById" TEXT,
    "reopenReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MonthlyClosing_pkey" PRIMARY KEY ("id")
);

-- ─── 4. MonthlyClosing Indexes ────────────────────────────────────────────────
CREATE UNIQUE INDEX IF NOT EXISTS "MonthlyClosing_closingKey_key" ON "MonthlyClosing"("closingKey");
CREATE INDEX IF NOT EXISTS "MonthlyClosing_period_idx" ON "MonthlyClosing"("period");
CREATE INDEX IF NOT EXISTS "MonthlyClosing_locationId_idx" ON "MonthlyClosing"("locationId");
CREATE INDEX IF NOT EXISTS "MonthlyClosing_status_idx" ON "MonthlyClosing"("status");

-- ─── 5. MonthlyClosing Foreign Keys ──────────────────────────────────────────
DO $$ BEGIN
    ALTER TABLE "MonthlyClosing" ADD CONSTRAINT "MonthlyClosing_locationId_fkey" 
        FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "MonthlyClosing" ADD CONSTRAINT "MonthlyClosing_closedById_fkey" 
        FOREIGN KEY ("closedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "MonthlyClosing" ADD CONSTRAINT "MonthlyClosing_reopenedById_fkey" 
        FOREIGN KEY ("reopenedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;
