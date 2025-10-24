import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CSVRow {
  num: string;
  country: string;
  state: string;
  document_type: string;
  file_name: string;
  price: string;
  link: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Читаем CSV файл из public папки (через fetch)
    const csvUrl = `${supabaseUrl.replace('.supabase.co', '')}/storage/v1/object/public/product-images/mega_full_report.csv`;
    
    // Альтернативно - используем прямой путь к файлу в проекте
    const csvContent = await fetch('https://kpuqqqaqiwxbjpbmmcfz.supabase.co/storage/v1/object/public/product-images/mega_full_report.csv')
      .then(res => {
        if (!res.ok) {
          // Если файл не в storage, читаем из локальной папки
          throw new Error('File not in storage, will use local file');
        }
        return res.text();
      })
      .catch(() => {
        // В production это не сработает, но оставим для локальной разработки
        console.log('Reading from local file system not available in production');
        return null;
      });

    if (!csvContent) {
      return new Response(
        JSON.stringify({ 
          error: 'CSV file not found. Please upload mega_full_report.csv to storage bucket first.' 
        }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Парсим CSV
    const lines = csvContent.split('\n');
    const products = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Убираем BOM если есть
      const cleanLine = line.replace(/^\uFEFF/, '');
      const parts = cleanLine.split(';');

      if (parts.length < 7) continue;

      const [num, country, state, document_type, file_name, price, link] = parts;

      if (!file_name || !country || !document_type) continue;

      products.push({
        name_en: file_name.trim(),
        name_ru: file_name.trim(),
        description_en: `${country.trim()} ${document_type.trim()}`,
        description_ru: `${country.trim()} ${document_type.trim()}`,
        price: parseFloat(price) || 25,
        stock: 1000,
        category: 'Digital Template',
        document_type: document_type.trim() || null,
        country: country.trim() || null,
        preview_link: link.trim() || null,
      });
    }

    if (products.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No valid products found in CSV' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Вставляем товары батчами по 100
    const batchSize = 100;
    let totalInserted = 0;

    for (let i = 0; i < products.length; i += batchSize) {
      const batch = products.slice(i, i + batchSize);
      const { error } = await supabase
        .from('products')
        .insert(batch);

      if (error) {
        console.error('Insert error:', error);
        throw error;
      }
      totalInserted += batch.length;
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Successfully imported ${totalInserted} products`,
        total: totalInserted 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error: any) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
