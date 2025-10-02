import { Helmet } from 'react-helmet-async'

export function OrganizationSchema() {
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Digital Edge",
    "url": "https://yoursite.lovable.app",
    "logo": "https://kpuqqqaqiwxbjpbmmcfz.supabase.co/storage/v1/object/public/product-images/logo.png",
    "description": "Premium digital products and services marketplace",
    "contactPoint": {
      "@type": "ContactPoint",
      "contactType": "Customer Service",
      "availableLanguage": ["English", "Russian"]
    },
    "sameAs": [
      "https://twitter.com/digitaledge",
      "https://facebook.com/digitaledge"
    ]
  }

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "Digital Edge",
    "url": "https://yoursite.lovable.app",
    "potentialAction": {
      "@type": "SearchAction",
      "target": "https://yoursite.lovable.app/search?q={search_term_string}",
      "query-input": "required name=search_term_string"
    }
  }

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(organizationSchema)}
      </script>
      <script type="application/ld+json">
        {JSON.stringify(websiteSchema)}
      </script>
    </Helmet>
  )
}
