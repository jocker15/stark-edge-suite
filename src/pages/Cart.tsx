import { useCart } from '@/contexts/CartContext'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Trash2, Minus, Plus } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useToast } from '@/hooks/use-toast'

interface CartItem {
  id: string
  quantity: number
  price: number
  name_en: string
  name_ru: string | null
  image_url: string
}

import { useLanguage } from '@/contexts/LanguageContext'

export default function Cart() {
  const { cart, removeFromCart, updateQuantity, getTotalPrice, clearCart } = useCart()
  const { lang } = useLanguage()
  const navigate = useNavigate()
  const { toast } = useToast()

  const getName = (item: CartItem) => {
    if (lang === 'ru' && item.name_ru) return item.name_ru
    return item.name_en
  }

  const handleCheckout = () => {
    navigate('/checkout')
  }

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main id="main-content" className="flex-1 py-8 px-4 md:px-8 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-foreground mb-4">Your cart is empty</h2>
            <Button onClick={() => navigate('/game-accounts')}>
              Continue Shopping
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main id="main-content" className="flex-1 py-8 px-4 md:px-8">
        <div className="container mx-auto">
          <h1 className="text-3xl font-bold text-foreground mb-8">Shopping Cart</h1>
          <div className="space-y-6">
            {cart.map((item) => (
              <Card key={item.id}>
                <CardContent className="p-6 flex flex-col md:flex-row gap-4">
                  <img
                    src={item.image_url}
                    alt={getName(item)}
                    className="w-24 h-24 object-cover rounded-md md:w-32 md:h-32"
                  />
                  <div className="flex-1 space-y-2">
                    <CardTitle className="text-lg">{getName(item)}</CardTitle>
                    <CardDescription className="text-sm text-muted-foreground">
                      ${item.price.toFixed(2)} x {item.quantity}
                    </CardDescription>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        disabled={item.quantity <= 1}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <Input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => {
                          const newQuantity = parseInt(e.target.value);
                          if (isNaN(newQuantity) || newQuantity < 1) {
                            updateQuantity(item.id, 1);
                          } else if (newQuantity > 999) {
                            updateQuantity(item.id, 999);
                          } else {
                            updateQuantity(item.id, newQuantity);
                          }
                        }}
                        className="w-20 text-center"
                        min="1"
                        max="999"
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                      <div className="ml-auto font-bold">
                        ${(item.price * item.quantity).toFixed(2)}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeFromCart(item.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="mt-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <Button variant="outline" onClick={clearCart}>
              Clear Cart
            </Button>
            <div className="space-y-2 text-right">
              <div className="text-lg font-bold">
                Total: ${getTotalPrice().toFixed(2)}
              </div>
              <Button onClick={handleCheckout} className="w-full sm:w-auto bg-gradient-primary">
                Checkout
              </Button>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}