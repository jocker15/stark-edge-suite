/**
 * Image Optimization Utilities
 * Provides functions for converting images to WebP format
 * and optimizing image quality in the browser
 */

export interface ImageOptimizationOptions {
  maxWidth?: number
  maxHeight?: number
  quality?: number
  format?: 'webp' | 'jpeg' | 'png'
}

/**
 * Convert an image file to WebP format
 * @param file - The image file to convert
 * @param options - Optimization options
 * @returns Promise<Blob> - The optimized image as a Blob
 */
export async function convertToWebP(
  file: File,
  options: ImageOptimizationOptions = {}
): Promise<Blob> {
  const {
    maxWidth = 1920,
    maxHeight = 1920,
    quality = 0.85,
    format = 'webp'
  } = options

  return new Promise((resolve, reject) => {
    const img = new Image()
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')

    if (!ctx) {
      reject(new Error('Could not get canvas context'))
      return
    }

    img.onload = () => {
      let { width, height } = img

      // Calculate new dimensions while maintaining aspect ratio
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height)
        width = Math.floor(width * ratio)
        height = Math.floor(height * ratio)
      }

      canvas.width = width
      canvas.height = height

      // Draw image on canvas
      ctx.drawImage(img, 0, 0, width, height)

      // Convert to WebP
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob)
          } else {
            reject(new Error('Failed to convert image'))
          }
        },
        `image/${format}`,
        quality
      )
    }

    img.onerror = () => {
      reject(new Error('Failed to load image'))
    }

    img.src = URL.createObjectURL(file)
  })
}

/**
 * Optimize multiple images
 * @param files - Array of image files
 * @param options - Optimization options
 * @returns Promise<Blob[]> - Array of optimized images
 */
export async function optimizeImages(
  files: File[],
  options: ImageOptimizationOptions = {}
): Promise<Blob[]> {
  const promises = files.map(file => convertToWebP(file, options))
  return Promise.all(promises)
}

/**
 * Generate responsive image URLs for different screen sizes
 * @param baseUrl - Base URL of the image
 * @returns Object with URLs for different sizes
 */
export function generateResponsiveUrls(baseUrl: string) {
  const sizes = {
    thumbnail: 320,
    small: 640,
    medium: 1024,
    large: 1920
  }

  return Object.entries(sizes).reduce((acc, [key, width]) => {
    acc[key] = `${baseUrl}?width=${width}&format=webp`
    return acc
  }, {} as Record<string, string>)
}

/**
 * Preload critical images for better performance
 * @param urls - Array of image URLs to preload
 */
export function preloadImages(urls: string[]): void {
  urls.forEach(url => {
    const link = document.createElement('link')
    link.rel = 'preload'
    link.as = 'image'
    link.href = url
    document.head.appendChild(link)
  })
}

/**
 * Check if browser supports WebP format
 * @returns boolean
 */
export function supportsWebP(): boolean {
  const canvas = document.createElement('canvas')
  if (canvas.getContext && canvas.getContext('2d')) {
    return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0
  }
  return false
}

/**
 * Get optimized image URL with CDN support
 * @param url - Original image URL
 * @param options - Optimization options
 * @returns Optimized URL
 */
export function getOptimizedImageUrl(
  url: string,
  options: { width?: number; quality?: number } = {}
): string {
  if (url.includes('/placeholder.svg')) return url
  
  const params = new URLSearchParams()
  
  if (options.width) {
    params.append('width', options.width.toString())
  }
  
  if (options.quality) {
    params.append('quality', options.quality.toString())
  }
  
  if (supportsWebP()) {
    params.append('format', 'webp')
  }
  
  const queryString = params.toString()
  return queryString ? `${url}?${queryString}` : url
}
