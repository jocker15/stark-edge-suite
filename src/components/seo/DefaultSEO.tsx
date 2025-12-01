import { Helmet } from 'react-helmet-async'

interface DefaultSEOProps {
  title?: string
  description?: string
  url?: string
  image?: string
}

const SITE_URL = 'https://stark-edge-suite.lovable.app'

export function DefaultSEO({ 
  title = 'STARK INC. - Premium Digital Products & Verification Services',
  description = 'Buy premium game accounts, professional digital templates, and document verification services. Secure cryptocurrency payments. Fast delivery worldwide.',
  url = SITE_URL,
  image = 'https://kpuqqqaqiwxbjpbmmcfz.supabase.co/storage/v1/object/public/product-images/og-image.jpg'
}: DefaultSEOProps) {
  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{title}</title>
      <meta name="title" content={title} />
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />

      {/* Advanced robots directives for rich snippets */}
      <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content="website" />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:site_name" content="STARK INC." />

      {/* Twitter */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={url} />
      <meta property="twitter:title" content={title} />
      <meta property="twitter:description" content={description} />
      <meta property="twitter:image" content={image} />

      {/* Additional SEO tags */}
      <meta name="language" content="English" />
      <meta name="revisit-after" content="7 days" />
      <meta name="author" content="STARK INC." />
    </Helmet>
  )
}
