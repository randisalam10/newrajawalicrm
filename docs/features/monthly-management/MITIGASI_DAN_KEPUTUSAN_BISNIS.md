# Mitigasi & Keputusan Bisnis — Modul Laporan Bulanan Manajemen

**Modul:** `/admin/reports/monthly-management`
**Dokumen pendamping:** [`ANALISA_MODUL_LAPORAN_BULANAN_MANAGEMENT.md`](./ANALISA_MODUL_LAPORAN_BULANAN_MANAGEMENT.md)
**Tanggal:** 18 Oktober 2026

> **Tujuan dokumen ini:** Menampung temuan yang **TIDAK dieksekusi otomatis** karena masih **abu-abu** (membutuhkan keputusan bisnis, data tambahan, atau konfirmasi kebijakan). Setiap item memuat: masalah, mengapa belum dieksekusi, opsi, dan rekomendasi. **Tidak ada perubahan kode yang dilakukan untuk item di dokumen ini sampai ada keputusan.**

---

## Ringkasan Status

| Kode | Item | Alasan Belum Dieksekusi | Butuh |
|---|---|---|---|
| C1 | Definisi Cash Collection Rate | Bergantung kebijakan penagihan + kualitas `payment_date` | Keputusan bisnis + perbaikan data |
| C2b | Cakupan kas keluar (PO/gaji) | Bergantung model kas BP vs HO | Keputusan bisnis |
| C4 | Klasifikasi Gaji (COGS vs Opex) | Kebijakan akuntansi | Keputusan manajemen |
| C5 | Material standar vs aktual | Tidak ada data konsumsi riil | Keputusan + roadmap data |
| C6b | PASIR RBL → material atau dikecualikan | Risiko double-count | Keputusan bisnis |
| H3 | PPN penjualan agregat | Kebijakan pajak | Konfirmasi pajak |
| M1 | Tarif PPN 11% vs 12% | Regulasi pajak | Konfirmasi pajak |
| M4 | Scoping lokasi Payment vs Deposit | Perlu definisi lokasi transaksi | Keputusan bisnis |
| M6 | Kapasitas terpasang | Tidak ada master kapasitas | Data master |
| M7 | RBL Budget tranche vs revisi | Perlu konfirmasi proses RBL | Konfirmasi proses |
| M8 | Klasifikasi kategori berbasis string | Perlu master kategori baku | Roadmap data |
| M9 | Filter kategori retase DT keluar | Perlu definisi pergerakan agregat | Keputusan bisnis |
| M10 | Catch-all kategori kontrak | Perlu master kategori kontrak | Roadmap data |
| L3 | Kepatuhan armada (pajak/KIR) | Data master kendaraan kosong | Input data |

---

## Detail Item

### C1. Definisi Cash Collection Rate

**Masalah:** `cashCollectionRate = totalPaymentReceived / totalDppRevenue × 100` menghasilkan 223,52% karena pembilang memuat pelunasan tagihan periode lalu, dan `payment_date` tidak mencerminkan tanggal kas riil (banyak diisi = tanggal input).

**Mengapa belum dieksekusi:** Tidak ada definisi tunggal yang "benar" tanpa keputusan bisnis. Opsi:
- **(a) Collection atas invoice bulan ini:** pembayaran atas invoice yang `issue_date` = bulan ini ÷ omset bulan.
- **(b) Cash realization:** total kas masuk bulan ÷ (AR awal bulan + penjualan bulan).
- **(c) Hapus metrik** dan ganti dengan tabel aging + daftar pembayaran.

**Rekomendasi:** Opsi (a) untuk KPI penagihan + perbaiki form `payment_date` agar memakai tanggal kas riil (tambah field "tanggal transaksi bank" terpisah dari "tanggal input").

**Dampak bila dibiarkan:** Manajemen melihat rasio >100% yang tidak dapat dipakai.

---

### C2b. Cakupan Kas Keluar (PO & Gaji)

**Masalah:** `totalCashOutflow` hanya = realisasi kas RBL cabang. PO (kredit/HO) dan gaji tidak dihitung.

**Mengapa belum dieksekusi:** Bergantung model kas: apakah PO dibayar HO (di luar kas BP) atau kas BP. `PurchaseOrder` tidak punya kolom pembayaran, sehingga tidak ada data kas PO.

**Opsi:**
- **(a)** Pertahankan scope kas BP (RBL) — cukup **relabel** (sudah dieksekusi sebagai perbaikan presentasi).
- **(b)** Tambahkan modul pembayaran PO agar kas keluar lengkap.

**Rekomendasi:** (a) untuk sekarang; (b) masuk roadmap.

---

### C4. Klasifikasi Gaji (COGS vs Opex)

**Masalah:** Gaji Rp 92,2 jt (kategori `BIAYA_POKOK_LAINNYA`) masuk Direct COGS → unit COGS naik Rp 162.516/m³.

**Mengapa belum dieksekusi:** Ini keputusan akuntansi manajemen. Bila gaji = beban tetap, harus pindah ke Seksi D; bila = biaya produksi variabel, tetap di Seksi B.

**Rekomendasi:** Konfirmasi definisi. Bila beban tetap → pindahkan kategori ke overhead. Minimal: beri label "Gaji (Input Manual)".

---

### C5. Material Standar vs Aktual

**Masalah:** Biaya material dihitung dari resep mix-design × harga master (standard costing), bukan pemakaian fisik.

**Mengapa belum dieksekusi:** Tidak ada tabel konsumsi/stok material. `MaterialIncoming` = pembelian; `AggregateIncoming` = kedatangan. Tidak ada data pemakaian aktual.

**Rekomendasi:** Pertahankan standard costing (sah), **beri label** "Biaya Material Standar (Mix Design)". Roadmap: modul stok/pemakaian bila ingin akurasi aktual.

---

### C6b. PASIR RBL → Material atau Dikecualikan

**Masalah:** Kas RBL kategori "PASIR"/"PASIR ALKON" (Rp 26,55 jt) masuk Overhead. Bila dipindah ke Seksi B material, berisiko **double-count** dengan biaya material formula.

**Mengapa belum dieksekusi:** Perlu keputusan apakah PASIR RBL adalah (a) pembelian material (→ Seksi B, tapi harus dikurangi dari formula), (b) biaya angkut/retase DT (→ Seksi B retase), atau (c) memang beban lain.

**Catatan:** Item **KASBON** (Rp 5 jt) **sudah dieksekusi** untuk dikecualikan dari overhead (jelas bukan beban). PASIR menunggu keputusan.

**Rekomendasi:** Klasifikasikan ulang di master kategori RBL: tandai kategori material vs non-beban, lalu petakan ke seksi yang tepat.

---

### H3. PPN Penjualan Agregat

**Masalah:** `currentAggPPN = 0` (dipaksa nol).

**Mengapa belum dieksekusi:** `AggregateOutgoing` tidak punya field PPN; perlu konfirmasi apakah penjualan agregat objek PPN dan tarifnya.

**Rekomendasi:** Bila objek PPN, tambahkan field `ppn_mode`/`ppn_rate` pada `AggregateOutgoing` dan terapkan rumus sama seperti readymix.

---

### M1. Tarif PPN 11% vs 12%

**Masalah:** Default `ppn_rate ?? 11` di readymix & sewa. UU PPN Indonesia naik 11%→12% (2025).

**Mengapa belum dieksekusi:** Perlu konfirmasi tarif yang berlaku untuk periode transaksi.

**Rekomendasi:** Konfirmasi tarif; bila 12%, perbarui default & data historis sesuai tanggal berlaku.

---

### M4. Scoping Lokasi Payment vs Deposit

**Masalah:** Payment difilter via `invoice.locationId`; Deposit via `project.customer.locationId`.

**Mengapa belum dieksekusi:** Perlu definisi "lokasi transaksi" yang benar untuk deposit.

**Rekomendasi:** Samakan basis (mis. keduanya via lokasi invoice/proyek) setelah konfirmasi.

---

### M6. Kapasitas Terpasang

**Masalah:** `installedCapacity = 12480` hardcoded (60 m³/jam × 8 jam × 26 hari).

**Mengapa belum dieksekusi:** Tidak ada master kapasitas plant.

**Rekomendasi:** Tambahkan konfigurasi kapasitas per lokasi (jam operasi, hari kerja, kapasitas/jam).

---

### M7. RBL Budget Tranche vs Revisi

**Masalah:** `totalRblBudgetPlafon` menjumlah semua `RblBudget` sebulan (Sept: 4 baris V1–V4 = Rp 195 jt).

**Mengapa belum dieksekusi:** Bukti mengarah **tranche berurutan** (masing-masing habis terpakai), sehingga penjumlahan wajar. Namun bila suatu saat berupa **revisi**, penjumlahan salah.

**Rekomendasi:** Konfirmasi proses; bila revisi, gunakan hanya versi terakhir (mis. flag `isLatest`).

---

### M8. Klasifikasi Kategori Berbasis String Matching

**Masalah:** Klasifikasi PO & RBL memakai pencocokan kata ("SPR", "sparepart", "suku cadang", dll.) + daftar pengecualian.

**Mengapa belum dieksekusi:** Perlu master kategori baku dengan flag tipe (material/BBM/maintenance/overhead/non-beban).

**Rekomendasi:** Tambahkan kolom `type` pada `RblCategory` & `PoCategory`, lalu klasifikasi berbasis ID, bukan string.

---

### M9. Filter Kategori Retase DT Keluar

**Masalah:** `dtRetaseOutgoing` menjumlah `retase_amount` seluruh `AggregateOutgoing` tanpa filter kategori.

**Mengapa belum dieksekusi:** Perlu definisi pergerakan agregat mana yang memicu retase (hanya penjualan? termasuk transfer internal?).

**Rekomendasi:** Konfirmasi; bila hanya penjualan, tambahkan `category: "PENJUALAN"`.

---

### M10. Catch-all Kategori Kontrak

**Masalah:** Kategori kontrak tak dikenal → `totalAsuransiRetribusiCost`.

**Mengapa belum dieksekusi:** Perlu master kategori kontrak baku.

**Rekomendasi:** Tambahkan kategori eksplisit + validasi input.

---

### L3. Kepatuhan Armada (Pajak/KIR)

**Masalah:** `Vehicle.annual_tax_cost` & `kir_cost` = 0 dan `VehicleComplianceRecord` kosong → kepatuhan per-kendaraan efektif nol.

**Mengapa belum dieksekusi:** Ini masalah **input data**, bukan kode.

**Rekomendasi:** Input data pajak/KIR kendaraan atau andalkan kontrak tetap.

---

## Kesimpulan

- **Dieksekusi (aman):** lihat rencana perbaikan di todo (H1, H4, C2-label, C3-label, C6-KASBON, M2, M5, L1, L2, L4, H2).
- **Menunggu keputusan (dokumen ini):** C1, C2b, C4, C5, C6b, H3, M1, M4, M6, M7, M8, M9, M10, L3.

> Setiap item di dokumen ini **tidak akan diubah** sampai ada keputusan resmi dari manajemen/pemilik sistem.
