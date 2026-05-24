/**
 * src/utils/format.js
 * Helper terpusat untuk format currency dan tanggal — Talang.in
 */

// ─── Currency ────────────────────────────────────────────────────────────────

/**
 * Format angka ke Rupiah dengan simbol Rp dan pemisah ribuan.
 * Contoh: 150000 → "Rp 150.000"
 */
export const rupiah = (n) =>
  'Rp ' + Number(Math.abs(n) ?? 0).toLocaleString('id-ID')

/**
 * Format angka ke Rupiah pakai Intl (lebih lengkap, termasuk desimal opsional).
 * Contoh: 150000 → "Rp 150.000"
 */
export const fmt = (n) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(n ?? 0)

/**
 * Format dengan tanda +/- untuk balance (piutang/hutang).
 * Contoh: 50000 → "+Rp 50.000", -30000 → "-Rp 30.000", 0 → "±0"
 */
export const rupiahBalance = (n) => {
  if (!n || n === 0) return '±0'
  return (n > 0 ? '+' : '-') + rupiah(n)
}

// ─── Tanggal ─────────────────────────────────────────────────────────────────

/**
 * Format tanggal ke "12 Jan 2026"
 */
export const fmtDate = (d) =>
  d
    ? new Date(d).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : '—'

/**
 * Format tanggal ke "12 Januari 2026" (bulan panjang)
 */
export const fmtDateLong = (d) =>
  d
    ? new Date(d).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : '—'

/**
 * Format hanya bulan dan tahun: "Januari 2026"
 */
export const fmtMonthYear = (d) =>
  d
    ? new Date(d).toLocaleDateString('id-ID', {
        month: 'long',
        year: 'numeric',
      })
    : '—'

/**
 * Format relatif: "Baru saja", "5 menit lalu", "2 jam lalu", "3 hari lalu"
 */
export const timeAgo = (dateStr) => {
  if (!dateStr) return '—'
  const diff = Date.now() - new Date(dateStr).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1)  return 'Baru saja'
  if (m < 60) return `${m} menit lalu`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h} jam lalu`
  const d = Math.floor(h / 24)
  if (d < 7)  return `${d} hari lalu`
  return fmtDate(dateStr)
}

/**
 * Format tanggal hari ini untuk header dashboard.
 * Contoh: "Sabtu, 23 Mei 2026"
 */
export const fmtToday = () =>
  new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })