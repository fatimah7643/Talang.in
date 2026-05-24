import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth()

  // Tunggu dulu sampai AuthContext selesai cek localStorage
  if (loading) return null

  // Kalau belum login, redirect ke /login
  if (!user) return <Navigate to="/login" replace />

  return children
}

export default ProtectedRoute