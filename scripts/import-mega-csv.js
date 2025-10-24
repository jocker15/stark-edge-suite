import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const SUPABASE_URL = "https://kpuqqqaqiwxbjpbmmcfz.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtwdXFxcWFxaXd4YmpwYm1tY2Z6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg5NzMyODUsImV4cCI6MjA3NDU0OTI4NX0.Rz_doNu-rxhq_-ixaTcSW_hZGeAhh4zWBqwfrmKErVc";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function importMegaCSV() {
  try {
    console.log('📖 Reading CSV file...');
    const csvContent = readFileSync('./public/mega_full_report.csv', 'utf-8');
    
    console.log('🔍 Parsing CSV...');
    // Remove BOM and split by lines
    const lines = csvContent.replace(/^\uFEFF/, '').split('\n');
    const headers = lines[0].split(';').map(h => h.trim());
    
    console.log('Headers:', headers);
    
    const products = [];
    let skipped = 0;

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const values = line.split(';').map(v => v.trim());
      
      const country = values[1];
      const docType = values[3];
      const fileName = values[4];
      const priceStr = values[5];
      const link = values[6];

      // Skip invalid rows
      if (!country || !docType || !fileName) {
        skipped++;
        continue;
      }

      const price = parseFloat(priceStr) || 25;

      products.push({
        name_en: fileName,
        name_ru: fileName,
        description_en: `${country} ${docType}`,
        description_ru: `${country} ${docType}`,
        price: price,
        stock: 1000,
        category: 'Digital Template',
        document_type: docType,
        country: country,
        preview_link: link || null,
      });
    }

    console.log(`✅ Prepared ${products.length} products (skipped ${skipped} invalid rows)`);

    if (products.length === 0) {
      console.log('❌ No valid products to import');
      return;
    }

    // Insert in batches
    const batchSize = 100;
    let totalInserted = 0;

    for (let i = 0; i < products.length; i += batchSize) {
      const batch = products.slice(i, i + batchSize);
      console.log(`📤 Inserting batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(products.length / batchSize)}...`);
      
      const { data, error } = await supabase
        .from('products')
        .insert(batch);

      if (error) {
        console.error('❌ Error inserting batch:', error);
        console.error('First product in failed batch:', batch[0]);
        throw error;
      }

      totalInserted += batch.length;
      console.log(`   ✓ Inserted ${totalInserted}/${products.length} products`);
    }

    console.log(`\n🎉 Successfully imported ${totalInserted} products!`);
    console.log(`   Skipped: ${skipped} invalid rows`);

  } catch (error) {
    console.error('❌ Import failed:', error);
    process.exit(1);
  }
}

importMegaCSV();
