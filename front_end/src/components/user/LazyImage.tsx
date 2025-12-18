import React, { useState, useEffect } from 'react'
import type { ImgHTMLAttributes } from 'react'
import { getFallbackImageUrl } from '~/services/firebaseStorage'

// Fallback local tạm thời, sẽ được thay bằng URL Firebase nếu load được
const localBaNaHillImage = '/img/banahills.jpg'

interface LazyImageProps extends ImgHTMLAttributes<HTMLImageElement> {
  src?: string | null
  alt: string
  className?: string
  wrapperClassName?: string
  fallbackSrc?: string
}

const LazyImage = ({
  src,
  alt,
  className = '',
  wrapperClassName = '',
  fallbackSrc = localBaNaHillImage,
  ...props
}: LazyImageProps) => {
  const [resolvedFallback, setResolvedFallback] = useState(fallbackSrc)

  // Load fallback Ba Na Hill từ Firebase một lần
  useEffect(() => {
    let isMounted = true

    const loadFirebaseFallback = async () => {
      try {
        const firebaseUrl = await getFallbackImageUrl()
        if (isMounted && firebaseUrl) {
          setResolvedFallback(firebaseUrl)
        }
      } catch {
        // Nếu lỗi thì giữ nguyên fallback local, không cần làm gì
      }
    }

    loadFirebaseFallback()

    return () => {
      isMounted = false
    }
  }, [])

  // Đảm bảo src luôn có giá trị hợp lệ
  const imageSrc = src || resolvedFallback
  const [currentSrc, setCurrentSrc] = useState(imageSrc)
  const [hasError, setHasError] = useState(false)

  // Reset khi src thay đổi
  useEffect(() => {
    if (imageSrc !== currentSrc) {
      setCurrentSrc(imageSrc)
      setHasError(false)
    }
  }, [imageSrc, currentSrc])

  const handleError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    if (!hasError && currentSrc !== resolvedFallback) {
      if (import.meta.env.DEV) {
        console.warn(`⚠️ [LazyImage] Không thể load ảnh "${currentSrc}", thử fallback: ${resolvedFallback}`)
      }
      setHasError(true)
      setCurrentSrc(resolvedFallback)
    } else {
      if (import.meta.env.DEV) {
        console.error(`❌ [LazyImage] Không thể load cả ảnh và fallback: ${currentSrc}`)
      }
    }
  }

  return (
    <div className={`lazy-image-wrapper ${wrapperClassName}`.trim()}>
      <img
        src={currentSrc}
        alt={alt}
        className={`lazy-image ${className}`.trim()}
        onError={handleError}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          display: 'block',
        }}
        {...props}
      />
    </div>
  )
}

export default LazyImage










