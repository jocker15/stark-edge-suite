import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { ProductCard } from '@/components/products/ProductCard';
import { Skeleton } from '@/components/ui/skeleton';

interface Product {
  id: string;
  name_en: string | null;
  name_ru: string | null;
  description_en: string | null;
  description_ru: string | null;
  price: number;
  image_urls: string[];
  stock: number;
  category: string;
}

export default function SearchResults() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [lang] = useState<'en' | 'ru'>('en');

  useEffect(() => {
    async function searchProducts() {
      if (!query.trim()) {
        setProducts([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const searchPattern = `%${query}%`;
        
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .or(`name_en.ilike.${searchPattern},name_ru.ilike.${searchPattern},description_en.ilike.${searchPattern},description_ru.ilike.${searchPattern}`);

        if (error) throw error;
        setProducts(data || []);
      } catch (error) {
        console.error('Error searching products:', error);
      } finally {
        setLoading(false);
      }
    }

    searchProducts();
  }, [query]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 py-8 px-4 md:px-8">
        <div className="container mx-auto">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            {lang === 'ru' ? 'Результаты поиска' : 'Search Results'}
          </h1>
          {query && (
            <p className="text-muted-foreground mb-8">
              {lang === 'ru' ? `Поиск: "${query}"` : `Search: "${query}"`}
              {!loading && ` (${products.length} ${lang === 'ru' ? 'найдено' : 'found'})`}
            </p>
          )}
          
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-80 w-full" />
              ))}
            </div>
          ) : products.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} lang={lang} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-lg">
                {query 
                  ? (lang === 'ru' ? 'Ничего не найдено' : 'No products found')
                  : (lang === 'ru' ? 'Введите запрос для поиска' : 'Enter a search query')
                }
              </p>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
