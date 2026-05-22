# 📈 Binance-OKX Arbitrage Bot & Simulator (Integrated AI & Telegram)

Aplikasi Web Arbitrase Multi-Asset real-time berkinerja tinggi antara bursa **Binance** dan **OKX**. Dilengkapi dengan pemindai spread harga otomatis, log terminal eksekusi simulasi, parameter manajemen risiko kustom, modul uji historis (backtesting), analisis sentimen pasar global berbasis **Google Gemini API**, enkripsi kubah kredensial klien (AES-256), dan integrasi notifikasi Telegram real-time.

---

## 🎨 Konsep Visual & Desain
Aplikasi ini didesain menggunakan **Cosmic Slate Theme** yang elegan dan efisien bagi trader profesional:
- **Aksen Gold & Slate**: Kombinasi warna latar belakang arang pekat (`#0c0c0c`) dengan aksen keemasan/amber mewah (`#d4af37`), memberikan kesan premium dan eye-safe untuk pemantauan jangka panjang.
- **Visualisasi Kurva Profit**: Grafik visual interaktif curves SVG real-time untuk simulasi dan backtesting.
- **Font Kombinasi**: Memadukan font display elegan (sans-serif modern) dengan font monospace (*JetBrains Mono*) untuk data numerik, ticker, dan logs terminal instan.

---

## 🚀 Fitur Utama

1. **Pendeteksi Ticker Real-Time**: Terkoneksi ke Public REST API Binance & OKX guna menyaring harga limit teratas secara langsung di sisi server dengan selisih mikro (spread).
2. **Preset Skenario Simulative**: Tombol cepat untuk memicu skenario ekstrem pasar (inflow whale, bad rumor, dll.) guna menguji performa bot menghadapi lonjakan slippage.
3. **Kubah API Key Terenkripsi**: Menggunakan enkripsi simetris **AES-256-GCM** tingkat militer di browser sebelum dikirim ke backend, menjaga kredensial Anda tetap aman (*plaintext* tidak pernah dikirim dalam jaringan).
4. **Analisis Sentimen Berbasis AI (Gemini)**: Memanfaatkan kecerdasan **Gemini-3.5-Flash** untuk menganalisis sentimen media dan perincian data transaksi paus (whale transactions), serta merekomendasikan batas spread optimal secara otomatis.
5. **Modul Pengujian Historis (Backtesting)**: Sandbox komparatif untuk menguji strategi perdagangan bursa pada rekaman harga historis guna melacak imbal hasil bersih (*net profit multiplier*), *win rate*, dan beban gas fee.
6. **Integrasi Notifikasi Telegram**: Bot dapat mengirim peringatan langsung ke chat ID atau Channel Telegram kustom Anda secara real-time saat peluang arbitrase tereksekusi.

---

## 📂 Panduan Konfigurasi GitHub

Ikuti langkah-langkah di bawah ini untuk mengunggah proyek ini ke akun **GitHub** Anda:

### 1. Prasyarat
- Pastikan Anda sudah menginstal **Git** di komputer lokal Anda.
- Jika belum memiliki akun, silakan daftar di [GitHub](https://github.com).

### 2. Inisialisasi Git Lokal
Buka terminal/command prompt pada folder root proyek ini, lalu jalankan perintah:

```bash
# Inisialisasi repositori Git baru
git init

# Tambahkan semua file proyek ke staging area
git add .

# Buat commit pertama Anda
git commit -m "First Commit: Inisialisasi Binance-OKX Arbitrage Bot"
```

### 3. Sambungkan ke Repositori GitHub
1. Masuk ke GitHub, klik tombol **New Repository**.
2. Beri nama repositori Anda (misalnya: `binance-okx-arbitrage-bot`).
3. Biarkan opsi README dan `.gitignore` kosong (karena proyek ini sudah memilikinya).
4. Klik **Create Repository**.
5. Salin tautan repositori Anda (format HTTPS atau SSH), lalu jalankan perintah berikut di terminal:

```bash
# Ganti URL di bawah dengan URL repositori Anda sendiri
git remote add origin https://github.com/USERNAME-SAYA/NAMA-REPOSID-ANDA.git

# Setel nama branch utama menjadi 'main'
git branch -M main

# Dorong (push) kode Anda ke GitHub
git push -u origin main
```

---

## 🌐 Panduan Mengonlinekan (Deployment) Aplikasi

Karena proyek ini menggunakan arsitektur **Full-Stack (Vite/React Frontend + Express Backend)**, aplikasi harus dihosting di layanan yang mendukung Node.js. 

Berikut adalah opsi-opsi terbaik dan termudah:

### Opsi A: Menggunakan Railway.app (Sangat Direkomendasikan untuk Server Berkelanjutan)
1. Buat akun gratis atau login di [Railway](https://railway.app).
2. Klik **+ New Project** -> Pilih **Deploy from GitHub repo**.
3. Pilih repositori `binance-okx-arbitrage-bot` yang sudah Anda buat.
4. Railway otomatis membaca konfigurasi di file `railway.json` kita dan melakukan build dengan aman menggunakan `Dockerfile`.
5. **Konfigurasi Volume Persisten (Penting agar data bot tidak ter-reset)**:
   - Agar setelan konfigurasi parameter bot, pengaman kerugian (max daily loss), dan API kredensial Anda tetap tersimpan permanen saat kontainer Railway melakukan deploy ulang atau restart berkala, kita perlu memasang **Volume Disk**.
   - Buka tab **Volume** di panel layanan bot Anda di dashboard Railway -> Klik **+ Add Volume**.
   - Beri nama volume bebas (misal: `bot-data-volume`) dan tentukan Mount Path-nya ke: `/data`
   - Masuk ke tab **Variables** di Railway, lalu daftarkan variabel:
     - `PERSIST_DIR` = `/data` (Ini mengarahkan file `config_persist.json` dan `credentials_persist.json` tersimpan aman di dalam volume persisten di /data).
6. **Konfigurasi Variabel Lingkungan (Environment Variables)**:
   Pada tab **Variables**, tambahkan variabel berikut:
   - `GEMINI_API_KEY` = *Masukkan API Key Google Gemini Anda* (didapatkan dari Google AI Studio).
   - `NODE_ENV` = `production`
   - *Opsional (Failsafes)*: Anda juga bisa mendefinisikan `TELEGRAM_ENABLED`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`, `BINANCE_API_KEY`, `BINANCE_API_SECRET`, `OKX_API_KEY`, `OKX_API_SECRET`, dan `OKX_PASSPHRASE` langsung di sini sebagai nilai bawaan.
7. Pada bagian **Settings**, klik **Generate Domain** di kategori Networking untuk mendapatkan URL publik gratis Anda (misalnya: `https://xxx.up.railway.app`).

### Opsi B: Menggunakan Render.com (Gratis & Mudah)
1. Masuk ke [Render](https://render.com) dan buat akun.
2. Klik **New +** -> Pilih **Web Service**.
3. Hubungkan akun GitHub Anda dan pilih repositori proyek ini.
4. Konfigurasikan detail berikut:
   - **Language**: `Docker` *(Render otomatis mendeteksi file Dockerfile kita)*
   - **Instance Type**: `Free`
5. Masuk ke tab **Advanced** -> Klik **Add Environment Variable** dan isi:
   - `GEMINI_API_KEY` = *Instansi API Key Anda*
6. Klik **Deploy Web Service** dan tunggu proses build selesai (sekitar 2-4 menit). Render akan memberikan alamat website publik berupa `https://domain-anda.onrender.com`.

### Opsi C: Menggunakan Google Cloud Run
Aplikasi ini sudah dilengkapi dengan standard `Dockerfile` minimalis yang dapat dideploy dalam hitungan detik langsung ke Google Cloud Run:
```bash
gcloud run deploy arbitrage-bot --source . --port 3000 --set-env-vars=GEMINI_API_KEY=YOUR_API_KEY
```

---

## ⚡ Jalankan Secara Lokal (Development)

Jika Anda ingin menjalankan atau memodifikasi aplikasi ini di komputer lokal Anda:

1. Clone repositori ini:
   ```bash
   git clone https://github.com/USERNAME-SAYA/NAMA-REPOSID-ANDA.git
   cd NAMA-REPOSID-ANDA
   ```
2. Instal semua dependensi:
   ```bash
   npm install
   ```
3. Salin file lingkungan `.env.example` ke `.env` lokal Anda:
   ```bash
   cp .env.example .env
   ```
4. Tambahkan kunci API Gemini Anda di dalam file `.env`:
   ```env
   GEMINI_API_KEY=KUNCI_API_GEMINI_ANDA_DI_SINI
   ```
5. Jalankan server lokal:
   ```bash
   npm run dev
   ```
6. Buka browser Anda di `http://localhost:3000`.

---

## 🛠️ Ringkasan File Konfigurasi Tambahan
- `/.github/workflows/node-ci.yml`: Alur kerja otomatisasi pengujian kode setiap kali Anda mendorong perubahan ke GitHub (mencegah bug di production).
- `/Dockerfile`: Konfigurasi kontainer docker modular multi-stage yang membuat aplikasi instan berjalan di Cloud Run, Railway, fly.io, dll.
- `/.gitignore`: Menjaga file sensitif (seperti `.env` berisi API key rahasia Anda) serta folder `node_modules` agar tidak bocor ke repositori publik GitHub Anda.
