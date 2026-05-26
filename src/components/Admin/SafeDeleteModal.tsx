import React, { useState, useEffect } from 'react'
import { Card } from '../UI/Card'
import { Button } from '../UI/Button'
import { AlertTriangle } from 'lucide-react'

interface SafeDeleteModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  itemName: string
  itemType: '文件夹' | '文件' | '页面'
}

export const SafeDeleteModal: React.FC<SafeDeleteModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  itemName,
  itemType
}) => {
  const [inputValue, setInputValue] = useState('')

  useEffect(() => {
    if (isOpen) {
      setInputValue('')
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleConfirm = () => {
    if (inputValue === 'DELETE') {
      onConfirm()
      onClose()
    }
  }

  return (
    <div className="modal-overlay">
      <Card variant="default" shadowSize="sm" className="w-full max-w-[400px] p-6 m-4 animate-slide-in">
        <div className="modal-form">
          <div className="modal-header danger">
            <AlertTriangle className="w-4 h-4" strokeWidth={1.5} />
            <h3 className="modal-header-title">确认删除</h3>
          </div>

          <div className="text-sm text-[var(--color-text)] leading-relaxed">
            您正在删除{itemType}：
            <strong className="modal-delete-target">{itemName}</strong>
            <span className="modal-delete-warning">
              此操作不可恢复，相关画布数据将一并删除。
            </span>
          </div>

          <div className="modal-field">
            <label className="modal-label">
              请输入 <span className="modal-delete-code">DELETE</span> 以确认
            </label>
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="DELETE"
              autoFocus
              className="modal-input danger"
            />
          </div>

          <div className="modal-actions">
            <Button variant="outline" size="sm" onClick={onClose}>
              取消
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={handleConfirm}
              disabled={inputValue !== 'DELETE'}
            >
              确定删除
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
