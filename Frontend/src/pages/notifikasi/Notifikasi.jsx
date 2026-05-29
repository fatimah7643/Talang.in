import { useState, useEffect } from 'react'
import {
  Bell, CheckCheck, RefreshCw, XCircle,
  Receipt, Users, Wallet, Activity, Info, Search, Trash2,
} from 'lucide-react'
import api from '../../services/api'

const C = {
  navyDark: '#121358',
  navy:     '#232F72',
  blue:     '#2F578A',
  teal:     '#36ADA3',
  bg:       '#f4f6fb',
}

const typeConfig = {
  transaction:  { icon: Receipt,  color: C.blue,    bg: `${C.blue}18`           },
  group_invite: { icon: Users,    color: C.teal,    bg: `${C.teal}18`           },
  payment:      { icon: Wallet,   color: C.teal,    bg: `${C.teal}18`           },
  health:       { icon: Activity, color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  default:      { icon: Info,     color: C.navy,    bg: `${C.navy}10`           },
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1)  return 'Baru saja'
  if (m < 60) return `${m} menit lalu`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h} jam lalu`
  return `${Math.floor(h / 24)} hari lalu`
}

const Sk = ({ className = '' }) => (
  <div className={`animate-pulse rounded-xl bg-gray-100 ${className}`} />
)

function NotifItem({ notif, onRead, onDelete }) {
  const cfg  = typeConfig[notif.type] ?? typeConfig.default
  const Icon = cfg.icon
  return (
    <div
      onClick={() => !notif.is_read && onRead(notif.id)}
      className={`flex items-start gap-4 px-5 py-4 cursor-pointer transition-colors hover:bg-gray-50
        ${!notif.is_read ? 'bg-blue-50/40' : 'bg-white'}`}
      style={{ borderLeft: `3px solid ${!notif.is_read ? C.teal : 'transparent'}` }}
    >
      {/* Icon */}
      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
        style={{ backgroundColor: cfg.bg }}>
        <Icon size={17} style={{ color: cfg.color }} />
      </div>

      {/* Konten */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3">
          <p className={`text-sm leading-snug ${!notif.is_read ? 'font-semibold text-gray-800' : 'text-gray-500'}`}>
            {notif.title}
          </p>
          {!notif.is_read && (
            <span className="w-2 h-2 rounded-full shrink-0 mt-1.5" style={{ backgroundColor: C.teal }} />
          )}
        </div>
        {notif.message && (
          <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{notif.message}</p>
        )}
        <p className="text-xs text-gray-400 mt-1.5">
          {notif.created_at ? timeAgo(notif.created_at) : ''}
        </p>
      </div>

      {/* Tombol hapus per item */}
      <button
        onClick={e => { e.stopPropagation(); onDelete(notif.id) }}
        className="shrink-0 mt-0.5 p-1 rounded-lg text-gray-300 hover:text-red-400 hover:bg-red-50 transition-colors"
      >
        <Trash2 size={14} />
      </button>
    </div>
  )
}

export default function Notifikasi() {
  const [notifs, setNotifs]           = useState([])
  const [loading, setLoading]         = useState(true)
  const [error, setError]             = useState(null)
  const [markingAll, setMarkingAll]   = useState(false)
  const [activeTab, setActiveTab]     = useState('semua')
  const [search, setSearch]           = useState('')
  // eslint-disable-next-line no-unused-vars
  const [deletingId, setDeletingId]   = useState(null)
  const [deletingAll, setDeletingAll] = useState(false)

  const unread = notifs.filter(n => !n.is_read)

  const fetchNotifs = async () => {
    setLoading(true); setError(null)
    try {
      const res = await api.get('/notifications')
      setNotifs(res.data?.data ?? res.data ?? [])
    } catch (e) {
      setError(e.response?.data?.message || 'Gagal memuat notifikasi.')
    } finally {
      setLoading(false)
    }
  }

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchNotifs() }, [])

  const handleRead = async (id) => {
    setNotifs(p => p.map(n => n.id === id ? { ...n, is_read: true } : n))
    try {
      await api.put(`/notifications/${id}/read`)
    } catch {
      // rollback kalau gagal
    }
  }

  const handleMarkAll = async () => {
    setMarkingAll(true)
    setNotifs(p => p.map(n => ({ ...n, is_read: true })))
    try {
      await api.put('/notifications/read-all')
    } catch {
      // rollback kalau gagal
    } finally {
      setMarkingAll(false)
    }
  }

  const handleDelete = async (id) => {
    setDeletingId(id)
    setNotifs(p => p.filter(n => n.id !== id))
    try {
      await api.delete(`/notifications/${id}`)
    } catch {
      fetchNotifs() // rollback kalau gagal
    } finally {
      setDeletingId(null)
    }
  }

  const handleDeleteAll = async () => {
    if (!window.confirm('Hapus semua notifikasi?')) return
    setDeletingAll(true)
    setNotifs([])
    try {
      await api.delete('/notifications/delete-all')
    } catch {
      fetchNotifs() // rollback kalau gagal
    } finally {
      setDeletingAll(false)
    }
  }

  const tabs = [
    { id: 'semua',      label: 'Semua'      },
    { id: 'transaksi',  label: 'Transaksi'  },
    { id: 'pembayaran', label: 'Pembayaran' },
    { id: 'insight',    label: 'Insight'    },
    { id: 'pengingat',  label: 'Pengingat'  },
  ]

  const typeMap = {
    transaksi:  ['transaction'],
    pembayaran: ['payment'],
    insight:    ['health'],
    pengingat:  ['group_invite'],
  }

  const displayed = notifs
    .filter(n => activeTab === 'semua' || (typeMap[activeTab] ?? []).includes(n.type))
    .filter(n => !search || n.title?.toLowerCase().includes(search.toLowerCase()) || n.message?.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="min-h-screen" style={{ backgroundColor: C.bg }}>

      {/* ── Topbar ── */}
      <div className="bg-white border-b border-gray-100 px-3 sm:px-6 py-3">
        <div className="flex items-center justify-between gap-2 flex-wrap mb-3">

          {/* Judul + icon */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl"
              style={{ backgroundColor: `${C.teal}18` }}>
              <Bell size={20} style={{ color: C.teal }} />
            </div>
            <div>
              <h1 className="text-lg font-bold" style={{ color: C.navyDark }}>Notifikasi</h1>
              <p className="text-xs text-gray-400">Pantau aktivitas penting dari grup patungan kamu.</p>
            </div>
          </div>

          {/* Actions — icon only di mobile, full di desktop */}
          <div className="flex items-center gap-2">

            {/* Tandai semua dibaca */}
            <button
              onClick={handleMarkAll}
              disabled={markingAll || unread.length === 0}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold border transition hover:bg-gray-50 disabled:opacity-40"
              style={{ borderColor: C.navy, color: C.navy }}
            >
              {markingAll
                ? <RefreshCw size={14} className="animate-spin" />
                : <CheckCheck size={14} />}
              <span className="hidden sm:inline">Tandai semua dibaca</span>
            </button>

            {/* Hapus semua */}
            <button
              onClick={handleDeleteAll}
              disabled={deletingAll || notifs.length === 0}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold border transition hover:bg-red-50 disabled:opacity-40"
              style={{ borderColor: '#ef4444', color: '#ef4444' }}
            >
              {deletingAll
                ? <RefreshCw size={14} className="animate-spin" />
                : <Trash2 size={14} />}
              <span className="hidden sm:inline">Hapus semua</span>
            </button>

          </div>
        </div>

         {/* Search — tambah di SINI */}
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm text-gray-400 mt-2 mb-2">
          <Search size={14} className="shrink-0" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Cari notifikasi..."
            className="bg-transparent outline-none text-gray-600 placeholder-gray-400 w-full text-sm"
          />
        </div>

        {/* Pill Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
          {tabs.map(({ id, label }) => {
            const isActive = activeTab === id
            return (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className="px-4 py-1.5 rounded-full text-sm font-medium transition-all"
                style={{
                  backgroundColor: isActive ? C.navyDark : 'transparent',
                  color:           isActive ? 'white'    : '#6b7280',
                  border:          isActive ? 'none'     : '1px solid #e5e7eb',
                }}
              >
                {label}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Body ── */}
      <div className="p-6 space-y-4">

        {/* Loading */}
        {loading && (
          <div className="space-y-2 max-w-2xl">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-start gap-4 bg-white rounded-2xl px-5 py-4 border border-gray-100">
                <Sk className="w-10 h-10 rounded-xl shrink-0" />
                <div className="flex-1 space-y-2">
                  <Sk className="h-3.5 w-48" />
                  <Sk className="h-3 w-64" />
                  <Sk className="h-2.5 w-20" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <XCircle size={32} className="text-red-400" />
            <p className="text-sm text-gray-500">{error}</p>
            <button onClick={fetchNotifs}
              className="flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition">
              <RefreshCw size={14} /> Coba Lagi
            </button>
          </div>
        )}

        {/* Empty */}
        {!loading && !error && displayed.length === 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl"
                style={{ backgroundColor: `${C.navy}10` }}>
                <Bell size={28} style={{ color: C.navy }} className="opacity-40" />
              </div>
              <div>
                <p className="font-semibold text-gray-600">Tidak ada notifikasi</p>
                <p className="text-sm text-gray-400 mt-1">Semua aktivitas penting akan muncul di sini.</p>
              </div>
            </div>
          </div>
        )}

        {/* List */}
        {!loading && !error && displayed.length > 0 && (
          <div className="max-w-2xl rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden divide-y divide-gray-100">
            {displayed.map(n => (
              <NotifItem key={n.id} notif={n} onRead={handleRead} onDelete={handleDelete} />
            ))}
          </div>
        )}

        {/* Footer count */}
        {!loading && (
          <p className="text-xs text-gray-400 pt-1">
            {unread.length} notifikasi belum dibaca
          </p>
        )}

      </div>
    </div>
  )
}