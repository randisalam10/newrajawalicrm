-- CreateEnum
CREATE TYPE "RetaseCalcMode" AS ENUM ('DISTANCE_ONLY', 'DISTANCE_AND_VOLUME');

-- AlterTable
ALTER TABLE "RetaseSetting" ADD COLUMN "calculation_mode" "RetaseCalcMode" NOT NULL DEFAULT 'DISTANCE_ONLY',
ADD COLUMN "effective_from" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "Retase" ADD COLUMN "calculation_mode" "RetaseCalcMode" DEFAULT 'DISTANCE_ONLY';
