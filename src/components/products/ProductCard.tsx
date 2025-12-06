import { useState, useEffect, useRef } from 'react'
import { Link, useLocation } from "react-router-dom"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { useCart } from "@/contexts/CartContext"
import { useWishlist } from "@/hooks/useWishlist"
import { Heart } from 'lucide-react'
import { OptimizedImage } from '@/components/ui/optimized-image'

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

interface ProductCardProps {
  product: Product
  lang?: 'en' | 'ru'
  index?: number
}

export function ProductCard({ product, lang = 'en', index = 0 }: ProductCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [isRevealed, setIsRevealed] = useState(false)
  const location = useLocation()
  const { addToCart } = useCart()
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  
  useEffect(() => {
    const element = cardRef.current
    if (!element) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          // Stagger the reveal based on index
          setTimeout(() => setIsRevealed(true), index * 100)
          observer.unobserve(element)
        }
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    )

    observer.observe(element)
    return () => observer.disconnect()
  }, [index])
  
  const getName = () => {
    if (lang === 'ru' && product.name_ru) return product.name_ru
    return product.name_en || 'Unnamed Product'
  }

  const getDescription = () => {
    if (lang === 'ru' && product.description_ru) return product.description_ru
    return product.description_en || 'No description available'
  }

  const imageUrl = product.image_urls && product.image_urls.length > 0 ? product.image_urls[0] : '/placeholder.svg'
  
  const productLink = `/products/${product.id}${location.search}`

  return (
    <>
      <div 
        ref={cardRef}
        className={`transition-all duration-700 ${isRevealed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
        style={{ transitionDelay: `${index * 50}ms` }}
      >
      <Link to={productLink} className="block no-underline">
        <Card className="w-full max-w-sm overflow-hidden border-border/50 hover:!transform-none">
          <CardHeader className="p-0 relative">
            <OptimizedImage
              src={imageUrl}
              alt={getName()}
              className="w-full h-48 object-cover"
              width={400}
              height={300}
            />
            <button
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                const productId = Number(product.id)
                if (isInWishlist(productId)) {
                  removeFromWishlist(productId)
                } else {
                  addToWishlist(productId)
                }
              }}
              className="absolute top-2 right-2 p-2 rounded-full bg-background/80 hover:bg-background transition-colors"
            >
              <Heart
                className={`h-5 w-5 ${
                  isInWishlist(Number(product.id))
                    ? 'fill-primary text-primary'
                    : 'text-foreground'
                }`}
              />
            </button>
          </CardHeader>
          <CardContent className="p-4 space-y-2">
            <div className="flex justify-between items-start">
              <CardTitle className="text-lg font-semibold text-foreground line-clamp-1">
                {getName()}
              </CardTitle>
              <Badge variant={product.stock > 0 ? "default" : "destructive"} className="ml-2">
                {product.stock > 0 ? `Stock: ${product.stock}` : 'Out of Stock'}
              </Badge>
            </div>
            <CardDescription className="text-sm text-muted-foreground line-clamp-2">
              {getDescription()}
            </CardDescription>
            <div className="flex justify-between items-center pt-2">
              <div className="text-2xl font-bold text-primary">${product.price.toFixed(2)}</div>
              <Button
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  addToCart(product)
                  setIsDialogOpen(true)
                }}
                className="px-4 py-2 bg-gradient-primary text-primary-foreground rounded-md font-medium hover:brightness-110 transition-all"
                disabled={product.stock <= 0}
              >
                Add to Cart
              </Button>
            </div>
          </CardContent>
        </Card>
      </Link>
      </div>
      <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Added to Cart!</AlertDialogTitle>
            <AlertDialogDescription>
              Your item has been added to the shopping cart.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button variant="outline" asChild>
              <Link to="/game-accounts">Continue Shopping</Link>
            </Button>
            <Button asChild>
              <Link to="/cart">Go to Cart</Link>
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}