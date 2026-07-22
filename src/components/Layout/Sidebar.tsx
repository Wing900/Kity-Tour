import React, { useMemo, useState } from 'react'
import { useTour, type Folder, type FileItem } from '../../context/TourContext'
import { SafeDeleteModal } from '../Admin/SafeDeleteModal'
import { Button } from '../UI/Button'
import { Toast } from '../UI/Toast'
import { PdfBuilder, canvasToJpeg, collectLinks, drawLinksCanvas, waitForNewCanvas } from '../../lib/exportPdf'
import { Plus, PencilSimple, Trash, CaretUp, CaretDown, X, Sparkle, Lock, LockOpen } from '@phosphor-icons/react'

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
    activeFolderId,
    activeFileId,
    currentSlideIndex,
    expandedFolders,
    isAdmin,
    setActiveFolderId,
    setActiveFileId,
    setCurrentSlideIndex,
    toggleFolder,
    addFolder,
    renameFolder,
    deleteFolder,
    moveFolder,
    addFile,
    renameFile,
    deleteFile,
    moveFile,
    toggleFileLock,
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
  const [pdfHintOpen, setPdfHintOpen] = useState(false)

  const searchTrim = searchQuery.trim()
  const filteredFolders = useMemo(
    () => filterFoldersByQuery(folders, searchQuery),
    [folders, searchQuery]
  )

  // 导出 PDF：逐张切页 + 截 Excalidraw DOM canvas，保证不空白
  const handleExportToDoubao = async () => {
    if (isExporting) return
    setIsExporting(true)
    setExportProgress({ done: 0, total: 0 })
    setToast({ message: '正在导出 PDF，请勿切换页面...', type: 'success' })
    
    // 暂存当前状态，导出后恢复
    const origFolder = activeFolderId
    const origFile = activeFileId
    const origSlide = currentSlideIndex
    
    const total = folders.reduce(
      (n, f) => n + f.files.reduce((m, file) => m + file.slides.length, 0),
      0
    )
    let done = 0
    const builder = new PdfBuilder()
    let prevCanvas: HTMLCanvasElement | null = null
    
    try {
      for (const folder of folders) {
        for (const file of folder.files) {
          for (let slideIdx = 0; slideIdx < file.slides.length; slideIdx++) {
            setActiveFolderId(folder.id)
            setActiveFileId(file.id)
            setCurrentSlideIndex(slideIdx)
            // 事件驱动：等新 canvas 渲染完成，不是固定时间
            const canvas = await waitForNewCanvas(prevCanvas, 5000)
            prevCanvas = canvas
            if (!canvas) {
              done++
              setExportProgress({ done, total })
              continue
            }
            const { imgData, w, h } = canvasToJpeg(canvas)
            builder.addPage(
              imgData,
              w,
              h,
              folder.id,
              folder.name,
              file.id,
              file.name,
              slideIdx + 1
            )
            done++
            setExportProgress({ done, total })
          }
        }
      }
      setToast(null)
      if (builder.pageCount === 0) {
        setToast({ message: '没有可导出的幻灯片', type: 'error' })
      } else {
        // 末尾附链接汇总页，让豆包能读到所有链接
        const links = collectLinks(folders)
        if (links.length > 0) {
          const linksCanvas = drawLinksCanvas(links)
          const { imgData: lImg, w: lW, h: lH } = canvasToJpeg(linksCanvas)
          builder.addPage(lImg, lW, lH, 'links', '链接汇总', 'links', '链接汇总', 1)
        }
        builder.save(`kity-tour-tutorial-${Date.now()}.pdf`)
        setPdfHintOpen(true)
      }
    } catch (err: unknown) {
      setToast({
        message: `导出失败：${err instanceof Error ? err.message : String(err)}`,
        type: 'error'
      })
    } finally {
      // 恢复原状态
      setActiveFolderId(origFolder)
      setActiveFileId(origFile)
      setCurrentSlideIndex(origSlide)
      setIsExporting(false)
      setExportProgress(null)
    }
  }

  const openDoubao = () => {
    window.open('https://www.doubao.com/chat/', '_blank', 'noopener,noreferrer')
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
    if (folder.files.some(f => f.locked)) {
      setToast({ message: '该文件夹含永久锁定文件，无法删除。请先解锁。', type: 'error' })
      return
    }
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
    if (file.locked) {
      setToast({ message: '此文件已锁定为永久页，不可删除。请先解锁。', type: 'error' })
      return
    }
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

  // 切换文件锁定
  const handleToggleFileLock = (e: React.MouseEvent, folderId: string, file: FileItem) => {
    e.stopPropagation()
    toggleFileLock(folderId, file.id)
    setToast({
      message: file.locked ? '已解锁，该文件可被删除。' : '已锁定为永久页，不可删除，深链永久有效。',
      type: 'success'
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

      {/* 豆包解读入口：品牌下方最显眼位置 */}
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
                              {file.locked && (
                                <Lock size={12} weight="fill" className="file-lock-badge" aria-label="永久锁定" />
                              )}
                            </div>

                            {/* 管理员对教程文件的操作 */}
                            {isAdmin && (
                              <div className="item-actions-group">
                                <button
                                  onClick={(e) => handleToggleFileLock(e, folder.id, file)}
                                  className={`icon-action-btn lock${file.locked ? ' locked' : ''}`}
                                  title={file.locked ? '解锁（允许删除）' : '锁定为永久页（禁止删除）'}
                                >
                                  {file.locked ? <Lock size={12} weight="fill" /> : <LockOpen size={12} />}
                                </button>
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

      {/* PDF 导出后提示用户手动发给豆包的模态弹窗 */}
      {pdfHintOpen && (
        <div className="pdf-hint-modal-overlay" onClick={() => setPdfHintOpen(false)}>
          <div className="pdf-hint-modal" onClick={e => e.stopPropagation()}>
            <div className="pdf-hint-icon">
              <Sparkle size={36} weight="fill" />
            </div>
            <h3 className="pdf-hint-title">PDF 已下载完成</h3>
            <p className="pdf-hint-desc">
              请把下载的 PDF 发给豆包，让 AI 帮你解读教程内容。
            </p>
            <div className="pdf-hint-steps">
              <div className="pdf-hint-step"><span className="pdf-hint-step-num">1</span>点击下方「打开豆包」按钮</div>
              <div className="pdf-hint-step"><span className="pdf-hint-step-num">2</span>在豆包对话框里拖入刚下载的 PDF</div>
              <div className="pdf-hint-step"><span className="pdf-hint-step-num">3</span>问 AI “这个教程的操作流程是什么”</div>
            </div>
            <div className="pdf-hint-actions">
              <button className="pdf-hint-btn-secondary" onClick={() => setPdfHintOpen(false)}>
                关闭
              </button>
              <button className="pdf-hint-btn-primary" onClick={openDoubao}>
                打开豆包
              </button>
            </div>
          </div>
        </div>
      )}

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
