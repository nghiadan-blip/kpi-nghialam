import db from '../src/config/db';

async function checkAndMergeDepts() {
  console.log('=== Inspecting Departments ===');
  const depts = await db('departments').select('*');
  console.log(depts);

  // Check duplicate / redundant departments
  const vhxhDepts = depts.filter((d) => d.name.toLowerCase().includes('văn hóa'));
  console.log('Van hoa depts:', vhxhDepts);

  if (vhxhDepts.length > 1) {
    const mainDept = vhxhDepts[0];
    const duplicateDepts = vhxhDepts.slice(1);
    const dupIds = duplicateDepts.map((d) => d.id);

    console.log(`Merging duplicate depts ${dupIds.join(', ')} into Main Dept #${mainDept.id} (${mainDept.name})`);

    // Move users
    await db('users').whereIn('department_id', dupIds).update({ department_id: mainDept.id });

    // Delete duplicates
    await db('departments').whereIn('id', dupIds).delete();
    console.log('Merged successfully!');
  }

  const finalDepts = await db('departments').select('*');
  console.log('=== Final Departments List ===', finalDepts);
  process.exit(0);
}

checkAndMergeDepts().catch((e) => {
  console.error(e);
  process.exit(1);
});
