-- AlterTable: Add unit_price and total_price to AggregateIncoming
ALTER TABLE "AggregateIncoming" ADD COLUMN IF NOT EXISTS "unit_price" DOUBLE PRECISION DEFAULT 0;
ALTER TABLE "AggregateIncoming" ADD COLUMN IF NOT EXISTS "total_price" DOUBLE PRECISION DEFAULT 0;
