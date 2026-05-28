import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Plus, Wallet, TrendingDown, Receipt, Users,
  CalendarDays, CheckCircle2, TrendingUp, Lightbulb,
  // eslint-disable-next-line no-unused-vars
  XCircle, ArrowRight, GitMerge, BarChart2, Clock, User,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import api from '../../services/api'
import { fmt, fmtToday } from '../../utils/format'

const C = { navy: '#121358', navyMid: '#232F72', blue: '#2F578A', teal: '#36ADA3' }

const Sk = ({ className = '' }) => (
  <div className={`animate-pulse rounded-xl bg-gray-100 ${className}`} />
)

// ── Stat Card ────────────────────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
function StatCard({ label, value, sub, icon: Icon, color, gradFrom, gradTo, loading }) {
  return (
    <div className="relative overflow-hidden rounded-2xl p-5 text-white"
      style={{ background: `linear-gradient(135deg, ${gradFrom} 0%, ${gradTo} 100%)` }}>
      {/* BG decoration */}
      <div className="absolute -right-4 -top-4 w-24 h-24 rounded-full opacity-10"
        style={{ backgroundColor: 'white' }} />
      <div className="absolute -right-2 bottom-2 w-14 h-14 rounded-full opacity-10"
        style={{ backgroundColor: 'white' }} />

      {loading ? (
        <div className="space-y-2">
          <div className="w-9 h-9 rounded-xl bg-white/20 animate-pulse mb-3" />
          <div className="h-3 w-20 bg-white/20 rounded animate-pulse" />
          <div className="h-6 w-28 bg-white/20 rounded animate-pulse" />
        </div>
      ) : (
        <div className="relative z-10">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3"
            style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}>
            <Icon size={18} color="white" />
          </div>
          <p className="text-xs font-medium opacity-80 mb-1">{label}</p>
          <p className="text-xl font-bold leading-tight">{value}</p>
          {sub && <p className="text-xs opacity-60 mt-0.5">{sub}</p>}
        </div>
      )}
    </div>
  )
}

// ── Quick Action Button ───────────────────────────────────────────────────────
function QuickAction({ icon: Icon, label, to, color }) {
  return (
    <Link to={to}
      className="flex flex-col items-center gap-2 p-4 rounded-2xl border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all group bg-white">
      <div className="w-11 h-11 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110"
        style={{ backgroundColor: `${color}12` }}>
        <Icon size={20} style={{ color }} />
      </div>
      <span className="text-xs font-medium text-gray-600 text-center leading-tight">{label}</span>
    </Link>
  )
}

// ── Grup Card ────────────────────────────────────────────────────────────────
function GrupPatunganCard({ grupList, loading }) {
  const colors = [C.navyMid, C.teal, C.blue, '#7c3aed', '#059669']
  return (
    <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm font-bold" style={{ color: C.navy }}>Grup Patungan Aktif</h2>
          <p className="text-xs text-gray-400 mt-0.5">Grup yang kamu kelola bersama</p>
        </div>
        <Link to="/grup"
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-white transition hover:opacity-80"
          style={{ backgroundColor: C.navyMid }}>
          <Plus size={12} /> Buat Grup
        </Link>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-3">
          {[1, 2].map(i => <Sk key={i} className="h-24 rounded-xl" />)}
        </div>
      ) : grupList.length === 0 ? (
        <div className="text-center py-10">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3"
            style={{ backgroundColor: `${C.navyMid}10` }}>
            <Users size={24} style={{ color: C.navyMid }} />
          </div>
          <p className="text-sm font-semibold mb-1" style={{ color: C.navy }}>Belum ada grup</p>
          <p className="text-xs text-gray-400 mb-4">Buat grup dan mulai patungan bareng</p>
          <Link to="/grup"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white"
            style={{ backgroundColor: C.navyMid }}>
            <Plus size={14} /> Buat Grup Sekarang
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {grupList.slice(0, 4).map((g, i) => (
            <Link key={g.id} to="/grup"
              className="rounded-xl border border-gray-100 p-4 hover:border-blue-200 hover:shadow-sm transition-all group">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold text-white mb-3 transition-transform group-hover:scale-105"
                style={{ backgroundColor: colors[i % colors.length] }}>
                {g.name?.[0]?.toUpperCase() ?? 'G'}
              </div>
              <p className="text-sm font-semibold truncate" style={{ color: C.navy }}>{g.name}</p>
              <p className="text-xs text-gray-400 mt-0.5 truncate">{g.description || 'Grup patungan'}</p>
              <div className="flex items-center gap-1 mt-2">
                <Users size={11} className="text-gray-300" />
                <p className="text-xs text-gray-400">
                  {g.member_count ?? g.memberCount ?? g.members?.length ?? 0} anggota
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}

      {grupList.length > 4 && (
        <Link to="/grup" className="flex items-center justify-center gap-1 mt-3 text-xs font-medium hover:opacity-70"
          style={{ color: C.teal }}>
          Lihat semua {grupList.length} grup <ArrowRight size={12} />
        </Link>
      )}
    </div>
  )
}

// ── Transaksi Terakhir ───────────────────────────────────────────────────────
function TransaksiCard({ transaksi, loading }) {
  const catConfig = {
    'makanan & minuman': { icon: '🍽️', color: C.teal },
    'transportasi':      { icon: '🚗', color: '#f59e0b' },
    'hiburan':           { icon: '🎬', color: '#a78bfa' },
    'belanja':           { icon: '🛍️', color: '#f472b6' },
    'tagihan':           { icon: '⚡', color: C.blue },
  }

  return (
    <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm font-bold" style={{ color: C.navy }}>Transaksi Terakhir</h2>
          <p className="text-xs text-gray-400 mt-0.5">Pengeluaran terbaru di grup aktif</p>
        </div>
        <Link to="/riwayat" className="flex items-center gap-1 text-xs font-medium hover:opacity-70"
          style={{ color: C.teal }}>
          Semua <ArrowRight size={12} />
        </Link>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex items-center gap-3">
              <Sk className="w-9 h-9 rounded-xl shrink-0" />
              <div className="flex-1 space-y-1.5">
                <Sk className="h-3 w-3/4" />
                <Sk className="h-2.5 w-1/2" />
              </div>
              <Sk className="h-3 w-20" />
            </div>
          ))}
        </div>
      ) : transaksi.length === 0 ? (
        <div className="text-center py-8">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3"
            style={{ backgroundColor: `${C.navyMid}10` }}>
            <Receipt size={20} style={{ color: C.navyMid }} />
          </div>
          <p className="text-sm font-medium text-gray-500 mb-1">Belum ada transaksi</p>
          <p className="text-xs text-gray-400">Tambahkan transaksi pertama kamu</p>
        </div>
      ) : (
        <div className="space-y-1">
          {transaksi.map((t) => {
            const catKey = (t.category ?? '').toLowerCase()
            const cfg = catConfig[catKey] ?? { icon: '💳', color: C.navyMid }
            return (
              <div key={t.id}
                className="flex items-center gap-3 py-2.5 px-3 rounded-xl hover:bg-gray-50 transition-colors">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-base shrink-0"
                  style={{ backgroundColor: `${cfg.color}12` }}>
                  {cfg.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: C.navy }}>
                    {t.description ?? t.name ?? '—'}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {t.paidBy ?? t.paid_by_name ?? t.paid_by ?? '—'}
                  </p>
                </div>
                <span className="text-sm font-semibold shrink-0" style={{ color: '#ef4444' }}>
                  -{fmt(t.amount ?? t.total_amount ?? 0)}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── Insight + Quick Actions ──────────────────────────────────────────────────
function RightPanel({ insights, loading }) {
  const quickActions = [
    { icon: Plus,      label: 'Tambah Transaksi', to: '/transaksi', color: C.navyMid },
    { icon: GitMerge,  label: 'Simplify Debt',    to: '/simplify',  color: C.teal    },
    { icon: Wallet,    label: 'Lihat Balance',    to: '/balance',   color: C.blue    },
    { icon: BarChart2, label: 'Insight',          to: '/analytics', color: '#7c3aed' },
  ]

  return (
    <div className="space-y-5">
      {/* Quick Actions */}
      <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
        <h2 className="text-sm font-bold mb-3" style={{ color: C.navy }}>Aksi Cepat</h2>
        <div className="grid grid-cols-2 gap-2">
          {quickActions.map((a) => <QuickAction key={a.label} {...a} />)}
        </div>
      </div>

      {/* Insight */}
      <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: '#ede9fe' }}>
            <Lightbulb size={15} style={{ color: '#7c3aed' }} />
          </div>
          <div>
            <h2 className="text-sm font-bold leading-tight" style={{ color: C.navy }}>Insight Grup</h2>
            <p className="text-xs text-gray-400">Ringkasan otomatis</p>
          </div>
        </div>

        <div className="mt-4">
          {loading ? (
            <div className="space-y-3">
              {[1, 2].map(i => <Sk key={i} className="h-14 rounded-xl" />)}
            </div>
          ) : insights.length === 0 ? (
            <div className="py-4 text-center">
              <p className="text-xs text-gray-400 leading-relaxed">
                Tambahkan transaksi dulu untuk mendapatkan insight otomatis grup kamu.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {insights.map((ins, i) => (
                <div key={i} className="flex items-start gap-2.5 p-3 rounded-xl"
                  style={{ backgroundColor: '#f8f9ff' }}>
                  <span className="text-lg shrink-0 mt-0.5">{ins.icon || '💡'}</span>
                  <div>
                    <p className="text-xs font-semibold" style={{ color: C.navy }}>{ins.title}</p>
                    <p className="text-xs text-gray-500 leading-relaxed mt-0.5">{ins.message}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <Link to="/analytics"
          className="mt-4 flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-xs font-semibold text-white transition hover:opacity-80"
          style={{ backgroundColor: C.navy }}>
          <TrendingUp size={13} /> Insight Lengkap
        </Link>
      </div>

      {/* Shortcut riwayat */}
      <Link to="/riwayat"
        className="flex items-center justify-between p-4 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all group">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: `${C.teal}12` }}>
            <Clock size={16} style={{ color: C.teal }} />
          </div>
          <div>
            <p className="text-sm font-semibold" style={{ color: C.navy }}>Riwayat Transaksi</p>
            <p className="text-xs text-gray-400">Semua catatan pengeluaran</p>
          </div>
        </div>
        <ArrowRight size={16} className="text-gray-300 group-hover:text-gray-500 transition-colors" />
      </Link>
    </div>
  )
}

// ── Main ─────────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const { user } = useAuth()
  const [grupList, setGrupList]   = useState([])
  const [stats, setStats]         = useState(null)
  const [transaksi, setTransaksi] = useState([])
  const [insights, setInsights]   = useState([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState('')

  useEffect(() => {
    const run = async () => {
      setLoading(true); setError('')
      try {
        const grupRes = await api.get("/groups/my-groups")
        const raw = grupRes.data?.data ?? grupRes.data ?? []
        const list = raw.map(item => ({
          id:   item.groups?.id,
          name: item.groups?.group_name || '—',
          member_count: item.groups?.member_count?.[0]?.count ?? 0,
        }))
        setGrupList(list)

        if (list.length === 0) {
          setStats({
            totalPengeluaran: 0,
            utangAktif: 0,
            totalGrup: 0,
            totalAnggota: 0
          })

          setTransaksi([])
          setInsights([])
          setLoading(false)
          return
        }
        const grupId = list[0].id
        const [trxRes, balRes] = await Promise.allSettled([
          api.get(`/bills/${grupId}/history?limit=5`),
          api.get(`/settlements/${grupId}/recap`),
        ])

        let totalPengeluaran = 0, utangAktif = 0

        if (trxRes.status === 'fulfilled') {
          const raw = trxRes.value.data?.data ?? trxRes.value.data ?? []
          const arr = Array.isArray(raw) ? raw : []
          setTransaksi(arr)
          totalPengeluaran = arr.reduce((s, t) => s + Number(t.amount ?? t.total_amount ?? 0), 0)
          if (arr.length > 0) {
            setInsights([{
              icon: '📊',
              title: `Ringkasan ${list[0].name}`,
              message: `${arr.length} transaksi terbaru dengan total ${fmt(totalPengeluaran)}.`,
            }])
          }
        }
        if (balRes.status === 'fulfilled') {
          const raw = balRes.value.data?.data ?? balRes.value.data ?? []
          utangAktif = (Array.isArray(raw) ? raw : []).reduce((s, b) => {
            return s + (b.total_debt ?? 0)
          }, 0)
        }

        const totalAnggota = list.reduce((s, g) =>
          s + (g.member_count ?? g.memberCount ?? g.members?.length ?? 0), 0)

        setStats({ totalPengeluaran, utangAktif, totalGrup: list.length, totalAnggota })
      } catch {
        setError('Gagal memuat data dashboard.')
      } finally {
        setLoading(false)
      }
    }
    run()
  }, [user])

  const statCards = [
    {
      label: 'Total Pengeluaran', icon: Wallet,
      value: stats ? fmt(stats.totalPengeluaran) : 'Rp 0',
      sub: 'Dari transaksi grup',
      gradFrom: C.navy, gradTo: C.navyMid,
    },
    {
      label: 'Utang Aktif', icon: TrendingDown,
      value: stats ? fmt(stats.utangAktif) : 'Rp 0',
      sub: 'Belum dilunasi',
      gradFrom: '#dc2626', gradTo: '#ef4444',
    },
    {
      label: 'Jumlah Grup', icon: Users,
      value: stats ? `${stats.totalGrup} grup` : '0 grup',
      sub: stats ? `${stats.totalAnggota} anggota total` : '',
      gradFrom: C.blue, gradTo: '#4a90d9',
    },
    {
      label: 'Transaksi', icon: Receipt,
      value: `${transaksi.length} transaksi`,
      sub: 'Di grup aktif',
      gradFrom: '#0d9488', gradTo: C.teal,
    },
  ]

  return (
    <div className="min-h-screen p-6" style={{ backgroundColor: '#f4f6fb' }}>

              {/* Header */}
        <div className="relative overflow-hidden rounded-2xl p-6 mb-6 text-white"
          style={{ background: `linear-gradient(135deg, ${C.navy} 0%, ${C.navyMid} 55%, ${C.blue} 100%)` }}>
          {/* Decorasi */}
          <div className="absolute -right-10 -top-10 w-48 h-48 rounded-full opacity-10"
            style={{ backgroundColor: 'white' }} />
          <div className="absolute right-20 bottom-0 w-24 h-24 rounded-full opacity-5"
            style={{ backgroundColor: 'white' }} />
          <svg className="absolute inset-0 w-full h-full opacity-[0.04]">
            <defs>
              <pattern id="dash-dots" width="28" height="28" patternUnits="userSpaceOnUse">
                <circle cx="2" cy="2" r="1.5" fill="white" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#dash-dots)" />
          </svg>

          <div className="relative z-10 flex items-start justify-between gap-4">
            <div className="flex-1">
              {/* Badge tanggal + akun aktif */}
              <div className="flex items-center gap-2 mb-3">
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs"
                  style={{ borderColor: 'rgba(255,255,255,0.2)', backgroundColor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.75)' }}>
                  <CalendarDays size={11} />
                  <span>{fmtToday()}</span>
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
                  style={{ backgroundColor: 'rgba(54,173,163,0.2)', color: '#6ee7e0', border: '1px solid rgba(54,173,163,0.3)' }}>
                  <CheckCircle2 size={11} />
                  <span>Akun aktif</span>
                </div>
              </div>
              {/* Greeting */}
              <h1 className="text-2xl font-bold mb-1">
                Halo, {user?.full_name ?? 'Pengguna Talang.in'}!
              </h1>
              <p className="text-sm opacity-70 max-w-md">
                Pantau pengeluaran, utang, dan kondisi keuangan grupmu dalam satu tempat.
              </p>
            </div>
            <Link to="/transaksi"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition hover:opacity-80 shrink-0"
              style={{ backgroundColor: C.teal, color: 'white' }}>
              <Plus size={15} /> Tambah Transaksi
            </Link>
          </div>
        </div>

        {error && (
          <div className="mb-5 flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-red-600 bg-red-50 border border-red-100">
            <XCircle size={15} className="shrink-0" /> {error}
          </div>
        )}

      {/* Stat Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {statCards.map((s) => (
          <StatCard key={s.label} {...s} loading={loading} />
        ))}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-3 gap-5">
        <div className="col-span-2 space-y-5">
          <GrupPatunganCard grupList={grupList} loading={loading} />
          <TransaksiCard transaksi={transaksi} loading={loading} />
        </div>
        <div>
          <RightPanel insights={insights} loading={loading} />
        </div>
      </div>
    </div>
  )
}