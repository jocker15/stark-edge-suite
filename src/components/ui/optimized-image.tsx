import { useState, useEffect, useRef } from 'react'
import { Skeleton } from '@/components/ui/skeleton'

interface OptimizedImageProps {
  src: string
  alt: string
  className?: string
  width?: number
  height?: number
  priority?: boolean
  onLoad?: () => void
  onClick?: () => void
}

export function OptimizedImage({
  src,
  alt,
  className = '',
  width,
  height,
  priority = false,
  onLoad,
  onClick
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(false)
  const [isInView, setIsInView] = useState(priority)
  const imgRef = useRef<HTMLImageElement>(null)

  // Lazy loading with Intersection Observer
  useEffect(() => {
    if (priority) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true)
            observer.disconnect()
          }
        })
      },
      {
        rootMargin: '50px'
      }
    )

    if (imgRef.current) {
      observer.observe(imgRef.current)
    }

    return () => {
      observer.disconnect()
    }
  }, [priority])

  // Generate WebP source URL
  const getWebPUrl = (url: string) => {
    if (url.includes('/placeholder.svg')) return url
    if (url.includes('supabase.co/storage')) {
      // For Supabase storage, we can add transformation parameters
      return url
    }
    return url
  }

  // Generate srcSet for responsive images
  const getSrcSet = (url: string) => {
    if (url.includes('/placeholder.svg')) return undefined
    
    const sizes = [640, 768, 1024, 1280, 1536]
    return sizes.map(size => `${url}?width=${size} ${size}w`).join(', ')
  }

  const handleLoad = () => {
    setIsLoading(false)
    onLoad?.()
  }

  const handleError = () => {
    setIsLoading(false)
    setError(true)
  }

  const webpSrc = getWebPUrl(src)
  const srcSet = getSrcSet(src)

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {isLoading && !error && (
        <Skeleton className="absolute inset-0 w-full h-full" />
      )}
      
      {error ? (
        <div className="absolute inset-0 flex items-center justify-center bg-muted">
          <span className="text-muted-foreground text-sm">Failed to load image</span>
        </div>
      ) : (
        <picture>
          {/* WebP source for modern browsers */}
          {isInView && (
            <>
              <source 
                type="image/webp" 
                srcSet={srcSet}
                sizes="(max-width: 640px) 640px, (max-width: 768px) 768px, (max-width: 1024px) 1024px, 1280px"
              />
              <img
                ref={imgRef}
                src={isInView ? webpSrc : undefined}
                alt={alt}
                className={`${className} ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
                width={width}
                height={height}
                loading={priority ? 'eager' : 'lazy'}
                decoding="async"
                onLoad={handleLoad}
                onError={handleError}
                onClick={onClick}
              />
            </>
          )}
        </picture>
      )}
    </div>
  )
}
