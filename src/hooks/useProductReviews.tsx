import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'

interface ReviewStats {
  averageRating: number
  totalReviews: number
}

export function useProductReviews(productId: number) {
  const [stats, setStats] = useState<ReviewStats>({ averageRating: 0, totalReviews: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchReviewStats() {
      const { data, error } = await supabase
        .from('reviews')
        .select('rating')
        .eq('product_id', productId)

      if (!error && data && data.length > 0) {
        const avg = data.reduce((sum, review) => sum + review.rating, 0) / data.length
        setStats({
          averageRating: Math.round(avg * 10) / 10,
          totalReviews: data.length
        })
      }
      setLoading(false)
    }

    fetchReviewStats()
  }, [productId])

  return { ...stats, loading }
}
