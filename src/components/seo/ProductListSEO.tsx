import { Helmet } from 'react-helmet-async'

interface Product {
  id: string
  name_en: string | null
  name_ru: string | null
  price: number
  image_urls: any
}

interface ProductListSEOProps {
  category: string
  products: Product[]
  lang?: 'en' | 'ru'
}

export function ProductListSEO({ category, products, lang = 'en' }: ProductListSEOProps) {
  const categoryNames: Record<string, { en: string; ru: string }> = {
    'Game Account': { en: 'Game Accounts', ru: 'Игровые аккаунты' },
    'Digital Template': { en: 'Digital Templates', ru: 'Цифровые шаблоны' },
    'Verification': { en: 'Verification Services', ru: 'Услуги верификации' }
  }

  const categoryName = categoryNames[category]?.[lang] || category
  const title = `${categoryName} - Buy Now | Digital Edge`.substring(0, 60)
  const description = `Browse our selection of ${categoryName.toLowerCase()}. Secure cryptocurrency payments. Fast delivery. ${products.length}+ products available.`.substring(0, 160)

  // Schema.org ItemList structured data
  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": categoryName,
    "numberOfItems": products.length,
    "itemListElement": products.slice(0, 10).map((product, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "item": {
        "@type": "Product",
        "name": lang === 'ru' && product.name_ru ? product.name_ru : product.name_en || 'Product',
        "url": `https://yoursite.lovable.app/products/${product.id}`,
        "image": Array.isArray(product.image_urls) && product.image_urls.length > 0
          ? product.image_urls[0]
          : 'https://kpuqqqaqiwxbjpbmmcfz.supabase.co/storage/v1/object/public/product-images/placeholder.jpg',
        "offers": {
          "@type": "Offer",
          "price": product.price,
          "priceCurrency": "USD"
        }
      }
    }))
  }

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": "https://yoursite.lovable.app"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": categoryName,
        "item": `https://yoursite.lovable.app/${category.toLowerCase().replace(' ', '-')}`
      }
    ]
  }

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="title" content={title} />
      <meta name="description" content={description} />
      <link rel="canonical" href={`https://yoursite.lovable.app/${category.toLowerCase().replace(' ', '-')}`} />

      {/* Open Graph */}
      <meta property="og:type" content="website" />
      <meta property="og:url" content={`https://yoursite.lovable.app/${category.toLowerCase().replace(' ', '-')}`} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />

      {/* Twitter */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={`https://yoursite.lovable.app/${category.toLowerCase().replace(' ', '-')}`} />
      <meta property="twitter:title" content={title} />
      <meta property="twitter:description" content={description} />

      {/* Schema.org JSON-LD */}
      <script type="application/ld+json">
        {JSON.stringify(itemListSchema)}
      </script>
      <script type="application/ld+json">
        {JSON.stringify(breadcrumbSchema)}
      </script>
    </Helmet>
  )
}
