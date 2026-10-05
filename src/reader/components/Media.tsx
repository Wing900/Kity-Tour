import { useRef, useState, type MouseEvent } from 'react'
import { resolveAsset } from '../lib/asset'
import type { ZoomTarget } from './Lightbox'
import { Reveal } from './Reveal'

interface MediaProps {
  kind: 'image' | 'video'
  src: string
  poster?: string
  alt: string
  caption?: string
  onZoom: (target: ZoomTarget) => void
}

/** 图片：hover 抬升，点击进入 FLIP 放大层。 */
const ImageMedia = ({ src, alt, caption, onZoom }: Omit<MediaProps, 'kind' | 'poster'>) => {
  const handleOpen = (event: MouseEvent<HTMLButtonElement>) => {
    const img = event.currentTarget.querySelector('img')
    if (!img) return
    onZoom({
      src: img.currentSrc || img.src,
      alt,
      rect: img.getBoundingClientRect(),
      naturalWidth: img.naturalWidth || 1,
      naturalHeight: img.naturalHeight || 1
    })
  }

  return (
    <figure className="rd-figure">
      <button
        type="button"
        className="rd-figure-trigger"
        onClick={handleOpen}
        aria-label={`放大查看图片：${alt}`}
      >
        <img
          className="rd-figure-image"
          src={resolveAsset(src)}
          alt={alt}
          loading="lazy"
          decoding="async"
        />
      </button>
      {caption ? <figcaption className="rd-figure-caption">{caption}</figcaption> : null}
    </figure>
  )
}

/** 视频：先只加载元数据与封面，点击大按钮才开始播放（省流量、避免自动播放）。 */
const VideoMedia = ({ src, poster, alt, caption }: Omit<MediaProps, 'kind' | 'onZoom'>) => {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [started, setStarted] = useState(false)

  const handlePlay = () => {
    setStarted(true)
    void videoRef.current?.play()
  }

  return (
    <figure className="rd-video">
      <div className={`rd-video-frame${started ? ' is-started' : ''}`}>
        <video
          ref={videoRef}
          className="rd-video-el"
          src={resolveAsset(src)}
          poster={poster ? resolveAsset(poster) : undefined}
          controls={started}
          preload="metadata"
          playsInline
          onPlay={() => setStarted(true)}
        />
        {!started && (
          <button
            type="button"
            className="rd-video-play"
            onClick={handlePlay}
            aria-label={`播放视频：${alt}`}
          >
            <span className="rd-video-play-icon" aria-hidden="true">
              ▶
            </span>
          </button>
        )}
      </div>
      {caption ? <figcaption className="rd-figure-caption">{caption}</figcaption> : null}
    </figure>
  )
}

export const Media = ({ kind, src, poster, alt, caption, onZoom }: MediaProps) => (
  <Reveal className="rd-figure-shell">
    {kind === 'video' ? (
      <VideoMedia src={src} poster={poster} alt={alt} caption={caption} />
    ) : (
      <ImageMedia src={src} alt={alt} caption={caption} onZoom={onZoom} />
    )}
  </Reveal>
)
