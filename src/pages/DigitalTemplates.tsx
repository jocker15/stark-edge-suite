import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { ProductCard } from '@/components/products/ProductCard'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
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
  document_type: string | null
  country: string | null
}

import { useLanguage } from '@/contexts/LanguageContext'

export default function DigitalTemplates() {
  const [products, setProducts] = useState<Product[]>([])
  const [allProducts, setAllProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const { lang } = useLanguage()
  const [selectedDocType, setSelectedDocType] = useState<string>('all')
  const [selectedCountry, setSelectedCountry] = useState<string>('all')
  const [documentTypes, setDocumentTypes] = useState<string[]>([])
  const [countries, setCountries] = useState<string[]>([])

  useEffect(() => {
    async function fetchProducts() {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('category', 'Digital Template')

        if (error) throw error
        const productsData = data || []
        setAllProducts(productsData)
        setProducts(productsData)

        // Extract unique document types and countries
        const docTypes = [...new Set(productsData.map(p => p.document_type).filter(Boolean))] as string[]
        const countriesList = [...new Set(productsData.map(p => p.country).filter(Boolean))] as string[]
        setDocumentTypes(docTypes)
        setCountries(countriesList)
      } catch (error) {
        console.error('Error fetching products:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [])

  useEffect(() => {
    // Filter products based on selected filters
    let filtered = allProducts

    if (selectedDocType !== 'all') {
      filtered = filtered.filter(p => p.document_type === selectedDocType)
    }

    if (selectedCountry !== 'all') {
      filtered = filtered.filter(p => p.country === selectedCountry)
    }

    setProducts(filtered)
  }, [selectedDocType, selectedCountry, allProducts])

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <ProductListSEO category="Digital Template" products={products} lang={lang} />
      <Header />
      <main className="flex-1 py-8 px-4 md:px-8">
        <div className="container mx-auto">
          <h1 className="text-3xl font-bold text-foreground mb-8 text-center">
            {lang === 'ru' ? 'Цифровые шаблоны' : 'Digital Templates'}
          </h1>

          {/* Filters */}
          <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
            <div className="space-y-2">
              <Label htmlFor="document-type">
                {lang === 'ru' ? 'Тип документа' : 'Document Type'}
              </Label>
              <Select value={selectedDocType} onValueChange={setSelectedDocType}>
                <SelectTrigger id="document-type" className="bg-background">
                  <SelectValue placeholder={lang === 'ru' ? 'Все типы' : 'All types'} />
                </SelectTrigger>
                <SelectContent className="bg-background z-50">
                  <SelectItem value="all">{lang === 'ru' ? 'Все типы' : 'All types'}</SelectItem>
                  {documentTypes.map((type) => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="country">
                {lang === 'ru' ? 'Страна' : 'Country'}
              </Label>
              <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                <SelectTrigger id="country" className="bg-background">
                  <SelectValue placeholder={lang === 'ru' ? 'Все страны' : 'All countries'} />
                </SelectTrigger>
                <SelectContent className="bg-background z-50">
                  <SelectItem value="all">{lang === 'ru' ? 'Все страны' : 'All countries'}</SelectItem>
                  {countries.map((country) => (
                    <SelectItem key={country} value={country}>{country}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

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