import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ProductImport {
  sku?: string;
  slug?: string;
  name_en: string;
  name_ru?: string;
  description_en?: string;
  description_ru?: string;
  price: number;
  old_price?: number;
  stock?: number;
  category?: string;
  category_id?: number;
  document_type?: string;
  country?: string;
  state?: string;
  tags?: string[];
  main_image_url?: string;
  gallery_urls?: unknown;
  preview_link?: string;
  file_url?: string;
  external_url?: string;
  digital_delivery_type?: 'storage' | 'external';
  digital_external_url?: string;
  digital_link_expires_in_hours?: number;
  digital_max_downloads?: number;
  status?: 'draft' | 'published' | 'archived';
  currency?: string;
  meta_title?: string;
  meta_description?: string;
  // TODO: Future tickets will implement:
  // - Automatic slug generation if not provided
  // - Category mapping from category string to category_id
  // - Image optimization and upload to storage
  // - Digital file handling and validation
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

    const batchSize = 50;
    const maxRetries = 3;

    for (let i = 0; i < validProducts.length; i += batchSize) {
      const batch = validProducts.slice(i, i + batchSize);
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

        } catch (error: unknown) {
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
              } catch (singleError: unknown) {
                result.failed++;
                const errorMessage = singleError instanceof Error ? singleError.message : 'Unknown error';
                result.errors.push({
                  product,
                  error: errorMessage,
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

  } catch (error: unknown) {
    console.error('Import error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        success: false 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
