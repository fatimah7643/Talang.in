import { useState, useEffect, useCallback } from 'react'
import {
  Clock, Search, Receipt, AlertCircle,
  RefreshCw, ChevronDown, Users, X,
  ArrowUpRight, CalendarDays, Eye, Plus,
  SlidersHorizontal,
} from 'lucide-react'
import api from '../../services/api'
import { useAuth } from '../../context/AuthContext'

/* ─────────────────────── HELPERS ───────────────────── */
const rupiah = (n) => 'Rp ' + Number(Math.abs(n) || 0).toLocaleString('id-ID')
const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'
const Sk = ({ className = '' }) => (
  <div className={`animate-pulse rounded-xl bg-gray-100 ${className}`} />
)

const KATEGORI_COLOR = {
  'Makanan & Minuman': { bg: '#FAEEDA', text: '#633806' },
  'Transportasi':      { bg: '#E6F1FB', text: '#0C447C' },
  'Belanja':           { bg: '#EEEDFE', text: '#3C3489' },
  'Hiburan':           { bg: '#FBEAF0', text: '#72243E' },
  'Tagihan':           { bg: '#E6F1FB', text: '#0C447C' },
  'Kesehatan':         { bg: '#E1F5EE', text: '#0F6E56' },
  'Pendidikan':        { bg: '#EEEDFE', text: '#3C3489' },
  'Penginapan':        { bg: '#E1F5EE', text: '#0F6E56' },
  'Lainnya':           { bg: '#F1EFE8', text: '#5F5E5A' },
}
const getKatColor = (cat) => KATEGORI_COLOR[cat] || { bg: '#F1EFE8', text: '#5F5E5A' }

const KATEGORI_LIST = [
  'Makanan & Minuman', 'Transportasi', 'Belanja', 'Hiburan',
  'Tagihan', 'Kesehatan', 'Pendidikan', 'Penginapan', 'Lainnya',
]

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
              className={`flex w-full items-center gap-2.5 px-4 py-2.5 text-sm transition-all
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

/* ─────────────────────── KATEGORI DROPDOWN ─────────────────────── */
function KategoriSelect({ value, onChange }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(p => !p)}
        className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3.5 py-2
          text-sm text-gray-600 hover:border-gray-300 transition-all whitespace-nowrap"
      >
        {value || 'Semua Kategori'}
        <ChevronDown size={13} className={`text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute left-0 top-11 z-20 w-48 rounded-xl border border-gray-100 bg-white py-1.5 shadow-lg">
          <button
            onClick={() => { onChange(''); setOpen(false) }}
            className={`flex w-full px-4 py-2.5 text-sm transition-all
              ${!value ? 'bg-[#E1F5EE] text-[#0F6E56] font-medium' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            Semua Kategori
          </button>
          {KATEGORI_LIST.map(k => (
            <button
              key={k}
              onClick={() => { onChange(k); setOpen(false) }}
              className={`flex w-full px-4 py-2.5 text-sm transition-all
                ${value === k ? 'bg-[#E1F5EE] text-[#0F6E56] font-medium' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              {k}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

/* ─────────────────────── TX ROW ─────────────────────────────────── */
function TxRow({ tx }) {
  const kat   = tx.category || tx.kategori || ''
  const col   = getKatColor(kat)
  const nama  = tx.description || tx.name || tx.nama || '—'
  const total = tx.total_amount ?? tx.amount ?? 0

  return (
    <div className="flex flex-col sm:grid items-start sm:items-center gap-0 border-b border-gray-50 last:border-0
      hover:bg-gray-50 transition-colors cursor-pointer px-4 sm:px-0 py-3 sm:py-0"
      style={{ gridTemplateColumns: '2fr 1fr 1fr 1fr 56px' }}
    >
      {/* Nama */}
     <div className="flex items-center gap-3 sm:px-4 sm:py-3.5 min-w-0 w-full">
        <div
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl"
          style={{ backgroundColor: col.bg, color: col.text }}
        >
          <Receipt size={14} />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-gray-800 truncate">{nama}</p>
          <p className="text-xs text-gray-400 mt-0.5">{fmtDate(tx.created_at || tx.date)}</p>
        </div>
      </div>

      {/* Kategori */}
      <div className="sm:px-4 sm:py-3.5">
        {kat ? (
          <span
            className="inline-block rounded-full px-2.5 py-0.5 text-xs font-medium"
            style={{ backgroundColor: col.bg, color: col.text }}
          >
            {kat}
          </span>
        ) : (
          <span className="text-xs text-gray-300">—</span>
        )}
      </div>

      {/* Nominal */}
      <div className="sm:px-4 sm:py-3.5 sm:text-right">
        <p className="text-sm font-medium text-red-500">{rupiah(total)}</p>
      </div>

      {/* Pembayar */}
      <div className="sm:px-4 sm:py-3.5">
        <p className="text-sm text-gray-600">{tx.paid_by_name || tx.pembayar || '—'}</p>
        {tx.group_name && (
          <p className="text-xs text-gray-400 mt-0.5 truncate">{tx.group_name}</p>
        )}
      </div>

      {/* Aksi */}
      <div className="sm:px-4 sm:py-3.5 flex justify-start sm:justify-center">
        <button
          className="flex h-7 w-7 items-center justify-center rounded-lg bg-gray-100
            text-gray-400 hover:bg-gray-200 hover:text-gray-600 transition-all"
        >
          <Eye size={13} />
        </button>
      </div>
    </div>
  )
}

/* ─────────────────────── HALAMAN UTAMA ─────────────────────────── */
export default function Riwayat() {
  const { user } = useAuth()
  const [grups, setGrups]             = useState([])
  const [selectedGrup, setSelected]   = useState('')
  const [txList, setTxList]           = useState([])
  const [loading, setLoading]         = useState(false)
  const [loadingGrup, setLoadingGrup] = useState(true)
  const [error, setError]             = useState('')
  const [search, setSearch]           = useState('')
  const [kategori, setKategori]       = useState('')
  const [page, setPage]               = useState(1)
  const [totalPages, setTotalPages]   = useState(1)
  const [totalCount, setTotalCount]   = useState(0)

  /* fetch grup list */
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

  /* fetch transaksi */
  const fetchTx = useCallback(async () => {
    if (!selectedGrup) { setTxList([]); return }
    setLoading(true); setError('')
    try {
      const params = { page, limit: 10 }
      if (search.trim())  params.search   = search.trim()
      if (kategori)       params.category = kategori
      const res  = await api.get(`/bills/${selectedGrup}/history`, { params })
      const raw  = res.data?.data || res.data || []
      const list = Array.isArray(raw) ? raw : raw.bills || []
      setTxList(list)
      setTotalPages(res.data?.meta?.total_pages ?? res.data?.total_pages ?? 1)
      setTotalCount(res.data?.meta?.total ?? res.data?.total ?? list.length)
    } catch (e) {
      setError(e.response?.data?.message || 'Gagal memuat riwayat transaksi.')
    } finally {
      setLoading(false)
    }
  }, [selectedGrup, page, search, kategori])

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchTx() }, [fetchTx])

  const handleReset = () => {
    setSearch('')
    setKategori('')
    setPage(1)
  }

  const totalNominal   = txList.reduce((a, t) => a + (t.total_amount ?? t.amount ?? 0), 0)
  const hasFilter      = search || kategori
  // eslint-disable-next-line no-unused-vars
  const curGrup        = grups.find(g => g.id === selectedGrup)

  /* pagination range */
  const pageRange = () => {
    const delta = 1
    const range = []
    for (let i = Math.max(1, page - delta); i <= Math.min(totalPages, page + delta); i++) {
      range.push(i)
    }
    return range
  }

  return (
    <div className="flex h-full flex-col overflow-hidden bg-gray-50">

      {/* ── Topbar ── */}
      <header className="flex items-center justify-between border-b border-gray-100 bg-white
        px-3 sm:px-6 py-3.5 shrink-0 gap-2 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#E1F5EE]">
            <Clock size={18} className="text-[#1D9E75]" />
          </div>
          <div>
            <h1 className="text-base font-semibold text-gray-900">Riwayat Transaksi</h1>
            <p className="text-xs text-gray-400">Semua catatan pengeluaran grup kamu</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {loadingGrup ? (
            <Sk className="h-9 w-36" />
          ) : grups.length > 0 ? (
            <GrupSelector
              grups={grups}
              selected={selectedGrup}
              onChange={v => { setSelected(v); setPage(1) }}
            />
          ) : null}
          {selectedGrup && (
            <button
              className="flex items-center gap-1.5 rounded-xl bg-[#1D9E75] px-3.5 py-2
                text-sm font-medium text-white hover:bg-[#0F6E56] transition-all"
            >
              <Plus size={14} />
              <span className="hidden sm:inline">Tambah Transaksi</span>
            </button>
          )}
        </div>
      </header>

      {/* ── Content ── */}
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">

        {/* No grup selected */}
        {!loadingGrup && grups.length === 0 && (
          <div className="flex flex-col items-center gap-4 py-20 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100">
              <CalendarDays size={24} className="text-gray-300" />
            </div>
            <div>
              <p className="font-medium text-gray-500">Belum ada grup</p>
              <p className="text-sm text-gray-400 mt-1">Buat grup dulu untuk mencatat transaksi</p>
            </div>
          </div>
        )}

        {!selectedGrup && !loadingGrup && grups.length > 0 && (
          <div className="flex flex-col items-center gap-4 py-20 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100">
              <CalendarDays size={24} className="text-gray-300" />
            </div>
            <div>
              <p className="font-medium text-gray-500">Pilih grup untuk melihat riwayat</p>
              <p className="text-sm text-gray-400 mt-1">Gunakan dropdown di atas untuk memilih grup</p>
            </div>
          </div>
        )}

        {selectedGrup && (
          <>
            {/* ── Summary Cards ── */}
            {!loading && !error && txList.length > 0 && (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <div className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white p-3.5">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#FCEBEB]">
                    <Receipt size={14} className="text-red-500" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Total Transaksi</p>
                    <p className="text-sm font-medium text-gray-800 mt-0.5">{totalCount} tagihan</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white p-3.5">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#FCEBEB]">
                    <ArrowUpRight size={14} className="text-red-500" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Total Pengeluaran</p>
                    <p className="text-sm font-medium text-red-500 mt-0.5">{rupiah(totalNominal)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white p-3.5 sm:flex hidden">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#E1F5EE]">
                    <Users size={14} className="text-[#1D9E75]" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Halaman</p>
                    <p className="text-sm font-medium text-gray-800 mt-0.5">{page} / {totalPages}</p>
                  </div>
                </div>
              </div>
            )}

            {/* ── Filter Row ── */}
            <div className="flex gap-2 flex-wrap">
              {/* Search */}
              <div className="flex flex-1 min-w-0 items-center gap-2 rounded-xl border border-gray-200
                bg-white px-3 py-2 transition-all focus-within:border-[#1D9E75] focus-within:ring-2 focus-within:ring-[#1D9E75]/10">
                <Search size={14} className="text-gray-400 shrink-0" />
                <input
                  className="flex-1 text-sm outline-none bg-transparent text-gray-800 placeholder-gray-400"
                  placeholder="Cari transaksi..."
                  value={search}
                  onChange={e => { setSearch(e.target.value); setPage(1) }}
                />
                {search && (
                  <button onClick={() => { setSearch(''); setPage(1) }}>
                    <X size={13} className="text-gray-400 hover:text-gray-600" />
                  </button>
                )}
              </div>

              {/* Kategori */}
              <KategoriSelect value={kategori} onChange={v => { setKategori(v); setPage(1) }} />

              {/* Reset */}
              {hasFilter && (
                <button
                  onClick={handleReset}
                  className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white
                    px-3.5 py-2 text-sm text-gray-500 hover:bg-gray-50 transition-all"
                >
                  <SlidersHorizontal size={13} />
                  Reset
                </button>
              )}
            </div>

            {/* ── Table / States ── */}
            {loading ? (
              <div className="space-y-2">
                {[1, 2, 3, 4, 5].map(i => <Sk key={i} className="h-[60px] rounded-xl" />)}
              </div>
            ) : error ? (
              <div className="flex flex-col items-center gap-3 py-16 text-center">
                <AlertCircle size={28} className="text-red-400" />
                <p className="text-sm text-gray-500">{error}</p>
                <button
                  onClick={fetchTx}
                  className="flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2
                    text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all"
                >
                  <RefreshCw size={13} />Coba Lagi
                </button>
              </div>
            ) : txList.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-16 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100">
                  <Clock size={24} className="text-gray-300" />
                </div>
                <div>
                  <p className="font-medium text-gray-500">
                    {hasFilter ? 'Transaksi tidak ditemukan' : 'Belum ada transaksi'}
                  </p>
                  <p className="text-sm text-gray-400 mt-1">
                    {hasFilter ? 'Coba ubah kata kunci atau filter' : 'Transaksi grup akan muncul di sini'}
                  </p>
                </div>
                {hasFilter && (
                  <button
                    onClick={handleReset}
                    className="rounded-xl border border-gray-200 px-4 py-2 text-sm
                      text-gray-600 hover:bg-gray-50 transition-all"
                  >
                    Reset Filter
                  </button>
                )}
              </div>
            ) : (
              <div className="rounded-xl border border-gray-100 bg-white overflow-hidden">
                {/* Table Head */}
                <div
                  className="hidden sm:grid border-b border-gray-100 px-4 py-2.5 bg-gray-50"
                  style={{ gridTemplateColumns: '2fr 1fr 1fr 1fr 56px' }}
                >
                  {['Nama Transaksi', 'Kategori', 'Nominal', 'Pembayar', ''].map((h, i) => (
                    <p
                      key={i}
                      className={`text-[11px] font-semibold uppercase tracking-wider text-gray-400
                        ${i === 2 ? 'text-right' : ''}`}
                    >
                      {h}
                    </p>
                  ))}
                </div>

                {/* Rows */}
                {txList.map((tx, i) => <TxRow key={tx.id ?? i} tx={tx} />)}

                {/* Footer */}
                <div className="flex items-center justify-between border-t border-gray-100 px-4 py-3">
                  <p className="text-xs text-gray-400">
                    Menampilkan {txList.length} dari {totalCount} transaksi
                  </p>
                  {totalPages > 1 && (
                    <div className="flex items-center gap-1">
                      <button
                        disabled={page <= 1}
                        onClick={() => setPage(p => p - 1)}
                        className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200
                          text-gray-400 hover:bg-gray-50 disabled:opacity-40 transition-all"
                      >
                        <ChevronDown size={13} className="rotate-90" />
                      </button>
                      {pageRange().map(p => (
                        <button
                          key={p}
                          onClick={() => setPage(p)}
                          className={`flex h-7 w-7 items-center justify-center rounded-lg text-xs font-medium transition-all
                            ${p === page
                              ? 'bg-[#232F72] text-white border border-[#232F72]'
                              : 'border border-gray-200 text-gray-500 hover:bg-gray-50'}`}
                        >
                          {p}
                        </button>
                      ))}
                      <button
                        disabled={page >= totalPages}
                        onClick={() => setPage(p => p + 1)}
                        className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200
                          text-gray-400 hover:bg-gray-50 disabled:opacity-40 transition-all"
                      >
                        <ChevronDown size={13} className="-rotate-90" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}