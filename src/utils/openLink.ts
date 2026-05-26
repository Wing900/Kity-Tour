/** 规范化并新窗口打开外链 */
export function openExternalLink(rawUrl: string): void {
  const trimmed = rawUrl.trim()
  if (!trimmed) return

  const url =
    /^https?:\/\//i.test(trimmed) || trimmed.startsWith('mailto:')
      ? trimmed
      : `https://${trimmed}`

  window.open(url, '_blank', 'noopener,noreferrer')
}
