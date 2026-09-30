-- AlterTable: Add custom_material_name to AggregateIncoming and AggregateOutgoing
ALTER TABLE "AggregateIncoming" ADD COLUMN IF NOT EXISTS "custom_material_name" TEXT;
ALTER TABLE "AggregateOutgoing" ADD COLUMN IF NOT EXISTS "custom_material_name" TEXT;
