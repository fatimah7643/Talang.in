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

## 🌐 Base URL Production

```
https://talangin-production.up.railway.app
```

## 📡 API Endpoints

Semua endpoint API dimulai dengan prefix `/api/v1`.
Endpoint yang membutuhkan autentikasi wajib menyertakan header:
```
Authorization: Bearer <access_token>
```

### 🔐 Autentikasi (`/api/v1/auth`)

| Method | Endpoint | Deskripsi | Auth |
|--------|----------|-----------|------|
| POST | `/register` | Mendaftarkan user baru | ❌ |
| POST | `/login` | Login user dan mendapatkan access token | ❌ |

**Body Register:**
```json
{
  "email": "user@gmail.com",
  "password": "password123",
  "username": "username",
  "full_name": "Nama Lengkap"
}
```

**Body Login:**
```json
{
  "email": "user@gmail.com",
  "password": "password123"
}
```

---

### 👤 Profile (`/api/v1/profiles`)

| Method | Endpoint | Deskripsi | Auth |
|--------|----------|-----------|------|
| GET | `/:profile_id` | Mendapatkan detail profil user | ✅ |

---

### 👥 Groups (`/api/v1/groups`)

| Method | Endpoint | Deskripsi | Auth |
|--------|----------|-----------|------|
| GET | `/` | Mendapatkan daftar semua grup | ✅ |
| GET | `/user/:user_id` | Mendapatkan daftar grup yang diikuti user | ✅ |
| GET | `/:group_id` | Mendapatkan detail informasi grup | ✅ |
| POST | `/create` | Membuat grup baru | ✅ |
| POST | `/add-member` | Menambahkan member ke grup | ✅ |
| GET | `/:group_id/members` | Mendapatkan daftar member dalam grup | ✅ |
| DELETE | `/:group_id/members/:profile_id` | Mengeluarkan member dari grup | ✅ |

**Body Create Group:**
```json
{
  "group_name": "Nama Grup",
  "user_id": "uuid-user"
}
```

**Body Add Member:**
```json
{
  "group_id": "uuid-grup",
  "profile_id": "uuid-user"
}
```

---

### 🧾 Bills (`/api/v1/bills`)

| Method | Endpoint | Deskripsi | Auth |
|--------|----------|-----------|------|
| POST | `/split` | Membuat tagihan baru dan membagi pengeluaran | ✅ |
| POST | `/split-nlp` | Membuat tagihan menggunakan input teks natural (NLP) | ✅ |
| GET | `/detail/:bill_id` | Mendapatkan detail tagihan | ✅ |
| GET | `/:group_id/history` | Mendapatkan riwayat tagihan dalam suatu grup | ✅ |
| GET | `/:bill_id/splits` | Mendapatkan rincian pembagian tagihan | ✅ |
| PUT | `/:bill_id` | Memperbarui data tagihan | ✅ |
| DELETE | `/:bill_id` | Menghapus tagihan | ✅ |

**Body Split Bill Manual:**
```json
{
  "group_id": "uuid-grup",
  "payer_id": "uuid-user",
  "amount": 150000,
  "description": "Makan Bakso",
  "category": "Makanan",
  "splits": [
    { "member_id": "uuid-user-1", "share_amount": 75000 },
    { "member_id": "uuid-user-2", "share_amount": 75000 }
  ]
}
```

---

### 💸 Settlements (`/api/v1/settlements`)

| Method | Endpoint | Deskripsi | Auth |
|--------|----------|-----------|------|
| GET | `/:group_id/recap` | Mendapatkan rekapitulasi utang-piutang grup | ✅ |
| GET | `/:group_id/simplify` | Mendapatkan saran penyederhanaan utang | ✅ |
| PUT | `/splits/:split_id/pay` | Menandai pembayaran (partial/full) | ✅ |

**Body Pay (Partial):**
```json
{
  "payment_type": "partial",
  "amount": 25000
}
```

**Body Pay (Full):**
```json
{
  "payment_type": "full"
}
```

---

### 📊 Analytics (`/api/v1/analytics`)

| Method | Endpoint | Deskripsi | Auth |
|--------|----------|-----------|------|
| GET | `/:group_id/health` | Mendapatkan skor kesehatan keuangan grup | ✅ |
| GET | `/:group_id/conflicts` | Mendapatkan daftar potensi konflik keuangan | ✅ |
| GET | `/:group_id/conflict-status` | Mendapatkan ringkasan status konflik | ✅ |
| GET | `/:group_id/dashboard` | Mendapatkan data dashboard analitik grup | ✅ |

---

## 📁 Struktur Folder

```
Backend/
├── src/
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── profileController.js
│   │   ├── groupController.js
│   │   ├── billController.js
│   │   ├── settlementController.js
│   │   └── analyticsController.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── profileRoutes.js
│   │   ├── groupRoutes.js
│   │   ├── billRoutes.js
│   │   ├── settlementRoutes.js
│   │   └── analyticsRoutes.js
│   ├── middlewares/
│   │   └── authMiddleware.js
│   └── app.js
├── .env
├── .env.example
├── package.json
└── server.js
```

## 🗄️ Skema Database (Supabase)

| Tabel | Deskripsi |
|-------|-----------|
| `profiles` | Data profil pengguna |
| `groups` | Data grup patungan |
| `group_members` | Relasi anggota dan grup |
| `group_analytics` | Data analitik per grup |
| `bills` | Data tagihan/transaksi |
| `bill_splits` | Rincian pembagian tagihan per anggota |
| `activity_logs` | Log aktivitas grup (sensor AI) |
| `simplified_debts` | Hasil algoritma penyederhanaan utang |

## 🔒 Standar Respons API

| Status Code | Keterangan |
|-------------|------------|
| `200 OK` | Request berhasil |
| `201 Created` | Data berhasil dibuat |
| `400 Bad Request` | Input tidak valid atau tidak lengkap |
| `401 Unauthorized` | Token tidak valid atau tidak disertakan |
| `404 Not Found` | Resource tidak ditemukan |
| `500 Internal Server Error` | Kesalahan pada server |