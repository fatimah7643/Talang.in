import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ToastProvider } from './context/ToastContext'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'

import LandingPage from './pages/LandingPage'
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import Dashboard from './pages/dashboard/Dashboard'
import Grup from './pages/grup/Grup'
import Transaksi from './pages/transaksi/Transaksi'
import Analytics from './pages/analytics/Analytics'
import Profil from './pages/profil/Profil'
import BalancePage from './pages/balance/BalancePage'
import Notifikasi from './pages/notifikasi/Notifikasi'
import Riwayat from './pages/riwayat/Riwayat'
import SimplifyDebt from './pages/simplify/SimplifyDebt'
import SyaratKetentuan from './pages/legal/SyaratKetentuan'
import KebijakanPrivasi from './pages/legal/KebijakanPrivasi'
import ForgotPassword from './pages/auth/ForgotPassword'
import ResetPassword from './pages/auth/ResetPassword'
import PanduanAI from './pages/panduan/PanduanAI'

const App = () => {
  return (
    <AuthProvider>
      <ToastProvider>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          {/* Protected routes dengan Layout */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Layout><Dashboard /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/grup" element={
            <ProtectedRoute>
              <Layout><Grup /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/transaksi" element={
            <ProtectedRoute>
              <Layout><Transaksi /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/analytics" element={
            <ProtectedRoute>
              <Layout><Analytics /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/profil" element={
            <ProtectedRoute>
              <Layout><Profil /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/balance" element={
            <ProtectedRoute>
              <Layout><BalancePage /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/notifikasi" element={
            <ProtectedRoute>
              <Layout><Notifikasi /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/riwayat" element={
            <ProtectedRoute>
              <Layout><Riwayat /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/simplify" element={
            <ProtectedRoute>
              <Layout><SimplifyDebt /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/panduan-ai" element={
            <ProtectedRoute>
              <Layout><PanduanAI /></Layout>
            </ProtectedRoute>
          } />
          {/* Legal — public */}
          <Route path="/syarat-ketentuan"  element={<SyaratKetentuan />} />
          <Route path="/kebijakan-privasi" element={<KebijakanPrivasi />} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  )
}

export default App