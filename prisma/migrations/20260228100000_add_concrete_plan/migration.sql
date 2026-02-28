-- CreateEnum
CREATE TYPE "PlanStatus" AS ENUM ('Planned', 'OnGoing', 'Done', 'Cancelled');

-- CreateTable
CREATE TABLE "ConcretePlan" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "projectId" TEXT NOT NULL,
    "qualityId" TEXT NOT NULL,
    "workItemId" TEXT NOT NULL,
    "volume_plan" DOUBLE PRECISION NOT NULL,
    "notes" TEXT,
    "status" "PlanStatus" NOT NULL DEFAULT 'Planned',
    "locationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConcretePlan_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ConcretePlan" ADD CONSTRAINT "ConcretePlan_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConcretePlan" ADD CONSTRAINT "ConcretePlan_qualityId_fkey" FOREIGN KEY ("qualityId") REFERENCES "ConcreteQuality"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConcretePlan" ADD CONSTRAINT "ConcretePlan_workItemId_fkey" FOREIGN KEY ("workItemId") REFERENCES "WorkItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConcretePlan" ADD CONSTRAINT "ConcretePlan_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
