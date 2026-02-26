-- CreateEnum
CREATE TYPE "Role" AS ENUM ('SuperAdminBP', 'AdminBP', 'OperatorBP');

-- CreateEnum
CREATE TYPE "Position" AS ENUM ('Sopir', 'Operator', 'Admin');

-- CreateEnum
CREATE TYPE "EmployeeStatus" AS ENUM ('Active', 'Inactive');

-- CreateEnum
CREATE TYPE "VehicleType" AS ENUM ('Mixer', 'Loader');

-- CreateEnum
CREATE TYPE "CustomerStatus" AS ENUM ('Active', 'Inactive');

-- CreateEnum
CREATE TYPE "TransactionStatus" AS ENUM ('Pending', 'Confirmed');

-- CreateEnum
CREATE TYPE "MaterialType" AS ENUM ('Semen', 'Pasir');

-- CreateTable
CREATE TABLE "Location" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Location_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Employee" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "position" "Position" NOT NULL,
    "status" "EmployeeStatus" NOT NULL DEFAULT 'Active',
    "join_date" TIMESTAMP(3) NOT NULL,
    "locationId" TEXT,

    CONSTRAINT "Employee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "employeeId" TEXT NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vehicle" (
    "id" TEXT NOT NULL,
    "plate_number" TEXT NOT NULL,
    "vehicle_type" "VehicleType" NOT NULL,
    "code" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,

    CONSTRAINT "Vehicle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Customer" (
    "id" TEXT NOT NULL,
    "customer_name" TEXT NOT NULL,
    "project_name" TEXT NOT NULL,
    "default_distance" DOUBLE PRECISION NOT NULL,
    "tax_ppn" DOUBLE PRECISION NOT NULL,
    "address" TEXT NOT NULL,
    "status" "CustomerStatus" NOT NULL DEFAULT 'Active',
    "locationId" TEXT NOT NULL,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkItem" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,

    CONSTRAINT "WorkItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConcreteQuality" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "composition_sand" DOUBLE PRECISION NOT NULL,
    "composition_stone_05" DOUBLE PRECISION NOT NULL,
    "composition_stone_12" DOUBLE PRECISION NOT NULL,
    "composition_stone_23" DOUBLE PRECISION NOT NULL,
    "composition_cement" DOUBLE PRECISION NOT NULL,
    "locationId" TEXT NOT NULL,

    CONSTRAINT "ConcreteQuality_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductionTransaction" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "qualityId" TEXT NOT NULL,
    "workItemId" TEXT NOT NULL,
    "volume_cubic" DOUBLE PRECISION NOT NULL,
    "slump" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "cumulative_volume" DOUBLE PRECISION NOT NULL,
    "trip_sequence" INTEGER NOT NULL DEFAULT 1,
    "status" "TransactionStatus" NOT NULL DEFAULT 'Pending',
    "createdById" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,

    CONSTRAINT "ProductionTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MaterialIncoming" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "material_type" "MaterialType" NOT NULL,
    "name" TEXT NOT NULL,
    "supplier" TEXT NOT NULL,
    "tonnage" DOUBLE PRECISION NOT NULL,
    "delivery_note" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,

    CONSTRAINT "MaterialIncoming_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Retase" (
    "id" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "calculated_distance" DOUBLE PRECISION NOT NULL,
    "volume" DOUBLE PRECISION NOT NULL,
    "price_per_cubic_km" DOUBLE PRECISION NOT NULL,
    "income_amount" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "Retase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RetaseSetting" (
    "id" TEXT NOT NULL,
    "price_per_cubic_km" DOUBLE PRECISION NOT NULL,
    "locationId" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RetaseSetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "recordId" TEXT NOT NULL,
    "old_values" TEXT,
    "new_values" TEXT,
    "userId" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Location_name_key" ON "Location"("name");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User_employeeId_key" ON "User"("employeeId");

-- CreateIndex
CREATE UNIQUE INDEX "Vehicle_plate_number_key" ON "Vehicle"("plate_number");

-- CreateIndex
CREATE UNIQUE INDEX "WorkItem_name_key" ON "WorkItem"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Retase_transactionId_key" ON "Retase"("transactionId");

-- CreateIndex
CREATE UNIQUE INDEX "RetaseSetting_locationId_key" ON "RetaseSetting"("locationId");

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vehicle" ADD CONSTRAINT "Vehicle_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Customer" ADD CONSTRAINT "Customer_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkItem" ADD CONSTRAINT "WorkItem_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConcreteQuality" ADD CONSTRAINT "ConcreteQuality_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductionTransaction" ADD CONSTRAINT "ProductionTransaction_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductionTransaction" ADD CONSTRAINT "ProductionTransaction_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductionTransaction" ADD CONSTRAINT "ProductionTransaction_qualityId_fkey" FOREIGN KEY ("qualityId") REFERENCES "ConcreteQuality"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductionTransaction" ADD CONSTRAINT "ProductionTransaction_workItemId_fkey" FOREIGN KEY ("workItemId") REFERENCES "WorkItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductionTransaction" ADD CONSTRAINT "ProductionTransaction_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductionTransaction" ADD CONSTRAINT "ProductionTransaction_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductionTransaction" ADD CONSTRAINT "ProductionTransaction_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaterialIncoming" ADD CONSTRAINT "MaterialIncoming_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Retase" ADD CONSTRAINT "Retase_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "ProductionTransaction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Retase" ADD CONSTRAINT "Retase_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RetaseSetting" ADD CONSTRAINT "RetaseSetting_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
