# Talang.in
Mengelola Keuangan Grup dengan Lebih Sederhana, Cerdas, dan Transparan


---

## 📌 Deskripsi Sistem
**Talang.in** adalah web app pengelolaan keuangan grup yang dirancang khusus untuk kelompok kecil seperti mahasiswa, anak kos, teman kerja, hingga komunitas. Sistem ini hadir sebagai solusi mandiri (*standalone*) yang dapat digunakan oleh siapa saja tanpa mengharuskan penggunanya terikat pada satu platform pembayaran atau e-wallet yang sama. 

Fokus utama sistem ini adalah pencatatan, analisis, dan pemberian wawasan keuangan grup, bukan sebagai aplikasi untuk melakukan pembayaran langsung. Keunggulan utama dari Talang.in terletak pada kolaborasi kuat di balik layar antara pengembangan *Full-Stack*, kecerdasan buatan (AI), dan *Data Science*. Sistem ini tidak hanya mampu memahami input transaksi dari bahasa teks natural (seperti *"Geprek 75 ribu buat 3 orang, aku yang bayar"*), tetapi juga mampu memberikan metrik kesehatan keuangan grup, mendeteksi anomali, serta memberikan insight dan rekomendasi secara otomatis dalam bahasa manusia. Seluruh urusan transfer uang tetap dilakukan di luar aplikasi, namun histori catatan, kalkulasi utang, dan analisis pengeluaran tersimpan rapi dan divisualisasikan di dalam sistem.

---

## ⚙️ Fungsional Sistem (Functional Requirements)
Aplikasi Talang.in difokuskan pada penyediaan fitur-fitur esensial manajemen keuangan kolaboratif dan analitik cerdas, yang meliputi:

### 1. Manajemen Grup & Transaksi Dasar
* **Manajemen Keanggotaan:** Pembuatan grup dan pengelolaan anggota di dalam sistem.
* **Input Transaksi Cerdas (NLP):** Pencatatan transaksi menggunakan teks bahasa alami dengan bantuan model AI.
* **Input Transaksi Manual:** Pencatatan transaksi secara manual melalui form terstruktur.
* **Kalkulasi Split Bill Fleksibel:** Pembagian tagihan yang mendukung dua mode:
  * **Sama Rata (Equal Split):** Tagihan dibagi rata secara otomatis kepada seluruh anggota yang terlibat.
  * **Berbeda (Unequal/Custom Split):** Pembagian tagihan dengan nominal yang spesifik dan berbeda-beda untuk setiap orang dalam satu transaksi berdasarkan konsumsi riil masing-masing.

### 2. Penyelesaian & Perekaman
* **Sistem Rekapitulasi Utang:** Penyajian ringkasan total utang dan piutang antaranggota kelompok.
* **Simplify Debt (Penyederhanaan Utang):** Algoritma untuk meminimalkan kompleksitas pelunasan dan jumlah transfer antaranggota.
* **Histori Transaksi:** Perekaman jejak seluruh aktivitas finansial grup secara komprehensif.

### 3. Fitur Cerdas & Analitik Lanjutan (Powered by AI & Data Science)
* **Conflict Detection:** Sistem pendeteksi potensi selisih, input transaksi yang bertentangan, atau indikasi data duplikat antar anggota untuk mencegah konflik internal grup.
* **Group Financial Health Score:** Penilaian metrik kesehatan keuangan grup dalam bentuk skor (contoh: *Skor: 72/100 - Perlu Perhatian*), berdasarkan rasio pengeluaran, frekuensi iuran, dan kecepatan pelunasan utang.
* **Insight Otomatis (Natural Language):** Analisis data tren keuangan yang disajikan dalam bahasa manusia yang mudah dipahami, bukan sekadar deretan angka kaku (contoh: *"Bulan ini grup kalian terlalu banyak pengeluaran di kategori Makanan Cepat Saji"*).
* **Rekomendasi Cerdas:** Sistem memberikan saran solusi logis atau tindakan korektif berdasarkan data pengeluaran (contoh: rekomendasi pemotongan anggaran tertentu atau penyeimbangan likuiditas talangan anggota).
* **Dashboard Analytics:** Visualisasi data interaktif, grafik distribusi anggaran per kategori, dan tren pengeluaran grup dari waktu ke waktu.

---

## 🎨 Non-Fungsional Sistem (Non-Functional Requirements)

| Kategori | Spesifikasi Non-Fungsional |
| :--- | :--- |
| **Platform & Aksesibilitas** | Sistem berbasis web (*web-based app*) dan dirancang dengan antarmuka yang responsif (mobile-first layout), tidak memerlukan instalasi aplikasi mobile *native*. |
| **Arsitektur Integrasi** | Komunikasi antara layanan *frontend*, *backend* (database), dan model AI dilakukan menggunakan standar RESTful API yang terstruktur dan aman. |
| **Performa Model AI** | Evaluasi model *deep learning* untuk *Natural Language Processing* (NLP) ditargetkan memiliki tingkat akurasi minimal 85% dalam mengenali entitas transaksi. |

---

## 🚫 Batasan Sistem (System Limitations)
Sistem memiliki batasan ruang lingkup sebagai berikut:
1. Tidak memfasilitasi proses pembayaran atau transfer dana langsung di dalam aplikasi (bukan aplikasi *payment gateway*).
2. Tidak ada integrasi langsung dengan layanan *e-wallet* maupun rekening bank pihak ketiga.
3. Tidak mencakup pencatatan dengan standar sistem akuntansi ganda (*double-entry bookkeeping*) yang kompleks untuk korporasi.
4. Tidak menyediakan fitur sosial atau ruang obrolan (*chat*) internal antar anggota grup.
5. Hanya tersedia dalam versi antarmuka web yang responsif, tidak tersedia di Google Play Store maupun Apple App Store.

---

## 🛠️ Teknologi & Tech Stack

Sistem ini dikembangkan secara kolaboratif dengan membagi peran (*Full-Stack Web Developer, AI Engineer, Data Scientist*) ke dalam ekosistem teknologi berikut:

### Frontend (User Interface)
* **React / Vite:** Framework JavaScript utama dan *module bundler* untuk membangun antarmuka web interaktif yang cepat, ringan, dan responsif.
* **Tailwind CSS:** Framework CSS berbasis utilitas untuk penataan gaya UI yang modern, adopsi mobile-first, dan konsisten.

### Backend (Layanan API)
* **Node.js & Express.js:** Digunakan sebagai *backend framework* utama oleh Full-Stack Developer untuk membangun layanan RESTful API, menangani logika bisnis, *routing*, dan gerbang komunikasi dengan basis data.

### Database & Storage
* **PostgreSQL:** Sistem manajemen basis data relasional utama untuk penyimpanan data relasi grup dan transaksi yang kokoh.
* **Supabase:** Platform *Backend-as-a-Service* (BaaS) berbasis PostgreSQL yang digunakan untuk manajemen basis data, manajemen otentikasi pengguna, dan mempermudah interaksi *query* dari layanan *backend* Express.js.

### Kecerdasan Buatan (AI) & Data Science
* **Python:** Bahasa pemrograman utama tim AI dan Data Science untuk melatih model AI dan mengolah data analitik.
* **TensorFlow / PyTorch:** *Library* untuk merancang dan melatih model AI *Natural Language Processing* (NLP) untuk parsing teks dan sistem deteksi anomali.
* **Pandas:** Digunakan oleh *Data Scientist* untuk pembersihan (*cleaning*), agregasi, dan transformasi data transaksi grup.
* **Matplotlib / Seaborn / Plotly:** Pustaka visualisasi data untuk memproses grafik analitik dan tren dari data mentah sebelum disajikan ke frontend.
* **Streamlit:** Framework pembuat *dashboard* analitik interaktif khusus pemrosesan data (dapat digunakan sebagai modul analitik internal atau prototipe visualisasi model).

### Manajemen & Deployment
* **Version Control:** Git & GitHub sebagai pusat repositori dan kolaborasi kode lintas peran dalam tim.
* **Design & Prototyping:** Figma.
* **Deployment Frontend:** Vercel / Netlify.
* **Deployment Backend & AI Models:** Render / Railway / platform *cloud* sejenis yang mendukung eksekusi Node.js runtime dan *environment* Python.