-- Add cancel fields to Invoice
ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "cancel_reason" TEXT;
ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "cancelled_at" TIMESTAMP(3);

-- Add cancel fields to Payment
ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "is_cancelled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "cancel_reason" TEXT;
ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "cancelled_at" TIMESTAMP(3);

-- Add new BillingAction enum value (PostgreSQL requires this approach)
DO $$ BEGIN
    ALTER TYPE "BillingAction" ADD VALUE IF NOT EXISTS 'PAYMENT_CANCELLED';
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
