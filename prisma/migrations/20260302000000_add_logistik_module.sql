-- CreateEnum
CREATE TYPE "PoPaymentMethod" AS ENUM ('CASH', 'CREDIT');

-- CreateEnum
CREATE TYPE "PurchaseOrderStatus" AS ENUM ('DRAFT', 'APPROVED', 'CANCELLED');

-- AlterEnum
ALTER TYPE "Position" ADD VALUE 'AdminLogistik';

-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'AdminLogistik';

-- AlterTable
ALTER TABLE "Project" ALTER COLUMN "default_distance" DROP DEFAULT,
ALTER COLUMN "tax_ppn" DROP DEFAULT;

-- CreateTable
CREATE TABLE "PoCompanyGroup" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "kode_cabang" TEXT NOT NULL,
    "kota" TEXT NOT NULL,
    "address" TEXT,
    "email" TEXT,
    "pimpinan_default" TEXT,
    "kepala_peralatan_default" TEXT,
    "jabatan_kepala_default" TEXT,
    "logo_url" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PoCompanyGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PoCompanyProject" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "kode_proyek" TEXT,
    "companyGroupId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PoCompanyProject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PoCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "kode_kategori" TEXT NOT NULL,
    "require_hm_km" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PoCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Supplier" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "contact" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Supplier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MasterItem" (
    "id" TEXT NOT NULL,
    "kode_barang" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "part_number" TEXT,
    "merk" TEXT,
    "satuan" TEXT NOT NULL,
    "harga" DOUBLE PRECISION NOT NULL,
    "supplierId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MasterItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurchaseOrder" (
    "id" TEXT NOT NULL,
    "po_number" TEXT NOT NULL,
    "tanggal_terbit" TIMESTAMP(3) NOT NULL,
    "companyGroupId" TEXT NOT NULL,
    "companyProjectId" TEXT,
    "categoryId" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "pimpinan" TEXT NOT NULL,
    "kepala_peralatan" TEXT NOT NULL,
    "jabatan_kepala" TEXT,
    "pembuat_admin" TEXT NOT NULL,
    "metode_pembayaran" "PoPaymentMethod" NOT NULL DEFAULT 'CREDIT',
    "km_hm_kendaraan" TEXT,
    "locationId" TEXT,
    "status" "PurchaseOrderStatus" NOT NULL DEFAULT 'DRAFT',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PurchaseOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PoItem" (
    "id" TEXT NOT NULL,
    "purchaseOrderId" TEXT NOT NULL,
    "masterItemId" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "harga_satuan" DOUBLE PRECISION NOT NULL,
    "keterangan" TEXT,
    "subtotal" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "PoItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_ProjectSharedLocations" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_CustomerSharedLocations" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "PoCategory_kode_kategori_key" ON "PoCategory"("kode_kategori");

-- CreateIndex
CREATE UNIQUE INDEX "MasterItem_kode_barang_key" ON "MasterItem"("kode_barang");

-- CreateIndex
CREATE UNIQUE INDEX "PurchaseOrder_po_number_key" ON "PurchaseOrder"("po_number");

-- CreateIndex
CREATE UNIQUE INDEX "_ProjectSharedLocations_AB_unique" ON "_ProjectSharedLocations"("A", "B");

-- CreateIndex
CREATE INDEX "_ProjectSharedLocations_B_index" ON "_ProjectSharedLocations"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_CustomerSharedLocations_AB_unique" ON "_CustomerSharedLocations"("A", "B");

-- CreateIndex
CREATE INDEX "_CustomerSharedLocations_B_index" ON "_CustomerSharedLocations"("B");

-- AddForeignKey
ALTER TABLE "PoCompanyProject" ADD CONSTRAINT "PoCompanyProject_companyGroupId_fkey" FOREIGN KEY ("companyGroupId") REFERENCES "PoCompanyGroup"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MasterItem" ADD CONSTRAINT "MasterItem_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MasterItem" ADD CONSTRAINT "MasterItem_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "PoCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_companyGroupId_fkey" FOREIGN KEY ("companyGroupId") REFERENCES "PoCompanyGroup"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "PoCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PoItem" ADD CONSTRAINT "PoItem_purchaseOrderId_fkey" FOREIGN KEY ("purchaseOrderId") REFERENCES "PurchaseOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PoItem" ADD CONSTRAINT "PoItem_masterItemId_fkey" FOREIGN KEY ("masterItemId") REFERENCES "MasterItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProjectSharedLocations" ADD CONSTRAINT "_ProjectSharedLocations_A_fkey" FOREIGN KEY ("A") REFERENCES "Location"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProjectSharedLocations" ADD CONSTRAINT "_ProjectSharedLocations_B_fkey" FOREIGN KEY ("B") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CustomerSharedLocations" ADD CONSTRAINT "_CustomerSharedLocations_A_fkey" FOREIGN KEY ("A") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CustomerSharedLocations" ADD CONSTRAINT "_CustomerSharedLocations_B_fkey" FOREIGN KEY ("B") REFERENCES "Location"("id") ON DELETE CASCADE ON UPDATE CASCADE;

