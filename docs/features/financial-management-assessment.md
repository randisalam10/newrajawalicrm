# 📊 FINANCIAL MANAGEMENT ASSESSMENT
## New Rajawali CRM — Existing Application Capability Review

> **Tanggal Assessment**: Oktober 2026  
> **Tujuan**: Memahami kapabilitas existing sebelum pengembangan Financial Management modul baru  
> **Metode**: Code review (Prisma Schema, Services, Types, Actions) — tanpa mengubah kode  

---

## SECTION 1 — RINGKASAN EKSEKUTIF

Aplikasi New Rajawali CRM saat ini telah memiliki fondasi finansial yang **cukup solid** di level operasional (transaksi produksi, invoice, payment, COGS aktual). Namun, terdapat **gap signifikan** di level strategic financial management: tidak ada model target keuangan formal, tidak ada profit & loss yang terintegrasi end-to-end, tidak ada cashflow projection, dan tidak ada financial period closing.

**Kesiapan per kategori:**

| Kategori | Status | Keterangan |
|---|---|---|
| Revenue Tracking | ✅ Ada | DPP + PPN via Invoice & ProductionTransaction |
| COGS Actual | ⚠️ Parsial | Estimasi formula + RBL; bukan actual per transaksi |
| Gross Profit | ⚠️ Parsial | Dihitung di laporan, bukan entitas tersimpan |
| Operating Profit | ❌ Belum ada | Overhead belum terintegrasi penuh ke P&L |
| Net Profit | ❌ Belum ada | Tidak ada entitas net profit |
| Target Revenue/Cost | ⚠️ Parsial | Hanya `OperationalTargetSetting` (unit economics per m³) |
| Cashflow | ⚠️ Parsial | Hanya payment received; tidak ada outflow tracking |
| Piutang (AR) | ✅ Ada | AR Aging dari Invoice + Payment |
| Hutang (AP) | ❌ Belum ada | Tidak ada AP/Hutang Dagang model |
| Profitability per BP | ⚠️ Parsial | Branch Benchmark ada tapi estimasi COGS, bukan aktual |
| Target Bulanan/Quarterly | ⚠️ Minimal | Hanya target volume & ASP per m³ |
| Target Tahunan | ❌ Belum ada | Tidak ada annual budget / RKAP |
| Financial Period Closing | ❌ Belum ada | Tidak ada mekanisme closing periode |

---

## SECTION 2 — PETA ENTITAS DATABASE EXISTING

### 2.1 Model Finansial yang Sudah Ada

```
REVENUE SIDE
├── Invoice              → Invoice header (subtotal, tax, total, status)
├── InvoiceItem          → Line item per transaksi/sewa
├── Payment              → Realisasi pembayaran pelanggan
├── Deposit              → Uang muka proyek
├── BillingLog           → Audit trail billing (immutable)
└── SewaTransaction      → Pendapatan sewa alat

COST SIDE
├── MaterialIncoming     → Penerimaan material (semen, pasir) + harga beli
├── AggregateIncoming    → Penerimaan agregat + retase DT
├── RblBudget            → Budget kas operasional cabang
├── RblExpense           → Realisasi pengeluaran kas cabang (BBM, dll)
├── PurchaseOrder        → Pengadaan logistik & sparepart
├── PoItem               → Detail item PO + harga satuan
├── FixedCostContract    → Kontrak beban tetap (sewa tanah, mess, dll)
├── VehicleComplianceRecord → Amortisasi pajak STNK & KIR kendaraan
└── Retase               → Upah sopir mixer per trip

PRODUCTION
├── ProductionTransaction → Transaksi produksi beton (volume, mutu)
├── ConcreteQuality      → Komposisi mutu + harga per proyek
└── ProjectPrice         → Harga jual per mutu per proyek (ppn_mode)

MASTER & SETTINGS
├── OperationalTargetSetting → Target unit economics per m³
├── MaterialPriceHistory    → Harga material per periode
└── MasterIncentiveRate     → Tarif insentif operator/sopir
```

### 2.2 Model Finansial yang BELUM Ada (Gap)

```
❌ FinancialTarget       → Target P&L bulanan/quarterly/semester/tahunan
❌ AccountsPayable       → Hutang dagang ke supplier
❌ BudgetPlan            → RKAP / Annual Budget per cost center
❌ ProfitLossStatement   → Entitas P&L tersimpan per periode
❌ CashflowStatement     → Proyeksi & realisasi arus kas
❌ FinancialPeriod       → Periode tutup buku
❌ CapexRecord           → Pencatatan belanja modal (CAPEX)
```

---

## SECTION 3 — ANALISIS 15 SCOPE FINANCIAL MANAGEMENT

### ① TARGET REVENUE

**Status**: ⚠️ **Parsial — ada target ASP, belum ada target revenue nominal**

- `OperationalTargetSetting.target_asp` → target harga jual rata-rata per m³ (Rp)
- `OperationalTargetSetting.target_monthly_volume` → target volume per bulan (m³)
- **Revenue target nominal** = target_asp × target_monthly_volume → **tidak disimpan sebagai field eksplisit**
- Tidak ada target revenue per customer segment, per jenis produk, atau per periode panjang

**Gap utama**: Tidak ada entitas `RevenueTarget` yang menyimpan target nominal bulanan/quarterly/tahunan secara mandiri.

---

### ② TARGET COST

**Status**: ⚠️ **Parsial — ada target cost per m³, belum ada budget total cost**

- `OperationalTargetSetting` memiliki target per komponen per m³:
  - `target_semen_cost`, `target_pasir_cost`, `target_split_cost`
  - `target_solar_cost`, `target_retase_cost`, `target_maintenance_cost`
  - `target_cogs` → total target HPP per m³
- Tidak ada target cost dalam nominal Rupiah total per bulan
- Tidak ada pemisahan target COGS vs target OPEX vs target fixed cost

**Gap utama**: Target cost hanya dalam unit cost (Rp/m³), tidak dalam total budget Rp.

---

### ③ TARGET GROSS PROFIT

**Status**: ⚠️ **Parsial — ada target gross profit per m³, belum ada target total Rp**

- `OperationalTargetSetting.target_gross_profit` → target laba kotor per m³
- Formula: `target_asp - target_cogs` → tersimpan di DB
- Total gross profit target = `target_gross_profit × target_monthly_volume` → **tidak disimpan**
- Tidak ada target gross margin % sebagai field tersendiri

---

### ④ TARGET OPERATING PROFIT

**Status**: ❌ **Belum ada**

- Aplikasi tidak memiliki konsep "Operating Profit" sebagai entitas tersimpan
- Overhead (RBL OPEX, Fixed Contracts, Vehicle Compliance) **dihitung di laporan saat itu** tapi tidak diperbandingkan dengan target
- Tidak ada model `OperatingProfitTarget`

---

### ⑤ TARGET NET PROFIT

**Status**: ❌ **Belum ada**

- Tidak ada model `NetProfitTarget`
- Tidak ada entitas yang merepresentasikan beban di bawah garis operating profit (pajak penghasilan PPh, beban bunga, dll)
- Net Profit = Operating Profit - Tax - Interest → **tidak dihitung sama sekali**

---

### ⑥ TARGET NET PROFIT MARGIN

**Status**: ❌ **Belum ada**

- Tidak ada field `target_net_margin_pct` di schema manapun
- Gross margin % dihitung di laporan dari data aktual, bukan diperbandingkan ke target %

---

### ⑦ CASHFLOW

**Status**: ⚠️ **Parsial — hanya cash inflow dari pelanggan**

**Yang sudah ada di `ScorecardData.cashflow`:**
```typescript
cashflow: {
    totalPaymentReceived: number    // ✅ Pembayaran masuk dari pelanggan
    paymentCount: number            // ✅ Jumlah transaksi bayar
    totalDepositReceived: number    // ✅ Deposit / uang muka masuk
    totalCashInflow: number         // ✅ Total kas masuk
    totalCashOutflow: number        // ⚠️ Hanya dari RBL Kas (kas kecil cabang)
    netOperatingCashflow: number    // ⚠️ Inflow - RBL Outflow (tidak akurat)
    cashCollectionRate: number      // ✅ % penerimaan atas invoice
}
```

**Gap utama**:
- `totalCashOutflow` hanya dari `RblExpense` (kas kecil) — **tidak mencakup** pembayaran PO/supplier
- Tidak ada model `CashflowForecast` atau `CashPosition`
- Tidak ada tracking kas bank per cabang
- Tidak ada pembayaran ke supplier/vendor sebagai outflow resmi
- Tidak ada cashflow projection (arus kas proyeksi)

---

### ⑧ PIUTANG / ACCOUNTS RECEIVABLE (AR)

**Status**: ✅ **Ada — paling lengkap dari semua scope**

Infrastruktur AR sudah cukup matang:
- `Invoice` model → status (DRAFT/ISSUED/PARTIAL/PAID/CANCELLED)
- `Payment` model → realisasi pembayaran per invoice
- `Invoice.paid_amount` → tracking saldo terbayar
- AR Aging sudah dihitung di `analytics-service.ts`:
  - Current (≤30 hari), 31-60 hari, >60 hari
- `BillingLog` → audit trail yang immutable
- `Deposit` → uang muka proyek (mengurangi AR efektif)

**Gap minor**:
- Tidak ada `write_off` / penghapusan piutang macet
- Tidak ada integrasi dengan AP (hutang dari supplier yang bisa di-offset)
- AR aging di-compute dari `due_date`, tapi tidak semua invoice memiliki `due_date` yang terisi

---

### ⑨ HUTANG / ACCOUNTS PAYABLE (AP)

**Status**: ❌ **Belum ada — gap terbesar**

- Tidak ada model `AccountsPayable` atau `SupplierInvoice`
- `PurchaseOrder` ada tapi tidak melacak status pembayaran ke supplier:
  - `PurchaseOrder.metode_pembayaran` → CASH/CREDIT (ada)
  - Tapi tidak ada field `amount_paid`, `payment_date`, `balance_due`
- Tidak ada AP aging
- Tidak ada tracking jatuh tempo hutang ke supplier

**Dampak**: Tidak bisa menghitung **Net Working Capital** (AR - AP) yang kritikal untuk manajemen keuangan.

---

### ⑩ PROFITABILITY BATCHING PLANT

**Status**: ⚠️ **Parsial — estimasi, bukan aktual per BP**

Di `analytics-service.ts`, `branchBenchmark` sudah ada:
```typescript
const branchBenchmark: BranchBenchmarkItem[] = allLocations.map(loc => {
    // Volume, Revenue, ASP per cabang → AKTUAL dari transaksi ✅
    // COGS per cabang → ESTIMASI dari unitDirectCostPerM3 global ❌
    // Margin per cabang → Tidak akurat karena COGS diestimasi ❌
    target: 2000,  // hardcoded ❌
    achievementPct: Math.round((vol / 2000) * 100), // target hardcoded ❌
})
```

**Gap utama**:
- COGS per cabang menggunakan **rate global**, bukan aktual per cabang
- Target volume per cabang `2000` m³ **hardcoded** (tidak dari `OperationalTargetSetting`)
- Tidak ada profitability per cabang yang disimpan (hanya dihitung on-the-fly)
- Tidak ada perbandingan profitability antar periode tersimpan

---

### ⑪ TARGET BULANAN

**Status**: ⚠️ **Ada tapi sangat terbatas**

Yang ada:
- `OperationalTargetSetting.target_monthly_volume` → target volume per bulan
- `OperationalTargetSetting.target_asp` → target ASP per m³

Yang belum ada:
- Target revenue nominal per bulan (dalam Rupiah)
- Target cost nominal per bulan
- Target profit nominal per bulan
- Tidak ada dimension waktu → setting ini berlaku "abadi", tidak per bulan spesifik

---

### ⑫ TARGET QUARTERLY

**Status**: ❌ **Belum ada**

- Tidak ada entitas quarterly target sama sekali
- Tidak ada aggregasi Q1/Q2/Q3/Q4 di schema manapun

---

### ⑬ TARGET SEMESTER

**Status**: ❌ **Belum ada**

- Tidak ada entitas semester target

---

### ⑭ TARGET TAHUNAN

**Status**: ❌ **Belum ada**

- Tidak ada `AnnualBudget` atau RKAP (Rencana Kerja Anggaran Perusahaan)
- Tidak ada model yang menyimpan target keuangan tahunan

---

### ⑮ FINANCIAL PERIOD CLOSING

**Status**: ❌ **Belum ada sama sekali**

- Tidak ada model `FinancialPeriod` atau `AccountingPeriod`
- Tidak ada status "OPEN" / "CLOSED" untuk periode akuntansi
- Tidak ada mekanisme lock transaksi setelah periode ditutup
- Tidak ada snapshot P&L tersimpan per periode

---

## SECTION 4 — ANALISIS PIPELINE KALKULASI EXISTING

### 4.1 Revenue Pipeline (Existing)

```
ProductionTransaction (confirmed)
    → calculateReadymixRevenue()
        → ProjectPrice.ppn_mode = NON_PPN | INCLUDE | EXCLUDE
        → Hitung DPP, PPN, Gross per transaksi
        → Group by Customer + Project + Quality
    → computeSewaDetailed() → Sewa alat prorated per bulan
    → AggregateOutgoing (PENJUALAN) → Revenue agregat komersial
    
Total DPP Revenue = Readymix DPP + Sewa DPP + Aggregate Revenue
Total PPN         = Readymix PPN + Sewa PPN
Total Gross       = DPP + PPN
```

> ✅ **Baik**: Revenue calculation sudah benar, mempertimbangkan ppn_mode dengan tepat

### 4.2 COGS Pipeline (Existing — Perlu Perhatian)

```
calculateDirectCogs():
    Semen Cost = Σ (volume × composition_cement × semenPricePerKg)
                 → semenPricePerKg dari weighted avg cementIncomings
                 → FALLBACK: Rp 2.020/kg (hardcoded default Jayapura)
    
    Pasir Cost = Σ (volume × 0.72 × pasirPricePerM3)
                 → 0.72 HARDCODED (tidak dari ConcreteQuality.composition_sand)
                 → pasirPricePerM3 dari MaterialPriceHistory atau default 95.000
    
    Split Cost = Σ (volume × 0.85 × splitPricePerM3)
                 → 0.85 HARDCODED (tidak dari formula mutu)
                 → splitPricePerM3 dari MaterialPriceHistory atau default 115.000
    
    BBM Cost   = Σ RblExpense (kategori BBM/Solar)
    Retase     = Σ Retase.income_amount + AggregateIncoming.retase_amount
    Maintenance = Σ PoItem (kategori SPR) + Σ RblExpense (bengkel)
```

> ⚠️ **Risiko**: Faktor pemakaian pasir (0.72) dan split (0.85) **hardcoded** — seharusnya dari `ConcreteQuality.composition_sand` dan `composition_stone_12/23`

### 4.3 Overhead Pipeline (Existing)

```
calculateOverheadAndAmortization():
    RBL OPEX (murni)        = RblExpense - BBM - Maintenance
    Fixed Contracts         = FixedCostContract.monthly_amount (by category)
    Vehicle Tax Amortization = Vehicle.annual_tax_cost / 12 atau ComplianceRecord
    Vehicle KIR Amortization = Vehicle.kir_cost / period_months
    
    Net Field Contribution  = Gross Profit - RBL OPEX - Fixed Contracts - Vehicle Compliance
```

> ✅ **Struktur bagus** tapi belum ada "Gaji Karyawan" sebagai beban tetap yang terintegrasi

---

## SECTION 5 — GAP ANALYSIS SUMMARY

### 5.1 Gap Kritikal (Harus Ada untuk Financial Management)

| # | Gap | Dampak |
|---|---|---|
| 1 | Tidak ada **AP (Hutang Dagang)** | Tidak bisa hitung Net Working Capital |
| 2 | Tidak ada **Financial Period Closing** | Data tidak bisa "dikunci" per periode |
| 3 | Tidak ada **Annual Budget / RKAP** | Target tahunan tidak bisa tracking |
| 4 | Tidak ada **Target P&L nominal** (bukan per m³) | Target vs Actual tidak bisa dibandingkan |
| 5 | **COGS formula hardcoded** (0.72 pasir, 0.85 split) | Tidak akurat untuk mutu yang berbeda |

### 5.2 Gap Penting (Perlu untuk Kelengkapan)

| # | Gap | Dampak |
|---|---|---|
| 6 | Target volume branch `2000` hardcoded di `analytics-service.ts` L.187 | Branch benchmark tidak akurat |
| 7 | Tidak ada tracking **kas bank per cabang** | Cashflow tidak bisa dihitung |
| 8 | Tidak ada **Net Profit** (PPh, bunga pinjaman) | P&L tidak lengkap |
| 9 | Tidak ada **AR Write-Off** mechanism | Piutang macet tidak bisa diselesaikan |
| 10 | `OperationalTargetSetting` tidak memiliki **dimensi waktu** (bulan/tahun) | Satu setting berlaku untuk semua periode |

### 5.3 Kekuatan yang Sudah Ada (Aset untuk Dikembangkan)

| # | Kekuatan | Potensi |
|---|---|---|
| 1 | `Invoice` + `Payment` + `BillingLog` yang lengkap | Fondasi AR yang solid |
| 2 | `OperationalTargetSetting` per cabang | Bisa diperluas ke target P&L |
| 3 | Multi-service architecture (revenue, cogs, overhead) | Bisa diperluas ke P&L service |
| 4 | `RblBudget` tracking budget vs realisasi | Pola yang sama bisa untuk budget keuangan |
| 5 | `FixedCostContract` dengan amortisasi bulanan | Overhead fixed sudah terstruktur |
| 6 | `MaterialPriceHistory` per cabang per periode | Harga material historis tersimpan |

---

## SECTION 6 — REKOMENDASI ENTITAS BARU

Berikut adalah entitas baru yang direkomendasikan untuk mendukung 15 scope Financial Management, diurutkan berdasarkan prioritas:

### PRIORITAS 1 — Fondasi (Kritis)

#### `FinancialTarget` (Baru)
```prisma
model FinancialTarget {
  id              String    @id @default(uuid())
  period_type     String    // "MONTHLY" | "QUARTERLY" | "SEMESTER" | "YEARLY"
  period_year     Int       // e.g. 2026
  period_value    Int       // Bulan (1-12), Kuartal (1-4), Semester (1-2), atau 0 untuk Yearly
  
  locationId      String?   // null = konsolidasi semua cabang
  
  // Revenue Targets
  target_volume_m3         Float  // Target produksi m³
  target_revenue_readymix  Float  // Target pendapatan readymix (Rp)
  target_revenue_sewa      Float  // Target pendapatan sewa (Rp)
  target_revenue_total     Float  // Target total pendapatan (Rp)
  
  // Cost Targets
  target_cogs_total        Float  // Target total HPP (Rp)
  target_opex_total        Float  // Target total OPEX (Rp)
  target_fixed_cost        Float  // Target beban tetap (Rp)
  
  // Profit Targets
  target_gross_profit      Float  // Target laba kotor (Rp)
  target_gross_margin_pct  Float  // Target gross margin (%)
  target_operating_profit  Float  // Target laba operasi (Rp)
  target_net_profit        Float  // Target laba bersih (Rp)
  target_net_margin_pct    Float  // Target net margin (%)
  
  notes           String?
  isApproved      Boolean   @default(false)
  approvedById    String?
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
}
```

#### `AccountsPayable` (Baru)
```prisma
model AccountsPayable {
  id              String    @id @default(uuid())
  ap_number       String    @unique
  vendor_name     String    
  description     String
  category        String    // "MATERIAL", "SPAREPART", "SEWA", "LAINNYA"
  
  purchaseOrderId String?   // Link ke PO (jika ada)
  
  invoice_date    DateTime
  due_date        DateTime
  total_amount    Float
  paid_amount     Float     @default(0)
  outstanding     Float     // total_amount - paid_amount
  
  status          String    @default("OUTSTANDING") // "OUTSTANDING" | "PARTIAL" | "PAID" | "OVERDUE"
  
  locationId      String?
  payments        ApPayment[]
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
}
```

#### `FinancialPeriod` (Baru)
```prisma
model FinancialPeriod {
  id          String    @id @default(uuid())
  period_year Int
  period_month Int      // 1-12
  status      String    @default("OPEN") // "OPEN" | "CLOSED" | "LOCKED"
  
  closed_at   DateTime?
  closed_by   String?
  notes       String?
  
  // Snapshot P&L saat closing
  snapshot    String?   // JSON: P&L summary tersimpan
  
  createdAt   DateTime  @default(now())
}
```

### PRIORITAS 2 — Kelengkapan Laporan

#### `CashflowRecord` (Baru)
```prisma
model CashflowRecord {
  id          String    @id @default(uuid())
  date        DateTime
  type        String    // "INFLOW" | "OUTFLOW"
  category    String    // "PENJUALAN" | "PEMBAYARAN_SUPPLIER" | "RETASE" | "RBL" | ...
  amount      Float
  reference   String?   // No Invoice / No PO / No transaksi
  description String
  locationId  String?
  createdAt   DateTime  @default(now())
}
```

### PRIORITAS 3 — Perbaikan Existing

| File | Perubahan | Alasan |
|---|---|---|
| `cogs-service.ts:86` | Ganti `0.72` dengan `t.concreteQuality.composition_sand` | COGS akurat per mutu |
| `cogs-service.ts:87` | Ganti `0.85` dengan `t.concreteQuality.composition_stone_12 + composition_stone_23` | COGS akurat per mutu |
| `analytics-service.ts:187` | Ganti `target: 2000` dengan data dari `OperationalTargetSetting` | Target branch akurat |
| `OperationalTargetSetting` | Tambah kolom `period_month`, `period_year` | Target bisa per periode |

---

## SECTION 7 — PETA DATA EXISTING vs SCOPE

| Scope | Data Existing | Lokasi | Completeness |
|---|---|---|---|
| Revenue | Invoice + ProductionTransaction | `revenue-service.ts` | 90% ✅ |
| COGS Material | MaterialIncoming + CompositionFormula | `cogs-service.ts` | 60% ⚠️ |
| COGS BBM | RblExpense (BBM kategori) | `cogs-service.ts` | 80% ✅ |
| COGS Retase | Retase + AggregateIncoming | `cogs-service.ts` | 85% ✅ |
| COGS Maintenance | PoItem (SPR) + RblExpense (bengkel) | `cogs-service.ts` | 75% ⚠️ |
| Overhead RBL | RblBudget + RblExpense | `overhead-service.ts` | 85% ✅ |
| Overhead Fixed | FixedCostContract | `overhead-service.ts` | 90% ✅ |
| AR Aging | Invoice + Payment | `analytics-service.ts` | 85% ✅ |
| AP / Hutang | — | — | 0% ❌ |
| Cashflow In | Payment.amount + Deposit | `actions.ts` | 70% ⚠️ |
| Cashflow Out | RblExpense only | `actions.ts` | 30% ❌ |
| Target Volume | OperationalTargetSetting | DB | 70% ⚠️ |
| Target Revenue | Derivasi ASP × Volume | — | 20% ❌ |
| Target Profit | OperationalTargetSetting.target_gross_profit /m³ | DB | 30% ❌ |
| Period Closing | — | — | 0% ❌ |

---

## SECTION 8 — RISIKO & PERHATIAN KHUSUS

### 🔴 Risiko Tinggi

1. **COGS tidak akurat karena hardcoding komposisi material**
   - File: `src/app/(dashboard)/admin/reports/monthly-management/services/cogs-service.ts` baris 86-87
   - `pasirM3 = vol × 0.72` dan `splitM3 = vol × 0.85` untuk **semua mutu**
   - Padahal setiap mutu punya komposisi berbeda di `ConcreteQuality.composition_sand` dll
   - Ini menyebabkan laporan Unit Economics tidak akurat

2. **Target branch hardcoded di analytics**
   - File: `src/app/(dashboard)/admin/reports/monthly-management/services/analytics-service.ts` baris 187
   - `target: 2000` dan `installedCapacity: 12480` hardcoded
   - Tidak mengacu ke `OperationalTargetSetting`

3. **MoM COGS menggunakan rate current untuk periode sebelumnya**
   - File: `analytics-service.ts` baris 83
   - `prevDirectCostEst = prevVolumeTotal × unitDirectCostPerM3` (current rate)
   - Tidak menggunakan COGS aktual bulan lalu → perbandingan MoM misleading

### 🟡 Risiko Sedang

4. **`prev fuelRatioPct` hardcoded 6.85%**
   - File: `analytics-service.ts` baris 119
   - `prev: 6.85` — angka tetap, bukan dari data aktual bulan lalu

5. **`OperationalTargetSetting` tidak time-bound**
   - Satu setting berlaku untuk semua waktu — tidak ada periode mulai/berakhir
   - Jika target berubah, tidak bisa lihat history target

6. **Cashflow outflow tidak mencakup pembayaran supplier**
   - Laporan cashflow hanya menghitung kas keluar dari `RblExpense`
   - Pembayaran ke supplier via PO tidak masuk outflow

---

## SECTION 9 — ROADMAP PENGEMBANGAN YANG DIREKOMENDASIKAN

### Phase 1 — Fix Critical Issues (Sprint 1-2)
> Tanpa ini, data laporan tidak akurat

1. Fix komposisi material di `cogs-service.ts` (gunakan `ConcreteQuality` fields)
2. Fix target branch di `analytics-service.ts` (baca dari `OperationalTargetSetting`)
3. Tambah `period_month` + `period_year` ke `OperationalTargetSetting`

### Phase 2 — Target & Budget (Sprint 3-5)
> Memungkinkan tracking target vs aktual

4. Buat model `FinancialTarget` (bulanan, quarterly, semester, tahunan)
5. Integrasikan target ke dashboard Monthly Management
6. Buat UI input target per periode per cabang

### Phase 3 — AP & Cashflow (Sprint 6-8)
> Melengkapkan working capital management

7. Buat model `AccountsPayable` + `ApPayment`
8. Update PO workflow untuk menghasilkan AP saat PO approved
9. Buat cashflow tracking (inflow + outflow yang lengkap)

### Phase 4 — Financial Period Closing (Sprint 9-11)
> Kontrol integritas data finansial

10. Buat model `FinancialPeriod`
11. Mekanisme closing → snapshot P&L → lock transaksi
12. Laporan komparasi antar periode (closed vs closed)

### Phase 5 — Advanced P&L & Reporting (Sprint 12+)
> Full financial management

13. P&L Statement lengkap (Revenue → Gross Profit → Operating Profit → Net Profit)
14. Net Profit tracking (PPh badan, beban bunga)
15. Financial dashboard eksekutif

---

## SECTION 10 — KESIMPULAN & REKOMENDASI

### Kesimpulan

Aplikasi New Rajawali CRM memiliki **fondasi operasional yang kuat** — data transaksi produksi, invoicing, dan pembayaran sudah terekam dengan baik. Namun untuk naik ke level **Financial Management** yang sesungguhnya, dibutuhkan:

1. **Model data baru** untuk target keuangan, hutang dagang, dan period closing
2. **Perbaikan bug/limitasi** pada COGS calculation yang masih menggunakan hardcoded factors
3. **Restrukturisasi target setting** agar memiliki dimensi waktu

### Rekomendasi Urgensi

| Prioritas | Aksi | Estimasi Effort |
|---|---|---|
| 🔴 SEGERA | Fix COGS hardcoded factors | 2-4 jam |
| 🔴 SEGERA | Fix target branch hardcoded | 1-2 jam |
| 🟠 PENTING | Tambah dimensi waktu ke OperationalTargetSetting | 4-8 jam |
| 🟠 PENTING | Buat model FinancialTarget | 1-2 hari |
| 🟡 PERLU | Model AccountsPayable | 2-3 hari |
| 🟡 PERLU | Model FinancialPeriod | 2-3 hari |
| 🟢 NICE-TO-HAVE | Cashflow projection | 1 minggu |
| 🟢 NICE-TO-HAVE | Net Profit tracking | 1 minggu |

---

*Assessment ini dibuat berdasarkan review kode sumber tanpa perubahan apapun pada codebase.*
