// eslint-disable-next-line no-unused-vars
import { useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import {
  // eslint-disable-next-line no-unused-vars
  LayoutDashboard, Users, Receipt, Wallet, GitMerge,
  BarChart2, Bell, UserCircle, LogOut, Plus, Clock,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const C = {
  navyDark: '#121358',
  navy: '#232F72',
  blue: '#2F578A',
  teal: '#36ADA3',
}

const menus = [
  { key: 'dashboard',  label: 'Dashboard',          icon: LayoutDashboard, path: '/dashboard'  },
  { key: 'grup',       label: 'Grup',               icon: Users,           path: '/grup'       },
  { key: 'transaksi',  label: 'Tambah Transaksi',   icon: Plus,            path: '/transaksi'  },
  { key: 'riwayat',    label: 'Riwayat Transaksi',  icon: Clock,           path: '/riwayat'    },
  { key: 'balance',    label: 'Balance/Utang',      icon: Wallet,          path: '/balance'    },
  { key: 'simplify',   label: 'Simplify Debt',      icon: GitMerge,        path: '/simplify'   },
  { key: 'analytics',  label: 'Insight & Analytics',icon: BarChart2,       path: '/analytics'  },
  { key: 'notifikasi', label: 'Notifikasi',         icon: Bell,            path: '/notifikasi' },
  { key: 'profil',     label: 'Profil',             icon: UserCircle,      path: '/profil'     },
]

export default function Sidebar({ unreadCount = 0, isOpen, onClose }) {
  const { logout, user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const activeKey = menus.find((m) => location.pathname.startsWith(m.path))?.key ?? 'dashboard'

  // Tutup sidebar saat navigasi (mobile)
  const handleNavClick = () => {
    if (onClose) onClose()
  }

  return (
    <>
      {/* Overlay mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed left-0 top-0 h-screen w-56 flex flex-col z-40 bg-white transition-transform duration-300 lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
        style={{ borderRight: '1px solid #e5e7eb' }}
      >
      <div className="flex items-center gap-3 px-4 py-3">
  
      {/* Logo T */}
        <img
          src="/logo.svg"
          alt="Talang.in"
          className="w-12 h-12 shrink-0 object-contain"
        />
        {/* Text */}
        <div>
          <p className="text-sm font-bold leading-tight" style={{ color: '#121358' }}>
            Talang.in
          </p>
          <p className="text-xs" style={{ color: '#6b7280' }}>
            Financial Manager
          </p>
        </div>
      </div>  

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 flex flex-col gap-0.5 overflow-y-auto">
        {menus.map(({ key, label, icon: Icon, path }) => {
          const isActive = activeKey === key
          return (
            <Link
              key={key}
              to={path}
              onClick={handleNavClick}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all relative"
              style={{
                backgroundColor: isActive ? `${C.navy}12` : 'transparent',
                color: isActive ? C.navy : '#6b7280',
              }}
            >
              <Icon
                size={16}
                style={{ color: isActive ? C.navy : '#9ca3af' }}
              />
              <span className="flex-1">{label}</span>
              {isActive && (
                <div
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full"
                  style={{ backgroundColor: C.navy }}
                />
              )}
              {key === 'notifikasi' && unreadCount > 0 && (
                <span
                  className="text-xs font-bold w-4 h-4 rounded-full flex items-center justify-center"
                  style={{ background: C.teal, color: 'white', fontSize: '10px' }}
                >
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* User + Logout */}
      <div className="px-4 py-4 border-t border-gray-100">
        <div className="flex items-center gap-3 mb-3">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
            style={{ backgroundColor: C.navy }}
          >{(user?.full_name ?? user?.user_metadata?.full_name ?? user?.email)?.[0]?.toUpperCase() ?? 'U'}
            
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold truncate" style={{ color: C.navyDark }}>
              {user?.full_name ?? user?.user_metadata?.full_name ?? user?.name ?? 'Pengguna'}
            </p>
            <p className="text-xs truncate text-gray-400">{user?.email ?? ''}</p>
          </div>
        </div>
        <button
          onClick={() => { logout(); navigate('/login') }}
          className="w-full flex items-center gap-2 text-xs py-2 px-3 rounded-lg transition hover:bg-red-50 text-red-500"
        >
          <LogOut size={13} />
          <span>Logout</span>
        </button>
      </div>
      </aside>
    </>
  )
}