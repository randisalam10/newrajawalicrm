-- Performance Indexes Migration for Rajawali ERP
-- Safe, Idempotent (IF NOT EXISTS), Non-destructive

-- 1. ProductionTransaction
CREATE INDEX IF NOT EXISTS "ProductionTransaction_date_idx" ON "ProductionTransaction"("date");
CREATE INDEX IF NOT EXISTS "ProductionTransaction_locationId_date_idx" ON "ProductionTransaction"("locationId", "date");
CREATE INDEX IF NOT EXISTS "ProductionTransaction_projectId_idx" ON "ProductionTransaction"("projectId");
CREATE INDEX IF NOT EXISTS "ProductionTransaction_driverId_idx" ON "ProductionTransaction"("driverId");
CREATE INDEX IF NOT EXISTS "ProductionTransaction_status_idx" ON "ProductionTransaction"("status");
CREATE INDEX IF NOT EXISTS "ProductionTransaction_vehicleId_idx" ON "ProductionTransaction"("vehicleId");

-- 2. MaterialIncoming
CREATE INDEX IF NOT EXISTS "MaterialIncoming_date_idx" ON "MaterialIncoming"("date");
CREATE INDEX IF NOT EXISTS "MaterialIncoming_locationId_date_idx" ON "MaterialIncoming"("locationId", "date");
CREATE INDEX IF NOT EXISTS "MaterialIncoming_material_type_idx" ON "MaterialIncoming"("material_type");

-- 3. AggregateIncoming
CREATE INDEX IF NOT EXISTS "AggregateIncoming_date_idx" ON "AggregateIncoming"("date");
CREATE INDEX IF NOT EXISTS "AggregateIncoming_locationId_date_idx" ON "AggregateIncoming"("locationId", "date");
CREATE INDEX IF NOT EXISTS "AggregateIncoming_aggregate_type_idx" ON "AggregateIncoming"("aggregate_type");

-- 4. Retase
CREATE INDEX IF NOT EXISTS "Retase_driverId_idx" ON "Retase"("driverId");

-- 5. AuditLog
CREATE INDEX IF NOT EXISTS "AuditLog_entity_recordId_idx" ON "AuditLog"("entity", "recordId");
CREATE INDEX IF NOT EXISTS "AuditLog_timestamp_idx" ON "AuditLog"("timestamp");
CREATE INDEX IF NOT EXISTS "AuditLog_userId_idx" ON "AuditLog"("userId");

-- 6. Invoice
CREATE INDEX IF NOT EXISTS "Invoice_locationId_status_idx" ON "Invoice"("locationId", "status");
CREATE INDEX IF NOT EXISTS "Invoice_issue_date_idx" ON "Invoice"("issue_date");
CREATE INDEX IF NOT EXISTS "Invoice_projectId_idx" ON "Invoice"("projectId");
CREATE INDEX IF NOT EXISTS "Invoice_status_idx" ON "Invoice"("status");

-- 7. InvoiceItem
CREATE INDEX IF NOT EXISTS "InvoiceItem_invoiceId_idx" ON "InvoiceItem"("invoiceId");

-- 8. Payment
CREATE INDEX IF NOT EXISTS "Payment_invoiceId_idx" ON "Payment"("invoiceId");
CREATE INDEX IF NOT EXISTS "Payment_payment_date_idx" ON "Payment"("payment_date");
CREATE INDEX IF NOT EXISTS "Payment_is_cancelled_idx" ON "Payment"("is_cancelled");

-- 9. Deposit
CREATE INDEX IF NOT EXISTS "Deposit_projectId_idx" ON "Deposit"("projectId");
CREATE INDEX IF NOT EXISTS "Deposit_date_idx" ON "Deposit"("date");

-- 10. BillingLog
CREATE INDEX IF NOT EXISTS "BillingLog_invoiceId_idx" ON "BillingLog"("invoiceId");
CREATE INDEX IF NOT EXISTS "BillingLog_paymentId_idx" ON "BillingLog"("paymentId");
CREATE INDEX IF NOT EXISTS "BillingLog_createdAt_idx" ON "BillingLog"("createdAt");

-- 11. ConcretePlan
CREATE INDEX IF NOT EXISTS "ConcretePlan_date_idx" ON "ConcretePlan"("date");
CREATE INDEX IF NOT EXISTS "ConcretePlan_locationId_date_idx" ON "ConcretePlan"("locationId", "date");
CREATE INDEX IF NOT EXISTS "ConcretePlan_projectId_idx" ON "ConcretePlan"("projectId");
CREATE INDEX IF NOT EXISTS "ConcretePlan_status_idx" ON "ConcretePlan"("status");

-- 12. PurchaseOrder
CREATE INDEX IF NOT EXISTS "PurchaseOrder_locationId_idx" ON "PurchaseOrder"("locationId");
CREATE INDEX IF NOT EXISTS "PurchaseOrder_status_tanggal_terbit_idx" ON "PurchaseOrder"("status", "tanggal_terbit");
