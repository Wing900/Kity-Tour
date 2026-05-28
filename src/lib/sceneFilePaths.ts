export interface SceneFileAssetRef {
  id: string
  mimeType?: string
  created?: number
  lastRetrieved?: number
  assetPath: string
}

const MIME_EXTENSION_MAP: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/svg+xml': 'svg'
}

export const getSceneFileExtension = (mimeType?: string): string =>
  MIME_EXTENSION_MAP[mimeType ?? ''] ?? 'bin'

export const buildSceneAssetPath = (slideId: string, fileId: string, mimeType?: string): string =>
  `data/scene-files/${slideId}/${fileId}.${getSceneFileExtension(mimeType)}`

export const isSceneFileAssetRef = (value: unknown): value is SceneFileAssetRef =>
  !!value &&
  typeof value === 'object' &&
  'assetPath' in value &&
  typeof (value as SceneFileAssetRef).assetPath === 'string'
