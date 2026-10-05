/**
 * 资源路径解析。
 * Markdown 里的图片写成相对路径（data/...），这里统一挂上 BASE_URL，
 * 保证在 GitHub Pages 子路径（/Kity-Tour/）下也能解析正确。
 */
export const resolveAsset = (src: string): string => {
  if (/^([a-z]+:)?\/\//i.test(src) || src.startsWith('/')) return src
  return `${import.meta.env.BASE_URL}${src}`
}
