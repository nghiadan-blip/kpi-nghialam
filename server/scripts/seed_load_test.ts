import db from '../src/config/db';
import bcrypt from 'bcryptjs';

export async function seedLoadTestData(): Promise<void> {
  console.log('🚀 Starting Load Test Data Seeding...');

  // 1. Ensure 8 Departments
  const existingDepts = await db('departments').select('id');
  const neededDeptsCount = 8 - existingDepts.length;
  if (neededDeptsCount > 0) {
    const newDepts = [];
    for (let i = 1; i <= neededDeptsCount; i++) {
      newDepts.push({
        name: `Bộ phận Chuyên môn phụ trợ số ${existingDepts.length + i}`,
        parent_id: 1,
      });
    }
    await db('departments').insert(newDepts);
    console.log(`✅ Seeded ${newDepts.length} departments.`);
  }

  // 2. Ensure 58 Users
  const depts = await db('departments').select('id');
  const existingUsers = await db('users').select('id');
  const neededUsersCount = 58 - existingUsers.length;
  if (neededUsersCount > 0) {
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash('user123456', saltRounds);
    const newUsers = [];
    for (let i = 1; i <= neededUsersCount; i++) {
      const deptIdx = i % depts.length;
      newUsers.push({
        username: `canbo_${existingUsers.length + i}`,
        password_hash: hashedPassword,
        fullname: `Cán bộ chuyên môn số ${existingUsers.length + i}`,
        email: `canbo${existingUsers.length + i}@nghialam.gov.vn`,
        role: 'EMPLOYEE',
        position: `Công chức chuyên môn ${existingUsers.length + i}`,
        position_code: 'NA-NL-II.25',
        department_id: depts[deptIdx].id,
        status: 'ACTIVE',
      });
    }
    await db('users').insert(newUsers);
    console.log(`✅ Seeded ${newUsers.length} users.`);
  }

  // 3. Ensure 802 Catalog Items
  const existingCatalog = await db('product_catalog').select('id');
  const neededCatalogCount = 802 - existingCatalog.length;
  if (neededCatalogCount > 0) {
    const newCatalog = [];
    for (let i = 1; i <= neededCatalogCount; i++) {
      const idCode = existingCatalog.length + i;
      newCatalog.push({
        code: `CAT_LOAD_${idCode.toString().padStart(3, '0')}`,
        name: `Danh mục công việc / tiêu chí công tác số ${idCode}`,
        category: 'PART_A',
        coefficient: 1.0,
        baseline_score: 5.0,
        description: `Mô tả tự động cho mã danh mục CAT_LOAD_${idCode}`,
        status: 'ACTIVE',
      });
    }
    // Chunk insert to avoid SQLite parameter limit (999 variables per query)
    const chunkSize = 100;
    for (let i = 0; i < newCatalog.length; i += chunkSize) {
      const chunk = newCatalog.slice(i, i + chunkSize);
      await db('product_catalog').insert(chunk);
    }
    console.log(`✅ Seeded ${newCatalog.length} catalog items.`);
  }

  // 4. Ensure 1000+ Tasks
  const users = await db('users').select('id');
  const catalogs = await db('product_catalog').select('id');
  const existingTasks = await db('tasks').select('id');
  const neededTasksCount = 1050 - existingTasks.length;
  if (neededTasksCount > 0) {
    const newTasks = [];
    const now = new Date();
    const threeDaysLater = new Date(now.getTime() + 86400000 * 3).toISOString();

    for (let i = 1; i <= neededTasksCount; i++) {
      const userIdx = i % users.length;
      const catIdx = i % catalogs.length;
      newTasks.push({
        title: `Nhiệm vụ kiểm thử hiệu năng số ${existingTasks.length + i}`,
        description: `Mô tả kiểm thử cho nhiệm vụ ${existingTasks.length + i}`,
        assigned_to: users[userIdx].id,
        assigned_by: 1, // Admin
        product_catalog_id: catalogs[catIdx].id,
        deadline: threeDaysLater,
        weight: 1.0,
        status: 'PENDING',
        assigned_quantity: 1.0,
        converted_assigned_quantity: 1.0,
      });
    }

    const chunkSize = 80;
    for (let i = 0; i < newTasks.length; i += chunkSize) {
      const chunk = newTasks.slice(i, i + chunkSize);
      await db('tasks').insert(chunk);
    }
    console.log(`✅ Seeded ${newTasks.length} tasks.`);
  }

  console.log('🎉 Load Test Data Seeding Completed Successfully.');
}

if (require.main === module) {
  seedLoadTestData().then(() => process.exit(0)).catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
