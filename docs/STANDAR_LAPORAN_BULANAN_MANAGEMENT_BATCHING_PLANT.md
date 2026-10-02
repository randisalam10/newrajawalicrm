# STANDAR ARSITEKTUR & SPESIFIKASI LAPORAN BULANAN MANAJEMEN BATCHING PLANT
## Sistem Informasi Manajemen Ready-Mix — New Rajawali CRM (v2.4.8)

---

| Dokumen | Standar Spesifikasi & Arsitektur Laporan Bulanan Manajemen Batching Plant |
| :--- | :--- |
| **Aplikasi / Sistem** | New Rajawali CRM (Next.js 16, Prisma ORM 5.22, PostgreSQL) |
| **Versi Referensi** | v2.4.8 (Updated dengan Master Material Multi-Cabang, Sewa Alat, PO Multi-Approval, RBL, Billing) |
| **Status Dokumen** | **Disetujui sebagai Cetak Biru (Blueprint) Generator Laporan Bulanan Web App** |
| **Target Pengguna** | Direksi (CEO / FVP), GM Operasional, Finance & Accounting, Plant Manager, Admin Logistik |
| **Format Standar Laporan** | **1. Summary (Halaman Depan) $\rightarrow$ 2. Gambaran Umum $\rightarrow$ 3. Detail** |

---

## 1. Prinsip & Filosofi Integrasi Teknik-Finansial

Dalam industri manufaktur beton siap pakai (*ready-mix concrete batching plant*), **laporan keuangan akuntansi konvensional (PSAK/SAK murni) tidak mencukupi** jika disajikan secara terisolasi tanpa data operasional teknik.

### Mengapa Kenaikan Omzet Bisa Menipu?
Sebagai contoh nyata di lapangan industri ready-mix:
$$\text{Gross Revenue} \uparrow 15\% \quad \neq \quad \text{Perusahaan Menghasilkan Laba Sehat}$$

Fenomena tersebut sering terjadi karena anomali berikut:
* **Volume Produksi:** Naik $+20\%$ (permintaan proyek bertambah).
* **Harga Rata-rata Penjualan (ASP):** Turun akibat perang harga atau diskon volume berlebihan.
* **Biaya Bahan Baku (Material Cost):** Naik $+28\%$ akibat fluktuasi harga agregat lokal atau pemborosan takaran semen curah.
* **Biaya Bahan Bakar (Fuel Cost):** Melonjak $+30\%$ karena antrean truk mixer yang lama di jobsite atau rute macet.
* **Hasil Akhir:** **Gross Margin tertekan (*squeezed margin*)**, laba bersih tergerus meskipun volume dan omzet tercatat rekor tertinggi.

Oleh karena itu, sistem pelaporan bulanan New Rajawali CRM mengintegrasikan 5 pilar utama ke dalam satu laporan terpadu:
$$\mathbf{Monthly\ Management\ Report} = \mathbf{Produksi} + \mathbf{Material} + \mathbf{Armada\ \&\ BBM} + \mathbf{Keuangan\ \&\ Kas} + \mathbf{Billing\ \&\ Piutang}$$

---

## 2. Struktur Standar Laporan Bulanan (3 Bagian Wajib)

Sesuai kebutuhan manajerial dari tingkatan dewan direksi hingga supervisor lapangan, format laporan bulanan yang digenerate oleh sistem diatur dalam **3 Bagian Utama yang Berurutan**:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       BAGIAN 1: SUMMARY (HALAMAN DEPAN)                     │
│  Ringkasan Eksekutif, Executive KPI Scorecard, Unit Economics per 1 m³      │
│  MoM Performance Comparison & Peringatan Dini Operasional (Critical Alerts) │
├─────────────────────────────────────────────────────────────────────────────┤
│                    BAGIAN 2: GAMBARAN UMUM (MACRO OVERVIEW)                 │
│  Komparasi Antar Cabang/Plant, Distribusi Mutu Beton, Top 5 Proyek/Customer │
│  Struktur Komposisi Biaya Produksi, Utilisasi Kapasitas Plant & Lini Sewa   │
├─────────────────────────────────────────────────────────────────────────────┤
│                      BAGIAN 3: DETAIL (OPERATIONAL DRILL-DOWN)              │
│  Detail Produksi Tiket Cor, Arus Bahan Baku Masuk/Keluar, Pengadaan PO,     │
│  Kinerja Armada & Solar, Retase Supir, Sewa Alat, Beban Kas RBL, AR Aging   │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

# BAGIAN 1: SUMMARY (HALAMAN PALING AWAL / EXECUTIVE SCORECARD)

> [!IMPORTANT]
> **Bagian 1 (Summary)** harus berada di **halaman paling pertama** dari dokumen cetak PDF maupun tampilan default layar aplikasi. Tujuannya adalah agar **Direksi (CEO/FVP) dan Kepala Cabang dapat membaca kondisi kesehatan pabrik dalam waktu kurang dari 2 menit.**

### 1.1 Executive Performance Scorecard (Ringkasan Finansial & Operasional)
Menyajikan angka bulat konsolidasi atau cabang terpilih untuk periode bulan berjalan:

```text
========================================================================================
LAPORAN KINERJA EKSEKUTIF BULANAN — BATCHING PLANT [NAMA CABANG / KONSOLIDASI]
Periode: [Bulan] [Tahun] | Status: Terverifikasi
========================================================================================
A. VOLUME & PENDAPATAN (REVENUE)
   • Total Volume Produksi Beton : 4.850,00 m³      (Target: 5.000,00 m³ | 97,0%)
   • Gross Revenue Readymix      : Rp 4.122.500.000 (Rata-rata ASP: Rp 850.000 / m³)
   • Pendapatan Sewa Alat Berat  : Rp   215.000.000 (Pompa Beton, Excavator, Dump Truck)
   • Pendapatan Penjualan Agregat: Rp    85.000.000 (Pasir & Split komersial keluar)
   ────────────────────────────────────────────────────────────────────────────────────
   TOTAL REVENUE USAHA (A)       : Rp 4.422.500.000

B. BIAYA POKOK LANGSUNG PRODUKSI (DIRECT COGS)
   • Bahan Baku Beton (Material) : Rp 2.376.500.000 (Semen, Pasir, Split 1/2, Split 2/3)
   • Bahan Bakar Solar Langsung  : Rp   315.250.000 (Mixer & Wheel Loader Feeding)
   • Upah Langsung (Retase Supir): Rp   339.500.000 (Sopir Truk Mixer & Sopir DT)
   • Pemeliharaan & Suku Cadang  : Rp   169.750.000 (PO Sparepart SPR & Bengkel Darurat)
   ────────────────────────────────────────────────────────────────────────────────────
   TOTAL BIAYA LANGSUNG (B)      : Rp 3.201.000.000 (Unit Direct Cost: Rp 660.000 / m³)

C. LABA KOTOR (GROSS PROFIT)
   • Gross Profit Readymix & Jasa: Rp 1.221.500.000
   • GROSS PROFIT MARGIN         : 27,62%           (Bulan Lalu: 26,10% | +1,52%)

D. BEBAN OPERASIONAL KAS CABANG (RBL OPEX)
   • Beban Listrik PLN Plant & Air: Rp    48.500.000
   • Konsumsi Lembur & Lapangan  : Rp    24.200.000
   • ATK, Surat Jalan & Dokumen  : Rp     9.800.000
   • Koordinasi, Retribusi & Tol : Rp    14.500.000
   ────────────────────────────────────────────────────────────────────────────────────
   TOTAL BEBAN KAS LAPANGAN (D)  : Rp    97.000.000 (Plafon Budget RBL: Rp 105.000.000)

E. KONTRIBUSI OPERASIONAL BERSIH (NET FIELD CONTRIBUTION)
   • Field Contribution Margin   : Rp 1.124.500.000 (25,43% dari Revenue Usaha)
========================================================================================
```

---

### 1.2 Unit Economics Card (Biaya Produksi per $1\ \text{m}^3$ Beton)
Indikator terpenting untuk mengukur efisiensi teknis pabrik per satuan kubik beton yang dihasilkan:

| Komponen Biaya per $1\ \text{m}^3$ Beton | Realisasi Bulan Ini | Standar Budget | Selisih (Variance) | Persentase dari Biaya | Evaluasi Efisiensi |
| :--- | :---: | :---: | :---: | :---: | :--- |
| **Harga Jual Rata-rata (ASP / m³)** | **Rp 850.000** | **Rp 835.000** | **+Rp 15.000** | — | *Favorable* (Harga kontrak membaik) |
| 1. Semen (Curah & Zak) | Rp 320.000 | Rp 310.000 | +Rp 10.000 | 48,5% | *Unfavorable* (Kenaikan harga beli semen) |
| 2. Pasir Cor (Fine Aggregate) | Rp 95.000 | Rp 95.000 | Rp 0 | 14,4% | *On Target* |
| 3. Batu Split (1/2 & 2/3) | Rp 75.000 | Rp 70.000 | +Rp 5.000 | 11,4% | *Unfavorable* (Efisiensi crushing quarry) |
| 4. Bahan Bakar Solar Armada | Rp 65.000 | Rp 60.000 | +Rp 5.000 | 9,8% | *Unfavorable* (Jarak cor >18 KM / macet) |
| 5. Retase Supir Truk Mixer | Rp 70.000 | Rp 70.000 | Rp 0 | 10,6% | *On Target* (Sesuai tarif km) |
| 6. Suku Cadang & Bengkel | Rp 35.000 | Rp 30.000 | +Rp 5.000 | 5,3% | *Unfavorable* (Pergantian ban & bearing) |
| **Total Biaya Langsung (COGS / m³)** | **Rp 660.000** | **Rp 635.000** | **+Rp 25.000** | **100,0%** | **Biaya Membengkak 3,9%** |
| **Gross Profit per m³** | **Rp 190.000** | **Rp 200.000** | **-Rp 10.000** | — | **Margin tertekan Rp 10.000/m³** |

---

### 1.3 Perbandingan Month-over-Month (MoM Growth & Trend)
Tabel perbandingan pertumbuhan terhadap bulan sebelumnya:

| Parameter Kinerja | Bulan Lalu | Bulan Ini | Pertumbuhan (MoM) | Arah Tren |
| :--- | :---: | :---: | :---: | :---: |
| **Volume Produksi Beton (m³)** | 4.310,00 m³ | 4.850,00 m³ | $+12,53\%$ | $\blacktriangle$ Positif (Volume naik) |
| **Gross Revenue Usaha (Rp)** | Rp 3.845.000.000 | Rp 4.422.500.000 | $+15,02\%$ | $\blacktriangle$ Positif |
| **Rata-rata Harga Jual (ASP / m³)** | Rp 842.000 | Rp 850.000 | $+0,95\%$ | $\blacktriangle$ Positif |
| **Total Direct Cost / m³** | Rp 648.000 | Rp 660.000 | $+1,85\%$ | $\blacktriangledown$ Negatif (Biaya naik) |
| **Gross Profit per m³** | Rp 194.000 | Rp 190.000 | $-2,06\%$ | $\blacktriangledown$ Waspada |
| **Gross Margin %** | 23,04% | 22,35% | $-0,69\%$ | $\blacktriangledown$ Waspada |
| **Rasio Biaya Solar terhadap Revenue** | 6,85% | 7,13% | $+0,28\%$ | $\blacktriangledown$ Perlu Audit Rute |
| **Piutang Usaha Jatuh Tempo >30 Hari** | Rp 480.000.000 | Rp 520.000.000 | $+8,33\%$ | $\blacktriangledown$ Waspada Penagihan |

---

### 1.4 Peringatan Dini Eksekutif (Critical Operational Alerts)
Kotak peringatan otomatis yang di-generate sistem jika terdapat anomali operasional:

> [!WARNING]
> * **BBM Solar Warning:** Rata-rata konsumsi BBM solar armada mixer mencapai $1,35\ \text{liter/m}^3$ (ambang batas normal: $\le 1,15\ \text{liter/m}^3$). Terjadi lonjakan pada rute Proyek Bandara karena antrean pompa cor lebih dari 2 jam.
> * **Material Variance Alert:** Estimasi pemakaian semen melebihi standar teoritis mix design sebesar $+2,1\%$. Disarankan kalibrasi timbangan load cell batching plant minggu ini.
> * **AR Aging Alert:** Terdapat 3 invoice proyek jatuh tempo di atas 45 hari senilai Rp 342.000.000 yang belum menerima pembayaran termin.
> * **RBL Budget Status:** Realisasi kas kecil cabang mencapai 92,3% dari plafon budget pada hari ke-26 (Aman / Sisa Plafon Rp 8.000.000).

---

# BAGIAN 2: GAMBARAN UMUM (MACRO OVERVIEW & ANALISIS KOMPARATIF)

> [!NOTE]
> **Bagian 2 (Gambaran Umum)** ditujukan untuk **GM Operasional, Finance Manager, dan Kepala Cabang** guna melihat pola distribusi, perbandingan performa antar cabang/plant, struktur biaya makro, dan utilisasi kapasitas.

---

### 2.1 Komparasi Kinerja Antar Cabang / Batching Plant (Multi-Branch Benchmark)
Jika laporan digenerate untuk **Semua Cabang (Konsolidasi)**, sistem menyajikan perbandingan kinerja seluruh cabang aktif:

| Nama Cabang / Plant | Volume (m³) | Target (m³) | Achievement % | Gross Revenue (Rp) | ASP / m³ | COGS / m³ | Gross Margin % | Realisasi RBL |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Cabang Sorong** | 2.850,00 | 3.000,00 | 95,0% | Rp 2.451.000.000 | Rp 860.000 | Rp 655.000 | 23,84% | Rp 52.000.000 |
| **Cabang Youtefa** | 1.420,00 | 1.500,00 | 94,7% | Rp 1.192.800.000 | Rp 840.000 | Rp 662.000 | 21,19% | Rp 31.500.000 |
| **Cabang Jayapura** | 580,00 | 500,00 | 116,0% | Rp 478.700.000 | Rp 825.300 | Rp 678.000 | 17,85% | Rp 13.500.000 |
| **TOTAL KONSOLIDASI** | **4.850,00** | **5.000,00** | **97,0%** | **Rp 4.122.500.000** | **Rp 850.000** | **Rp 660.000** | **22,35%** | **Rp 97.000.000** |

---

### 2.2 Distribusi Volume Produksi Berdasarkan Mutu Beton
Menampilkan mutu beton yang diproduksi beserta persentase kontribusi volume dan rata-rata harga jual:

| No | Kode Mutu Beton | Deskripsi Karakteristik | Volume (m³) | Porsi Volume (%) | Rata-rata ASP / m³ | Total Nilai Penjualan (Rp) |
| :---: | :--- | :--- | :---: | :---: | :---: | :---: |
| 1 | **K-300** | Struktur Balok, Kolom, Plat Lantai | 1.850,00 | 38,14% | Rp 885.000 | Rp 1.637.250.000 |
| 2 | **K-250** | Rigid Pavement / Jalan Beton | 1.320,00 | 27,22% | Rp 835.000 | Rp 1.102.200.000 |
| 3 | **K-225** | Sloof & Pondasi Perumahan | 840,00 | 17,32% | Rp 810.000 | Rp 680.400.000 |
| 4 | **K-175** | Lantai Kerja (Lean Concrete) | 410,00 | 8,45% | Rp 740.000 | Rp 303.400.000 |
| 5 | **K-350 / Fc' 30** | Jembatan & Dermaga Khusus | 310,00 | 6,39% | Rp 965.000 | Rp 299.150.000 |
| 6 | **Mutu Lainnya** | K-125, K-400, Mortar | 120,00 | 2,48% | Rp 834.167 | Rp 100.100.000 |
| **TOTAL** | | | **4.850,00** | **100,00%** | **Rp 850.000** | **Rp 4.122.500.000** |

---

### 2.3 Top 5 Pelanggan & Proyek Terbesar (Pareto Revenue)
Menampilkan 5 proyek penyumbang omzet terbesar bulan ini:

| No | Nama Pelanggan (Customer) | Nama Proyek | Volume (m³) | Nilai Kontrak Cor (Rp) | % dari Omzet | Status Penagihan |
| :---: | :--- | :--- | :---: | :---: | :---: | :--- |
| 1 | **PT Adhi Karya (Persero) Tbk** | Preservasi Jalan Nasional KM 18 | 1.250,00 | Rp 1.043.750.000 | 25,32% | Sudah Diterbitkan Faktur |
| 2 | **PT Hutama Karya (Persero)** | Pembangunan Dermaga Petikemas | 890,00 | Rp 792.100.000 | 19,21% | Parsial Dibayar |
| 3 | **PT Nindya Karya** | Gedung Rumah Sakit Regional | 680,00 | Rp 601.800.000 | 14,60% | Sudah Diterbitkan Faktur |
| 4 | **CV Papua Maju Mandiri** | Ruko & Gudang Sentani | 420,00 | Rp 348.600.000 | 8,46% | Lunas (Deposit) |
| 5 | **PT Bumi Cendrawasih Perkasa** | Saluran Drainase Perkotaan | 310,00 | Rp 251.100.000 | 6,09% | Belum Ditagih (Unbilled) |
| — | **Pelanggan Lainnya (14 Klien)** | 18 Proyek Retail & Swasta | 1.300,00 | Rp 1.085.150.000 | 26,32% | Campuran |

---

### 2.4 Struktur Komposisi Beban Biaya Pokok (Cost Composition Breakdown)
Pembagian persentase beban terhadap Total Direct Cost:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                 KOMPOSISI BIAYA POKOK LANGSUNG PRODUKSI                     │
│                                                                             │
│  [■■■■■■■■■■■■■■■■■■■■■■■■] Semen Curah & Zak               : 48,5%         │
│  [■■■■■■■]                  Pasir Cor (Fine Aggregate)      : 14,4%         │
│  [■■■■■]                    Batu Split 1/2 & 2/3            : 11,4%         │
│  [■■■■■]                    Retase Supir Truk Mixer & DT    : 10,6%         │
│  [■■■■]                     BBM Solar Armada (Mixer/Loader) :  9,8%         │
│  [■■]                       Suku Cadang & Bengkel Lapangan  :  5,3%         │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### 2.5 Utilisasi Kapasitas Batching Plant & Armada Pengiriman
Mengukur seberapa optimal aset modal bekerja selama bulan berjalan:

* **Kapasitas Terpasang Pabrik:** $60\ \text{m}^3/\text{jam} \times 8\ \text{jam} \times 26\ \text{hari} = 12.480\ \text{m}^3/\text{bulan}$.
* **Realisasi Volume Produksi:** $4.850\ \text{m}^3$.
* **Plant Capacity Utilization:** **$38,86\%$** *(Tersedia ruang ekspansi volume tanpa perlu belanja modal baru)*.
* **Kinerja Armada Truk Mixer:**
  * Jumlah Armada Aktif: 12 Unit Mixer.
  * Total Trip Pengiriman: 835 Ritase.
  * Rata-rata Ritase per Mixer: 69,5 Rit/bulan ($\approx 2,67\ \text{rit/hari per mixer}$).
  * Rata-rata Muatan per Trip: $5,80\ \text{m}^3/\text{trip}$ (dari kapasitas bak $7\ \text{m}^3 \rightarrow 82,8\%$ muatan penuh).

---

### 2.6 Pendapatan Lini Usaha Sekunder (Non-Ready Mix)
Pendapatan tambahan yang mendukung arus kas cabang:

1. **Jasa Sewa Alat Berat & Kendaraan (`SewaTransaction`):**
   * Total Hari Sewa Terlayani: 42 Hari-Unit.
   * Unit Tersewa: Concrete Pump (30 hari), Dump Truck Komersial (8 hari), Excavator (4 hari).
   * Total Pendapatan Sewa: **Rp 215.000.000** (Rincian pada Bagian 3.6).
2. **Penjualan Agregat Bebas (`AggregateOutgoing` Kategori `PENJUALAN`):**
   * Volume Pasir Keluar: $250\ \text{m}^3$ (Rp 45.000.000).
   * Volume Batu Split Keluar: $180\ \text{m}^3$ (Rp 40.000.000).
   * Total Pendapatan Agregat: **Rp 85.000.000** (Rincian pada Bagian 3.2).

---

# BAGIAN 3: DETAIL (OPERATIONAL & FINANCIAL DRILL-DOWN)

> [!TIP]
> **Bagian 3 (Detail)** menyediakan data audit teknis dan akuntansi lapangan yang dapat ditelusuri per dokumen transaksi, nomor bukti, nomor polisi armada, nama supir, dan nomor PO.

---

### 3.1 Detail Produksi & Penjualan Beton Ready-Mix
*Sumber Data: Model `ProductionTransaction`, `Project`, `ProjectPrice`, `ConcreteQuality`, `Vehicle`, `Employee`*

| No Tiket | Tanggal | Proyek & Pelanggan | Mutu Beton | Vol (m³) | No Pol Mixer | Sopir | Harga Satuan (Rp) | Total Nilai (Rp) | Status |
| :--- | :---: | :--- | :---: | :---: | :---: | :--- | :---: | :---: | :---: |
| **TK-260901-001** | 01/09 | Preservasi Jalan (PT Adhi Karya) | K-250 | 6,00 | DS 9123 AB | Budi Utomo | Rp 835.000 | Rp 5.010.000 | Confirmed |
| **TK-260901-002** | 01/09 | Dermaga Petikemas (PT Hutama Karya) | K-300 | 7,00 | DS 9124 AB | Agus Santoso | Rp 885.000 | Rp 6.195.000 | Confirmed |
| **TK-260901-003** | 01/09 | RS Regional (PT Nindya Karya) | K-300 | 6,50 | DS 9125 AB | Dedi Prasetyo | Rp 885.000 | Rp 5.752.500 | Confirmed |
| *... (832 tiket lainnya)* | ... | ... | ... | ... | ... | ... | ... | ... | ... |
| **SUBTOTAL BULANAN** | | **835 Trip Pengiriman** | | **4.850 m³** | | | | **Rp 4.122.500.000** | |

*Filter & Subtotal Tersedia:* Dapat dikelompokkan per Tanggal Harian, per Proyek, per Mutu, atau per Unit Truk Mixer.

---

### 3.2 Detail Arus Bahan Baku Masuk, Keluar & Rekonsiliasi Material
*Sumber Data: Model `MaterialIncoming`, `AggregateIncoming`, `AggregateOutgoing`, `MasterMaterial`, `MaterialPriceHistory`*

#### A. Rekap Semen Masuk (`MaterialIncoming`)
* **Total Semen Masuk:** 1.840.000 Kg (1.840 Ton / setara 46 Kapsul Curah).
* **Nilai Pengadaan Semen:** Rp 1.552.000.000 (Rata-rata: Rp 843,48 / Kg).
* **Vendor Utama:** PT Semen Tonasa (65%) & PT Semen Bosowa (35%).
* **Status Linkage PO:** 100% penerimaan terhubung dengan nomor `PurchaseOrder` logistik.

#### B. Rekap Agregat Masuk (`AggregateIncoming`)
* **Pasir Cor Masuk:** $3.680\ \text{m}^3$ (Rp 349.600.000 | Internal Quarry: 82%, Vendor Luar: 18%).
* **Batu Split 1/2 Masuk:** $2.240\ \text{m}^3$ (Rp 235.200.000).
* **Batu Split 2/3 Masuk:** $1.910\ \text{m}^3$ (Rp 200.550.000).
* **Material Custom (Other):** Abu batu / sirtu timbunan sebanyak $420\ \text{m}^3$ (Rp 39.150.000).
* **Total Ongkos Retase Sopir DT Masuk:** Rp 142.300.000.

#### C. Rekap Pengeluaran Agregat Non-Batching (`AggregateOutgoing`)
* **Kategori Penjualan Komersial:** $430\ \text{m}^3$ (Total Nilai: Rp 85.000.000).
* **Kategori Internal Proyek / Fasilitas Plant:** $110\ \text{m}^3$ (Perkerasan jalan akses plant).
* **Kategori Transfer Antar Cabang:** $0\ \text{m}^3$.

#### D. Rekonsiliasi Pemakaian Material (Teoritis Mix Design vs Masuk)
| Jenis Material | Stok Awal (Est.) | Total Masuk | Pemakaian Teoritis Cor | Penjualan Keluar | Saldo Akhir Virtual | Indikasi Variansi |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Semen Curah (Kg)** | 145.000 | 1.840.000 | 1.746.000 | 0 | 239.000 | $+1,8\%$ pemakaian |
| **Pasir Cor (m³)** | 420 | 3.680 | 3.492 | 250 | 358 | Sesuai batas wajar |
| **Batu Split 1/2 (m³)** | 280 | 2.240 | 2.134 | 90 | 296 | Sesuai batas wajar |
| **Batu Split 2/3 (m³)** | 310 | 1.910 | 1.843 | 90 | 287 | Sesuai batas wajar |

---

### 3.3 Detail Pengadaan Barang & Logistik (Purchase Orders)
*Sumber Data: Model `PurchaseOrder`, `PoItem`, `PoCategory`, `Supplier`*

| No PO | Tanggal | Kategori | Supplier / Rekanan | Nilai PO (Rp) | Keterangan / Unit Armada | Status Persetujuan |
| :--- | :---: | :---: | :--- | :---: | :--- | :--- |
| **045/RPJ/SPR/09/2026** | 04/09 | SPR | CV Maju Motor Diesel | Rp 28.500.000 | Ganti Seal Pompa & Bearing Mixer 04 | Approved (CEO & FVP) |
| **046/RPJ/BBM/09/2026** | 08/09 | BBM | PT Pertamina Patra Niaga | Rp 165.000.000 | Solar Industri 10.000 L Silo Plant | Approved (CEO & FVP) |
| **047/RPJ/ATK/09/2026** | 12/09 | ATK | Toko Sinar Terang | Rp 4.200.000 | Kertas Surat Jalan 3 Rangkap & Toner | Approved |
| **048/RPJ/SPR/09/2026** | 19/09 | SPR | PT Traktor Nusantara | Rp 42.000.000 | Sparepart Silinder Bucket Loader | Approved (CEO & FVP) |
| *... (18 PO lainnya)* | ... | ... | ... | ... | ... | ... |
| **TOTAL NILAI PO BULANAN**| | | | **Rp 485.700.000** | **22 PO Terbit** | **20 Approved, 2 Draft** |

---

### 3.4 Detail Kinerja Armada & Konsumsi Bahan Bakar (BBM)
*Sumber Data: Model `Vehicle`, `RblExpense` (Kategori BBM), `ProductionTransaction`*

| No Polisi | Kode | Tipe | Driver Utama | Ritase Cor | Volume (m³) | KM / HM Tempuh | Biaya Solar (Rp) | Liter Solar (Est.) | Rasio Konsumsi |
| :--- | :---: | :---: | :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **DS 9123 AB** | M-01 | Mixer | Budi Utomo | 78 | 452,40 | 1.840 KM | Rp 24.500.000 | 1.485 L | $0,31\ \text{m}^3/\text{L}$ ($1,24\ \text{KM/L}$) |
| **DS 9124 AB** | M-02 | Mixer | Agus Santoso | 82 | 475,60 | 1.950 KM | Rp 26.200.000 | 1.588 L | $0,30\ \text{m}^3/\text{L}$ ($1,23\ \text{KM/L}$) |
| **DS 9125 AB** | M-03 | Mixer | Dedi Prasetyo | 71 | 411,80 | 1.620 KM | Rp 21.800.000 | 1.321 L | $0,31\ \text{m}^3/\text{L}$ ($1,23\ \text{KM/L}$) |
| **DS 9201 CD** | L-01 | Loader | Herman (Opr) | — | — | 185 HM | Rp 32.500.000 | 1.970 L | $10,65\ \text{Liter/HM}$ |
| *... (Armada lainnya)* | ... | ... | ... | ... | ... | ... | ... | ... | ... |
| **TOTAL ARMADA** | | | **12 Unit** | **835** | **4.850 m³** | **19.450 KM** | **Rp 315.250.000** | **19.106 L** | **Rata-rata Normal** |

---

### 3.5 Detail Komisi & Retase Sopir
*Sumber Data: Model `Retase`, `AggregateIncoming`, `AggregateOutgoing`, `MasterIncentiveRate`*

* **Retase Sopir Truk Mixer (`Retase`):**
  * Total Trip Terhitung: 835 Transaksi.
  * Total Komisi Dibayarkan: **Rp 275.450.000**.
  * Rata-rata Komisi per Trip: Rp 329.880 / trip.
  * Top Earner Sopir Mixer: Agus Santoso (82 ritase | Rp 28.450.000).
* **Retase Sopir Dump Truck Agregat (`AggregateIncoming` & `AggregateOutgoing`):**
  * Total Ritase DT Angkut Quarry & Penjualan: 412 Bon Angkut.
  * Total Retase Dump Truck: **Rp 64.050.000**.
  * Top Earner Sopir DT: Mansur (74 ritase | Rp 12.800.000).
* **Insentif Operator Batching Plant & Alat Berat (`MasterIncentiveRate`):**
  * Total Insentif Operator BP (Rp 5.000/m³): Rp 24.250.000.
  * Total Insentif Operator Concrete Pump: Rp 12.000.000.

---

### 3.6 Detail Transaksi Sewa Alat Berat & Kendaraan (Rental Equipment)
*Sumber Data: Model `SewaTransaction`, `MasterSewaAlat`, `Vehicle`, `Customer`*

| No Transaksi | Tanggal | Pelanggan | Unit Alat / Kendaraan | Operator | Hari Sewa | Tarif/Hari | Mode PPN | Grand Total (Rp) | Status |
| :--- | :---: | :--- | :--- | :--- | :---: | :---: | :---: | :---: | :---: |
| **SWA/2026/09/001** | 02/09 | PT Adhi Karya | Pompa Beton Sany 37m (CP-01) | Rahmat | 12 Hari | Rp 5.000.000 | EXCLUDE (11%) | Rp 66.600.000 | Active |
| **SWA/2026/09/002** | 05/09 | PT Hutama Karya | Pompa Kodok HBT60 (CP-02) | Supriyadi | 18 Hari | Rp 4.500.000 | INCLUDE (11%) | Rp 81.000.000 | Active |
| **SWA/2026/09/003** | 10/09 | CV Mandiri Jaya | Dump Truck Tronton (DT-05) | Rudianto | 8 Hari | Rp 2.500.000 | NON_PPN | Rp 20.000.000 | Completed |
| **SWA/2026/09/004** | 15/09 | PT Nindya Karya | Excavator Komatsu PC200 | Mulyono | 4 Hari | Rp 4.000.000 | EXCLUDE (11%) | Rp 17.760.000 | Completed |
| **TOTAL PENDAPATAN SEWA** | | | **4 Transaksi Sewa** | | **42 Hari** | | | **Rp 215.000.000** | |

---

### 3.7 Detail Beban Operasional Kas Cabang (RBL Field Expenses)
*Sumber Data: Model `RblBudget`, `RblExpense`, `RblCategory`*

* **Penerimaan Budget RBL dari Head Office:** Rp 105.000.000 (Kode: `RBL-SRG-2026-09`).
* **Realisasi Pengeluaran Kas Cabang per Kategori:**

| Kategori Pengeluaran | Jumlah Item | Realisasi (Rp) | % Anggaran | Catatan Audit |
| :--- | :---: | :---: | :---: | :--- |
| **Listrik PLN Pabrik & Utilitas Air** | 2 | Rp 48.500.000 | 46,19% | Tagihan PLN Pascabayar Plant & Genset Backup |
| **Konsumsi Kerja Cor & Lembur** | 24 | Rp 24.200.000 | 23,05% | Nasi bungkus cor malam & snack operator |
| **Koordinasi Lapangan, Tol & Retribusi**| 18 | Rp 14.500.000 | 13,81% | Koordinasi keamanan warga & izin melintas |
| **ATK, Kertas Bon & Operasional Kantor**| 8 | Rp 9.800.000 | 9,33% | Form surat jalan, tinta printer, amplop tagihan |
| **Total Realisasi Pengeluaran Kas RBL** | **52 Item** | **Rp 97.000.000** | **92,38%** | **Sisa Kas Cabang: Rp 8.000.000 (Surplus)** |

---

### 3.8 Detail Penagihan (Billing), Piutang Usaha (AR Aging) & Deposit
*Sumber Data: Model `Invoice`, `InvoiceItem`, `Payment`, `Deposit`, `Project`*

#### A. Rekap Faktur Penjualan Bulanan (Invoicing)
* **Total Faktur Terbit Bulan Ini:** 28 Faktur senilai Rp 4.280.000.000 (DPP + PPN).
* **Faktur Lunas:** 14 Faktur (Rp 2.150.000.000).
* **Faktur Sebagian Terbayar (Partial):** 6 Faktur (Rp 980.000.000 | Sisa Tagihan Rp 320.000.000).
* **Faktur Belum Terbayar (Issued):** 8 Faktur (Rp 1.150.000.000).

#### B. Analisis Umur Piutang Usaha (AR Aging Schedule)
| Rentang Umur Piutang | Nilai Nominal (Rp) | Proporsi % | Status Risiko | Rekomendasi Tindakan |
| :--- | :---: | :---: | :---: | :--- |
| **Belum Jatuh Tempo (Current)** | Rp 1.470.000.000 | 58,10% | Sehat | Follow-up penyerahan berkas BAP Cor |
| **Menunggak 1 - 30 Hari** | Rp 540.000.000 | 21,34% | Wajar | Kirimkan surat pengingat pembayaran ke-1 |
| **Menunggak 31 - 60 Hari** | Rp 320.000.000 | 12,65% | Perhatian | Tahan pengiriman cor tambahan jika tanpa DP |
| **Menunggak > 60 Hari** | Rp 200.000.000 | 7,91% | Kritis | Kunjungan langsung GM / Legal Somasi |
| **TOTAL PIUTANG OUTSTANDING** | **Rp 2.530.000.000** | **100,00%** | | |

#### C. Unbilled Production Pool & Saldo Deposit Proyek
* **Tiket Cor Selesai yang Belum Masuk Invoice (Unbilled Delivery):**
  * Terdapat 64 tiket cor senilai Rp 318.500.000 yang belum diterbitkan faktur karena menunggu verifikasi volume bersama di jobsite.
* **Saldo Deposit Proyek Aktif (`Deposit`):**
  * Total Saldo Deposit Proyek Pelanggan di Rekening: **Rp 485.000.000** (Dana jaminan aman).

---

## 3. Matriks Kesiapan Data 100% Model Schema Prisma (v2.4.8)

Seluruh komponen data dalam laporan bulanan ini **didukung 100% oleh model database aktif** tanpa perlu penambahan tabel baru:

| No | Modul Laporan | Status di Sistem | Model Prisma yang Digunakan | Parameter Kunci yang Digunakan |
| :---: | :--- | :---: | :--- | :--- |
| **01** | **Produksi Beton Ready-Mix** | **READY (100%)** | `ProductionTransaction`, `ConcreteQuality`, `WorkItem` | `date`, `volume_cubic`, `slump`, `status='Confirmed'`, `trip_sequence` |
| **02** | **Harga Kontrak Penjualan** | **READY (100%)** | `ProjectPrice`, `Project`, `Customer` | `price`, `ppn_mode`, `ppn_rate` |
| **03** | **Master Harga Acuan Material**| **READY (100%)** | `MasterMaterial`, `MaterialPriceHistory` | `price_per_m3`, `effective_date`, `locationId` (support multi-cabang) |
| **04** | **Penerimaan Semen** | **READY (100%)** | `MaterialIncoming`, `PurchaseOrder` | `tonnage` (Kg), `unit_price`, `total_price`, `purchaseOrderId` |
| **05** | **Penerimaan Agregat** | **READY (100%)** | `AggregateIncoming`, `Vehicle`, `Employee` | `volume_cubic`, `aggregate_type`, `custom_material_name`, `unit_price`, `retase_amount` |
| **06** | **Pengeluaran Agregat Non-BP** | **READY (100%)** | `AggregateOutgoing` | `volume_cubic`, `category`, `unit_price`, `total_price`, `recipient` |
| **07** | **Pengadaan Barang (PO Logistik)**| **READY (100%)** | `PurchaseOrder`, `PoItem`, `PoCategory`, `Supplier` | `po_number`, `status`, `approvalChannel`, `subtotal`, `vehicleId`, `km_hm` |
| **08** | **BBM Solar & Kas Cabang** | **READY (100%)** | `RblBudget`, `RblExpense`, `RblCategory` | `amount`, `categoryId`, `vehicleId`, `kmMeter`, `status` |
| **09** | **Retase Sopir Truk Mixer** | **READY (100%)** | `Retase`, `RetaseSetting` | `income_amount`, `calculated_distance`, `volume`, `price_per_cubic_km` |
| **10** | **Retase Sopir Dump Truck** | **READY (100%)** | `AggregateIncoming`, `AggregateOutgoing` | `rate_price`, `retase_amount`, `dump_truck_size`, `distance_km` |
| **11** | **Sewa Alat Berat & Kendaraan**| **READY (100%)** | `SewaTransaction`, `MasterSewaAlat` | `total_price`, `price_per_day`, `total_days`, `is_ppn`, `ppn_mode` |
| **12** | **Billing, Invoice & Pembayaran**| **READY (100%)** | `Invoice`, `InvoiceItem`, `Payment`, `Deposit` | `subtotal`, `total_amount`, `paid_amount`, `status`, `due_date`, `method` |
| **13** | **Filter Cabang & Otorisasi** | **READY (100%)** | `Location`, `User`, `Role`, `Permission` | `RoleScope.ALL_BRANCHES` vs `OWN_BRANCH` |

---

## 4. Rumus Perhitungan Matematis (Unit Economics & Financial Engine)

### 4.1 Volume Produksi Bersih Terverifikasi
$$\text{Total Production Volume } (V) = \sum_{i=1}^{n} \text{ProductionTransaction.volume\_cubic} \quad (\text{Filter: } \text{status} = \text{'Confirmed'})$$

### 4.2 Gross Revenue Penjualan Beton
$$\text{Revenue}_{\text{Readymix}} = \sum (\text{volume\_cubic}_i \times \text{ProjectPrice.price}_{i})$$

### 4.3 Average Selling Price (ASP per $m^3$)
$$\text{ASP} = \frac{\text{Revenue}_{\text{Readymix}}}{V}$$

### 4.4 Biaya Bahan Baku Beton per $m^3$
$$\text{Material Cost per m}^3 = \frac{\text{Biaya Semen Terpakai} + \text{Biaya Pasir Terpakai} + \text{Biaya Split Terpakai}}{V}$$
*Catatan:* Dihitung dari standar komposisi kg/m³ pada `ConcreteQuality` dikalikan harga acuan aktif pada `MaterialPriceHistory` cabang terkait.

### 4.5 Biaya Solar Armada per $m^3$
$$\text{Fuel Cost per m}^3 = \frac{\sum \text{RblExpense}(\text{Category} = \text{'BBM/Solar'})}{V}$$

### 4.6 Upah Langsung / Retase Supir per $m^3$
$$\text{Retase Cost per m}^3 = \frac{\sum \text{Retase.income\_amount} + \sum \text{AggregateRetase}}{V}$$

### 4.7 Suku Cadang & Pemeliharaan per $m^3$
$$\text{Maintenance Cost per m}^3 = \frac{\sum \text{PoItem}(\text{Cat} = \text{'SPR'}) + \sum \text{RblExpense}(\text{Cat} = \text{'Bengkel/Sparepart'})}{V}$$

### 4.8 Total Biaya Langsung & Margin
$$\mathbf{Total\ Direct\ Cost\ per\ m}^3 = \text{Material/m}^3 + \text{Fuel/m}^3 + \text{Retase/m}^3 + \text{Maintenance/m}^3$$

$$\mathbf{Gross\ Profit\ per\ m}^3 = \text{ASP} - \text{Total Direct Cost per m}^3$$

$$\mathbf{Gross\ Profit\ Margin\ \%} = \left(\frac{\text{Gross Profit per m}^3}{\text{ASP}}\right) \times 100\%$$

---

## 5. Arsitektur Teknis Implementasi Web App Generator

### 5.1 Route Halaman Aplikasi
* **Path:** `/admin/reports/monthly-management`
* **File Utama:**
  * `src/app/(dashboard)/admin/reports/monthly-management/page.tsx` (Server Component - cek RBAC & fetch filter awal)
  * `src/app/(dashboard)/admin/reports/monthly-management/monthly-management-client.tsx` (Client Component - Tab Summary, Gambaran Umum, Detail)
  * `src/app/(dashboard)/admin/reports/monthly-management/actions.ts` (Server Action Aggregator)

### 5.2 Filter Bar Interaktif
* **Pilihan Bulan & Tahun:** Dropdown Bulan (Januari - Desember) dan Tahun (2025, 2026, 2027).
* **Pilihan Cabang:**
  * Direksi / Admin Pusat: Dapat memilih `Semua Cabang (Konsolidasi)` atau Cabang tertentu (`Sorong`, `Youtefa`, dll).
  * Admin / Kepala Cabang: Terkunci otomatis pada cabang masing-masing sesuai `RoleScope.OWN_BRANCH`.
* **Tombol Tindakan Cepat:**
  * `[Cetak Laporan / PDF]` $\rightarrow$ Menampilkan pratinjau cetak A4 terformat rapi.
  * `[Export Excel]` $\rightarrow$ Mengunduh file `.xlsx` dengan 3 sheet terpisah (Sheet 1: Summary, Sheet 2: Gambaran Umum, Sheet 3: Detail Transaksi).

### 5.3 Desain Antarmuka Pengguna (UI Tabs Layout)
Tampilan web menggunakan antarmuka tab responsif:
```text
┌──────────────────────────────────────────────────────────────────────────────────┐
│ [LOGO RAJAWALI] LAPORAN BULANAN MANAJEMEN BATCHING PLANT                         │
│ Periode: [September ▼] [2026 ▼]   Cabang: [Cabang Sorong ▼]   [Filter Data]      │
│ [ Tombol: Cetak PDF ]   [ Tombol: Export Excel (.xlsx) ]                         │
├──────────────────────────────────────────────────────────────────────────────────┤
│  [ TAB 1: SUMMARY (EKSEKUTIF) ]  │  [ TAB 2: GAMBARAN UMUM ]  │  [ TAB 3: DETAIL ]│
├──────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  (Konten Tab Aktif Dirender di Sini Sesuai Format Spesifikasi di Atas)            │
│                                                                                  │
└──────────────────────────────────────────────────────────────────────────────────┘
```

---

## 6. Standar Cetak Dokumen PDF Resmi

Ketika tombol **Cetak Laporan / PDF** ditekan, generator dokumen akan menyusun tata letak halaman sebagai berikut:

* **Halaman 1 (Cover & Executive Summary):**
  * KOP Surat Resmi PT Rajawali Perkasa Mandiri.
  * Judul: *LAPORAN BULANAN KINERJA EKSEKUTIF MANAJEMEN BATCHING PLANT*.
  * Executive Performance Scorecard & Kartu Unit Economics ($1\ \text{m}^3$).
  * MoM Comparison Table & Alert Box.
  * Kolom Tanda Tangan: Dibuat Oleh (Admin Cabang), Diperiksa Oleh (Kepala Cabang / Plant Manager), Disetujui Oleh (Direktur Utama / FVP).
* **Halaman 2 (Gambaran Umum & Analisis Makro):**
  * Tabel Komparasi Antar Cabang & Utilisasi Kapasitas.
  * Grafik/Tabel Distribusi Mutu Beton & Top 5 Pelanggan.
  * Komposisi Struktur Biaya Produksi & Rekap Pendapatan Sewa/Agregat.
* **Halaman 3 dan seterusnya (Detail Operasional):**
  * Rekap Detail Tiket Produksi & Penjualan.
  * Rekap Detail Semen Masuk, Agregat Masuk & Keluar.
  * Rekap Detail PO Logistik & Sparepart.
  * Rekap Detail Kinerja Armada & BBM Solar.
  * Rekap Detail Retase Sopir Mixer & DT.
  * Rekap Detail Sewa Alat Berat & Kendaraan.
  * Rekap Detail Realisasi Kas Cabang RBL.
  * Rekap Detail Billing, AR Aging & Saldo Deposit.

---

## 7. Kesimpulan & Status Eksekusi

1. **Format 3 Tingkat (Summary $\rightarrow$ Gambaran Umum $\rightarrow$ Detail) telah dikunci sebagai standar resmi pelaporan.**
2. **Kesiapan data New Rajawali CRM per versi v2.4.8 adalah 100% READY**, karena Master Material Multi-Cabang, Sewa Alat, PO Multi-Approval, RBL, dan Penagihan telah terintegrasi penuh ke dalam database PostgreSQL.
3. Dokumen ini menjadi pedoman langsung bagi pembuatan kode Server Action, Antarmuka Dashboard UI, serta template cetak PDF dan Ekspor Excel.

---
*Dokumen ini diperbarui secara resmi pada: September 2026 sebagai acuan arsitektur sistem New Rajawali CRM.*
