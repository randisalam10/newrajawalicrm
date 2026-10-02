---
trigger: always_on
description: Coding standards, architectural patterns, and refactoring guidelines for New Rajawali CRM
---

# New Rajawali CRM - Coding Standards & Architectural Rules

Panduan ini mengatur struktur arsitektur, standar penulisan kode, pemisahan dependensi, dan konvensi UI/UX untuk memastikan codebase New Rajawali CRM tetap modular, scalable, dan mudah di-maintain.

---

## 1. Arsitektur Folder Fitur (Feature-First Architecture)

Setiap modul fitur di `src/app/(dashboard)/...` harus mengikuti pembagian tanggung jawab berikut:

```
[nama-fitur]/
├── page.tsx               # Server Component (auth guard, metadata, prefetch)
├── actions.ts             # Server Actions ("use server", Prisma query, Telegram bot, log)
├── types.ts               # Tipe data domain, DTO, interface props, filter state
├── [nama-fitur]-client.tsx# Client Orchestrator (< 250-350 baris)
├── hooks/                 # Business logic, state management, filter/search logic
│   ├── use-[nama]-data.ts
│   └── use-[nama]-filters.ts
├── components/            # UI modular (< 250 baris per file)
│   ├── tabs/              # Sub-halaman / tab view
│   ├── modals/            # Create, Edit, Detail, Delete dialogs
│   ├── sections/          # Stat cards, filter bar, table view
│   └── ...
└── utils/                 # Helper kalkulasi murni, formatting, export CSV/Excel
```

---

## 2. Batas Panjang Baris (Line Count Limits)

- **Target Ideal**: 80 – 250 baris per file.
- **Batas Maksimum**: 350 – 400 baris.
- **Aturan Refactoring**: File yang mendekati atau melampaui 400 baris **wajib dipecah** menjadi sub-komponen, hooks, atau utility helpers.

---

## 3. Pemisahan Tanggung Jawab (Separation of Concerns)

1. **Client Orchestrator (`*-client.tsx`)**:
   - Berfungsi murni sebagai **konduktor**: menghubungkan custom hook dengan layout UI utama.
   - Tidak boleh memuat logika kalkulasi rumit, filtering array panjang inline, atau deklarasi dialog bertumpuk-tumpuk.
2. **Custom Hooks (`hooks/`)**:
   - Tempat seluruh `useState`, `useMemo`, `useCallback`, pagination, searching, dan mutasi data via `useTransition`.
   - Mengembalikan state siap pakai dan fungsi handler yang bersih untuk dikonsumsi komponen UI.
3. **Server Actions (`actions.ts`)**:
   - Wajib memiliki direktif `"use server"` di baris teratas.
   - Semua operasi Prisma ORM, integrasi Telegram bot, audit log, dan revalidasi cache (`revalidatePath`) diisolasi di sini.
   - Komponen client tidak boleh memanggil database Prisma secara langsung.
4. **Presentational Components (`components/`)**:
   - Berfokus murni pada rendering tampilan dan menerima data serta callback event via props yang terdefinisi dengan jelas di `types.ts`.

---

## 4. TypeScript & Type Safety

- **Zero TypeScript Errors**: Setiap perubahan kode wajib tervalidasi bersih tanpa error (`npx tsc --noEmit` exit 0).
- **Hindari Penggunaan `any`**: Definisikan tipe eksplisit untuk state, payload, dan props.
- **Konversi Nilai Aman (Null-Safety)**:
  - Gunakan `String(val)` alih-alih `val.toString()` untuk field database yang berpotensi `null` atau `undefined`.
  - Berikan fallback default pada number dan string (`val ?? 0`, `val ?? ""`).
  - Lakukan validasi parsing aman untuk tanggal dan input desimal/rupiah.

---

## 5. Standar UI/UX, Ikonografi & Desain Konsisten

1. **Efisiensi Ikonografi (Hindari Icon Clutter & Overload)**:
   - **Gunakan Ikon Secara Selektif**: Hanya gunakan icon untuk aksi interaktif utama (misal: tombol create `Plus`, delete `Trash2`, download `Download`), navigasi esensial, atau penanda status penting.
   - **Hindari Icon Redundan**: Jangan menaruh icon di setiap label form, setiap header kolom tabel, atau setiap baris teks jika teksnya sudah jelas dan deskriptif (misal: hindari membubuhi label "Nama Lokasi" atau "Tanggal Transaksi" dengan icon jika konteksnya sudah jelas).
   - **Ukuran Icon Seragam**: Gunakan ukuran standar proporsional (`h-4 w-4` untuk tombol/menu normal, `h-3.5 w-3.5` untuk badge/inline tag). Hindari ukuran acak yang membuat tampilan berantakan.
   - **Satu Sumber Ikon**: Wajib menggunakan `lucide-react` secara konsisten di seluruh aplikasi. Jangan mencampur dengan icon library lain atau SVG mentah tanpa standardisasi.

2. **Konsistensi Desain UI & Disiplin Palet Warna**:
   - **Patuhi Palet Warna Semantik Utama**:
     - **Sukses / Aktif / Disetujui**: Emerald (`bg-emerald-50 text-emerald-700 border-emerald-200`)
     - **Pending / Perlu Tinjauan / Draft**: Amber / Yellow (`bg-amber-50 text-amber-700 border-amber-200`)
     - **Info / Proses / Berjalan**: Blue / Sky (`bg-blue-50 text-blue-700 border-blue-200`)
     - **Bahaya / Ditolak / Dibatalkan**: Rose / Red (`bg-rose-50 text-rose-700 border-rose-200`)
     - **Netral / Default / Placeholder**: Slate / Zinc (`text-slate-600 bg-slate-50 border-slate-200`)
   - **Hindari Warna "Pelangi" Acak**: Jangan menggunakan warna acak (ungu, teal, fuchsia, lime, cyan) di luar palet semantik sistem kecuali telah disepakati untuk identitas modul tertentu.
   - **Hierarki Kontras Bersih**: Jaga kontras teks dengan background agar selalu terbaca jelas (WCAG accessible). Hindari latar belakang terlalu pekat untuk card/kontainer data; gunakan surface putih (`bg-white dark:bg-slate-900`) dengan border subtil (`border-slate-200 dark:border-slate-800`).

3. **Komponen UI Terstandarisasi**:
   - Utamakan penggunaan library Shadcn UI yang telah terpasang di `@/components/ui/*` (Button, Dialog, Badge, Card, Table, Input, Select, Tabs, dll).
   - Hindari membuat elemen UI kustom dari nol jika Shadcn UI sudah menyediakannya.

4. **Format Angka & Mata Uang**:
   - Gunakan format mata uang Rupiah standar (`formatRp(val)` atau `Intl.NumberFormat('id-ID')`).
   - Format tanggal Indonesia yang seragam (misal: `dd MMM yyyy` dengan locale `id`).

5. **UX Interaktif & Feedback Pengguna**:
   - Gunakan `useTransition` (`isPending`) pada tombol submit agar UI tetap responsif tanpa freeze.
   - Berikan feedback instan menggunakan `sonner` (`toast.success`, `toast.error`).
   - Aksi destruktif (hapus data, batalkan transaksi) wajib dilindungi dengan `AlertDialog` konfirmasi.
   - Sediakan state loading (skeleton) dan empty state yang informatif jika data kosong.

6. **Layout Lebar Penuh (Full-Width Responsive Layout)**:
   - **Gunakan Lebar Penuh (`w-full`)**: Seluruh tampilan halaman fitur di bawah dashboard (`src/app/(dashboard)/...`) wajib memanfaatkan ruang layar secara penuh (`<div className="space-y-4 w-full">` atau `<div className="space-y-4">`).
   - **Dilarang Membatasi Lebar Kontainer Utama**: Dilarang keras menggunakan pembatas lebar tetap seperti `max-w-7xl`, `max-w-6xl`, `max-w-5xl`, atau `container mx-auto` pada kontainer halaman utama / client orchestrator. Pembatas tersebut menciptakan ruang kosong (*dead space*) lebar di sisi kiri dan kanan pada monitor lebar (desktop / widescreen display).
   - **Pendelegasian Padding**: Layout utama (`(dashboard)/layout.tsx`) sudah mengelola padding halaman responsif (`p-4 md:p-6 lg:p-8`). Seluruh komponen dan tabel fitur harus mengalir mengisi seluruh area kerja secara fleksibel dan proporsional.

---

## 6. Lingkungan Terminal & Perintah

Sesuai aturan workspace:
- Jalankan script Node.js, Prisma, Git, dan perintah build selalu menggunakan **Git Bash** di lingkungan Windows:
  ```powershell
  & "C:\Program Files\Git\bin\bash.exe" -c "<perintah>"
  ```

---

## 7. Integritas Database & Pelaporan (Zero Guesswork & Anti-Careless Fallbacks)

- **Wajib Rujuk Dokumen HLD**: Seluruh query, perhitungan HPP, analitik, dan laporan keuangan wajib berpedoman pada:
  👉 [docs/DATABASE_HLD_AND_REPORTING_GUIDE.md](file:///d:/Project%20Free/New_Rajawali/docs/DATABASE_HLD_AND_REPORTING_GUIDE.md) dan aturan [database-and-reporting.md](file:///d:/Project%20Free/New_Rajawali/.agents/rules/database-and-reporting.md).
- **Larangan Keras Coding Fallback Sembarangan**: Dilarang keras membuat fallback angka tebakan non-nol seperti `|| 0.85`, `|| 350`, `|| 0.72` di dalam formula kalkulasi. Jika data resep bernilai 0 (misal batu pada Mortar), maka hasil perhitungan **wajib 0**. Gunakan operator `?? 0` murni untuk null-safety teknis, bukan untuk mengarang nilai bisnis fiktif (*no phantom data*).
- **Pemisahan Tanggal Bayar vs Tanggal Lapor**: Selalu bedakan tanggal kas masuk riil (`payment_date`) dengan tanggal input sistem (`createdAt`).

