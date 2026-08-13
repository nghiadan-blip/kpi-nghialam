import db from '../src/config/db';

async function cleanAndEnrichTasks() {
  console.log('=== CHUẨN HÓA VÀ LÀM SẠCH DỮ LIỆU NHIỆM VỤ THỰC TẾ XÃ NGHĨA LÂM ===\n');

  // 1. Get users and catalog
  const users = await db('users').select('id', 'username', 'fullname', 'department_id');
  const catalog = await db('product_catalog').select('id', 'name', 'coefficient');

  const congchucDc = users.find((u) => u.username === 'congchuc_dc') || users[0];
  const congchucVh = users.find((u) => u.username === 'congchuc_vh') || users[1] || users[0];
  const thangle = users.find((u) => u.username === 'thangle') || users[0];
  const dunghoang = users.find((u) => u.username === 'dunghoang') || users[0];

  // 2. Clean up test tasks
  const testTitles = [
    'Test luong trang thai nhiem vu',
    'Test khong gan ma san pham',
  ];

  await db('tasks')
    .where('title', 'like', '%Test%')
    .del();

  console.log('✅ Đã xóa toàn bộ các bản ghi nhiệm vụ chứa chữ Test.');

  // Clean duplicate GCN tasks
  const gcnTasks = await db('tasks').where('title', 'like', '%cấp đổi Giấy chứng nhận QSD đất%').select('id');
  if (gcnTasks.length > 2) {
    const toDelete = gcnTasks.slice(2).map((t) => t.id);
    await db('tasks').whereIn('id', toDelete).del();
    console.log(`✅ Đã làm sạch ${toDelete.length} bản ghi nhiệm vụ trùng lặp.`);
  }

  // 3. Seed realistic administrative tasks for Nghĩa Lâm commune
  const realisticTasks = [
    {
      title: 'Thẩm định hồ sơ trích đo địa chính và cấp đổi GCN quyền sử dụng đất thôn 2',
      description: 'Tiếp nhận hồ sơ từ Bộ phận Một cửa, kiểm tra thực địa và đối chiếu bản đồ địa chính.',
      assigned_to: congchucDc.id,
      product_catalog_id: catalog[0]?.id || null,
      assigned_quantity: 3.0,
      converted_assigned_quantity: 3.0 * (catalog[0]?.coefficient || 1.0),
      actual_completed_quantity: 3.0,
      status: 'COMPLETED',
      evidence: 'Đã lập biên bản thẩm tra thực địa và bàn giao phiếu kết quả ngày 10/08/2026',
      weight: 1.0,
      deadline: new Date(Date.now() + 86400000 * 2).toISOString(),
    },
    {
      title: 'Soạn thảo Báo cáo công tác cải cách hành chính và chuyển đổi số Quý III/2026',
      description: 'Tổng hợp số liệu tiếp nhận hồ sơ trực tuyến, tỷ lệ giải quyết đúng hạn của các bộ phận.',
      assigned_to: congchucVh.id,
      product_catalog_id: catalog[1]?.id || null,
      assigned_quantity: 1.0,
      converted_assigned_quantity: 1.0 * (catalog[1]?.coefficient || 1.2),
      status: 'IN_PROGRESS',
      weight: 1.2,
      deadline: new Date(Date.now() + 86400000 * 4).toISOString(),
    },
    {
      title: 'Xử lý hồ sơ đăng ký khai sinh và cấp số định danh cá nhân cho công dân thôn 5',
      description: 'Thực hiện liên thông đăng ký khai sinh, đăng ký thường trú và cấp thẻ BHYT cho trẻ em.',
      assigned_to: thangle.id,
      product_catalog_id: catalog[2]?.id || null,
      assigned_quantity: 5.0,
      converted_assigned_quantity: 5.0 * (catalog[2]?.coefficient || 1.0),
      actual_completed_quantity: 5.0,
      status: 'COMPLETED',
      evidence: 'Đã hoàn thành liên thông Dịch vụ công Quốc gia ngày 11/08/2026',
      weight: 1.0,
      deadline: new Date(Date.now() + 86400000 * 1).toISOString(),
    },
    {
      title: 'Lập biểu phân bổ dự toán ngân sách chi thường xuyên tháng 09/2026',
      description: 'Rà soát chứng từ chi hoạt động cơ quan và lập hồ sơ thanh toán Kho bạc Nhà nước.',
      assigned_to: dunghoang.id,
      product_catalog_id: catalog[3]?.id || null,
      assigned_quantity: 1.0,
      converted_assigned_quantity: 1.0 * (catalog[3]?.coefficient || 1.5),
      status: 'IN_PROGRESS',
      weight: 1.5,
      deadline: new Date(Date.now() + 86400000 * 3).toISOString(),
    },
    {
      title: 'Kiểm tra hiện trường và lập biên bản xử lý vi phạm trật tự xây dựng hành lang đường xã',
      description: 'Phối hợp Công an xã kiểm tra mốc giới hành lang an toàn giao thông tuyến Nghĩa Lâm - Nghĩa Sơn.',
      assigned_to: congchucDc.id,
      product_catalog_id: catalog[4]?.id || null,
      assigned_quantity: 2.0,
      converted_assigned_quantity: 2.0 * (catalog[4]?.coefficient || 1.5),
      status: 'PENDING',
      weight: 1.5,
      deadline: new Date(Date.now() + 86400000 * 1).toISOString(), // Urgent
    },
  ];

  const leader = users.find((u) => u.username === 'chutich') || users[0];

  for (const t of realisticTasks) {
    const existing = await db('tasks').where('title', t.title).first();
    if (!existing) {
      await db('tasks').insert({
        ...t,
        assigned_by: leader.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      console.log(`✅ Đã bổ sung nhiệm vụ hành chính: "${t.title}"`);
    }
  }

  console.log('\n=== HOÀN TẤT CHUẨN HÓA DỮ LIỆU NHIỆM VỤ HÀNH CHÍNH ===\n');
  process.exit(0);
}

cleanAndEnrichTasks().catch((err) => {
  console.error('Lỗi chuẩn hóa dữ liệu:', err);
  process.exit(1);
});
