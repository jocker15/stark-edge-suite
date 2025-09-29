import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://kpuqqqaqiwxbjpbmmcfz.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtwdXFxcWFxaXd4YmpwYm1tY2Z6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg5NzMyODUsImV4cCI6MjA3NDU0OTI4NX0.Rz_doNu-rxhq_-ixaTcSW_hZGeAhh4zWBqwfrmKErVc';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function insertTestProducts() {
  const products = [
    {
      name_en: 'Epic Steam Account - Level 250',
      name_ru: 'Эпический аккаунт Steam - 250 уровень',
      description_en: 'An account with over 500 games, rare badges, and a high trust factor. Ready for competitive play.',
      description_ru: 'Аккаунт с более чем 500 играми, редкими значками и высоким фактором доверия. Готов для соревновательной игры.',
      price: 199.99,
      category: 'Game Account',
      image_urls: [
        "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400&h=400&fit=crop",
        "https://images.unsplash.com/photo-1570549717069-33bed2ebafec?w=400&h=400&fit=crop",
        "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400&h=400&fit=crop"
      ],
      preview_link: 'https://store.steampowered.com/',
      stock: 10
    },
    {
      name_en: 'Stacked Valorant Account - Immortal Rank',
      name_ru: null,
      description_en: 'This account has achieved Immortal rank and comes with multiple exclusive weapon skins, including the Elderflame Vandal.',
      description_ru: 'Этот аккаунт достиг ранга "Бессмертный" и поставляется с несколькими эксклюзивными скинами на оружие, включая "Дракон-Вандал".',
      price: 149.50,
      category: 'Game Account',
      image_urls: [
        "https://images.unsplash.com/photo-1614648714327-5e3b6e7e7e7e?w=400&h=400&fit=crop",
        "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=400&fit=crop"
      ],
      preview_link: 'https://playvalorant.com/',
      stock: 5
    },
    {
      name_en: 'Genshin Impact AR 60 Whale Account',
      name_ru: 'Китовский аккаунт Genshin Impact AR 60',
      description_en: 'Adventurer Rank 60 account with almost all 5-star characters and their signature weapons. C6 on multiple key characters.',
      description_ru: null,
      price: 499.00,
      category: 'Game Account',
      image_urls: [
        "https://images.unsplash.com/photo-1624568538926-5b5a7e7e7e7e?w=400&h=400&fit=crop",
        "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400&h=400&fit=crop",
        "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400&h=400&fit=crop"
      ],
      preview_link: 'https://genshin.hoyoverse.com/',
      stock: 1
    }
  ];

  console.log('Inserting test products...');
  for (const product of products) {
    const { data, error } = await supabase
      .from('products')
      .insert([product])
      .select();
    if (error) {
      console.error('Error inserting product:', product.name_en, error);
    } else {
      console.log('Inserted successfully:', data[0].id);
    }
  }
  console.log('Test products insertion completed.');
}

insertTestProducts().catch(console.error);