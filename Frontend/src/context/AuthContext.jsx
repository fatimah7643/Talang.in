import { createContext, useContext, useState, useEffect } from 'react'
import api from '../services/api'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser]       = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const init = async () => {
      // ── 1. Handle Google OAuth redirect (token di URL params) ──
      const params     = new URLSearchParams(window.location.search)
      const oauthToken = params.get('token')
      const oauthUser  = params.get('user')

      if (oauthToken && oauthUser) {
        try {
          const parsedUser = JSON.parse(decodeURIComponent(oauthUser))
          localStorage.setItem('token', oauthToken)
          localStorage.setItem('user', JSON.stringify(parsedUser))
          setUser(parsedUser)
          window.history.replaceState({}, document.title, '/dashboard')
        } catch (err) {
          console.error('OAuth parse error:', err)
        }
        setLoading(false)
        return
      }

      // ── 2. Login biasa — verifikasi token ke backend ──
      const token     = localStorage.getItem('token')
      const savedUser = localStorage.getItem('user')

      if (!token || !savedUser) {
        setLoading(false)
        return
      }

      try {
        // Hit /profiles/me untuk verifikasi token masih valid
        const res     = await api.get('/profiles/me')
        const profile = res.data?.data || res.data

        // Merge data fresh dari backend dengan data lokal
        // Hapus field null dari profile agar tidak overwrite data lokal yang valid
        const cleanProfile = Object.fromEntries(
          // eslint-disable-next-line no-unused-vars
          Object.entries(profile).filter(([_, v]) => v !== null && v !== undefined)
        )
        const freshUser = {
          ...JSON.parse(savedUser),
          ...cleanProfile,
        }
        localStorage.setItem('user', JSON.stringify(freshUser))
        setUser(freshUser)
      } catch (err) {
        // Token expired atau invalid → bersihkan session
        if (err.response?.status === 401 || err.response?.status === 403) {
          localStorage.removeItem('token')
          localStorage.removeItem('user')
          setUser(null)
        } else {
          // Error lain (network, server down) → tetap pakai data lokal
          // agar user tidak terpaksa logout saat offline
          setUser(JSON.parse(savedUser))
        }
      } finally {
        setLoading(false)
      }
    }

    init()
  }, [])

  const login = (userData, token) => {
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(userData))
    setUser(userData)
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext)