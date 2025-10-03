import { useState } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Star } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    if (rating === 0) {
      toast({
        title: 'Ошибка',
        description: 'Пожалуйста, поставьте оценку',
        variant: 'destructive',
      })
      return
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      toast({
        title: 'Требуется авторизация',
        description: 'Войдите, чтобы оставить отзыв',
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
          title: 'Ошибка',
          description: 'Вы уже оставили отзыв на этот товар',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Ошибка',
          description: 'Не удалось отправить отзыв',
          variant: 'destructive',
        });
      }
    } else {
      toast({
        title: 'Успешно',
        description: 'Ваш отзыв отправлен на модерацию',
      });
      setRating(0);
      setComment('');
      onReviewSubmitted();
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Оставить отзыв</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Ваша оценка</label>
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
              Комментарий (необязательно)
            </label>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Расскажите о вашем опыте использования товара..."
              rows={4}
              maxLength={1000}
            />
          </div>

          <Button type="submit" disabled={submitting || rating === 0}>
            {submitting ? 'Отправка...' : 'Отправить отзыв'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
