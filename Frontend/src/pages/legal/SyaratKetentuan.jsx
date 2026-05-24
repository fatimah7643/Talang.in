import { Link } from 'react-router-dom'
import { ArrowLeft, FileText, Shield, Users, AlertCircle, Scale, Mail } from 'lucide-react'

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
    icon: FileText,
    title: '1. Penerimaan Syarat',
    content: `Dengan mengakses atau menggunakan layanan Talang.in, kamu menyetujui untuk terikat oleh Syarat & Ketentuan ini. Jika kamu tidak menyetujui salah satu bagian dari ketentuan ini, kamu tidak diizinkan untuk menggunakan layanan kami.

Talang.in adalah platform manajemen keuangan bersama yang dirancang untuk membantu kelompok mencatat, membagi, dan memahami pengeluaran patungan secara transparan.`,
  },
  {
    icon: Users,
    title: '2. Akun Pengguna',
    content: `Untuk menggunakan fitur lengkap Talang.in, kamu wajib membuat akun dengan informasi yang akurat dan terkini. Kamu bertanggung jawab penuh atas:

• Kerahasiaan kata sandi akunmu
• Semua aktivitas yang terjadi di bawah akunmu
• Memberitahu kami segera jika ada akses tidak sah

Talang.in berhak menangguhkan atau menghapus akun yang melanggar ketentuan ini.`,
  },
  {
    icon: Scale,
    title: '3. Penggunaan Layanan',
    content: `Kamu setuju untuk menggunakan Talang.in hanya untuk tujuan yang sah dan sesuai dengan ketentuan ini. Dilarang keras untuk:

• Menggunakan layanan untuk aktivitas ilegal atau penipuan
• Mencoba mengakses sistem atau data pengguna lain tanpa izin
• Menyebarkan konten yang melanggar hak cipta atau bersifat menyesatkan
• Melakukan tindakan yang dapat mengganggu kinerja layanan

Pelanggaran terhadap ketentuan ini dapat berakibat pada penghentian akses permanen.`,
  },
  {
    icon: Shield,
    title: '4. Transaksi & Data Keuangan',
    content: `Talang.in memfasilitasi pencatatan dan pembagian pengeluaran bersama. Perlu dipahami bahwa:

• Talang.in bukan lembaga keuangan dan tidak memproses pembayaran nyata
• Semua data transaksi yang kamu masukkan adalah tanggung jawabmu
• Kami tidak bertanggung jawab atas perselisihan finansial antar anggota grup
• Pastikan data yang dimasukkan akurat untuk menghindari kesalahpahaman`,
  },
  {
    icon: AlertCircle,
    title: '5. Batasan Tanggung Jawab',
    content: `Talang.in disediakan "sebagaimana adanya" tanpa jaminan apapun. Kami tidak bertanggung jawab atas:

• Kehilangan data akibat gangguan teknis di luar kendali kami
• Kerugian finansial yang timbul dari penggunaan layanan ini
• Ketidakakuratan perhitungan yang disebabkan oleh data yang salah dimasukkan

Kami berusaha menjaga layanan tetap tersedia 24/7, namun tidak menjamin tidak ada gangguan.`,
  },
  {
    icon: Mail,
    title: '6. Perubahan & Kontak',
    content: `Kami berhak memperbarui Syarat & Ketentuan ini sewaktu-waktu. Perubahan signifikan akan diberitahukan melalui email atau notifikasi dalam aplikasi. Penggunaan berkelanjutan setelah perubahan dianggap sebagai penerimaan.

Jika ada pertanyaan mengenai Syarat & Ketentuan ini, hubungi kami di:
helo@talang.in · Tim CC26-PSU151`,
  },
]

export default function SyaratKetentuan() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: P.surface }}>
      {/* Header */}
      <div style={{ backgroundColor: P.primary }}>
        <div className="max-w-3xl mx-auto px-6 py-8">
          <Link to="/"
            className="inline-flex items-center gap-2 text-sm font-medium mb-6 transition-opacity hover:opacity-70"
            style={{ color: 'rgba(255,255,255,0.7)' }}>
            <ArrowLeft size={15} /> Kembali ke Beranda
          </Link>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}>
              <Scale size={22} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white"
                style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                Syarat & Ketentuan
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
            Selamat datang di <strong>Talang.in</strong> — platform patungan cerdas untuk tim, kos, dan teman perjalanan.
            Harap baca syarat dan ketentuan ini dengan seksama sebelum menggunakan layanan kami.
          </p>
        </div>

        {/* Sections */}
        <div className="space-y-4">
          {sections.map(({ icon: Icon, title, content }) => (
            <div key={title} className="bg-white rounded-2xl border p-6" style={{ borderColor: P.border }}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${P.primary}12` }}>
                  <Icon size={15} style={{ color: P.primary }} />
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
            <Link to="/" className="text-xs hover:opacity-70 transition" style={{ color: P.muted }}>Beranda</Link>
            <Link to="/kebijakan-privasi" className="text-xs hover:opacity-70 transition" style={{ color: P.teal }}>
              Kebijakan Privasi →
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}