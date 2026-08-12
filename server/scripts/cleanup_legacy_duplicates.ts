import db from '../src/config/db';

async function cleanupOldDuplicates() {
  console.log('=== 1. Current Users in Database ===');
  const users = await db('users').select('id', 'username', 'fullname', 'email', 'phone', 'role', 'status', 'created_at');
  users.forEach((u) => console.log(`[#${u.id}] ${u.fullname} | ${u.username} | ${u.email || '-'} | ${u.status}`));

  // Let's identify duplicates by matching fullname
  const nameMap = new Map<string, typeof users>();
  for (const u of users) {
    const key = u.fullname.trim().toLowerCase();
    if (!nameMap.has(key)) nameMap.set(key, []);
    nameMap.get(key)!.push(u);
  }

  const idsToDelete: number[] = [];

  for (const [name, list] of nameMap.entries()) {
    if (list.length > 1) {
      console.log(`\nFound ${list.length} duplicates for "${name}":`);
      // Keep the active one or the oldest one, or the one with existing tasks/evaluations
      let keep = list.find((u) => u.status === 'ACTIVE') || list[0];
      const others = list.filter((u) => u.id !== keep.id);
      
      console.log(`  -> KEEP: #${keep.id} (${keep.username})`);
      for (const o of others) {
        console.log(`  -> DELETE: #${o.id} (${o.username})`);
        idsToDelete.push(o.id);
      }
    }
  }

  if (idsToDelete.length > 0) {
    console.log(`\nDeleting ${idsToDelete.length} duplicate user records...`);
    // Delete any evaluations or tasks linked to duplicate ids first if any
    await db('evaluation_details').whereIn('evaluation_id', function() {
      this.select('id').from('evaluations').whereIn('employee_id', idsToDelete);
    }).delete();
    await db('evaluations').whereIn('employee_id', idsToDelete).delete();
    await db('tasks').whereIn('assigned_to', idsToDelete).delete();
    await db('audit_logs').whereIn('user_id', idsToDelete).delete();
    await db('users').whereIn('id', idsToDelete).delete();
    console.log('✅ Cleanup finished successfully!');
  } else {
    console.log('No duplicates found.');
  }

  const remaining = await db('users').select('id', 'username', 'fullname', 'status');
  console.log(`\nRemaining unique users: ${remaining.length}`);
  remaining.forEach((u) => console.log(`  - [#${u.id}] ${u.fullname} (${u.status})`));
  process.exit(0);
}

cleanupOldDuplicates().catch((err) => {
  console.error(err);
  process.exit(1);
});
