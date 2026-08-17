import db from '../src/config/db';
import { seedLoadTestData } from './seed_load_test';
import { performance } from 'perf_hooks';

async function runLoadTest() {
  console.log('🚀 Running Load Test Simulation...');

  // Ensure database has scale data
  await seedLoadTestData();

  const results: Record<string, number> = {};

  // 1. Benchmark: Get dashboard statistics query (simulating executiveDashboardController)
  console.log('⏱️ Testing Executive Dashboard Query...');
  let start = performance.now();
  
  const totalTasks = await db('tasks').count({ count: '*' }).first();
  const tasksByStatus = await db('tasks')
    .select('status')
    .count({ count: '*' })
    .groupBy('status');
  const landCasesSummary = await db('land_certificate_cases')
    .select('case_group')
    .count({ count: '*' })
    .groupBy('case_group');
  const projectSummary = await db('public_investment_projects')
    .select('status')
    .count({ count: '*' })
    .groupBy('status');
  
  results['Executive Dashboard Queries'] = performance.now() - start;
  console.log(`✔️ Completed in ${results['Executive Dashboard Queries'].toFixed(2)} ms.`);

  // 2. Benchmark: Get tasks list query (simulating taskController.getTasks)
  console.log('⏱️ Testing Tasks List Query (1000+ records)...');
  start = performance.now();
  
  const tasks = await db('tasks as t')
    .leftJoin('users as u_assignee', 't.assigned_to', 'u_assignee.id')
    .leftJoin('departments as d', 'u_assignee.department_id', 'd.id')
    .leftJoin('users as u_creator', 't.assigned_by', 'u_creator.id')
    .leftJoin('product_catalog as pc', 't.product_catalog_id', 'pc.id')
    .select(
      't.id', 't.title', 't.deadline', 't.status', 
      'u_assignee.fullname as assignee_name', 
      'd.name as assignee_department_name', 
      'pc.name as catalog_name'
    )
    .orderBy('t.deadline', 'asc');
    
  results['Tasks List Query'] = performance.now() - start;
  console.log(`✔️ Completed in ${results['Tasks List Query'].toFixed(2)} ms (Total fetched: ${tasks.length} rows).`);

  // 3. Benchmark: Get product catalog items (800+ records)
  console.log('⏱️ Testing Catalog List Query (800+ records)...');
  start = performance.now();
  
  const catalog = await db('product_catalog')
    .select('*')
    .orderBy('code', 'asc');
    
  results['Catalog List Query'] = performance.now() - start;
  console.log(`✔️ Completed in ${results['Catalog List Query'].toFixed(2)} ms (Total fetched: ${catalog.length} rows).`);

  // 4. Benchmark: Complex Join for Evaluations
  console.log('⏱️ Testing Evaluation Details Query...');
  start = performance.now();
  
  const evals = await db('evaluations as e')
    .leftJoin('users as u', 'e.employee_id', 'u.id')
    .leftJoin('departments as d', 'u.department_id', 'd.id')
    .select('e.*', 'u.fullname as employee_name', 'd.name as department_name')
    .limit(100);
    
  results['Evaluations List Query'] = performance.now() - start;
  console.log(`✔️ Completed in ${results['Evaluations List Query'].toFixed(2)} ms.`);

  console.log('\n========================================');
  console.log('📊 LOAD TEST PERFORMANCE BENCHMARK REPORT:');
  console.log('========================================');
  for (const [name, ms] of Object.entries(results)) {
    console.log(`- ${name.padEnd(30)}: ${ms.toFixed(2)} ms`);
  }
  console.log('========================================\n');
}

runLoadTest()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Lỗi chạy Load Test:', err);
    process.exit(1);
  });
