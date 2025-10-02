import { useEffect, useState } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { ProductCard } from '@/components/products/ProductCard'
import { Card, CardContent } from '@/components/ui/card'
import { useWishlist } from '@/hooks/useWishlist'
import { Skeleton } from '@/components/ui/skeleton'

interface Product {
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

export default function Wishlist() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const { wishlist } = useWishlist()
  const [lang] = useState<'en' | 'ru'>('en')

  useEffect(() => {
    loadWishlistProducts()
  }, [wishlist])

  async function loadWishlistProducts() {
    if (wishlist.length === 0) {
      setProducts([])
      setLoading(false)
      return
    }

    const { data, error } = await supabase
      .from('products')
      .select('*')
      .in('id', wishlist)

    if (!error && data) {
      const convertedData = data.map(p => ({
        ...p,
        id: String(p.id),
        image_urls: Array.isArray(p.image_urls) ? p.image_urls : []
      }))
      setProducts(convertedData as any)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 py-8 px-4 md:px-8">
        <div className="container mx-auto">
          <h1 className="text-3xl font-bold mb-8">Список желаемого</h1>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-96" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground text-lg mb-4">
                  Ваш список желаемого пуст
                </p>
                <p className="text-muted-foreground">
                  Добавьте товары, нажав на иконку сердца на карточке товара
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} lang={lang} />
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}
