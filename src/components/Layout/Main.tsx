import React, { useEffect, useState, useRef } from 'react'
import { useTour } from '../../context/TourContext'
import { SlideCanvas } from '../Canvas/SlideCanvas'
import { Button } from '../UI/Button'
import { Toast } from '../UI/Toast'
import { SafeDeleteModal } from '../Admin/SafeDeleteModal'
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Trash2, 
  Copy, 
  ArrowLeft, 
  ArrowRight,
  Link2
} from 'lucide-react'

export const Main: React.FC = () => {
  const {
    folders,
    activeFolderId,
    activeFileId,
    currentSlideIndex,
    isAdmin,
    setCurrentSlideIndex,
    addSlide,
    deleteSlide,
    duplicateSlide,
    moveSlide
  } = useTour()

  const [toastMessage, setToastMessage] = useState<string | null>(null)
  
  // 删除页面确认弹窗状态
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)

  const canvasStageRef = useRef<HTMLDivElement>(null)
  const skipCanvasFadeIn = useRef(true)

  // 移动端滑动翻页
  const touchStartX = useRef<number | null>(null)
  const SWIPE_THRESHOLD = 50

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return
    const diff = e.changedTouches[0].clientX - touchStartX.current
    touchStartX.current = null
    if (Math.abs(diff) > SWIPE_THRESHOLD) {
      if (diff > 0) {
        handlePrev()
      } else {
        handleNext()
      }
    }
  }

  useEffect(() => {
    if (skipCanvasFadeIn.current) {
      skipCanvasFadeIn.current = false
      return
    }
    const el = canvasStageRef.current
    if (!el) return
    el.classList.remove('canvas-stage--fade-in')
    void el.offsetWidth
    el.classList.add('canvas-stage--fade-in')
    const onEnd = () => el.classList.remove('canvas-stage--fade-in')
    el.addEventListener('animationend', onEnd, { once: true })
    return () => {
      el.removeEventListener('animationend', onEnd)
    }
  }, [activeFileId, currentSlideIndex])

  // 获取当前文件信息及幻灯片总数
  const activeFolder = folders.find(f => f.id === activeFolderId)
  const activeFile = activeFolder?.files.find(f => f.id === activeFileId)
  const totalSlides = activeFile?.slides.length || 0

  const goToSlide = (index: number) => {
    if (index >= 0 && index < totalSlides) {
      setCurrentSlideIndex(index)
    }
  }

  const handlePrev = () => {
    goToSlide(currentSlideIndex - 1)
  }

  const handleNext = () => {
    goToSlide(currentSlideIndex + 1)
  }

  // 全局键盘监听（← / → / 空格翻页）
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 如果焦点在输入框中，忽略快捷键
      const activeEl = document.activeElement
      if (activeEl && (
        activeEl.tagName === 'INPUT' || 
        activeEl.tagName === 'TEXTAREA' || 
        activeEl.getAttribute('contenteditable') === 'true'
      )) {
        return
      }

      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        handlePrev()
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        handleNext()
      } else if (!isAdmin && (e.key === ' ' || e.key === 'Enter')) {
        e.preventDefault()
        handleNext()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [currentSlideIndex, totalSlides, isAdmin])

  // 删除本页
  const handleDeletePage = () => {
    if (totalSlides <= 1) {
      setToastMessage('这是最后一页，无法删除。')
      return
    }
    setIsDeleteModalOpen(true)
  }

  const confirmDeletePage = () => {
    deleteSlide(currentSlideIndex)
    setToastMessage('幻灯片页面已删除！')
  }

  // 复制本页
  const handleDuplicatePage = () => {
    duplicateSlide(currentSlideIndex)
    setToastMessage('页面已成功复制，已跳转至新页！')
  }

  // 新建页
  const handleAddPage = () => {
    addSlide()
    setToastMessage('已成功新建一页空白画布！')
  }

  return (
    <main
      className="main-panel"
      onTouchStart={!isAdmin ? handleTouchStart : undefined}
      onTouchEnd={!isAdmin ? handleTouchEnd : undefined}
    >
      <div className="canvas-wrapper">
        <div ref={canvasStageRef} className="canvas-stage">
          <SlideCanvas />
        </div>

        {activeFile && totalSlides > 0 && (
          <div className="canvas-pager">
            <div className="pager-controls">
              <Button
                variant="secondary"
                size="sm"
                onClick={handlePrev}
                disabled={currentSlideIndex === 0}
                title="上一页 (←)"
                className="pager-btn"
              >
                <ChevronLeft className="w-5 h-5" strokeWidth={1.5} />
              </Button>

              {isAdmin && totalSlides > 1 ? (
                <div className="slide-tabs" role="tablist" aria-label="幻灯片页面">
                  {activeFile.slides.map((slide, index) => (
                    <button
                      key={slide.id}
                      type="button"
                      role="tab"
                      aria-selected={index === currentSlideIndex}
                      className={`slide-tab${index === currentSlideIndex ? ' active' : ''}`}
                      onClick={() => goToSlide(index)}
                      title={`第 ${index + 1} 页`}
                    >
                      {index + 1}
                    </button>
                  ))}
                </div>
              ) : (
                <span className="page-indicator">
                  第 {currentSlideIndex + 1} / {totalSlides} 页
                </span>
              )}

              <Button
                variant="secondary"
                size="sm"
                onClick={handleNext}
                disabled={currentSlideIndex === totalSlides - 1}
                title={isAdmin ? '下一页 (→)' : '下一页 (→ / 空格)'}
                className="pager-btn"
              >
                <ChevronRight className="w-5 h-5" strokeWidth={1.5} />
              </Button>
            </div>
          </div>
        )}
      </div>

      {isAdmin && activeFile && totalSlides > 0 && (
        <div className="admin-footer">
            <div className="admin-toolbar-wrap">
            <p className="canvas-link-hint">
              <Link2 className="canvas-link-hint-icon" strokeWidth={1.5} aria-hidden />
              添加可点击链接：选中图形或文字后按 <kbd>Ctrl</kbd>+<kbd>K</kbd>（Mac：<kbd>⌘</kbd>+<kbd>K</kbd>）填写网址；读者点击图形上的链接角标即可打开
            </p>
            <div className="admin-toolbar">
              <Button 
                variant="primary" 
                size="sm" 
                onClick={handleAddPage}
                className="flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>新建一页</span>
              </Button>

              <Button 
                variant="secondary" 
                size="sm" 
                onClick={handleDuplicatePage}
                className="flex items-center gap-1.5"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>复制本页</span>
              </Button>

              <Button 
                variant="secondary" 
                size="sm" 
                onClick={() => moveSlide(currentSlideIndex, 'left')}
                disabled={currentSlideIndex === 0}
                className="flex items-center gap-1.5"
                title="将本页向左移动"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>向左移</span>
              </Button>

              <Button 
                variant="secondary" 
                size="sm" 
                onClick={() => moveSlide(currentSlideIndex, 'right')}
                disabled={currentSlideIndex === totalSlides - 1}
                className="flex items-center gap-1.5"
                title="将本页向右移动"
              >
                <ArrowRight className="w-3.5 h-3.5" />
                <span>向右移</span>
              </Button>

              <Button 
                variant="danger" 
                size="sm" 
                onClick={handleDeletePage}
                disabled={totalSlides <= 1}
                className="admin-toolbar-right flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>删除本页</span>
              </Button>
            </div>
            </div>
        </div>
      )}

      {/* 删除页面二次确认弹窗 */}
      <SafeDeleteModal 
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDeletePage}
        itemName={`第 ${currentSlideIndex + 1} 页幻灯片`}
        itemType="页面"
      />

      {/* Toast 消息提示 */}
      {toastMessage && (
        <Toast 
          message={toastMessage} 
          type="success" 
          onClose={() => setToastMessage(null)} 
        />
      )}
    </main>
  )
}
