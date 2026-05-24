import { useState, useEffect, useCallback } from 'react'
import {
  Users, Plus, Search, LogOut, UserPlus, Copy, Check,
  ChevronRight, AlertCircle, Loader2, RefreshCw, Crown,
  Hash, Calendar, X, CheckCircle2,
  // eslint-disable-next-line no-unused-vars
  Trash2, Mail,
} from 'lucide-react'
import api from '../../services/api'
import { useAuth } from '../../context/AuthContext'

/* ─────────────────────── SKELETON ──────────────────────────── */
const Sk = ({ className = '' }) => (
  <div className={`animate-pulse rounded-lg bg-gray-100 ${className}`} />
)

/* ─────────────────────── HELPERS ───────────────────────────── */
// eslint-disable-next-line no-unused-vars
const rupiah = (n) => 'Rp ' + Number(n || 0).toLocaleString('id-ID')
const fmtDate = (d) => d
  ? new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
  : '—'

/* ─────────────────────── AVATAR ────────────────────────────── */
function Avatar({ name, size = 'md', color }) {
  const sizes = { sm: 'h-7 w-7 text-xs', md: 'h-9 w-9 text-sm', lg: 'h-11 w-11 text-base' }
  const colors = ['bg-[#232F72]', 'bg-[#36ADA3]', 'bg-purple-500', 'bg-rose-500', 'bg-amber-500', 'bg-emerald-500']
  const bg = color || colors[(name?.charCodeAt(0) || 0) % colors.length]
  return (
    <div className={`${sizes[size]} ${bg} rounded-full flex items-center justify-center text-white font-bold shrink-0`}>
      {name?.[0]?.toUpperCase() || '?'}
    </div>
  )
}

/* ─────────────────────── MODAL WRAPPER ─────────────────────── */
function ModalWrapper({ children, onClose, title, subtitle }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100">
          <div>
            <h2 className="text-base font-bold text-[#121358]">{title}</h2>
            {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
          </div>
          <button onClick={onClose}
            className="rounded-xl p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-all">
            <X size={17} />
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  )
}

/* ─────────────────────── MODAL BUAT GRUP ───────────────────── */
// FIX #3: Terima user_id sebagai prop, fix endpoint + payload
function ModalBuatGrup({ onClose, onCreated, userId }) {
  const [form, setForm]       = useState({ name: '', description: '' })
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (!form.name.trim()) { setError('Nama grup wajib diisi.'); return }
    setLoading(true); setError('')
    try {
      // FIX: endpoint /groups/create + payload group_name + user_id
      const res = await api.post('/groups/create', {
        group_name: form.name,
        user_id: userId,
      })
      const newGrup = res.data?.data || res.data
      // Normalize field: backend return group_name, frontend pakai name
      onCreated({ ...newGrup, name: newGrup.group_name, is_owner: true })
      onClose()
    } catch (e) {
      setError(e.response?.data?.message || 'Gagal membuat grup.')
    } finally {
      setLoading(false)
    }
  }

  const inp = 'w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-[#232F72] focus:outline-none focus:ring-2 focus:ring-[#232F72]/20 bg-white transition-all'

  return (
    <ModalWrapper onClose={onClose} title="Buat Grup Baru" subtitle="Grup untuk mencatat patungan bersama">
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
            Nama Grup <span className="text-red-400 normal-case font-normal">*</span>
          </label>
          <input type="text" placeholder="cth. Kos Mawar, Trip Bali 2026" value={form.name}
            onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className={inp} />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
            Deskripsi <span className="normal-case font-normal text-gray-400">(opsional)</span>
          </label>
          <textarea rows={3} placeholder="Tujuan atau catatan grup ini..." value={form.description}
            onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
            className={`${inp} resize-none`} />
        </div>
        {error && (
          <div className="flex items-center gap-2 rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600">
            <AlertCircle size={15} className="shrink-0" /> {error}
          </div>
        )}
        <div className="flex gap-3 pt-1">
          <button onClick={onClose}
            className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all">
            Batal
          </button>
          <button onClick={handleSubmit} disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-[#232F72] py-2.5
              text-sm font-semibold text-white hover:bg-[#121358] transition-all disabled:opacity-60 active:scale-[0.98]">
            {loading && <Loader2 size={15} className="animate-spin" />}
            Buat Grup
          </button>
        </div>
      </div>
    </ModalWrapper>
  )
}

/* ─────────────────────── MODAL UNDANG ──────────────────────── */
function ModalUndang({ grup, onClose }) {
  const [copied, setCopied]   = useState(false)
  const [username, setUsername] = useState('')
  const [error, setError]     = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  const inviteLink = `${window.location.origin}/join/${grup?.id || ''}`

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleAddMember = async () => {
    if (!username.trim()) { setError('Username wajib diisi.'); return }
    setLoading(true); setError(''); setSuccess('')
    try {
      await api.post('/groups/add-member-by-username', {
        group_id: grup.id,
        username: username.trim(),
      })
      setSuccess('Anggota berhasil ditambahkan!')
      setUsername('')
    } catch (e) {
      setError(e.response?.data?.message || 'Gagal menambahkan anggota.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <ModalWrapper onClose={onClose} title={`Undang ke "${grup?.name}"`} subtitle="Bagikan link atau tambah via username">
      <div className="space-y-5">
        {/* Link undangan */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Link Undangan</label>
          <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5">
            <Hash size={13} className="shrink-0 text-gray-400" />
            <span className="flex-1 truncate text-xs text-gray-600 font-mono">{inviteLink}</span>
            <button onClick={handleCopy}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all
                ${copied ? 'bg-[#36ADA3] text-white' : 'bg-[#232F72] text-white hover:bg-[#121358]'}`}>
              {copied ? <><Check size={12} /> Tersalin!</> : <><Copy size={12} /> Salin</>}
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-gray-100" />
          <span className="text-xs text-gray-400">atau tambah langsung</span>
          <div className="h-px flex-1 bg-gray-100" />
        </div>

        {/* Add by Username */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
            Username Anggota
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="cth. budi_santoso"
              value={username}
              onChange={e => { setUsername(e.target.value); setError('') }}
              className="flex-1 rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-[#232F72] focus:outline-none focus:ring-2 focus:ring-[#232F72]/20 bg-white"
            />
            <button onClick={handleAddMember} disabled={loading}
              className="flex items-center gap-2 rounded-xl bg-[#232F72] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#121358] transition-all disabled:opacity-60">
              {loading ? <Loader2 size={15} className="animate-spin" /> : <UserPlus size={15} />}
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-1.5">Username teman yang sudah terdaftar di Talang.in.</p>
        </div>

        {error   && <p className="text-sm text-red-500 flex items-center gap-1.5"><AlertCircle size={13} />{error}</p>}
        {success && <p className="text-sm text-[#36ADA3] font-medium flex items-center gap-1.5"><CheckCircle2 size={13} />{success}</p>}

        <button onClick={onClose}
          className="w-full rounded-xl border border-gray-200 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all">
          Tutup
        </button>
      </div>
    </ModalWrapper>
  )
}

/* ─────────────────────── MODAL KELUAR ──────────────────────── */
// FIX #4: Endpoint /leave tidak ada → ganti pakai DELETE /groups/:id/members/:profile_id
function ModalKeluar({ grup, onClose, onLeft, userId }) {
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  const handleLeave = async () => {
    setLoading(true); setError('')
    try {
      // FIX: Gunakan DELETE members endpoint yang sudah ada
      await api.delete(`/groups/${grup.id}/members/${userId}`)
      onLeft(grup.id)
      onClose()
    } catch (e) {
      setError(e.response?.data?.message || 'Gagal keluar dari grup.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <ModalWrapper onClose={onClose} title="Keluar dari Grup?">
      <div className="space-y-4">
        <div className="rounded-2xl bg-red-50 border border-red-100 px-4 py-4 flex items-start gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-100 shrink-0">
            <LogOut size={16} className="text-red-500" />
          </div>
          <div>
            <p className="text-sm font-semibold text-red-700 mb-1">"{grup?.name}"</p>
            <p className="text-xs text-red-500 leading-relaxed">
              Kamu tidak akan bisa melihat transaksi grup ini lagi kecuali diundang ulang.
            </p>
          </div>
        </div>
        {error && (
          <div className="flex items-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
            <AlertCircle size={15} className="shrink-0" /> {error}
          </div>
        )}
        <div className="flex gap-3">
          <button onClick={onClose}
            className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all">
            Batal
          </button>
          <button onClick={handleLeave} disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-red-500 py-2.5
              text-sm font-semibold text-white hover:bg-red-600 transition-all disabled:opacity-60 active:scale-[0.98]">
            {loading && <Loader2 size={15} className="animate-spin" />}
            Ya, Keluar
          </button>
        </div>
      </div>
    </ModalWrapper>
  )
}

/* ─────────────────────── GRUP CARD (list kiri) ─────────────── */
function GrupCard({ grup, isSelected, onSelect, onUndang, onKeluar }) {
  const memberCount = grup.member_count ?? 0

  return (
    <div onClick={() => onSelect(grup)}
      className={`group relative rounded-2xl border p-4 cursor-pointer transition-all duration-200
        ${isSelected
          ? 'border-[#232F72] bg-[#232F72]/5 shadow-sm'
          : 'border-gray-100 bg-white hover:border-[#232F72]/30 hover:shadow-sm'}`}>

      {/* Top row */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className={`flex h-10 w-10 items-center justify-center rounded-xl shrink-0 transition-all
            ${isSelected ? 'bg-[#232F72] text-white' : 'bg-[#EEF1FB] text-[#232F72]'}`}>
            <Users size={18} />
          </div>
          <div className="min-w-0">
            {/* FIX #2: g.name sudah dinormalisasi saat fetch */}
            <h3 className="font-bold text-[#121358] text-sm truncate">{grup.name}</h3>
            <p className="text-xs text-gray-400 mt-0.5">
              {memberCount > 0 ? `${memberCount} anggota · ` : ''}{fmtDate(grup.created_at)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {grup.is_owner && (
            <span className="flex items-center gap-1 rounded-full bg-amber-50 border border-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-600">
              <Crown size={10} /> Admin
            </span>
          )}
          <span className="rounded-full bg-[#36ADA3]/10 px-2 py-0.5 text-xs font-semibold text-[#36ADA3]">
            Aktif
          </span>
        </div>
      </div>

      {/* Actions row */}
      <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
        <button onClick={() => onUndang(grup)}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-gray-200 py-1.5
            text-xs font-medium text-gray-600 hover:border-[#232F72]/40 hover:text-[#232F72] hover:bg-[#EEF1FB] transition-all">
          <UserPlus size={12} /> Undang
        </button>
        <button onClick={() => onKeluar(grup)}
          className="flex items-center gap-1.5 rounded-xl border border-gray-200 px-3 py-1.5
            text-xs font-medium text-red-400 hover:border-red-200 hover:bg-red-50 hover:text-red-600 transition-all">
          <LogOut size={12} />
        </button>
        <button onClick={() => onSelect(grup)}
          className={`flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all
            ${isSelected ? 'bg-[#232F72] text-white' : 'bg-[#EEF1FB] text-[#232F72] hover:bg-[#232F72] hover:text-white'}`}>
          Detail <ChevronRight size={12} />
        </button>
      </div>
    </div>
  )
}

/* ─────────────────────── DETAIL PANEL ──────────────────────── */
function DetailPanel({ grup, onUndang, onKeluar, onClose, onMembersUpdated }) {
  const [members, setMembers]   = useState([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState('')
  const [removing, setRemoving] = useState(null)

  const fetchMembers = useCallback(async () => {
    if (!grup) return
    setLoading(true); setError('')
    try {
      const res = await api.get(`/groups/${grup.id}/members`)
      // FIX #6: Backend return { data: [{ id, role, joined_at, profiles: { id, username, full_name } }] }
      const raw = res.data?.data || res.data || []
      setMembers(raw)
    } catch {
      setError('Gagal memuat anggota.')
    } finally {
      setLoading(false)
    }
  }, [grup])

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchMembers() }, [fetchMembers])

  const handleRemoveMember = async (member) => {
    // FIX #6: profile_id ada di member.profiles.id, bukan member.id
    const profileId = member.profiles?.id
    if (!profileId) return
    setRemoving(profileId)
    try {
      await api.delete(`/groups/${grup.id}/members/${profileId}`)
      setMembers(p => p.filter(m => m.profiles?.id !== profileId))
      onMembersUpdated?.()
    } catch { /* empty */ }
    finally { setRemoving(null) }
  }

  if (!grup) return null

  const memberCount = members.length || grup.member_count || 0

  return (
    <div className="flex flex-col h-full">
      {/* Hero header */}
      <div className="relative rounded-2xl overflow-hidden mb-5 shrink-0"
        style={{ background: 'linear-gradient(135deg, #121358 0%, #232F72 55%, #1a4a7a 100%)' }}>
        <div className="absolute -top-6 -right-6 w-32 h-32 rounded-full bg-white/5" />
        <div className="absolute -bottom-8 -left-4 w-24 h-24 rounded-full bg-[#36ADA3]/15" />

        <div className="relative px-6 py-6">
          <div className="flex items-start justify-between gap-3 mb-5">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm shrink-0">
                <Users size={24} className="text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-xl font-black text-white">{grup.name}</h2>
                  <span className="rounded-full bg-[#36ADA3] px-2.5 py-0.5 text-xs font-bold text-white">ACTIVE</span>
                </div>
                <p className="text-xs text-white/40 mt-0.5 flex items-center gap-1">
                  <Calendar size={10} /> Dibuat {fmtDate(grup.created_at)}
                </p>
              </div>
            </div>
            <button onClick={onClose}
              className="rounded-xl p-2 text-white/60 hover:bg-white/10 hover:text-white transition-all">
              <X size={16} />
            </button>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 gap-2 mb-5">
            {[
              { label: 'Anggota', value: `${memberCount} Orang` },
              { label: 'Role', value: grup.is_owner ? 'Admin' : 'Member' },
            ].map(({ label, value }) => (
              <div key={label} className="rounded-xl bg-white/10 px-3 py-2.5 text-center backdrop-blur-sm">
                <p className="text-xs text-white/50 mb-0.5">{label}</p>
                <p className="text-sm font-bold text-white">{value}</p>
              </div>
            ))}
          </div>

          {/* Action buttons */}
          <div className="flex gap-2">
            <button onClick={() => onUndang(grup)}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#36ADA3] px-4 py-2.5
                text-sm font-semibold text-white hover:bg-[#2e9990] transition-all active:scale-[0.98]">
              <UserPlus size={15} /> Tambah Anggota
            </button>
            <button onClick={() => onKeluar(grup)}
              className="flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2.5
                text-sm font-medium text-white/80 hover:bg-white/20 hover:text-white transition-all">
              <LogOut size={15} /> Keluar
            </button>
          </div>
        </div>
      </div>

      {/* Members section */}
      <div className="flex-1 overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-[#121358]">Kelola Anggota</h3>
            <p className="text-xs text-gray-400 mt-0.5">Daftar anggota dalam grup ini.</p>
          </div>
          <button onClick={fetchMembers}
            className="rounded-xl p-2 text-gray-400 hover:bg-gray-100 hover:text-[#232F72] transition-all">
            <RefreshCw size={14} />
          </button>
        </div>

        {loading ? (
          <div className="space-y-2">
            {[1,2,3].map(i => (
              <div key={i} className="flex items-center gap-3 rounded-xl border border-gray-100 p-3">
                <Sk className="h-9 w-9 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Sk className="h-3 w-32" />
                  <Sk className="h-2.5 w-48" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="flex items-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
            <AlertCircle size={15} /> {error}
          </div>
        ) : members.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-10 text-center rounded-2xl border border-dashed border-gray-200">
            <div className="h-12 w-12 rounded-xl bg-gray-100 flex items-center justify-center">
              <Users size={22} className="text-gray-300" />
            </div>
            <p className="text-sm text-gray-400">Belum ada anggota</p>
          </div>
        ) : (
          <div className="rounded-2xl border border-gray-100 overflow-hidden bg-white">
            {/* Table header */}
            <div className="grid grid-cols-[1fr_1fr_80px_60px] gap-0 border-b border-gray-100 bg-gray-50/60 px-4 py-2.5">
              {['Nama Anggota', 'Username', 'Role', 'Aksi'].map(h => (
                <p key={h} className="text-xs font-semibold text-gray-400 uppercase tracking-wide truncate">{h}</p>
              ))}
            </div>
            {/* Rows */}
            <div className="divide-y divide-gray-50">
              {members.map(member => {
                // FIX #6: Semua field diambil dari member.profiles
                const profile   = member.profiles || {}
                const nama      = profile.full_name || profile.username || '—'
                const username  = profile.username || '—'
                const isAdmin   = member.role === 'admin'
                const profileId = profile.id

                return (
                  <div key={member.id}
                    className="grid grid-cols-[1fr_1fr_80px_60px] gap-0 items-center px-4 py-3 hover:bg-gray-50/60 transition-colors">
                    {/* Nama */}
                    <div className="flex items-center gap-2.5 min-w-0 pr-2">
                      <Avatar name={nama} size="sm" />
                      <p className="text-sm font-semibold text-gray-800 truncate">{nama}</p>
                    </div>
                    {/* Username */}
                    <p className="text-xs text-gray-500 truncate pr-2">@{username}</p>
                    {/* Role */}
                    <div>
                      {isAdmin ? (
                        <span className="inline-flex items-center gap-1 rounded-lg bg-amber-50 border border-amber-100 px-2 py-1 text-xs font-bold text-amber-600">
                          <Crown size={9} /> ADMIN
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-lg bg-gray-100 px-2 py-1 text-xs font-medium text-gray-500">
                          MEMBER
                        </span>
                      )}
                    </div>
                    {/* Aksi */}
                    <div className="flex items-center justify-center">
                      {!isAdmin && (
                        <button
                          onClick={() => handleRemoveMember(member)}
                          disabled={removing === profileId}
                          className="rounded-lg p-1.5 text-gray-300 hover:text-red-400 hover:bg-red-50 transition-all disabled:opacity-40">
                          {removing === profileId
                            ? <Loader2 size={14} className="animate-spin" />
                            : <Trash2 size={14} />}
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
            {/* Footer */}
            <div className="border-t border-gray-100 px-4 py-2.5 bg-gray-50/40 flex items-center justify-between">
              <p className="text-xs text-gray-400">{members.length} anggota dalam grup ini</p>
              <button onClick={() => onUndang(grup)}
                className="flex items-center gap-1.5 rounded-xl bg-[#232F72] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#121358] transition-all">
                <UserPlus size={12} /> Tambah Anggota
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

/* ─────────────────────── HALAMAN UTAMA ─────────────────────── */
export default function GrupPage() {
  // FIX #1: Ambil user dari AuthContext untuk dapat user.id
  const { user } = useAuth()

  const [grups, setGrups]         = useState([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState('')
  const [search, setSearch]       = useState('')
  const [modalBuat, setModalBuat] = useState(false)
  const [modalUndang, setModalUndang] = useState(null)
  const [modalKeluar, setModalKeluar] = useState(null)
  const [selected, setSelected]   = useState(null)

  const fetchGrups = useCallback(async () => {
    if (!user?.id) return
    setLoading(true); setError('')
    try {
      // FIX #1: Gunakan endpoint /groups/user/:user_id — bukan /groups
      const res  = await api.get(`/groups/user/${user.id}`)
      const raw  = res.data?.data || []

      // FIX #2: Normalize response shape — backend return { role, joined_at, groups: { id, group_name, ... } }
      const data = raw.map(item => ({
        ...item.groups,
        name: item.groups?.group_name,   // alias group_name → name
        role: item.role,
        joined_at: item.joined_at,
        is_owner: item.role === 'admin',
      }))

      setGrups(data)
      if (!selected && data.length > 0) setSelected(data[0])
    } catch (e) {
      setError(e.response?.data?.message || 'Gagal memuat daftar grup.')
    } finally {
      setLoading(false)
    }
  }, [user?.id]) // eslint-disable-line

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchGrups() }, [fetchGrups])

  const handleCreated = (newGrup) => {
    setGrups(p => [newGrup, ...p])
    setSelected(newGrup)
  }

  const handleLeft = (grupId) => {
    setGrups(p => p.filter(g => g.id !== grupId))
    if (selected?.id === grupId) setSelected(null)
  }

  const filtered = grups.filter(g =>
    g.name?.toLowerCase().includes(search.toLowerCase())
  )

  const SkCard = () => (
    <div className="rounded-2xl border border-gray-100 bg-white p-4 space-y-3">
      <div className="flex items-center gap-3">
        <Sk className="h-10 w-10 rounded-xl" />
        <div className="flex-1 space-y-2">
          <Sk className="h-3.5 w-36" />
          <Sk className="h-2.5 w-24" />
        </div>
      </div>
      <Sk className="h-8 rounded-xl" />
    </div>
  )

  return (
    <div className="flex h-full overflow-hidden bg-[#F7F8FC]">
      {/* ──────── KIRI: list panel ──────── */}
      <div className="flex w-full flex-col overflow-hidden lg:w-[380px] xl:w-[420px] shrink-0
        border-r border-gray-100 bg-white">

        {/* Header */}
        <header className="flex items-center justify-between border-b border-gray-100 px-5 py-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#36ADA3]/15">
              <Users size={18} className="text-[#36ADA3]" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-[#121358]">Grup Saya</h1>
              <p className="text-xs text-gray-400">Kelola grup patungan</p>
            </div>
          </div>
          <button onClick={() => setModalBuat(true)}
            className="flex items-center gap-2 rounded-xl bg-[#232F72] px-3.5 py-2.5 text-sm font-semibold text-white
              hover:bg-[#121358] transition-all shadow-sm active:scale-[0.97]"
            style={{ boxShadow: '0 3px 10px rgba(35,47,114,0.25)' }}>
            <Plus size={15} />
            <span>Buat Grup</span>
          </button>
        </header>

        {/* Search */}
        <div className="px-5 py-3.5 border-b border-gray-50 shrink-0">
          <div className="flex items-center gap-2.5 rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5">
            <Search size={14} className="text-gray-400 shrink-0" />
            <input type="text" placeholder="Cari grup..." value={search}
              onChange={e => setSearch(e.target.value)}
              className="flex-1 bg-transparent text-sm outline-none placeholder-gray-400" />
            {search && (
              <button onClick={() => setSearch('')} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X size={13} />
              </button>
            )}
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          {loading ? (
            <>{[1,2,3].map(i => <SkCard key={i} />)}</>
          ) : error ? (
            <div className="flex flex-col items-center gap-3 py-12 text-center">
              <div className="h-12 w-12 rounded-2xl bg-red-50 flex items-center justify-center">
                <AlertCircle size={22} className="text-red-400" />
              </div>
              <p className="text-sm text-gray-500">{error}</p>
              <button onClick={fetchGrups}
                className="flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2
                  text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all">
                <RefreshCw size={13} /> Coba Lagi
              </button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center gap-4 py-16 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#EEF1FB]">
                <Users size={28} className="text-[#232F72]/40" />
              </div>
              <div>
                <p className="font-semibold text-gray-600">
                  {search ? 'Grup tidak ditemukan' : 'Belum punya grup'}
                </p>
                <p className="mt-1 text-sm text-gray-400">
                  {search ? 'Coba kata kunci lain' : 'Buat grup pertamamu sekarang!'}
                </p>
              </div>
              {!search && (
                <button onClick={() => setModalBuat(true)}
                  className="flex items-center gap-2 rounded-xl bg-[#232F72] px-5 py-2.5
                    text-sm font-semibold text-white hover:bg-[#121358] transition-all">
                  <Plus size={14} /> Buat Grup
                </button>
              )}
            </div>
          ) : (
            filtered.map(g => (
              <GrupCard key={g.id} grup={g}
                isSelected={selected?.id === g.id}
                onSelect={setSelected}
                onUndang={setModalUndang}
                onKeluar={setModalKeluar} />
            ))
          )}
        </div>

        {/* Footer */}
        {!loading && !error && grups.length > 0 && (
          <div className="border-t border-gray-100 px-5 py-3 shrink-0">
            <p className="text-xs text-gray-400">
              {grups.length} grup · {filtered.length} ditampilkan
            </p>
          </div>
        )}
      </div>

      {/* ──────── KANAN: detail panel ──────── */}
      <div className="hidden lg:flex flex-1 flex-col overflow-y-auto p-6">
        {selected ? (
          <DetailPanel
            grup={selected}
            onUndang={setModalUndang}
            onKeluar={setModalKeluar}
            onClose={() => setSelected(null)}
            onMembersUpdated={fetchGrups}
          />
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-5 text-center">
            <div className="relative flex h-20 w-20 items-center justify-center rounded-3xl bg-[#EEF1FB]">
              <Users size={36} className="text-[#232F72]/30" />
              <div className="absolute -bottom-1.5 -right-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-[#36ADA3] shadow-sm">
                <ChevronRight size={14} className="text-white" />
              </div>
            </div>
            <div>
              <p className="font-bold text-gray-500">Pilih grup untuk melihat detail</p>
              <p className="mt-1 text-sm text-gray-300">Klik kartu grup di sebelah kiri</p>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {modalBuat && (
        <ModalBuatGrup
          onClose={() => setModalBuat(false)}
          onCreated={handleCreated}
          userId={user?.id}   // FIX #3: pass userId
        />
      )}
      {modalUndang && (
        <ModalUndang
          onClose={() => setModalUndang(null)}
          grup={modalUndang}
        />
      )}
      {modalKeluar && (
        <ModalKeluar
          onClose={() => setModalKeluar(null)}
          grup={modalKeluar}
          onLeft={handleLeft}
          userId={user?.id}   // FIX #4: pass userId untuk delete member
        />
      )}
    </div>
  )
}