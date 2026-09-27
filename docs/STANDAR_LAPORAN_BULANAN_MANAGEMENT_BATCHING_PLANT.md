# STANDAR ARSITEKTUR LAPORAN BULANAN MANAJEMEN & KEUANGAN BATCHING PLANT
## Sistem Informasi Manajemen Ready-Mix — New Rajawali CRM

---

| Dokumen | Standar Laporan Bulanan Manajemen Batching Plant |
| :--- | :--- |
| **Sistem** | New Rajawali CRM (Next.js, Prisma ORM, PostgreSQL) |
| **Kategori** | Dokumen Referensi Analisis Sistem, Finansial & Operasional |
| **Status** | Disetujui sebagai Panduan Acuan Desain Laporan Bulanan |
| **Target Pengguna** | Direksi, GM Operasional, Finance & Accounting, Plant Manager, Admin Cabang |

---

## 1. Filosofi & Latar Belakang

Dalam industri manufaktur beton siap pakai (*ready-mix concrete batching plant*), **laporan keuangan akuntansi konvensional (PSAK/SAK murni) tidak mencukupi** jika disajikan secara terisolasi tanpa data operasional teknik.

### Mengapa Kenaikan Omzet Bisa Menipu?
Sebagai contoh nyata di lapangan:
$$\text{Revenue} \uparrow 15\% \quad \neq \quad \text{Kondisi Perusahaan Membaik}$$

Kondisi tersebut bisa terjadi karena anomali berikut:
* **Volume Produksi:** $+20\%$ (permintaan bertambah)
* **Harga Rata-rata Penjualan (ASP):** Turun (akibat perang harga / diskon proyek besar)
* **Biaya Bahan Baku (Material Cost):** $+28\%$ (kenaikan harga semen / agregat atau inefisiensi timbangan/pemborosan)
* **Biaya Bahan Bakar (Fuel Cost):** $+30\%$ (jarak tempuh proyek lebih jauh / kemacetan / antrean mixer lama di jobsite)
* **Hasil Akhir:** **Gross Margin justru tertekan (*squeezed margin*)**, laba bersih menurun meskipun volume dan omzet naik tajam.

Oleh karena itu, sistem pelaporan bulanan New Rajawali CRM wajib menggabungkan 5 pilar dalam satu kesatuan:
$$\mathbf{Management\ Report} = \mathbf{Financial} + \mathbf{Production} + \mathbf{Material} + \mathbf{Fleet} + \mathbf{Maintenance}$$

---

## 2. Struktur Laporan 3 Level

Laporan bulanan dirancang dalam struktur piramida informasi yang melayani kebutuhan tingkatan manajerial dari eksekutif hingga operasional lapangan:

```
┌─────────────────────────────────────────────────────────────┐
│          LEVEL 1 — EXECUTIVE MANAGEMENT DASHBOARD           │
│   (KPI Utama, Cost per m³, Unit Economics, MoM Growth)      │
├─────────────────────────────────────────────────────────────┤
│             LEVEL 2 — FINANCIAL REPORT (P&L)                │
│    (Revenue → COGS Direct → Gross Profit → OPEX → Margin)   │
├─────────────────────────────────────────────────────────────┤
│            LEVEL 3 — OPERATIONAL DETAIL DRILL-DOWN          │
│   (Produksi, Semen/Agregat, PO, Retase, BBM, Sparepart)     │
└─────────────────────────────────────────────────────────────┘
```

---

### LEVEL 1 — Executive Management Dashboard (Monthly Performance)

Ditujukan untuk **Direksi, CEO, FVP, dan Kepala Cabang** agar dapat membaca kesehatan finansial & efisiensi pabrik dalam waktu kurang dari 2 menit.

#### Ringkasan Kinerja Bulanan (Executive Card)
```text
=============================================================
MONTHLY PERFORMANCE — BATCHING PLANT KONSOLIDASI / CABANG
Periode: September 2026
=============================================================
Gross Revenue        : Rp 4.250.000.000
Volume Produksi      : 5.000 m³
Rata-rata Harga Jual : Rp 850.000 / m³

Total Direct Cost    : Rp 3.280.000.000
  ├── Material Cost  : Rp 2.450.000.000  (74,7% dari biaya)
  ├── Fuel / BBM     : Rp   300.000.000  ( 9,1% dari biaya)
  ├── Retase Supir   : Rp   350.000.000  (10,7% dari biaya)
  └── Maintenance    : Rp   180.000.000  ( 5,5% dari biaya)

Gross Profit         : Rp   970.000.000
Gross Margin %       : 22,82%
=============================================================
Pertumbuhan vs Bulan Lalu (MoM):
  • Volume Produksi  : +12,5%
  • Gross Revenue    : +15,0%
  • Unit Cost / m³   : Rp 656.000  (Bulan lalu: Rp 640.000 | +2,5%)
  • Profit / m³      : Rp 194.000  (Bulan lalu: Rp 210.000 | -7,6%)
=============================================================
```

#### KPI Kunci: Unit Economics (Biaya per m³)
Indikator terpenting bagi manajemen untuk mengetahui berapa rupiah yang dihasilkan dari setiap **$1\ \text{m}^3$** beton yang keluar dari plant:

| Indikator KPI | Realisasi (Rp / m³) | Standar Budget (Rp / m³) | Selisih (Variance) | Evaluasi |
| :--- | :---: | :---: | :---: | :--- |
| **Pendapatan Rata-rata (ASP)** | Rp 850.000 | Rp 830.000 | +Rp 20.000 | *Favorable* (Harga jual membaik) |
| **Biaya Material (Semen + Pasir + Split)** | Rp 490.000 | Rp 475.000 | +Rp 15.000 | *Unfavorable* (Pemborosan bahan / kenaikan harga) |
| **Biaya BBM (Solar Mixer + Loader)** | Rp 60.000 | Rp 55.000 | +Rp 5.000 | *Unfavorable* (Jarak cor lebih jauh / macet) |
| **Upah Langsung / Retase Supir** | Rp 70.000 | Rp 70.000 | Rp 0 | *On Target* |
| **Pemeliharaan / Sparepart Armada** | Rp 36.000 | Rp 30.000 | +Rp 6.000 | *Unfavorable* (Perbaikan besar unit mixer) |
| **Total Biaya Langsung / m³** | **Rp 656.000** | **Rp 630.000** | **+Rp 26.000** | Biaya membengkak 4,1% |
| **Gross Profit / m³** | **Rp 194.000** | **Rp 200.000** | **-Rp 6.000** | Margin kotor tertekan 3% |

---

### LEVEL 2 — Financial Report (P&L PSAK / SAK Disesuaikan)

Struktur Laba Rugi disusun mengikuti standar PSAK manufaktur dengan klasifikasi **Direct Contribution Margin**:

```text
1. REVENUE (PENDAPATAN USAHA)
   ├── Penjualan Beton Siap Pakai (Readymix Concrete)
   ├── Pendapatan Jasa Sewa Pompa Beton (Concrete Pump Rental)
   └── Pendapatan Jasa Sewa Alat Berat / Dump Truck
   ─────────────────────────────────────────────────────────────
   TOTAL REVENUE (A)

2. COST OF GOODS SOLD / BEBAN POKOK PENDAPATAN (B)
   a. Biaya Bahan Baku Langsung (Direct Materials)
      ├── Semen (Semen Curah Silo & Zak)
      ├── Pasir Cor (Fine Aggregate)
      ├── Batu Split 1/2 & 2/3 (Coarse Aggregate)
      └── Bahan Kimia / Admixture (jika ada)
   b. Biaya Tenaga Kerja Langsung Pengiriman (Direct Delivery Labor)
      ├── Retase Supir Truk Mixer
      └── Retase Pengangkutan Agregat (Dump Truck)
   c. Biaya Bahan Bakar Langsung (Direct Fuel Cost)
      ├── Solar Truk Mixer (Penyaluran Beton)
      └── Solar Wheel Loader (Feeding Material ke Hopper)
   d. Biaya Pemeliharaan Armada Langsung (Direct Fleet Maintenance)
      ├── Pengadaan Sparepart Mixer & Loader (PO Kategori SPR)
      └── Perbaikan & Servis Darurat Bengkel (Kas Kecil RBL)
   ─────────────────────────────────────────────────────────────
   TOTAL COGS (B)

3. GROSS PROFIT (LABA KOTOR) = (A) - (B)
   GROSS MARGIN % = (Gross Profit / Total Revenue) × 100%

4. OPERATING EXPENSES / BEBAN OPERASIONAL (OPEX) (C)
   a. Beban Operasional Kas Cabang (RBL Non-BBM/Sparepart) — [SUDAH ADA DI SISTEM]
      ├── Biaya Listrik Industri (PLN Plant) & Utilitas Air Kerja
      ├── Biaya ATK, Cetak Surat Jalan, Dokumentasi Proyek
      ├── Konsumsi Kerja Cor & Uang Lembur Lapangan
      └── Biaya Koordinasi Lapangan, Retribusi, Parkir & Tol Proyek
   b. Beban Tetap Non-RBL (Pusat / Head Office)* — [PERLU INPUT BULANAN]
      ├── Gaji Pokok Karyawan Tetap Cabang (Transfer Payroll HO)
      ├── Beban Sewa Lahan Jangka Panjang Plant & Mess
      └── Beban Penyusutan / Depresiasi Aset (Mesin Plant, Mixer, Genset)
   ─────────────────────────────────────────────────────────────
   TOTAL OPEX (C)

5. OPERATING PROFIT (LABA OPERASIONAL) = Gross Profit - Total OPEX
```
*\*Catatan: Biaya listrik PLN plant dan pengeluaran harian cabang sudah tercatat di sistem via modul RBL. Komponen 4.b adalah pos overhead pusat (payroll HO & depresiasi aset).*

---

### LEVEL 3 — Operational Detail & Drill-Down (Rincian Lapangan)

Menyediakan data detail analitis yang dapat ditelusuri per dokumen transaksi:
1. **Rincian Produksi:** Daftar tiket cor per tanggal, pelanggan, proyek, nomor mixer, supir, mutu beton, slump, dan status konfirmasi.
2. **Rincian Material Masuk:**
   * Semen masuk: Tanggal, no surat jalan pabrik, supplier, nomor kapsul, kuantum netto (kg), harga beli, total nominal faktur, dan nomor PO rujukan.
   * Agregat masuk: Tanggal, no bon, plat dump truck, volume (m³), jenis agregat, sumber (quarry sendiri vs beli luar), dan nilai retase sopir.
3. **Rincian Pengadaan (PO):** Daftar PO terbit, kategori (ATK, Sparepart, BBM, Semen), status persetujuan berjenjang (Draft, Submitted, Approved, Rejected).
4. **Rincian Kinerja & Biaya Armada:** Total trip, total kubikasi terkirim, jarak tempuh (KM), konsumsi liter solar, rasio efisiensi km/liter, dan riwayat penggantian suku cadang per plat nomor.
5. **Rincian Retase:** Rekapitulasi hak pendapatan komisi supir mixer dan dump truck per periode cutoff.
6. **Rincian Piutang & Billing:** Unbilled production pool (cor belum difakturkan), invoice jatuh tempo, status pembayaran, dan saldo deposit proyek.

---

## 3. Matriks Kesiapan 13 Modul Usulan di New Rajawali CRM

Audit komparatif antara 13 modul struktur pelaporan vs ketersediaan data aktual di database saat ini:

| No | Modul Usulan | Status di Sistem | Sumber Data Saat Ini | Gap / Yang Perlu Dilengkapi |
| :--- | :--- | :---: | :--- | :--- |
| **01** | **MASTER PRODUCT** | **READY (100%)** | Model `ConcreteQuality` (Katalog Mutu) | Lengkap. Sudah ada komposisi mix design (semen kg, pasir kg, batu 0.5 kg, batu 1.2 kg, batu 2.3 kg per m³). |
| **02** | **MASTER MATERIAL** | **PARSIAL (60%)** | Model `MasterItem` (PO) & enum `AggregateType` | Belum ada tabel terpusat *Raw Material Inventory Master* yang menyimpan harga pokok acuan bahan baku (Standard Cost). |
| **03** | **MASTER VEHICLE** | **READY (100%)** | Model `Vehicle`, `VehicleCategory`, `MasterSewaAlat` | Sangat lengkap. Ada plat nomor, tipe (Mixer, Loader, Dump Truck), meter KM/HM, kapasitas kubikasi DT, status rental, tarif acuan. |
| **04** | **MASTER SUPPLIER** | **READY (100%)** | Model `Supplier`, `PoCompanyGroup` | Lengkap untuk vendor pengadaan barang, sparepart, dan pabrik semen. |
| **05** | **SALES / DELIVERY** | **READY (100%)** | Model `ProductionTransaction`, `Project`, `ProjectPrice`, `Invoice` | Sangat lengkap. Setiap tiket cor terikat ke volume m³, proyek, customer, supir, mixer, dan harga kesepakatan per mutu (`ProjectPrice`). |
| **06** | **MATERIAL PURCHASE** | **READY (95%)** | Model `MaterialIncoming`, `AggregateIncoming`, `PurchaseOrder` | Semen masuk sudah mencatat harga satuan, total faktur, satuan zak/ton/kapsul curah, nomor PO rujukan. Agregat mencatat kubikasi masuk & supplier luar. |
| **07** | **MATERIAL USAGE** | **PARSIAL (Teoritis)** | Dihitung dari `volume_cubic * composition_*` di `/admin/material-usage` | **GAP:** Pemakaian dihitung matematis berdasarkan rumus resep, belum mencatat hasil penimbangan fisik riil dari sensor timbangan (*load cell actual batching*). |
| **08** | **SPAREPART** | **READY (90%)** | Model `PoItem` (kategori `SPR`) & `RblExpense` | Pembelian sparepart terikat langsung ke `vehicleId` dan mencatat meter KM/HM armada saat perbaikan. |
| **09** | **DAILY OPERATION** | **PARSIAL (75%)** | Model `RblExpense`, `RblBudget` | Pengeluaran kas kecil operasional & pengisian solar per mixer tercatat di RBL. Belum ada kartu stok fisik untuk tangki solar internal plant. |
| **10** | **PRODUCTION** | **READY (100%)** | Model `ProductionTransaction` | Sangat lengkap. Akumulasi m³ harian, bulanan, per cabang, per mutu, per trip. |
| **11** | **INVENTORY** | **BELUM LENGKAP (GAP)** | Estimasi virtual di Dashboard (`Total In - Total Out`) | **GAP KRITIS:** Belum ada tabel **Stock Opname Fisik** berkala (sounding silo semen & ukur stockpile agregat) untuk membukukan *material variance / losses*. |
| **12** | **MONTHLY P&L** | **BELUM ADA ENGINE** | Belum ada tabel agregasi laba rugi bulanan | Kalkulasi omzet dan biaya masih tersebar di modul masing-masing, belum terkonsolidasi menjadi satu laporan P&L resmi. |
| **13** | **MANAGEMENT DASHBOARD** | **PARSIAL (70%)** | Halaman `/admin` (`dashboard-client.tsx`) | Menampilkan omzet estimasi dan volume m³, tapi **belum ada metrik Cost per m³, Gross Margin %, dan breakdown biaya per m³**. |

---

## 4. Analisis Kritis: Plus, Minus, dan Gap Data

### A. Kelebihan Sistem Saat Ini (PLUS)
1. **Harga Pendapatan Sangat Presisi (`ProjectPrice`):**
   Sistem tidak mengalikan volume dengan harga taksiran flat. Omzet dihitung berdasarkan kontrak harga spesifik per mutu untuk setiap proyek pelanggan (`ProjectPrice.price × volume_cubic`).
2. **Biaya Tenaga Kerja Pengiriman (Retase) Otomatis:**
   Komisi supir mixer dihitung otomatis berdasarkan rumus jarak (KM) dan kubikasi (m³) secara real-time melalui modul `Retase`. Tidak ada asumsi kasar untuk biaya tenaga kerja langsung pengiriman.
3. **Pencatatan Armada Terintegrasi:**
   Pengeluaran bahan bakar di kas kecil (`RblExpense`) dan pembelian suku cadang di PO logistik (`PoItem`) sudah memiliki kolom `vehicleId`. Ini memungkinkan isolasi biaya pemeliharaan per unit truk mixer.
4. **Integrasi Semen Masuk & PO:**
   Fitur semen masuk sudah dilengkapi harga riil per transaksi dan kemampuan membaca saldo PO logistik.

---

### B. Kekurangan & Hal yang Belum Ada di Sistem (MINUS / GAPS)

#### 1. Konsumsi Material Masih Teoritis (Theoretical vs Actual Variance)
* **Kondisi:** Sistem menghitung pemakaian bahan: $\text{Volume Cor} \times \text{Standar Komposisi Mutu}$.
* **Kelemahan:** Pada kenyataan pabrik, timbangan mixer plant selalu memiliki toleransi deviasi (misal: over-batching semen +1,5% karena kalibrasi timbangan atau kelembaban pasir basah). Sistem belum mencatat angka riil timbangan batching plant.

#### 2. Ketiadaan Formulir Stock Opname Fisik Silo & Stockpile (Inventory Variance)
* **Kondisi:** Stok semen dihitung secara virtual: $\text{Total Semen Masuk} - \text{Total Semen Keluar Teoritis}$.
* **Kelemahan:** Dalam operasional semen curah, selalu ada faktor *losses* (debu hisap saat tiup semen kapsul, residu mengeras di dinding silo). Tanpa formulir **Stock Opname Fisik Akhir Bulan**, sistem tidak dapat menghitung nilai rupiah dari *Material Losses / Penyusutan Semen*.

#### 3. Valuasi Agregat Quarry Internal (`source_type: Internal`)
* **Kondisi:** Pasir dan batu split dari tambang sendiri saat ini hanya dicatat volume kubikasi dan ongkos retase supir dump truck (`retase_amount`).
* **Kelemahan:** Operasional penambangan di quarry memiliki biaya pokok (solar excavator, upah operator crusher, aus jaw plate). Jika agregat internal dianggap "gratis" (hanya bayar retase angkut), maka HPP beton di plant akan terlihat **terlalu murah (*untung semu*)**. Perlu ditetapkan *Internal Transfer Price* (misal: Pasir internal dinilai Rp 85.000/m³).

#### 4. Komponen Beban Tetap Non-RBL (Overhead dari Kantor Pusat)
* **Kondisi:** Sistem mencatat pengeluaran kas operasional cabang (RBL) dan pembelian barang (PO). **Biaya listrik PLN batching plant dan air kerja sudah tercatat di RBL.**
* **Hal yang Belum Tercatat di Sistem Saat Ini:**
  * Gaji pokok bulanan karyawan tetap cabang (Operator, Admin, QC, Mekanik, Satpam) yang ditransfer langsung dari kantor pusat (Payroll HO).
  * Beban sewa tanah jangka panjang batching plant & mess karyawan.
  * Beban penyusutan / depresiasi aset tetap (mesin batching plant, truk mixer, wheel loader).
* **Dampak Finansial:** Laporan laba rugi otomatis yang dapat langsung dihasilkan sistem saat ini adalah **Gross Profit / Direct Contribution Margin** serta **Operating Expenses Lapangan** (karena biaya listrik PLN, BBM, dan biaya kas cabang sudah tercatat di RBL). Untuk menyempurnakan menjadi **True Net Operating Profit (EBITDA)** standar PSAK, hanya diperlukan modul sederhana untuk memasukkan beban tetap dari kantor pusat (payroll staf & depresiasi aset).

#### 5. Pelacakan Jam Kerusakan Armada & Plant (Downtime Tracking)
* **Kondisi:** Sistem mencatat kilometer/hour meter dan status unit (Tersedia, Disewa, Maintenance).
* **Kelemahan:** Belum ada modul pencatatan jam berhenti operasi (*downtime hours*) dan penyebab insiden (misal: mixer mogok di proyek 4 jam, plant mati lampu 2 jam), sehingga metrik efisiensi ketersediaan armada (*Fleet Availability Rate*) belum terhitung.

---

## 5. Rancangan Formula Kalkulasi Unit Economics (Cost per m³)

Berikut adalah formula baku yang diimplementasikan pada kalkulasi bulanan:

$$\text{Total Production Volume} = \sum_{i=1}^{n} \text{ProductionTransaction.volume\_cubic} \quad (\text{Status} = \text{'Confirmed'})$$

$$\text{Gross Revenue} = \sum (\text{volume\_cubic} \times \text{ProjectPrice.price})$$

$$\text{Average Selling Price (ASP) per m}^3 = \frac{\text{Gross Revenue}}{\text{Total Production Volume}}$$

$$\text{Material Cost per m}^3 = \frac{\sum (\text{Semen Cost} + \text{Pasir Cost} + \text{Split Cost})}{\text{Total Production Volume}}$$

$$\text{Fuel Cost per m}^3 = \frac{\sum \text{RblExpense}(\text{Category} = \text{'BBM/Solar'})}{\text{Total Production Volume}}$$

$$\text{Delivery Labor Cost per m}^3 = \frac{\sum \text{Retase.income\_amount}}{\text{Total Production Volume}}$$

$$\text{Maintenance Cost per m}^3 = \frac{\sum \text{PoItem}(\text{Cat} = \text{'SPR'}) + \sum \text{RblExpense}(\text{Cat} = \text{'Sparepart/Bengkel'})}{\text{Total Production Volume}}$$

$$\mathbf{Total\ Direct\ Cost\ per\ m}^3 = \text{Material/m}^3 + \text{Fuel/m}^3 + \text{Delivery/m}^3 + \text{Maintenance/m}^3$$

$$\mathbf{Gross\ Profit\ per\ m}^3 = \text{ASP per m}^3 - \text{Total Direct Cost per m}^3$$

$$\mathbf{Gross\ Margin\ \%} = \left(\frac{\text{Gross Profit per m}^3}{\text{ASP per m}^3}\right) \times 100\%$$

---

## 6. Roadmap Implementasi Bertahap

Untuk menerapkan standar laporan ini secara mulus tanpa mengganggu operasional yang sedang berjalan, disarankan 3 fase pengembangan:

```
┌────────────────────────────────────────────────────────────────────────┐
│ FASE 1: QUICK WIN & HIGH VALUE                                         │
│ • Buat Halaman Baru: /admin/reports/monthly-management                 │
│ • Tampilkan LEVEL 1 (Dashboard Cost/m³) & LEVEL 2 (Gross Margin P&L)   │
│ • Manfaatkan 100% data live yang sudah ada di database saat ini       │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│ FASE 2: PENYEMPURNAAN OPERASIONAL & INVENTORI                          │
│ • Tambah Fitur Form Stock Opname Akhir Bulan (Silo & Stockpile)        │
│ • Tambah Skema Biaya Acuan Agregat Internal Quarry                     │
│ • Munculkan Analisis Selisih Pemakaian Bahan (Material Losses %)       │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│ FASE 3: FULL ABSORPTION COSTING (PSAK PURNA)                           │
│ • Form Sederhana Input Beban Tetap Non-RBL (Gaji Staf HO, Sewa Lahan)  │
│ • Tampilkan Net Operating Profit / EBITDA resmi per cabang             │
│ • Tambah Modul Downtime Unit & Plant                                   │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 7. Kesimpulan & Rekomendasi

1. **Konsep pelaporan 3 level yang diusulkan adalah standar emas (*best practice*) industri ready-mix**, dan New Rajawali CRM sangat layak mengadopsinya.
2. **Kekuatan terbesar sistem kita saat ini adalah di sisi operasional langsung & biaya lapangan:** volume cor m³, harga kontrak per mutu, komisi supir, semen masuk, biaya sparepart per mixer, serta **biaya listrik PLN & operasional kas cabang sudah tercatat rapi di RBL**.
3. **Fase 1 dapat langsung dieksekusi** untuk memberikan visibilitas kepada manajemen mengenai **Revenue/m³, Direct Cost/m³, dan Gross Profit/m³** tanpa perlu menambah tabel database baru.
4. **Kelemahan sistem (Stock Opname Fisik & Beban Tetap Payroll HO)** dapat dilengkapi secara bertahap pada Fase 2 dan 3 agar laporan keuangan bertransformasi dari sekadar *Operational Contribution Margin* menjadi *Full SAK/PSAK Financial Statement*.

---
*Dokumen ini disimpan di: `docs/STANDAR_LAPORAN_BULANAN_MANAGEMENT_BATCHING_PLANT.md` sebagai acuan resmi arsitektur pelaporan manajemen New Rajawali CRM.*
