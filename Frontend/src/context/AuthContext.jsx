import { createContext, useContext, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // LOGIN BIASA
    const token = localStorage.getItem('token')
    const savedUser = localStorage.getItem('user')

    if (token && savedUser) {
      setUser(JSON.parse(savedUser))
    }

    // LOGIN GOOGLE
    const params = new URLSearchParams(window.location.search)
    const oauthToken = params.get('token')
    const oauthUser = params.get('user')

    if (oauthToken && oauthUser) {
      try {
        const parsedUser = JSON.parse(decodeURIComponent(oauthUser))

        localStorage.setItem('token', oauthToken)
        localStorage.setItem('user', JSON.stringify(parsedUser))

        setUser(parsedUser)

        // Bersihkan URL
        window.history.replaceState({}, document.title, '/dashboard')
      } catch (err) {
        console.error('OAuth parse error:', err)
      }
    }

    setLoading(false)
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