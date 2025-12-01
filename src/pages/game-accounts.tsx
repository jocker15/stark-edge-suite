import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { ProductCard } from '@/components/products/ProductCard'
import { ProductCardSkeleton } from '@/components/products/ProductCardSkeleton'
import { ProductListSEO } from '@/components/seo/ProductListSEO'

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

import { useLanguage } from '@/contexts/LanguageContext'

export default function GameAccounts() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const { lang } = useLanguage()

  useEffect(() => {
    async function fetchProducts() {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('category', 'Game Account')
          .eq('status', 'active')

        if (error) throw error
        setProducts((data || []).map(p => ({
          ...p,
          image_urls: Array.isArray(p.image_urls) ? p.image_urls as string[] : []
        })))
      } catch (error) {
        console.error('Error fetching products:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [])

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <ProductListSEO category="Game Account" products={products} lang={lang} />
      <Header />
      <main id="main-content" className="flex-1 py-8 px-4 md:px-8">
        <div className="container mx-auto">
          <h1 className="text-3xl font-bold text-foreground mb-8 text-center">
            {lang === 'ru' ? 'Игровые Аккаунты' : 'Game Accounts'}
          </h1>
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.length > 0 ? (
                products.map((product) => (
                  <ProductCard key={product.id} product={product} lang={lang} />
                ))
              ) : (
                <p className="text-center text-muted-foreground col-span-full">
                  {lang === 'ru' ? 'Продукты не найдены' : 'No products found'}
                </p>
              )}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}