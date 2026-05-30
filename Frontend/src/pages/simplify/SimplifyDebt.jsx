import { useState, useEffect, useCallback } from 'react'
import {
  GitMerge, ArrowRight, CheckCircle2, Zap, Users,
  AlertCircle, RefreshCw, ChevronDown, PartyPopper,
  // eslint-disable-next-line no-unused-vars
  Sparkles, TrendingDown, Info, CreditCard, Hash,
} from 'lucide-react'
import api from '../../services/api'
import { useAuth } from '../../context/AuthContext'

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
  navyDark: '#121358',
  navy:     '#232F72',
  blue:     '#2F578A',
  teal:     '#36ADA3',
  bg:       '#f0f2f8',
}

const rupiah = (n) => 'Rp ' + Number(Math.abs(n) || 0).toLocaleString('id-ID')

const Sk = ({ className = '' }) => (
  <div className={`animate-pulse rounded-2xl bg-white/70 ${className}`} />
)

// ─── Grup selector dropdown ───────────────────────────────────────────────────
function GrupSelector({ grups, selected, onChange }) {
  const [open, setOpen] = useState(false)
  const cur = grups.find(g => g.id === selected)

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(p => !p)}
        className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold hover:border-gray-300 transition-all shadow-sm"
        style={{ color: C.navyDark }}
      >
        <Users size={14} style={{ color: C.teal }} />
        {cur?.name || 'Pilih Grup'}
        <ChevronDown size={13} className={`text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-12 z-20 w-56 rounded-2xl border border-gray-100 bg-white py-2 shadow-xl">
            {grups.map(g => (
              <button key={g.id}
                onClick={() => { onChange(g.id); setOpen(false) }}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-sm transition-all"
                style={{
                  backgroundColor: g.id === selected ? C.navyDark : 'transparent',
                  color: g.id === selected ? 'white' : '#374151',
                }}>
                <Users size={13} /> {g.name}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

// ─── Stat card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, icon: Icon, color, accent }) {
  return (
    <div className="rounded-2xl bg-white border border-gray-100 px-4 py-3 sm:p-5 shadow-sm flex flex-row sm:flex-col items-center sm:items-start gap-3 sm:gap-3 hover:shadow-md transition-shadow">
      <div className="flex h-10 w-10 sm:h-8 sm:w-8 items-center justify-center rounded-xl shrink-0"
        style={{ backgroundColor: `${color}15` }}>
        <Icon size={18} style={{ color }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wide text-gray-400 leading-tight">{label}</p>
        <p className="text-lg sm:text-2xl font-black tracking-tight break-all mt-0.5" style={{ color: accent ?? C.navyDark }}>{value}</p>
        {sub && <p className="text-xs text-gray-400">{sub}</p>}
      </div>
    </div>
  )
}

// ─── Transfer row ─────────────────────────────────────────────────────────────
function TransferRow({ tx, idx, onDone, grupId }) {
  const [done, setDone] = useState(false)
  const [open, setOpen] = useState(false)
  const [paying, setPaying] = useState(false)

  return (
    <div className={`rounded-2xl border transition-all ${
      done ? 'bg-gray-50 border-gray-100 opacity-60' : 'bg-white border-gray-100 hover:shadow-md hover:border-gray-200'
    }`}>
      {/* Header — selalu tampil, klik untuk expand */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:gap-4 p-3 sm:p-4 cursor-pointer"
        onClick={() => setOpen(p => !p)}>

        {/* Row atas: nomor + avatar from + panah + amount + avatar to + chevron */}
        <div className="flex items-center gap-2 w-full">
          {/* Nomor urut */}
          <div className="w-7 h-7 rounded-xl flex items-center justify-center text-xs font-black text-white shrink-0"
            style={{ background: done ? '#9ca3af' : `linear-gradient(135deg, ${C.navy}, ${C.teal})` }}>
            {idx + 1}
          </div>

          {/* Avatar From */}
          <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-xs font-black shrink-0"
            style={{ backgroundColor: done ? '#9ca3af' : '#ef4444' }}>
            {tx.from_name?.[0]?.toUpperCase() || '?'}
          </div>

          {/* Nama from — hidden di mobile */}
          <span className="hidden sm:block text-sm font-bold max-w-[60px] truncate" style={{ color: C.navyDark }}>
            {tx.from_name || '—'}
          </span>

          {/* Arrow + amount */}
          <div className="flex-1 flex flex-col items-center gap-1">
            <p className="text-sm font-black" style={{ color: done ? '#9ca3af' : C.navyDark }}>{rupiah(tx.amount)}</p>
            <div className="flex items-center gap-1 w-full">
              <div className="flex-1 h-0.5 rounded-full" style={{ backgroundColor: done ? '#e5e7eb' : `${C.teal}40` }} />
              <ArrowRight size={13} style={{ color: done ? '#9ca3af' : C.teal }} />
            </div>
          </div>

          {/* Nama to — hidden di mobile */}
          <span className="hidden sm:block text-sm font-bold max-w-[60px] truncate" style={{ color: C.navyDark }}>
            {tx.to_name || '—'}
          </span>

          {/* Avatar To */}
          <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-xs font-black shrink-0"
            style={{ backgroundColor: done ? '#9ca3af' : C.teal }}>
            {tx.to_name?.[0]?.toUpperCase() || '?'}
          </div>

          {/* Chevron */}
          <ChevronDown size={14} className={`text-gray-400 shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
        </div>

        {/* Row bawah: nama from & to — HANYA muncul di mobile */}
        <div className="flex sm:hidden items-center justify-between mt-1.5 px-9">
          <span className="text-xs font-bold max-w-[120px] truncate" style={{ color: C.navyDark }}>
            {tx.from_name || '—'}
          </span>
          <span className="text-xs font-bold max-w-[120px] truncate text-right" style={{ color: C.navyDark }}>
            {tx.to_name || '—'}
          </span>
        </div>
      </div>

      {/* Detail panel — muncul saat open */}
      {open && (
        <div className="px-4 pb-4 pt-0 border-t border-gray-50 space-y-3">
          <div className="flex items-center justify-between pt-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-xs font-black"
                style={{ backgroundColor: done ? '#9ca3af' : '#ef4444' }}>
                {tx.from_name?.[0]?.toUpperCase() || '?'}
              </div>
              <div>
                <p className="text-xs text-gray-400">Dari</p>
                <p className="text-sm font-bold" style={{ color: C.navyDark }}>{tx.from_name || '—'}</p>
              </div>
            </div>
            <div className="flex flex-col items-center gap-1">
              <p className="text-sm font-black" style={{ color: C.navyDark }}>{rupiah(tx.amount)}</p>
              <ArrowRight size={14} style={{ color: C.teal }} />
            </div>
            <div className="flex items-center gap-2">
              <div className="text-right">
                <p className="text-xs text-gray-400">Ke</p>
                <p className="text-sm font-bold" style={{ color: C.navyDark }}>{tx.to_name || '—'}</p>
              </div>
              <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-xs font-black"
                style={{ backgroundColor: done ? '#9ca3af' : C.teal }}>
                {tx.to_name?.[0]?.toUpperCase() || '?'}
              </div>
            </div>
          </div>

          {/* Tombol tandai selesai */}
          <button onClick={async (e) => {
            e.stopPropagation()
            if (done) { setDone(false); return }
            setPaying(true)
            try {
              await api.put(`/settlements/${grupId}/settle`, {
                debtor_id: tx.from,
                creditor_id: tx.to,
              })
              setDone(true)
              onDone?.()
            } catch (e) {
              console.error('Settle gagal:', e)
            } finally {
              setPaying(false)
            }
          }}
            className="w-full flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold border-2 transition-all"
            style={{
              borderColor: done ? C.teal : '#e5e7eb',
              backgroundColor: done ? `${C.teal}15` : 'transparent',
              color: done ? C.teal : '#6b7280',
            }}>
            <CheckCircle2 size={15} />
            {paying ? 'Memproses...' : done ? 'Sudah ditransfer ✓' : 'Tandai sudah ditransfer'}
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Member balance row ───────────────────────────────────────────────────────
function MemberRow({ member, idx }) {
  const net    = member.net_balance ?? 0
  const isPos  = net > 0
  const isZero = net === 0
  const color  = isZero ? '#9ca3af' : isPos ? C.teal : '#ef4444'
  const avatarColors = [C.navy, C.teal, C.blue, '#7c3aed', '#db2777', '#d97706']

  return (
    <div className="flex items-center gap-3 p-4 rounded-2xl bg-white border border-gray-100 hover:shadow-md transition-shadow">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-black shrink-0"
        style={{ backgroundColor: avatarColors[idx % avatarColors.length] }}>
        {member.name?.[0]?.toUpperCase() || '?'}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold truncate" style={{ color: C.navyDark }}>{member.name}</p>
        <p className="text-xs text-gray-400">{isZero ? 'Impas' : isPos ? 'Berhak menerima' : 'Perlu membayar'}</p>
      </div>
      <div className="text-right shrink-0">
        <p className="text-sm font-black" style={{ color }}>
          {isZero ? '±0' : isPos ? `+${rupiah(net)}` : `-${rupiah(net)}`}
        </p>
        <span className="rounded-full px-2 py-0.5 text-xs font-bold"
          style={{ backgroundColor: `${color}15`, color }}>
          {isZero ? 'Seimbang' : isPos ? 'Piutang' : 'Hutang'}
        </span>
      </div>
    </div>
  )
}

// ─── Empty state ──────────────────────────────────────────────────────────────
function Empty({ icon: Icon, title, sub, color }) {
  return (
    <div className="flex flex-col items-center gap-3 py-16 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl"
        style={{ backgroundColor: `${color ?? '#9ca3af'}15` }}>
        <Icon size={28} style={{ color: color ?? '#d1d5db' }} />
      </div>
      <p className="font-bold text-gray-400">{title}</p>
      {sub && <p className="text-sm text-gray-300">{sub}</p>}
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function SimplifyDebt() {
  const { user } = useAuth()
  const [grups, setGrups]             = useState([])
  const [selectedGrup, setSelected]   = useState('')
  const [transfers, setTransfers]     = useState([])
  const [members, setMembers]         = useState([])
  const [loading, setLoading]         = useState(false)
  const [loadingGrup, setLoadingGrup] = useState(true)
  const [error, setError]             = useState('')
  const [transferOpen, setTransferOpen] = useState(true)

  useEffect(() => {
  if (!user?.id) return
  api.get("/groups/my-groups")
    .then(r => {
      const raw = r.data?.data || r.data || []
      const mapped = raw.map(item => ({
        id:   item.groups?.id,
        name: item.groups?.group_name || '—',
      }))
      setGrups(mapped)
      if (mapped.length > 0) setSelected(mapped[0].id)
    })
    .catch(() => {})
    .finally(() => setLoadingGrup(false))
}, [user])

  const fetchData = useCallback(async () => {
    if (!selectedGrup) return
    setLoading(true); setError('')
    try {
      const [simplifyRes, recapRes] = await Promise.allSettled([
        api.get(`/settlements/${selectedGrup}/simplify`),
        api.get(`/settlements/${selectedGrup}/recap`),
      ])
      if (simplifyRes.status === 'fulfilled') {
        const raw = simplifyRes.value.data?.data || simplifyRes.value.data || []
        setTransfers(Array.isArray(raw) ? raw : raw.transactions || [])
      }
      if (recapRes.status === 'fulfilled') {
        const raw = recapRes.value.data?.data || recapRes.value.data || []
        const rawArr = Array.isArray(raw) ? raw : []

        // Normalize recap response ke format MemberRow expects
        // Backend: [{ debtor_id, debtor_name, creditor_id, creditor_name, total_debt }]
        // MemberRow expects: { user_id, name, net_balance }
        const balanceMap = {}
        rawArr.forEach(item => {
          if (!balanceMap[item.debtor_id])
            balanceMap[item.debtor_id] = { user_id: item.debtor_id, name: item.debtor_name, net_balance: 0 }
          if (!balanceMap[item.creditor_id])
            balanceMap[item.creditor_id] = { user_id: item.creditor_id, name: item.creditor_name, net_balance: 0 }
          // Debtor: net negatif (hutang), creditor: net positif (piutang)
          balanceMap[item.debtor_id].net_balance   -= Number(item.total_debt)
          balanceMap[item.creditor_id].net_balance += Number(item.total_debt)
        })
        setMembers(Object.values(balanceMap))
      }
      if (simplifyRes.status === 'rejected' && recapRes.status === 'rejected')
        setError('Gagal memuat data simplify debt.')
    } catch (e) {
      setError(e.response?.data?.message || 'Gagal memuat data simplify debt.')
    } finally { setLoading(false) }
  }, [selectedGrup])

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchData() }, [fetchData])

  const curGrup = grups.find(g => g.id === selectedGrup)
  const totalAmount = transfers.reduce((a, t) => a + (t.amount ?? 0), 0)

  return (
    <div className="flex flex-col min-h-screen" style={{ backgroundColor: C.bg }}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-100 px-6 py-4 sticky top-0 z-10">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl"
              style={{ backgroundColor: `${C.teal}18` }}>
              <GitMerge size={20} style={{ color: C.teal }} />
            </div>
            <div>
              <h1 className="text-lg font-bold" style={{ color: C.navyDark }}>Simplify Debt</h1>
              <p className="text-xs text-gray-400">Sederhanakan utang antar anggota jadi transfer seminimal mungkin</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {loadingGrup
              ? <Sk className="h-10 w-36 rounded-xl" />
              : grups.length > 0
              ? <GrupSelector grups={grups} selected={selectedGrup} onChange={setSelected} />
              : null
            }
            {selectedGrup && (
              <button onClick={fetchData}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-white hover:bg-gray-50 transition">
                <RefreshCw size={14} className={`text-gray-500 ${loading ? 'animate-spin' : ''}`} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Body ──────────────────────────────────────────────────────────── */}
      <div className="flex-1 px-6 py-6 space-y-5 max-w-4xl w-full mx-auto">

        {/* No grup */}
        {!loadingGrup && grups.length === 0 && (
          <Empty icon={GitMerge} title="Belum ada grup" sub="Buat grup dulu di halaman Grup" color={C.teal} />
        )}

        {selectedGrup && (
          <>
            {/* ── Banner efisiensi ──────────────────────────────────────── */}
            {!loading && !error && transfers.length > 0 && (
              <div className="rounded-2xl p-4 flex items-start gap-4"
                style={{
                  background: `linear-gradient(135deg, ${C.navy}08, ${C.teal}12)`,
                  border: `1px solid ${C.teal}30`,
                }}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                  style={{ backgroundColor: 'rgba(245,158,11,0.15)' }}>
                  <Zap size={17} style={{ color: '#f59e0b' }} />
                </div>
                <div>
                  <p className="text-sm font-black mb-0.5" style={{ color: C.navyDark }}>
                    Cukup {transfers.length} transfer untuk lunasin semua hutang{curGrup ? ` di "${curGrup.name}"` : ''}!
                  </p>
                  <p className="text-xs text-gray-500">Algoritma Talang.in sudah menghitung rute transfer paling efisien.</p>
                </div>
              </div>
            )}

            {/* ── Stat cards ────────────────────────────────────────────── */}
            {!loading && !error && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4">
                <StatCard
                  label="Jumlah Transfer"
                  value={transfers.length}
                  sub="transfer optimal"
                  icon={Hash}
                  color={C.teal}
                />
                <StatCard
                  label="Total Nominal"
                  value={rupiah(totalAmount)}
                  sub="total yang berpindah"
                  icon={CreditCard}
                  color={C.blue}
                />
                <StatCard
                  label="Anggota"
                  value={members.length}
                  sub="dalam grup ini"
                  icon={Users}
                  color={C.navy}
                />
              </div>
            )}

            {/* ── Loading ───────────────────────────────────────────────── */}
            {loading && (
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-2 sm:gap-4">
                  {[1,2,3].map(i => <Sk key={i} className="h-24" />)}
                </div>
                {[1,2,3].map(i => <Sk key={i} className="h-20" />)}
              </div>
            )}

            {/* ── Error ────────────────────────────────────────────────── */}
            {!loading && error && (
              <div className="flex flex-col items-center gap-3 py-16 text-center">
                <AlertCircle size={32} className="text-red-400" />
                <p className="text-sm text-gray-400">{error}</p>
                <button onClick={fetchData}
                  className="flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition">
                  <RefreshCw size={14} /> Coba Lagi
                </button>
              </div>
            )}

            {/* ── Content ──────────────────────────────────────────────── */}
            {!loading && !error && (
              <div className="space-y-5">

                {/* Transfer list */}
                <div>
                  <button
                    onClick={() => setTransferOpen(p => !p)}
                    className="flex items-center gap-2 mb-3 w-full text-left"
                  >
                    <GitMerge size={14} style={{ color: C.teal }} />
                    <span className="text-xs font-bold uppercase tracking-wide text-gray-400">Rencana Transfer Optimal</span>
                    {transfers.length > 0 && (
                      <span className="rounded-full px-2.5 py-0.5 text-xs font-black"
                        style={{ backgroundColor: `${C.teal}18`, color: C.teal }}>
                        {transfers.length}
                      </span>
                    )}
                    <ChevronDown
                      size={14}
                      className={`ml-auto text-gray-400 transition-transform duration-200 ${transferOpen ? 'rotate-180' : ''}`}
                    />
                  </button>

                  {transferOpen && transfers.length === 0 ? (
                    <div className="rounded-2xl bg-white border border-gray-100 shadow-sm">
                      <div className="flex flex-col items-center gap-3 py-14 text-center">
                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl"
                          style={{ backgroundColor: `${C.teal}15` }}>
                          <CheckCircle2 size={28} style={{ color: C.teal }} />
                        </div>
                        <p className="font-bold text-gray-600">Semua hutang sudah seimbang!</p>
                        <p className="text-sm text-gray-400 flex items-center gap-1.5">
                          Tidak ada transfer yang perlu dilakukan
                          <PartyPopper size={14} style={{ color: C.teal }} />
                        </p>
                      </div>
                    </div>
                  ) : transferOpen ?(
                    <div className="space-y-3">
                      {transfers.map((tx, i) => <TransferRow key={i} tx={tx} idx={i} onDone={fetchData} grupId={selectedGrup} />)}
                    </div>
                  ) : null }
                </div>

                {/* Member balances */}
                {members.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Users size={14} style={{ color: C.teal }} />
                      <span className="text-xs font-bold uppercase tracking-wide text-gray-400">Saldo Anggota</span>
                      <span className="rounded-full px-2.5 py-0.5 text-xs font-black"
                        style={{ backgroundColor: `${C.navy}12`, color: C.navy }}>
                        {members.length}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {members.map((m, i) => <MemberRow key={m.user_id ?? i} member={m} idx={i} />)}
                    </div>
                  </div>
                )}

                {/* Info note */}
                <div className="rounded-2xl p-4 flex items-start gap-3"
                  style={{ backgroundColor: `${C.blue}08`, border: `1px solid ${C.blue}20` }}>
                  <Info size={15} style={{ color: C.blue }} className="shrink-0 mt-0.5" />
                  <p className="text-xs text-gray-500 leading-relaxed">
                    Penyederhanaan ini tidak mengubah total hak dan kewajiban masing-masing anggota — hanya meminimalkan jumlah transfer yang perlu dilakukan. Centang setiap transfer setelah selesai dilakukan.
                  </p>
                </div>

              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}