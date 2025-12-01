import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { v4 as uuidv4 } from 'uuid'
import { useCart } from '@/contexts/CartContext'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/integrations/supabase/client'
import type { Database } from '@/integrations/supabase/types'
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

import { useLanguage } from '@/contexts/LanguageContext'

export default function Checkout() {
  const { cart, getTotalPrice } = useCart()
  const { user } = useAuth()
  const { lang } = useLanguage()
  const [orderId, setOrderId] = useState<number | null>(null)
  const navigate = useNavigate()
  const widgetRef = useRef<HTMLDivElement>(null)
  const total = getTotalPrice()

  const { toast } = useToast()

  const [orderReady, setOrderReady] = useState(false)
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [guestEmail, setGuestEmail] = useState('')
  const [emailSubmitted, setEmailSubmitted] = useState(false)
  const [guestUserId, setGuestUserId] = useState<string | null>(null)
  const [paymentError, setPaymentError] = useState(false)

  // Handle guest checkout email submission
  const handleGuestCheckout = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!guestEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guestEmail)) {
      toast({
        title: lang === 'ru' ? "Ошибка" : "Error",
        description: lang === 'ru' ? "Введите корректный email" : "Please enter a valid email",
        variant: "destructive"
      })
      return
    }

    setEmailSubmitted(true)
  }

  // Auto-redirect to payment URL
  useEffect(() => {
    if (paymentUrl) {
      const timer = setTimeout(() => {
        window.location.href = paymentUrl;
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [paymentUrl]);

  // Create pending order and payment
  useEffect(() => {
    if (cart.length > 0 && !orderId && (user || emailSubmitted)) {
      const createOrderAndPayment = async () => {
        try {
          setLoading(true)
          
          // If user is not logged in but email was submitted - create guest order
          if (!user && emailSubmitted && guestEmail) {
            const response = await supabase.functions.invoke('create-guest-order', {
              body: {
                email: guestEmail,
                cart: cart,
                total: total
              }
            })

            if (response.error) {
              throw new Error(response.error.message)
            }

            if (response.data?.success && response.data?.paymentUrl) {
              setOrderId(response.data.orderId)
              setGuestUserId(response.data.userId)
              setPaymentUrl(response.data.paymentUrl)
              setOrderReady(true)
              
              // Store guest order info in localStorage for later auto-login
              localStorage.setItem('pendingGuestOrder', JSON.stringify({
                orderId: response.data.orderId,
                userId: response.data.userId,
                email: guestEmail
              }))
              
              toast({
                title: lang === 'ru' ? "Аккаунт создан" : "Account Created",
                description: lang === 'ru' 
                  ? "После оплаты вы получите доступ к заказу" 
                  : "After payment you will get access to your order",
              })
            } else {
              throw new Error(response.data?.error || 'Failed to create guest order')
            }
            return
          }

          // Regular logged-in user flow
          if (user) {
            // Create order
            const { data, error } = await supabase
              .from('orders')
              .insert([{
                user_id: user?.id,
                status: 'pending',
                amount: total,
                order_details: cart as any
              }])
              .select('id')
              .single()

            if (error) {
              console.error('Error creating order:', error)
              toast({
                title: lang === 'ru' ? "Ошибка" : "Error",
                description: lang === 'ru' ? "Не удалось создать заказ. Попробуйте снова." : "Failed to create order. Please try again.",
                variant: "destructive"
              })
              return
            }

            setOrderId(data.id)

            // Create payment via edge function
            const session = await supabase.auth.getSession()
            const token = session.data.session?.access_token

            if (!token) {
              toast({
                title: lang === 'ru' ? "Ошибка" : "Error",
                description: lang === 'ru' ? "Требуется авторизация" : "Authentication required",
                variant: "destructive"
              })
              return
            }

            const response = await supabase.functions.invoke('create-payment', {
              body: {
                orderId: data.id,
                amount: total,
                currency: 'USD'
              }
            })

            if (response.error) {
              throw new Error(response.error.message)
            }

            if (response.data?.success && response.data?.paymentUrl) {
              setPaymentUrl(response.data.paymentUrl)
              setOrderReady(true)
            } else {
              throw new Error(response.data?.error || 'Failed to create payment')
            }
          }
        } catch (error) {
          console.error('Error:', error)
          toast({
            title: lang === 'ru' ? "Ошибка" : "Error",
            description: error instanceof Error ? error.message : (lang === 'ru' ? "Ошибка создания платежа" : "Failed to create payment"),
            variant: "destructive"
          })
        } finally {
          setLoading(false)
        }
      }

      createOrderAndPayment()
    }
  }, [user, cart, total, orderId, lang, emailSubmitted, guestEmail])

  const getName = (item: CartItem) => {
    if (lang === 'ru' && item.name_ru) return item.name_ru
    return item.name_en
  }

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main id="main-content" className="flex-1 py-8 px-4 md:px-8 flex items-center justify-center">
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
      <main id="main-content" className="flex-1 py-8 px-4 md:px-8">
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

            {/* Payment */}
            <Card>
              <CardHeader>
                <CardTitle>{lang === 'ru' ? 'Оплата' : 'Payment'}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {!user && !emailSubmitted && (
                  <form onSubmit={handleGuestCheckout} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">
                        {lang === 'ru' ? 'Email для создания аккаунта' : 'Email to create account'}
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder={lang === 'ru' ? 'ваш@email.com' : 'your@email.com'}
                        value={guestEmail}
                        onChange={(e) => setGuestEmail(e.target.value)}
                        required
                      />
                      <p className="text-xs text-muted-foreground">
                        {lang === 'ru' 
                          ? 'Мы создадим аккаунт и отправим ссылку для подтверждения' 
                          : 'We will create an account and send you a confirmation link'}
                      </p>
                    </div>
                    <Button type="submit" className="w-full" size="lg">
                      {lang === 'ru' ? 'Продолжить к оплате' : 'Continue to Payment'}
                    </Button>
                    <div className="text-center">
                      <Button 
                        type="button"
                        variant="link" 
                        onClick={() => navigate('/signin')}
                        className="text-sm"
                      >
                        {lang === 'ru' ? 'Уже есть аккаунт? Войти' : 'Already have an account? Sign in'}
                      </Button>
                    </div>
                  </form>
                )}
                {loading && (
                  <div className="w-full min-h-[200px] flex items-center justify-center">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                      <p className="text-muted-foreground">
                        {lang === 'ru' ? 'Создание платежа...' : 'Creating payment...'}
                      </p>
                    </div>
                  </div>
                )}
                {!loading && paymentUrl && (
                  <div className="bg-primary/10 p-4 rounded-lg text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-3"></div>
                    <p className="text-sm font-medium mb-2">
                      {lang === 'ru' ? '✅ Платеж создан' : '✅ Payment created'}
                    </p>
                    <p className="text-xs text-muted-foreground mb-3">
                      {lang === 'ru' 
                        ? 'Перенаправление на страницу оплаты...' 
                        : 'Redirecting to payment page...'}
                    </p>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => window.location.href = paymentUrl}
                    >
                      {lang === 'ru' ? 'Перейти к оплате' : 'Go to Payment'}
                    </Button>
                  </div>
                )}
                {!loading && !paymentUrl && (user || emailSubmitted) && !orderReady && (
                  <div className="text-center py-4">
                    <p className="text-sm text-muted-foreground mb-3">
                      {lang === 'ru' 
                        ? 'Не удалось создать платеж. Попробуйте снова.' 
                        : 'Failed to create payment. Please try again.'}
                    </p>
                    <Button 
                      onClick={() => {
                        setOrderId(null);
                        setPaymentUrl(null);
                        setOrderReady(false);
                        if (!user) {
                          setEmailSubmitted(false);
                        }
                      }}
                    >
                      {lang === 'ru' ? 'Попробовать снова' : 'Try Again'}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}