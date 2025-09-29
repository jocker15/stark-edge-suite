import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabaseClient'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'

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
  preview_link?: string | null
}

import { useCart } from '@/contexts/CartContext'
import { useToast } from '@/hooks/use-toast'

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [lang] = useState<'en' | 'ru'>('en')
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [showModal, setShowModal] = useState(false)
  const { addToCart } = useCart()
  const { toast } = useToast()

  useEffect(() => {
    if (!id) return

    async function fetchProduct() {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('id', id)
          .single()

        if (error) throw error
        setProduct(data)
      } catch (error) {
        console.error('Error fetching product:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchProduct()
  }, [id])

  const getName = () => {
    if (lang === 'ru' && product?.name_ru) return product.name_ru
    return product?.name_en || 'Unnamed Product'
  }

  const getDescription = () => {
    if (lang === 'ru' && product?.description_ru) return product.description_ru
    return product?.description_en || 'No description available'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-1 py-8 px-4 md:px-8">
          <div className="container mx-auto">
            <div className="flex flex-col md:flex-row gap-8">
              <Skeleton className="h-96 w-full md:w-1/2" />
              <div className="md:w-1/2 space-y-4">
                <Skeleton className="h-8 w-3/4" />
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-32 w-full" />
                <div className="flex gap-4">
                  <Skeleton className="h-10 w-32" />
                  <Skeleton className="h-10 w-32" />
                </div>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-1 py-8 px-4 md:px-8 flex items-center justify-center">
          <p className="text-muted-foreground">Product not found</p>
        </main>
        <Footer />
      </div>
    )
  }

  const mainImage = product.image_urls?.[currentImageIndex] || '/placeholder.svg'

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 py-8 px-4 md:px-8">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row gap-8">
            {/* Image Gallery */}
            <div className="md:w-1/2 space-y-4">
              <img
                src={mainImage}
                alt={getName()}
                className="w-full h-96 object-cover rounded-lg"
              />
              {product.image_urls && product.image_urls.length > 0 && (
                <div className="flex gap-2 overflow-x-auto">
                  {product.image_urls.map((url, index) => (
                    <img
                      key={index}
                      src={url}
                      alt={`${getName()} ${index + 1}`}
                      className={`w-20 h-20 object-cover rounded cursor-pointer hover:opacity-80 transition-opacity ${
                        index === currentImageIndex ? 'ring-2 ring-primary ring-offset-2' : ''
                      }`}
                      onClick={() => setCurrentImageIndex(index)}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Product Details */}
            <div className="md:w-1/2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-2xl font-bold text-foreground">
                    {getName()}
                  </CardTitle>
                  <Badge variant={product.stock > 0 ? "default" : "destructive"}>
                    {product.stock > 0 ? `Stock: ${product.stock}` : 'Out of Stock'}
                  </Badge>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-3xl font-bold text-primary">${product.price.toFixed(2)}</div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold text-foreground">Description</h3>
                    <p className="text-foreground leading-relaxed whitespace-pre-wrap">
                      {getDescription()}
                    </p>
                  </div>
                  <div className="flex gap-4 pt-4">
                    <Button
                      onClick={() => {
                        addToCart(product)
                        setShowModal(true)
                      }}
                      className="flex-1 bg-gradient-primary hover:brightness-110"
                    >
                      Add to Cart
                    </Button>
                    {product.preview_link && (
                      <Button variant="outline" asChild>
                        <a href={product.preview_link} target="_blank" rel="noopener noreferrer">
                          Preview
                        </a>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
      <Footer />

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-background p-6 rounded-lg max-w-md w-full mx-4 shadow-lg">
            <h3 className="text-lg font-semibold mb-4">Added to Cart!</h3>
            <p className="text-muted-foreground mb-6">Product has been added to your cart successfully.</p>
            <div className="flex gap-4 justify-end">
              <Button variant="outline" onClick={() => setShowModal(false)}>
                Continue Shopping
              </Button>
              <Button onClick={() => {
                setShowModal(false)
                navigate('/cart')
              }}>
                View Cart
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}