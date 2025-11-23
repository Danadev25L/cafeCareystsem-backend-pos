const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verifyDatabase() {
  try {
    console.log('🔍 Verifying database integrity...');

    const userCount = await prisma.user.count();
    const tableCount = await prisma.table.count();
    const categoryCount = await prisma.menuCategory.count();
    const itemCount = await prisma.menuItem.count();

    console.log('\n📊 Data Counts:');
    console.log(`   Users: ${userCount}`);
    console.log(`   Tables: ${tableCount}`);
    console.log(`   Categories: ${categoryCount}`);
    console.log(`   Menu Items: ${itemCount}`);

    const adminUser = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    });
    console.log(`\n👤 Admin User: ${adminUser ? adminUser.email : 'Not found'}`);

    const sampleCategory = await prisma.menuCategory.findFirst();
    console.log(`📂 Sample Category: ${sampleCategory ? sampleCategory.titleEn : 'Not found'}`);

    const sampleItem = await prisma.menuItem.findFirst({
      include: { category: true }
    });
    console.log(`🍽️ Sample Item: ${sampleItem ? sampleItem.nameEn : 'Not found'}`);
    console.log(`🖼️ Sample Item has image: ${sampleItem ? !!sampleItem.image : 'N/A'}`);

    console.log('\n✅ Database verification completed!');

  } catch (error) {
    console.error('❌ Database verification failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyDatabase();