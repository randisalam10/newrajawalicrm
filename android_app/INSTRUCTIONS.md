# Panduan Pemasangan Rajawali Leader (Android)

Setelah file-file di folder ini (`android_app`) di-copy ke project Android Studio Anda, ikuti langkah berikut untuk konfigurasi akhir:

### 1. Izin Internet & Service (AndroidManifest.xml)
Buka `app/src/main/AndroidManifest.xml` dan tambahkan baris berikut di atas tag `<application>`:
```xml
<uses-permission android:name="android.permission.INTERNET" />
```

Dan di dalam tag `<application>`, tambahkan service untuk Firebase:
```xml
<service
    android:name=".service.MyFirebaseMessagingService"
    android:exported="false">
    <intent-filter>
        <action android:name="com.google.firebase.MESSAGING_EVENT" />
    </intent-filter>
</service>
```

### 2. Dependency (build.gradle.kts - App Level)
Pastikan library berikut ada di `dependencies { ... }`:
```kotlin
// Networking
implementation("com.squareup.retrofit2:retrofit:2.9.0")
implementation("com.squareup.retrofit2:converter-gson:2.9.0")

// Firebase Cloud Messaging
implementation(platform("com.google.firebase:firebase-bom:32.7.0"))
implementation("com.google.firebase:firebase-messaging-ktx")
```

### 3. Koneksi API
File `data/remote/RetrofitClient.kt` default-nya diarahkan ke `10.0.2.2:3000` (untuk emulator).
Jika menggunakan HP Asli, ganti dengan IP komputer Anda (misal: `192.168.1.x`).
