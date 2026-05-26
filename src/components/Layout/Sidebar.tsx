import React, { useState } from 'react'
import { useTour, type Folder, type FileItem } from '../../context/TourContext'
import { SafeDeleteModal } from '../Admin/SafeDeleteModal'
import { Button } from '../UI/Button'
import { Toast } from '../UI/Toast'
import { 
  Folder as FolderIcon, 
  FolderOpen, 
  FileText, 
  Plus, 
  Edit3, 
  Trash2, 
  ChevronUp, 
  ChevronDown,
  BookOpen,
  Inbox
} from 'lucide-react'

export const Sidebar: React.FC = () => {
  const {
    folders,
    activeFolderId,
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
    moveFile
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

  const [toastMessage, setToastMessage] = useState<string | null>(null)

  // 新建文件夹
  const handleCreateFolder = () => {
    const name = prompt('请输入新文件夹名称:', '新建文件夹')
    if (name && name.trim()) {
      addFolder(name.trim())
      setToastMessage('文件夹创建成功！')
    }
  }

  // 重命名文件夹
  const handleRenameFolder = (e: React.MouseEvent, folder: Folder) => {
    e.stopPropagation()
    const name = prompt(`请输入文件夹新的名称 [${folder.name}]:`, folder.name)
    if (name && name.trim() && name.trim() !== folder.name) {
      renameFolder(folder.id, name.trim())
      setToastMessage('文件夹重命名成功！')
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
        setToastMessage('文件夹已成功删除！')
      }
    })
  }

  // 新建教程文件
  const handleCreateFile = (e: React.MouseEvent, folderId: string) => {
    e.stopPropagation()
    const name = prompt('请输入新教程文件名称:', '新建教程文件')
    if (name && name.trim()) {
      addFile(folderId, name.trim())
      setToastMessage('教程文件创建成功！')
    }
  }

  // 重命名文件
  const handleRenameFile = (e: React.MouseEvent, folderId: string, file: FileItem) => {
    e.stopPropagation()
    const name = prompt(`请输入文件新的名称 [${file.name}]:`, file.name)
    if (name && name.trim() && name.trim() !== file.name) {
      renameFile(folderId, file.id, name.trim())
      setToastMessage('文件重命名成功！')
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
        setToastMessage('文件已成功删除！')
      }
    })
  }

  return (
    <aside className="sidebar">
      {/* 侧边栏页眉 */}
      <div className="sidebar-header">
        <span className="sidebar-header-title">
          <BookOpen className="sidebar-header-icon" aria-hidden />
          教程目录
        </span>
        {isAdmin && (
          <Button 
            variant="primary" 
            size="sm" 
            onClick={handleCreateFolder}
            title="新增文件夹"
            className="p-1"
          >
            <Plus className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* 目录列表 */}
      <div className="sidebar-content">
        {folders.length === 0 ? (
          <div className="sidebar-empty-hint">
            <Inbox className="sidebar-empty-icon" aria-hidden />
            <span>目录空空如也</span>
          </div>
        ) : (
          folders.map((folder, folderIdx) => {
            const isExpanded = expandedFolders.includes(folder.id)
            return (
              <div key={folder.id} className="folder-card">
                {/* 文件夹头部 */}
                <div
                  onClick={() => toggleFolder(folder.id)}
                  className={`folder-header ${activeFolderId === folder.id ? 'active' : ''}`}
                >
                  <div className="folder-title-area">
                    {isExpanded ? (
                      <FolderOpen className="folder-icon" />
                    ) : (
                      <FolderIcon className="folder-icon" />
                    )}
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

                {/* 展开的文件子列表 */}
                {isExpanded && (
                  <div className="folder-children-list">
                    {folder.files.length === 0 ? (
                      <div className="sidebar-empty-hint compact">
                        <FileText className="sidebar-empty-icon" aria-hidden />
                        <span>此文件夹下没有教程</span>
                      </div>
                    ) : (
                      folder.files.map((file, fileIdx) => {
                        const isSelected = activeFileId === file.id
                        return (
                          <div
                            key={file.id}
                            onClick={() => {
                              setActiveFolderId(folder.id)
                              setActiveFileId(file.id)
                            }}
                            className={`file-item ${isSelected ? 'selected' : ''}`}
                          >
                            <div className="file-title-area">
                              <FileText className="file-icon" />
                              <span>{file.name}</span>
                            </div>

                            {/* 管理员对教程文件的操作 */}
                            {isAdmin && (
                              <div className="item-actions-group">
                                <button
                                  onClick={(e) => { e.stopPropagation(); moveFile(folder.id, file.id, 'up') }}
                                  disabled={fileIdx === 0}
                                  className="icon-action-btn"
                                  title="上移"
                                >
                                  <ChevronUp className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={(e) => { e.stopPropagation(); moveFile(folder.id, file.id, 'down') }}
                                  disabled={fileIdx === folder.files.length - 1}
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
                        onClick={(e) => handleCreateFile(e, folder.id)}
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
      {toastMessage && (
        <Toast 
          message={toastMessage} 
          type="success" 
          onClose={() => setToastMessage(null)} 
        />
      )}
    </aside>
  )
}
