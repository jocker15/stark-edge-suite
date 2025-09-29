import { useState } from 'react'
import { Link } from "react-router-dom"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { useCart } from "@/contexts/CartContext"

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

interface ProductCardProps {
  product: Product
  lang?: 'en' | 'ru'
}

export function ProductCard({ product, lang = 'en' }: ProductCardProps) {
  const { addToCart } = useCart()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const getName = () => {
    if (lang === 'ru' && product.name_ru) return product.name_ru
    return product.name_en || 'Unnamed Product'
  }

  const getDescription = () => {
    if (lang === 'ru' && product.description_ru) return product.description_ru
    return product.description_en || 'No description available'
  }

  const imageUrl = product.image_urls && product.image_urls.length > 0 ? product.image_urls[0] : '/placeholder.svg'

  return (
    <>
      <Link to={`/products/${product.id}`} className="block no-underline">
        <Card className="w-full max-w-sm overflow-hidden transition-all hover:shadow-glow-accent border-border/50">
          <CardHeader className="p-0">
            <img
              src={imageUrl}
              alt={getName()}
              className="w-full h-48 object-cover"
            />
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