import React, { useRef, useState } from 'react'
import { useTour } from '../../context/TourContext'
import { Button } from '../UI/Button'
import { Toast } from '../UI/Toast'
import { Shield, LogOut, Download, Upload } from 'lucide-react'

/** 编辑模式工具条（Logo 在侧栏进入） */
export const Header: React.FC = () => {
  const { isAdmin, logoutAdmin, exportBackup, importBackup } = useTour()

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImportClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string)
        if (json && json.folders) {
          const success = importBackup(json.folders)
          if (success) {
            setToast({ message: '备份导入成功！数据已更新。', type: 'success' })
          } else {
            setToast({ message: '导入失败：JSON 格式不正确。', type: 'error' })
          }
        } else {
          setToast({ message: '导入失败：未找到有效数据结构。', type: 'error' })
        }
      } catch {
        setToast({ message: '解析 JSON 文件失败，请确认文件无损。', type: 'error' })
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  if (!isAdmin) {
    return null
  }

  return (
    <div className="main-admin-strip-host">
      <header className="main-admin-strip">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".json"
          className="hidden"
        />

        <div className="main-admin-strip-inner">
          <div className="admin-badge">
            <Shield className="admin-badge-icon" />
            <span>编辑模式</span>
          </div>

          <Button
            variant="secondary"
            size="sm"
            onClick={exportBackup}
            title="导出备份 JSON"
            className="flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>导出备份</span>
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={handleImportClick}
            title="导入备份 JSON"
            className="flex items-center gap-1.5"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>导入备份</span>
          </Button>

          <Button variant="danger" size="sm" onClick={logoutAdmin} className="flex items-center gap-1.5">
            <LogOut className="w-3.5 h-3.5" />
            <span>退出</span>
          </Button>
        </div>
      </header>

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  )
}
