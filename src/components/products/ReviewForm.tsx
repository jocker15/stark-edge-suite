import { useState } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Star } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useLanguage } from '@/contexts/LanguageContext'

interface ReviewFormProps {
  productId: number
  onReviewSubmitted: () => void
}

export function ReviewForm({ productId, onReviewSubmitted }: ReviewFormProps) {
  const [rating, setRating] = useState(0)
  const [hoveredRating, setHoveredRating] = useState(0)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const { toast } = useToast()
  const { lang } = useLanguage()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    if (rating === 0) {
      toast({
        title: lang === 'ru' ? 'Ошибка' : 'Error',
        description: lang === 'ru' ? 'Пожалуйста, поставьте оценку' : 'Please provide a rating',
        variant: 'destructive',
      })
      return
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      toast({
        title: lang === 'ru' ? 'Требуется авторизация' : 'Authorization Required',
        description: lang === 'ru' ? 'Войдите, чтобы оставить отзыв' : 'Sign in to leave a review',
        variant: 'destructive',
      })
      return
    }

    setSubmitting(true)

    const { error } = await supabase
      .from('reviews')
      .insert({
        product_id: productId,
        user_id: user.id,
        rating,
        comment: comment.trim() || null,
        status: 'pending',
      });

    setSubmitting(false);

    if (error) {
      if (error.code === '23505') {
        toast({
          title: lang === 'ru' ? 'Ошибка' : 'Error',
          description: lang === 'ru' ? 'Вы уже оставили отзыв на этот товар' : 'You have already reviewed this product',
          variant: 'destructive',
        });
      } else {
        toast({
          title: lang === 'ru' ? 'Ошибка' : 'Error',
          description: lang === 'ru' ? 'Не удалось отправить отзыв' : 'Failed to submit review',
          variant: 'destructive',
        });
      }
    } else {
      toast({
        title: lang === 'ru' ? 'Успешно' : 'Success',
        description: lang === 'ru' ? 'Ваш отзыв отправлен на модерацию' : 'Your review has been submitted for moderation',
      });
      setRating(0);
      setComment('');
      onReviewSubmitted();
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{lang === 'ru' ? 'Оставить отзыв' : 'Leave a Review'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              {lang === 'ru' ? 'Ваша оценка' : 'Your Rating'}
            </label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    className={`h-8 w-8 ${
                      star <= (hoveredRating || rating)
                        ? 'fill-primary text-primary'
                        : 'text-muted-foreground'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              {lang === 'ru' ? 'Комментарий (необязательно)' : 'Comment (optional)'}
            </label>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={lang === 'ru' ? 'Расскажите о вашем опыте использования товара...' : 'Tell us about your experience with the product...'}
              rows={4}
              maxLength={1000}
            />
          </div>

          <Button type="submit" disabled={submitting || rating === 0}>
            {submitting 
              ? (lang === 'ru' ? 'Отправка...' : 'Submitting...') 
              : (lang === 'ru' ? 'Отправить отзыв' : 'Submit Review')
            }
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
