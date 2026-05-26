import React, { useEffect } from 'react'

interface ToastProps {
  message: string
  type?: 'success' | 'error' | 'info'
  onClose: () => void
  duration?: number
}

export const Toast: React.FC<ToastProps> = ({
  message,
  type = 'success',
  onClose,
  duration = 2500
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose()
    }, duration)
    return () => clearTimeout(timer)
  }, [onClose, duration])

  return (
    <div className="toast">
      <span className={`toast-dot ${type}`} />
      <span>{message}</span>
      <button type="button" onClick={onClose} className="toast-close" aria-label="关闭">
        ×
      </button>
    </div>
  )
}
