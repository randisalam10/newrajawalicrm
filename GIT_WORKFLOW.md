# Skenario Git & Versioning untuk Rajawali BP ERP

Untuk mencegah terulangnya insiden fitur setengah jadi (seperti *Mobile Push Notifications*) yang tidak sengaja terbawa ke repositori `main` dan merusak *production*, berikut adalah standar best practices alur kerja Git (Git Flow) yang sangat disarankan untuk pengerjaan Mobile App selanjutnya:

## 1. Arsitektur Branching (Cabang Git)

Patuhi pemisahan cabang (*branch*) secara ketat sebagaimana skenario berikut:

- **`main`**
  Cabang suci yang **HANYA** boleh menampung kode yang 100% stabil dan siap rilis ke Production Web. Tidak boleh ada fitur eksperimen atau perubahan *database schema* (seperti `Pusher` dan Firebase SDK) yang di-*push* langsung ke sini bila sistem produksinya belum siap.
- **`feat/mobile-app-preparation`** (Atau `feat/mobile-api`)
  Cabang utama tempat berkumpulnya semua *resource* terkait persiapan Mobile App. Semua update API, *schema* `prisma` terbaru (seperti kolom `updatedAt` yang baru), konfigurasi notifikasi Firebase (FCM), dan *Pusher* diletakkan di sini.

## 2. Alur Pengembangan (*Development Workflow*)

### A. Saat Mengerjakan Fitur Mobile

Setiap kali Anda akan meneruskan pengerjaan API atau komponen untuk Mobile App di VS Code Anda, pastikan Anda berada di branch `feat/mobile`:
```bash
git checkout feat/mobile-app-preparation
```
Lalu jalankan Prisma dan Web Server dengan database lokal Anda seperti biasa.

### B. Menerapkan Update dari Web Production ke Mobile

Tim pengembangan web (atau saya sebagai AI Anda) akan terus merilis fitur-fitur baru ke Web/Production (contoh: di `v1.1.18` kita menambahkan kolom *Created At*). Fitur web tersebut sebaiknya diserap secara rutin ke cabang *Mobile* Anda agar kode API Anda tidak usang:

```bash
git checkout feat/mobile-app-preparation
git fetch origin
git merge main
```
> **Penting**: Saat *merge*, terkadang terjadi *conflict* (misal pada file `actions.ts`). Lakukan *Resolve Conflict* dengan tetap mempertahankan *import* Firebase/Pusher dari branch Mobile, seraya mengakomodasi logika bisnis PO baru dari branch *main*.

### C. Saat Fitur Mobile Sudah Selesai (Rilis Besar-besaran)

Jika aplikasi Flutter/React Native Mobile sudah jadi dan siap digunakan di *Company*, maka skema Prisma dan *backend actions* pada cabang `feat/mobile-app-preparation` siap digabungkan (*merge*) ke `main` melalui **Pull Request (PR)**.
```bash
git checkout main
git merge feat/mobile-app-preparation
# Jalankan Prisma Migrate di production setelah merge
bash deploy.sh
```

## 3. Resolusi Konflik (Conflict Resolution) yang Benar

Bila Anda masih terjebak di tengah *merge* yang rumit antara *mobile* dan *main*:
- Selalu gunakan `git status` untuk melihat _unmerged paths_.
- *Accept Current Changes* untuk kode web murni yang benar dari `main`.
- *Accept Incoming Changes* untuk mengembalikan dependensi API *Mobile* yang sempat kita cabut.

---

Saat ini saya telah memindahkan komputer lokal (`d:\\Project Free\\New_Rajawali`) Anda kembali ke *branch* `feat/mobile-app-preparation`. Silakan **hapus instalasi lokal** dan jalankan ulang `npx prisma generate` yang mengandung schema Mobile Anda agar fungsi *Push Notification* tersebut aktif kembali untuk di-test lewat Postman/emulator!
