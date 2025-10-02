import { Helmet } from 'react-helmet-async'

interface DefaultSEOProps {
  title?: string
  description?: string
  url?: string
  image?: string
}

export function DefaultSEO({ 
  title = 'Digital Edge - Premium Digital Products & Services',
  description = 'Buy verified game accounts, digital templates, and document verification services. Secure cryptocurrency payments accepted.',
  url = 'https://yoursite.lovable.app',
  image = 'https://kpuqqqaqiwxbjpbmmcfz.supabase.co/storage/v1/object/public/product-images/og-image.jpg'
}: DefaultSEOProps) {
  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{title}</title>
      <meta name="title" content={title} />
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content="website" />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />

      {/* Twitter */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={url} />
      <meta property="twitter:title" content={title} />
      <meta property="twitter:description" content={description} />
      <meta property="twitter:image" content={image} />

      {/* Additional SEO tags */}
      <meta name="robots" content="index, follow" />
      <meta name="language" content="English" />
      <meta name="revisit-after" content="7 days" />
      <meta name="author" content="Digital Edge" />
    </Helmet>
  )
}
