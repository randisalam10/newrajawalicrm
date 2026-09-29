-- AddColumn ppn_mode and ppn_rate to ProjectPrice
-- Default NON_PPN keeps backward compatibility (existing prices treated as no PPN)

ALTER TABLE "ProjectPrice" ADD COLUMN "ppn_mode" TEXT NOT NULL DEFAULT 'NON_PPN';
ALTER TABLE "ProjectPrice" ADD COLUMN "ppn_rate" DOUBLE PRECISION NOT NULL DEFAULT 11;
