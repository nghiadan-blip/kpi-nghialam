import db from '../src/config/db';

async function main() {
  console.log('=== 1. Checking Users in Database ===');
  const allUsers = await db('users').select('id', 'username', 'fullname', 'email', 'phone', 'status', 'department_id');
  console.log(`Total users in DB: ${allUsers.length}`);

  // Find duplicates among PENDING_APPROVAL users
  const pending = allUsers.filter((u) => u.status === 'PENDING_APPROVAL');
  console.log(`Pending users: ${pending.length}`);

  const seen = new Set<string>();
  const toDelete: number[] = [];

  for (const u of pending) {
    const key = (u.email || u.phone || u.fullname).toLowerCase().trim();
    if (seen.has(key)) {
      toDelete.push(u.id);
    } else {
      seen.add(key);
    }
  }

  if (toDelete.length > 0) {
    console.log(`Deleting ${toDelete.length} duplicate pending records:`, toDelete);
    await db('users').whereIn('id', toDelete).delete();
  }

  const activeUsers = await db('users').where('status', 'ACTIVE').select('id');
  const depts = await db('departments').select('id', 'name');

  console.log(`Active Users: ${activeUsers.length}`);
  console.log(`Departments: ${depts.length}`);
  console.log('=== Database Clean & Synchronized Successfully ===');
  process.exit(0);
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
