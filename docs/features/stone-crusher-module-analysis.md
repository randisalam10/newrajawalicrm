# Analisa Komprehensif Modul Stone Crusher (Retase, Operator, Excavator & Multi-Cabang)

> **Tanggal analisa:** 2026-10-18
> **Ruang lingkup:** Modul Stone Crusher (`/crusher`), Retase Crusher (`/admin/retase-crusher`), Master Cabang (`/admin/cabang`), serta pemetaan lokasi kendaraan & karyawan crusher.
> **Tujuan:** Mengidentifikasi potensi bug salah hitung (retase/insentif), risiko saat pembuatan cabang Stone Crusher baru, dan peluang optimasi.
>
> **Status perbaikan (2026-10-18):** Temuan kode **B1–B5, B7–B9, B11–B16 telah diperbaiki**. **B6, B10, dan provisioning cabang baru masih DITUNDA** (butuh migrasi schema). Rincian di [§10](#10-status-perbaikan-update-2026-10-18).

---

## 1. Ringkasan Eksekutif

Modul Stone Crusher secara fungsional sudah berjalan, namun ditemukan **beberapa titik rawan salah hitung** dan **celah serius pada alur pembuatan cabang baru**. Temuan paling berdampak:

| # | Tingkat | Temuan | Dampak |
|---|---------|--------|--------|
| B1 | 🔴 Kritis | Insentif operator dihitung untuk **semua** material di server, tetapi di UI hanya untuk material pecahan batu | Nominal insentif operator bisa lebih besar dari yang ditampilkan |
| B2 | 🔴 Kritis | Fallback `operator_fee > 0 ? ... : vol * rate` menimpa nilai 0 yang sah | Insentif yang seharusnya 0 menjadi terhitung |
| B3 | 🔴 Kritis | `orderBy: { locationId: "desc" }` pada setting retase → PostgreSQL menempatkan `NULL` di depan | Tarif universal menang atas tarif spesifik cabang |
| B4 | 🟠 Tinggi | Retase penjualan bebas (Non-BP) = 0 saat dibuat, hanya terisi lewat "Hitung Ulang (Backdate)" | Laporan retase sopir Non-BP kosong sampai backdate dijalankan |
| B5 | 🟠 Tinggi | Auto-link operator mengambil `position: "Operator"` pertama di lokasi | Insentif bisa jatuh ke operator excavator, bukan operator crusher |
| B6 | 🟠 Tinggi | `quickAddVehicle` menulis `vehicle_type: "Loader"` untuk dump truck | Data master kendaraan salah tipe |
| B7 | 🟠 Tinggi | `getCrusherVehicles` tidak memfilter lokasi | Operator bisa memilih truk cabang lain |
| B8 | 🟠 Tinggi | `getCrusherEmployees` menarik sopir BP dari **semua** cabang | Salah mapping sopir antar cabang |
| B9 | 🟠 Tinggi | Cabang baru tidak dibuatkan setting retase, sumber, tujuan, tarif insentif, user admin | Cabang baru "kosong" dan rawan salah input |
| B10 | 🟠 Tinggi | Klaster BP ditentukan dari **nama** cabang (hardcoded string) | Menambah cabang baru berisiko salah routing pengiriman |

---

## 2. Arsitektur Data (Ringkas)

Model utama (lihat [`prisma/schema.prisma`](prisma/schema.prisma:1526)):

- [`CrusherDailyReport`](prisma/schema.prisma:1591) — header laporan harian per `locationId + date` (unique).
- [`CrusherMaterialIn`](prisma/schema.prisma:1684) — material masuk (Quarry/Kolbin), retase sopir `rate_price * ritase`.
- [`CrusherMaterialOut`](prisma/schema.prisma:1726) — material keluar (BP / Penjualan Bebas), insentif operator `operator_fee`, retase DT `retase_amount`.
- [`CrusherRetaseSetting`](prisma/schema.prisma:1565) — tarif & formula retase Non-BP (per cabang atau universal `locationId = null`).
- [`CrusherMaterialSource`](prisma/schema.prisma:1527) / [`CrusherDestination`](prisma/schema.prisma:1544) — master sumber & tujuan (opsional per cabang).
- [`OperatorWorkLog`](prisma/schema.prisma:1797) — log jam kerja & upah operator/helper (universal SC & BP).
- [`Location`](prisma/schema.prisma:228) — `type` = `BATCHING_PLANT` | `STONE_CRUSHER` | `HEAD_OFFICE`.

Alur perhitungan retase & insentif tersebar di:
- [`src/app/(dashboard)/crusher/actions.ts`](src/app/(dashboard)/crusher/actions.ts:1) — input harian.
- [`src/app/(dashboard)/admin/retase-crusher/actions.ts`](src/app/(dashboard)/admin/retase-crusher/actions.ts:1) — rekap & backdate.
- [`src/app/(dashboard)/crusher/components/tabs/tab-material-out.tsx`](src/app/(dashboard)/crusher/components/tabs/tab-material-out.tsx:1) — preview di UI.

---

## 3. Potensi Bug Salah Hitung (Retase & Insentif)

### B1 🔴 Insentif Operator: Server vs UI Tidak Konsisten

**Lokasi:**
- Server: [`addCrusherMaterialOut()`](src/app/(dashboard)/crusher/actions.ts:681)
- UI: [`tab-material-out.tsx`](src/app/(dashboard)/crusher/components/tabs/tab-material-out.tsx:159)

**Masalah:**
```ts
// Server (actions.ts:681-682) — SELALU menghitung fee untuk semua material
const operatorRate = ... : 5000
const operatorFee = volumeM3 * operatorRate

// UI (tab-material-out.tsx:159) — hanya untuk material pecahan batu
const operatorFee = isStoneFraction ? parsedVolume * 5000 : 0
```
Server tidak memakai flag `isStoneFraction`. Akibatnya material seperti "Batu Bulat" (yang di UI dianggap bukan pecahan) tetap menghasilkan insentif di database.

**Rekomendasi:** Satukan aturan di satu fungsi bersama (mis. `computeOperatorFee(materialName, volume)`), panggil dari server & UI.

---

### B2 🔴 Fallback Menimpa Nilai 0 yang Sah

**Lokasi:** [`getCrusherRetaseReport()`](src/app/(dashboard)/admin/retase-crusher/actions.ts:455)

```ts
const rate = (r.operator_rate && r.operator_rate > 0) ? r.operator_rate : 5000
const fee  = (r.operator_fee  && r.operator_fee  > 0) ? r.operator_fee  : (vol * rate)
```
Jika `operator_fee` memang 0 (mis. material non-pecahan), kondisi `> 0` gagal → fee dihitung ulang menjadi `vol * 5000`. Ini **membalikkan** keputusan bisnis "fee = 0".

**Rekomendasi:** Gunakan `??` (nullish) atau simpan flag eksplisit, jangan pakai `> 0` sebagai penanda "belum dihitung".

---

### B3 🔴 `orderBy locationId desc` → NULL Menang (PostgreSQL)

**Lokasi:**
- [`getCrusherRetaseSetting()`](src/app/(dashboard)/admin/retase-crusher/actions.ts:49)
- [`recalculateCrusherRetaseBackdate()`](src/app/(dashboard)/admin/retase-crusher/actions.ts:587)
- [`addOperatorWorkLog()`](src/app/(dashboard)/crusher/actions.ts:1730)

```ts
orderBy: [{ locationId: "desc" }, { createdAt: "desc" }]
```
Di PostgreSQL, `ORDER BY ... DESC` menempatkan `NULL` **di depan** (NULLS FIRST). Karena setting universal disimpan dengan `locationId = null`, maka **setting universal selalu terpilih** dan menutupi setting spesifik cabang.

**Rekomendasi:** Ganti ke `orderBy: [{ locationId: { sort: "desc", nulls: "last" } }, ...]` (Prisma mendukung `nulls`), atau filter eksplisit: cari setting `locationId = locId` dulu, baru fallback ke `null`.

---

### B4 🟠 Retase Penjualan Bebas = 0 Saat Dibuat

**Lokasi:** [`addCrusherMaterialOut()`](src/app/(dashboard)/crusher/actions.ts:625)

```ts
// Sesuai aturan bisnis: ... Retase sopir dihitung saat penerimaan Material Masuk di Batching Plant tujuan.
const retaseRate = 0
const retaseAmount = 0
```
Untuk `destination_type = "PENJUALAN_BEBAS"` tidak ada penerimaan di BP, sehingga retase sopir **tidak pernah** terisi otomatis. Nilai baru muncul setelah Finance menjalankan [`recalculateCrusherRetaseBackdate()`](src/app/(dashboard)/admin/retase-crusher/actions.ts:556) yang hanya memproses `PENJUALAN_BEBAS`.

**Dampak:** Laporan retase sopir Non-BP menampilkan Rp0 sampai backdate manual dijalankan → rawan keluhan "retase tidak muncul".

**Rekomendasi:** Hitung retase saat insert untuk `PENJUALAN_BEBAS` menggunakan `CrusherRetaseSetting` aktif (sama seperti backdate), atau tampilkan banner peringatan di UI bahwa data belum dihitung.

---

### B5 🟠 Auto-link Operator Crusher Tidak Spesifik

**Lokasi:** [`addCrusherMaterialOut()`](src/app/(dashboard)/crusher/actions.ts:666)

```ts
const defaultOp = await prisma.employee.findFirst({
    where: { status: "Active", locationId: reportLocId, position: "Operator" },
})
```
`position: "Operator"` mencakup operator excavator/loader/crusher. `findFirst` tanpa `orderBy` → hasil tidak deterministik. Insentif Rp5.000/m³ bisa jatuh ke operator alat berat yang salah.

**Rekomendasi:** Filter berdasarkan `role_type = "OPERATOR_CRUSHER"` (via `OperatorWorkLog`) atau tambahkan field khusus pada `Employee` (mis. `crusherRole`), dan wajibkan pemilihan operator di UI (jangan auto-pilih).

---

### B6 🟠 `quickAddVehicle` Menulis Tipe Kendaraan Salah

**Lokasi:** [`quickAddVehicle()`](src/app/(dashboard)/crusher/actions.ts:1364)

```ts
const newVehicle = await prisma.vehicle.create({
    data: {
        plate_number: cleanPlate,
        code,
        vehicle_type: "Loader",   // ← dump truck ditandai "Loader"
        ...
    },
})
```
Enum [`VehicleType`](prisma/schema.prisma:65) hanya berisi `Mixer` dan `Loader`. Dump truck tidak punya tipe yang tepat, sehingga semua dump truck crusher tercatat sebagai `Loader`. Ini mencemari laporan/ filter berbasis `vehicle_type`.

**Rekomendasi:** Tambahkan nilai enum `DumpTruck` (migrasi) atau gunakan `categoryId` sebagai sumber kebenaran dan hentikan pemakaian `vehicle_type` untuk armada crusher.

---

### B7 🟠 `getCrusherVehicles` Tidak Memfilter Lokasi

**Lokasi:** [`getCrusherVehicles()`](src/app/(dashboard)/crusher/actions.ts:1275)

```ts
where: {
    OR: [
        { dump_truck_size: { in: ["BESAR", "KECIL"] } },
        { category: { name: { contains: "Dump Truck", mode: "insensitive" } } },
        ...(locId ? [{ locationId: locId }] : []),
    ],
}
```
`locId` hanya dipakai untuk **mengurutkan** (baris 1303), bukan memfilter. Karena OR, semua dump truck dari seluruh cabang ikut terambil.

**Dampak:** Operator SC Sorong bisa memilih plat truk SC Harapan → salah mapping armada & retase.

**Rekomendasi:** Filter `locationId: locId` sebagai klausa utama, dan sediakan opsi "tampilkan armada cabang lain" hanya untuk role global.

---

### B8 🟠 `getCrusherEmployees` Menarik Sopir BP Semua Cabang

**Lokasi:** [`getCrusherEmployees()`](src/app/(dashboard)/crusher/actions.ts:1112)

```ts
OR: [
    ...(locId ? [{ locationId: locId }] : [{ location: { type: "STONE_CRUSHER" } }]),
    { position: "Sopir", location: { type: "BATCHING_PLANT" } },  // ← tanpa filter lokasi
],
```
Cabang kedua menarik **semua** sopir BP lintas cabang. Untuk crusher di Sorong, sopir BP Jayapura ikut muncul.

**Rekomendasi:** Batasi sopir BP ke klaster/region yang sama, atau hapus cabang OR ini bila sopir BP tidak relevan untuk input material masuk crusher.

---

### B9 🟠 `upsertCrusherHeader` Mempercayai `total_hm` dari Klien & Mereset Status

**Lokasi:** [`upsertCrusherHeader()`](src/app/(dashboard)/crusher/actions.ts:239)

```ts
const newTotal = Number(data.total_hm) || 0   // ← dari klien, tidak divalidasi
...
update: { ..., status: "SUBMITTED" }          // ← APPROVED kembali jadi SUBMITTED
```
1. `total_hm` seharusnya `hm_end - hm_start`; server tidak menghitung ulang → rawan manipulasi/inkonsistensi.
2. Setiap edit mengubah status menjadi `SUBMITTED`, sehingga laporan yang sudah `APPROVED` turun status tanpa jejak approval.

**Rekomendasi:** Hitung `total_hm` di server (`calculateHmDifference`), dan pertahankan status `APPROVED` atau catat perubahan status di `CrusherReportEditLog`.

---

### B10 🟠 Klaster Batching Plant Ditentukan dari Nama (Hardcoded)

**Lokasi:** [`getBatchingPlantLocations()`](src/app/(dashboard)/crusher/actions.ts:1078)

```ts
if (!crusherName || crusherName.includes("harapan") || crusherName.includes("jayapura") || crusherName.includes("sentani")) {
    ... filter !sorong && !tenggarong
} else if (crusherName.includes("sorong")) { ... }
else if (crusherName.includes("tenggarong")) { ... }
```
Logika routing pengiriman bergantung pada **string nama** cabang. Menambah crusher/BP baru (mis. "SC Nabire") akan jatuh ke `return allBps` → operator bisa salah kirim ke BP luar wilayah.

**Rekomendasi:** Tambahkan field `region`/`cluster` pada `Location` dan filter berdasarkan field tersebut, bukan nama.

---

### B11 🟠 Formula Retase di Penerimaan BP Berbeda dari Formula Crusher

**Lokasi:** [`confirmMaterialReceiptInBP()`](src/app/(dashboard)/crusher/actions.ts:1545)

```ts
calculatedRetase = Math.round(Number(finalVolume) * Number(resolvedDistance) * Number(resolvedRate))
```
Formula = `volume × jarak × tarif`, sedangkan `CrusherRetaseSetting` mendukung 4 formula (`PER_KM_TIERED`, `PER_KM_FLAT`, `PER_M3_KM`, `PER_RIT_FLAT`). Dua tempat menghitung retase dengan aturan berbeda → potensi selisih.

**Rekomendasi:** Ekstrak satu fungsi `computeRetase(formula, params)` dan pakai di kedua alur.

---

### B12 🟠 Retase Material Masuk Mengabaikan `CrusherRetaseSetting`

**Lokasi:** [`addCrusherMaterialIn()`](src/app/(dashboard)/crusher/actions.ts:500)

```ts
const ratePrice = item.rate_price !== undefined ? Number(item.rate_price) : 4500
const retaseAmount = ritase * ratePrice
```
Tarif Rp4.500/rit di-hardcode dan tidak mengikuti master `CrusherRetaseSetting`. Jika kebijakan tarif berubah, data lama & baru tidak konsisten.

**Rekomendasi:** Ambil tarif dari master (dengan fallback 4500) dan simpan snapshot `rate_price` untuk audit.

---

### B13 🟠 Rekap Operator Mengabaikan Filter `isPaid` & `driverId`

**Lokasi:** [`getCrusherRetaseReport()`](src/app/(dashboard)/admin/retase-crusher/actions.ts:244)

`opRecords` di-query tanpa filter `isPaid`/`driverId`, berbeda dengan `inRecords`/`outRecords`. Saat user memfilter "UNPAID", ringkasan operator tetap menampilkan seluruh transaksi → angka ringkasan tidak sinkron dengan filter.

**Rekomendasi:** Terapkan filter yang sama pada `opRecords`, atau pisahkan filter driver (tidak relevan) secara eksplisit.

---

### B14 🟡 `totalDistanceKm` Menjumlah Jarak per Baris, Bukan per Rit

**Lokasi:** [`getCrusherRetaseReport()`](src/app/(dashboard)/admin/retase-crusher/actions.ts:404)

```ts
totalDistanceKm += d.distanceKm   // tidak dikali ritase
```
Untuk baris dengan `ritase = 13` dan `distance = 10 km`, total hanya menambah 10 km, bukan 130 km. Angka ini informatif, tetapi menyesatkan bila dipakai sebagai KPI.

**Rekomendasi:** Kalikan dengan `ritase` atau beri label "jarak per trip".

---

### B15 🟡 `rateOvertime` Tidak Menangani Nilai 0

**Lokasi:** [`addOperatorWorkLog()`](src/app/(dashboard)/crusher/actions.ts:1735)

```ts
if (!rateOvertime) rateOvertime = masterRate.tarif_sekunder ?? masterRate.tarif_utama
```
`??` hanya fallback untuk `null`/`undefined`. Jika `tarif_sekunder = 0` (lembur tidak dibayar), nilainya tetap 0 — bisa jadi benar, tapi jika 0 berarti "belum diisi", ini bug. Perlu kejelasan semantik.

---

### B16 🟡 `getMasterOperatorRates` Bergantung Urutan `effective_date`

**Lokasi:** [`getMasterOperatorRates()`](src/app/(dashboard)/crusher/actions.ts:1441)

Query `orderBy: { effective_date: "desc" }`, lalu loop menimpa hanya bila `r.locationId === locId`. Bila ada beberapa tarif spesifik cabang, yang **paling lama** menang (karena loop terakhir). Seharusnya tarif terbaru yang menang.

**Rekomendasi:** Urutkan `effective_date desc` lalu `break` pada kecocokan pertama, atau pilih eksplisit tarif dengan `effective_date` terbaru ≤ hari ini.

---

## 4. Celah Pembuatan Cabang Stone Crusher Baru

**Lokasi:** [`createLocation()`](src/app/(dashboard)/admin/cabang/actions.ts:39)

Saat ini `createLocation` hanya membuat baris `Location` (nama + type). Tidak ada provisioning data pendukung:

| Data yang seharusnya dibuat | Status | Dampak |
|-----------------------------|--------|--------|
| `CrusherRetaseSetting` default | ❌ Tidak dibuat | Retase Non-BP = 0 sampai diatur manual |
| `AggregateRetaseSetting` | ❌ Tidak dibuat | Retase agregat masuk BP = 0 |
| `RetaseSetting` (BP) | ❌ Tidak dibuat | — |
| `CrusherMaterialSource` (Quarry) | ❌ Tidak dibuat | Operator tidak punya pilihan sumber |
| `CrusherDestination` | ❌ Tidak dibuat | Tidak ada tujuan Non-BP |
| `MasterIncentiveRate` (operator/helper) | ❌ Tidak dibuat | Upah operator jatuh ke fallback hardcoded |
| `VehicleCategory` (Dump Truck) | ❌ Tidak dibuat | — |
| User admin cabang (`AdminCrusher`) | ❌ Tidak dibuat | Tidak ada yang bisa login ke cabang baru |
| `OperationalTargetSetting` | ❌ Tidak dibuat | Target produksi kosong |

**Risiko tambahan:**
- [`deleteLocation()`](src/app/(dashboard)/admin/cabang/actions.ts:116) menghapus `Location`; relasi `Employee.locationId` & `Vehicle.locationId` bersifat opsional tanpa `onDelete` eksplisit → berpotensi menjadi orphan (SetNull) atau gagal. Perlu verifikasi perilaku FK.
- [`updateLocation()`](src/app/(dashboard)/admin/cabang/actions.ts:77) mengubah `type` (mis. BP → STONE_CRUSHER) tanpa memigrasikan setting terkait → data lama (retase BP) tetap menempel.

**Rekomendasi:**
1. Buat fungsi `provisionCrusherBranch(locationId)` yang membuat seluruh data default dalam satu transaksi.
2. Tambahkan wizard "Buat Cabang Stone Crusher" yang meminta tarif retase awal, sumber material, dan admin cabang.
3. Validasi `deleteLocation` (tolak bila masih ada laporan/transaksi) dan tangani migrasi saat `type` berubah.

---

## 5. Masalah Pemetaan Lokasi (Kendaraan & Karyawan)

### 5.1 Resolusi Lokasi Crusher

**Lokasi:** [`resolveCrusherLocation()`](src/app/(dashboard)/crusher/utils/crusher-location-helper.ts:9)

- Bila tidak ada `Location.type = "STONE_CRUSHER"`, helper **fallback ke semua lokasi** (baris 39-55). User crusher bisa melihat BP.
- [`findDefaultCrusherLocation()`](src/app/(dashboard)/crusher/actions.ts:1144) mencocokkan nama `"Harapan"`/`"Crusher"` — rapuh.
- [`getCrusherLocations()`](src/app/(dashboard)/crusher/actions.ts:1004) juga fallback ke semua lokasi bila tidak ada crusher.

**Rekomendasi:** Wajibkan minimal satu `STONE_CRUSHER`; bila tidak ada, tampilkan error eksplisit alih-alih fallback diam-diam.

### 5.2 Pemetaan Kendaraan

- [`getCrusherVehicles()`](src/app/(dashboard)/crusher/actions.ts:1275) — tidak memfilter lokasi (lihat B7).
- [`quickAddVehicle()`](src/app/(dashboard)/crusher/actions.ts:1315) — `vehicle_type` salah (lihat B6), dan `code` dibuat `DT-<plat>` yang bisa bentrok bila plat sama di cabang berbeda (plat unik global, jadi aman, tapi kode tidak menyertakan cabang).
- [`updateCrusherVehicle()`](src/app/(dashboard)/crusher/actions.ts:1381) — tidak bisa memindahkan kendaraan antar cabang (`locationId` tidak di-update).

### 5.3 Pemetaan Karyawan

- [`getCrusherEmployees()`](src/app/(dashboard)/crusher/actions.ts:1112) — menarik sopir BP lintas cabang (lihat B8).
- [`quickAddEmployee()`](src/app/(dashboard)/crusher/actions.ts:1161) — `driverCategoryId` di-set, tetapi `updateCrusherEmployee()` **tidak** memperbarui `locationId`, sehingga karyawan tidak bisa dipindah cabang.
- [`addOperatorWorkLog()`](src/app/(dashboard)/crusher/actions.ts:1686) — tidak memvalidasi bahwa `employeeId`/`vehicleId` benar milik `locationId` yang dipilih → bisa mencatat upah lintas cabang.

**Rekomendasi:** Tambahkan validasi kepemilikan lokasi pada semua operasi tulis (employee, vehicle, work log), dan sediakan fitur pindah cabang.

---

## 6. Peluang Optimasi

### 6.1 Performa Query
- **N+1 di [`addCrusherMaterialOut()`](src/app/(dashboard)/crusher/actions.ts:567):** melakukan `findUnique` report, `findFirst` vehicle, `findFirst` employee, `findFirst` operator, `findUnique` destination secara berurutan. Gabungkan dengan `include`/`Promise.all`.
- **Duplikasi fetch destination:** logika batch-load `crusherDestination` diulang di [`getCrusherDailyReport()`](src/app/(dashboard)/crusher/actions.ts:59), [`getCrusherRetaseReport()`](src/app/(dashboard)/admin/retase-crusher/actions.ts:286), dan [`recalculateCrusherRetaseBackdate()`](src/app/(dashboard)/admin/retase-crusher/actions.ts:632). Ekstrak ke helper.
- **`getCrusherRetaseReport`** memuat `opRecords` (semua material out) terpisah dari `outRecords` → dua query besar. Bisa digabung dengan filter `destination_type`.

### 6.2 Konsistensi Perhitungan
- Sentralisasi formula retase & insentif ke satu modul `src/lib/crusher-calc.ts` yang dipakai server + UI + backdate + penerimaan BP.
- Simpan snapshot tarif (`rate_price`, `operator_rate`, `retase_rate`) — sudah ada, pertahankan dan jangan hitung ulang dengan fallback `> 0`.

### 6.3 Integritas Data
- Tambahkan `@@index([locationId, date])` pada `CrusherMaterialIn`/`CrusherMaterialOut` (saat ini hanya `reportId`).
- Pertimbangkan `onDelete: Restrict` pada `Location` untuk mencegah penghapusan cabang yang masih punya transaksi.
- Tambahkan constraint/validasi `total_hm = hm_end - hm_start` di server.

### 6.4 Skalabilitas Multi-Cabang
- Tambahkan field `region`/`cluster` pada `Location` untuk menggantikan pencocokan nama (B10).
- Tambahkan field `businessUnit`/`crusherRole` pada `Employee` untuk membedakan operator crusher vs excavator (B5).

### 6.5 UX & Audit
- Tampilkan peringatan di UI bila retase Non-BP belum dihitung (B4).
- Catat perubahan status laporan (`SUBMITTED`/`APPROVED`) di `CrusherReportEditLog` (B9).
- Tampilkan indikator "tarif berlaku" (universal vs cabang) agar Finance sadar setting mana yang aktif (B3).

---

## 7. Matriks Prioritas Perbaikan

| Prioritas | Item | Estimasi Dampak | Kompleksitas |
|-----------|------|-----------------|--------------|
| P0 | B1, B2 — konsistensi insentif operator | Tinggi (salah bayar) | Rendah |
| P0 | B3 — `orderBy` NULLS FIRST | Tinggi (tarif salah) | Rendah |
| P1 | B4 — retase Non-BP saat insert | Tinggi (data kosong) | Sedang |
| P1 | B5 — auto-link operator spesifik | Tinggi (salah orang) | Sedang |
| P1 | B7, B8 — filter lokasi kendaraan/karyawan | Tinggi (salah mapping) | Rendah |
| P1 | B9 — provisioning cabang baru | Tinggi (operasional) | Tinggi |
| P2 | B6 — `vehicle_type` dump truck | Sedang | Sedang (migrasi enum) |
| P2 | B10 — klaster berbasis field | Sedang | Sedang |
| P2 | B11, B12 — sentralisasi formula retase | Sedang | Sedang |
| P3 | B13–B16, optimasi query & index | Rendah–Sedang | Rendah |

---

## 8. Lampiran: Peta File Terkait

| File | Peran |
|------|-------|
| [`src/app/(dashboard)/crusher/actions.ts`](src/app/(dashboard)/crusher/actions.ts:1) | Server actions utama SC (input harian, master, penerimaan BP, work log) |
| [`src/app/(dashboard)/admin/retase-crusher/actions.ts`](src/app/(dashboard)/admin/retase-crusher/actions.ts:1) | Rekap retase, setting tarif, backdate, pelunasan |
| [`src/app/(dashboard)/crusher/utils/crusher-location-helper.ts`](src/app/(dashboard)/crusher/utils/crusher-location-helper.ts:1) | Resolusi lokasi crusher & anti-tampering |
| [`src/app/(dashboard)/crusher/utils/crusher-helpers.ts`](src/app/(dashboard)/crusher/utils/crusher-helpers.ts:1) | Helper format & perhitungan HM/downtime |
| [`src/app/(dashboard)/crusher/components/tabs/tab-material-out.tsx`](src/app/(dashboard)/crusher/components/tabs/tab-material-out.tsx:1) | UI input material keluar & preview insentif |
| [`src/app/(dashboard)/crusher/components/material-in/use-material-in.ts`](src/app/(dashboard)/crusher/components/material-in/use-material-in.ts:1) | Hook input material masuk |
| [`src/app/(dashboard)/crusher/operator/components/operator-log-form.tsx`](src/app/(dashboard)/crusher/operator/components/operator-log-form.tsx:1) | Form log jam kerja & upah operator/helper |
| [`src/app/(dashboard)/admin/cabang/actions.ts`](src/app/(dashboard)/admin/cabang/actions.ts:1) | CRUD master cabang (BP/SC/HO) |
| [`prisma/schema.prisma`](prisma/schema.prisma:1526) | Definisi model crusher & relasi |

---

## 9. Kesimpulan

Modul Stone Crusher memiliki fondasi data yang cukup lengkap, namun **aturan perhitungan retase & insentif tersebar di banyak tempat dengan fallback yang tidak konsisten**, sehingga berisiko salah hitung. Selain itu, **alur pembuatan cabang baru belum melakukan provisioning data pendukung**, dan **pemetaan kendaraan/karyawan belum ter-scope per cabang**, yang akan menjadi masalah serius saat jumlah cabang Stone Crusher bertambah.

Langkah paling mendesak: (1) sentralisasi formula retase/insentif, (2) perbaiki `orderBy` setting retase, (3) scope kendaraan & karyawan per lokasi, dan (4) bangun provisioning cabang otomatis.

---

## 10. Status Perbaikan (Update 2026-10-18)

### 10.1 Modul kalkulasi terpusat (baru)

- [`src/lib/crusher-calc.ts`](src/lib/crusher-calc.ts:1) — fungsi murni (client-safe): `isStoneFractionMaterial()`, `computeOperatorFee()`, `computeRetase()`.
- [`src/lib/crusher-retase-setting.ts`](src/lib/crusher-retase-setting.ts:1) — `resolveCrusherRetaseSetting()` dengan presedensi benar (spesifik cabang → universal).

### 10.2 Item yang SUDAH diperbaiki

| # | Status | Perbaikan |
|---|--------|-----------|
| B1 | ✅ Selesai | Server & UI memakai `computeOperatorFee()` — insentif HANYA untuk pecahan batu. |
| B2 | ✅ Selesai | Fallback `> 0` diganti `computeOperatorFee()`; nilai 0 yang sah dipertahankan. |
| B3 | ✅ Selesai | `resolveCrusherRetaseSetting()` dipakai di `getCrusherRetaseSetting`, backdate, dan `addOperatorWorkLog` (spesifik cabang menang atas universal). |
| B4 | ✅ Selesai | Retase `PENJUALAN_BEBAS` dihitung otomatis saat input memakai `CrusherRetaseSetting` aktif. |
| B5 | ✅ Selesai | Auto-link operator memprioritaskan `role_type = "OPERATOR_CRUSHER"` (via `OperatorWorkLog`), fallback deterministik (`orderBy name`). |
| B7 | ✅ Selesai | `getCrusherVehicles` memfilter `locationId` sebagai klausa utama. |
| B8 | ✅ Selesai | `getCrusherEmployees` tidak lagi menarik sopir BP lintas cabang. |
| B9 | ✅ Selesai | `total_hm` dihitung di server (`calculateHmDifference`); status `APPROVED` dipertahankan saat edit. |
| B11 | ✅ Selesai | `confirmMaterialReceiptInBP` memakai `computeRetase()` terpusat (mapping `PER_M3_KM`). |
| B12 | ✅ Selesai | Tarif material masuk diambil dari master (`rate_flat_rit`) dengan fallback Rp4.500. |
| B13 | ✅ Selesai | `opRecords` menerapkan filter `is_operator_paid` sesuai filter pelunasan. |
| B14 | ✅ Selesai | `totalDistanceKm` dikalikan `ritase` (jarak per trip × rit). |
| B15 | ✅ Selesai | Nilai `rate_overtime`/`rate_normal` = 0 yang dikirim eksplisit dihormati. |
| B16 | ✅ Selesai | `getMasterOperatorRates` memakai tarif spesifik terbaru (kecocokan pertama, `effective_date desc`). |

### 10.3 Item yang DITUNDA (butuh migrasi schema / keputusan lanjutan)

| # | Alasan ditunda |
|---|----------------|
| B6 | Butuh migrasi enum `VehicleType` (`DumpTruck`) atau hentikan pemakaian `vehicle_type` untuk armada crusher. |
| B10 | Butuh field `region`/`cluster` pada `Location` untuk menggantikan pencocokan nama. |
| §4 | Provisioning cabang baru (`provisionCrusherBranch()` + wizard) — fitur baru, perlu desain. |

> Catatan: B5 idealnya juga menambah field khusus `crusherRole` pada `Employee` (ditunda bersama migrasi schema), namun perbaikan saat ini sudah menghilangkan pemilihan operator yang tidak deterministik.
