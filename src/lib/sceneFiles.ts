import { isSceneFileAssetRef } from './sceneFilePaths'
export type { SceneFileAssetRef } from './sceneFilePaths'

const toDataUrl = (blob: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(blob)
  })

export const hydrateSceneFiles = async (
  files: Record<string, any> | undefined,
  baseUrl: string
): Promise<Record<string, any>> => {
  if (!files) return {}

  const entries = await Promise.all(
    Object.entries(files).map(async ([fileId, fileData]) => {
      if (!isSceneFileAssetRef(fileData)) {
        return [fileId, fileData] as const
      }

      try {
        const assetUrl = `${baseUrl}${fileData.assetPath}`
        const response = await fetch(assetUrl)
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`)
        }
        const blob = await response.blob()
        const dataURL = await toDataUrl(blob)
        return [fileId, { ...fileData, dataURL }] as const
      } catch (error) {
        console.error(`无法加载图片资源 ${fileData.assetPath}:`, error)
        return [fileId, fileData] as const
      }
    })
  )

  return Object.fromEntries(entries)
}
