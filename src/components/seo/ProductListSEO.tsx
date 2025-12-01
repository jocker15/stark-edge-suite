import { Helmet } from 'react-helmet-async'

interface Product {
  id: number
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

const SITE_URL = 'https://stark-edge-suite.lovable.app'

export function ProductListSEO({ category, products, lang = 'en' }: ProductListSEOProps) {
  const categoryNames: Record<string, { en: string; ru: string; slug: string; descEn: string; descRu: string }> = {
    'Game Account': { 
      en: 'Premium Game Accounts', 
      ru: 'Премиум игровые аккаунты',
      slug: 'game-accounts',
      descEn: 'Buy premium game accounts with instant delivery. Secure cryptocurrency payments. Verified sellers. Best prices guaranteed.',
      descRu: 'Купить премиум игровые аккаунты с мгновенной доставкой. Безопасные криптоплатежи. Проверенные продавцы.'
    },
    'Digital Template': { 
      en: 'Professional Digital Templates', 
      ru: 'Профессиональные цифровые шаблоны',
      slug: 'digital-templates',
      descEn: 'High-quality digital templates for various document types. Instant download. Multiple countries and formats available.',
      descRu: 'Качественные цифровые шаблоны для различных типов документов. Мгновенная загрузка. Доступны различные страны и форматы.'
    },
    'Verification': { 
      en: 'Verification Services', 
      ru: 'Услуги верификации',
      slug: 'verifications',
      descEn: 'Professional verification services for accounts and documents. Fast turnaround. Confidential process.',
      descRu: 'Профессиональные услуги верификации аккаунтов и документов. Быстрое выполнение. Конфиденциальный процесс.'
    }
  }

  const categoryData = categoryNames[category] || { 
    en: category, 
    ru: category, 
    slug: category.toLowerCase().replace(' ', '-'),
    descEn: `Browse our ${category} products.`,
    descRu: `Просмотрите наши ${category} продукты.`
  }
  
  const categoryName = lang === 'ru' ? categoryData.ru : categoryData.en
  const title = `${categoryName} | STARK INC. - Digital Edge`
  const description = lang === 'ru' ? categoryData.descRu : categoryData.descEn
  const pageUrl = `${SITE_URL}/${categoryData.slug}`

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
        "url": `${SITE_URL}/products/${product.id}`,
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
        "item": SITE_URL
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": categoryName,
        "item": pageUrl
      }
    ]
  }

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="title" content={title} />
      <meta name="description" content={description} />
      <link rel="canonical" href={pageUrl} />
      
      {/* Advanced robots directives for rich snippets */}
      <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" />

      {/* Open Graph */}
      <meta property="og:type" content="website" />
      <meta property="og:url" content={pageUrl} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:site_name" content="STARK INC." />

      {/* Twitter */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={pageUrl} />
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
