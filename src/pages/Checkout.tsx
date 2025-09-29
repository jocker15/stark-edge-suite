import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { v4 as uuidv4 } from 'uuid'
import { useCart } from '@/contexts/CartContext'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabaseClient'
import type { Database } from '@/integrations/supabase/types'
import { CRYPTOCLOUD_CONFIG } from '@/lib/cryptocloudConfig'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface CartItem {
  id: string
  quantity: number
  price: number
  name_en: string
  name_ru: string | null
  image_url: string
}

export default function Checkout() {
  const { cart, getTotalPrice } = useCart()
  const { user } = useAuth()
  const [lang] = useState<'en' | 'ru'>('en')
  const [orderId, setOrderId] = useState<number | null>(null)
  const navigate = useNavigate()
  const widgetRef = useRef<HTMLDivElement>(null)
  const total = getTotalPrice()

  const { toast } = useToast()

  const [orderReady, setOrderReady] = useState(false)

  // Create pending order
  useEffect(() => {
    if (cart.length > 0 && !orderId) {
      const createOrder = async () => {
        const { data, error } = await supabase
          .from('orders')
          .insert({
            user_id: user?.id || null,
            status: 'pending',
            amount: total,
            order_details: cart
          })
          .select('id')
          .single()

        if (error) {
          console.error('Error creating order:', error)
          console.log(error)
          toast({
            title: "Error",
            description: "Failed to create order. Please try again.",
          })
          return
        }

        setOrderId(data.id)
        setOrderReady(true)
      }

      createOrder()
    }
  }, [user, cart, total, orderId])

  const getName = (item: CartItem) => {
    if (lang === 'ru' && item.name_ru) return item.name_ru
    return item.name_en
  }

  useEffect(() => {
    if (!orderReady) return

    const div = widgetRef.current
    if (!div) return

    // Load CSS
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = 'https://api.cryptocloud.plus/static/widget/v2/css/app.css'
    document.head.appendChild(link)

    // Load script
    const script = document.createElement('script')
    script.src = 'https://api.cryptocloud.plus/static/widget/v2/js/app.js'
    script.async = true
    script.onload = () => {
      // Create vue-widget
      const vueWidget = document.createElement('vue-widget')
      vueWidget.setAttribute('shop_id', CRYPTOCLOUD_CONFIG.shopId)
      vueWidget.setAttribute('api_key', CRYPTOCLOUD_CONFIG.apiKey)
      vueWidget.setAttribute('currency', CRYPTOCLOUD_CONFIG.currency)
      vueWidget.setAttribute('amount', total.toString())
      vueWidget.setAttribute('locale', 'en')
      if (orderId) {
        vueWidget.setAttribute('order_id', orderId.toString())
        vueWidget.setAttribute('success_url', 'http://localhost:5173/payment-success')
      }
      div.appendChild(vueWidget)
    }
    document.body.appendChild(script)

    return () => {
      // Cleanup
      const existingLink = document.querySelector('link[href="https://api.cryptocloud.plus/static/widget/v2/css/app.css"]')
      if (existingLink) existingLink.remove()
      const existingScript = document.querySelector('script[src="https://api.cryptocloud.plus/static/widget/v2/js/app.js"]')
      if (existingScript) existingScript.remove()
      if (div.firstChild) div.innerHTML = ''
    }
  }, [total, orderId, orderReady])

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-1 py-8 px-4 md:px-8 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-foreground mb-4">No items in cart</h2>
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
      <main className="flex-1 py-8 px-4 md:px-8">
        <div className="container mx-auto">
          <h1 className="text-3xl font-bold text-foreground mb-8">Checkout</h1>
          <div className="grid md:grid-cols-2 gap-8">
            {/* Order Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {cart.map((item) => (
                  <div key={item.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <img
                        src={item.image_url}
                        alt={getName(item)}
                        className="w-16 h-16 object-cover rounded"
                      />
                      <div>
                        <p className="font-medium">{getName(item)}</p>
                        <p className="text-sm text-muted-foreground">
                          ${item.price.toFixed(2)} x {item.quantity}
                        </p>
                      </div>
                    </div>
                    <div className="font-bold">
                      ${(item.price * item.quantity).toFixed(2)}
                    </div>
                  </div>
                ))}
                <div className="border-t pt-4">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total:</span>
                    <span>${getTotalPrice().toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* CryptoCloud Widget */}
            <Card>
              <CardHeader>
                <CardTitle>CryptoCloud Payment</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div ref={widgetRef} className="w-full min-h-[400px] p-4 border rounded-md bg-muted/50">
                  Loading payment widget...
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}