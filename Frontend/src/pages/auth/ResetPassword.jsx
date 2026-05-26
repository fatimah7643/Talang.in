import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Lock, Eye, EyeOff } from 'lucide-react'
import { supabase } from '../../lib/supabase'

const ResetPassword = () => {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  // Supabase otomatis set session dari URL hash saat halaman dibuka
  useEffect(() => {
    supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        // Session sudah aktif, user bisa ganti password
      }
    })
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (password !== confirm) {
      setError('Password tidak cocok.')
      return
    }
    if (password.length < 8) {
      setError('Password minimal 8 karakter.')
      return
    }
    setLoading(true)
    setError('')
    try {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw error
      setSuccess(true)
      setTimeout(() => navigate('/login'), 3000)
    } catch (err) {
      setError(err.message || 'Gagal reset password.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f0f2ff' }}>
      <div className="w-full max-w-sm bg-white rounded-3xl p-10"
        style={{ boxShadow: '0 4px 32px rgba(35,47,114,0.10)', border: '1px solid #e8eaf6' }}>

        <div className="mb-8 flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: '#121358' }}>
            <span className="text-white text-xs font-bold">T</span>
          </div>
          <span className="font-bold text-lg" style={{ color: '#121358' }}>Talang.in</span>
        </div>

        {success ? (
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900 mb-2">Password Berhasil Diubah! ✅</p>
            <p className="text-gray-500 text-sm">Mengarahkan ke halaman login...</p>
          </div>
        ) : (
          <>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Reset Password</h2>
            <p className="text-gray-500 mb-8 text-sm">Masukkan password baru kamu.</p>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password Baru</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Minimal 8 karakter"
                    required
                    className="w-full pl-11 pr-12 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 bg-white"
                  />
                  <button type="button" onClick={() => setShowPass(!showPass)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Konfirmasi Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="password"
                    value={confirm}
                    onChange={e => setConfirm(e.target.value)}
                    placeholder="Ulangi password baru"
                    required
                    className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 bg-white"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl text-white font-semibold text-sm disabled:opacity-70"
                style={{ backgroundColor: '#232F72' }}
              >
                {loading ? 'Menyimpan...' : 'Simpan Password Baru'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}

export default ResetPassword