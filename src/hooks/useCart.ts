import { useState, useEffect } from 'react';

interface CartItem {
  id: string;
  quantity: number;
  price: number;
  name_en: string;
  name_ru: string | null;
  image_url: string;
}

export function useCart() {
  const [cart, setCart] = useState<CartItem[]>([]);

  useEffect(() => {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

  const addToCart = (product: {
    id: string;
    price: number;
    name_en: string;
    name_ru: string | null;
    image_urls: string[];
    stock: number;
  }, quantity: number = 1) => {
    if (product.stock < quantity) {
      alert('Недостаточно товара на складе');
      return;
    }

    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [
        ...prev,
        {
          id: product.id,
          quantity,
          price: product.price,
          name_en: product.name_en,
          name_ru: product.name_ru,
          image_url: product.image_urls[0] || '/placeholder.svg'
        }
      ];
    });
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(id);
      return;
    }
    setCart(prev =>
      prev.map(item =>
        item.id === id ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  const getItemCount = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  return {
    cart,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getTotalPrice,
    getItemCount
  };
}