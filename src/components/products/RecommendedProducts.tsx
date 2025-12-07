import { useEffect, useState } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { ProductCard } from './ProductCard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useLanguage } from '@/contexts/LanguageContext'

interface Product {
  id: number
  name_en: string | null
  name_ru: string | null
  description_en: string | null
  description_ru: string | null
  price: number
  image_urls: string[]
  stock: number
  category: string
}

interface RecommendedProductsProps {
  currentProductId: number
  category: string
  lang?: 'en' | 'ru'
}

export function RecommendedProducts({ currentProductId, category }: Omit<RecommendedProductsProps, 'lang'>) {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const { lang } = useLanguage()

  useEffect(() => {
    loadRecommendations()
  }, [currentProductId, category])

  async function loadRecommendations() {
    // Simple recommendation: show products from same category
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('category', category)
      .eq('status', 'active')
      .neq('id', currentProductId)
      .gt('stock', 0)
      .limit(4)

    if (!error && data) {
      // Convert data to match ProductCard interface
      const convertedData = data.map(p => ({
        ...p,
        image_urls: Array.isArray(p.image_urls) ? p.image_urls as string[] : []
      }))
      setProducts(convertedData)
    }
    setLoading(false)
  }

  if (loading || products.length === 0) {
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {lang === 'ru' ? 'Рекомендуемые товары' : 'Recommended Products'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {products.map((product, index) => (
            <ProductCard key={product.id} product={product} lang={lang} index={index} />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
