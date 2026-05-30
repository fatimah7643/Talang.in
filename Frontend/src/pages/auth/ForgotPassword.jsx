import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react'
import { supabase } from '../../lib/supabase'

const ForgotPassword = () => {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${import.meta.env.VITE_APP_URL}/reset-password`,
      })
      if (error) throw error
      setSent(true)
    } catch (err) {
      setError(err.message || 'Gagal mengirim email reset.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f0f2ff' }}>
      <div className="w-full max-w-sm bg-white rounded-3xl p-10"
        style={{ boxShadow: '0 4px 32px rgba(35,47,114,0.10)', border: '1px solid #e8eaf6' }}>

        <Link to="/login" className="flex items-center gap-2 w-fit mb-8">
          <img src="/logo.svg" alt="Talang.in" className="w-8 h-8 object-contain" />
          <span className="font-bold text-lg" style={{ color: '#121358' }}>Talang.in</span>
        </Link>

        {sent ? (
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <CheckCircle size={48} style={{ color: '#36ADA3' }} />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Email Terkirim!</h2>
            <p className="text-gray-500 text-sm mb-6">
              Cek inbox <strong>{email}</strong> dan klik link reset password yang kami kirimkan.
            </p>
            <Link to="/login"
              className="flex items-center justify-center gap-2 text-sm font-semibold"
              style={{ color: '#232F72' }}>
              <ArrowLeft size={16} /> Kembali ke Login
            </Link>
          </div>
        ) : (
          <>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Lupa Password?</h2>
            <p className="text-gray-500 mb-8 text-sm">
              Masukkan email kamu dan kami akan kirimkan link untuk reset password.
            </p>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="Masukkan email kamu"
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
                {loading ? 'Mengirim...' : 'Kirim Link Reset'}
              </button>
            </form>

            <p className="text-center text-sm text-gray-500 mt-6">
              Ingat password?{' '}
              <Link to="/login" className="font-semibold" style={{ color: '#232F72' }}>
                Masuk sekarang
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  )
}

export default ForgotPassword