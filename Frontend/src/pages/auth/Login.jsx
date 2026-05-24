import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import api from '../../services/api'
import { Mail, Lock, Eye, EyeOff, TrendingUp, CheckCircle } from 'lucide-react'

const Login = () => {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await api.post('/auth/login', form)
      login(res.data.user, res.data.access_token)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.message || 'Login gagal. Periksa email dan password kamu.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: '#f0f4f8' }}>

      {/* Kiri — Form Login */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-lg p-10">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 w-fit mb-8">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: '#232F72' }}>
              <span className="text-white text-xs font-bold">T</span>
            </div>
            <span className="font-bold text-lg" style={{ color: '#232F72' }}>Talang.in</span>
          </Link>

          <p className="text-gray-500 text-sm mb-1">Selamat datang kembali</p>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Masuk ke Talang.in</h2>
          <p className="text-gray-400 text-sm mb-8">
            Kelola patungan grupmu dengan lebih rapi, transparan, dan mudah dipantau.
          </p>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">

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
                  style={{ '--tw-ring-color': '#232F72' }}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-sm font-medium text-gray-700">Password</label>
                <Link to="/forgot-password" className="text-xs font-medium" style={{ color: '#232F72' }}>
                  Lupa password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Masukkan password"
                  required
                  className="w-full pl-11 pr-12 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 bg-white"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl text-white font-semibold text-sm transition-opacity disabled:opacity-70 hover:opacity-90"
              style={{ backgroundColor: '#232F72' }}
            >
              {loading ? 'Memproses...' : 'Masuk'}
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-gray-400 text-sm">atau</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            {/* Google — coming soon */}
            <div className="relative group">
              <button
                type="button"
                disabled
                className="w-full py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-400 font-medium text-sm flex items-center justify-center gap-3 cursor-not-allowed select-none transition-all"
              >
                <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg" className="opacity-40 shrink-0">
                  <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
                  <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
                  <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
                  <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
                </svg>
                <span>Masuk dengan Google</span>
                <span className="ml-auto text-xs font-normal bg-white border border-gray-200 text-gray-400 px-2 py-0.5 rounded-full">
                  Segera hadir
                </span>
              </button>
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-gray-800 text-white text-xs rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                Fitur ini akan segera tersedia
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-800" />
              </div>
            </div>

          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Belum punya akun?{' '}
            <Link to="/register" className="font-semibold" style={{ color: '#232F72' }}>
              Daftar sekarang
            </Link>
          </p>

        </div>
      </div>

      {/* Kanan — Preview Cards */}
      <div className="hidden lg:flex w-1/2 flex-col justify-between p-12 relative overflow-hidden"
        style={{ backgroundColor: '#f0f4f8' }}>

        {/* Notification top right */}
        <div className="absolute top-8 right-8 flex items-center gap-2 px-4 py-3 rounded-xl shadow-md text-sm font-medium"
          style={{ backgroundColor: '#36ADA3', color: 'white', maxWidth: '220px' }}>
          <TrendingUp className="w-4 h-4 flex-shrink-0" />
          <span>Pembayaran grup mulai lebih seimbang minggu ini.</span>
        </div>

        <div className="flex-1 flex flex-col justify-center gap-5 mt-16">

          {/* Card Total Pengeluaran */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: '#eef0fb' }}>
                  <Mail className="w-5 h-5" style={{ color: '#232F72' }} />
                </div>
                <div>
                  <p className="font-semibold text-gray-800">Total Pengeluaran Grup</p>
                  <p className="text-gray-400 text-xs">Ringkasan bulan ini</p>
                </div>
              </div>
              <span className="text-xs bg-gray-100 px-3 py-1 rounded-full text-gray-500">Bulan ini</span>
            </div>
            <p className="text-3xl font-bold mb-4" style={{ color: '#232F72' }}>Rp 4.250.000</p>
            <div className="flex gap-8">
              {[
                { label: 'Transaksi', value: '28' },
                { label: 'Anggota', value: '6' },
                { label: 'Lunas', value: '82%' },
              ].map((item) => (
                <div key={item.label}>
                  <p className="text-xs text-gray-400">{item.label}</p>
                  <p className="font-bold text-gray-800 text-lg">{item.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Card Utang Aktif */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <p className="font-bold text-gray-800 mb-1">Utang Aktif</p>
            <p className="text-gray-400 text-xs mb-4">Pembayaran yang perlu diselesaikan</p>
            <div className="space-y-3">
              {[
                { initial: 'R', name: 'Rani bayar makan bersama', amount: '+Rp 120k', color: '#232F72' },
                { initial: 'B', name: 'Budi bayar transport', amount: '+Rp 45k', color: '#232F72' },
                { initial: 'S', name: 'Sinta lunasi utang', amount: 'Lunas', color: '#36ADA3' },
              ].map((item) => (
                <div key={item.name} className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                      style={{ backgroundColor: item.color === '#36ADA3' ? '#36ADA3' : '#e5e7eb', color: item.color === '#36ADA3' ? 'white' : '#374151' }}>
                      {item.initial}
                    </div>
                    <p className="text-sm text-gray-700">{item.name}</p>
                  </div>
                  <p className="text-sm font-semibold" style={{ color: item.color }}>{item.amount}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Card Insight Grup */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex justify-between items-center mb-4">
              <div>
                <p className="font-bold text-gray-800">Insight Grup</p>
                <p className="text-gray-400 text-xs">Distribusi pembayaran lebih mudah dipantau.</p>
              </div>
              <div className="flex items-center gap-1 px-3 py-1.5 rounded-full text-white text-xs font-semibold"
                style={{ backgroundColor: '#36ADA3' }}>
                <CheckCircle className="w-3 h-3" />
                TRANSPARAN
              </div>
            </div>
            <div className="flex items-end gap-1.5 h-16">
              {[35, 55, 45, 70, 50, 65, 40, 75].map((h, i) => (
                <div key={i} className="flex-1 rounded-t"
                  style={{
                    height: `${h}%`,
                    backgroundColor: i === 3 || i === 7 ? '#232F72' : '#e0e4f5'
                  }} />
              ))}
            </div>
          </div>

        </div>
      </div>

    </div>
  )
}

export default Login