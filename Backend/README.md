# Talang.in Backend 🚀

Backend API untuk aplikasi Talang.in, sebuah platform manajemen patungan (bill splitting) yang membantu pengguna mengelola pengeluaran grup, utang-piutang, dan analisis kesehatan keuangan grup.

## 🛠 Tech Stack

- **Runtime:** Node.js
- **Framework:** Express.js (v5)
- **Database & Auth:** Supabase (PostgreSQL)
- **Environment Management:** Dotenv
- **CORS:** Cross-Origin Resource Sharing enabled

## 🚀 Prasyarat (Prerequisites)

Pastikan Anda sudah menginstal:
- [Node.js](https://nodejs.org/) (Rekomendasi versi LTS)
- Akun [Supabase](https://supabase.com/) untuk database dan autentikasi.

## 📦 Instalasi

1. **Clone Repository:**
   ```bash
   git clone <repository-url>
   cd Talang.in/Backend
   ```

2. **Instal Dependensi:**
   ```bash
   npm install
   ```

3. **Konfigurasi Environment:**
   Salin file `.env.example` menjadi `.env` dan isi dengan kredensial Supabase Anda.
   ```bash
   cp .env.example .env
   ```
   Isi variabel berikut:
   - `PORT`: Port server (default: 3000)
   - `SUPABASE_URL`: URL Proyek Supabase Anda.
   - `SUPABASE_KEY`: Kunci API `anon` Supabase Anda.

## 🏃 Menjalankan Project

- **Mode Pengembangan (dengan Nodemon):**
  ```bash
  npm run dev
  ```

- **Mode Produksi:**
  ```bash
  npm start
  ```

Server akan aktif di `http://localhost:3000` (atau port yang Anda tentukan).

## 📡 API Endpoints

Semua endpoint API dimulai dengan prefix `/api/v1`.

### 🔐 Autentikasi (`/api/v1/auth`)
- `POST /register` - Mendaftarkan user baru.
- `POST /login` - Login user dan mendapatkan access token.

### 👤 Profile (`/api/v1/profiles`)
- `GET /:profile_id` - Mendapatkan detail profil user (Membutuhkan Auth).

### 👥 Groups (`/api/v1/groups`)
- `GET /` - Mendapatkan daftar semua grup yang diikuti.
- `GET /:group_id` - Mendapatkan detail informasi grup.
- `POST /create` - Membuat grup baru.
- `POST /add-member` - Menambahkan member ke grup.
- `GET /:group_id/members` - Mendapatkan daftar member dalam grup.
- `DELETE /:group_id/members/:profile_id` - Mengeluarkan member dari grup.

### 🧾 Bills (`/api/v1/bills`)
- `POST /split` - Membuat tagihan baru dan membagi pengeluaran.
- `POST /split-nlp` - Membuat tagihan menggunakan input teks natural (NLP).
- `GET /detail/:bill_id` - Mendapatkan detail tagihan.
- `GET /:group_id/history` - Mendapatkan riwayat tagihan dalam suatu grup.
- `GET /:bill_id/splits` - Mendapatkan rincian pembagian tagihan.
- `PUT /:bill_id` - Memperbarui data tagihan.
- `DELETE /:bill_id` - Menghapus tagihan.

### 💸 Settlements (`/api/v1/settlements`)
- `GET /:group_id/recap` - Mendapatkan rekapitulasi utang-piutang grup.
- `GET /:group_id/simplify` - Mendapatkan saran penyederhanaan utang.
- `PUT /splits/:split_id/pay` - Menandai pembagian tagihan sebagai lunas.

### 📊 Analytics (`/api/v1/analytics`)
- `GET /:group_id/health` - Mendapatkan skor kesehatan keuangan grup.
- `GET /:group_id/conflicts` - Mendapatkan daftar potensi konflik keuangan.
- `GET /:group_id/conflict-status` - Mendapatkan ringkasan status konflik.
- `GET /:group_id/dashboard` - Mendapatkan data dashboard analitik grup.

## 📁 Struktur Folder
- `server.js` - Entry point aplikasi.
- `src/app.js` - Inisialisasi Express dan routing.
- `src/controllers/` - Logika bisnis untuk setiap fitur.
- `src/routes/` - Definisi endpoint API.
- `src/middlewares/` - Middleware (seperti autentikasi).
- `src/helpers/` - Fungsi pembantu (utility functions).
