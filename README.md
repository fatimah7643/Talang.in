# Talang.in 💸
> **Mengelola Keuangan Grup dengan Lebih Sederhana, Cerdas, dan Transparan**

---

## 📌 Deskripsi Sistem
**Talang.in** adalah web app pengelolaan keuangan grup yang dirancang khusus untuk kelompok kecil seperti mahasiswa, anak kos, teman kerja, hingga komunitas. Sistem ini hadir sebagai solusi mandiri (*standalone*) yang dapat digunakan oleh siapa saja tanpa mengharuskan penggunanya terikat pada satu platform pembayaran atau e-wallet yang sama.

Fokus utama sistem ini adalah pencatatan, analisis, dan pemberian wawasan keuangan grup, bukan sebagai aplikasi untuk melakukan pembayaran langsung. Keunggulan utama dari Talang.in terletak pada kolaborasi kuat di balik layar antara pengembangan *Full-Stack*, kecerdasan buatan (AI), dan *Data Science*. Sistem ini tidak hanya mampu memahami input transaksi dari bahasa teks natural (seperti *"Geprek 75 ribu buat 3 orang, aku yang bayar"*), tetapi juga mampu memberikan metrik kesehatan keuangan grup, mendeteksi anomali, serta memberikan insight dan rekomendasi secara otomatis dalam bahasa manusia. Seluruh urusan transfer uang tetap dilakukan di luar aplikasi, namun histori catatan, kalkulasi utang, dan analisis pengeluaran tersimpan rapi dan divisualisasikan di dalam sistem.

---

## ⚙️ Fungsional Sistem (Functional Requirements)

### 1. Manajemen Grup & Keanggotaan
* **Pembuatan Grup:** Pengguna dapat membuat grup patungan baru. Pembuat grup otomatis menjadi admin dan anggota pertama grup.
* **Manajemen Anggota:** Menambahkan anggota ke grup menggunakan `profile_id`, melihat daftar seluruh anggota grup, dan mengeluarkan anggota (kecuali admin).
* **Daftar Grup per User:** Pengguna dapat melihat seluruh grup yang sedang diikutinya beserta role keanggotaan (admin/member).
* **Detail & Daftar Grup:** Melihat informasi detail satu grup spesifik maupun seluruh daftar grup yang tersedia.

### 2. Pencatatan Transaksi & Split Bill
* **Input Transaksi Manual:** Pencatatan tagihan secara manual melalui form terstruktur dengan field `group_id`, `payer_id`, `amount`, `description`, `category`, dan rincian `splits`.
* **Input Transaksi Cerdas (NLP):** Pencatatan transaksi menggunakan teks bahasa alami. Backend menerima `raw_text` dan meneruskannya ke model AI untuk diekstrak nilainya secara otomatis. *(Integrasi model AI oleh tim AI Engineer)*
* **Kalkulasi Split Bill Fleksibel:**
  * **Sama Rata (Equal Split):** Tagihan dibagi rata ke seluruh anggota yang terlibat.
  * **Berbeda (Unequal/Custom Split):** Pembagian tagihan dengan nominal spesifik berbeda-beda per anggota berdasarkan konsumsi riil.
* **Validasi Total Split:** Sistem memvalidasi bahwa total `share_amount` seluruh split harus sama dengan `amount` tagihan utama (toleransi Rp1 untuk floating point).
* **Detail & Riwayat Transaksi:** Melihat detail satu tagihan spesifik, rincian pembagian per tagihan, dan riwayat seluruh transaksi grup secara kronologis.
* **Edit & Hapus Tagihan:** Memperbarui nominal, deskripsi, atau kategori tagihan yang salah input, serta menghapus tagihan beserta seluruh data split-nya.

### 3. Penyelesaian Utang (Settlement)
* **Sistem Rekapitulasi Utang:** Penyajian ringkasan posisi utang dan piutang berjalan antaranggota beserta detail transaksi penyebabnya, dikalkulasi secara dinamis di level server.
* **Simplify Debt (Penyederhanaan Utang):** Algoritma berbasis *net balance greedy* untuk meminimalkan jumlah transfer antaranggota. Sistem menghitung saldo bersih tiap anggota, lalu memasangkan debitur terbesar dengan kreditur terbesar secara efisien.
* **Pencatatan Pelunasan Fleksibel (Multi-Mode Payment):**
  * **Bayar Sebagian / Cicilan (`payment_type: "partial"`):** Pengguna menginput nominal cicilan. Sistem mengakumulasi `amount_paid` secara otomatis. Jika akumulasi cicilan mencapai `share_amount`, status otomatis berubah menjadi lunas.
  * **Bayar Lunas (`payment_type: "full"`):** Sistem langsung memaksa `amount_paid` menyamai `share_amount` dan mengubah `is_paid = true` secara instan.
* **Kalkulasi Sisa Utang Dinamis:** Sisa utang (`share_amount - amount_paid`) dihitung secara real-time di level server, tidak disimpan permanen di database untuk menjaga integritas data historis.

### 4. Fitur Cerdas & Analitik Lanjutan (Powered by AI & Data Science)
* **Conflict Detection:** Sistem mendeteksi potensi tagihan duplikat dalam 24 jam terakhir berdasarkan kesamaan nominal dan kategori dari `activity_logs`. Menghasilkan peringatan dengan detail `log_id` dan timestamp konflik.
* **Conflict Status:** Ringkasan cepat level konflik grup berdasarkan jumlah tagihan yang belum lunas (`Low`, `Medium`, `High`).
* **Group Financial Health Score:** Penilaian skor kesehatan keuangan grup (0–100) berdasarkan rasio total utang yang belum terbayar terhadap total tagihan, disertai label (`Sehat`, `Perlu Perhatian`, `Kritis`) dan narasi otomatis dalam bahasa Indonesia.
* **Insight Otomatis (Natural Language):** Analisis data tren keuangan yang disajikan dalam bahasa manusia yang mudah dipahami (contoh: *"Masih ada 3 tagihan belum lunas. Yuk segera selesaikan agar tidak menumpuk!"*).
* **Dashboard Analytics:** Agregasi data pengeluaran grup meliputi total tagihan, total nominal, distribusi per kategori beserta persentase, dan tren pengeluaran bulanan (`monthly_trend`) sebagai penyuplai data ke komponen grafik frontend.
* **Activity Logs (Sensor AI):** Setiap operasi pencatatan tagihan otomatis direkam ke tabel `activity_logs` sebagai sumber data mentah untuk modul Conflict Detection dan analitik lanjutan tim AI/Data Science.

---

## 🎨 Non-Fungsional Sistem (Non-Functional Requirements)

| Kategori | Spesifikasi Non-Fungsional |
| :--- | :--- |
| **Platform & Aksesibilitas** | Sistem berbasis web (*web-based app*) dan dirancang dengan antarmuka yang responsif (*mobile-first layout*), tidak memerlukan instalasi aplikasi mobile *native*. |
| **Arsitektur Integrasi** | Komunikasi antara layanan *frontend*, *backend* (database), dan model AI dilakukan menggunakan standar RESTful API (`GET`, `POST`, `PUT`, `DELETE`) yang terstruktur dan aman. |
| **Autentikasi & Keamanan** | Sistem menggunakan JWT Bearer Token via Supabase Auth untuk mengamankan seluruh endpoint. Token diverifikasi di setiap request melalui middleware autentikasi terpusat. |
| **Performa Model AI** | Evaluasi model *deep learning* untuk *Natural Language Processing* (NLP) ditargetkan memiliki tingkat akurasi minimal 85% dalam mengenali entitas transaksi. |
| **Keamanan Database** | Skema database PostgreSQL diatur pada mode *Unrestricted* selama fase pengujian lokal untuk mempermudah integrasi *automated testing* pada Postman. |

---

## 🚫 Batasan Sistem (System Limitations)
1. Tidak memfasilitasi proses pembayaran atau transfer dana langsung di dalam aplikasi (bukan aplikasi *payment gateway*).
2. Tidak ada integrasi langsung dengan layanan *e-wallet* maupun rekening bank pihak ketiga.
3. Tidak mencakup pencatatan dengan standar sistem akuntansi ganda (*double-entry bookkeeping*) yang kompleks untuk korporasi.
4. Tidak menyediakan fitur sosial atau ruang obrolan (*chat*) internal antar anggota grup.
5. Hanya tersedia dalam versi antarmuka web yang responsif, tidak tersedia di Google Play Store maupun Apple App Store.

---

## 🛠️ Teknologi & Tech Stack

### Frontend (User Interface)
* **React / Vite:** Framework JavaScript utama dan *module bundler* untuk membangun antarmuka web interaktif yang cepat, ringan, dan responsif.
* **Tailwind CSS:** Framework CSS berbasis utilitas untuk penataan gaya UI yang modern, adopsi *mobile-first*, dan konsisten.

### Backend (Layanan API)
* **Node.js & Express.js:** *Backend framework* utama untuk membangun layanan RESTful API, menangani logika bisnis, *routing*, middleware autentikasi JWT, dan gerbang komunikasi dengan basis data.

### Database & Storage
* **PostgreSQL:** Sistem manajemen basis data relasional utama untuk penyimpanan data relasi grup dan transaksi yang kokoh.
* **Supabase:** Platform *Backend-as-a-Service* (BaaS) berbasis PostgreSQL yang digunakan untuk manajemen basis data, manajemen otentikasi pengguna (JWT), dan mempermudah interaksi *query* dari layanan *backend* Express.js.

### Kecerdasan Buatan (AI) & Data Science
* **Python:** Bahasa pemrograman utama tim AI dan Data Science untuk melatih model AI dan mengolah data analitik.
* **TensorFlow / PyTorch:** *Library* untuk merancang dan melatih model AI *Natural Language Processing* (NLP) untuk parsing teks dan sistem deteksi anomali.
* **Pandas:** Digunakan oleh *Data Scientist* untuk pembersihan (*cleaning*), agregasi, dan transformasi data transaksi grup.
* **Matplotlib / Seaborn / Plotly:** Pustaka visualisasi data untuk memproses grafik analitik dan tren dari data mentah sebelum disajikan ke frontend.
* **Streamlit:** Framework pembuat *dashboard* analitik interaktif khusus pemrosesan data (digunakan sebagai modul analitik internal dan dokumentasi proses Data Science).

### Manajemen & Deployment
* **Version Control:** Git & GitHub sebagai pusat repositori dan kolaborasi kode lintas peran dalam tim.
* **Design & Prototyping:** Figma.
* **Deployment Frontend:** Vercel / Netlify.
* **Deployment Backend:** Railway (auto-deploy dari GitHub).
* **Deployment AI Models:** Platform *cloud* yang mendukung *environment* Python.