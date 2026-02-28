-- CreateEnum
CREATE TYPE "AggregateSourceType" AS ENUM ('Internal', 'External');

-- CreateEnum
CREATE TYPE "AggregateType" AS ENUM ('SplitHalfOne', 'SplitTwoThree', 'Pasir', 'Other');

-- CreateTable
CREATE TABLE "AggregateIncoming" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "no_bon" TEXT NOT NULL,
    "driver_name" TEXT NOT NULL,
    "plate_number" TEXT NOT NULL,
    "volume_cubic" DOUBLE PRECISION NOT NULL,
    "aggregate_type" "AggregateType" NOT NULL,
    "source_type" "AggregateSourceType" NOT NULL,
    "supplier" TEXT,
    "notes" TEXT,
    "locationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AggregateIncoming_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "AggregateIncoming" ADD CONSTRAINT "AggregateIncoming_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
