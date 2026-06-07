import React, { useMemo, useState } from 'react'
import { useTour, type Folder, type FileItem } from '../../context/TourContext'
import { SafeDeleteModal } from '../Admin/SafeDeleteModal'
import { Button } from '../UI/Button'
import { Toast } from '../UI/Toast'
import { Plus, Edit3, Trash2, ChevronUp, ChevronDown, X } from 'lucide-react'

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

  const searchTrim = searchQuery.trim()
  const filteredFolders = useMemo(
    () => filterFoldersByQuery(folders, searchQuery),
    [folders, searchQuery]
  )

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
            <Plus className="w-4 h-4" />
          </Button>
        )}
        <button className="sidebar-close-btn-mobile" onClick={onMobileMenuClose} aria-label="关闭菜单">
          <X className="w-4 h-4" />
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
                    <span className="folder-expander" aria-hidden>
                      {showChildren ? '▼' : '▶'}
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
                        <ChevronUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); moveFolder(folder.id, 'down') }}
                        disabled={folderIdx === folders.length - 1}
                        className="icon-action-btn"
                        title="下移"
                      >
                        <ChevronDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => handleRenameFolder(e, folder)}
                        className="icon-action-btn edit"
                        title="重命名"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => handleDeleteFolder(e, folder)}
                        className="icon-action-btn delete"
                        title="删除文件夹"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                {showChildren && (
                  <div className="folder-children-list">
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
                                  <ChevronUp className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={(e) => { e.stopPropagation(); moveFile(folder.id, file.id, 'down') }}
                                  disabled={fileIdxFull === folder.files.length - 1}
                                  className="icon-action-btn"
                                  title="下移"
                                >
                                  <ChevronDown className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={(e) => handleRenameFile(e, folder.id, file)}
                                  className="icon-action-btn edit"
                                  title="重命名"
                                >
                                  <Edit3 className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={(e) => handleDeleteFile(e, folder.id, file)}
                                  className="icon-action-btn delete"
                                  title="删除文件"
                                >
                                  <Trash2 className="w-3 h-3" />
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
                        <Plus className="w-3 h-3" />
                        <span>新建教程文件</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })
        )}
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
