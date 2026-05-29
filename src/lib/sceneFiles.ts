import { isSceneFileAssetRef } from './sceneFilePaths'
export type { SceneFileAssetRef } from './sceneFilePaths'

const sceneFileCache = new Map<string, Promise<string>>()

const toDataUrl = (blob: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(blob)
  })

const fetchSceneFileDataUrl = (assetUrl: string): Promise<string> => {
  const cached = sceneFileCache.get(assetUrl)
  if (cached) return cached

  const request = fetch(assetUrl)
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
      return response.blob()
    })
    .then(toDataUrl)

  sceneFileCache.set(assetUrl, request)
  return request
}

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
        const dataURL = await fetchSceneFileDataUrl(assetUrl)
        return [fileId, { ...fileData, dataURL }] as const
      } catch (error) {
        console.error(`无法加载图片资源 ${fileData.assetPath}:`, error)
        return [fileId, fileData] as const
      }
    })
  )

  return Object.fromEntries(entries)
}
