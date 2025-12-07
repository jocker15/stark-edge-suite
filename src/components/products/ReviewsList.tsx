import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Star } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ru, enUS } from 'date-fns/locale'
import { useLanguage } from '@/contexts/LanguageContext'

interface Review {
  id: string
  rating: number
  comment: string | null
  created_at: string
  user_id: string
  status: string
  reply_text: string | null
  reply_at: string | null
}

interface ReviewsListProps {
  productId: number
}

export function ReviewsList({ productId }: ReviewsListProps) {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [averageRating, setAverageRating] = useState(0)
  const [revealedCards, setRevealedCards] = useState<boolean[]>([])
  const { lang } = useLanguage()
  const cardRefs = useRef<(HTMLDivElement | null)[]>([])

  useEffect(() => {
    loadReviews()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId])

  useEffect(() => {
    const observers = cardRefs.current.map((card, index) => {
      if (!card) return null

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setTimeout(() => {
              setRevealedCards((prev) => {
                const newRevealed = [...prev]
                newRevealed[index] = true
                return newRevealed
              })
            }, index * 100)
            observer.unobserve(card)
          }
        },
        { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
      )

      observer.observe(card)
      return observer
    })

    return () => {
      observers.forEach((observer) => {
        if (observer) observer.disconnect()
      })
    }
  }, [reviews])

  async function loadReviews() {
    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .eq('product_id', productId)
      .eq('status', 'approved')
      .order('created_at', { ascending: false })

    if (!error && data) {
      setReviews(data)
      if (data.length > 0) {
        const avg = data.reduce((sum, review) => sum + review.rating, 0) / data.length
        setAverageRating(Math.round(avg * 10) / 10)
      }
    }
    setLoading(false)
  }

  if (loading) {
    return <div className="text-muted-foreground">
      {lang === 'ru' ? 'Загрузка отзывов...' : 'Loading reviews...'}
    </div>
  }

  return (
    <div className="space-y-4">
      {reviews.length > 0 && (
        <div className="flex items-center gap-2 mb-6">
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`h-5 w-5 ${
                  star <= Math.round(averageRating)
                    ? 'fill-primary text-primary'
                    : 'text-muted-foreground'
                }`}
              />
            ))}
          </div>
          <span className="text-lg font-semibold">{averageRating}</span>
          <span className="text-muted-foreground">
            ({reviews.length} {lang === 'ru' ? 'отзывов' : 'reviews'})
          </span>
        </div>
      )}

      {reviews.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            {lang === 'ru' ? 'Пока нет отзывов. Будьте первым!' : 'No reviews yet. Be the first!'}
          </CardContent>
        </Card>
      ) : (
        reviews.map((review, index) => (
          <div
            key={review.id}
            ref={(el) => (cardRefs.current[index] = el)}
            className={`transition-all duration-700 ${
              revealedCards[index] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
            }`}
            style={{ transitionDelay: `${index * 50}ms` }}
          >
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback>U</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-1 mb-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`h-4 w-4 ${
                              star <= review.rating
                                ? 'fill-primary text-primary'
                                : 'text-muted-foreground'
                            }`}
                          />
                        ))}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(review.created_at), {
                          addSuffix: true,
                          locale: lang === 'ru' ? ru : enUS,
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {review.comment && (
                  <p className="text-foreground">{review.comment}</p>
                )}
                {review.reply_text && (
                  <div className="mt-4 pl-4 border-l-2 border-primary/50 bg-muted/50 p-3 rounded">
                    <p className="text-sm font-semibold text-primary mb-1">
                      {lang === 'ru' ? 'Ответ магазина' : 'Store Reply'}
                    </p>
                    <p className="text-sm text-foreground whitespace-pre-wrap">{review.reply_text}</p>
                    {review.reply_at && (
                      <p className="text-xs text-muted-foreground mt-2">
                        {formatDistanceToNow(new Date(review.reply_at), {
                          addSuffix: true,
                          locale: lang === 'ru' ? ru : enUS,
                        })}
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        ))
      )}
    </div>
  )
}
