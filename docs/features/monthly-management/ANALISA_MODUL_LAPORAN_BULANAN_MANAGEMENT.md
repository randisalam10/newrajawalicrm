# Analisa Komprehensif Modul Laporan Bulanan Manajemen Batching Plant

**URL Modul:** `/admin/reports/monthly-management`
**Judul Menu:** Laporan Manajemen Bulanan Batching Plant
**Periode Acuan Analisa:** September 2026 (sesuai ketersediaan data development)
**Tanggal Analisa:** 18 Oktober 2026
**Metode:** Pembacaan kode source (static review) + rekonsiliasi langsung ke database PostgreSQL development (`rajawali_db`) via query SQL.

> **Catatan Kejujuran:** Dokumen ini dibuat apa adanya. Bagian yang **terbukti benar** ditandai benar, yang **terbukti salah/berpotensi menyesatkan** ditandai salah, dan yang **tidak dapat dipastikan** dijelaskan sebagai asumsi/keterbatasan. Tidak ada upaya untuk "menyenangkan" pembaca.

---

## 1. Ringkasan Eksekutif (Verdict)

Laporan Bulanan Manajemen ini **secara arsitektur sudah tertata dan rumus produk utama (volume, omset readymix DPP/PPN, biaya BBM, retase) TERBUKTI AKURAT** saat direkonsiliasi dengan database. Namun terdapat **sejumlah cacat serius yang berpotensi memberikan informasi menyesatkan kepada manajemen** jika angka-angka dibaca apa adanya.

Temuan paling berbahaya (ringkas):

| # | Temuan | Dampak ke Manajemen | Keyakinan |
|---|--------|---------------------|-----------|
| C1 | **Cash Collection Rate = 223,52%** (melebihi 100%) | Manajemen melihat "rasio penagihan" yang tidak mungkin; sebenarnya pembayaran bulan ini mencakup pelunasan tagihan bulan-bulan sebelumnya | Tinggi |
| C2 | **"Arus Kas Bersih" Rp 2,57 M** disejajarkan hanya dengan pengeluaran kas RBL (Rp 187,8 jt) | Menyesatkan seolah-olah kas perusahaan surplus besar; padahal kas keluar sesungguhnya (PO, gaji, material, retase) tidak dihitung | Tinggi |
| C3 | **"Total Invoice Bulan Ini" Rp 3,49 M** vs Omset riil bulan Rp 1,27 M | Invoice yang diterbitkan bulan ini menagih pekerjaan periode lalu. Billing tampak 2,75x omset | Tinggi |
| C4 | **Gaji Karyawan Rp 92,2 jt dimasukkan ke Direct COGS (Seksi B)** | Unit COGS naik Rp 162.516/m³ sehingga margin kotor tampak tertekan (27,55% vs ±35% bila gaji dianggap beban tetap) | Tinggi |
| C5 | **Biaya material dihitung dari resep mix-design × harga master**, bukan pemakaian fisik riil | Bila manajemen menganggap ini biaya aktual, kesimpulan salah. Selisih semenn: terpakai 261.140 Kg vs diterima 250.000 Kg (minus) | Tinggi |
| C6 | **Kas RBL berkategori "PASIR"/"PASIR ALKON" (Rp 26,55 jt) & "KASBON" (Rp 5 jt) dianggap Overhead (Seksi D)** | Pembelian agregat via kas terhitung sebagai overhead, bukan material; KASBON (piutang, bukan beban) menggelembungkan opex | Tinggi |
| H1 | **Periode September sudah DITUTUP untuk scope "Semua Cabang"**, tapi scope per-cabang menghitung ulang secara live | Angka konsolidasi (snapshot) ≠ angka cabang setelah ada perubahan data pasca tutup buku | Tinggi |
| H2 | **Kolom "Bulan Lalu" pada tabel MoM adalah estimasi, bukan realisasi** | Tren Direct Cost/m³ & Gross Margin selalu tampak nyaris tidak berubah (by construction) | Tinggi |
| H3 | **PPN penjualan agregat dipaksa 0** | Bila agregat kena PPN, kewajiban pajak understated (belum berdampak, data Sept = 0) | Sedang |
| H4 | **"Surat Jalan Belum Ditagih" tidak difilter per periode** | Menampilkan 637 tiket / 3.583,4 m³ / estimasi **Rp 7,85 M** sepanjang waktu di dalam laporan bulanan | Tinggi |

**Kesimpulan jujur:** Modul ini **layak dipakai** untuk membaca volume, komposisi biaya, dan omset readymix. Tetapi **belum layak dipakai sebagai satu-satunya dasar keputusan manajemen pada aspek kas, penagihan, margin laba bersih, dan analisis tren** tanpa perbaikan/keterangan pada temuan C1–C6 dan H1–H4.

---

## 2. Metodologi & Ruang Lingkup

1. **Static code review** seluruh file modul:
   - `page.tsx`, `actions.ts`, `types.ts`, `monthly-management-client.tsx`
   - `services/`: `report-queries.ts`, `revenue-service.ts`, `cogs-service.ts`, `overhead-service.ts`, `analytics-service.ts`, `index.ts`
   - `components/`: tabs, summary, drilldowns, print
2. **Rekonsiliasi data** ke tabel sumber di DB development:
   - `ProductionTransaction`, `ConcreteQuality`, `ProjectPrice`
   - `MaterialIncoming`, `MaterialPriceHistory`, `AggregateIncoming`, `AggregateOutgoing`
   - `Retase`, `RblBudget`, `RblExpense`
   - `FixedCostContract`, `Vehicle`, `VehicleComplianceRecord`, `OperationalTargetSetting`
   - `Invoice`, `InvoiceItem`, `Payment`, `Deposit`, `MonthlyClosing`
3. **Pembacaan snapshot tutup buku** (`MonthlyClosing.closingKey = '2026-09__ALL'`) untuk memastikan angka yang **benar-benar ditampilkan** ke manajemen.

---

## 3. Arsitektur & Alur Data Modul

```
page.tsx (auth: hanya SuperAdminBP)
   └─> actions.getMonthlyManagementReportData(filters)
         ├─ [1] Cek MonthlyClosing (snapshot)
         │        closingKey = `${YYYY-MM}__${locationId || "ALL"}`
         │        Jika status CLOSED → kembalikan snapshot (IMMUTABLE)
         ├─ [2] fetchMonthlyReportRawData()  (report-queries.ts)
         │        Batch 1..4 query paralel ke ±20 tabel sumber
         ├─ [3] calculateReadymixRevenue()   (revenue-service.ts)  → DPP/PPN/Gross readymix
         ├─ [4] computeSewaDetailed()        (revenue-service.ts)  → DPP/PPN/Gross sewa (prorata)
         ├─ [5] Agregat outgoing            → agregat revenue (PPN dipaksa 0)
         ├─ [6] calculateDirectCogs()        (cogs-service.ts)     → Seksi B
         ├─ [7] calculateOverheadAndAmortization() (overhead-service.ts) → Seksi D
         ├─ [8] calculateReportAnalytics()   (analytics-service.ts) → unit economics, MoM, alerts, benchmark
         └─ [9] Assemble scorecard + drilldown + billing
```

**Security:** Modul **hanya bisa diakses role `SuperAdminBP`** (dicek di `page.tsx` dan `actions.ts`). Ini sudah benar dan konsisten.

**Konsep Seksi:**
- **A. Pendapatan** = Readymix (DPP+PPN) + Sewa + Agregat
- **B. Biaya Pokok Langsung (Direct COGS)** = Material + BBM + Retase + Maintenance + Biaya Manual
- **C. Laba Kotor** = A(DPP) − B
- **D. Overhead & Amortisasi** = RBL Opex murni + Beban Tetap + Kepatuhan Armada
- **Net Field Contribution (E)** = C − D

---

## 4. Sumber Data & Relasi Kunci

| Nilai Laporan | Tabel Sumber | Field / Relasi | Filter |
|---|---|---|---|
| Volume produksi | `ProductionTransaction` | `volume_cubic` | `status='Confirmed'`, `date` in month, `locationId` |
| Omset Readymix DPP/PPN | `ProjectPrice` (via `project.prices`) | `price`, `ppn_mode`, `ppn_rate` match `qualityId` | — |
| Omset Sewa | `SewaTransaction` | `dpp_amount`, `ppn_amount`, `ppn_mode`, `rental_dates` | status ≠ Cancelled, overlap bulan |
| Omset Agregat | `AggregateOutgoing` | `total_price` | `category='PENJUALAN'` |
| Biaya Semen | `ConcreteQuality.composition_cement` × harga | + `MaterialIncoming` (harga/kg) | rata-rata tertimbang bulan |
| Biaya Pasir/Split | `ConcreteQuality.composition_*` ÷ density × `MaterialPriceHistory` | point-in-time | effective_date ≤ txn date |
| Biaya BBM | `RblExpense` | `amount` | kategori mengandung "bbm"/"solar" |
| Biaya Maintenance | `PoItem` (PO BP) + `RblExpense` | `subtotal` / `amount` | is_for_bp, kategori SPR/pemeliharaan |
| Biaya Manual | `FixedCostContract` | `monthly_amount` | kategori Direct COGS |
| RBL Opex | `RblExpense` (murni non-BBM non-Maintenance) | `amount` | — |
| Amortisasi Kontrak | `FixedCostContract` | `monthly_amount` | isActive, overlap bulan |
| Kepatuhan Armada | `VehicleComplianceRecord` + `FixedCostContract` | `monthly_amount` | type PAJAK_STNK / UJI_KIR |
| Piutang (AR) | `Invoice` | `total_amount - paid_amount` | status ISSUED/PARTIAL |
| Pembayaran masuk | `Payment` | `amount` | `payment_date` in month, `is_cancelled=false` |
| Snapshot tutup buku | `MonthlyClosing` | `snapshotData`, `closingKey` | `status='CLOSED'` |

---

## 5. Hasil Rekonsiliasi — September 2026

Data development: **105 transaksi produksi Confirmed**, **567,5 m³**, 1 lokasi BP utama (`4496f27c…`), 0 aggregate outgoing, 2 sewa, 10 penerimaan semen (250.000 Kg).

### 5.1 Angka yang DITAMPILKAN (dari snapshot `2026-09__ALL`)

| Metrik | Nilai Snapshot | Status Verifikasi |
|---|---:|---|
| Volume Produksi | 567,5 m³ | ✅ Cocok SQL |
| Readymix DPP | Rp 1.226.046.847 | ✅ Cocok SQL |
| Readymix PPN | Rp 37.806.306 | ✅ Cocok SQL |
| Readymix Gross | Rp 1.263.853.153 | ✅ Cocok SQL |
| Sewa DPP | Rp 6.306.306 | ✅ Cocok manual |
| Total DPP Revenue | Rp 1.232.353.153 | ✅ Cocok |
| Total Gross Revenue | Rp 1.270.853.153 | ✅ Cocok |
| Semen Cost | Rp 527.503.709 | ✅ Cocok SQL (261.140 Kg × Rp 2.020) |
| BBM (Fuel) Cost | Rp 88.927.990 | ✅ Cocok SQL |
| Retase Cost | Rp 17.016.000 | ✅ Cocok SQL |
| Maintenance RBL | Rp 23.371.000 | ✅ Cocok SQL |
| Manual Direct (Gaji) | Rp 92.228.000 | ✅ Cocok, ⚠️ klasifikasi diperdebatkan |
| Pasir Cost | Rp 26.210.249 | ⚠️ rekomputasi live = Rp 27.350.420 (divergensi snapshot) |
| Split Cost | Rp 117.638.609 | ⚠️ rekomputasi live = Rp 124.690.264 (divergensi snapshot) |
| Total Direct Cost | Rp 892.895.557 | ⚠️ ikut divergensi material |
| Gross Profit | Rp 339.457.595 | ⚠️ ikut divergensi |
| Gross Margin | 27,55% | ⚠️ |
| Unit COGS | Rp 1.573.384/m³ | ⚠️ |
| RBL Opex (murni) | Rp 75.558.999,8 | ✅ Cocok SQL persis |
| RBL Disbursement | Rp 187.857.990,3 | ✅ Cocok SQL persis |
| Net Field Contribution | Rp 237.900.262,7 | ⚠️ |
| Cash Collection Rate | **223,52%** | ❌ Tidak valid (>100%) |
| Net Operating Cashflow | **Rp 2.566.727.009** | ❌ Menyesatkan |
| Total Invoiced (bulan) | **Rp 3.494.079.999** | ❌ 2,75x omset |
| Unbilled (all-time) | **Rp 7.854.101.347** (637 tiket, 3.583,4 m³) | ❌ Tidak berperiode |

### 5.2 Rekonsiliasi Manual (live recompute) vs Snapshot

| Item | Live Recompute (18 Okt) | Snapshot (3 Okt) | Selisih |
|---|---:|---:|---:|
| Pasir Cost | Rp 27.350.420 | Rp 26.210.249 | −1.140.171 |
| Split Cost | Rp 124.690.264 | Rp 117.638.609 | −7.051.655 |
| Total Payments | Rp 2.652.085.000 (58) | Rp 2.754.585.000 (59) | +102.500.000 |
| Total Invoiced | ~Rp 3.391.580.000 (49 inv) | Rp 3.494.079.999 (50 inv) | +102.500.000 |

> **Kesimpulan bagian ini:** Formula inti (volume, omset DPP, BBM, retase) **akurat**. Namun angka biaya material & kas **berbeda antara snapshot dan perhitungan ulang**, menandakan data berubah setelah tutup buku (lihat H1).

---

## 6. Temuan Detail

### 🔴 CRITICAL — Berdampak Langsung Salah Informasi ke Manajemen

---

#### C1. Cash Collection Rate melebihi 100% (223,52%)

**Lokasi kode:** [`actions.ts:171`](src/app/(dashboard)/admin/reports/monthly-management/actions.ts:171)

```ts
const cashCollectionRate = totalDppRevenue > 0 ? (totalPaymentReceived / totalDppRevenue) * 100 : 0
```

**Masalah:** Pembilang (`totalPaymentReceived`) adalah **seluruh pembayaran yang tanggal bayarnya di bulan ini**, tanpa memandang periode invoice-nya. Penyebut adalah omset DPP bulan ini. Karena September banyak menerima pelunasan tagihan lama (catatan pembayaran menunjukkan "RPJ 01/05/26", "29/04/26", "28/04/26", "14/04/26" → tagihan April/Mei), hasilnya > 100%.

**Bukti:** Snapshot menunjukkan `cashCollectionRate = 223,52` dengan `totalPaymentReceived = 2.754.585.000` vs `totalDppRevenue = 1.232.353.153`. Daftar pembayaran memang memuat nomor invoice & catatan periode lalu.

**Dampak:** Manajemen melihat "Collection Realization Rate 223,52%". Meskipun UI punya keterangan kecil "Pelunasan melebihi omset bulan berjalan (termasuk tagihan lalu)", angka utama tetap menyesatkan dan tidak dapat dipakai sebagai KPI penagihan.

**Rekomendasi:** Ganti definisi menjadi salah satu:
- (a) *Collection terhadap invoice bulan ini*: pembayaran atas `invoice.issue_date` bulan ini ÷ omset bulan; atau
- (b) *Cash realization*: total kas masuk bulan ÷ (total AR awal + penjualan bulan), disajikan sebagai deskripsi kas, bukan "rate" terhadap omset.

---

#### C2. "Arus Kas Bersih" (Net Operating Cashflow) Menyesatkan

**Lokasi kode:** [`actions.ts:164-170`](src/app/(dashboard)/admin/reports/monthly-management/actions.ts:164)

```ts
const totalCashInflow = totalPaymentReceived + totalDepositReceived
const totalCashOutflow = overhead.totalRblCashDisbursement || overhead.totalRblOpex
const netOperatingCashflow = totalCashInflow - totalCashOutflow
```

**Masalah:** Kas keluar **hanya** menghitung realisasi kas RBL cabang (BBM + bengkel + opex cabang = Rp 187,86 jt). Tidak menghitung: pembayaran PO (semen Rp 50,5 jt, dll.), gaji (Rp 92,2 jt), pembelian material, pembayaran retase, pajak, dan belanja modal. Sementara kas masuk memasukkan pelunasan tagihan periode lalu.

**Bukti:** `netOperatingCashflow = 2.754.585.000 − 187.857.990 = 2.566.727.009` ditampilkan sebagai badge hijau **"✓ SURPLUS KAS MASUK +Rp 2,56 M"** dan "✓ Kas masuk dari pembayaran beton mencukupi seluruh beban operasional cabang."

**Dampak:** Ini klaim yang tidak benar. Kas masuk dari pelunasan tagihan lama tidak mencerminkan surplus operasional bulan berjalan; dan klaim "mencukupi seluruh beban operasional" salah karena banyak beban kas tidak dihitung.

**Rekomendasi:** Sediakan arus kas keluar menyeluruh (PO terbayar + RBL + gaji + retase + pajak), atau ubah label menjadi "Perbandingan Kas Masuk Pelanggan vs Realisasi Kas Operasional Cabang (RBL)" dan hapus kata "Net Cashflow / Surplus".

---

#### C3. "Total Invoice Bulan Ini" 2,75x Omset

**Lokasi kode:** [`report-queries.ts:451-458`](src/app/(dashboard)/admin/reports/monthly-management/services/report-queries.ts:451) & agregasi di [`actions.ts:217`](src/app/(dashboard)/admin/reports/monthly-management/actions.ts:217)

```ts
const totalInvoicedMonth = raw.invoicesIssuedInMonth.reduce((s, i) => s + (i.total_amount || 0), 0)
```

Filter: `issue_date` dalam bulan, `status ≠ CANCELLED`.

**Bukti:** September menerbitkan 50 invoice senilai **Rp 3,49 M**, sementara omset bulan hanya **Rp 1,27 M**. Invoice memuat jumlah PPN (`total_amount` = gross) dan menagih pekerjaan periode sebelumnya (bulk billing).

**Dampak:** Bila manajemen membaca "billing bulan ini" = Rp 3,49 M dan membandingkan dengan omset Rp 1,27 M, muncul kesan salah (mis. dianggap penjualan naik 2,75x atau tagihan over). Dua angka ini mengukur hal berbeda (penagihan dokumen vs pengakuan pendapatan).

**Rekomendasi:** Beri label eksplisit "Nilai Invoice Diterbitkan (dokumen)" vs "Omset Diakui (accrual)", dan cantumkan rekap "invoice bulan ini atas pekerjaan periode berjalan vs periode lalu".

---

#### C4. Gaji Karyawan Dimasukkan ke Direct COGS (Seksi B)

**Lokasi kode:** [`cogs-service.ts:5-22`](src/app/(dashboard)/admin/reports/monthly-management/services/cogs-service.ts:5) (kategori `BIAYA_POKOK_LAINNYA` dianggap Direct COGS) & [`cogs-service.ts:266-267`](src/app/(dashboard)/admin/reports/monthly-management/services/cogs-service.ts:266)

**Bukti:** `FixedCostContract` "Gaji September" kategori `BIAYA_POKOK_LAINNYA` = **Rp 92.228.000** → masuk `manualDirectCost` → `totalDirectCost`. Ditampilkan sebagai "4. Biaya Pokok Langsung & Gaji Produksi (Manual)" = Rp 92,2 jt, menyumbang **Rp 162.516/m³**.

**Dampak:** Unit COGS = Rp 1.573.384/m³ (vs target Rp 630.000 → "Over Budget +150%"); Gross Margin turun ke 27,55%. Bila gaji adalah **beban tetap bulanan**, margin kotor riil mendekati ±35% dan narasi efisiensi/kerugian menjadi berbeda total. Ini keputusan klasifikasi akuntansi yang berdampak besar.

**Rekomendasi:** Klarifikasi bisnis: apakah gaji benar biaya pokok produksi (variable) atau beban tetap (Seksi D)? Jika beban tetap, pindahkan ke overhead/amortisasi dan jangan masukkan ke COGS per-m³.

---

#### C5. Biaya Material = Resep Teoretis, Bukan Pemakaian/Pembelian Riil

**Lokasi kode:** [`cogs-service.ts:142-200`](src/app/(dashboard)/admin/reports/monthly-management/services/cogs-service.ts:142)

Biaya semen dihitung `volume × composition_cement × harga_semen_per_kg`; pasir/split dari komposisi ÷ density × harga master. **Bukan** dari pemakaian gudang atau nilai pembelian.

**Bukti rekonsiliasi:**
- Semen terpakai (teoretis) = **261.140 Kg**; semen diterima September = **250.000 Kg** → selisih **−11.140 Kg** (pemakaian > penerimaan, tidak wajar secara fisik).
- Biaya semen standar (Rp 527,5 jt) ≠ Nilai PO Semen September (Rp 50,5 jt) ≠ Nilai Penerimaan Silo (Rp 505 jt).
- Pasir teoretis = 341,9 m³; Split teoretis = 356,3 m³ (total 698,2 m³ untuk 567,5 m³ beton ≈ rasio agregat wajar, namun tidak diverifikasi ke stok).

**Dampak:** Angka ini **biaya standar (standard costing)**, bukan biaya aktual. Bila manajemen menganggapnya realisasi pembelian, keputusan pembelian/efisiensi akan salah. Rasio "selisih material" pada Neraca Material perlu dibaca sebagai *deviasi terhadap standar*, bukan selisih stok fisik.

**Rekomendasi:** Beri label "Biaya Material Standar (Mix Design)" vs "Realisasi Pembelian/Stok", dan bila ingin akurasi aktual gunakan moving-average dari `MaterialIncoming` atau stock opname.

---

#### C6. Kas RBL Berkategori Material & KASBON diklasifikasi sebagai Overhead

**Lokasi kode:** [`overhead-service.ts:29-56`](src/app/(dashboard)/admin/reports/monthly-management/services/overhead-service.ts:29) — hanya kategori yang mengandung "bbm/solar" dan "sparepart/pemeliharaan/servis/bengkel" yang dikeluarkan dari overhead. Sisanya (termasuk PASIR, KASBON) masuk `pureOverheadOpex`.

**Bukti (RBL Expense September):**

| Kategori | Nominal | Klasifikasi Mesin | Seharusnya |
|---|---:|---|---|
| PASIR | Rp 15.200.000 | Overhead (Seksi D) | Material (Seksi B) |
| PASIR ALKON | Rp 11.350.000 | Overhead (Seksi D) | Material (Seksi B) |
| KASBON | Rp 5.000.000 | Overhead (Seksi D) | Bukan beban (piutang/uang muka) |

Total tiga item = **Rp 31,55 jt** dari RBL Opex Rp 75,56 jt (≈42% overhead "murni" berasal dari item yang salah klasifikasi).

**Dampak:**
- **Pembelian pasir via kas** terhitung sebagai overhead, padahal material pasir juga sudah dihitung (standar) di Seksi B → berpotensi **double representation** material.
- **KASBON** adalah pemberian uang muka/piutang karyawan, bukan beban operasional → menggelembungkan overhead & menekan Net Field Contribution.

**Rekomendasi:** Tambahkan pemetaan kategori material (PASIR, SPLIT, SEMEN, dll.) ke Seksi B dan kategori non-beban (KASBON, piutang) agar dikecualikan dari beban.

---

### 🟠 HIGH

---

#### H1. Snapshot Tutup Buku vs Perhitungan Live Per-Cabang

**Lokasi kode:** [`actions.ts:58-84`](src/app/(dashboard)/admin/reports/monthly-management/actions.ts:58)

```ts
const closingKey = `${selectedPeriodStr}__${selectedLocId || "ALL"}`
```

**Bukti:** `MonthlyClosing` memiliki `2026-09__ALL` berstatus **CLOSED** (closedAt 3 Okt). Tidak ada closing untuk `2026-09__<locationId>`. Artinya:
- Scope **"Semua Cabang"** → mengembalikan **snapshot beku** (3 Okt).
- Scope **per-cabang** → menghitung **live** dari data sekarang.

Selisih nyata: snapshot pembayaran Rp 2.754.585.000 (59) vs DB sekarang Rp 2.652.085.000 (58); snapshot pasir/split juga berbeda dari rekomputasi.

**Dampak:** Bila ada koreksi data setelah tutup buku, **angka konsolidasi ≠ angka cabang** untuk periode yang sama. Manajemen bisa melihat dua nilai berbeda untuk September.

**Rekomendasi:** Terapkan tutup buku pada granularitas yang konsisten (ALL maupun per-cabang), atau sediakan penanda jelas mana yang snapshot vs live, plus validasi integritas snapshot.

---

#### H2. Kolom "Bulan Lalu" pada MoM adalah Estimasi (Bukan Realisasi)

**Lokasi kode:** [`analytics-service.ts:86-115`](src/app/(dashboard)/admin/reports/monthly-management/services/analytics-service.ts:86)

```ts
const prevDirectCostEst = Math.round(prevVolumeTotal * unitDirectCostPerM3)
const prevGrossProfit = prevTotalGrossRevenue - prevDirectCostEst
```

**Bukti (snapshot):** MoM `cogs.prev = cogs.current = 1.573.384` (growthPct ≈ −0,000000017). Ini **konsekuensi matematis**: karena `prev unit cost = prevVolume × currentUnitCost ÷ prevVolume = currentUnitCost`, maka "Direct Cost/m³ bulan lalu" **selalu sama** dengan bulan ini. Gross Margin pun nyaris identik (27,558% vs 27,545%).

**Dampak:** Tabel perbandingan MoM untuk Direct Cost/m³ dan Gross Margin **tidak mengukur apa pun** — selalu datar. Manajemen dapat menyimpulkan "biaya stabil" padahal tidak diukur.

**Rekomendasi:** Hitung ulang biaya bulan sebelumnya secara nyata (query terpisah untuk BBM, material, retase, dll. bulan lalu), atau beri label "estimasi".

---

#### H3. PPN Penjualan Agregat Dipaksa 0

**Lokasi kode:** [`actions.ts:111-117`](src/app/(dashboard)/admin/reports/monthly-management/actions.ts:111)

```ts
const currentAggDPP = currentAggRevenue
const currentAggPPN = 0
const currentAggGross = currentAggRevenue
```

**Dampak:** Bila penjualan agregat objek PPN, kewajiban pajak understated. Untuk Sept tidak berdampak (0 transaksi `AggregateOutgoing` sepanjang waktu), namun **latent bug** yang akan muncul saat ada penjualan agregat.

**Rekomendasi:** Terapkan aturan PPN yang sama dengan readymix/sewa (ppn_mode & rate per transaksi/master).

---

#### H4. "Surat Jalan Belum Memiliki Invoice" Tidak Difilter Periode

**Lokasi kode:** [`report-queries.ts:459-469`](src/app/(dashboard)/admin/reports/monthly-management/services/report-queries.ts:459)

```ts
prisma.productionTransaction.findMany({
    where: { invoiceItem: null, status: "Confirmed", ...locationFilter }
})   // ← TANPA filter tanggal
```

**Bukti:** Di seluruh DB terdapat **646 tiket Confirmed tanpa invoice** (Apr–Sep 2026), volume 3.633,4 m³. Snapshot menampilkan `unbilledCount = 637`, `unbilledVolume = 3.583,4 m³`, `unbilledEstimatedValue = Rp 7.854.101.347`. Dari 105 tiket September, **102 di antaranya belum diinvoice**.

**Dampak:** Di dalam laporan bulanan, angka "belum ditagih" Rp 7,85 M (tidak berperiode) jauh melampaui omset bulan (Rp 1,27 M) dan bisa disalahtafsirkan sebagai masalah penagihan bulan September. Padahal ini akumulasi backlog sejak April. Selain itu, tiket September yang sama muncul sebagai **pendapatan (accrual)** sekaligus **piutang belum tertagih**.

**Rekomendasi:** Tampilkan dua kelompok: (a) *belum ditagih periode ini*, (b) *akumulasi backlog (dengan rentang tanggal eksplisit)*.

---

### 🟡 MEDIUM

| # | Temuan | Lokasi | Catatan |
|---|--------|--------|---------|
| M1 | PPN rate default 11% | `revenue-service.ts:47,196` | UU PPN Indonesia naik 11%→12% (2025). Semua data tersimpan 11%; bila tarif berlaku 12% maka PPN understated. Perlu konfirmasi tarif yang berlaku. |
| M2 | Label "Suku Cadang & Bengkel PO" memakai `totalMaintenanceCost` (PO + RBL) | `unit-economics-table.tsx:194` & `analytics-service.ts:80` | Mislabel kategori. |
| M3 | Basis agregasi tidak konsisten | `analytics-service.ts:288` | `topCustomers.sharePct` membagi DPP ÷ `totalGrossRevenue` (gross), sehingga share sedikit understated. `branchBenchmark` pakai harga mentah (incl PPN utk INCLUDE) sedangkan konsolidasi pakai DPP. |
| M4 | Scoping lokasi tidak konsisten | `report-queries.ts:483,474` | Payment difilter via `invoice.locationId`, Deposit via `customer.locationId`. |
| M5 | `availableMonths` hardcoded | `actions.ts:317-320` | Hanya 2026-01 s/d 2026-10; akan basi dan menghalangi pemilihan bulan lain yang datanya ada. |
| M6 | Kapasitas terpasang hardcoded 12.480 m³ | `analytics-service.ts:296` | 60 m³/jam × 8 jam × 26 hari (asumsi statis). Utilisasi 4,5% = asumsi, bukan data. |
| M7 | `totalRblBudgetPlafon` = jumlah semua `RblBudget` sebulan | `overhead-service.ts:59` | Sept punya 4 budget (V1–V4). Bukti menunjukkan ini **tranche berurutan** (masing-masing habis terpakai) sehingga wajar; namun skema rentan bila suatu saat berupa revisi. |
| M8 | Klasifikasi PO & kategori berbasis string matching | `report-queries.ts:212-238` | Keyword "SPR/sparepart/suku cadang" + daftar pengecualian. Fragile; item salah nama bisa salah golong. |
| M9 | `dtRetaseOutgoing` menjumlah `retase_amount` seluruh `AggregateOutgoing` tanpa filter kategori | `report-queries.ts:198-204` | Bisa memuat transfer internal/koreksi. Sept = 0 sehingga belum berdampak. |
| M10 | Catch-all kategori kontrak → Asuransi/Retribusi | `overhead-service.ts:96-98` | Kontrak `LAINNYA` tanpa kata kunci akan masuk `totalAsuransiRetribusiCost`. |

### 🟢 LOW / KOSMETIK

- **L1.** `gajiMonthly` selalu 0 di scorecard padahal gaji Rp 92,2 jt ada di `manualDirectCost` → field membingungkan / dead field (`totalGajiCost` tak pernah diisi).
- **L2.** `costComposition` memakai `totalDirectCost` sebagai penyebut tetapi memuat item amortisasi (kontrak & pajak armada) → persentase tak menjumlah 100% dan mencampur basis.
- **L3.** `Vehicle.annual_tax_cost` & `kir_cost` semua 0 dan `VehicleComplianceRecord` kosong (0 record) → kepatuhan armada per-kendaraan efektif nol; hanya berasal dari kontrak tetap.
- **L4.** `totalFixedVehicleComplianceCost` dihitung tapi tak dipakai.
- **L5.** Nilai `gross` pada readymix = `vol × (dppPrice+ppnPrice)`; konsisten, namun `totalGrossRevenue` dipakai sebagai penyebut beberapa rasio bersama basis DPP (lihat M3).

---

## 7. Yang TERBUKTI BENAR (Apresiasi Objektif)

1. **Volume produksi** dan **omset readymix DPP/PPN/Gross** — cocok persis dengan SQL (1.226.046.847 / 37.806.306 / 1.263.853.153).
2. **Perhitungan harga semen/kg** dari rata-rata tertimbang penerimaan silo (Rp 2.020/kg) — benar.
3. **Biaya BBM** (Rp 88,93 jt), **Retase mixer** (Rp 17,016 jt) — cocok persis.
4. **Tidak ada double-counting** antara Direct COGS dan Overhead untuk BBM & Maintenance: overhead-service secara sengaja mengeluarkan kategori BBM/bengkel dari `pureOverheadOpex`. ✔
5. **Gaji tidak double count**: diskip di overhead (`return`) dan hanya dihitung sekali di COGS manual.
6. **Total RBL Disbursement** (Rp 187.857.990,3) cocok persis antara agregasi kategori dan penjumlahan 4 budget, menandakan tidak ada duplikasi expense.
7. **Kontrol akses** modul (hanya `SuperAdminBP`) benar dan konsisten.
8. **Mekanisme snapshot tutup buku** secara desain baik (immutability) walau penerapannya perlu diperbaiki pada granularitas (lihat H1).
9. **Point-in-time material pricing** (`resolveMaterialPriceAtDate`) dirancang benar untuk mendukung kenaikan harga di tengah bulan.

---

## 8. Hal yang TIDAK DAPAT DIPASTIKAN (Butuh Konfirmasi)

1. **Definisi bisnis "gaji"**: apakah benar bagian dari biaya pokok langsung (COGS) atau beban tetap? (Menentukan validitas C4.)
2. **Satuan `MaterialIncoming.tonnage`**: kode mengasumsikan **Kg**. Data 25.000/delivery × 10 ≈ 250 ton (wajar untuk bulk tanker 25 ton), menghasilkan Rp 2.020/Kg = Rp 2.020.000/ton. Perlu konfirmasi satuan & kewajaran harga.
3. **Tarif PPN yang berlaku** (11% vs 12%) untuk periode ini.
4. **Status 4 `RblBudget` September** (tranche incremental vs revisi) — bukti mengarah incremental, perlu kepastian.
5. **Apakah penjualan agregat objek PPN.**
6. **Kebijakan penagihan** (apakah invoice memang diterbitkan terlambat/bulk) sehingga selisih C3 & H4 adalah kondisi bisnis, bukan bug.
7. **Snapshot vs data pasca-tutup**: apakah divergensi (pasir/split/pembayaran) memang hasil koreksi resmi atau drift data.

---

## 9. Rekomendasi Perbaikan (Prioritas)

**Prioritas 1 (segera, dampak manajemen):**
1. Perbaiki/relabel **Cash Collection Rate** (C1) & **Net Operating Cashflow** (C2).
2. Pisahkan label **"Nilai Invoice Diterbitkan" vs "Omset Diakui"** (C3).
3. Klarifikasi & relokasi **Gaji** sesuai definisi akuntansi (C4).
4. Klasifikasi ulang **kas material (PASIR) & KASBON** (C6).
5. Tambah **filter periode** pada `unbilledTxns` + sajikan backlog terpisah (H4).

**Prioritas 2:**
6. Terapkan **tutup buku per-cabang** konsisten (H1).
7. Perbaiki **MoM** memakai realisasi bulan lalu (H2).
8. Terapkan **PPN** pada agregat (H3).
9. Verifikasi **tarif PPN** (M1).

**Prioritas 3:**
10. Bersihkan **label & basis rasio** (M2, M3), **scoping lokasi** (M4).
11. Dinamiskan **availableMonths** & **kapasitas terpasang** (M5, M6).
12. Perkuat **klasifikasi kategori** berbasis master data, bukan string matching (M8, M10).

---

## 10. Lampiran

### A. Matriks Severity

| Kode | Severity | Ringkas | Keyakinan |
|---|---|---|---|
| C1 | Critical | Collection Rate 223,52% | Tinggi |
| C2 | Critical | Net Cashflow menyesatkan | Tinggi |
| C3 | Critical | Billing 2,75x omset | Tinggi |
| C4 | Critical | Gaji di Direct COGS | Tinggi |
| C5 | Critical | Material = resep teoretis | Tinggi |
| C6 | Critical | PASIR/KASBON sebagai overhead | Tinggi |
| H1 | High | Snapshot vs live per-cabang | Tinggi |
| H2 | High | MoM "Bulan Lalu" = estimasi | Tinggi |
| H3 | High | PPN agregat = 0 | Sedang |
| H4 | High | Unbilled tanpa periode | Tinggi |
| M1–M10 | Medium | Lihat tabel §6 | Sedang |
| L1–L5 | Low | Kosmetik/dead field | Tinggi–Sedang |

### B. Query Verifikasi Kunci

```sql
-- Volume & omset readymix
SELECT sum(volume_cubic) FROM "ProductionTransaction"
WHERE date >= '2026-09-01' AND date < '2026-10-01' AND status='Confirmed';  -- 567.5

-- Kategori RBL (PASIR/KASBON masuk overhead)
SELECT category, count(*), sum(amount) FROM "RblExpense"
WHERE date >= '2026-09-01' AND date < '2026-10-01' GROUP BY category ORDER BY 3 DESC;

-- Budget vs realisasi (4 tranche)
SELECT b.code, b.amount, count(e.id), sum(e.amount) FROM "RblBudget" b
LEFT JOIN "RblExpense" e ON e."budgetId"=b.id
WHERE b."periodMonth"=9 AND b."periodYear"=2026 GROUP BY b.code, b.amount;

-- Closing snapshot yang ditampilkan
SELECT "closingKey", status, "closedAt" FROM "MonthlyClosing";  -- 2026-09__ALL CLOSED
```

### C. File Kode yang Direview

- [`page.tsx`](src/app/(dashboard)/admin/reports/monthly-management/page.tsx)
- [`actions.ts`](src/app/(dashboard)/admin/reports/monthly-management/actions.ts)
- [`types.ts`](src/app/(dashboard)/admin/reports/monthly-management/types.ts)
- [`services/report-queries.ts`](src/app/(dashboard)/admin/reports/monthly-management/services/report-queries.ts)
- [`services/revenue-service.ts`](src/app/(dashboard)/admin/reports/monthly-management/services/revenue-service.ts)
- [`services/cogs-service.ts`](src/app/(dashboard)/admin/reports/monthly-management/services/cogs-service.ts)
- [`services/overhead-service.ts`](src/app/(dashboard)/admin/reports/monthly-management/services/overhead-service.ts)
- [`services/analytics-service.ts`](src/app/(dashboard)/admin/reports/monthly-management/services/analytics-service.ts)
- [`components/summary/cashflow-section.tsx`](src/app/(dashboard)/admin/reports/monthly-management/components/summary/cashflow-section.tsx)
- [`components/summary/mom-alerts-section.tsx`](src/app/(dashboard)/admin/reports/monthly-management/components/summary/mom-alerts-section.tsx)
- [`components/summary/executive-scorecard.tsx`](src/app/(dashboard)/admin/reports/monthly-management/components/summary/executive-scorecard.tsx)
- [`components/summary/unit-economics-table.tsx`](src/app/(dashboard)/admin/reports/monthly-management/components/summary/unit-economics-table.tsx)

---

*Dokumen ini merupakan hasil analisa independen berbasis bukti kode & data. Seluruh angka diverifikasi ulang terhadap database development per 18 Oktober 2026.*

---

## 11. ADDENDUM — Tanggapan atas Klarifikasi Pengembang & Koreksi Objektif

> Bagian ini ditambahkan setelah diskusi dengan pemilik sistem. Sebagian temuan **dikoreksi/direvisi** demi objektivitas, disertai bukti tambahan.

### 11.1 C1 (Cash Collection Rate) — KOREKSI: akar masalah utama adalah KUALITAS DATA, bukan sekedar rumus

**Bukti baru:** Pada tabel `Payment` bulan September, `payment_date` **sama persis dengan `createdAt`** (mis. 2026-09-25 / 2026-09-25), namun `notes` menunjukkan transit bank sebenarnya di **Januari 2026** ("BNI RPJ TGL 03/01/26", "MDR RPJ 06/01/26", dst). Artinya pengguna memasukkan `payment_date = tanggal input` (late entry), bukan tanggal kas masuk riil.

**Revisi objektif:**
- Klarifikasi Anda **benar**: masalah desain form/referensi tanggal bayar berperan besar. `payment_date` belum dapat dipercaya sebagai tanggal cash-in.
- Namun **rumus `paymentReceived / DPP` juga tetap salah secara konsep**, terlepas dari kualitas data. Dua lapis masalah: (1) tanggal entry, (2) definisi rasio.
- **Kesimpulan:** severity tetap **Critical**, tetapi solusinya harus dimulai dari **mengisi `payment_date` dengan tanggal kas riil** (dan/atau menambah field "tanggal transaksi bank" terpisah dari "tanggal input").

### 11.2 C2 (Net Operating Cashflow) — REVISI: scope BP vs Non-BP dapat diterima, label tetap menyesatkan

**Bukti baru:** Tabel `PurchaseOrder` **tidak memiliki kolom pembayaran** (hanya `status`: DRAFT/APPROVED/CANCELLED). Jadi PO memang **tidak dibayar lewat kas cabang** di sistem ini (diasumsikan kredit/HO).

**Revisi objektif:**
- Klarifikasi Anda **diterima**: membatasi kas keluar pada RBL (kas cabang BP) memang **desain yang dapat dipertanggungjawabkan** karena PO di luar kas cabang.
- Namun klaim **"SURPLUS KAS MASUK / kas mencukupi seluruh beban operasional"** tetap **overclaim**, karena gaji, retase tunai, dan beban non-RBL tetap beban operasional yang tidak tercermin.
- **Kesimpulan:** turunkan klaim bahasa; ubah label menjadi "Kas Masuk Pelanggan vs Realisasi Kas Operasional Cabang (RBL)". Severity diturunkan: **High** (isu label); C1 tetap Critical.

### 11.3 C3 (Invoice vs Omset) — VALID; dan ya, invoice MEMANG berpengaruh ke cash-in

**Bukti baru:** Seluruh 59 pembayaran September menutup invoice yang **diterbitkan September** (semua `issue_date` = 2026-09).

**Revisi objektif:**
- Pertanyaan Anda **benar**: invoice berpengaruh ke cash-in (dokumen ditagih lalu dibayar). Namun keduanya mengukur **basis waktu dokumen**, bukan **basis pendapatan operasi bulan**.
- Karena invoice September menagih **pekerjaan periode lalu** (catatan bank Jan 2026; produksi Sept justru 102/105 belum ditagih), maka `totalInvoiced` (Rp 3,49 M) dan `totalPaymentReceived` (Rp 2,75 M) **tidak dapat dibandingkan** dengan omset Sept (Rp 1,27 M).
- **Kesimpulan:** C3 tetap **valid** sebagai isu penyajian. Solusi: label tegas + pisahkan "invoice atas pekerjaan bulan ini vs periode lalu".

### 11.4 C4 (Gaji di COGS) — DITERIMA sebagai desain; bukan bug, tapi wajib dilabeli

- Klarifikasi Anda **diterima**: aplikasi belum punya relasi gaji karyawan, sehingga input manual ke kategori `BIAYA_POKOK_LAINNYA` adalah solusi sementara yang disengaja.
- **Revisi:** ini **bukan bug**, melainkan **keputusan desain**. Namun dampak akuntansinya nyata (menaikkan unit COGS Rp 162.516/m³, menurunkan margin ke 27,55%). Disarankan label "Gaji (Input Manual)" agar margin tidak disalahbandingkan.
- **Severity:** Medium (bukan Critical).

### 11.5 C5 (Biaya Material = Formula) — KOREKSI: VALID dan memang tidak ada data real lain

**Bukti baru:** Tidak ada tabel konsumsi/stock material (hanya `MaterialIncoming` = pembelian, dan `AggregateIncoming` = kedatangan agregat). `MaterialIncoming` September **100% material_type "Semen"**. Tidak ada log pemakaian material aktual.

**Revisi objektif:**
- Klarifikasi Anda **benar sepenuhnya**: karena produksi selalu mengikuti master formula, metode standard-cost adalah **sumber yang tersedia dan sah**. Penerimaan = pembelian, memang belum tentu terpakai bulan ini (ada carry-over stok).
- Maka selisih "terpakai 261.140 Kg vs diterima 250.000 Kg" **bukan bukti error** — bisa jadi pemakaian dari stok bulan lalu.
- **Kesimpulan:** C5 **diturunkan Critical → Low/Info**: bukan kesalahan, melainkan **keterbatasan sumber data**. Disarankan hanya **pelabelan** "Biaya Material Standar (Mix Design)".

### 11.6 C6 (PASIR/KASBON sebagai Overhead) — PENJELASAN mengapa salah

**Bukti baru:** Terdapat master kategori **"PASIR ALKON"** (id `893b…`) → sistem **mengenali pasir sebagai kategori**, tetapi classifier overhead tidak memetakannya. Detail item: "PASIR DT DD8862ML", "PASIR ALKON DT BESAR (PA 8854 AP)" — **pembayaran terkait plat dump truck** (angkut/material). "KASBON SUPIR DT A.N MU'MIN" Rp 5 jt = **kasbon (uang muka/piutang karyawan)**.

**Mengapa ini melahirkan angka salah:**
1. Algoritma [`overhead-service.ts:29-56`](src/app/(dashboard)/admin/reports/monthly-management/services/overhead-service.ts:29) mendefinisikan overhead = **semua yang BUKAN BBM & BUKAN pemeliharaan**. Maka PASIR & KASBON otomatis masuk `pureOverheadOpex`.
2. **KASBON bukan beban** → menambah overhead & menekan Net Field Contribution secara tidak sah.
3. **PASIR** (pembelian/angkut material) bukan "beban overhead murni"; membiarkannya di overhead membuat material tercatat ganda secara konsep (sekali di formula, sekali di overhead) atau minimal tidak tercatat di tempat benar.
4. Dampak terukur: 3 item = **Rp 31,55 jt dari Rp 75,56 jt** overhead "murni" (≈42%) berasal dari pos salah klasifikasi.

**Kesimpulan:** C6 tetap **valid**. Rekomendasi: pemetaan kategori → Seksi B (material) dan daftar kategori non-beban (KASBON/piutang) untuk dikecualikan dari beban.

### 11.7 H1 (Snapshot vs Live) — SOLUSI

**Bukti baru:** [`tutup-buku/actions.ts:251-306`](src/app/(dashboard)/admin/finance/tutup-buku/actions.ts:251) **sudah mendukung** `closeAllBranches` (menutup ALL + seluruh cabang). Namun September hanya punya `2026-09__ALL`, dan error penutupan cabang **ditelan tanpa gagal** (`catch { console.warn }`).

**Solusi konkret (urut prioritas):**
1. **Wajibkan** `closeAllBranches = true` saat menutup konsolidasi `ALL` (validasi di server).
2. **Jangan telan error**: kumpulkan kegagalan penutupan cabang lalu gagalkan operasi atau tampilkan peringatan tegas ke operator.
3. **Backfill** snapshot per-cabang untuk periode yang sudah CLOSED (mis. September) dari data live saat ini.
4. **Guard di report reader**: bila scope cabang tidak punya closing padahal `ALL` sudah CLOSED → tampilkan badge **"Perhitungan Live (Belum Dikunci)"**.
5. **Integritas**: bandingkan berkala `ALL` snapshot vs rekomputasi live; alert bila beda di atas ambang.

### 11.8 Status Severity Setelah Revisi

| Kode | Sebelum | Setelah Klarifikasi | Alasan Revisi |
|---|---|---|---|
| C1 | Critical | **Critical** | Rumus salah + data `payment_date` tidak akurat (2 lapis) |
| C2 | Critical | **High** | Scope BP/HO dapat diterima; isu utama pada klaim label |
| C3 | Critical | **High** | Valid, tapi akar masalah = timing dokumen/pekerjaan |
| C4 | Critical | **Medium** | Disengaja (desain sementara), bukan bug |
| C5 | Critical | **Low/Info** | Metode sah & satu-satunya sumber data tersedia |
| C6 | Critical | **Critical** | Klasifikasi keliru (KASBON bukan beban; PASIR bukan overhead) |
| H1 | High | **High** | Terbukti; solusi tersedia |
| H2, H3, H4 | High | **High** | Tetap valid |

**Peringkat perbaikan final:** C1 → C6 → H4 → H1 → H3 → C2/C3 (pelabelan) → H2.
