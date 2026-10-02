---
trigger: always_on
description: Database architecture rules, reporting standards, and anti-guesswork guidelines
---

# Aturan Standar Database & Pelaporan (Database & Reporting Standards)

Aturan ini WAJIB selalu dipatuhi oleh seluruh AI Agent dan developer saat membuat laporan, query, perhitungan matematika/finansial, atau manipulasi data di repositori New Rajawali CRM.

---

## 1. Panduan Referensi Wajib (Single Source of Truth)

Sebelum menulis atau merefaktor query database, formula HPP/COGS, laporan keuangan, atau analitik, **WAJIB membaca dan mematuhi dokumen HLD Database**:
👉 [DATABASE_HLD_AND_REPORTING_GUIDE.md](file:///d:/Project%20Free/New_Rajawali/docs/DATABASE_HLD_AND_REPORTING_GUIDE.md)

---

## 2. Prinsip "Zero Guesswork" & Larangan Coding Fallback Sembarangan

1. **Dilarang Keras Menggunakan Fallback Asumsi (Anti-Silent Fallback):**
   - **Bedakan Technical Safety vs Business Logic Fallback:**
     - *DIPERBOLEHKAN (Technical Safety):* `val ?? 0`, `val ?? ""`, `arr ?? []` murni untuk mencegah runtime error (`TypeError: Cannot read properties of undefined/null`).
     - *DILARANG KERAS (Business Logic Fallback):* Menulis angka tebakan non-nol seperti `splitFactor || 0.85`, `pasirFactor || 0.72`, `cementPerM3 || 350`, atau `cost || 50000` di dalam formula kalkulasi laporan, HPP, atau transaksi.
   - **Nilai 0 Adalah Data Sah (Valid Value):** Jika suatu data bernilai 0 (contoh: produk **MORTAR** di mana batu split memang bernilai 0), maka hasil perhitungan **wajib 0**. Dilarang keras menggunakan operator `||` yang menganggap angka 0 sebagai falsy lalu menggantinya dengan nilai default perkiraan. Wajib gunakan operator `??` (nullish coalescing) dengan default netral 0.
   - **Jangan Membuat Data Siluman (No Phantom Data):** Seluruh perhitungan harus 100% berlandaskan data resep master `ConcreteQuality` atau data tabel aktual dari database. Jika data relasi/master tidak ditemukan, biarkan bernilai 0 atau lemparkan pesan error yang jelas, BUKAN disamarkan secara diam-diam dengan angka tebakan developer.

2. **Gunakan Satuan Ukur (UoM) yang Tepat:**
   - **Semen:** Kilogram (Kg) dan Ton ($1\text{ Ton} = 1.000\text{ Kg}$).
   - **Pasir & Batu Split:**
     - Fisik operasional: Kilogram (Kg).
     - Pengadaan (PO) & HPP Manajerial: Meter Kubik ($m^3$) menggunakan Berat Jenis (BJ) resmi:
       - Pasir: $1.400\text{ kg/m}^3$
       - Batu 1-2 & Batu 2-3: $1.450\text{ kg/m}^3$
       - Ciping 0-5: $1.400\text{ kg/m}^3$

---

## 3. Pemisahan Tegas: Laba Akrual vs Arus Kas Riil

1. **Laba Akrual (Performa Operasional Pengiriman Beton):**
   - Mengakui pendapatan atas beton yang dikirim (`ProductionTransaction.status = "Confirmed"`), terlepas dari status pelunasan invoice.
   - Mengakui HPP Material berdasarkan resep teoritis atas kubikasi yang terkirim pada bulan laporan.
2. **Arus Kas Riil (Operating Cash Flow / Likuiditas):**
   - **Kas Masuk (Inflow):** Dihitung HANYA dari pelunasan nyata (`Payment` di mana `is_cancelled = false` dan `payment_date` berada pada bulan laporan).
   - **Kas Keluar (Outflow):** Dihitung HANYA dari realisasi kas operasional lapangan (`RblExpense`).

---

## 4. Integritas Waktu & Tanggal

1. **Tanggal Bayar vs Tanggal Lapor:**
   - Untuk laporan keuangan, penagihan, dan cash flow: **Gunakan `payment_date`** (kapan transfer/dana nyata masuk, mendukung pencatatan susulan/*backdate*).
   - Gunakan `createdAt` hanya sebagai *audit trail* (kapan admin mengetik/menginputkan data ke sistem).
2. **Pencegahan Pergeseran Hari (Timezone Safe):**
   - Input kalender `"YYYY-MM-DD"` wajib diparsing dengan waktu tengah hari UTC (`T12:00:00.000Z`) agar tidak mundur satu hari di server beda timezone (WIB/WITA/WIT).

---

## 5. Filter Status Entitas

- **Produksi:** Hanya hitung `status: "Confirmed"`.
- **Purchase Order (PO):** Hanya hitung `status: "APPROVED"`.
- **Invoice:** Abaikan `status: "CANCELLED"`.
- **Payment / Pelunasan:** Abaikan `is_cancelled: true`.
