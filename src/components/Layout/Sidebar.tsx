import React, { useMemo, useState } from 'react'
import { useTour, type Folder, type FileItem } from '../../context/TourContext'
import { SafeDeleteModal } from '../Admin/SafeDeleteModal'
import { Button } from '../UI/Button'
import { Toast } from '../UI/Toast'
import { exportTutorialPdf } from '../../lib/exportPdf'
import { Plus, PencilSimple, Trash, CaretUp, CaretDown, X, Sparkle } from '@phosphor-icons/react'

type FilteredFolder = { folder: Folder; files: FileItem[] }

function filterFoldersByQuery(folders: Folder[], query: string): FilteredFolder[] {
  const q = query.trim().toLowerCase()
  if (!q) {
    return folders.map((folder) => ({ folder, files: folder.files }))
  }
  const out: FilteredFolder[] = []
  for (const folder of folders) {
    const folderMatch = folder.name.toLowerCase().includes(q)
    const matchedFiles = folder.files.filter((f) => f.name.toLowerCase().includes(q))
    if (folderMatch) {
      out.push({ folder, files: folder.files })
    } else if (matchedFiles.length > 0) {
      out.push({ folder, files: matchedFiles })
    }
  }
  return out
}

interface SidebarProps {
  mobileMenuOpen?: boolean
  onMobileMenuClose?: () => void
}

export const Sidebar: React.FC<SidebarProps> = ({ mobileMenuOpen, onMobileMenuClose }) => {
  const {
    folders,
    activeFileId,
    expandedFolders,
    isAdmin,
    setActiveFolderId,
    setActiveFileId,
    toggleFolder,
    addFolder,
    renameFolder,
    deleteFolder,
    moveFolder,
    addFile,
    renameFile,
    deleteFile,
    moveFile,
    loginAdmin
  } = useTour()

  // 弹窗与 Toast 状态
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean
    itemName: string
    itemType: '文件夹' | '文件'
    onConfirm: () => void
  }>({
    isOpen: false,
    itemName: '',
    itemType: '文件',
    onConfirm: () => {}
  })

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [isExporting, setIsExporting] = useState(false)
  const [exportProgress, setExportProgress] = useState<{ done: number; total: number } | null>(null)

  const searchTrim = searchQuery.trim()
  const filteredFolders = useMemo(
    () => filterFoldersByQuery(folders, searchQuery),
    [folders, searchQuery]
  )

  // 导出 PDF 并自动跳转豆包解读
  const handleExportToDoubao = async () => {
    if (isExporting) return
    setIsExporting(true)
    setExportProgress({ done: 0, total: 0 })
    setToast({ message: '正在导出 PDF...', type: 'success' })
    try {
      await exportTutorialPdf(folders, (done, total) => {
        setExportProgress({ done, total })
      })
      // 自动新开豆包页（浏览器无法自动上传，用户拖拽 PDF 到对话框即可）
      window.open('https://www.doubao.com/chat/', '_blank', 'noopener,noreferrer')
      setToast({
        message: 'PDF 已下载并打开豆包，把 PDF 文件拖到豆包对话框发送即可解读',
        type: 'success'
      })
    } catch (err: unknown) {
      setToast({
        message: `导出失败：${err instanceof Error ? err.message : String(err)}`,
        type: 'error' })
    } finally {
      setIsExporting(false)
      setExportProgress(null)
    }
  }

  const handleLogoClick = () => {
    if (isAdmin) return
    loginAdmin()
    setToast({ message: '已进入编辑模式。开发环境会自动保存到本地 JSON。', type: 'success' })
  }

  // 新建文件夹
  const handleCreateFolder = () => {
    const name = prompt('请输入新文件夹名称:', '新建文件夹')
    if (name && name.trim()) {
      addFolder(name.trim())
      setToast({ message: '文件夹创建成功！', type: 'success' })
    }
  }

  // 重命名文件夹
  const handleRenameFolder = (e: React.MouseEvent, folder: Folder) => {
    e.stopPropagation()
    const name = prompt(`请输入文件夹新的名称 [${folder.name}]:`, folder.name)
    if (name && name.trim() && name.trim() !== folder.name) {
      renameFolder(folder.id, name.trim())
      setToast({ message: '文件夹重命名成功！', type: 'success' })
    }
  }

  // 删除文件夹确认
  const handleDeleteFolder = (e: React.MouseEvent, folder: Folder) => {
    e.stopPropagation()
    setDeleteModal({
      isOpen: true,
      itemName: folder.name,
      itemType: '文件夹',
      onConfirm: () => {
        deleteFolder(folder.id)
        setToast({ message: '文件夹已成功删除！', type: 'success' })
      }
    })
  }

  // 新建教程文件
  const handleCreateFile = (e: React.MouseEvent, folderId: string) => {
    e.stopPropagation()
    const name = prompt('请输入新教程文件名称:', '新建教程文件')
    if (name && name.trim()) {
      addFile(folderId, name.trim())
      setToast({ message: '教程文件创建成功！', type: 'success' })
    }
  }

  // 重命名文件
  const handleRenameFile = (e: React.MouseEvent, folderId: string, file: FileItem) => {
    e.stopPropagation()
    const name = prompt(`请输入文件新的名称 [${file.name}]:`, file.name)
    if (name && name.trim() && name.trim() !== file.name) {
      renameFile(folderId, file.id, name.trim())
      setToast({ message: '文件重命名成功！', type: 'success' })
    }
  }

  // 删除文件确认
  const handleDeleteFile = (e: React.MouseEvent, folderId: string, file: FileItem) => {
    e.stopPropagation()
    setDeleteModal({
      isOpen: true,
      itemName: file.name,
      itemType: '文件',
      onConfirm: () => {
        deleteFile(folderId, file.id)
        setToast({ message: '文件已成功删除！', type: 'success' })
      }
    })
  }

  return (
    <aside className={`sidebar${mobileMenuOpen ? ' sidebar--open' : ''}`}>
      <div className="sidebar-brand">
        <img
          src={`${import.meta.env.BASE_URL}logo.png`}
          alt=""
          className="sidebar-brand-logo"
          onClick={handleLogoClick}
          role="presentation"
        />
        <span className="sidebar-brand-title">PlotKityCat</span>
      </div>

      <div className="sidebar-header">
        <input
          type="search"
          className="sidebar-search-input"
          placeholder="搜索名称…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          aria-label="搜索名称"
        />
        {isAdmin && (
          <Button
            variant="primary"
            size="sm"
            onClick={handleCreateFolder}
            title="新增文件夹"
            className="p-1 flex-shrink-0"
          >
            <Plus size={16} />
          </Button>
        )}
        <button className="sidebar-close-btn-mobile" onClick={onMobileMenuClose} aria-label="关闭菜单">
          <X size={16} />
        </button>
      </div>

      {/* 目录列表 */}
      <div className="sidebar-content">
        {folders.length === 0 ? (
          <div className="sidebar-empty-hint">
            <span>目录空空如也</span>
          </div>
        ) : filteredFolders.length === 0 ? (
          <div className="sidebar-empty-hint">
            <span>没有匹配项</span>
          </div>
        ) : (
          filteredFolders.map(({ folder, files: visibleFiles }) => {
            const isExpanded = expandedFolders.includes(folder.id)
            const showChildren = isExpanded || searchTrim.length > 0
            const folderIdx = folders.findIndex((f) => f.id === folder.id)
            return (
              <div key={folder.id} className="folder-card">
                {/* 文件夹头部 */}
                <div
                  onClick={() => toggleFolder(folder.id)}
                  className="folder-header"
                >
                  <div className="folder-title-area">
                    <span className={`folder-expander ${showChildren ? 'is-expanded' : ''}`} aria-hidden>
                      <CaretDown size={12} />
                    </span>
                    <span className="folder-name">{folder.name}</span>
                  </div>

                  {/* 管理员对文件夹的操作 */}
                  {isAdmin && (
                    <div className="item-actions-group">
                      <button
                        onClick={(e) => { e.stopPropagation(); moveFolder(folder.id, 'up') }}
                        disabled={folderIdx === 0}
                        className="icon-action-btn"
                        title="上移"
                      >
                        <CaretUp size={14} />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); moveFolder(folder.id, 'down') }}
                        disabled={folderIdx === folders.length - 1}
                        className="icon-action-btn"
                        title="下移"
                      >
                        <CaretDown size={14} />
                      </button>
                      <button
                        onClick={(e) => handleRenameFolder(e, folder)}
                        className="icon-action-btn edit"
                        title="重命名"
                      >
                        <PencilSimple size={14} />
                      </button>
                      <button
                        onClick={(e) => handleDeleteFolder(e, folder)}
                        className="icon-action-btn delete"
                        title="删除文件夹"
                      >
                        <Trash size={14} />
                      </button>
                    </div>
                  )}
                </div>

                <div className={`folder-children ${showChildren ? 'is-expanded' : 'is-collapsed'}`}>
                  <div className="folder-children-inner">
                    {visibleFiles.length === 0 ? (
                      <div className="sidebar-empty-hint compact">
                        <span>此文件夹下暂无内容</span>
                      </div>
                    ) : (
                      visibleFiles.map((file) => {
                        const isSelected = activeFileId === file.id
                        const fileIdxFull = folder.files.findIndex((f) => f.id === file.id)
                        return (
                          <div
                            key={file.id}
                            onClick={() => {
                              setActiveFolderId(folder.id)
                              setActiveFileId(file.id)
                              onMobileMenuClose?.()
                            }}
                            className={`file-item ${isSelected ? 'selected' : ''}`}
                          >
                            <div className="file-title-area">
                              <span className="file-name-text">{file.name}</span>
                            </div>

                            {/* 管理员对教程文件的操作 */}
                            {isAdmin && (
                              <div className="item-actions-group">
                                <button
                                  onClick={(e) => { e.stopPropagation(); moveFile(folder.id, file.id, 'up') }}
                                  disabled={fileIdxFull === 0}
                                  className="icon-action-btn"
                                  title="上移"
                                >
                                  <CaretUp size={12} />
                                </button>
                                <button
                                  onClick={(e) => { e.stopPropagation(); moveFile(folder.id, file.id, 'down') }}
                                  disabled={fileIdxFull === folder.files.length - 1}
                                  className="icon-action-btn"
                                  title="下移"
                                >
                                  <CaretDown size={12} />
                                </button>
                                <button
                                  onClick={(e) => handleRenameFile(e, folder.id, file)}
                                  className="icon-action-btn edit"
                                  title="重命名"
                                >
                                  <PencilSimple size={12} />
                                </button>
                                <button
                                  onClick={(e) => handleDeleteFile(e, folder.id, file)}
                                  className="icon-action-btn delete"
                                  title="删除文件"
                                >
                                  <Trash size={12} />
                                </button>
                              </div>
                            )}
                          </div>
                        )
                      })
                    )}

                    {/* 管理员新增教程的快捷按钮 */}
                    {isAdmin && (
                      <div 
                        onClick={(e) => {
                          handleCreateFile(e, folder.id)
                          onMobileMenuClose?.()
                        }}
                        className="sidebar-add-file-btn"
                      >
                        <Plus size={12} />
                        <span>新建教程文件</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* 底部豆包提示：导出 PDF 后自动跳转豆包解读 */}
      <div className="sidebar-doubao-hint">
        <button
          type="button"
          onClick={handleExportToDoubao}
          disabled={isExporting}
          className="sidebar-doubao-btn"
        >
          <Sparkle size={18} weight="fill" />
          <span className="sidebar-doubao-text">
            {isExporting && exportProgress
              ? `导出中 ${exportProgress.done}/${exportProgress.total}...`
              : '不想看教程？发给豆包解读'}
          </span>
        </button>
      </div>

      {/* 防误删二次确认弹窗 */}
      <SafeDeleteModal 
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal(prev => ({ ...prev, isOpen: false }))}
        onConfirm={deleteModal.onConfirm}
        itemName={deleteModal.itemName}
        itemType={deleteModal.itemType}
      />

      {/* Toast 弹出提示 */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </aside>
  )
}
