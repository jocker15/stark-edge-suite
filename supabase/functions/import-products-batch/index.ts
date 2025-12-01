import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ProductImport {
  sku?: string;
  name_en: string;
  name_ru?: string;
  description_en?: string;
  description_ru?: string;
  price: number;
  stock?: number;
  category?: string;
  document_type?: string;
  country?: string;
  state?: string;
  preview_link?: string;
  file_url?: string;
  external_url?: string;
  status?: string;
  currency?: string;
  meta_title?: string;
  meta_description?: string;
}

interface ImportRequest {
  products: ProductImport[];
  batchId?: string;
}

interface ImportResult {
  success: boolean;
  inserted: number;
  failed: number;
  errors: Array<{
    product: ProductImport;
    error: string;
  }>;
}

/**
 * Generates SEO fields from product data
 */
function generateSeoFields(product: ProductImport): {
  meta_title: string;
  meta_description: string;
} {
  const truncate = (text: string, maxLength: number): string => {
    if (!text || text.length <= maxLength) {
      return text || '';
    }
    let truncated = text.substring(0, maxLength);
    const lastSpace = truncated.lastIndexOf(' ');
    if (lastSpace > maxLength * 0.8) {
      truncated = truncated.substring(0, lastSpace);
    }
    truncated = truncated.replace(/[.,;:!?-]\s*$/, '');
    return truncated.trim() + (truncated.length < text.length ? '...' : '');
  };

  let meta_title = '';
  if (product.meta_title) {
    meta_title = product.meta_title;
  } else if (product.name_en) {
    meta_title = truncate(product.name_en, 60);
  } else if (product.name_ru) {
    meta_title = truncate(product.name_ru, 60);
  } else if (product.description_en) {
    meta_title = truncate(product.description_en, 60);
  } else if (product.description_ru) {
    meta_title = truncate(product.description_ru, 60);
  }

  let meta_description = '';
  if (product.meta_description) {
    meta_description = product.meta_description;
  } else if (product.description_en) {
    meta_description = truncate(product.description_en, 160);
  } else if (product.description_ru) {
    meta_description = truncate(product.description_ru, 160);
  } else if (product.name_en) {
    meta_description = truncate(product.name_en, 160);
  } else if (product.name_ru) {
    meta_description = truncate(product.name_ru, 160);
  }

  return { meta_title, meta_description };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify admin role
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user is admin
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (profileError || profile?.role !== 'admin') {
      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const { products, batchId }: ImportRequest = await req.json();

    if (!products || !Array.isArray(products) || products.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No products provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const result: ImportResult = {
      success: true,
      inserted: 0,
      failed: 0,
      errors: [],
    };

    // Check for duplicate SKUs in database
    const skus = products.map(p => p.sku).filter(Boolean);
    if (skus.length > 0) {
      const { data: existingProducts } = await supabase
        .from('products')
        .select('sku')
        .in('sku', skus);

      const existingSkus = new Set(existingProducts?.map(p => p.sku) || []);
      
      // Filter out products with existing SKUs
      products.forEach(product => {
        if (product.sku && existingSkus.has(product.sku)) {
          result.failed++;
          result.errors.push({
            product,
            error: `SKU ${product.sku} already exists`,
          });
        }
      });
    }

    // Process products in smaller batches with retries
    const validProducts = products.filter(p => 
      !p.sku || !result.errors.some(e => e.product.sku === p.sku)
    );

    // Apply SEO auto-generation for all products
    const productsWithSeo = validProducts.map(product => {
      const seo = generateSeoFields(product);
      return {
        ...product,
        meta_title: product.meta_title || seo.meta_title,
        meta_description: product.meta_description || seo.meta_description,
      };
    });

    const batchSize = 50;
    const maxRetries = 3;

    for (let i = 0; i < productsWithSeo.length; i += batchSize) {
      const batch = productsWithSeo.slice(i, i + batchSize);
      let retries = 0;
      let success = false;

      while (retries < maxRetries && !success) {
        try {
          const { data, error } = await supabase
            .from('products')
            .insert(batch)
            .select();

          if (error) {
            throw error;
          }

          result.inserted += batch.length;
          success = true;

          // Log successful batch
          console.log(`Batch ${Math.floor(i / batchSize) + 1}: Inserted ${batch.length} products`);

        } catch (error: any) {
          retries++;
          console.error(`Batch ${Math.floor(i / batchSize) + 1} attempt ${retries} failed:`, error);

          if (retries >= maxRetries) {
            // If all retries failed, try inserting one by one
            for (const product of batch) {
              try {
                const { error: singleError } = await supabase
                  .from('products')
                  .insert([product]);

                if (singleError) {
                  result.failed++;
                  result.errors.push({
                    product,
                    error: singleError.message,
                  });
                } else {
                  result.inserted++;
                }
              } catch (singleError: any) {
                result.failed++;
                result.errors.push({
                  product,
                  error: singleError.message,
                });
              }
            }
            success = true; // Exit retry loop
          } else {
            // Wait before retrying
            await new Promise(resolve => setTimeout(resolve, 1000 * retries));
          }
        }
      }
    }

    result.success = result.failed === 0;

    return new Response(
      JSON.stringify(result),
      { 
        status: result.success ? 200 : 207, // 207 Multi-Status for partial success
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error: any) {
    console.error('Import error:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Internal server error',
        success: false 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
