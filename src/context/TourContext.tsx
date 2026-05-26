import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'

export interface Slide {
  id: string
  elements: any[]
  appState?: any
}

export interface FileItem {
  id: string
  name: string
  slides: Slide[]
}

export interface Folder {
  id: string
  name: string
  files: FileItem[]
}

interface TourContextType {
  folders: Folder[]
  activeFolderId: string | null
  activeFileId: string | null
  currentSlideIndex: number
  isAdmin: boolean
  expandedFolders: string[]
  isLoading: boolean
  
  // 核心操作
  setActiveFolderId: (id: string | null) => void
  setActiveFileId: (id: string | null) => void
  setCurrentSlideIndex: (index: number) => void
  toggleFolder: (folderId: string) => void
  
  // 管理员动作
  loginAdmin: (password: string) => boolean
  logoutAdmin: () => void
  
  // 目录与文件管理
  addFolder: (name: string) => void
  renameFolder: (folderId: string, name: string) => void
  deleteFolder: (folderId: string) => void
  moveFolder: (folderId: string, direction: 'up' | 'down') => void
  
  addFile: (folderId: string, name: string) => void
  renameFile: (folderId: string, fileId: string, name: string) => void
  deleteFile: (folderId: string, fileId: string) => void
  moveFile: (folderId: string, fileId: string, direction: 'up' | 'down') => void
  
  // 幻灯片管理
  addSlide: () => void
  deleteSlide: (index: number) => void
  duplicateSlide: (index: number) => void
  moveSlide: (index: number, direction: 'left' | 'right') => void
  updateSlideCanvas: (slideId: string, elements: any[], appState: any) => void
  
  // 备份
  exportBackup: () => void
  importBackup: (data: Folder[]) => boolean
}

const TourContext = createContext<TourContextType | undefined>(undefined)

const ADMIN_PASSWORD = 'kity' // 默认管理员密码

const EMOJI_REGEX = /[\p{Extended_Pictographic}\p{Emoji_Presentation}]/gu

const stripEmojis = (text: string): string =>
  text.replace(EMOJI_REGEX, '').replace(/\s{2,}/g, ' ').trim()

const sanitizeFolders = (folders: Folder[]): Folder[] =>
  folders.map(folder => ({
    ...folder,
    name: stripEmojis(folder.name) || folder.name,
    files: folder.files.map(file => ({
      ...file,
      name: stripEmojis(file.name) || file.name
    }))
  }))

export const TourProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [folders, setFolders] = useState<Folder[]>([])
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null)
  const [activeFileId, setActiveFileId] = useState<string | null>(null)
  const [currentSlideIndex, setCurrentSlideIndex] = useState<number>(0)
  const [isAdmin, setIsAdmin] = useState<boolean>(false)
  const [expandedFolders, setExpandedFolders] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)

  // 1. 初始化时从 /data/tour-data.json 获取数据
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setIsLoading(true)
        const response = await fetch('/data/tour-data.json')
        if (response.ok) {
          const data = await response.json()
          if (data && data.folders) {
            const loadedFolders = sanitizeFolders(data.folders)
            setFolders(loadedFolders)
            
            // 默认选中第一个文件夹的第一个文件
            if (loadedFolders.length > 0) {
              const firstFolder = loadedFolders[0]
              setActiveFolderId(firstFolder.id)
              setExpandedFolders([firstFolder.id])
              if (firstFolder.files.length > 0) {
                setActiveFileId(firstFolder.files[0].id)
                setCurrentSlideIndex(0)
              }
            }
          }
        }
      } catch (error) {
        console.error('无法加载默认教程数据:', error)
      } finally {
        setIsLoading(false)
      }
    }
    loadInitialData()
  }, [])

  // 2. 状态记忆：当选中文件切换时，重置页码为 0
  useEffect(() => {
    setCurrentSlideIndex(0)
  }, [activeFileId])

  // 3. 通用保存函数：更新状态并在开发环境下写入本地硬盘
  const saveState = async (updatedFolders: Folder[]) => {
    const sanitized = sanitizeFolders(updatedFolders)
    setFolders(sanitized)
    
    // 如果是开发环境，POST 到 Vite 中间件，自动保存到本地硬盘的 tour-data.json
    if (import.meta.env.DEV) {
      try {
        const res = await fetch('/api/save', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ folders: sanitized })
        })
        if (!res.ok) {
          console.error('本地开发写入硬盘失败')
        }
      } catch (err) {
        console.error('本地开发自动保存网络错误:', err)
      }
    }
  }

  // 辅助查找当前文件对象
  const getActiveFile = (currentFolders = folders): FileItem | null => {
    if (!activeFolderId || !activeFileId) return null
    const folder = currentFolders.find(f => f.id === activeFolderId)
    if (!folder) return null
    return folder.files.find(f => f.id === activeFileId) || null
  }

  // 管理员验证
  const loginAdmin = (password: string): boolean => {
    if (password === ADMIN_PASSWORD) {
      setIsAdmin(true)
      return true
    }
    return false
  }

  const logoutAdmin = () => {
    setIsAdmin(false)
  }

  // 展开/折叠目录树（单级展开逻辑）
  const toggleFolder = (folderId: string) => {
    setExpandedFolders(prev => 
      prev.includes(folderId) ? [] : [folderId]
    )
    setActiveFolderId(folderId)
  }

  // === 目录管理（增删改排序） ===
  
  const addFolder = (name: string) => {
    const newFolder: Folder = {
      id: `f-${Date.now()}`,
      name,
      files: []
    }
    const updated = [...folders, newFolder]
    saveState(updated)
    setExpandedFolders([newFolder.id])
    setActiveFolderId(newFolder.id)
  }

  const renameFolder = (folderId: string, name: string) => {
    const updated = folders.map(f => f.id === folderId ? { ...f, name } : f)
    saveState(updated)
  }

  const deleteFolder = (folderId: string) => {
    const updated = folders.filter(f => f.id !== folderId)
    saveState(updated)
    if (activeFolderId === folderId) {
      setActiveFolderId(null)
      setActiveFileId(null)
    }
  }

  const moveFolder = (folderId: string, direction: 'up' | 'down') => {
    const index = folders.findIndex(f => f.id === folderId)
    if (index === -1) return
    const newIndex = direction === 'up' ? index - 1 : index + 1
    if (newIndex < 0 || newIndex >= folders.length) return
    
    const updated = [...folders]
    const [moved] = updated.splice(index, 1)
    updated.splice(newIndex, 0, moved)
    saveState(updated)
  }

  // === 文件管理（增删改排序） ===

  const addFile = (folderId: string, name: string) => {
    const newFile: FileItem = {
      id: `l-${Date.now()}`,
      name,
      slides: [
        {
          id: `s-${Date.now()}`,
          elements: [],
          appState: { viewBackgroundColor: '#fef8ec' }
        }
      ]
    }
    const updated = folders.map(f => {
      if (f.id === folderId) {
        return { ...f, files: [...f.files, newFile] }
      }
      return f
    })
    saveState(updated)
    setActiveFileId(newFile.id)
    setCurrentSlideIndex(0)
  }

  const renameFile = (folderId: string, fileId: string, name: string) => {
    const updated = folders.map(f => {
      if (f.id === folderId) {
        return {
          ...f,
          files: f.files.map(file => file.id === fileId ? { ...file, name } : file)
        }
      }
      return f
    })
    saveState(updated)
  }

  const deleteFile = (folderId: string, fileId: string) => {
    const updated = folders.map(f => {
      if (f.id === folderId) {
        return {
          ...f,
          files: f.files.filter(file => file.id !== fileId)
        }
      }
      return f
    })
    saveState(updated)
    if (activeFileId === fileId) {
      setActiveFileId(null)
      setCurrentSlideIndex(0)
    }
  }

  const moveFile = (folderId: string, fileId: string, direction: 'up' | 'down') => {
    const folder = folders.find(f => f.id === folderId)
    if (!folder) return
    const index = folder.files.findIndex(f => f.id === fileId)
    if (index === -1) return
    const newIndex = direction === 'up' ? index - 1 : index + 1
    if (newIndex < 0 || newIndex >= folder.files.length) return

    const updated = folders.map(f => {
      if (f.id === folderId) {
        const filesCopy = [...f.files]
        const [moved] = filesCopy.splice(index, 1)
        filesCopy.splice(newIndex, 0, moved)
        return { ...f, files: filesCopy }
      }
      return f
    })
    saveState(updated)
  }

  // === 幻灯片管理 ===

  const addSlide = () => {
    if (!activeFolderId || !activeFileId) return
    const newSlide: Slide = {
      id: `s-${Date.now()}`,
      elements: [],
      appState: { viewBackgroundColor: '#fef8ec' }
    }
    const updated = folders.map(f => {
      if (f.id === activeFolderId) {
        return {
          ...f,
          files: f.files.map(file => {
            if (file.id === activeFileId) {
              return { ...file, slides: [...file.slides, newSlide] }
            }
            return file
          })
        }
      }
      return f
    })
    
    const activeFile = getActiveFile()
    const currentLength = activeFile ? activeFile.slides.length : 0
    saveState(updated)
    setCurrentSlideIndex(currentLength) // 跳转到新页面
  }

  const deleteSlide = (index: number) => {
    if (!activeFolderId || !activeFileId) return
    const activeFile = getActiveFile()
    if (!activeFile || activeFile.slides.length <= 1) return // 必须保留一页
    
    const updated = folders.map(f => {
      if (f.id === activeFolderId) {
        return {
          ...f,
          files: f.files.map(file => {
            if (file.id === activeFileId) {
              return {
                ...file,
                slides: file.slides.filter((_, i) => i !== index)
              }
            }
            return file
          })
        }
      }
      return f
    })

    saveState(updated)
    // 调整当前页码以防越界
    setCurrentSlideIndex(prev => Math.max(0, Math.min(prev, activeFile.slides.length - 2)))
  }

  const duplicateSlide = (index: number) => {
    if (!activeFolderId || !activeFileId) return
    const activeFile = getActiveFile()
    if (!activeFile) return
    const slideToCopy = activeFile.slides[index]
    
    const duplicated: Slide = {
      id: `s-${Date.now()}`,
      // 深拷贝 elements 以防引用冲突
      elements: JSON.parse(JSON.stringify(slideToCopy.elements)),
      appState: { ...slideToCopy.appState, viewBackgroundColor: '#fef8ec' }
    }

    const updated = folders.map(f => {
      if (f.id === activeFolderId) {
        return {
          ...f,
          files: f.files.map(file => {
            if (file.id === activeFileId) {
              const slidesCopy = [...file.slides]
              slidesCopy.splice(index + 1, 0, duplicated)
              return { ...file, slides: slidesCopy }
            }
            return file
          })
        }
      }
      return f
    })

    saveState(updated)
    setCurrentSlideIndex(index + 1) // 跳转到复制页
  }

  const moveSlide = (index: number, direction: 'left' | 'right') => {
    if (!activeFolderId || !activeFileId) return
    const activeFile = getActiveFile()
    if (!activeFile) return
    const newIndex = direction === 'left' ? index - 1 : index + 1
    if (newIndex < 0 || newIndex >= activeFile.slides.length) return

    const updated = folders.map(f => {
      if (f.id === activeFolderId) {
        return {
          ...f,
          files: f.files.map(file => {
            if (file.id === activeFileId) {
              const slidesCopy = [...file.slides]
              const [moved] = slidesCopy.splice(index, 1)
              slidesCopy.splice(newIndex, 0, moved)
              return { ...file, slides: slidesCopy }
            }
            return file
          })
        }
      }
      return f
    })

    saveState(updated)
    setCurrentSlideIndex(newIndex)
  }

  const updateSlideCanvas = useCallback((slideId: string, elements: any[], appState: any) => {
    if (!activeFolderId || !activeFileId || !slideId) return

    const folder = folders.find(f => f.id === activeFolderId)
    const file = folder?.files.find(f => f.id === activeFileId)
    const slide = file?.slides.find(s => s.id === slideId)
    if (!slide) return

    const nextAppState = {
      ...slide.appState,
      viewBackgroundColor: appState.viewBackgroundColor || '#fef8ec',
      zoom: appState.zoom,
      scrollX: appState.scrollX,
      scrollY: appState.scrollY
    }

    const elementsUnchanged =
      JSON.stringify(slide.elements) === JSON.stringify(elements)
    const appStateUnchanged =
      JSON.stringify(slide.appState) === JSON.stringify(nextAppState)
    if (elementsUnchanged && appStateUnchanged) return

    const updated = folders.map(f => {
      if (f.id === activeFolderId) {
        return {
          ...f,
          files: f.files.map(fileItem => {
            if (fileItem.id !== activeFileId) return fileItem
            return {
              ...fileItem,
              slides: fileItem.slides.map(s =>
                s.id === slideId
                  ? { ...s, elements, appState: nextAppState }
                  : s
              )
            }
          })
        }
      }
      return f
    })
    saveState(updated)
  }, [folders, activeFolderId, activeFileId])

  // === 备份与恢复 ===

  const exportBackup = () => {
    const dataStr = JSON.stringify({ folders }, null, 2)
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr)
    
    const exportFileDefaultName = 'tour-data.json'
    
    const linkElement = document.createElement('a')
    linkElement.setAttribute('href', dataUri)
    linkElement.setAttribute('download', exportFileDefaultName)
    linkElement.click()
  }

  const importBackup = (importedData: Folder[]): boolean => {
    try {
      if (Array.isArray(importedData)) {
        saveState(importedData)
        if (importedData.length > 0) {
          const firstFolder = importedData[0]
          setActiveFolderId(firstFolder.id)
          setExpandedFolders([firstFolder.id])
          if (firstFolder.files.length > 0) {
            setActiveFileId(firstFolder.files[0].id)
            setCurrentSlideIndex(0)
          }
        }
        return true
      }
      return false
    } catch (e) {
      console.error('备份解析错误:', e)
      return false
    }
  }

  return (
    <TourContext.Provider value={{
      folders,
      activeFolderId,
      activeFileId,
      currentSlideIndex,
      isAdmin,
      expandedFolders,
      isLoading,
      setActiveFolderId,
      setActiveFileId,
      setCurrentSlideIndex,
      toggleFolder,
      loginAdmin,
      logoutAdmin,
      addFolder,
      renameFolder,
      deleteFolder,
      moveFolder,
      addFile,
      renameFile,
      deleteFile,
      moveFile,
      addSlide,
      deleteSlide,
      duplicateSlide,
      moveSlide,
      updateSlideCanvas,
      exportBackup,
      importBackup
    }}>
      {children}
    </TourContext.Provider>
  )
}

export const useTour = () => {
  const context = useContext(TourContext)
  if (context === undefined) {
    throw new Error('useTour must be used within a TourProvider')
  }
  return context
}
