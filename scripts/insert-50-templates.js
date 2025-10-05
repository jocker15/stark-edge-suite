import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://kpuqqqaqiwxbjpbmmcfz.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtwdXFxcWFxaXd4YmpwYm1tY2Z6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg5NzMyODUsImV4cCI6MjA3NDU0OTI4NX0.Rz_doNu-rxhq_-ixaTcSW_hZGeAhh4zWBqwfrmKErVc'

const supabase = createClient(supabaseUrl, supabaseKey)

const documentTypes = ['DL', 'passport', 'Billing', 'Bank statements', 'others']
const countries = [
  'Albania', 'Australia', 'Belarus', 'Bulgaria', 'Canada', 'Cyprus', 'Czech', 
  'Denmark', 'Dominicana', 'Egypt', 'France', 'Georgia', 'Germany', 'Hongkong', 
  'Hungary', 'India', 'Ireland', 'Japan', 'Korea', 'Kyrgyzthstan', 'Latvia', 
  'Lithuania', 'Malawi', 'Malaysia', 'Mexico', 'Nethherlands', 'New zealand', 
  'Oman', 'Pakistan', 'Peru', 'Poland', 'Romania', 'Rwanda', 'Serbia', 
  'Singapore', 'South-korea', 'Sri lanka', 'Taiwan', 'Thailand', 'Turkey', 
  'Uk', 'Usa', 'Venezuela', 'Vietnam'
]

async function insertTestProducts() {
  const products = []
  
  for (let i = 1; i <= 50; i++) {
    const docType = documentTypes[Math.floor(Math.random() * documentTypes.length)]
    const country = countries[Math.floor(Math.random() * countries.length)]
    const price = (Math.random() * 100 + 20).toFixed(2)
    
    products.push({
      name_en: `${country} ${docType} Template #${i}`,
      name_ru: `Шаблон ${docType} ${country} #${i}`,
      description_en: `High-quality ${docType} template for ${country}. Professional design, easy to customize, instant download available.`,
      description_ru: `Высококачественный шаблон ${docType} для ${country}. Профессиональный дизайн, легко настраивается, мгновенная загрузка.`,
      price: parseFloat(price),
      category: 'Digital Template',
      document_type: docType,
      country: country,
      image_urls: ['https://images.unsplash.com/photo-1554224311-beee460ae6fb?w=400'],
      stock: Math.floor(Math.random() * 100) + 10,
      meta_title: `${country} ${docType} Template - Digital Edge`,
      meta_description: `Professional ${docType} template for ${country}. High quality, instant download.`
    })
  }

  console.log(`Inserting ${products.length} products...`)
  
  const { data, error } = await supabase
    .from('products')
    .insert(products)
    .select()

  if (error) {
    console.error('Error inserting products:', error)
  } else {
    console.log(`Successfully inserted ${data.length} products!`)
  }
}

insertTestProducts().catch(console.error)
