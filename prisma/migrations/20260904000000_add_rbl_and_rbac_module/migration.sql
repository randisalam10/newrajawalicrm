-- CreateEnum
DO $$ BEGIN
    CREATE TYPE "RoleScope" AS ENUM ('ALL_BRANCHES', 'OWN_BRANCH');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- CreateEnum
DO $$ BEGIN
    CREATE TYPE "RblStatus" AS ENUM ('OPEN', 'CLOSED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- AlterTable PoCompanyGroup
ALTER TABLE "PoCompanyGroup" ADD COLUMN IF NOT EXISTS "defaultCeoId" TEXT;
ALTER TABLE "PoCompanyGroup" ADD COLUMN IF NOT EXISTS "defaultFvpId" TEXT;

-- AlterTable PurchaseOrder
ALTER TABLE "PurchaseOrder" ADD COLUMN IF NOT EXISTS "ceoApprovedAt" TIMESTAMP(3);
ALTER TABLE "PurchaseOrder" ADD COLUMN IF NOT EXISTS "ceoId" TEXT;
ALTER TABLE "PurchaseOrder" ADD COLUMN IF NOT EXISTS "fvpApprovedAt" TIMESTAMP(3);
ALTER TABLE "PurchaseOrder" ADD COLUMN IF NOT EXISTS "fvpId" TEXT;

-- Safely convert User.role to TEXT and add roleId
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "roleId" TEXT;
DO $$ BEGIN
    ALTER TABLE "User" ALTER COLUMN "role" TYPE TEXT USING "role"::TEXT;
EXCEPTION
    WHEN others THEN null;
END $$;

-- CreateTable Role
CREATE TABLE IF NOT EXISTS "Role" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "scope" "RoleScope" NOT NULL DEFAULT 'OWN_BRANCH',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable Permission
CREATE TABLE IF NOT EXISTS "Permission" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "module" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "Permission_pkey" PRIMARY KEY ("id")
);

-- CreateTable RolePermission
CREATE TABLE IF NOT EXISTS "RolePermission" (
    "roleId" TEXT NOT NULL,
    "permissionId" TEXT NOT NULL,

    CONSTRAINT "RolePermission_pkey" PRIMARY KEY ("roleId","permissionId")
);

-- CreateTable RblBudget
CREATE TABLE IF NOT EXISTS "RblBudget" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "periodMonth" INTEGER NOT NULL,
    "periodYear" INTEGER NOT NULL,
    "receivedDate" TIMESTAMP(3) NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "notes" TEXT,
    "status" "RblStatus" NOT NULL DEFAULT 'OPEN',
    "closedAt" TIMESTAMP(3),
    "closedById" TEXT,
    "closeNotes" TEXT,
    "locationId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RblBudget_pkey" PRIMARY KEY ("id")
);

-- CreateTable RblExpense
CREATE TABLE IF NOT EXISTS "RblExpense" (
    "id" TEXT NOT NULL,
    "budgetId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "itemDescription" TEXT NOT NULL,
    "category" TEXT,
    "quantity" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "unit" TEXT NOT NULL DEFAULT 'Pcs',
    "unitPrice" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "amount" DOUBLE PRECISION NOT NULL,
    "receiptNo" TEXT,
    "notes" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RblExpense_pkey" PRIMARY KEY ("id")
);

-- CreateTable RblAttachment
CREATE TABLE IF NOT EXISTS "RblAttachment" (
    "id" TEXT NOT NULL,
    "budgetId" TEXT NOT NULL,
    "date" TIMESTAMP(3),
    "fileUrl" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileSize" INTEGER,
    "caption" TEXT,
    "uploadedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RblAttachment_pkey" PRIMARY KEY ("id")
);

-- Indexes
CREATE UNIQUE INDEX IF NOT EXISTS "Role_name_key" ON "Role"("name");
CREATE UNIQUE INDEX IF NOT EXISTS "Permission_code_key" ON "Permission"("code");
CREATE INDEX IF NOT EXISTS "Permission_module_idx" ON "Permission"("module");
CREATE UNIQUE INDEX IF NOT EXISTS "RblBudget_code_key" ON "RblBudget"("code");
CREATE INDEX IF NOT EXISTS "RblBudget_locationId_status_idx" ON "RblBudget"("locationId", "status");
CREATE INDEX IF NOT EXISTS "RblBudget_periodYear_periodMonth_idx" ON "RblBudget"("periodYear", "periodMonth");
CREATE INDEX IF NOT EXISTS "RblExpense_budgetId_date_idx" ON "RblExpense"("budgetId", "date");
CREATE INDEX IF NOT EXISTS "RblAttachment_budgetId_idx" ON "RblAttachment"("budgetId");

-- Foreign Keys
DO $$ BEGIN
    ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "Permission"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "User" ADD CONSTRAINT "User_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "PoCompanyGroup" ADD CONSTRAINT "PoCompanyGroup_defaultCeoId_fkey" FOREIGN KEY ("defaultCeoId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "PoCompanyGroup" ADD CONSTRAINT "PoCompanyGroup_defaultFvpId_fkey" FOREIGN KEY ("defaultFvpId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_ceoId_fkey" FOREIGN KEY ("ceoId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_fvpId_fkey" FOREIGN KEY ("fvpId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "RblBudget" ADD CONSTRAINT "RblBudget_closedById_fkey" FOREIGN KEY ("closedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "RblBudget" ADD CONSTRAINT "RblBudget_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "RblBudget" ADD CONSTRAINT "RblBudget_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "RblExpense" ADD CONSTRAINT "RblExpense_budgetId_fkey" FOREIGN KEY ("budgetId") REFERENCES "RblBudget"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "RblExpense" ADD CONSTRAINT "RblExpense_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "RblAttachment" ADD CONSTRAINT "RblAttachment_budgetId_fkey" FOREIGN KEY ("budgetId") REFERENCES "RblBudget"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "RblAttachment" ADD CONSTRAINT "RblAttachment_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;
