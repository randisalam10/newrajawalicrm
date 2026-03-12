-- Add CEO and FVP to Role enum
DO $$ BEGIN
    ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'CEO';
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'FVP';
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add CEO and FVP to Position enum
DO $$ BEGIN
    ALTER TYPE "Position" ADD VALUE IF NOT EXISTS 'CEO';
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TYPE "Position" ADD VALUE IF NOT EXISTS 'FVP';
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add PIC fields and updatedAt to PurchaseOrder
ALTER TABLE "PurchaseOrder" ADD COLUMN IF NOT EXISTS "pic_name" TEXT;
ALTER TABLE "PurchaseOrder" ADD COLUMN IF NOT EXISTS "pic_phone" TEXT;
ALTER TABLE "PurchaseOrder" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3);
