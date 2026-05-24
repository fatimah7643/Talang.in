import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react'

// ─── Context ──────────────────────────────────────────────────────────────────
const ToastContext = createContext(null)

// ─── Config per tipe ──────────────────────────────────────────────────────────
const CONFIG = {
  success: {
    icon: CheckCircle2,
    bg:     '#f0fdf4',
    border: '#bbf7d0',
    icon_c: '#16a34a',
    title_c:'#15803d',
    bar:    '#16a34a',
  },
  error: {
    icon: XCircle,
    bg:     '#fef2f2',
    border: '#fecaca',
    icon_c: '#dc2626',
    title_c:'#b91c1c',
    bar:    '#dc2626',
  },
  warning: {
    icon: AlertTriangle,
    bg:     '#fffbeb',
    border: '#fde68a',
    icon_c: '#d97706',
    title_c:'#b45309',
    bar:    '#f59e0b',
  },
  info: {
    icon: Info,
    bg:     '#eff6ff',
    border: '#bfdbfe',
    icon_c: '#2563eb',
    title_c:'#1d4ed8',
    bar:    '#3b82f6',
  },
}

// ─── Single Toast Item ────────────────────────────────────────────────────────
function ToastItem({ toast, onRemove }) {
  const cfg         = CONFIG[toast.type] || CONFIG.info
  const Icon        = cfg.icon
  const [out, setOut] = useState(false)
  const timerRef    = useRef(null)
  const duration    = toast.duration ?? 3500

  const dismiss = useCallback(() => {
    setOut(true)
    setTimeout(() => onRemove(toast.id), 300)
  }, [toast.id, onRemove])

  useEffect(() => {
    timerRef.current = setTimeout(dismiss, duration)
    return () => clearTimeout(timerRef.current)
  }, [dismiss, duration])

  // Pause timer on hover
  const pause  = () => clearTimeout(timerRef.current)
  const resume = () => { timerRef.current = setTimeout(dismiss, 800) }

  return (
    <div
      onMouseEnter={pause}
      onMouseLeave={resume}
      style={{
        background:    cfg.bg,
        border:        `1px solid ${cfg.border}`,
        borderRadius:  14,
        padding:       '12px 14px',
        display:       'flex',
        alignItems:    'flex-start',
        gap:           10,
        boxShadow:     '0 4px 20px rgba(0,0,0,0.08)',
        width:         320,
        position:      'relative',
        overflow:      'hidden',
        opacity:       out ? 0 : 1,
        transform:     out ? 'translateX(24px)' : 'translateX(0)',
        transition:    'opacity .25s ease, transform .25s ease',
      }}
    >
      {/* Progress bar */}
      <div style={{
        position:   'absolute',
        bottom:     0, left: 0,
        height:     3,
        background: cfg.bar,
        borderRadius: '0 0 0 14px',
        animation:  `toast-bar ${duration}ms linear forwards`,
      }} />

      <Icon size={17} style={{ color: cfg.icon_c, flexShrink: 0, marginTop: 1 }} />

      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: cfg.title_c, lineHeight: 1.4 }}>
          {toast.title}
        </p>
        {toast.message && (
          <p style={{ margin: '3px 0 0', fontSize: 12, color: '#6b7280', lineHeight: 1.5 }}>
            {toast.message}
          </p>
        )}
      </div>

      <button
        onClick={dismiss}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          padding: 2, color: '#9ca3af', flexShrink: 0, lineHeight: 0,
        }}
      >
        <X size={14} />
      </button>
    </div>
  )
}

// ─── Provider ────────────────────────────────────────────────────────────────
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const add = useCallback((type, title, message, duration) => {
    const id = Date.now() + Math.random()
    setToasts(p => [...p.slice(-4), { id, type, title, message, duration }])
    return id
  }, [])

  const remove = useCallback((id) => {
    setToasts(p => p.filter(t => t.id !== id))
  }, [])

  // Shorthand helpers
  const toast = {
    success: (title, msg, dur) => add('success', title, msg, dur),
    error:   (title, msg, dur) => add('error',   title, msg, dur),
    warning: (title, msg, dur) => add('warning', title, msg, dur),
    info:    (title, msg, dur) => add('info',    title, msg, dur),
  }

  return (
    <ToastContext.Provider value={toast}>
      {children}

      {/* Keyframe injection */}
      <style>{`
        @keyframes toast-bar {
          from { width: 100%; }
          to   { width: 0%; }
        }
        @keyframes toast-in {
          from { opacity: 0; transform: translateX(32px); }
          to   { opacity: 1; transform: translateX(0); }
        }
      `}</style>

      {/* Render stack — bottom-right */}
      <div style={{
        position:      'fixed',
        bottom:        24,
        right:         24,
        zIndex:        9999,
        display:       'flex',
        flexDirection: 'column',
        gap:           10,
        pointerEvents: 'none',
      }}>
        {toasts.map(t => (
          <div key={t.id} style={{ pointerEvents: 'all', animation: 'toast-in .25s ease' }}>
            <ToastItem toast={t} onRemove={remove} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export const useToast = () => {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>')
  return ctx
}