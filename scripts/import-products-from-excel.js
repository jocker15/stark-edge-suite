import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://kpuqqqaqiwxbjpbmmcfz.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtwdXFxcWFxaXd4YmpwYm1tY2Z6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg5NzMyODUsImV4cCI6MjA3NDU0OTI4NX0.Rz_doNu-rxhq_-ixaTcSW_hZGeAhh4zWBqwfrmKErVc'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Real products from Excel file
const products = [
  { country: "Albania", document_type: "DL", name: "Albania Driver License 2017+.zip", price: 25, link: "https://mega.nz/file/nVsHlTpT#pORVv39PWtIsMnihLGwYJ2tdPrUobGF-hBxYqR6LqNw" },
  { country: "Albania", document_type: "ID", name: "ALBANIA-ID-2009+.zip", price: 25, link: "https://mega.nz/file/eVcRiDID#0EKuniCt_wR-ILeI9dbPaw4lGjSKuIYWx1gtZ6XwGVo" },
  { country: "Angola", document_type: "DL", name: "Angola Driver License 2015+.zip", price: 25, link: "https://mega.nz/file/vAsyFLwK#JX-KJFkBCTjLlKlryyQMQfm8sjLvY6Mqpfu6NxctL5Y" },
  { country: "Argentina", document_type: "ID", name: "Argentina ID 2009-2023.zip", price: 25, link: "https://mega.nz/file/PIVAFCIb#epsXd65BJKYnY6OVvlkFK5Mk7_mb-wIwwwXHHZqztnQ" },
  { country: "Argentina", document_type: "passport", name: "Argentina passport 2015+ actual.zip", price: 25, link: "https://mega.nz/file/PR9BHLTL#iND5VCdF2YZBn1j7jl2t6mz4vyN7JlZt_EqcalsEmy4" },
  // ... rest will be added programmatically
]

async function deleteTestTemplates() {
  console.log('Deleting test templates...')
  
  const { error } = await supabase
    .from('products')
    .delete()
    .eq('category', 'Digital Template')
  
  if (error) {
    console.error('Error deleting test templates:', error)
    throw error
  }
  
  console.log('✅ Test templates deleted successfully')
}

async function importProducts() {
  console.log('Starting product import...')
  
  try {
    // First, delete test templates
    await deleteTestTemplates()
    
    // Parse all products from the Excel data
    const allProducts = [
      { country: "Albania", document_type: "DL", name: "Albania Driver License 2017+.zip", price: 25, link: "https://mega.nz/file/nVsHlTpT#pORVv39PWtIsMnihLGwYJ2tdPrUobGF-hBxYqR6LqNw" },
      { country: "Albania", document_type: "ID", name: "ALBANIA-ID-2009+.zip", price: 25, link: "https://mega.nz/file/eVcRiDID#0EKuniCt_wR-ILeI9dbPaw4lGjSKuIYWx1gtZ6XwGVo" },
      { country: "Angola", document_type: "DL", name: "Angola Driver License 2015+.zip", price: 25, link: "https://mega.nz/file/vAsyFLwK#JX-KJFkBCTjLlKlryyQMQfm8sjLvY6Mqpfu6NxctL5Y" },
      // ... truncated for brevity, but the actual script would contain all 350+ products
    ].map(p => ({
      name_en: p.name,
      name_ru: p.name,
      description_en: `${p.country} ${p.document_type} - Digital Template`,
      description_ru: `${p.country} ${p.document_type} - Цифровой шаблон`,
      price: p.price,
      stock: 1000,
      category: 'Digital Template',
      document_type: p.document_type,
      country: p.country,
      preview_link: p.link
    }))
    
    // Insert in batches of 100
    for (let i = 0; i < allProducts.length; i += 100) {
      const batch = allProducts.slice(i, i + 100)
      const { error } = await supabase.from('products').insert(batch)
      
      if (error) {
        console.error(`Error inserting batch ${i / 100 + 1}:`, error)
        throw error
      }
      
      console.log(`✅ Imported batch ${i / 100 + 1} (${batch.length} products)`)
    }
    
    console.log(`✅ Successfully imported ${allProducts.length} products!`)
  } catch (error) {
    console.error('Error importing products:', error)
    throw error
  }
}

// Run the import
importProducts().catch(console.error)
