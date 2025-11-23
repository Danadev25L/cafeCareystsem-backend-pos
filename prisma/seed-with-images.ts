import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌟 Starting enhanced database seeding with images...');

  // Clear existing data for fresh seed
  console.log('🧹 Clearing existing data...');
  await prisma.menuItem.deleteMany();
  await prisma.menuCategory.deleteMany();
  await prisma.user.deleteMany();
  await prisma.table.deleteMany();
  console.log('✅ Cleared existing data');

  // Create users with different roles
  console.log('👥 Creating users...');
  const users = [
    {
      email: 'admin@cafecare.com',
      password: 'admin123',
      name: 'Admin User',
      role: 'ADMIN' as const,
    },
    {
      email: 'captain@cafecare.com',
      password: 'captain123',
      name: 'Captain User',
      role: 'CAPTAIN' as const,
    },
    {
      email: 'barista@cafecare.com',
      password: 'barista123',
      name: 'Barista User',
      role: 'CASHIER' as const,
    },
    {
      email: 'cashier1@cafecare.com',
      password: 'cashier123',
      name: 'Sarah Johnson',
      role: 'CASHIER' as const,
    },
    {
      email: 'cashier2@cafecare.com',
      password: 'cashier123',
      name: 'Mike Wilson',
      role: 'CASHIER' as const,
    },
    {
      email: 'captain1@cafecare.com',
      password: 'captain123',
      name: 'John Davis',
      role: 'CAPTAIN' as const,
    },
  ];

  // Hash passwords and create users
  for (const userData of users) {
    const hashedPassword = await bcrypt.hash(userData.password, 12);

    const user = await prisma.user.create({
      data: {
        ...userData,
        password: hashedPassword,
      },
    });

    console.log(`👤 Created user: ${user.email} (${user.role})`);
  }

  // Create restaurant tables
  console.log('🪑 Creating restaurant tables...');
  const tables = [
    { number: 1, name: 'Window Corner', description: 'Cozy corner with window view for up to 4 guests' },
    { number: 2, name: 'Garden View', description: 'Intimate table for 2 with garden scenery' },
    { number: 3, name: 'Central Square', description: 'Large communal table perfect for groups of 6' },
    { number: 4, name: 'Quiet Zone', description: 'Peaceful area for up to 4 guests' },
    { number: 5, name: 'Bar Seating', description: 'High-top bar seats for 2' },
    { number: 6, name: 'Family Table', description: 'Spacious table for large families up to 8' },
    { number: 7, name: 'Business Corner', description: 'Professional setting for business meetings up to 4' },
    { number: 8, name: 'Date Night', description: 'Romantic table for 2' },
    { number: 9, name: 'Group Gathering', description: 'Large table for parties up to 10' },
    { number: 10, name: 'Solo Spot', description: 'Perfect for individuals working or dining alone' },
  ];

  for (const tableData of tables) {
    const table = await prisma.table.create({
      data: tableData,
    });
    console.log(`🪑 Created table: ${table.number} - ${table.name}`);
  }

  console.log('☕ Creating menu categories with images...');

  // Create menu categories with items (using multilingual fields and working images)
  const menuCategories = [
    {
      titleEn: 'Coffee & Espresso',
      titleKu: 'قهوه و ئیسپرێسۆ',
      titleAr: 'قهوة وإسبريسو',
      description: 'Premium coffee selections from around the world',
      menuItems: [
        {
          nameEn: 'Classic Espresso',
          nameKu: 'ئیسپرێسۆی کلاسیک',
          nameAr: 'إسبريسو كلاسيكي',
          descriptionEn: 'Rich, bold espresso shot from premium beans',
          descriptionKu: 'ئیسپرێسۆی دڵڕەش و بەهێز لە بۆنکی بەرزەوە',
          descriptionAr: 'جرعة إسبريسو غنية وقوية من حبوب عالية الجودة',
          price: 2.50,
          image: 'https://images.unsplash.com/photo-1541167760496-1628856ab772?w=400&h=400&fit=crop&crop=center'
        },
        {
          nameEn: 'Cappuccino',
          nameKu: 'کاپوچینۆ',
          nameAr: 'كابتشينو',
          descriptionEn: 'Espresso with steamed milk and perfect foam',
          descriptionKu: 'ئیسپرێسۆ لەگەڵ شیرەوەرم و کەفی تەواو',
          descriptionAr: 'إسبريسو مع الحليب المطهي ورغوة مثالية',
          price: 3.50,
          image: 'https://images.unsplash.com/photo-1572442388796-11668a67453a?w=400&h=400&fit=crop&crop=center'
        },
        {
          nameEn: 'Caffè Latte',
          nameKu: 'کافه لاتێ',
          nameAr: 'كافيه لاتيه',
          descriptionEn: 'Smooth espresso with steamed milk',
          descriptionKu: 'ئیسپرێسۆی نەرم لەگەڵ شیری گەرم',
          descriptionAr: 'إسبريسو ناعم مع الحليب المطهي',
          price: 4.00,
          image: 'https://images.unsplash.com/photo-1549090357-86e0a4a84603?w=400&h=400&fit=crop&crop=center'
        },
        {
          nameEn: 'Caramel Macchiato',
          nameKu: 'کارامێل ماکیاتۆ',
          nameAr: 'ماكياتو بالكراميل',
          descriptionEn: 'Espresso with vanilla, steamed milk and caramel drizzle',
          descriptionKu: 'ئیسپرێسۆ لەگەڵ فانیلا، شیر و کارامێل',
          descriptionAr: 'إسبريسو مع الفانيليا والحليب وكراميل',
          price: 4.50,
          image: 'https://images.unsplash.com/photo-1534793253634-9048b16dfba3?w=400&h=400&fit=crop&crop=center'
        },
        {
          nameEn: 'Americano',
          nameKu: 'ئەمەریکانۆ',
          nameAr: 'أمريكانو',
          descriptionEn: 'Espresso with hot water for a smooth, rich flavor',
          descriptionKu: 'ئیسپرێسۆ لەگەڵ ئاوی گەرم بۆ تامێکی نەرم و دڵڕەش',
          descriptionAr: 'إسبريسو مع الماء الساخن لنكهة ناعمة وغنية',
          price: 3.00,
          image: 'https://images.unsplash.com/photo-1494314671902-345aa3f4bdbd?w=400&h=400&fit=crop&crop=center'
        },
        {
          nameEn: 'Mocha',
          nameKu: 'مۆکا',
          nameAr: 'موكا',
          descriptionEn: 'Espresso with chocolate and steamed milk',
          descriptionKu: 'ئیسپرێسۆ لەگەڵ چۆکلێت و شیری گەرم',
          descriptionAr: 'إسبريسو مع الشوكولاتة والحليب المطهي',
          price: 4.25,
          image: 'https://images.unsplash.com/photo-1564890369478-c89ca6d9cda9?w=400&h=400&fit=crop&crop=center'
        }
      ]
    },
    {
      titleEn: 'Tea & Infusions',
      titleKu: 'چای و مژە',
      titleAr: 'شاي والمشروبات',
      description: 'Fine teas and herbal infusions',
      menuItems: [
        {
          nameEn: 'Earl Grey Tea',
          nameKu: 'چای ئێرل گرێی',
          nameAr: 'شاي إيرل جراي',
          descriptionEn: 'Black tea with bergamot citrus flavor',
          descriptionKu: 'چای ڕەش لەگەڵ تامە cétrus بێرگامۆت',
          descriptionAr: 'شاي أسود بنكهة البرغاموت الحمضية',
          price: 2.75,
          image: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=400&h=400&fit=crop&crop=center'
        },
        {
          nameEn: 'Green Tea',
          nameKu: 'چای سەوز',
          nameAr: 'شاي أخضر',
          descriptionEn: 'Fresh Japanese green tea leaves',
          descriptionKu: 'گەڵای چای سەوزی ژاپۆنی تازە',
          descriptionAr: 'أوراق الشاي الأخضر اليابانية الطازجة',
          price: 2.50,
          image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=400&fit=crop&crop=center'
        },
        {
          nameEn: 'Chamomile Tea',
          nameKu: 'چای بابونج',
          nameAr: 'شاي البابونج',
          descriptionEn: 'Calming herbal tea with honey notes',
          descriptionKu: 'چای گیایی ئارامکەرەوە لەگەڵ تامەی عەسل',
          descriptionAr: 'شاي عشبي مهدئ بنكهات العسل',
          price: 3.00,
          image: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=400&h=400&fit=crop&crop=center'
        },
        {
          nameEn: 'Peppermint Tea',
          nameKu: 'چای نەعنا',
          nameAr: 'شاي النعناع',
          descriptionEn: 'Refreshing peppermint infusion',
          descriptionKu: 'مژەی نەعنای تازەگەر',
          descriptionAr: 'مشروب النعناع المنعش',
          price: 2.75,
          image: 'https://images.unsplash.com/photo-1584936982226-eead6155a2ae?w=400&h=400&fit=crop&crop=center'
        }
      ]
    },
    {
      titleEn: 'Fresh Pastries',
      titleKu: 'شیرینی تازە',
      titleAr: 'معجنات طازجة',
      description: 'Freshly baked pastries and sweets',
      menuItems: [
        {
          nameEn: 'Butter Croissant',
          nameKu: 'کرواسانی کەرە',
          nameAr: 'كرواسان بالزبدة',
          descriptionEn: 'Flaky French pastry with rich butter',
          descriptionKu: 'شیرینی فەرەنسی هەوایی بە کەری دڵڕەش',
          descriptionAr: 'معجنات فرنسية متفتتة بالزبدة الغنية',
          price: 3.50,
          image: 'https://images.unsplash.com/photo-1555507031-abd07f98321e?w=400&h=400&fit=crop&crop=center'
        },
        {
          nameEn: 'Chocolate Muffin',
          nameKu: 'مافینی چۆکلێت',
          nameAr: 'مافين الشوكولاتة',
          descriptionEn: 'Moist chocolate chip muffin',
          descriptionKu: 'مافینی شێدار بە پارچە چۆکلێت',
          descriptionAr: 'مافين رطب بالشوكولاتة',
          price: 3.25,
          image: 'https://images.unsplash.com/photo-1609187994427-24bd89483349?w=400&h=400&fit=crop&crop=center'
        },
        {
          nameEn: 'Blueberry Scone',
          nameKu: 'سکۆنی بلووێری',
          nameAr: 'سكوين التوت الأزرق',
          descriptionEn: 'Traditional scone with fresh blueberries',
          descriptionKu: 'سکۆنی کلاسیکی بە بلووێری تازە',
          descriptionAr: 'سكوين تقليدي بالتوت الأزرق الطازج',
          price: 3.75,
          image: 'https://images.unsplash.com/photo-1621877193148-2b6d1df79173?w=400&h=400&fit=crop&crop=center'
        },
        {
          nameEn: 'Cinnamon Roll',
          nameKu: 'ڕۆلی دارچین',
          nameAr: 'لفائف القرفة',
          descriptionEn: 'Sweet roll with cinnamon and cream cheese frosting',
          descriptionKu: 'ڕۆلی شیرین بە دارچین و کریمی پەنیر',
          descriptionAr: 'لفيفة حلوة بالقرفة وكريمة الجبن',
          price: 4.25,
          image: 'https://images.unsplash.com/photo-1549938197-3ad2802c32fd?w=400&h=400&fit=crop&crop=center'
        }
      ]
    },
    {
      titleEn: 'Gourmet Sandwiches',
      titleKu: 'ساندویچە گەورەکان',
      titleAr: 'ساندويتشات فاخرة',
      description: 'Artisan sandwiches with fresh ingredients',
      menuItems: [
        {
          nameEn: 'Club Supreme',
          nameKu: 'کڵەبی سەرەکی',
          nameAr: 'نادي الممتاز',
          descriptionEn: 'Triple decker with turkey, bacon, lettuce and tomato',
          descriptionKu: 'سێ قەبارە لەگەڵ بێچەک، بێکۆن، کاهوو و تەماتە',
          descriptionAr: 'ثلاثي الطوابق مع الديك الرومي واللحم المقدد والخس والطماطم',
          price: 9.50,
          image: 'https://images.unsplash.com/photo-1549965752-86a52519bf37?w=400&h=400&fit=crop&crop=center'
        },
        {
          nameEn: 'Mediterranean Wrap',
          nameKu: 'پێچاوەی مەدیتەرانی',
          nameAr: 'لفافة متوسطية',
          descriptionEn: 'Grilled chicken, hummus, feta, cucumber and tomato',
          descriptionKu: 'مریاوای برژاو، حوموس، فێتا،变得更 و تەماتە',
          descriptionAr: 'دجاج مشوي، حمص، جبنة فيتا، خيار وطماطم',
          price: 7.50,
          image: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=400&h=400&fit=crop&crop=center'
        },
        {
          nameEn: 'Classic Grilled Cheese',
          nameKu: 'پەنیری برژاوی کلاسیک',
          nameAr: 'جبن مشوي كلاسيكي',
          descriptionEn: 'Three cheese blend on sourdough bread',
          descriptionKu: 'تێکەڵانی سێ پەنیر لەسەر نانی خەمیڕ',
          descriptionAr: 'خليط من ثلاثة أجبان على خبز الخميرة الحامضة',
          price: 6.00,
          image: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=400&h=400&fit=crop&crop=center'
        },
        {
          nameEn: 'Veggie Delight',
          nameKu: 'خواردنی سەوزەوات',
          nameAr: 'شهوة الخضروات',
          descriptionEn: 'Roasted vegetables, avocado spread and sprouts',
          descriptionKu: 'سەوزەواتی برژاو، سپرەدی ئەڤاکادۆ و نەعنا',
          descriptionAr: 'خضروات مشوية، أفوكادو وبراعم',
          price: 7.00,
          image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&h=400&fit=crop&crop=center'
        }
      ]
    },
    {
      titleEn: 'Sweet Desserts',
      titleKu: 'دێزێرتی شیرین',
      titleAr: 'حلويات حلوة',
      description: 'Indulgent desserts and sweet treats',
      menuItems: [
        {
          nameEn: 'New York Cheesecake',
          nameKu: 'کێکی پەنیری نیویۆرک',
          nameAr: 'كعكة جبن نيويورك',
          descriptionEn: 'Creamy cheesecake with berry compote',
          descriptionKu: 'کێکی پەنیری کریمی لەگەڵ سۆسی میوە',
          descriptionAr: 'كعكة جبن كريمية مع صلصة التوت',
          price: 6.50,
          image: 'https://images.unsplash.com/photo-1524188556818-87ca9a2b9c70?w=400&h=400&fit=crop&crop=center'
        },
        {
          nameEn: 'Chocolate Lava Cake',
          nameKu: 'کێکی چۆکلێتی لاڤا',
          nameAr: 'كعكة بركان الشوكولاتة',
          descriptionEn: 'Warm chocolate cake with molten center',
          descriptionKu: 'کێکی چۆکلێتی گەرم لەگەڵ ناوەکی خڕاو',
          descriptionAr: 'كعكة شوكولاتة دافئة بمركز منصهر',
          price: 5.75,
          image: 'https://images.unsplash.com/photo-1578984355709-4e99743a1bc2?w=400&h=400&fit=crop&crop=center'
        },
        {
          nameEn: 'Tiramisu',
          nameKu: 'تیرامیسو',
          nameAr: 'تراميسو',
          descriptionEn: 'Classic Italian coffee-flavored dessert',
          descriptionKu: 'دێزێرتی کلاسیکی ئیتالی بە تامە قهوه',
          descriptionAr: 'حلوى إيطالية كلاسيكية بنكهة القهوة',
          price: 6.25,
          image: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=400&h=400&fit=crop&crop=center'
        },
        {
          nameEn: 'Fruit Tart',
          nameKu: 'تارتی میوە',
          nameAr: 'فطيرة الفاكهة',
          descriptionEn: 'Fresh seasonal fruits on pastry cream',
          descriptionKu: 'میوەی وەرزی تازە لەسەر کریمی شیرینی',
          descriptionAr: 'فواكه موسمية طازجة على كريمة المعجنات',
          price: 5.50,
          image: 'https://images.unsplash.com/photo-1564701198853-51b99e8d8ad8?w=400&h=400&fit=crop&crop=center'
        }
      ]
    },
    {
      titleEn: 'Cold Beverages',
      titleKu: 'خواردنەوەی سارد',
      titleAr: 'المشروبات الباردة',
      description: 'Refreshing cold drinks and smoothies',
      menuItems: [
        {
          nameEn: 'Iced Coffee',
          nameKu: 'قهوه سارد',
          nameAr: 'قهوة مثلجة',
          descriptionEn: 'Cold brew coffee served over ice',
          descriptionKu: 'قهوه‌ی سارد کە لەسەر سەهی دەخرێت',
          descriptionAr: 'قهوة باردة تقدم على الثلج',
          price: 3.50,
          image: 'https://images.unsplash.com/photo-1522701024529-b1e82896f3d6?w=400&h=400&fit=crop&crop=center'
        },
        {
          nameEn: 'Fresh Orange Juice',
          nameKu: 'شەربەتی پرتەقاڵی تازە',
          nameAr: 'عصير برتقال طازج',
          descriptionEn: 'Freshly squeezed orange juice',
          descriptionKu: 'شەربەتی پرتەقاڵی تازە دەکراو',
          descriptionAr: 'عصير برتقال طازج معصور',
          price: 4.00,
          image: 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=400&h=400&fit=crop&crop=center'
        },
        {
          nameEn: 'Strawberry Smoothie',
          nameKu: 'سمووتی ستاوبێری',
          nameAr: 'سموثي الفراولة',
          descriptionEn: 'Blended strawberries with yogurt and honey',
          descriptionKu: 'ستاوبێری لێکدراو لەگەڵ مەست و عەسل',
          descriptionAr: 'فراولة مخلوطة مع الزبادي والعسل',
          price: 4.50,
          image: 'https://images.unsplash.com/photo-1505252585461-04db1eb84625?w=400&h=400&fit=crop&crop=center'
        },
        {
          nameEn: 'Iced Chocolate',
          nameKu: 'چۆکلێتی سارد',
          nameAr: 'شوكولاتة مثلجة',
          descriptionEn: 'Rich chocolate milk with ice',
          descriptionKu: 'شیری چۆکلێتی دڵڕەش لەگەڵ سەهی',
          descriptionAr: 'حليب الشوكولاتة الغني مع الثلج',
          price: 3.75,
          image: 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=400&h=400&fit=crop&crop=center'
        }
      ]
    }
  ];

  // Create categories and their items
  for (const categoryData of menuCategories) {
    const { menuItems, ...categoryInfo } = categoryData;

    const category = await prisma.menuCategory.create({
      data: categoryInfo,
    });

    console.log(`📂 Created category: ${category.titleEn}`);

    // Create menu items for this category
    for (const itemData of menuItems) {
      await prisma.menuItem.create({
        data: {
          ...itemData,
          categoryId: category.id,
        },
      });
      console.log(`  🍽️ Created item: ${itemData.nameEn} (with image)`);
    }
  }

  console.log('🎉 Enhanced database seeding completed successfully!');
  console.log('');
  console.log('📊 Summary:');
  console.log(`   👥 Users: ${users.length}`);
  console.log(`   🪑 Tables: ${tables.length}`);
  console.log(`   📂 Categories: ${menuCategories.length}`);
  console.log(`   🍽️ Menu Items: ${menuCategories.reduce((sum, cat) => sum + cat.menuItems.length, 0)}`);
  console.log('');
  console.log('🔑 Login credentials:');
  console.log('   Admin: admin@cafecare.com / admin123');
  console.log('   Captain: captain@cafecare.com / captain123');
  console.log('   Cashier: cashier1@cafecare.com / cashier123');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });