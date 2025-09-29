import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface CartItem {
  id: string;
  quantity: number;
  price: number;
  name_en: string;
  name_ru: string | null;
  image_url: string;
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (product: {
    id: string | number;
    price: number;
    name_en: string;
    name_ru: string | null;
    image_urls: string[];
    stock: number;
  }, quantity?: number) => void;
  removeFromCart: (id: string | number) => void;
  updateQuantity: (id: string | number, quantity: number) => void;
  clearCart: () => void;
  getTotalPrice: () => number;
  getItemCount: () => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
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
    id: string | number;
    price: number;
    name_en: string;
    name_ru: string | null;
    image_urls: string[];
    stock: number;
  }, quantity: number = 1) => {
    const productId = String(product.id);
    if (product.stock < quantity) {
      alert('Недостаточно товара на складе');
      return;
    }

    setCart(prev => {
      const existing = prev.find(item => item.id === productId);
      if (existing) {
        return prev.map(item =>
          item.id === productId
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [
        ...prev,
        {
          id: productId,
          quantity,
          price: product.price,
          name_en: product.name_en,
          name_ru: product.name_ru,
          image_url: product.image_urls[0] || '/placeholder.svg'
        }
      ];
    });
  };

  const removeFromCart = (id: string | number) => {
    const productId = String(id);
    setCart(prev => prev.filter(item => item.id !== productId));
  };

  const updateQuantity = (id: string | number, quantity: number) => {
    const productId = String(id);
    if (quantity <= 0) {
      removeFromCart(id);
      return;
    }
    setCart(prev =>
      prev.map(item =>
        item.id === productId ? { ...item, quantity } : item
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

  return (
    <CartContext.Provider value={{
      cart,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      getTotalPrice,
      getItemCount
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}