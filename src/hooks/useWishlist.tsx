import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'

export function useWishlist() {
  const [wishlist, setWishlist] = useState<number[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    loadWishlist()
  }, [])

  async function loadWishlist() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setLoading(false)
      return
    }

    const { data, error } = await supabase
      .from('wishlist')
      .select('product_id')
      .eq('user_id', user.id)

    if (!error && data) {
      setWishlist(data.map(item => item.product_id))
    }
    setLoading(false)
  }

  async function addToWishlist(productId: number) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      toast({
        title: 'Требуется авторизация',
        description: 'Войдите, чтобы добавить товар в избранное',
        variant: 'destructive',
      })
      return
    }

    const { error } = await supabase
      .from('wishlist')
      .insert({ product_id: productId, user_id: user.id })

    if (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось добавить в избранное',
        variant: 'destructive',
      })
    } else {
      setWishlist([...wishlist, productId])
      toast({
        title: 'Добавлено в избранное',
        description: 'Товар добавлен в ваш список желаемого',
      })
    }
  }

  async function removeFromWishlist(productId: number) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase
      .from('wishlist')
      .delete()
      .eq('product_id', productId)
      .eq('user_id', user.id)

    if (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось удалить из избранного',
        variant: 'destructive',
      })
    } else {
      setWishlist(wishlist.filter(id => id !== productId))
      toast({
        title: 'Удалено из избранного',
        description: 'Товар удален из списка желаемого',
      })
    }
  }

  function isInWishlist(productId: number) {
    return wishlist.includes(productId)
  }

  return {
    wishlist,
    loading,
    addToWishlist,
    removeFromWishlist,
    isInWishlist,
  }
}
