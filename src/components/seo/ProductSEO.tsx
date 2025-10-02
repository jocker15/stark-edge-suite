import { Helmet } from 'react-helmet-async'
import { useProductReviews } from '@/hooks/useProductReviews'

interface ProductSEOProps {
  product: {
    id: string
    name_en: string | null
    name_ru: string | null
    description_en: string | null
    description_ru: string | null
    price: number
    image_urls: any
    stock: number
    category: string
  }
  lang?: 'en' | 'ru'
}

export function ProductSEO({ product, lang = 'en' }: ProductSEOProps) {
  const { averageRating, totalReviews } = useProductReviews(Number(product.id))
  const name = lang === 'ru' && product.name_ru ? product.name_ru : product.name_en || 'Product'
  const description = lang === 'ru' && product.description_ru 
    ? product.description_ru 
    : product.description_en || 'High-quality product available now'
  
  // Truncate description for meta tag (160 chars max)
  const metaDescription = description.length > 160 
    ? description.substring(0, 157) + '...' 
    : description

  // Title with main keyword (60 chars max)
  const title = `${name} - Buy Now | Digital Edge`.substring(0, 60)

  // Get first image or placeholder
  const imageUrl = Array.isArray(product.image_urls) && product.image_urls.length > 0
    ? product.image_urls[0]
    : 'https://kpuqqqaqiwxbjpbmmcfz.supabase.co/storage/v1/object/public/product-images/placeholder.jpg'

  // Schema.org structured data for Product
  const productSchema = {
    "@context": "https://schema.org/",
    "@type": "Product",
    "name": name,
    "description": description,
    "image": imageUrl,
    "sku": product.id,
    "brand": {
      "@type": "Brand",
      "name": "Digital Edge"
    },
    "offers": {
      "@type": "Offer",
      "url": `https://yoursite.lovable.app/products/${product.id}`,
      "priceCurrency": "USD",
      "price": product.price,
      "availability": product.stock > 0 
        ? "https://schema.org/InStock" 
        : "https://schema.org/OutOfStock",
      "priceValidUntil": new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    },
    "category": product.category,
    ...(totalReviews > 0 && {
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": averageRating.toString(),
        "reviewCount": totalReviews.toString()
      }
    })
  }

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{title}</title>
      <meta name="title" content={title} />
      <meta name="description" content={metaDescription} />
      <link rel="canonical" href={`https://yoursite.lovable.app/products/${product.id}`} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content="product" />
      <meta property="og:url" content={`https://yoursite.lovable.app/products/${product.id}`} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={metaDescription} />
      <meta property="og:image" content={imageUrl} />
      <meta property="product:price:amount" content={String(product.price)} />
      <meta property="product:price:currency" content="USD" />

      {/* Twitter */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={`https://yoursite.lovable.app/products/${product.id}`} />
      <meta property="twitter:title" content={title} />
      <meta property="twitter:description" content={metaDescription} />
      <meta property="twitter:image" content={imageUrl} />

      {/* Schema.org JSON-LD */}
      <script type="application/ld+json">
        {JSON.stringify(productSchema)}
      </script>
    </Helmet>
  )
}
