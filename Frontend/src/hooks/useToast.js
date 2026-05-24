import { useState, useCallback, useRef } from 'react'

export function useToast(duration = 3500) {
  const [toasts, setToasts] = useState([])
  const timerRef = useRef({})

  const show = useCallback((message, type = 'success') => {
    const id = Date.now()
    setToasts((p) => [...p, { id, message, type }])
    timerRef.current[id] = setTimeout(() => {
      setToasts((p) => p.filter((t) => t.id !== id))
      delete timerRef.current[id]
    }, duration)
    return id
  }, [duration])

  const dismiss = useCallback((id) => {
    clearTimeout(timerRef.current[id])
    delete timerRef.current[id]
    setToasts((p) => p.filter((t) => t.id !== id))
  }, [])

  // Shortcut helpers
  const success = useCallback((msg) => show(msg, 'success'), [show])
  const error   = useCallback((msg) => show(msg, 'error'),   [show])
  const info    = useCallback((msg) => show(msg, 'info'),    [show])
  const warning = useCallback((msg) => show(msg, 'warning'), [show])

  return { toasts, show, dismiss, success, error, info, warning }
}