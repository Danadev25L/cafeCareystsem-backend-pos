import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seeding...');

  // Clear existing data for fresh seed
  console.log('Clearing existing data...');
  await prisma.menuItem.deleteMany();
  await prisma.menuCategory.deleteMany();
  await prisma.user.deleteMany();
  console.log('Cleared existing data');

  // Create users with different roles
  const users = [
    {
      email: 'admin@cafesystem.com',
      password: 'admin123',
      name: 'Admin User',
      role: 'ADMIN' as const,
    },
    {
      email: 'captain@cafesystem.com',
      password: 'captain123',
      name: 'Captain User',
      role: 'CAPTAIN' as const,
    },
    {
      email: 'barista@cafesystem.com',
      password: 'barista123',
      name: 'Barista User',
      role: 'CASHIER' as const,
    },
    {
      email: 'john@cafesystem.com',
      password: 'john123',
      name: 'John Doe',
      role: 'CASHIER' as const,
    },
    {
      email: 'jane@cafesystem.com',
      password: 'jane123',
      name: 'Jane Smith',
      role: 'CASHIER' as const,
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

    console.log(`Created user: ${user.email} (${user.role})`);
  }

  console.log('Creating menu categories...');

  // Create menu categories with items (using multilingual fields)
  const menuCategories = [
    {
      titleEn: 'Coffee',
      titleKu: 'قهوه',
      titleAr: 'قهوة',
      description: 'Premium coffee selections',
      menuItems: [
        { nameEn: 'Espresso', nameKu: 'ئیسپرێسۆ', nameAr: 'إسبريسو', descriptionEn: 'Strong black coffee', descriptionKu: 'قهوه‌ی بەهێز و ڕەش', descriptionAr: 'قهوة سوداء قوية', price: 2.50 },
        { nameEn: 'Cappuccino', nameKu: 'کاپوچینۆ', nameAr: 'كابتشينو', descriptionEn: 'Espresso with steamed milk foam', descriptionKu: 'ئیسپرێسۆ لەگەڵ شیرەوەرم', descriptionAr: 'إسبريسو مع رغوة الحليب', price: 3.50 },
        { nameEn: 'Latte', nameKu: 'لاتێ', nameAr: 'لاتيه', descriptionEn: 'Espresso with steamed milk', descriptionKu: 'ئیسپرێسۆ لەگەڵ شیر', descriptionAr: 'إسبريسو مع الحليب', price: 4.00 },
        { nameEn: 'Americano', nameKu: 'ئەمەریکانۆ', nameAr: 'أمريكانو', descriptionEn: 'Espresso with hot water', descriptionKu: 'ئیسپرێسۆ لەگەڵ ئاوی گەرم', descriptionAr: 'إسبريسو مع الماء الساخن', price: 3.00 },
        { nameEn: 'Macchiato', nameKu: 'ماکیاتۆ', nameAr: 'ماكياتو', descriptionEn: 'Espresso with a dollop of foam', descriptionKu: 'ئیسپرێسۆ لەگەڵ کەمێک کەف', descriptionAr: 'إسبريسو مع القليل من الرغوة', price: 3.25 },
      ]
    },
    {
      titleEn: 'Tea',
      titleKu: 'چای',
      titleAr: 'شاي',
      description: 'Selection of fine teas',
      menuItems: [
        { nameEn: 'Green Tea', nameKu: 'چای سەوز', nameAr: 'شاي أخضر', descriptionEn: 'Fresh green tea leaves', descriptionKu: 'گەڵای چای سەوز', descriptionAr: 'أوراق الشاي الأخضر', price: 2.50 },
        { nameEn: 'Black Tea', nameKu: 'چای ڕەش', nameAr: 'شاي أسود', descriptionEn: 'Classic black tea', descriptionKu: 'چای کلاسیکی ڕەش', descriptionAr: 'شاي أسود كلاسيكي', price: 2.25 },
        { nameEn: 'Chamomile Tea', nameKu: 'چای بابونج', nameAr: 'شاي البابونج', descriptionEn: 'Relaxing herbal tea', descriptionKu: 'چای گیایی ئارامکەرەوە', descriptionAr: 'شاي عشبي مريح', price: 3.00 },
        { nameEn: 'Earl Grey', nameKu: 'ئێرل گرێی', nameAr: 'إيرل جراي', descriptionEn: 'Black tea with bergamot', descriptionKu: 'چای ڕەش لەگەڵ بێرگامۆت', descriptionAr: 'شاي أسود مع البرغموت', price: 2.75 },
      ]
    },
    {
      titleEn: 'Pastries',
      titleKu: 'شیرینی',
      titleAr: 'معجنات',
      description: 'Fresh baked goods',
      menuItems: [
        { nameEn: 'Croissant', nameKu: 'کرواسان', nameAr: 'كرواسان', descriptionEn: 'Buttery French pastry', descriptionKu: 'شیرینی فەرەنسی بە کەرە', descriptionAr: 'معجنات فرنسية بالزبدة', price: 3.50 },
        { nameEn: 'Muffin', nameKu: 'مافین', nameAr: 'مافين', descriptionEn: 'Fresh baked muffin', descriptionKu: 'مافینی تازە', descriptionAr: 'مافين طازج', price: 3.00 },
        { nameEn: 'Bagel', nameKu: 'بەیگڵ', nameAr: 'باغل', descriptionEn: 'New York style bagel', descriptionKu: 'بەیگڵ بە شێوەی نیویۆرک', descriptionAr: 'باغل على الطريقة النيويوركية', price: 2.75 },
        { nameEn: 'Danish', nameKu: 'دانیش', nameAr: 'دانش', descriptionEn: 'Sweet pastry with fruit filling', descriptionKu: 'شیرینی شیرین بە پڕکردنەوەی میوە', descriptionAr: 'معجنات حلوة بحشوة الفاكهة', price: 4.50 },
      ]
    },
    {
      titleEn: 'Sandwiches',
      titleKu: 'ساندویچ',
      titleAr: 'ساندويتشات',
      description: 'Fresh made sandwiches',
      menuItems: [
        { nameEn: 'Club Sandwich', nameKu: 'ساندویچ کڵەب', nameAr: 'ساندويتش النادي', descriptionEn: 'Triple decker with turkey and bacon', descriptionKu: 'سێ قەبارە لەگەڵ بێچەک و بێکۆن', descriptionAr: 'ثلاثي الطوابق مع الديك الرومي واللحم المقدد', price: 8.50 },
        { nameEn: 'Grilled Cheese', nameKu: 'پەنیری برژاو', nameAr: 'جبن مشوي', descriptionEn: 'Classic grilled cheese sandwich', descriptionKu: 'ساندویچ پەنیری کلاسیک', descriptionAr: 'ساندويتش الجبن الكلاسيكي', price: 5.50 },
        { nameEn: 'Turkey Sandwich', nameKu: 'ساندویچ بێچەک', nameAr: 'ساندويتش الديك الرومي', descriptionEn: 'Fresh turkey with lettuce and tomato', descriptionKu: 'بێچەکی تازە لەگەڵ کاهوو و تەماتە', descriptionAr: 'ديك رومي طازج مع الخس والطماطم', price: 7.50 },
        { nameEn: 'Vegetarian Wrap', nameKu: 'پێچاوەی گیاخوارد', nameAr: 'لفافة نباتية', descriptionEn: 'Fresh vegetables in a wrap', descriptionKu: 'زیندەوەرەکان لە پێچاوەیەکدا', descriptionAr: 'خضار طازجة في لفافة', price: 6.50 },
      ]
    },
    {
      titleEn: 'Desserts',
      titleKu: 'دێزێرت',
      titleAr: 'حلويات',
      description: 'Sweet treats',
      menuItems: [
        { nameEn: 'Cheesecake', nameKu: 'کێیک پەنیر', nameAr: 'كعكة الجبن', descriptionEn: 'New York style cheesecake', descriptionKu: 'کێیکی پەنیر بە شێوەی نیویۆرک', descriptionAr: 'كعكة الجبن على الطريقة النيويوركية', price: 5.50 },
        { nameEn: 'Chocolate Cake', nameKu: 'کێیک چۆکلێت', nameAr: 'كعكة الشوكولاتة', descriptionEn: 'Rich chocolate cake', descriptionKu: 'کێیکی چۆکلێتی دەوڵەمەند', descriptionAr: 'كعكة شوكولاتة غنية', price: 4.50 },
        { nameEn: 'Ice Cream', nameKu: 'ئایس کریم', nameAr: 'آيس كريم', descriptionEn: 'Two scoops of premium ice cream', descriptionKu: 'دوو قاشقی ئایس کریمی بەرز', descriptionAr: 'ملعقتان من الآيس كريم المميز', price: 3.50 },
        { nameEn: 'Fruit Tart', nameKu: 'تارت میوە', nameAr: 'فطيرة الفاكهة', descriptionEn: 'Fresh fruit tart with pastry cream', descriptionKu: 'تارتی میوەی تازە لەگەڵ کریمی شیرینی', descriptionAr: 'فطيرة فاكهة طازجة مع كريمة المعجنات', price: 6.00 },
      ]
    }
  ];

  // Create categories and their items
  for (const categoryData of menuCategories) {
    const { menuItems, ...categoryInfo } = categoryData;

    const category = await prisma.menuCategory.create({
      data: categoryInfo,
    });

    console.log(`Created category: ${category.titleEn}`);

    // Create menu items for this category
    for (const itemData of menuItems) {
      await prisma.menuItem.create({
        data: {
          ...itemData,
          categoryId: category.id,
        },
      });
      console.log(`  - Created item: ${itemData.nameEn}`);
    }
  }

  console.log('Creating default settings...');

  // Create default service charge settings
  await prisma.serviceChargeSettings.upsert({
    where: { id: 1 },
    update: {},
    create: {
      threshold: 10.0,
      chargeAmount: 1.0,
      isPercentage: false,
      isActive: true,
    },
  });

  // Create default discount settings
  await prisma.discountSettings.upsert({
    where: { id: 1 },
    update: {},
    create: {
      threshold: 0.0,
      discountAmount: 0.0,
      isPercentage: true,
      percentageValue: 0.0,
      isActive: true,
      isAllItems: true,
    },
  });

  console.log('Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });