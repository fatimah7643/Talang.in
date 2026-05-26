/* eslint-disable no-unused-vars */
import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import {
  ArrowLeftRight, Plus, Search, Filter, X, ChevronDown, AlertCircle,
  Loader2, RefreshCw, Receipt, Calendar, User, Users,
  SplitSquareHorizontal, CheckCircle2, Clock, ChevronLeft, ChevronRight,
  Wallet, BarChart2, Sparkles,
} from 'lucide-react'
import api from '../../services/api'
import { useAuth } from '../../context/AuthContext'

/* ─────────────────────── CONSTANTS ─────────────────────────── */
const KATEGORI = [
  'Makanan & Minuman', 'Transportasi', 'Belanja', 'Hiburan',
  'Tagihan', 'Kesehatan', 'Pendidikan', 'Lainnya',
]

const STATUS_CONFIG = {
  lunas:   { cls: 'status-lunas',   label: 'Lunas',   icon: CheckCircle2 },
  pending: { cls: 'status-pending', label: 'Pending', icon: Clock },
  batal:   { cls: 'status-batal',   label: 'Batal',   icon: X },
}

const SPLIT_METHODS = [
  { value: 'equal',      label: 'Rata' },
  { value: 'custom',     label: 'Custom' },
  { value: 'percentage', label: 'Persentase' },
]

const CATEGORY_ICON = {
  'Makanan & Minuman': '🍜',
  'Transportasi': '🚗',
  'Belanja': '🛍️',
  'Hiburan': '🎬',
  'Tagihan': '📋',
  'Kesehatan': '💊',
  'Pendidikan': '📚',
  'Lainnya': '📦',
}

/* ─────────────────────── HELPERS ───────────────────────────── */
const rupiah  = (n) => 'Rp ' + Number(n || 0).toLocaleString('id-ID')
const fmtDate = (d) => d
  ? new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
  : '—'

/* ─────────────────────── SKELETON ──────────────────────────── */
const Sk = ({ className = '' }) => (
  <div className={`animate-pulse rounded-lg bg-gray-100 ${className}`} />
)

/* ─────────────────────── FUZZY NAME MATCH ──────────────────────── */
const normalize = (s) => (s || '').toLowerCase().replace(/[^a-z0-9]/g, '')
const fuzzyMatchName = (query, fullName) => {
  const q = normalize(query)
  const parts = (fullName || '').toLowerCase().split(/\s+/)
  return parts.some(p => normalize(p).startsWith(q) || q.startsWith(normalize(p)))
}
const extractMembersFromText = (text, members) => {
  const words = text.toLowerCase().split(/\s+/)
  return members.filter(m =>
    words.some(w => w.length >= 3 && fuzzyMatchName(w, m.name))
  )
}

/* ─────────────────────── MULTI SELECT MEMBER ───────────────────── */
function MultiSelectMember({ members, selected, onChange }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  const toggle = (id) =>
    onChange(selected.includes(id) ? selected.filter(x => x !== id) : [...selected, id])
  const selectAll = () => onChange(members.map(m => m.id))
  const clearAll  = () => onChange([])
  const selectedNames = members.filter(m => selected.includes(m.id))

  return (
    <div className="relative" ref={ref}>
      <button type="button" onClick={() => setOpen(p => !p)}
        className="w-full flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2.5 text-sm bg-white
          hover:border-[#232F72]/40 focus:border-[#232F72] focus:outline-none focus:ring-2 focus:ring-[#232F72]/20 transition-all text-left">
        <Users size={14} className="text-[#232F72] shrink-0" />
        <div className="flex-1 flex flex-wrap gap-1.5 min-h-[20px]">
          {selectedNames.length === 0 ? (
            <span className="text-gray-400">Pilih anggota yang ikut...</span>
          ) : selectedNames.length === members.length ? (
            <span className="text-gray-700 font-medium">Semua anggota ({members.length})</span>
          ) : (
            selectedNames.map(m => (
              <span key={m.id}
                className="inline-flex items-center gap-1 rounded-lg bg-[#232F72]/10 px-2 py-0.5 text-xs font-medium text-[#232F72]">
                {m.name.split(' ')[0]}
                <button type="button" onClick={(e) => { e.stopPropagation(); toggle(m.id) }}
                  className="hover:text-red-500 transition-colors"><X size={10} /></button>
              </span>
            ))
          )}
        </div>
        <ChevronDown size={13} className={`text-gray-400 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute left-0 top-[calc(100%+6px)] z-30 w-full rounded-2xl border border-gray-100 bg-white p-1.5 shadow-xl">
          <div className="flex gap-2 px-2 py-1.5 mb-1 border-b border-gray-50">
            <button type="button" onClick={selectAll}
              className="flex-1 text-xs font-medium text-[#232F72] hover:bg-[#232F72]/5 rounded-lg py-1 transition-colors">Pilih semua</button>
            <div className="w-px bg-gray-100" />
            <button type="button" onClick={clearAll}
              className="flex-1 text-xs font-medium text-gray-400 hover:bg-gray-50 rounded-lg py-1 transition-colors">Hapus semua</button>
          </div>
          {members.map(m => {
            const isSelected = selected.includes(m.id)
            return (
              <button key={m.id} type="button" onClick={() => toggle(m.id)}
                className={`flex w-full items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all
                  ${isSelected ? 'bg-[#232F72] text-white' : 'text-gray-600 hover:bg-gray-50'}`}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0
                  ${isSelected ? 'bg-white/20 text-white' : 'bg-[#232F72]/10 text-[#232F72]'}`}>
                  {m.name?.[0]?.toUpperCase()}
                </div>
                <span className="flex-1 text-left truncate">{m.name}</span>
                {isSelected && (
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M2.5 7L5.5 10L11.5 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

/* ─────────────────────── MODAL TAMBAH TRANSAKSI ───────────────── */
function ModalTambah({ grups, onClose, onAdded, currentUser }) {
  const [step, setStep] = useState(1)
  const [form, setForm] = useState({
    group_id: grups[0]?.id || '',
    title: '', amount: '', category: KATEGORI[0],
    date: new Date().toISOString().slice(0, 10),
    notes: '', split_method: 'equal',
  })
  const [members, setMembers]                 = useState([])
  const [selectedMembers, setSelectedMembers] = useState([])
  const [payers, setPayers]                   = useState([]) // [{ member_id, amount }]
  const [splits, setSplits]                   = useState([]) // custom split per member
  const [loading, setLoading]                 = useState(false)
  const [loadMem, setLoadMem]                 = useState(false)
  const [error, setError]                     = useState('')
  const [payerDropOpen, setPayerDropOpen]     = useState(false)
  const payerRef = useRef(null)

  useEffect(() => {
    const h = (e) => { if (payerRef.current && !payerRef.current.contains(e.target)) setPayerDropOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  useEffect(() => {
    if (!form.group_id) return
    const loadMembers = async () => {
      setLoadMem(true)
      try {
        const r = await api.get(`/groups/${form.group_id}/members`)
        const raw = r.data?.data || r.data || []
        const mem = raw.map(item => ({
          id:   item.profiles?.id   || item.id,
          name: item.profiles?.full_name || item.profiles?.username || item.name || '—',
        }))
        setMembers(mem)
        setSelectedMembers(mem.map(m => m.id))
        setSplits(mem.map(m => ({ user_id: m.id, name: m.name, amount: '', percentage: '' })))
        setPayers([])
      } catch (err) {
        console.error(err)
      } finally { setLoadMem(false) }
    }
    loadMembers()
  }, [form.group_id])

  // Toggle payer di dropdown
  const togglePayer = (member) => {
    setPayers(prev => {
      const exists = prev.find(p => p.member_id === member.id)
      if (exists) return prev.filter(p => p.member_id !== member.id)
      return [...prev, { member_id: member.id, name: member.name, amount: '' }]
    })
  }

  const updatePayerAmount = (member_id, amount) => {
    setPayers(prev => prev.map(p => p.member_id === member_id ? { ...p, amount } : p))
  }

  // Total yang sudah diisi payer
  const totalPaid = payers.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0)
  const totalAmount = parseFloat(form.amount) || 0

  // Equal splits preview
  const equalSplits = useMemo(() => {
    if (form.split_method !== 'equal' || !form.amount || !selectedMembers.length) return []
    const active = members.filter(m => selectedMembers.includes(m.id))
    if (!active.length) return []
    const each = Math.floor(totalAmount / active.length)
    const rem = totalAmount - each * active.length
    return active.map((m, idx) => ({ user_id: m.id, name: m.name, amount: idx === 0 ? each + rem : each }))
  }, [form.split_method, form.amount, selectedMembers, members, totalAmount])

  const handleSplitChange = (userId, field, val) =>
    setSplits(p => p.map(s => s.user_id === userId ? { ...s, [field]: val } : s))

  const validateStep1 = () => {
    if (!form.group_id)                                           return 'Pilih grup terlebih dahulu.'
    if (!form.title.trim())                                       return 'Judul transaksi wajib diisi.'
    if (!form.amount || isNaN(form.amount) || +form.amount <= 0) return 'Nominal tidak valid.'
    if (payers.length === 0)                                      return 'Pilih minimal 1 orang yang bayar.'
    const emptyPayer = payers.find(p => !p.amount || parseFloat(p.amount) <= 0)
    if (emptyPayer)                                               return `Isi nominal yang dibayar oleh ${emptyPayer.name}.`
    if (Math.abs(totalPaid - totalAmount) > 1)                   return `Total dibayar (${rupiah(totalPaid)}) harus sama dengan total tagihan (${rupiah(totalAmount)}).`
    if (selectedMembers.length === 0)                             return 'Pilih minimal 1 anggota.'
    return ''
  }

  const handleNext = () => {
    const err = validateStep1()
    if (err) { setError(err); return }
    setError(''); setStep(2)
  }

  const handleSubmit = async () => {
    setLoading(true); setError('')
    try {
      const activeMembers = members.filter(m => selectedMembers.includes(m.id))

      // Validasi custom
      if (form.split_method === 'custom') {
        const totalCustom = activeMembers.reduce((sum, m) => {
          const found = splits.find(s => s.user_id === m.id)
          return sum + parseFloat(found?.amount || 0)
        }, 0)
        if (Math.abs(totalCustom - totalAmount) > 1) {
          setError(`Total split ${rupiah(totalCustom)} harus sama dengan ${rupiah(totalAmount)}`)
          setLoading(false); return
        }
      }

      // Validasi persentase
      if (form.split_method === 'percentage') {
        const totalPct = activeMembers.reduce((sum, m) => {
          const found = splits.find(s => s.user_id === m.id)
          return sum + parseFloat(found?.percentage || 0)
        }, 0)
        if (Math.abs(totalPct - 100) > 0.5) {
          setError(`Total persentase ${totalPct}% harus 100%`)
          setLoading(false); return
        }
      }

      // Hitung porsi tiap member
      const getMemberShare = (memberId, idx) => {
        if (form.split_method === 'equal') {
          const each = Math.floor(totalAmount / activeMembers.length)
          const rem  = totalAmount - each * activeMembers.length
          return idx === 0 ? each + rem : each
        } else if (form.split_method === 'custom') {
          const found = splits.find(s => s.user_id === memberId)
          return parseFloat(found?.amount || 0)
        } else {
          const found = splits.find(s => s.user_id === memberId)
          return Math.round(totalAmount * (parseFloat(found?.percentage || 0) / 100))
        }
      }

      const memberShareMap = {}
      activeMembers.forEach((m, idx) => {
        memberShareMap[m.id] = getMemberShare(m.id, idx)
      })

      // Buat bill terpisah per payer
      // Tiap payer nagih ke member lain (bukan dirinya) secara proporsional
      const grup = grups.find(g => String(g.id) === String(form.group_id))
      const addedTrxs = []

      for (const payer of payers) {
        const payerAmount = parseFloat(payer.amount)
        // Member yang berhutang ke payer ini = semua active member kecuali payer sendiri
        const debtors = activeMembers.filter(m => m.id !== payer.member_id)

        if (debtors.length === 0) continue

        // Hitung proporsi hutang ke payer ini
        // Berdasarkan share tiap member dibanding total share non-payer
        let splitsPayload = []

        // memberShareMap langsung
        splitsPayload = debtors.map(m => ({
          member_id:    m.id,
          share_amount: memberShareMap[m.id] || 0,
        })).filter(s => s.share_amount > 0)

        const payload = {
          group_id:    form.group_id,
          payer_id:    payer.member_id,
          amount:      totalAmount,
          description: form.title,
          category:    form.category,
          split_method: form.split_method,
          splits:      splitsPayload,
        }

        const res  = await api.post('/bills/split', payload)
        const bill = res.data?.bill_summary || {}
        addedTrxs.push({
          id:           bill.id,
          title:        bill.description || form.title,
          amount:       bill.amount      || totalAmount,
          category:     bill.category    || form.category,
          date:         bill.created_at  || form.date,
          status:       'pending',
          split_method: form.split_method,
          group_name:   grup?.name || '—',
          paid_by_name: payer.name,
          splits:       (res.data?.split_details || []).map(s => ({
            name:   s.member_id,
            amount: s.share_amount,
            status: 'pending',
          })),
        })
      }

      addedTrxs.forEach(t => onAdded(t))
      onClose()
    } catch (e) {
      setError(e.response?.data?.message || 'Gagal menambah transaksi.')
    } finally {
      setLoading(false)
    }
  }

  const inp = 'w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-[#232F72] focus:outline-none focus:ring-2 focus:ring-[#232F72]/20 bg-white transition-all'

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl bg-white shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 shrink-0">
          <div className="flex items-center gap-3">
            {step === 2 && (
              <button onClick={() => setStep(1)}
                className="rounded-xl p-1.5 text-gray-400 hover:bg-gray-100 transition-all -ml-1.5">
                <ChevronLeft size={18} />
              </button>
            )}
            <div>
              <h2 className="text-base font-bold text-[#121358]">
                {step === 1 ? 'Tambah Transaksi' : 'Atur Pembagian'}
              </h2>
              <div className="flex items-center gap-2 mt-0.5">
                {[1, 2].map(s => (
                  <div key={s}
                    className={`h-1 rounded-full transition-all duration-300 ${s <= step ? 'w-8 bg-[#232F72]' : 'w-4 bg-gray-200'}`} />
                ))}
                <span className="text-xs text-gray-400 ml-1">Langkah {step}/2</span>
              </div>
            </div>
          </div>
          <button onClick={onClose}
            className="rounded-xl p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-all">
            <X size={17} />
          </button>
        </div>

        <div className="px-6 pb-6 overflow-y-auto flex-1">
          {step === 1 ? (
            <div className="space-y-4">
              {/* Grup */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Grup</label>
                <select value={form.group_id}
                  onChange={e => setForm(p => ({ ...p, group_id: e.target.value }))} className={inp}>
                  {grups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                </select>
              </div>

              {/* Judul */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                  Judul <span className="text-red-400 normal-case">*</span>
                </label>
                <input type="text" placeholder="cth. Makan siang bareng" value={form.title}
                  onChange={e => setForm(p => ({ ...p, title: e.target.value }))} className={inp} />
              </div>

              {/* Nominal */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                  Nominal <span className="text-red-400 normal-case">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-400">Rp</span>
                  <input type="number" min="0" placeholder="50.000" value={form.amount}
                    onChange={e => setForm(p => ({ ...p, amount: e.target.value }))}
                    className={`${inp} pl-10`} />
                </div>
              </div>

              {/* Kategori + Tanggal */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Kategori</label>
                  <select value={form.category}
                    onChange={e => setForm(p => ({ ...p, category: e.target.value }))} className={inp}>
                    {KATEGORI.map(k => <option key={k}>{k}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Tanggal</label>
                  <input type="date" value={form.date}
                    onChange={e => setForm(p => ({ ...p, date: e.target.value }))} className={inp} />
                </div>
              </div>

              {/* Metode split */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Metode Split</label>
                <div className="grid grid-cols-3 gap-2 p-1 bg-gray-100 rounded-xl">
                  {SPLIT_METHODS.map(m => (
                    <button key={m.value} type="button"
                      onClick={() => setForm(p => ({ ...p, split_method: m.value }))}
                      className={`py-2 rounded-lg text-sm font-medium transition-all
                        ${form.split_method === m.value
                          ? 'bg-white text-[#232F72] shadow-sm font-semibold'
                          : 'text-gray-500 hover:text-gray-700'}`}>
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Anggota Ikut */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                  Anggota Ikut
                  {selectedMembers.length > 0 && (
                    <span className="ml-2 normal-case text-[#36ADA3] font-normal">{selectedMembers.length} dipilih</span>
                  )}
                </label>
                {loadMem ? <Sk className="h-10" /> : members.length === 0 ? (
                  <p className="text-xs text-gray-400 py-2">Pilih grup dulu untuk melihat anggota.</p>
                ) : (
                  <MultiSelectMember members={members} selected={selectedMembers} onChange={setSelectedMembers} />
                )}
              </div>

              {/* Dibayar Oleh — multi-payer checklist dropdown */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                  Dibayar Oleh <span className="text-red-400 normal-case">*</span>
                </label>
                {loadMem ? <Sk className="h-10" /> : members.length === 0 ? (
                  <p className="text-xs text-gray-400 py-2">Pilih grup dulu untuk melihat anggota.</p>
                ) : (
                  <div className="relative" ref={payerRef}>
                    {/* Trigger */}
                    <button type="button" onClick={() => setPayerDropOpen(p => !p)}
                      className="w-full flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2.5 text-sm bg-white
                        hover:border-[#232F72]/40 focus:border-[#232F72] focus:outline-none focus:ring-2 focus:ring-[#232F72]/20 transition-all text-left">
                      <User size={14} className="text-[#232F72] shrink-0" />
                      <div className="flex-1 flex flex-wrap gap-1.5 min-h-[20px]">
                        {payers.length === 0 ? (
                          <span className="text-gray-400">Pilih siapa yang bayar duluan...</span>
                        ) : (
                          payers.map(p => (
                            <span key={p.member_id}
                              className="inline-flex items-center gap-1 rounded-lg bg-[#232F72]/10 px-2 py-0.5 text-xs font-medium text-[#232F72]">
                              {p.name.split(' ')[0]}
                              <button type="button" onClick={(e) => { e.stopPropagation(); togglePayer({ id: p.member_id, name: p.name }) }}
                                className="hover:text-red-500 transition-colors"><X size={10} /></button>
                            </span>
                          ))
                        )}
                      </div>
                      <ChevronDown size={13} className={`text-gray-400 shrink-0 transition-transform ${payerDropOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {/* Dropdown */}
                    {payerDropOpen && (
                      <div className="absolute left-0 top-[calc(100%+6px)] z-30 w-full rounded-2xl border border-gray-100 bg-white p-1.5 shadow-xl">
                        {members.map(m => {
                          const isSelected = payers.some(p => p.member_id === m.id)
                          return (
                            <button key={m.id} type="button" onClick={() => togglePayer(m)}
                              className={`flex w-full items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all
                                ${isSelected ? 'bg-[#232F72] text-white' : 'text-gray-600 hover:bg-gray-50'}`}>
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0
                                ${isSelected ? 'bg-white/20 text-white' : 'bg-[#232F72]/10 text-[#232F72]'}`}>
                                {m.name?.[0]?.toUpperCase()}
                              </div>
                              <span className="flex-1 text-left truncate">
                                {m.name}{m.id === currentUser?.id ? ' (Kamu)' : ''}
                              </span>
                              {isSelected && (
                                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                                  <path d="M2.5 7L5.5 10L11.5 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                              )}
                            </button>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* Input nominal per payer */}
                {payers.length > 0 && (
                  <div className="mt-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-gray-500 font-medium">Nominal yang ditanggung tiap pembayar</p>
                      <p className={`text-xs font-semibold ${Math.abs(totalPaid - totalAmount) < 1 ? 'text-[#36ADA3]' : 'text-red-400'}`}>
                        {rupiah(totalPaid)} / {rupiah(totalAmount)}
                      </p>
                    </div>
                    {payers.map(p => (
                      <div key={p.member_id} className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 px-3 py-2.5">
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#232F72] text-white text-xs font-bold shrink-0">
                          {p.name?.[0]?.toUpperCase()}
                        </div>
                        <span className="flex-1 text-sm font-medium text-gray-700 truncate">{p.name}</span>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">Rp</span>
                          <input type="number" min="0" placeholder="0" value={p.amount}
                            onChange={e => updatePayerAmount(p.member_id, e.target.value)}
                            className="w-32 rounded-lg border border-gray-200 pl-8 pr-3 py-1.5 text-right text-sm focus:border-[#232F72] focus:outline-none bg-white" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Catatan */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                  Catatan <span className="normal-case font-normal text-gray-400">(opsional)</span>
                </label>
                <textarea rows={2} placeholder="Catatan tambahan..." value={form.notes}
                  onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                  className={`${inp} resize-none`} />
              </div>

              {error && (
                <div className="flex items-center gap-2 rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600">
                  <AlertCircle size={15} className="shrink-0" />{error}
                </div>
              )}

              <button onClick={handleNext}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#232F72] py-3
                  text-sm font-semibold text-white hover:bg-[#121358] transition-all active:scale-[0.98]">
                Lanjut — Atur Split <ChevronRight size={15} />
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Total recap */}
              <div className="rounded-2xl bg-gradient-to-r from-[#121358] to-[#232F72] px-5 py-4 text-white">
                <p className="text-xs opacity-70 mb-0.5">Total tagihan</p>
                <p className="text-2xl font-bold">{rupiah(form.amount)}</p>
                <p className="text-xs opacity-60 mt-1">{form.title}</p>
                <p className="text-xs opacity-70 mt-1.5">
                  Dibayar oleh:{' '}
                  <span className="font-semibold opacity-100">
                    {payers.map(p => `${p.name.split(' ')[0]} (${rupiah(p.amount)})`).join(', ')}
                  </span>
                </p>
              </div>

              {/* Split per member */}
              {loadMem ? (
                <div className="space-y-2">{[1,2,3].map(i => <Sk key={i} className="h-12" />)}</div>
              ) : (
                <div className="space-y-2">
                  {members.filter(m => selectedMembers.includes(m.id)).map((m, idx) => {
                    const s = splits.find(s => s.user_id === m.id)
                    const equalSplit = equalSplits.find(e => e.user_id === m.id)
                    return (
                      <div key={m.id}
                        className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50/80 px-4 py-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#232F72] text-white text-xs font-bold shrink-0">
                          {m.name?.[0]?.toUpperCase()}
                        </div>
                        <span className="flex-1 text-sm font-medium text-gray-700 truncate">{m.name}</span>

                        {form.split_method === 'equal' && (
                          <span className="text-sm font-bold text-[#36ADA3]">
                            {rupiah(equalSplit?.amount || 0)}
                          </span>
                        )}

                        {form.split_method === 'custom' && (
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">Rp</span>
                            <input type="number" min="0" placeholder="0" value={s?.amount || ''}
                              onChange={e => handleSplitChange(m.id, 'amount', e.target.value)}
                              className="w-32 rounded-lg border border-gray-200 pl-8 pr-3 py-1.5 text-right text-sm focus:border-[#232F72] focus:outline-none bg-white" />
                          </div>
                        )}

                        {form.split_method === 'percentage' && (
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1">
                              <input type="number" min="0" max="100" placeholder="0" value={s?.percentage || ''}
                                onChange={e => handleSplitChange(m.id, 'percentage', e.target.value)}
                                className="w-16 rounded-lg border border-gray-200 px-2 py-1.5 text-right text-sm focus:border-[#232F72] focus:outline-none bg-white" />
                              <span className="text-sm text-gray-500">%</span>
                            </div>
                            <span className="text-xs text-gray-400 w-20 text-right">
                              {s?.percentage ? rupiah(Math.round(totalAmount * parseFloat(s.percentage) / 100)) : '—'}
                            </span>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}

              {error && (
                <div className="flex items-center gap-2 rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600">
                  <AlertCircle size={15} className="shrink-0" />{error}
                </div>
              )}

              <div className="flex gap-3 pt-1">
                <button onClick={() => setStep(1)}
                  className="flex-1 rounded-xl border border-gray-200 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all">
                  Kembali
                </button>
                <button onClick={handleSubmit} disabled={loading}
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-[#232F72] py-3
                    text-sm font-semibold text-white hover:bg-[#121358] transition-all disabled:opacity-60 active:scale-[0.98]">
                  {loading && <Loader2 size={15} className="animate-spin" />}
                  Simpan Transaksi
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/* ─────────────────────── MODAL NLP ─────────────────────────────── */
function ModalNLP({ grups, onClose, onAdded }) {
  const [grupId, setGrupId]   = useState(grups[0]?.id || '')
  const [members, setMembers] = useState([])
  const [selected, setSelected] = useState([])
  const [text, setText]       = useState('')
  const [loadMem, setLoadMem] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  useEffect(() => {
  if (!grupId) return
  const loadMembers = async () => {
    setLoadMem(true)
    try {
      const r = await api.get(`/groups/${grupId}/members`)
      const raw = r.data?.data || r.data || []
      const mem = raw.map(item => ({
        id:   item.profiles?.id   || item.id,
        name: item.profiles?.full_name || item.profiles?.username || item.name || '—',
      }))
      setMembers(mem)
      setSelected(mem.map(m => m.id))
     
    } catch (_) { // ignore error */
    }
    finally { setLoadMem(false) }
  }
  loadMembers()
}, [grupId])

  useEffect(() => {
  if (!text.trim() || !members.length) return
  const matched = extractMembersFromText(text, members)
  if (matched.length > 0) {
    setTimeout(() => setSelected(matched.map(m => m.id)), 0)
  }
}, [text, members])

  const handleSubmit = async () => {
    if (!text.trim()) { setError('Tulis deskripsi transaksi dulu.'); return }
    if (!selected.length) { setError('Pilih minimal 1 anggota.'); return }
    setLoading(true); setError('')
    try {
      const group_members = members
        .filter(m => selected.includes(m.id))
        .map(m => ({
          id:     m.id,
          name:   m.name, //full name
        })) 
      const res = await api.post('/bills/split-nlp', {
        group_id: grupId,
        raw_text: text,
        group_members,
      })

      const bill   = res.data?.bill_summary || res.data?.bill || res.data || {}
      const billId = bill.id || res.data?.id || res.data?.bill_id
      const parsed  = res.data?.ai_parsed    || {}
      const grup    = grups.find(g => String(g.id) === String(grupId))
      const normalizedTrx = {
        id:           billId,
        title:        bill.description || parsed.title || 'Transaksi AI',
        amount:       bill.amount      || parsed.amount || 0,
        category:     bill.category    || parsed.category || 'Lainnya',
        date:         bill.created_at,
        status:       'pending',
        split_method: parsed.splitMethod || 'equal',
        group_name:   grup?.name || 'Tidak diketahui',
        paid_by_name: parsed.paidBy || '—',
        splits:       [],
      }
      onAdded(normalizedTrx)
      onClose()
    } catch (e) {
      setError(e.response?.data?.message || 'Gagal memproses. Coba tulis lebih jelas.')
    } finally {
      setLoading(false)
    }
  }

  const inp = 'w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-[#232F72] focus:outline-none focus:ring-2 focus:ring-[#232F72]/20 bg-white'

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl bg-white shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl flex items-center justify-center bg-gradient-to-br from-[#36ADA3] to-[#232F72] shrink-0">
              <Sparkles size={16} className="text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#121358]">AI Smart Input</h2>
              <p className="text-xs text-gray-400">Tulis bebas, AI yang hitung</p>
            </div>
          </div>
          <button onClick={onClose}
            className="rounded-xl p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-all">
            <X size={17} />
          </button>
        </div>

        <div className="px-6 pb-6 space-y-4 overflow-y-auto flex-1">
          {/* Grup */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Grup</label>
            <select value={grupId} onChange={e => setGrupId(e.target.value)} className={inp}>
              {grups.length === 0
                ? <option value="">Belum ada grup</option>
                : grups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)
              }
            </select>
          </div>

          {/* Textarea NLP */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              Deskripsi transaksi
              <span className="ml-2 normal-case font-normal text-[#36ADA3]">AI parsing otomatis</span>
            </label>
            <textarea rows={5} value={text} onChange={e => setText(e.target.value)}
              placeholder={"Contoh:\n\"Geprek 75 ribu buat Risna, Dinda, sama Budi. Aku yang bayar.\"\n\"Bensin 50rb dibagi 4 orang sama rata\""}
              className={`${inp} resize-none leading-relaxed`} />
            <p className="mt-1.5 text-xs text-gray-400">
              Sebutkan nama, nominal, dan siapa yang bayar — AI akan membaginya otomatis.
            </p>
          </div>

          {/* Participant */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              Participants
              {selected.length > 0 && (
                <span className="ml-2 normal-case font-normal text-gray-400">{selected.length} dipilih</span>
              )}
              {text.trim() && selected.length > 0 && (
                <span className="ml-1 normal-case font-normal text-[#36ADA3]">· auto-detected</span>
              )}
            </label>
            {loadMem ? <Sk className="h-10" /> : members.length === 0 ? (
              <div className="flex items-center gap-2 rounded-xl border border-dashed border-gray-200 px-4 py-3 text-xs text-gray-400">
                <Users size={14} className="shrink-0" />
                {grupId ? 'Grup belum punya anggota.' : 'Pilih grup dulu.'}
              </div>
            ) : (
              <MultiSelectMember members={members} selected={selected} onChange={setSelected} />
            )}
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600">
              <AlertCircle size={15} className="shrink-0" />{error}
            </div>
          )}

          <div className="flex gap-3">
            <button onClick={onClose}
              className="flex-1 rounded-xl border border-gray-200 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all">
              Batal
            </button>
            <button onClick={handleSubmit} disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-white
                transition-all disabled:opacity-60 active:scale-[0.98]"
              style={{ background: 'linear-gradient(135deg, #232F72 0%, #36ADA3 100%)' }}>
              {loading
                ? <><Loader2 size={15} className="animate-spin" /> Memproses...</>
                : <><Sparkles size={14} /> Proses dengan AI</>
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─────────────────────── MODAL DETAIL ──────────────────────────── */
function ModalDetail({ trx, onClose, grups = [] }) {
  const [splits, setSplits]   = useState([])
  const [loadingSplits, setLoadingSplits] = useState(true)

  useEffect(() => {
  if (!trx?.id) return
  const load = async () => {
    setLoadingSplits(true)
    try {
      const r = await api.get(`/bills/${trx.id}/splits`)
      setSplits(r.data?.data || [])
    } catch (_) { setSplits([]) }
    finally { setLoadingSplits(false) }
  }
  load()
}, [trx?.id])

  if (!trx) return null
  const statusCfg = STATUS_CONFIG[trx.status] || STATUS_CONFIG.pending
  const StatusIcon = statusCfg.icon

  const groupName = trx.group_name || grups.find(g => String(g.id) === String(trx.group_id))?.name || '—'

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl bg-white shadow-2xl overflow-hidden">
        {/* Hero */}
        <div className="relative px-6 py-7 text-white overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #121358 0%, #232F72 60%, #2a5a8c 100%)' }}>
          <div className="absolute inset-0 opacity-10"
            style={{ backgroundImage: 'radial-gradient(circle at 80% 20%, #36ADA3 0%, transparent 50%)' }} />
          <div className="relative text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm">
              <span className="text-2xl">{CATEGORY_ICON[trx.category] || '📦'}</span>
            </div>
            <p className="text-sm opacity-70 mb-1">{trx.category || 'Lainnya'}</p>
            <p className="text-lg font-bold mb-1">{trx.title || trx.description}</p>
            <p className="text-3xl font-black tracking-tight">{rupiah(trx.amount)}</p>
            <span className={`mt-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold
              ${trx.status === 'lunas' ? 'bg-[#36ADA3] text-white' : 'bg-white/20 text-white'}`}>
              <StatusIcon size={11} />
              {statusCfg.label}
            </span>
          </div>
        </div>

        {/* Details */}
        <div className="px-6 py-5 space-y-2 max-h-[50vh] overflow-y-auto">
          {[
            { icon: Calendar,              label: 'Tanggal',      value: fmtDate(trx.date || trx.created_at) },
            { icon: Users,                 label: 'Grup',         value: groupName },
            { icon: User,                  label: 'Dibayar oleh', value: trx.paid_by_name || trx.paidBy?.name || '—' },
            { icon: SplitSquareHorizontal, label: 'Metode split', value: trx.split_method || 'equal' },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-center gap-3 rounded-xl bg-gray-50 px-4 py-2.5">
              <Icon size={14} className="text-gray-400 shrink-0" />
              <span className="text-xs text-gray-500 w-24 shrink-0">{label}</span>
              <span className="text-sm font-medium text-gray-800 flex-1">{value}</span>
            </div>
          ))}

          {trx.notes && (
            <div className="rounded-xl bg-amber-50 border border-amber-100 px-4 py-3">
              <p className="text-xs font-semibold text-amber-700 mb-1">Catatan</p>
              <p className="text-sm text-amber-800">{trx.notes}</p>
            </div>
          )}

          {/* Split detail */}
          <div className="pt-1">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Rincian Split</p>
            {loadingSplits ? (
              <div className="space-y-1.5">
                {[1,2,3].map(i => <Sk key={i} className="h-11 rounded-xl" />)}
              </div>
            ) : splits.length === 0 ? (
              <p className="text-xs text-gray-400 py-2">Tidak ada data split.</p>
            ) : (
              <div className="space-y-1.5">
                {splits.map((s, i) => (
                  <div key={s.id ?? i} className="flex items-center justify-between rounded-xl bg-gray-50 border border-gray-100 px-4 py-2.5">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#232F72] text-white text-xs font-bold">
                        {s.member_name?.[0]?.toUpperCase() || 'A'}
                      </div>
                      <span className="text-sm text-gray-700">{s.member_name || '—'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-gray-800">{rupiah(s.share_amount)}</span>
                      {s.is_paid
                        ? <CheckCircle2 size={14} className="text-[#36ADA3]" />
                        : <Clock size={14} className="text-amber-400" />}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="border-t border-gray-100 px-6 py-4">
          <button onClick={onClose}
            className="w-full rounded-xl border border-gray-200 py-3 text-sm font-semibold
              text-gray-600 hover:bg-gray-50 transition-all active:scale-[0.99]">
            Tutup
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─────────────────────── TRANSACTION ROW ───────────────────────── */
function TrxRow({ trx, onClick }) {
  const statusCfg = STATUS_CONFIG[trx.status] || STATUS_CONFIG.pending
  const StatusIcon = statusCfg.icon
  const emoji = CATEGORY_ICON[trx.category] || '📦'

  return (
    <tr onClick={() => onClick(trx)}
      className="group border-b border-gray-50 hover:bg-blue-50/40 transition-colors cursor-pointer">
      <td className="py-3 pl-4 pr-2">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#EEF1FB] text-lg">
            {emoji}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-800 truncate group-hover:text-[#232F72] transition-colors">
              {trx.title || trx.description}
            </p>
            <p className="text-xs text-gray-400 truncate">{fmtDate(trx.date || trx.created_at)}</p>
          </div>
        </div>
      </td>
      <td className="py-3 px-2 hidden sm:table-cell">
        <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">
          {trx.category || 'Lainnya'}
        </span>
      </td>
      <td className="py-3 px-2 hidden md:table-cell">
        <span className="text-xs text-gray-500">{trx.group_name || '—'}</span>
      </td>
      <td className="py-3 px-2 text-right">
        <p className="text-sm font-bold text-[#121358]">{rupiah(trx.amount)}</p>
        {trx.splits?.length > 0 && (
          <p className="text-xs text-gray-400">/{trx.splits.length} orang</p>
        )}
      </td>
      <td className="py-3 pl-2 pr-4">
        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap
          ${trx.status === 'lunas'   ? 'bg-[#36ADA3]/12 text-[#36ADA3]' : ''}
          ${trx.status === 'pending' ? 'bg-amber-50 text-amber-600' : ''}
          ${trx.status === 'batal'   ? 'bg-red-50 text-red-500' : ''}
          ${!trx.status ? 'bg-amber-50 text-amber-600' : ''}`}>
          <StatusIcon size={10} />
          {statusCfg.label}
        </span>
      </td>
    </tr>
  )
}

/* ─────────────────────── FILTER POPOVER ────────────────────────── */
function FilterBar({ grups, filters, onChange, onReset }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  const activeCount = Object.values(filters).filter(Boolean).length

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(p => !p)}
        className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-medium transition-all
          ${activeCount > 0 ? 'border-[#232F72] bg-[#232F72] text-white' : 'border-gray-200 bg-white text-gray-600 hover:border-[#232F72]/40'}`}>
        <Filter size={14} />
        Filter
        {activeCount > 0 && (
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/20 text-xs font-bold">
            {activeCount}
          </span>
        )}
        <ChevronDown size={13} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute right-0 top-12 z-20 w-72 rounded-2xl border border-gray-100 bg-white p-4 shadow-2xl">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Filter Transaksi</p>
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Grup</label>
              <select value={filters.group_id}
                onChange={e => onChange({ ...filters, group_id: e.target.value })}
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-[#232F72] focus:outline-none bg-white">
                <option value="">Semua Grup</option>
                {grups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Kategori</label>
              <select value={filters.category}
                onChange={e => onChange({ ...filters, category: e.target.value })}
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-[#232F72] focus:outline-none bg-white">
                <option value="">Semua Kategori</option>
                {KATEGORI.map(k => <option key={k}>{k}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Status</label>
              <select value={filters.status}
                onChange={e => onChange({ ...filters, status: e.target.value })}
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-[#232F72] focus:outline-none bg-white">
                <option value="">Semua Status</option>
                <option value="lunas">Lunas</option>
                <option value="pending">Pending</option>
                <option value="batal">Batal</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Dari</label>
                <input type="date" value={filters.date_from}
                  onChange={e => onChange({ ...filters, date_from: e.target.value })}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-[#232F72] focus:outline-none bg-white" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Sampai</label>
                <input type="date" value={filters.date_to}
                  onChange={e => onChange({ ...filters, date_to: e.target.value })}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-[#232F72] focus:outline-none bg-white" />
              </div>
            </div>
            <button onClick={() => { onReset(); setOpen(false) }}
              className="w-full rounded-xl border border-gray-200 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all">
              Reset Filter
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

/* ─────────────────────── SUMMARY CARD ──────────────────────────── */
function SummaryCard({ icon: Icon, label, value, accent, sub }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 px-4 py-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${accent}`}>
          <Icon size={16} className="text-white" />
        </div>
      </div>
      <p className="text-xs text-gray-500 mb-0.5">{label}</p>
      <p className="text-xl font-bold text-[#121358] leading-tight">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  )
}

/* ─────────────────────── HALAMAN UTAMA ─────────────────────────── */
const PAGE_SIZE = 10

export default function TransaksiPage() {
  const { user }                      = useAuth()
  const [trxs, setTrxs]               = useState([])
  const [grups, setGrups]             = useState([])
  const [loading, setLoading]         = useState(true)
  const [error, setError]             = useState('')
  const [search, setSearch]           = useState('')
  const [page, setPage]               = useState(1)
  const [totalPages, setTotalPages]   = useState(1)
  const [filters, setFilters]         = useState({ group_id: '', category: '', status: '', date_from: '', date_to: '' })
  const [modalTambah, setModalTambah] = useState(false)
  const [modalNlp, setModalNlp]       = useState(false)
  const [modalDetail, setModalDetail] = useState(null)
  const [summary, setSummary]         = useState({ total: 0, count: 0, lunas: 0, pending: 0 })

  const fetchTrxs = useCallback(async (pg = 1, flt = filters, q = search) => {
    setLoading(true); setError('')
    try {
      const params = {
        page: pg, limit: PAGE_SIZE,
        ...(q             && { search: q }),
        ...(flt.group_id  && { group_id: flt.group_id }),
        ...(flt.category  && { category: flt.category }),
        ...(flt.status    && { status: flt.status }),
        ...(flt.date_from && { date_from: flt.date_from }),
        ...(flt.date_to   && { date_to: flt.date_to }),
      }
      if (!flt.group_id) { setTrxs([]); setLoading(false); return }
      const res  = await api.get(`/bills/${flt.group_id}/history`, { params })
      const data = res.data?.data || res.data || {}
      const list = Array.isArray(data) ? data : data.transactions || data.items || []
      setTrxs(list)
      setTotalPages(data.total_pages || Math.ceil((data.total || list.length) / PAGE_SIZE) || 1)
      setSummary({
        total:   list.reduce((a, t) => a + (t.amount || 0), 0),
        count:   data.total || list.length,
        lunas:   list.filter(t => t.status === 'lunas').length,
        pending: list.filter(t => t.status !== 'lunas' && t.status !== 'batal').length,
      })
    } catch (e) {
      setError(e.response?.data?.message || 'Gagal memuat transaksi.')
    } finally {
      setLoading(false)
    }
  }, []) // eslint-disable-line

  const fetchGrups = useCallback(async () => {
    if (!user?.id) return
    try {
      const res = await api.get(`/groups/user/${user.id}`)
      const raw = res.data?.data || res.data || []
      const mapped = raw.map(item => ({
        id:   item.groups?.id   || item.id,
        name: item.groups?.group_name || item.group_name || item.name || '—',
      }))
      setGrups(mapped)
    } catch { /* empty */ }
  }, [user])

  useEffect(() => { 
    let active = true
    const init = async () => {
      await fetchGrups()
    }
    init()
    return () => { active = false }
  }, [fetchGrups])

  useEffect(() => {
    if (grups.length > 0 && !filters.group_id) {
      const firstId = String(grups[0].id)
      const newFilters = { ...filters, group_id: firstId }
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFilters(newFilters)
      fetchTrxs(1, newFilters, search)
    }
  }, [grups]) // eslint-disable-line

  useEffect(() => {
    const t = setTimeout(() => { setPage(1); fetchTrxs(1, filters, search) }, 400)
    return () => clearTimeout(t)
  }, [search]) // eslint-disable-line

  const applyFilters = (flt) => { setFilters(flt); setPage(1); fetchTrxs(1, flt, search) }
  const resetFilters = () => {
    const empty = { group_id: '', category: '', status: '', date_from: '', date_to: '' }
    setFilters(empty); setPage(1); fetchTrxs(1, empty, search)
  }
  const goPage = (p) => { setPage(p); fetchTrxs(p, filters, search) }
  const handleAdded = (newTrx) => {
    setTrxs(p => [newTrx, ...p])
    setSummary(p => ({ ...p, count: p.count + 1, total: p.total + (newTrx.amount || 0) }))
  }

  return (
    <div className="flex h-full flex-col overflow-hidden bg-[#F7F8FC]">
      {/* ── TOPBAR ── */}
      <header className="flex items-center justify-between border-b border-gray-100 bg-white px-6 py-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl shrink-0 bg-[#36ADA3]/15">
            <ArrowLeftRight size={18} className="text-[#36ADA3]" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#121358]">Transaksi</h1>
            <p className="text-xs text-gray-400">Riwayat & pengelolaan pengeluaran grup</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setModalNlp(true)}
            className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-all active:scale-[0.97]"
            style={{ background: 'linear-gradient(135deg, #36ADA3 0%, #2a8f86 100%)', boxShadow: '0 3px 10px rgba(54,173,163,0.30)' }}>
            <Sparkles size={14} />
            <span className="hidden sm:inline">AI Input</span>
          </button>
          <button onClick={() => setModalTambah(true)}
            className="flex items-center gap-2 rounded-xl bg-[#232F72] px-4 py-2.5 text-sm font-semibold text-white
              hover:bg-[#121358] transition-all shadow-sm active:scale-[0.97]"
            style={{ boxShadow: '0 3px 10px rgba(35,47,114,0.25)' }}>
            <Plus size={15} />
            <span className="hidden sm:inline">Tambah</span>
          </button>
        </div>
      </header>

      {/* ── SCROLLABLE BODY ── */}
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

        {/* Summary cards */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <SummaryCard icon={Wallet}     label="Total Pengeluaran" value={rupiah(summary.total)}
            accent="bg-[#232F72]" sub={`${summary.count} transaksi`} />
          <SummaryCard icon={BarChart2}  label="Semua Transaksi"   value={summary.count}
            accent="bg-[#36ADA3]" />
          <SummaryCard icon={CheckCircle2} label="Lunas"           value={summary.lunas}
            accent="bg-emerald-500" sub="sudah settle" />
          <SummaryCard icon={Clock}      label="Pending"            value={summary.pending}
            accent="bg-amber-400" sub="perlu diselesaikan" />
        </div>

        {/* Search + Filter bar */}
        <div className="flex items-center gap-3">
          <div className="flex flex-1 items-center gap-2 rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 shadow-sm">
            <Search size={15} className="text-gray-400 shrink-0" />
            <input type="text" placeholder="Cari transaksi, kategori, grup..."
              value={search} onChange={e => setSearch(e.target.value)}
              className="flex-1 bg-transparent text-sm outline-none placeholder-gray-400" />
            {search && (
              <button onClick={() => setSearch('')} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X size={13} />
              </button>
            )}
          </div>
          <FilterBar grups={grups} filters={filters} onChange={applyFilters} onReset={resetFilters} />
        </div>

        {/* Filter chips */}
        {Object.values(filters).some(Boolean) && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-gray-400">Filter aktif:</span>
            {filters.group_id && (
              <span className="inline-flex items-center gap-1 rounded-full bg-[#232F72]/10 px-3 py-1 text-xs font-medium text-[#232F72]">
                {grups.find(g => g.id == filters.group_id)?.name || 'Grup'}
                <button onClick={() => applyFilters({ ...filters, group_id: '' })}><X size={10} /></button>
              </span>
            )}
            {filters.category && (
              <span className="inline-flex items-center gap-1 rounded-full bg-[#232F72]/10 px-3 py-1 text-xs font-medium text-[#232F72]">
                {filters.category}
                <button onClick={() => applyFilters({ ...filters, category: '' })}><X size={10} /></button>
              </span>
            )}
            {filters.status && (
              <span className="inline-flex items-center gap-1 rounded-full bg-[#232F72]/10 px-3 py-1 text-xs font-medium text-[#232F72]">
                {STATUS_CONFIG[filters.status]?.label}
                <button onClick={() => applyFilters({ ...filters, status: '' })}><X size={10} /></button>
              </span>
            )}
            <button onClick={resetFilters}
              className="text-xs text-red-400 hover:text-red-600 transition-colors ml-1 underline-offset-2 hover:underline">
              Hapus semua
            </button>
          </div>
        )}

        {/* Table / List */}
        {loading ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-50 bg-gray-50/50">
              <Sk className="h-4 w-32" />
            </div>
            <div className="divide-y divide-gray-50">
              {[1,2,3,4,5].map(i => (
                <div key={i} className="flex items-center gap-4 px-4 py-3.5">
                  <Sk className="h-9 w-9 rounded-xl shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Sk className="h-3.5 w-48" />
                    <Sk className="h-3 w-24" />
                  </div>
                  <div className="space-y-2">
                    <Sk className="h-4 w-20 ml-auto" />
                    <Sk className="h-3 w-14 ml-auto" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center bg-white rounded-2xl border border-gray-100">
            <div className="h-12 w-12 rounded-2xl bg-red-50 flex items-center justify-center">
              <AlertCircle size={22} className="text-red-400" />
            </div>
            <div>
              <p className="font-semibold text-gray-700 mb-1">Gagal memuat</p>
              <p className="text-sm text-gray-400">{error}</p>
            </div>
            <button onClick={() => fetchTrxs(page, filters, search)}
              className="flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2
                text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all mt-1">
              <RefreshCw size={13} /> Coba Lagi
            </button>
          </div>
        ) : !filters.group_id ? (
          <div className="flex flex-col items-center gap-4 py-20 text-center bg-white rounded-2xl border border-gray-100">
            <div className="h-16 w-16 rounded-2xl bg-[#EEF1FB] flex items-center justify-center">
              <Filter size={28} className="text-[#232F72]" />
            </div>
            <div>
              <p className="font-semibold text-gray-600">Pilih grup dulu</p>
              <p className="mt-1 text-sm text-gray-400">Gunakan filter untuk memilih grup yang ingin ditampilkan.</p>
            </div>
            <button onClick={() => document.querySelector('[data-filter-btn]')?.click()}
              className="flex items-center gap-2 rounded-xl bg-[#232F72] px-5 py-2.5
                text-sm font-medium text-white hover:bg-[#121358] transition-all">
              <Filter size={14} /> Buka Filter
            </button>
          </div>
        ) : trxs.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-20 text-center bg-white rounded-2xl border border-gray-100">
            <div className="relative h-16 w-16 rounded-2xl bg-[#EEF1FB] flex items-center justify-center">
              <Receipt size={28} className="text-[#232F72]" />
              <span className="absolute -top-1.5 -right-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-[#36ADA3] shadow">
                <Plus size={12} className="text-white" strokeWidth={3} />
              </span>
            </div>
            <div>
              <p className="font-semibold text-gray-600">Belum ada transaksi</p>
              <p className="mt-1 text-sm text-gray-400">Catat pengeluaran pertama grup kamu!</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setModalNlp(true)}
                className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white"
                style={{ background: 'linear-gradient(135deg, #36ADA3, #2a8f86)' }}>
                <Sparkles size={14} /> AI Input
              </button>
              <button onClick={() => setModalTambah(true)}
                className="flex items-center gap-2 rounded-xl bg-[#232F72] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#121358] transition-all">
                <Plus size={14} /> Tambah Manual
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="border-b border-gray-100 bg-gray-50/60">
              <table className="w-full">
                <thead>
                  <tr className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    <th className="text-left py-3 pl-4 pr-2">Transaksi</th>
                    <th className="text-left py-3 px-2 hidden sm:table-cell">Kategori</th>
                    <th className="text-left py-3 px-2 hidden md:table-cell">Grup</th>
                    <th className="text-right py-3 px-2">Nominal</th>
                    <th className="text-left py-3 pl-2 pr-4">Status</th>
                  </tr>
                </thead>
              </table>
            </div>
            <table className="w-full">
              <tbody>
                {trxs.map(t => <TrxRow key={t.id} trx={t} onClick={setModalDetail} />)}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-400">Halaman {page} dari {totalPages}</p>
            <div className="flex items-center gap-1.5">
              <button onClick={() => goPage(page - 1)} disabled={page <= 1}
                className="flex items-center gap-1 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm
                  font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition-all shadow-sm">
                <ChevronLeft size={14} /> Prev
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const p = Math.max(1, Math.min(totalPages - 4, page - 2)) + i
                return (
                  <button key={p} onClick={() => goPage(p)}
                    className={`w-9 h-9 rounded-xl text-sm font-medium transition-all
                      ${p === page ? 'bg-[#232F72] text-white shadow-sm' : 'border border-gray-200 bg-white text-gray-600 hover:bg-gray-50'}`}>
                    {p}
                  </button>
                )
              })}
              <button onClick={() => goPage(page + 1)} disabled={page >= totalPages}
                className="flex items-center gap-1 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm
                  font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition-all shadow-sm">
                Next <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── MODALS ── */}
      {modalNlp    && <ModalNLP    grups={grups} onClose={() => setModalNlp(false)}    onAdded={handleAdded} />}
      {modalTambah && <ModalTambah grups={grups} onClose={() => setModalTambah(false)} onAdded={handleAdded} currentUser={user} />}
      {modalDetail && <ModalDetail trx={modalDetail} onClose={() => setModalDetail(null)} grups={grups} />}
    </div>
  )
}