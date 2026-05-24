import { CheckCircle, XCircle, Info, AlertTriangle, X } from 'lucide-react'

const CONFIG = {
  success: {
    icon: CheckCircle,
    bg:     'bg-white',
    border: 'border-[#36ADA3]/40',
    icon_color: 'text-[#36ADA3]',
    bar:    'bg-[#36ADA3]',
  },
  error: {
    icon: XCircle,
    bg:     'bg-white',
    border: 'border-red-200',
    icon_color: 'text-red-500',
    bar:    'bg-red-500',
  },
  info: {
    icon: Info,
    bg:     'bg-white',
    border: 'border-[#2F578A]/30',
    icon_color: 'text-[#2F578A]',
    bar:    'bg-[#2F578A]',
  },
  warning: {
    icon: AlertTriangle,
    bg:     'bg-white',
    border: 'border-amber-300',
    icon_color: 'text-amber-500',
    bar:    'bg-amber-400',
  },
}

function ToastItem({ toast, onDismiss }) {
  const c    = CONFIG[toast.type] ?? CONFIG.info
  const Icon = c.icon

  return (
    <div
      className={`relative flex items-start gap-3 w-80 rounded-2xl border shadow-lg overflow-hidden
        px-4 py-3.5 ${c.bg} ${c.border}
        animate-[slideInRight_0.3s_ease_forwards]`}
      style={{ boxShadow: '0 4px 24px rgba(18,19,88,0.10)' }}
    >
      {/* Color bar kiri */}
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${c.bar}`} />

      <Icon size={17} className={`shrink-0 mt-0.5 ${c.icon_color}`} />

      <p className="flex-1 text-sm font-medium text-gray-800 leading-snug pr-1">
        {toast.message}
      </p>

      <button
        onClick={() => onDismiss(toast.id)}
        className="shrink-0 text-gray-300 hover:text-gray-500 transition-colors mt-0.5"
      >
        <X size={14} />
      </button>
    </div>
  )
}

export default function ToastContainer({ toasts, onDismiss }) {
  if (!toasts.length) return null

  return (
    <>
      <style>{`
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(24px); }
          to   { opacity: 1; transform: translateX(0); }
        }
      `}</style>
      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2 items-end">
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onDismiss={onDismiss} />
        ))}
      </div>
    </>
  )
}