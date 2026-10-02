# 📘 DOKUMENTASI SISTEM: MODUL FINANCE — SUBMODUL KREDIT & KEWAJIBAN

> **Aplikasi**: New Rajawali CRM  
> **Modul**: Finance & Keuangan  
> **Submodul**: Kredit & Kewajiban Hutang Usaha (Accounts Payable)  
> **Rute Aplikasi**: `/admin/finance/kredit`  
> **Tanggal Rilis**: Oktober 2026  
> **Versi**: 1.0.0 (Production Ready)  

---

## 1. TUJUAN & LATAR BELAKANG BISNIS

Modul **Finance → Kredit** dirancang sebagai pusat kendali (*command center*) manajemen eksekutif untuk memonitor, mengelola, dan melunasi seluruh kewajiban finansial perusahaan yang timbul dari proses pengadaan logistik (Purchase Order bertipe `CREDIT`) maupun kewajiban kontraktual non-PO lainnya (seperti leasing armada/alat berat dan pinjaman perbankan).

Modul ini secara spesifik menjawab 8 pertanyaan kunci manajemen:
1. *"Perusahaan saat ini memiliki kewajiban kredit apa saja?"*  
   → Terangkum dalam KPI Banner dan Tabel Kewajiban Kredit Aktif.
2. *"Kredit tersebut berasal dari PO/transaksi yang mana?"*  
   → Terhubung langsung ke nomor PO (`po_number`), item barang pesanan, dan tanggal terbit PO logistik.
3. *"Berapa total nilainya?"*  
   → Nilai total dihitung secara presisi dari akumulasi subtotal `PoItem` pada PO terkait.
4. *"Berapa yang sudah dibayar?"*  
   → Akumulasi real-time seluruh transaksi pembayaran aktif (`CreditPayment`).
5. *"Berapa yang masih menjadi kewajiban?"*  
   → Sisa kewajiban (`outstanding = total_amount - paid_amount`) yang dimutakhirkan secara otomatis.
6. *"Kapan pembayaran berikutnya?"*  
   → Sistem melacak tanggal jatuh tempo (`due_date`) dengan badge pintar (*Overdue*, *H-7*, dsb).
7. *"Pembayaran dilakukan kapan dan melalui apa?"*  
   → Setiap pembayaran merekam tanggal, metode transfer/kas/giro, rekening bank sumber, no referensi transfer, dan lampiran slip bukti transfer.
8. *"Bagaimana histori pembayarannya?"*  
   → Rekam jejak angsuran/cicilan tersimpan secara permanen (*immutable*) dan dilengkapi audit trail identitas staf pencatat.

---

## 2. ARSITEKTUR DATA & RELATIONSHIP

### 2.1 Diagram Relasi Entitas (ERD)

```
┌─────────────────────────────────┐
│     PurchaseOrder (Logistik)    │
│  - po_number                    │
│  - metode_pembayaran: CREDIT    │
│  - status: APPROVED             │
└────────────────┬────────────────┘
                 │ 1:1 (Opsional untuk PO)
                 ▼
┌────────────────────────────────────────────────────────┐
│              CreditObligation (Finance)                │
│  - credit_number (Unique)                              │
│  - source_type (PO_PURCHASE | NON_PO)                  │
│  - supplier_name, company_name, locationId             │
│  - total_amount (Plafon Kewajiban)                     │
│  - paid_amount (Realisasi Terbayar)                    │
│  - outstanding (Sisa Hutang)                           │
│  - credit_date & due_date (Jatuh Tempo)                │
│  - status (UNPAID | PARTIAL | PAID | OVERDUE)          │
└───────┬────────────────────────────────────────┬───────┘
        │ 1:N                                    │ 1:N
        ▼                                        ▼
┌────────────────────────────────┐     ┌────────────────────────────────┐
│         CreditPayment          │     │         CreditAuditLog         │
│  - payment_date                │     │  - action (CREATED, PAID, etc) │
│  - amount (Nominal Bayar)      │     │  - actorId & actorName         │
│  - method (TRANSFER/CASH/GIRO) │     │  - description                 │
│  - source_account & ref_no     │     │  - metadata (JSON State Diff)  │
│  - proof_url (Foto Slip Bukti) │     │  - createdAt (Timestamp)       │
│  - is_cancelled & cancel_reason│     └────────────────────────────────┘
│  - recordedById (User Staf)    │
└────────────────────────────────┘
```

### 2.2 Kardinalitas & Integritas Relasi:
- **1 PO Bertipe CREDIT = 1 Credit Obligation:**  
  Setiap PO kredit yang disetujui logistik didaftarkan sebagai satu unit kewajiban kredit.
- **1 Credit Obligation = N Credit Payments (Cicilan/Termin):**  
  Satu kredit bernilai besar dapat dilunasi bertahap melalui beberapa kali pembayaran tanpa mengubah data PO.
- **Kredit Non-PO:**  
  Model `CreditObligation` memiliki `source_type: NON_PO` dan `purchaseOrderId: null`, sehingga perusahaan tetap dapat mencatat kewajiban lain (seperti leasing armada atau pinjaman modal kerja) secara mandiri.
- **Isolasi Modul:**  
  Perubahan status atau pembayaran pada Modul Finance tidak memodifikasi struktur inti dokumen PO pada logistik, sehingga modul logistik tetap berjalan stabil dan independen.

---

## 3. MEKANISME SINKRONISASI 319 PO EXISTING (IDEMPOTENT)

Sistem dilengkapi fungsi `syncApprovedCreditPurchaseOrders()` pada [actions.ts](file:///d:/Project%20Free/New_Rajawali/src/app/(dashboard)/admin/finance/kredit/actions.ts):
1. **Pendeteksian Otomatis:**  
   Mencari seluruh `PurchaseOrder` dengan kriteria:
   - `metode_pembayaran == "CREDIT"`
   - `status == "APPROVED"`
   - `creditObligation == null`
2. **Kalkulasi Plafon:**  
   Menghitung total nilai PO dari akumulasi subtotal `PoItem` (`quantity × harga_satuan`).
3. **Penyusunan Entitas:**  
   Membaca nama supplier, nama perusahaan group (PT RPJ / PT HP / PT MIS), dan menetapkan tanggal jatuh tempo acuan (default: 30 hari sejak tanggal terbit PO).
4. **Pendaftaran Otomatis:**  
   Menghasilkan nomor unik `CRD-[Nomor_PO]` dan mencatat log audit pembuatan kredit.
5. **Idempotensi:**  
   Jika dijalankan berulang kali, fungsi ini hanya memproses PO yang belum terdaftar. Sebanyak **319 PO kredit tahun 2026 senilai Rp 1,52 Miliar** langsung tersinkronisasi ke dalam sistem.

---

## 4. LIFECYCLE & STATE MACHINE STATUS KREDIT

Perubahan status kewajiban dikelola secara otomatis:

| Status | Syarat Kondisi | Warna & Badge UI |
|---|---|---|
| `UNPAID` (Belum Dibayar) | $\text{paid\_amount} = 0$ dan $\text{Hari Ini} \le \text{Jatuh Tempo}$ | Abu-abu (`bg-slate-50 text-slate-700 border-slate-200`) |
| `PARTIAL` (Sebagian/Cicil) | $\text{paid\_amount} > 0$ dan $\text{outstanding} > 0$ dan $\text{Hari Ini} \le \text{Jatuh Tempo}$ | Kuning Amber (`bg-amber-50 text-amber-700 border-amber-200`) |
| `PAID` (Lunas) | $\text{outstanding} \le 0$ | Hijau Emerald (`bg-emerald-50 text-emerald-700 border-emerald-200`) |
| `OVERDUE` (Lewat Jatuh Tempo) | $\text{outstanding} > 0$ dan $\text{Hari Ini} > \text{due\_date}$ | Merah Rose Berkedip (`bg-rose-50 text-rose-700 border-rose-200 font-bold animate-pulse`) |
| `DUE_SOON` (H-7 Jatuh Tempo) | $\text{outstanding} > 0$ dan sisa hari jatuh tempo $\le 7$ hari | Oranye Amber (`bg-amber-50 text-amber-800 border-amber-300 font-semibold`) |
| `CANCELLED` (Dibatalkan) | Kredit dibatalkan / void secara administratif | Merah Pudar (`bg-rose-50 text-rose-700 border-rose-200 line-through`) |

---

## 5. FITUR UTAMA & WORKFLOW OPERASIONAL

### 5.1 Pencatatan Pelunasan (Record Payment)
1. User mengklik tombol **"Bayar"** pada baris kredit atau pada jendela detail kredit.
2. Modal dialog menampilkan informasi sisa kewajiban saat ini.
3. Form pembayaran mewajibkan pengisian:
   - Nominal Pembayaran (divalidasi tidak boleh melebihi sisa outstanding).
   - Tanggal Pembayaran.
   - Metode (Transfer Bank, Kas Tunai, Giro).
   - Rekening Sumber (contoh: Rekening Mandiri Operasional).
   - No. Referensi Transfer / No. Cek.
   - Unggah Bukti Slip Transfer (foto resi/voucher transfer).
   - Catatan keterangan angsuran.
4. Saat disimpan:
   - Data `CreditPayment` terbuat.
   - Saldo `paid_amount` bertambah dan `outstanding` berkurang.
   - Status terbarui otomatis menjadi `PAID` jika sisa 0, atau `PARTIAL` jika masih ada sisa.
   - `CreditAuditLog` mencatat transaksi secara permanen.

### 5.2 Pembatalan Pembayaran (Soft Cancel)
Jika terjadi kesalahan transfer atau kekeliruan input nominal:
1. Admin berwenang mengklik tombol **"Batalkan Bayar"** pada riwayat pembayaran di jendela detail.
2. Muncul dialog konfirmasi bahaya dengan input wajib **"Alasan Pembatalan"**.
3. Sistem melakukan *soft cancel* (`is_cancelled = true`, `cancel_reason`, `cancelled_at`, `cancelledById`).
4. Sisa kewajiban otomatis direkalibrasi kembali dari seluruh pembayaran aktif yang tersisa.
5. Tindakan pembatalan direkam pada audit log dan tidak menghapus rekaman historis.

---

## 6. EXECUTIVE DASHBOARD (ZERO-HARDCODING GUARANTEE)

Dashboard analitik pada tab **"Executive Dashboard"** disusun **100% dinamis dari query database PostgreSQL**:
1. **Banner Konsolidasi Kewajiban:**  
   Menampilkan total plafon kredit, total telah dilunasi, total sisa kewajiban aktif, dan progress bar tingkat pelunasan nasional.
2. **Breakdown per Entitas Badan Usaha:**  
   Menampilkan perbandingan sisa kewajiban antara *PT. Rajawali Puncak Jayawijaya*, *PT. Hexapilar Perkasa*, dan *PT. Mitra Infrastruktur Sejahtera*.
3. **Breakdown per Kategori Pengadaan:**  
   Menganalisis proporsi beban kredit antara *Pengadaan Barang Baru*, *Sparepart & Alat*, *Semen*, dan *BBM*.
4. **Top 5 Rekanan dengan Exposure Hutang Tertinggi:**  
   Mengurutkan supplier berdasarkan saldo kewajiban terbesar yang belum dilunasi.
5. **Realisasi Arus Kas Keluar Bulanan (Monthly Cash Outflow):**  
   Grafik dan tabel realisasi uang keluar pembayaran kredit per bulan dari tabel `CreditPayment` aktif.

---

## 7. MATRIKS HAK AKSES & RBAC

Hak akses diatur melalui tabel `Permission` dan matriks peran `RolePermission`:

| Permission Code | Modul | Deskripsi Tindakan | Role Default yang Berhak |
|---|---|---|---|
| `FINANCE_VIEW` | FINANCE | Mengakses menu navigasi Finance & halaman utama | SuperAdminBP, AdminBP, CEO, FVP |
| `FINANCE_CREDIT_VIEW` | FINANCE | Melihat daftar kewajiban kredit, filter, dan detail | SuperAdminBP, AdminBP, CEO, FVP |
| `FINANCE_CREDIT_CREATE`| FINANCE | Mendaftarkan kredit manual Non-PO | SuperAdminBP, AdminBP |
| `FINANCE_CREDIT_PAY`   | FINANCE | Mencatat pembayaran pelunasan / angsuran kredit | SuperAdminBP, AdminBP |
| `FINANCE_CREDIT_MANAGE`| FINANCE | Membatalkan pembayaran kredit (Soft cancel) | SuperAdminBP, AdminBP |

---

## 8. STRUKTUR FILE KODE (FEATURE-FIRST MODULAR)

```
src/app/(dashboard)/admin/finance/kredit/
├── page.tsx                           # Server Component (auth guard, prefetch data)
├── actions.ts                         # Server Actions (Prisma queries, sync PO, CRUD payment, audit log)
├── types.ts                           # Interface domain, DTO, filter state
├── kredit-client.tsx                  # Client Orchestrator (< 250 baris)
├── loading.tsx                        # Loading state skeleton
├── hooks/
│   ├── use-kredit-data.ts             # State data, mutasi useTransition, modal dialog handlers
│   └── use-kredit-filters.ts          # State filter tanggal, status, supplier, search
├── components/
│   ├── sections/
│   │   ├── credit-kpi-summary.tsx     # Kartu metrik KPI (Outstanding, Lunas, Overdue, H-7)
│   │   └── credit-filter-bar.tsx      # Filter bar dengan preset Hari Ini, Bulan Ini, Tahun Ini
│   ├── tabs/
│   │   ├── credit-list-tab.tsx        # Tabel utama daftar kewajiban kredit & pagination
│   │   └── credit-dashboard-tab.tsx   # Dashboard visual analitik eksekutif
│   ├── modals/
│   │   ├── credit-detail-dialog.tsx   # Dialog detail kredit, item PO, histori & audit log
│   │   ├── record-credit-payment-dialog.tsx # Form pencatatan pelunasan + upload bukti
│   │   ├── cancel-credit-payment-dialog.tsx # Dialog pembatalan pembayaran berpenjelasan
│   │   └── create-credit-dialog.tsx   # Form registrasi kredit Non-PO
│   └── pagination-bar.tsx             # Paginasi tabel terstandarisasi
└── utils/
    └── kredit-helpers.ts              # Format mata uang IDR, tanggal, konfigurasi badge status
```

---

*Dokumentasi ini disusun sebagai acuan teknis dan operasional Modul Finance Rajawali CRM.*
