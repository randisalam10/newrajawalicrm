# Standar Arsitektur & Koding (Coding Standards)

Aturan ini WAJIB selalu diingat dan dipatuhi dalam setiap pengembangan dan penulisan kode di repositori ini:

## 1. Batasan Ukuran File (File Size Limit & Modularitas)
- **Hindari Monolithic Files**: Dilarang keras menggabungkan ribuan baris kode (database query, perhitungan matematika/finansial, state management, dan UI) ke dalam satu file.
- **Rekomendasi Baris Kode**:
  - File komponen UI idealnya: **100 – 300 baris**.
  - File server actions / services idealnya: **100 – 400 baris**.
  - Jika suatu file mulai mendekati atau melampaui **500 baris**, file tersebut **WAJIB dipecah (refactor)** menjadi modul-modul yang lebih kecil dan terfokus.

## 2. Pemisahan Tanggung Jawab (Separation of Concerns - SoC)
Untuk modul, halaman, atau fitur yang kompleks (seperti modul Laporan / Reports, Dashboard, Master Data, Billing):
- **`types.ts`**: Simpan semua antarmuka (interface), tipe (type), dan skema data agar strongly typed (hindari ketergantungan pada `any`).
- **`actions.ts`**: Bertindak HANYA sebagai orkestrator (Security check/Role validation, pemanggilan query & service, perakitan payload hasil akhir). **PENTING (Next.js Turbopack Rule):** Dilarang mengekspor `export type { ... }` dari dalam file ber-directive `"use server"`. Turbopack menganggap semua `export` di file `"use server"` sebagai Server Action callable stub, yang akan menyebabkan build error `Export ... doesn't exist in target module`. Tipe WAJIB diekspor murni dari `types.ts`.
- **`services/`**: Tempatkan kalkulasi matematika, agregasi data, formula bisnis, dan logika domain di sini (misal: `revenue-service.ts`, `cogs-service.ts`, `overhead-service.ts`).
- **`queries/` atau `services/report-queries.ts`**: Pisahkan query Prisma / raw database yang panjang ke dalam file query terdedikasi.
- **`actions.ts`**: Bertindak HANYA sebagai orkestrator (Security check/Role validation, pemanggilan query & service, perakitan payload hasil akhir).
- **`components/`**: Pecah tampilan UI menjadi sub-komponen:
  - Header & Action Bars (`report-header.tsx`, `report-filter-bar.tsx`).
  - Tab terpisah (`components/tabs/summary-tab.tsx`, `macro-tab.tsx`, `detail-tab.tsx`).
  - Drilldown / Modals terpisah (`components/drilldowns/`).
- **Client Container (`*-client.tsx`)**: Berfungsi sebagai pengelola state utama (filter periode, tab aktif, print) dan menyusun komponen-komponen anak (orchestrator UI) di bawah 150 baris.

## 3. Ketertelusuran & Debugging (Traceability)
- Struktur modular mempermudah pelacakan (trace) error ke file spesifik tanpa perlu menelusuri ribuan baris kode.
- Setiap fungsi helper dan komponen memiliki nama yang deskriptif dan satu tanggung jawab utama (Single Responsibility Principle).

## 4. Perintah Terminal & Tooling
- Sesuai `terminal.md`: selalu gunakan **Git Bash** (`"C:\Program Files\Git\bin\bash.exe"` di Windows) untuk menjalankan skrip seperti `nodejs`, `npx tsc`, `git`, atau perintah `docker`.

## 5. Integritas Database & Pelaporan (Zero Guesswork & Anti-Careless Fallbacks)
- **Wajib Rujuk Dokumen HLD**: Seluruh query, perhitungan HPP, analitik, dan laporan keuangan wajib merujuk pada:
  👉 [docs/DATABASE_HLD_AND_REPORTING_GUIDE.md](file:///d:/Project%20Free/New_Rajawali/docs/DATABASE_HLD_AND_REPORTING_GUIDE.md) dan aturan [database-and-reporting.md](file:///d:/Project%20Free/New_Rajawali/.agents/rules/database-and-reporting.md).
- **Larangan Keras Coding Fallback Sembarangan**: Dilarang keras menyematkan angka tebakan non-nol seperti `|| 0.85`, `|| 350`, `|| 0.72`, atau `cost || 50000` di dalam formula kalkulasi laporan atau HPP. Nilai 0 adalah data sah (misal Mortar memang 0 split). Gunakan `?? 0` murni untuk null-safety teknis, bukan untuk mengarang nilai bisnis fiktif.
- **Pemisahan Tanggal Bayar vs Tanggal Lapor**: Selalu bedakan tanggal kas masuk riil (`payment_date`) dengan tanggal input sistem (`createdAt`).
