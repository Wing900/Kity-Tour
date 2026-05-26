import React, { useState } from 'react'
import { Card } from '../UI/Card'
import { Button } from '../UI/Button'
import { Lock } from 'lucide-react'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  onFail: (msg: string) => void
  loginAdmin: (password: string) => boolean
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  onFail,
  loginAdmin
}) => {
  const [password, setPassword] = useState('')

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const success = loginAdmin(password)
    if (success) {
      setPassword('')
      onSuccess()
    } else {
      onFail('密码错误，请重试。')
    }
  }

  return (
    <div className="modal-overlay">
      <Card variant="default" shadowSize="sm" className="w-full max-w-[360px] p-6 m-4 animate-slide-in">
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="modal-header">
            <Lock className="w-4 h-4 text-[var(--color-primary)]" strokeWidth={1.5} />
            <h3 className="modal-header-title">解锁管理员权限</h3>
          </div>

          <div className="modal-field">
            <label className="modal-label">请输入密码</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="管理员密码"
              autoFocus
              className="modal-input"
            />
          </div>

          <div className="modal-actions">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              取消
            </Button>
            <Button type="submit" variant="primary" size="sm">
              确定解锁
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
