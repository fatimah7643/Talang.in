import { Link } from 'react-router-dom'
import { ArrowLeft, Shield, Eye, Database, Lock, UserCheck, Mail } from 'lucide-react'

const P = {
  navy:     '#121358',
  primary:  '#232F72',
  teal:     '#36ADA3',
  muted:    '#6b7280',
  border:   '#e5e7eb',
  surface:  '#f8f9fa',
}

const sections = [
  {
    icon: Database,
    title: '1. Data yang Kami Kumpulkan',
    content: `Talang.in mengumpulkan informasi berikut untuk menjalankan layanan:

Data yang kamu berikan langsung:
• Nama lengkap, alamat email, dan kata sandi saat registrasi
• Data transaksi dan pengeluaran yang kamu masukkan
• Informasi grup dan anggota yang kamu tambahkan

Data yang dikumpulkan otomatis:
• Log aktivitas penggunaan aplikasi
• Informasi perangkat dan browser (untuk keperluan debugging)
• Waktu dan frekuensi akses layanan`,
  },
  {
    icon: Eye,
    title: '2. Cara Kami Menggunakan Data',
    content: `Data yang dikumpulkan digunakan semata-mata untuk:

• Menjalankan dan meningkatkan layanan Talang.in
• Memproses dan menampilkan data transaksi grup kamu
• Mengirimkan notifikasi yang relevan dengan aktivitasmu
• Menganalisis pola penggunaan untuk pengembangan fitur baru
• Mendeteksi dan mencegah aktivitas yang mencurigakan

Kami tidak menjual data pribadimu kepada pihak ketiga manapun.`,
  },
  {
    icon: Lock,
    title: '3. Keamanan Data',
    content: `Kami menerapkan langkah-langkah keamanan teknis dan organisasional untuk melindungi datamu:

• Kata sandi disimpan dalam bentuk terenkripsi (hashed)
• Komunikasi data menggunakan protokol HTTPS
• Akses database dibatasi hanya untuk tim yang berwenang
• Audit keamanan dilakukan secara berkala

Meski demikian, tidak ada sistem yang 100% aman. Kami mendorongmu untuk menggunakan kata sandi yang kuat dan tidak membagikannya kepada siapapun.`,
  },
  {
    icon: UserCheck,
    title: '4. Hak-Hak Kamu',
    content: `Sebagai pengguna Talang.in, kamu memiliki hak untuk:

• Mengakses data pribadimu yang tersimpan di sistem kami
• Memperbarui atau mengoreksi data yang tidak akurat
• Menghapus akunmu beserta seluruh data terkait
• Mengekspor data transaksimu dalam format yang dapat dibaca
• Menolak penggunaan datamu untuk keperluan analitik

Untuk menggunakan hak-hak ini, hubungi kami melalui email di bawah.`,
  },
  {
    icon: Shield,
    title: '5. Berbagi Data dengan Pihak Ketiga',
    content: `Talang.in tidak menjual, menyewakan, atau menukar data pribadimu. Data hanya dibagikan dalam kondisi berikut:

• Dengan anggota grup yang sama (sesuai fitur aplikasi)
• Kepada penyedia layanan teknis yang membantu operasional kami (hosting, dsb) dengan perjanjian kerahasiaan
• Jika diwajibkan oleh hukum atau perintah pengadilan yang sah

Semua mitra pihak ketiga diwajibkan menjaga kerahasiaan datamu.`,
  },
  {
    icon: Mail,
    title: '6. Cookie & Pembaruan Kebijakan',
    content: `Cookie & Penyimpanan Lokal:
Kami menggunakan localStorage untuk menyimpan token autentikasi agar kamu tetap login. Tidak ada cookie iklan atau pelacakan pihak ketiga.

Pembaruan Kebijakan:
Kebijakan ini dapat diperbarui sewaktu-waktu. Perubahan material akan diberitahukan melalui email atau notifikasi aplikasi minimal 7 hari sebelum berlaku.

Pertanyaan & Kontak:
helo@talang.in · Tim CC26-PSU151 · DBS Foundation Coding Camp 2026`,
  },
]

export default function KebijakanPrivasi() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: P.surface }}>
      {/* Header */}
      <div style={{ background: `linear-gradient(135deg, ${P.navy}, ${P.primary})` }}>
        <div className="max-w-3xl mx-auto px-6 py-8">
          <Link to="/"
            className="inline-flex items-center gap-2 text-sm font-medium mb-6 transition-opacity hover:opacity-70"
            style={{ color: 'rgba(255,255,255,0.7)' }}>
            <ArrowLeft size={15} /> Kembali ke Beranda
          </Link>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{ backgroundColor: 'rgba(54,173,163,0.2)' }}>
              <Shield size={22} style={{ color: P.teal }} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white"
                style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                Kebijakan Privasi
              </h1>
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>
                Terakhir diperbarui: Juni 2026 · Talang.in CC26-PSU151
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-6 py-10">
        {/* Intro */}
        <div className="rounded-2xl border p-5 mb-8"
          style={{ backgroundColor: `${P.teal}10`, borderColor: `${P.teal}30` }}>
          <p className="text-sm leading-relaxed" style={{ color: P.navy }}>
            Privasi kamu adalah prioritas kami. Dokumen ini menjelaskan bagaimana <strong>Talang.in</strong> mengumpulkan,
            menggunakan, dan melindungi informasi pribadimu saat menggunakan layanan kami.
          </p>
        </div>

        {/* Sections */}
        <div className="space-y-4">
          {sections.map(({ icon: Icon, title, content }) => (
            <div key={title} className="bg-white rounded-2xl border p-6" style={{ borderColor: P.border }}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${P.teal}15` }}>
                  <Icon size={15} style={{ color: P.teal }} />
                </div>
                <h2 className="text-sm font-bold" style={{ color: P.navy, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                  {title}
                </h2>
              </div>
              <div className="text-sm leading-relaxed whitespace-pre-line" style={{ color: P.muted }}>
                {content}
              </div>
            </div>
          ))}
        </div>

        {/* Footer nav */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t" style={{ borderColor: P.border }}>
          <p className="text-xs" style={{ color: P.muted }}>© 2026 Talang.in · CC26-PSU151 · DBS Foundation</p>
          <div className="flex gap-4">
            <Link to="/syarat-ketentuan" className="text-xs hover:opacity-70 transition" style={{ color: P.teal }}>
              ← Syarat & Ketentuan
            </Link>
            <Link to="/" className="text-xs hover:opacity-70 transition" style={{ color: P.muted }}>Beranda</Link>
          </div>
        </div>
      </div>
    </div>
  )
}