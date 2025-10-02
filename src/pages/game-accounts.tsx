import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { ProductCard } from '@/components/products/ProductCard'
import { Skeleton } from '@/components/ui/skeleton'
import { ProductListSEO } from '@/components/seo/ProductListSEO'

interface Product {
  id: string
  name_en: string | null
  name_ru: string | null
  description_en: string | null
  description_ru: string | null
  price: number
  image_urls: string[]
  stock: number
  category: string
}

export default function GameAccounts() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [lang] = useState<'en' | 'ru'>('en') // Можно сделать динамическим позже

  useEffect(() => {
    async function fetchProducts() {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('category', 'Game Account')

        if (error) throw error
        setProducts(data || [])
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
      <main className="flex-1 py-8 px-4 md:px-8">
        <div className="container mx-auto">
          <h1 className="text-3xl font-bold text-foreground mb-8 text-center">
            {lang === 'ru' ? 'Игровые Аккаунты' : 'Game Accounts'}
          </h1>
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-80 w-full" />
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