import React, { useCallback, useRef, useState } from 'react'
import { useTour } from '../../context/TourContext'
import { useAdminSubtitleUnlock } from '../../hooks/useAdminSubtitleUnlock'
import { Button } from '../UI/Button'
import { AuthModal } from '../Admin/AuthModal'
import { Toast } from '../UI/Toast'
import { Shield, LogOut, Download, Upload } from 'lucide-react'

export const Header: React.FC = () => {
  const { 
    isAdmin,
    adminLoginEnabled,
    loginAdmin, 
    logoutAdmin, 
    exportBackup, 
    importBackup 
  } = useTour()

  const [isAuthOpen, setIsAuthOpen] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  const openAuthModal = useCallback(() => {
    if (!isAdmin && adminLoginEnabled) {
      setIsAuthOpen(true)
    }
  }, [isAdmin, adminLoginEnabled])

  const handleSubtitleClick = useAdminSubtitleUnlock(
    openAuthModal,
    adminLoginEnabled && !isAdmin
  )

  const handleLoginSuccess = () => {
    setIsAuthOpen(false)
    setToast({ message: '管理员解锁成功，可以编辑画布了。', type: 'success' })
  }

  const handleLoginFail = (msg: string) => {
    setToast({ message: msg, type: 'error' })
  }

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
      } catch (err) {
        setToast({ message: '解析 JSON 文件失败，请确认文件无损。', type: 'error' })
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  return (
    <header className="header">
      {/* 左侧：Logo 和标题 */}
      <div className="header-brand">
        <img 
          src="https://raw.githubusercontent.com/Wing900/PlotKityCat/master/logo.png" 
          alt="PlotKityCat Logo" 
          className="header-logo"
        />
        <div className="header-title-group">
          <h1 className="header-title">PlotKityCat</h1>
          <span
            className="header-subtitle"
            onClick={handleSubtitleClick}
            role="presentation"
          >
            官方教程网页 • Kity-Tour
          </span>
        </div>
      </div>

      <div className="header-actions">
        {isAdmin ? (
          <>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              accept=".json" 
              className="hidden" 
            />
            
            <div className="admin-badge">
              <Shield className="admin-badge-icon" />
              <span>管理员状态</span>
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

            <Button 
              variant="danger" 
              size="sm" 
              onClick={logoutAdmin}
              className="flex items-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>退出</span>
            </Button>
          </>
        ) : null}
      </div>

      {/* 登录弹窗 */}
      <AuthModal 
        isOpen={isAuthOpen}
        adminLoginEnabled={adminLoginEnabled}
        onClose={() => setIsAuthOpen(false)}
        onSuccess={handleLoginSuccess}
        onFail={handleLoginFail}
        loginAdmin={loginAdmin}
      />

      {/* 提示通知 */}
      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(null)} 
        />
      )}
    </header>
  )
}
