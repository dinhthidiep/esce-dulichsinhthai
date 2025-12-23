import React, { useState, useEffect, useCallback } from 'react'
import LazyImage from './LazyImage'
import { ChevronLeftIcon, ChevronRightIcon } from './icons'
import './ImageCarousel.css'

interface ImageCarouselProps {
  images: string | string[] | null | undefined
  autoPlayInterval?: number
  fallbackImage?: string
}

const ImageCarousel = ({ images, autoPlayInterval = 4000, fallbackImage }: ImageCarouselProps) => {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)

  // Đảm bảo images là một mảng
  const imageList = Array.isArray(images) ? images : images ? [images] : []

  // Nếu không có ảnh, sử dụng fallback
  const displayImages = imageList.length > 0 ? imageList : fallbackImage ? [fallbackImage] : []

  // Auto-play: tự động chuyển ảnh
  useEffect(() => {
    if (displayImages.length <= 1 || isPaused) return

    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % displayImages.length)
    }, autoPlayInterval)

    return () => clearInterval(interval)
  }, [displayImages.length, autoPlayInterval, isPaused])

  // Chuyển đến ảnh trước
  const goToPrevious = useCallback(() => {
    setCurrentIndex((prevIndex) => (prevIndex === 0 ? displayImages.length - 1 : prevIndex - 1))
    setIsPaused(true)
    // Tự động resume sau 5 giây
    setTimeout(() => setIsPaused(false), 5000)
  }, [displayImages.length])

  // Chuyển đến ảnh tiếp theo
  const goToNext = useCallback(() => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % displayImages.length)
    setIsPaused(true)
    // Tự động resume sau 5 giây
    setTimeout(() => setIsPaused(false), 5000)
  }, [displayImages.length])

  // Chuyển đến ảnh cụ thể
  const goToSlide = useCallback(
    (index: number) => {
      setCurrentIndex(index)
      setIsPaused(true)
      // Tự động resume sau 5 giây
      setTimeout(() => setIsPaused(false), 5000)
    },
    []
  )

  if (displayImages.length === 0) {
    return null
  }

  // Nếu chỉ có 1 ảnh, không cần carousel
  if (displayImages.length === 1) {
    return (
      <div className="image-carousel-single">
        <LazyImage
          src={displayImages[0]}
          alt="Service"
          className=""
          wrapperClassName="carousel-image-wrapper"
          fallbackSrc={fallbackImage}
        />
      </div>
    )
  }

  return (
    <div
      className="image-carousel"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="carousel-container">
        <div
          className="carousel-wrapper"
          style={{
            transform: `translateX(-${currentIndex * 100}%)`,
            transition: 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        >
          {displayImages.map((image, index) => (
            <div key={index} className="carousel-slide">
              <LazyImage
                src={image}
                alt={`Service image ${index + 1}`}
                className=""
                wrapperClassName="carousel-image-wrapper"
                fallbackSrc={fallbackImage}
              />
            </div>
          ))}
        </div>

        {/* Navigation Buttons */}
        <button
          className="carousel-button carousel-button-prev"
          onClick={goToPrevious}
          aria-label="Ảnh trước"
        >
          <ChevronLeftIcon className="carousel-button-icon" />
        </button>
        <button
          className="carousel-button carousel-button-next"
          onClick={goToNext}
          aria-label="Ảnh tiếp theo"
        >
          <ChevronRightIcon className="carousel-button-icon" />
        </button>

        {/* Indicator Dots */}
        <div className="carousel-indicators">
          {displayImages.map((_, index) => (
            <button
              key={index}
              className={`carousel-indicator ${index === currentIndex ? 'active' : ''}`}
              onClick={() => goToSlide(index)}
              aria-label={`Chuyển đến ảnh ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

export default ImageCarousel



























