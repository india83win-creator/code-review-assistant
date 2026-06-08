'use client'

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { CheckCircle2, X, XCircle } from 'lucide-react'

type ToastKind = 'success' | 'error'

type Toast = {
  id: number
  message: string
  kind: ToastKind
}

type ToastContextValue = {
  notify: (message: string, kind?: ToastKind) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    return { notify: () => undefined }
  }
  return context
}

export default function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const removeToast = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id))
  }, [])

  const notify = useCallback(
    (message: string, kind: ToastKind = 'success') => {
      const id = Date.now()
      setToasts((current) => [...current, { id, message, kind }])
      window.setTimeout(() => removeToast(id), 3200)
    },
    [removeToast]
  )

  const value = useMemo(() => ({ notify }), [notify])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed right-4 top-4 z-50 flex w-[min(360px,calc(100vw-2rem))] flex-col gap-3">
        {toasts.map((toast) => {
          const Icon = toast.kind === 'success' ? CheckCircle2 : XCircle
          const tone =
            toast.kind === 'success'
              ? 'border-emerald-400/25 bg-emerald-400/10 text-emerald-100'
              : 'border-rose-400/25 bg-rose-400/10 text-rose-100'

          return (
            <div
              key={toast.id}
              className={`pointer-events-auto flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm shadow-2xl shadow-slate-950/40 backdrop-blur-xl ${tone}`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <p className="min-w-0 flex-1">{toast.message}</p>
              <button
                type="button"
                aria-label="Dismiss notification"
                onClick={() => removeToast(toast.id)}
                className="rounded-full p-1 text-current opacity-70 transition hover:bg-white/10 hover:opacity-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}
