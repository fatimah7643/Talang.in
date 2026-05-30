import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Mail, Lock, Eye, EyeOff, User, Rocket, CheckCircle } from 'lucide-react'
import api from '../../services/api'


const Register = () => {
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (form.password !== form.confirmPassword) {
      setError('Password dan konfirmasi password tidak cocok.')
      return
    }
    setLoading(true)
    setError('')
    try {
      await api.post('/auth/register', {
        full_name: form.name,
        username: form.name.toLowerCase().replace(/\s+/g, '_'),
        email: form.email,
        password: form.password,
      })
      navigate('/login')
    } catch (err) {
      setError(err.response?.data?.message || 'Registrasi gagal. Coba lagi.')
    } finally {
      setLoading(false)
    }
  }

  // login with Google
  const handleGoogleRegister = () => {
      setError('')
      // Langsung lempar browser ke backend Node.js Anda
      window.location.href = `${import.meta.env.VITE_API_URL}/api/v1/auth/google`
    }

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: '#f0f2ff' }}>

      {/* Kiri — Form Register */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-8 py-12 lg:px-16" style={{ backgroundColor: '#f0f2ff' }}>
        <div className="w-full max-w-sm bg-white rounded-3xl p-10" style={{ boxShadow: '0 4px 32px rgba(35,47,114,0.10)', border: '1px solid #e8eaf6' }}>

          {/* Logo */}
          <div className="mb-8">
            <Link to="/" className="flex items-center gap-2 w-fit">
              <img src="/logo.svg" alt="Talang.in" className="w-8 h-8 object-contain" />
              <span className="font-bold text-lg" style={{ color: '#121358' }}>Talang.in</span>
            </Link>
          </div>

          <h2 className="text-3xl font-bold text-gray-900 mb-2">Buat Akun Baru</h2>
          <p className="text-gray-500 mb-8">
            Mulai kelola keuangan grup kamu dengan lebih rapi dan transparan.
          </p>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Nama */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Masukkan nama lengkap"
                  required
                  className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 bg-white"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="Masukkan email"
                  required
                  className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 bg-white"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Minimal 8 karakter"
                  required
                  minLength={8}
                  className="w-full pl-11 pr-12 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 bg-white"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Konfirmasi Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Konfirmasi Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type={showConfirm ? 'text' : 'password'}
                  name="confirmPassword"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  placeholder="Ulangi password"
                  required
                  className="w-full pl-11 pr-12 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 bg-white"
                />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl text-white font-semibold text-sm transition-opacity disabled:opacity-70 hover:opacity-90 mt-2"
              style={{ backgroundColor: '#232F72' }}
            >
              {loading ? 'Memproses...' : 'Buat Akun'}
            </button>

          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-4">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-gray-400 text-sm">atau</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {/* Google Register Button */}
          <button
            type="button"
            onClick={handleGoogleRegister}
            className="w-full py-3 rounded-xl border border-gray-200 bg-white text-gray-700 font-medium text-sm flex items-center justify-center gap-3 hover:bg-gray-50 transition-all shadow-sm"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
              <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
              <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
              <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
              <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
            </svg>
            <span>Daftar dengan Google</span>
          </button>

          <p className="text-center text-sm text-gray-500 mt-6">
            Sudah punya akun?{' '}
            <Link to="/login" className="font-semibold" style={{ color: '#232F72' }}>
              Masuk sekarang
            </Link>
          </p>

        </div>
      </div>

      {/* Kanan — Preview */}
      <div className="hidden lg:flex w-1/2 items-center justify-center p-12 relative overflow-hidden"
        style={{ background: 'linear-gradient(160deg, #0d1340 0%, #1a2260 50%, #232F72 100%)' }}>

        {/* Dot pattern */}
        <div className="absolute inset-0 pointer-events-none" style={{ opacity: 0.12 }}>
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="dots2" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
                <circle cx="2" cy="2" r="1.5" fill="white" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#dots2)" />
          </svg>
        </div>

        {/* Glow */}
        <div className="absolute top-16 right-16 w-56 h-56 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(54,173,163,0.2) 0%, transparent 70%)' }} />

        <div className="relative w-full max-w-sm space-y-5">

          {/* Icon + Heading */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-5"
              style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}>
              <Rocket size={30} style={{ color: '#36ADA3' }} strokeWidth={1.5} />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2"
              style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
              Mulai dalam hitungan menit
            </h3>
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.55)' }}>
              Daftar gratis dan langsung kelola patungan grup bersama teman, keluarga, atau rekan kerja.
            </p>
          </div>

          {/* Steps */}
          {[
            { num: 1, title: 'Isi data diri', desc: 'Nama, email, dan password kamu' },
            { num: 2, title: 'Set password', desc: 'Min. 8 karakter, aman dan mudah diingat' },
            { num: 3, title: 'Mulai patungan', desc: 'Buat grup dan ajak teman-temanmu' },
          ].map((s) => (
            <div key={s.num} className="flex items-center gap-4 p-4 rounded-xl"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                style={{ backgroundColor: '#36ADA3', color: 'white' }}>
                {s.num}
              </div>
              <div>
                <p className="text-sm font-semibold text-white">{s.title}</p>
                <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.5)' }}>{s.desc}</p>
              </div>
            </div>
          ))}

          {/* Badge */}
          <div className="rounded-xl p-4" style={{ background: 'rgba(54,173,163,0.12)', border: '1px solid rgba(54,173,163,0.25)' }}>
            <p className="text-xs font-bold mb-2" style={{ color: '#36ADA3', letterSpacing: '0.05em' }}>GRATIS SELAMANYA</p>
            {['Unlimited grup & anggota', 'Split bill otomatis', 'Insight & analytics'].map(f => (
              <div key={f} className="flex items-center gap-2 mt-1.5">
                <CheckCircle size={12} style={{ color: '#36ADA3' }} />
                <span className="text-xs" style={{ color: 'rgba(255,255,255,0.7)' }}>{f}</span>
              </div>
            ))}
          </div>

        </div>
      </div>

    </div>
  )
}

export default Register