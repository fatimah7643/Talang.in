import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
  Wallet,
  Users,
  AlertCircle,
  Loader2,
  RefreshCw,
  ArrowRight,
  ArrowUpRight,
  ArrowDownLeft,
  CheckCircle2,
  ChevronDown,
  Zap,
  CreditCard,
  // eslint-disable-next-line no-unused-vars
  TrendingUp,
  // eslint-disable-next-line no-unused-vars
  TrendingDown,
  // eslint-disable-next-line no-unused-vars
  Minus,
} from 'lucide-react'
import api from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'

/* ─────────────────────── HELPERS ───────────────────── */
const rupiah = (n) => 'Rp ' + Number(Math.abs(n) || 0).toLocaleString('id-ID')

const Sk = ({ className = '' }) => (
  <div className={`animate-pulse rounded-xl bg-gray-100 ${className}`} />
)

/* ─────────────────────── MODAL: SETTLE UP ──────────────────────── */
function ModalSettle({ debt, onClose, onSettled }) {
  const [loading, setLoading]         = useState(false)
  const [error, setError]             = useState('')
  const [notes, setNotes]             = useState('')
  const [paymentType, setPaymentType] = useState('full')
  const [partialAmount, setPartialAmount] = useState('')
  const toast = useToast()

  const handleSettle = async () => {
    setLoading(true); setError('')
    try {
      const splitIds = (debt.transactions || []).map(t => t.split_id).filter(Boolean)
      if (splitIds.length === 0) {
        setError('Tidak ada data split yang bisa dilunasi.')
        setLoading(false)
        return
      }

      if (paymentType === 'partial') {
        if (!partialAmount || parseFloat(partialAmount) <= 0) {
          setError('Masukkan nominal yang ingin dibayar.')
          setLoading(false)
          return
        }
        if (parseFloat(partialAmount) > debt.amount) {
          setError(`Nominal tidak boleh melebihi total hutang (${rupiah(debt.amount)}).`)
          setLoading(false)
          return
        }
        // Partial: bagi nominal ke semua split_id secara proporsional
        const perSplit = Math.floor(parseFloat(partialAmount) / splitIds.length)
        await Promise.all(
          splitIds.map(split_id =>
            api.put(`/settlements/splits/${split_id}/pay`, {
              payment_type: 'partial',
              amount: perSplit
            })
          )
        )
      } else {
        // Full
        await Promise.all(
          splitIds.map(split_id =>
            api.put(`/settlements/splits/${split_id}/pay`, { payment_type: 'full' })
          )
        )
      }
      
      toast.success('Berhasil menandai lunas.')
      onSettled(debt)
      onClose()
    } catch (e) {
      setError(e.response?.data?.message || 'Gagal menandai lunas.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-xl overflow-hidden border border-gray-100">
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#E1F5EE]">
              <CreditCard size={17} className="text-[#0F6E56]" />
            </div>
            <p className="font-semibold text-gray-800">Tandai Lunas</p>
          </div>
          {/* From → To */}
          <div className="flex items-center justify-between gap-3 rounded-xl bg-gray-50 px-4 py-3">
            <div className="text-center min-w-0">
              <div className="h-9 w-9 mx-auto flex items-center justify-center rounded-xl bg-[#232F72] text-white text-sm font-semibold">
                {debt.from_name?.[0]?.toUpperCase()}
              </div>
              <p className="text-xs mt-1.5 text-gray-500 font-medium truncate max-w-[72px]">{debt.from_name}</p>
            </div>
            <div className="flex flex-col items-center gap-1 flex-1">
              <ArrowRight size={16} className="text-gray-400" />
              <p className="text-sm font-bold text-gray-800">{rupiah(debt.amount)}</p>
            </div>
            <div className="text-center min-w-0">
              <div className="h-9 w-9 mx-auto flex items-center justify-center rounded-xl bg-[#1D9E75] text-white text-sm font-semibold">
                {debt.to_name?.[0]?.toUpperCase()}
              </div>
              <p className="text-xs mt-1.5 text-gray-500 font-medium truncate max-w-[72px]">{debt.to_name}</p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          <p className="text-sm text-gray-500">
            Konfirmasi bahwa <strong className="text-gray-700">{debt.from_name}</strong> sudah membayar ke{' '}
            <strong className="text-gray-700">{debt.to_name}</strong>.
          </p>

          {/* Toggle partial / full */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Tipe Pembayaran</label>
            <div className="grid grid-cols-2 gap-2 p-1 bg-gray-100 rounded-xl">
              {[
                { value: 'full',    label: 'Lunas Penuh' },
                { value: 'partial', label: 'Bayar Sebagian' },
              ].map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => { setPaymentType(opt.value); setPartialAmount('') }}
                  className={`py-2 rounded-lg text-sm font-medium transition-all
                    ${paymentType === opt.value
                      ? 'bg-white text-[#0F6E56] shadow-sm font-semibold'
                      : 'text-gray-500 hover:text-gray-700'}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Input nominal kalau partial */}
          {paymentType === 'partial' && (
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Nominal yang Dibayar
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-400">Rp</span>
                <input
                  type="number"
                  min="0"
                  max={debt.amount}
                  placeholder="0"
                  value={partialAmount}
                  onChange={e => setPartialAmount(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 pl-10 pr-4 py-2.5 text-sm
                    focus:border-[#1D9E75] focus:outline-none focus:ring-2 focus:ring-[#1D9E75]/20 transition-all"
                />
              </div>
              <p className="mt-1 text-xs text-gray-400">
                Sisa hutang: {rupiah(debt.amount - (parseFloat(partialAmount) || 0))}
              </p>
            </div>
          )}

          {/* Catatan */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Catatan <span className="text-gray-400 font-normal">(opsional)</span>
            </label>
            <input
              type="text"
              placeholder="cth. Transfer BCA"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm
                focus:border-[#1D9E75] focus:outline-none focus:ring-2 focus:ring-[#1D9E75]/20 transition-all"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600">
              <AlertCircle size={14} />{error}
            </div>
          )}

          <div className="flex gap-2.5 pt-1">
            <button
              onClick={onClose}
              className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-medium
                text-gray-600 hover:bg-gray-50 transition-all"
            >
              Batal
            </button>
            <button
              onClick={handleSettle}
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-[#1D9E75] py-2.5
                text-sm font-medium text-white hover:bg-[#0F6E56] transition-all disabled:opacity-60"
            >
              {loading
                ? <Loader2 size={14} className="animate-spin" />
                : <CheckCircle2 size={14} />}
              {paymentType === 'full' ? 'Tandai Lunas' : 'Bayar Sebagian'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─────────────────────── DEBT CARD ─────────────────────────────── */
function DebtCard({ debt, meId, onSettle }) {
  const iOwe   = debt.from_user_id === meId
  const isPaid = debt.status === 'settled'

  return (
    <div
      className={`flex items-center gap-4 rounded-xl border bg-white px-4 py-3.5 transition-all
        ${isPaid
          ? 'border-gray-100 opacity-55'
          : iOwe
              ? 'border-l-[3px] border-l-red-400 border-t-gray-100 border-r-gray-100 border-b-gray-100 hover:border-l-red-500'
              : debt.to_user_id === meId
                ? 'border-l-[3px] border-l-[#1D9E75] border-t-gray-100 border-r-gray-100 border-b-gray-100 hover:border-l-[#0F6E56]'
                : 'border border-gray-100'
        }`}
    >
      {/* Icon */}
      <div
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl
          ${isPaid ? 'bg-gray-100' : iOwe ? 'bg-red-50' : 'bg-[#E1F5EE]'}`}
      >
        {isPaid
          ? <CheckCircle2 size={16} className="text-gray-400" />
          : iOwe
            ? <ArrowUpRight size={16} className="text-red-500" />
            : <ArrowDownLeft size={16} className="text-[#1D9E75]" />}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-gray-800 truncate">
            {iOwe
              ? `Kamu → ${debt.to_name}`
              : debt.to_user_id === meId
                ? `${debt.from_name} → Kamu`
                : `${debt.from_name} → ${debt.to_name}`}
          </p>
          {isPaid && (
            <span className="shrink-0 rounded-full bg-gray-100 border border-gray-200 px-2 py-0.5 text-[10px] text-gray-400 font-medium">
              Lunas
            </span>
          )}
        </div>
        <p className="text-xs text-gray-400 truncate mt-0.5">{debt.group_name || '—'}</p>
      </div>

      {/* Amount + Action */}
      <div className="text-right shrink-0">
        <p className={`text-sm font-semibold ${isPaid ? 'text-gray-400' : iOwe ? 'text-red-500' : 'text-[#1D9E75]'}`}>
          {rupiah(debt.amount)}
        </p>
        {!isPaid && (
          <button
            onClick={() => onSettle(debt)}
            className={`mt-1.5 rounded-lg px-3 py-1 text-xs font-medium transition-all
              ${iOwe
                ? 'bg-red-50 text-red-500 hover:bg-red-100'
                : 'bg-[#E1F5EE] text-[#0F6E56] hover:bg-[#9FE1CB]/30'}`}
          >
           {iOwe ? 'Bayar' : debt.to_user_id === meId ? 'Konfirmasi' : null}
          </button>
        )}
      </div>
    </div>
  )
}

/* ─────────────────────── MEMBER BALANCE CARD ───────────────────── */
function MemberCard({ member, meId }) {
  const isMe   = member.user_id === meId
  const net    = member.net_balance ?? 0
  const isPos  = net > 0
  const isZero = net === 0

  return (
    <div
      className={`rounded-xl border bg-white p-4 transition-all
        ${isMe ? 'border-[#9FE1CB]' : 'border-gray-100'}`}
    >
      {/* Avatar + Name */}
      <div className="flex items-center gap-3 mb-3">
        <div
          className={`flex h-9 w-9 items-center justify-center rounded-xl text-white text-sm font-semibold shrink-0
            ${isMe ? 'bg-[#232F72]' : 'bg-[#1D9E75]'}`}
        >
          {member.name?.[0]?.toUpperCase() || 'A'}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-800 truncate">
            {member.name}
            {isMe && <span className="ml-1.5 text-xs text-[#1D9E75] font-normal">(kamu)</span>}
          </p>
          <p className="text-xs text-gray-400 truncate">{member.email || ''}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-1.5">
        <div className="rounded-lg bg-gray-50 px-2 py-2 text-center">
          <p className="text-[10px] text-gray-400 mb-0.5">Dibayar</p>
          <p className="text-xs font-semibold text-gray-700">{rupiah(member.total_paid)}</p>
        </div>
        <div className="rounded-lg bg-gray-50 px-2 py-2 text-center">
          <p className="text-[10px] text-gray-400 mb-0.5">Porsi</p>
          <p className="text-xs font-semibold text-gray-700">{rupiah(member.total_owed)}</p>
        </div>
        <div
          className={`rounded-lg px-2 py-2 text-center
            ${isZero ? 'bg-gray-50' : isPos ? 'bg-[#E1F5EE]' : 'bg-red-50'}`}
        >
          <p className="text-[10px] text-gray-400 mb-0.5">Saldo</p>
          <p className={`text-xs font-semibold ${isZero ? 'text-gray-500' : isPos ? 'text-[#0F6E56]' : 'text-red-500'}`}>
            {isZero ? '±0' : isPos ? `+${rupiah(net)}` : `-${rupiah(net)}`}
          </p>
        </div>
      </div>
    </div>
  )
}

/* ─────────────────────── SIMPLIFY DEBT PANEL ───────────────────── */
function SimplifyPanel({ grupId, grupName, onDone }) {
  const [result, setResult]   = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const [done, setDone]       = useState(false)

  const run = async () => {
    setLoading(true); setError('')
    try {
      // Endpoint benar: GET /settlements/:group_id/simplify
      const res = await api.get(`/settlements/${grupId}/simplify`)
      // Response: { data: [{ from, from_name, to, to_name, amount }] }
      setResult({ transactions: res.data?.data || [] })
      setDone(true)
    } catch (e) {
      setError(e.response?.data?.message || 'Gagal menyederhanakan hutang.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-xl border border-[#9FE1CB] bg-white p-5">
      <div className="flex items-start gap-3 mb-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#E1F5EE] shrink-0">
          <Zap size={16} className="text-[#0F6E56]" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-gray-800">Simplify Debt</h3>
          <p className="text-xs text-gray-400 mt-0.5">
            Kurangi jumlah transaksi di grup <strong className="text-gray-600">{grupName}</strong>
          </p>
        </div>
      </div>

      {!done ? (
        <>
          <p className="text-sm text-gray-500 mb-4">
            Algoritma akan menghitung ulang siapa harus bayar siapa dengan jumlah transfer paling sedikit.
          </p>
          {error && (
            <div className="mb-3 flex items-center gap-2 rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600">
              <AlertCircle size={14} />{error}
            </div>
          )}
          <button
            onClick={run}
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#1D9E75] py-2.5
              text-sm font-medium text-white hover:bg-[#0F6E56] transition-all disabled:opacity-60"
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />}
            {loading ? 'Memproses...' : 'Jalankan Simplify'}
          </button>
        </>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium text-[#0F6E56]">
            <CheckCircle2 size={15} />
            Selesai! Transaksi yang disederhanakan:
          </div>
          {result?.transactions?.length > 0 ? (
            result.transactions.map((t, i) => (
              <div key={i} className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
                <div className="h-7 w-7 flex items-center justify-center rounded-lg bg-[#232F72] text-white text-xs font-semibold">
                  {t.from_name?.[0]?.toUpperCase()}
                </div>
                <ArrowRight size={13} className="text-gray-400" />
                <div className="h-7 w-7 flex items-center justify-center rounded-lg bg-[#1D9E75] text-white text-xs font-semibold">
                  {t.to_name?.[0]?.toUpperCase()}
                </div>
                <div className="flex-1">
                  <p className="text-xs text-gray-600">{t.from_name} → {t.to_name}</p>
                </div>
                <span className="text-sm font-semibold text-gray-800">{rupiah(t.amount)}</span>
              </div>
            ))
          ) : (
            <p className="text-sm text-gray-500 text-center py-2">Semua hutang sudah seimbang! 🎉</p>
          )}
          <button
            onClick={() => { setDone(false); setResult(null); onDone?.() }}
            className="w-full rounded-xl border border-gray-200 py-2 text-sm font-medium
              text-gray-600 hover:bg-gray-50 transition-all"
          >
            Tutup
          </button>
        </div>
      )}
    </div>
  )
}

/* ─────────────────────── GRUP SELECTOR ─────────────────────────── */
function GrupSelector({ grups, selected, onChange }) {
  const [open, setOpen] = useState(false)
  const cur = grups.find(g => g.id === selected)

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(p => !p)}
        className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3.5 py-2
          text-sm font-medium text-gray-700 hover:border-gray-300 transition-all"
      >
        <Users size={14} className="text-gray-400" />
        {cur?.name || 'Pilih Grup'}
        <ChevronDown
          size={13}
          className={`text-gray-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && (
        <div className="absolute left-0 top-11 z-20 w-56 rounded-xl border border-gray-100 bg-white py-1.5 shadow-lg">
          {grups.map(g => (
            <button
              key={g.id}
              onClick={() => { onChange(g.id); setOpen(false) }}
              className={`flex w-full items-center gap-3 px-4 py-2.5 text-sm transition-all
                ${g.id === selected
                  ? 'bg-[#E1F5EE] text-[#0F6E56] font-medium'
                  : 'text-gray-700 hover:bg-gray-50'}`}
            >
              <Users size={13} className="shrink-0" />
              {g.name}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

/* ─────────────────────── SUMMARY CARD ──────────────────────────── */
function SummaryCard({ label, value, sub, dotColor, valueColor, subColor }) {
  return (
    <div className="rounded-xl border border-gray-100 bg-white p-4">
      <div className="flex items-center gap-2 mb-2">
        <span className={`h-2 w-2 rounded-full shrink-0 ${dotColor}`} />
        <p className="text-xs text-gray-400">{label}</p>
      </div>
      <p className={`text-xl font-semibold ${valueColor}`}>{value}</p>
      {sub && <p className={`text-xs mt-1 ${subColor}`}>{sub}</p>}
    </div>
  )
}

/* ─────────────────────── HALAMAN UTAMA ─────────────────────────── */
export default function BalancePage() {
  const { user }                        = useAuth()
  const [grups, setGrups]               = useState([])
  const [selectedGrup, setSelectedGrup] = useState('')
  const [balances, setBalances]         = useState([])
  const [debts, setDebts]               = useState([])
  const [loading, setLoading]           = useState(false)
  const [loadingGrup, setLoadingGrup]   = useState(true)
  const [error, setError]               = useState('')
  const [showSimplify, setShowSimplify] = useState(false)
  const [modalSettle, setModalSettle]   = useState(null)
  const [tab, setTab]                   = useState('debts')
  // akumulasi total yang sudah lunas dan jumlah transaksi yang sudah lunas, untuk ditampilkan di summary card
  const [settledAmount, setSettledAmount] = useState(0)
  const [settledCount, setSettledCount]   = useState(0)


  const meId = user?.id

  // Fetch grup milik user (bukan semua grup)
  useEffect(() => {
    if (!user?.id) return
    api.get("/groups/my-groups")
      .then(r => {
        const raw = r.data?.data || r.data || []
        // Response: [{ role, joined_at, groups: { id, group_name } }]
        const mapped = raw.map(item => ({
          id:   item.groups?.id   || item.id,
          name: item.groups?.group_name || item.name || '—',
        }))
        setGrups(mapped)
        if (mapped.length > 0) setSelectedGrup(mapped[0].id)
      })
      .catch(() => {})
      .finally(() => setLoadingGrup(false))
  }, [user])

  const fetchBalance = useCallback(async (gid) => {
    if (!gid) return
    setLoading(true); setError('')
    try {
      // Gunakan endpoint yang benar: /settlements/:group_id/recap
      const recapRes = await api.get(`/settlements/${gid}/recap`)
      const recap = recapRes.data?.data || []

      // Normalize recap → format DebtCard expects
      // Backend: { debtor_id, debtor_name, creditor_id, creditor_name, total_debt }
      const normalizedDebts = recap.map(item => ({
        from_user_id: item.debtor_id,
        from_name:    item.debtor_name,
        to_user_id:   item.creditor_id,
        to_name:      item.creditor_name,
        amount:       item.total_debt,
        group_id:     gid,
        group_name:   grups.find(g => String(g.id) === String(gid))?.name || '—',
        status:       'active',
        // Simpan transactions untuk settle per-split nanti
        transactions: item.transactions || [],
      }))


      const myDebts = normalizedDebts.filter(d =>
        d.from_user_id === meId || d.to_user_id === meId
      )
      setDebts(myDebts)
      // Build member balances dari recap (net per user)
      const balanceMap = {}
      recap.forEach(item => {
        if (!balanceMap[item.debtor_id])
          balanceMap[item.debtor_id] = { user_id: item.debtor_id, name: item.debtor_name, total_paid: 0, total_owed: 0 }
        if (!balanceMap[item.creditor_id])
          balanceMap[item.creditor_id] = { user_id: item.creditor_id, name: item.creditor_name, total_paid: 0, total_owed: 0 }
        balanceMap[item.debtor_id].total_owed   += item.total_debt
        balanceMap[item.creditor_id].total_paid += item.total_debt
      })
      const memberBalances = Object.values(balanceMap).map(m => ({
        ...m,
        net_balance: m.total_paid - m.total_owed,
      }))
      setBalances(memberBalances)

    } catch (e) {
      setError(e.response?.data?.message || 'Gagal memuat data balance.')
    } finally {
      setLoading(false)
    }
  }, [grups, meId])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (selectedGrup) fetchBalance(selectedGrup)
  }, [selectedGrup, fetchBalance])

  const handleSettled = (debt) => {
    // Hapus dari list aktif + track ke settled state
    setDebts(p => p.filter(d =>
      !(d.from_user_id === debt.from_user_id && d.to_user_id === debt.to_user_id)
    ))
    setSettledAmount(prev => prev + (debt.amount || 0))
    setSettledCount(prev => prev + 1)
    setTimeout(() => fetchBalance(selectedGrup), 500)
  }

  const myDebt    = debts.filter(d => d.from_user_id === meId && d.status !== 'settled').reduce((a, d) => a + (d.amount || 0), 0)
  const myReceive = debts.filter(d => d.to_user_id   === meId && d.status !== 'settled').reduce((a, d) => a + (d.amount || 0), 0)
  const net = myReceive - myDebt

  const activeDebts  = debts.filter(d => d.status !== 'settled')
  const settledDebts = debts.filter(d => d.status === 'settled')
  const curGrup      = grups.find(g => g.id === selectedGrup)

  const myActiveDebtCount    = debts.filter(d => d.from_user_id === meId && d.status !== 'settled').length
  const myActivePiutangCount = debts.filter(d => d.to_user_id   === meId && d.status !== 'settled').length

  return (
    <div className="flex h-full flex-col overflow-hidden bg-gray-50">
      {/* ── Topbar ── */}
      <header className="flex items-center justify-between border-b border-gray-100 bg-white px-6 py-3.5 shrink-0 gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#E1F5EE]">
            <Wallet size={18} className="text-[#1D9E75]" />
          </div>
          <div>
            <h1 className="text-base font-semibold text-gray-900">Balance</h1>
            <p className="text-xs text-gray-400">Saldo & hutang antar anggota</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {loadingGrup ? (
            <Sk className="h-9 w-36" />
          ) : grups.length > 0 ? (
            <GrupSelector grups={grups} selected={selectedGrup} onChange={setSelectedGrup} />
          ) : null}

          {selectedGrup && (
            <button
              onClick={() => setShowSimplify(p => !p)}
              className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-medium transition-all
                ${showSimplify
                  ? 'bg-[#1D9E75] text-white border border-[#1D9E75]'
                  : 'border border-[#1D9E75] text-[#0F6E56] hover:bg-[#E1F5EE]'}`}
            >
              <Zap size={14} />
              <span className="hidden sm:inline">Simplify</span>
            </button>
          )}

          {selectedGrup && (
            <button
              onClick={() => fetchBalance(selectedGrup)}
              className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3.5 py-2
                text-sm text-gray-500 hover:bg-gray-50 transition-all"
            >
              <RefreshCw size={13} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          )}
        </div>
      </header>

      {/* ── Content ── */}
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">

        {/* No grup */}
        {!loadingGrup && grups.length === 0 && (
          <div className="flex flex-col items-center gap-4 py-20 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100">
              <Wallet size={24} className="text-gray-300" />
            </div>
            <div>
              <p className="font-medium text-gray-500">Belum ada grup</p>
              <p className="text-sm text-gray-400 mt-1">Buat grup dulu di halaman Grup</p>
            </div>
            <Link
              to="/grup"
              className="rounded-xl bg-[#232F72] px-5 py-2.5 text-sm font-medium text-white
                hover:bg-[#121358] transition-all"
            >
              Ke Halaman Grup
            </Link>
          </div>
        )}

        {selectedGrup && (
          <>
            {/* ── Summary Cards ── */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <SummaryCard
                label="Harus Dibayar"
                value={rupiah(myDebt)}
                sub={`${myActiveDebtCount} tagihan aktif`}
                dotColor="bg-red-400"
                valueColor="text-red-500"
                subColor="text-red-400"
              />
              <SummaryCard
                label="Akan Diterima"
                value={rupiah(myReceive)}
                sub={`${myActivePiutangCount} piutang aktif`}
                dotColor="bg-[#1D9E75]"
                valueColor="text-[#0F6E56]"
                subColor="text-[#1D9E75]"
              />
              <SummaryCard
                label="Net Balance"
                value={net === 0 ? 'Impas' : (net > 0 ? '+' : '−') + rupiah(net)}
                sub={net > 0 ? 'Masih punya piutang' : net < 0 ? 'Masih punya hutang' : 'Semua seimbang'}
                dotColor={net > 0 ? 'bg-[#232F72]' : net < 0 ? 'bg-red-500' : 'bg-gray-300'}
                valueColor={net > 0 ? 'text-[#232F72]' : net < 0 ? 'text-red-500' : 'text-gray-400'}
                subColor="text-gray-400"
              />
              <SummaryCard
                label="Sudah Lunas"
                value={rupiah(settledAmount)}
                sub={`${settledCount} transaksi selesai`}
                dotColor="bg-gray-300"
                valueColor="text-gray-500"
                subColor="text-gray-400"
              />
            </div>

            {/* ── Simplify Panel ── */}
            {showSimplify && curGrup && (
              <SimplifyPanel
                grupId={selectedGrup}
                grupName={curGrup.name}
                onDone={() => fetchBalance(selectedGrup)}
              />
            )}

            {/* ── Tabs ── */}
            <div className="flex items-center justify-between">
              <div className="flex gap-1 rounded-xl bg-gray-100 p-1 w-fit">
                {[
                  { id: 'debts',   label: `Hutang/Piutang (${activeDebts.length})` },
                  { id: 'members', label: `Anggota (${balances.length})` },
                ].map(t => (
                  <button
                    key={t.id}
                    onClick={() => setTab(t.id)}
                    className={`rounded-lg px-4 py-1.5 text-sm font-medium transition-all
                      ${tab === t.id
                        ? 'bg-white text-gray-800 shadow-sm border border-gray-100'
                        : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* ── States ── */}
            {loading ? (
              <div className="space-y-2.5">
                {[1, 2, 3, 4].map(i => <Sk key={i} className="h-[66px] rounded-xl" />)}
              </div>
            ) : error ? (
              <div className="flex flex-col items-center gap-3 py-12 text-center">
                <AlertCircle size={28} className="text-red-400" />
                <p className="text-sm text-gray-500">{error}</p>
                <button
                  onClick={() => fetchBalance(selectedGrup)}
                  className="flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2
                    text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all"
                >
                  <RefreshCw size={13} />Coba Lagi
                </button>
              </div>
            ) : tab === 'debts' ? (
              /* ── Debts Tab ── */
              <div className="space-y-5">
                {activeDebts.length === 0 && settledDebts.length === 0 ? (
                  <div className="flex flex-col items-center gap-3 py-16 text-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100">
                      <CheckCircle2 size={24} className="text-gray-300" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-500">Tidak ada hutang</p>
                      <p className="mt-1 text-sm text-gray-400">Semua sudah beres! 🎉</p>
                    </div>
                  </div>
                ) : (
                  <>
                    {activeDebts.length > 0 && (
                      <div>
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">Aktif</p>
                        <div className="space-y-2">
                          {activeDebts.map((d, i) => (
                            <DebtCard key={i} debt={d} meId={meId} onSettle={setModalSettle} />
                          ))}
                        </div>
                      </div>
                    )}
                    {settledDebts.length > 0 && (
                      <div>
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">Sudah Lunas</p>
                        <div className="space-y-2">
                          {settledDebts.map((d, i) => (
                            <DebtCard key={i} debt={d} meId={meId} onSettle={setModalSettle} />
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            ) : (
              /* ── Members Tab ── */
              <div>
                {balances.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-12">Belum ada data anggota.</p>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {balances.map((m, i) => (
                      <MemberCard key={i} member={m} meId={meId} />
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Modal ── */}
      {modalSettle && (
        <ModalSettle
          debt={modalSettle}
          onClose={() => setModalSettle(null)}
          onSettled={handleSettled}
        />
      )}
    </div>
  )
}