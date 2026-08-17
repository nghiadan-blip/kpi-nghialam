/**
 * Constants & Configuration for Project Management Lifecycle Module
 * Based on Law on Public Investment 2019, Construction Law 2014 (Amended 2020),
 * Decree 40/2020/ND-CP, Decree 15/2021/ND-CP, Decree 335, and Commune Management Regulations
 */

export const INVESTMENT_GROUPS = ['A', 'B', 'C', 'Chưa phân loại'] as const;
export type InvestmentGroup = typeof INVESTMENT_GROUPS[number];

/**
 * Ngưỡng cảnh báo chênh lệch Tiến độ & Giải ngân (Configurable via ENV or Query)
 */
export const PROGRESS_GAP_WARNING_THRESHOLD = Number(process.env.PROGRESS_GAP_WARNING_THRESHOLD || 15);
export const PROGRESS_GAP_DANGER_THRESHOLD = Number(process.env.PROGRESS_GAP_DANGER_THRESHOLD || 30);

export const BIDDING_METHODS = [
  'Đấu thầu rộng rãi',
  'Đấu thầu rộng rãi qua mạng',
  'Đấu thầu hạn chế',
  'Chỉ định thầu',
  'Chỉ định thầu rút gọn',
  'Chào hàng cạnh tranh',
  'Mua sắm trực tiếp',
  'Tự thực hiện',
  'Cộng đồng thực hiện',
  'Khác'
] as const;

export const LIFECYCLE_STATUSES = [
  { value: 'PREPARATION', label: '1. Chuẩn bị đầu tư (Lập chủ trương)' },
  { value: 'INVESTMENT_APPROVED', label: '2. Đã phê duyệt dự án / BCKTKT' },
  { value: 'PROCUREMENT', label: '3. Kế hoạch & Lựa chọn nhà thầu' },
  { value: 'CONTRACT_SIGNED', label: '4. Đã ký hợp đồng xây lắp' },
  { value: 'CONSTRUCTION', label: '5. Đang tổ chức thi công' },
  { value: 'PARTIAL_ACCEPTANCE', label: '6. Nghiệm thu từng giai đoạn/hạng mục' },
  { value: 'COMPLETION_ACCEPTANCE', label: '7. Nghiệm thu hoàn thành công trình' },
  { value: 'HANDOVER', label: '8. Đã bàn giao đưa vào sử dụng' },
  { value: 'SETTLEMENT', label: '9. Thẩm tra & Phê duyệt quyết toán' },
  { value: 'WARRANTY', label: '10. Đang trong thời hạn bảo hành' },
  { value: 'CLOSED', label: '11. Kết thúc dự án & Tất toán tài khoản' },
  { value: 'ARCHIVED', label: 'Lưu trữ hồ sơ' },
  { value: 'CANCELLED_DRAFT', label: 'Hủy bản nháp' }
] as const;
export type LifecycleStatus = typeof LIFECYCLE_STATUSES[number]['value'];

export const ACCEPTANCE_STATUSES = [
  { value: 'chua_nghiem_thu', label: 'Chưa nghiệm thu' },
  { value: 'nghiem_thu_tung_phan', label: 'Nghiệm thu từng phần' },
  { value: 'nghiem_thu_hoan_thanh', label: 'Nghiệm thu hoàn thành' },
  { value: 'khong_dat', label: 'Không đạt yêu cầu' }
] as const;

export const SETTLEMENT_STATUSES = [
  { value: 'chua_quyet_toan', label: 'Chưa quyết toán' },
  { value: 'dang_quyet_toan', label: 'Đang lập hồ sơ quyết toán' },
  { value: 'da_quyet_toan', label: 'Đã phê duyệt quyết toán' },
  { value: 'quyet_toan_xong', label: 'Quyết toán xong & Tất toán' }
] as const;

export const DOCUMENT_TYPES = [
  { value: 'resolution', label: 'Nghị quyết HĐND xã' },
  { value: 'appraisal_decision', label: 'QĐ thành lập Hội đồng thẩm định' },
  { value: 'appraisal_report', label: 'Báo cáo thẩm định chủ trương/BCKTKT' },
  { value: 'investment_policy_decision', label: 'Quyết định chủ trương đầu tư' },
  { value: 'survey_task_decision', label: 'Phê duyệt nhiệm vụ khảo sát' },
  { value: 'survey_method_decision', label: 'Phê duyệt phương án kỹ thuật khảo sát' },
  { value: 'economic_tech_report', label: 'Báo cáo kinh tế - kỹ thuật (Thuyết minh, TK-DT)' },
  { value: 'project_approval_decision', label: 'Quyết định phê duyệt dự án / BCKTKT' },
  { value: 'procurement_plan_decision', label: 'Quyết định phê duyệt KHLCNT' },
  { value: 'bidding_result_decision', label: 'Quyết định phê duyệt kết quả LCNT' },
  { value: 'contract', label: 'Hợp đồng kinh tế xây lắp / tư vấn' },
  { value: 'supervision_diary', label: 'Nhật ký thi công & giám sát' },
  { value: 'acceptance_minutes', label: 'Biên bản nghiệm thu (giai đoạn/hoàn thành)' },
  { value: 'as_built_drawing', label: 'Bản vẽ hoàn công' },
  { value: 'handover_minutes', label: 'Biên bản bàn giao đưa vào sử dụng' },
  { value: 'settlement_report', label: 'Báo cáo quyết toán A-B' },
  { value: 'settlement_decision', label: 'Quyết định phê duyệt quyết toán' },
  { value: 'warranty_letter', label: 'Cam kết/chứng thư bảo hành' },
  { value: 'other', label: 'Tài liệu minh chứng khác' }
] as const;

/**
 * 16 Chuẩn Bước Quy Trình Đầu Tư Công Cấp Xã (Nghĩa Lâm)
 * Đã rà soát căn cứ pháp lý theo Luật ĐTC 2019, Luật Xây dựng, NĐ 40/2020, NĐ 15/2021
 */
export interface WorkflowStepDefinition {
  step_number: number;
  step_code: string;
  step_name: string;
  authority_body: string;
  signatory_type: 'COLLECTIVE' | 'INDIVIDUAL' | 'AUTHORIZED';
  signatory_title: string;
  mandatory_doc_types: string[];
  description: string;
  gate_conditions: string;
  legal_basis: string;
  legal_review_required?: boolean;
}

export const WORKFLOW_16_STEPS: WorkflowStepDefinition[] = [
  {
    step_number: 1,
    step_code: 'STEP_01',
    step_name: 'Đưa dự án vào kế hoạch đầu tư công',
    authority_body: 'HĐND xã',
    signatory_type: 'COLLECTIVE',
    signatory_title: 'TM. HĐND - CHỦ TỊCH',
    mandatory_doc_types: ['resolution'],
    description: 'HĐND xã ban hành Nghị quyết kế hoạch đầu tư công trung hạn hoặc điều chỉnh danh mục hằng năm.',
    gate_conditions: 'Chưa có Nghị quyết của HĐND xã thông qua danh mục thì không được triển khai bước tiếp theo.',
    legal_basis: 'Điều 55, 64 Luật Đầu tư công số 58/2024/QH15; Điều 26 Luật Tổ chức chính quyền địa phương'
  },
  {
    step_number: 2,
    step_code: 'STEP_02',
    step_name: 'Lập và thẩm định Báo cáo đề xuất chủ trương đầu tư',
    authority_body: 'Hội đồng thẩm định UBND xã',
    signatory_type: 'INDIVIDUAL',
    signatory_title: 'Chủ tịch Hội đồng thẩm định',
    mandatory_doc_types: ['appraisal_decision', 'appraisal_report'],
    description: 'Bộ phận Địa chính - Xây dựng lập; Hội đồng thẩm định thẩm định nội dung theo quyết định thành lập.',
    gate_conditions: 'Quyết định thành lập Hội đồng thẩm định phải có trước hoặc cùng ngày Báo cáo thẩm định.',
    legal_basis: 'Điều 27, 40 Luật Đầu tư công số 58/2024/QH15; Điều 8, 9 Nghị định 40/2020/NĐ-CP (áp dụng chuyển tiếp)'
  },
  {
    step_number: 3,
    step_code: 'STEP_03',
    step_name: 'Quyết định chủ trương đầu tư',
    authority_body: 'UBND xã (Tập thể)',
    signatory_type: 'COLLECTIVE',
    signatory_title: 'TM. UBND - CHỦ TỊCH',
    mandatory_doc_types: ['investment_policy_decision'],
    description: 'UBND xã quyết định theo tập thể; hồ sơ bắt buộc có biên bản họp hoặc phiếu lấy ý kiến thành viên UBND xã.',
    gate_conditions: 'Chốt sự cần thiết, quy mô sơ bộ, tổng mức dự kiến, từng nguồn vốn; chưa phải căn cứ giải ngân.',
    legal_basis: 'Điều 18, 27 Luật Đầu tư công số 58/2024/QH15; Quyết định phân cấp của UBND tỉnh Nghệ An'
  },
  {
    step_number: 4,
    step_code: 'STEP_04',
    step_name: 'Lựa chọn đơn vị tư vấn khảo sát, lập BCKTKT',
    authority_body: 'Chủ đầu tư / UBND xã',
    signatory_type: 'INDIVIDUAL',
    signatory_title: 'Chủ tịch UBND xã',
    mandatory_doc_types: ['contract'],
    description: 'Chủ đầu tư ký hợp đồng tư vấn khảo sát và lập Báo cáo kinh tế - kỹ thuật theo hình thức hợp lệ.',
    gate_conditions: 'Có hồ sơ lựa chọn và hợp đồng tư vấn trước khi triển khai khảo sát.',
    legal_basis: 'Điều 20, 23 Luật Đấu thầu số 22/2023/QH15; Điều 78 Nghị định 24/2024/NĐ-CP'
  },
  {
    step_number: 5,
    step_code: 'STEP_05',
    step_name: 'Phê duyệt nhiệm vụ khảo sát xây dựng',
    authority_body: 'Chủ đầu tư / UBND xã',
    signatory_type: 'INDIVIDUAL',
    signatory_title: 'Chủ tịch UBND xã',
    mandatory_doc_types: ['survey_task_decision'],
    description: 'Chủ đầu tư phê duyệt nhiệm vụ khảo sát xây dựng xác định mục đích, phạm vi, tiêu chuẩn và khối lượng.',
    gate_conditions: 'Phải phê duyệt nhiệm vụ khảo sát trước khi phê duyệt phương án kỹ thuật khảo sát.',
    legal_basis: 'Điều 73, 74 Luật Xây dựng 2014; Điều 25 Nghị định 15/2021/NĐ-CP'
  },
  {
    step_number: 6,
    step_code: 'STEP_06',
    step_name: 'Phê duyệt phương án kỹ thuật khảo sát',
    authority_body: 'Chủ đầu tư / UBND xã',
    signatory_type: 'INDIVIDUAL',
    signatory_title: 'Chủ tịch UBND xã',
    mandatory_doc_types: ['survey_method_decision'],
    description: 'Chủ đầu tư phê duyệt phương án kỹ thuật khảo sát (có thể gộp với Bước 5 trong một văn bản).',
    gate_conditions: 'Phải duyệt trước khi thực hiện khảo sát thực địa tại hiện trường.',
    legal_basis: 'Điều 74 Luật Xây dựng 2014; Điều 26 Nghị định 15/2021/NĐ-CP'
  },
  {
    step_number: 7,
    step_code: 'STEP_07',
    step_name: 'Thực hiện khảo sát và lập Báo cáo kinh tế - kỹ thuật',
    authority_body: 'Đơn vị tư vấn & Chủ đầu tư',
    signatory_type: 'AUTHORIZED',
    signatory_title: 'Đại diện Tư vấn & Chủ đầu tư',
    mandatory_doc_types: ['economic_tech_report'],
    description: 'Tư vấn lập thuyết minh, thiết kế bản vẽ thi công, dự toán; Chủ đầu tư nghiệm thu kết quả khảo sát.',
    gate_conditions: 'Không dùng hồ sơ chưa nghiệm thu kết quả khảo sát làm căn cứ thẩm định.',
    legal_basis: 'Điều 52, 53, 56 Luật Xây dựng 2014; Điều 10 Nghị định 15/2021/NĐ-CP'
  },
  {
    step_number: 8,
    step_code: 'STEP_08',
    step_name: 'Thẩm định Báo cáo kinh tế - kỹ thuật, thiết kế và dự toán',
    authority_body: 'Cơ quan chuyên môn / Phòng Kinh tế - Hạ tầng',
    signatory_type: 'INDIVIDUAL',
    signatory_title: 'Trưởng phòng / Cơ quan thẩm định',
    mandatory_doc_types: ['appraisal_report'],
    description: 'Thẩm định khối lượng, đơn giá, định mức, cơ cấu chi phí; kiểm tra dự toán không vượt tổng mức đã chốt.',
    gate_conditions: 'Dự toán không được vượt tổng mức đầu tư đã phê duyệt ở Bước 3 nếu chưa điều chỉnh chủ trương.',
    legal_basis: 'Điều 56, 57 Luật Xây dựng (Sửa đổi 2020); Điều 12, 13 Nghị định 15/2021/NĐ-CP'
  },
  {
    step_number: 9,
    step_code: 'STEP_09',
    step_name: 'Phê duyệt dự án / Báo cáo kinh tế - kỹ thuật',
    authority_body: 'Chủ tịch UBND xã',
    signatory_type: 'INDIVIDUAL',
    signatory_title: 'CHỦ TỊCH',
    mandatory_doc_types: ['project_approval_decision'],
    description: 'Quyết định phê duyệt BCKTKT là Quyết định đầu tư đối với công trình lập BCKTKT.',
    gate_conditions: 'Là điều kiện tiên quyết bắt buộc để mở mã dự án, phân bổ vốn và kiểm soát chi.',
    legal_basis: 'Điều 35, 41 Luật Đầu tư công số 58/2024/QH15; Điều 60 Luật Xây dựng 2014; Điều 18 Nghị định 15/2021/NĐ-CP'
  },
  {
    step_number: 10,
    step_code: 'STEP_10',
    step_name: 'Phê duyệt kế hoạch lựa chọn nhà thầu',
    authority_body: 'Chủ tịch UBND xã',
    signatory_type: 'INDIVIDUAL',
    signatory_title: 'CHỦ TỊCH',
    mandatory_doc_types: ['procurement_plan_decision'],
    description: 'Phê duyệt KHLCNT với đầy đủ các gói thầu, giá gói, nguồn vốn, hình thức và loại hợp đồng.',
    gate_conditions: 'Không tổ chức lựa chọn nhà thầu khi KHLCNT chưa được phê duyệt.',
    legal_basis: 'Điều 38, 39, 40 Luật Đấu thầu số 22/2023/QH15; Điều 14, 15 Nghị định 24/2024/NĐ-CP'
  },
  {
    step_number: 11,
    step_code: 'STEP_11',
    step_name: 'Lựa chọn nhà thầu, phê duyệt kết quả và ký hợp đồng',
    authority_body: 'Chủ đầu tư & Nhà thầu',
    signatory_type: 'INDIVIDUAL',
    signatory_title: 'Chủ tịch UBND xã / Đại diện Nhà thầu',
    mandatory_doc_types: ['bidding_result_decision', 'contract'],
    description: 'Phê duyệt kết quả lựa chọn nhà thầu và tiến hành ký kết hợp đồng thi công xây lắp, tư vấn giám sát.',
    gate_conditions: 'Tuyệt đối không cho phép thi công khi chưa có hợp đồng xây lắp hợp lệ.',
    legal_basis: 'Điều 43, 64-70 Luật Đấu thầu số 22/2023/QH15; Điều 138-146 Luật Xây dựng 2014'
  },
  {
    step_number: 12,
    step_code: 'STEP_12',
    step_name: 'Bố trí kế hoạch vốn hằng năm và giải ngân',
    authority_body: 'Kế toán xã / Kho bạc Nhà nước',
    signatory_type: 'AUTHORIZED',
    signatory_title: 'Chủ tài khoản & Kế toán trưởng',
    mandatory_doc_types: ['resolution'],
    description: 'Dự án phải có quyết định đầu tư (Bước 9) trước thời điểm giao vốn và đăng ký kiểm soát chi KBNN.',
    gate_conditions: 'Không cho giải ngân khi chưa có Quyết định đầu tư hoặc giải ngân vượt kế hoạch vốn đã bố trí.',
    legal_basis: 'Điều 55 Luật Đầu tư công số 58/2024/QH15; Điều 9, 10 Nghị định 99/2021/NĐ-CP'
  },
  {
    step_number: 13,
    step_code: 'STEP_13',
    step_name: 'Thi công và quản lý chất lượng',
    authority_body: 'Nhà thầu, Tư vấn GS, Ban GS đầu tư cộng đồng',
    signatory_type: 'AUTHORIZED',
    signatory_title: 'Chỉ huy trưởng & Giám sát trưởng',
    mandatory_doc_types: ['supervision_diary'],
    description: 'Tổ chức thi công, ghi nhật ký, nghiệm thu từng giai đoạn; phát sinh phải có văn bản chấp thuận trước.',
    gate_conditions: 'Mọi khối lượng phát sinh phải được chấp thuận trước khi thi công; không hợp thức hóa sau.',
    legal_basis: 'Điều 111-122 Luật Xây dựng 2014; Điều 10-18 Nghị định 06/2021/NĐ-CP'
  },
  {
    step_number: 14,
    step_code: 'STEP_14',
    step_name: 'Nghiệm thu hoàn thành và bàn giao đưa vào sử dụng',
    authority_body: 'Chủ đầu tư, Nhà thầu, Tư vấn, Đơn vị thụ hưởng',
    signatory_type: 'AUTHORIZED',
    signatory_title: 'Hội đồng nghiệm thu cơ sở',
    mandatory_doc_types: ['acceptance_minutes', 'as_built_drawing', 'handover_minutes'],
    description: 'Lập biên bản nghiệm thu hoàn thành, hoàn thiện bản vẽ hoàn công và bàn giao cho đơn vị quản lý.',
    gate_conditions: 'Không chuyển hoàn thành khi thiếu biên bản nghiệm thu và bản vẽ hoàn công; ngày NT là mốc tính hạn quyết toán.',
    legal_basis: 'Điều 123, 124 Luật Xây dựng 2014; Điều 21, 22, 23 Nghị định 06/2021/NĐ-CP'
  },
  {
    step_number: 15,
    step_code: 'STEP_15',
    step_name: 'Lập, thẩm tra và phê duyệt quyết toán',
    authority_body: 'Cơ quan thẩm tra & Chủ tịch UBND xã',
    signatory_type: 'INDIVIDUAL',
    signatory_title: 'CHỦ TỊCH',
    mandatory_doc_types: ['settlement_report', 'settlement_decision'],
    description: 'Chủ đầu tư lập báo cáo quyết toán, cơ quan chức năng thẩm tra và Chủ tịch UBND xã ban hành quyết định phê duyệt.',
    gate_conditions: 'Phải có hồ sơ quyết toán A-B, biên bản thẩm tra và quyết định phê duyệt quyết toán hợp pháp.',
    legal_basis: 'Điều 31-47 Nghị định 99/2021/NĐ-CP quy định quản lý, thanh toán, quyết toán dự án sử dụng vốn ĐTC'
  },
  {
    step_number: 16,
    step_code: 'STEP_16',
    step_name: 'Bàn giao quản lý, khai thác, bảo hành, bảo trì và kết thúc',
    authority_body: 'Đơn vị tiếp nhận & Chủ đầu tư',
    signatory_type: 'INDIVIDUAL',
    signatory_title: 'Đại diện Bên giao & Bên nhận',
    mandatory_doc_types: ['warranty_letter'],
    description: 'Bàn giao tài sản cố định vào sổ theo dõi, theo dõi hết hạn bảo hành công trình, tất toán tài khoản dự án.',
    gate_conditions: 'Chỉ hoàn trả tiền bảo hành khi hết hạn bảo hành và nhà thầu hoàn thành đầy đủ nghĩa vụ sửa chữa khuyết tật.',
    legal_basis: 'Điều 125, 126 Luật Xây dựng 2014; Điều 28 Nghị định 06/2021/NĐ-CP; Điều 47 Nghị định 99/2021/NĐ-CP; Thông tư 23/2023/TT-BTC'
  }
];

/**
 * Checklist điện tử trước khi Chủ tịch ký văn bản
 */
export const SIGNING_CHECKLIST_TEMPLATE = [
  { id: 'CHK_01', question: 'Công trình đã có trong Nghị quyết phê duyệt kế hoạch ĐTC của HĐND xã chưa?', category: 'LEGAL' },
  { id: 'CHK_02', question: 'Văn bản thuộc thẩm quyền tập thể hay cá nhân; thể thức ký đúng quy định chưa?', category: 'AUTHORITY' },
  { id: 'CHK_03', question: 'Chủ trương đầu tư đã có biên bản họp hoặc phiếu lấy ý kiến tập thể UBND xã chưa?', category: 'COLLECTIVE_INPUT' },
  { id: 'CHK_04', question: 'Căn cứ pháp lý đã bao gồm Luật Đầu tư công, Luật Xây dựng và văn bản sửa đổi còn hiệu lực chưa?', category: 'LEGAL' },
  { id: 'CHK_05', question: 'Nguồn vốn đã được tách rõ ràng từng nguồn (NS tỉnh/huyện/xã) và số tiền tương ứng chưa?', category: 'FINANCIAL' },
  { id: 'CHK_06', question: 'Dự toán, hợp đồng hoặc giá trị quyết toán có bị vượt tổng mức đầu tư được duyệt không?', category: 'FINANCIAL' },
  { id: 'CHK_07', question: 'Các bước quy trình trước đó đã được nghiệm thu hoàn tất với ngày tháng hợp lý chưa?', category: 'PROCESS' },
  { id: 'CHK_08', question: 'Hồ sơ tài liệu gửi kèm theo đã đầy đủ theo danh mục hồ sơ bắt buộc chưa?', category: 'DOCUMENTATION' }
];

/**
 * RBAC Permission Constants
 */
export const PROJECT_PERMISSIONS = {
  PROJECT_READ: 'PROJECT_READ',
  PROJECT_READ_ASSIGNED: 'PROJECT_READ_ASSIGNED',
  PROJECT_CREATE: 'PROJECT_CREATE',
  PROJECT_UPDATE: 'PROJECT_UPDATE',
  PROJECT_DELETE_DRAFT: 'PROJECT_DELETE_DRAFT',
  PROJECT_UPDATE_APPROVAL: 'PROJECT_UPDATE_APPROVAL',
  PROJECT_UPDATE_CONTRACT: 'PROJECT_UPDATE_CONTRACT',
  PROJECT_UPDATE_FUNDING: 'PROJECT_UPDATE_FUNDING',
  PROJECT_UPDATE_PROGRESS: 'PROJECT_UPDATE_PROGRESS',
  PROJECT_UPDATE_ACCEPTANCE: 'PROJECT_UPDATE_ACCEPTANCE',
  PROJECT_UPDATE_SETTLEMENT: 'PROJECT_UPDATE_SETTLEMENT',
  PROJECT_WORKFLOW_MANAGE: 'PROJECT_WORKFLOW_MANAGE',
  PROJECT_MILESTONE_MANAGE: 'PROJECT_MILESTONE_MANAGE',
  PROJECT_DOCUMENT_MANAGE: 'PROJECT_DOCUMENT_MANAGE',
  PROJECT_EXPORT: 'PROJECT_EXPORT',
  PROJECT_APPROVE: 'PROJECT_APPROVE'
} as const;

/**
 * RBAC Helper Functions: Strict Access Boundary Enforcement
 */
export function canReadProjectsList(user: any): boolean {
  if (!user) return false;
  // Leadership, Admin, and Department Head can see full list
  if (['LEADERSHIP', 'ADMIN'].includes(user.role)) return true;
  if (user.role === 'DEPARTMENT_HEAD' && user.department_id === 3) return true;
  // Employees are filtered in controller query to assigned projects only
  return true;
}

export function canReadProjectDetail(user: any, project: any): boolean {
  if (!user) return false;
  if (['LEADERSHIP', 'ADMIN'].includes(user.role)) return true;
  if (user.role === 'DEPARTMENT_HEAD' && user.department_id === 3) return true;
  // Strictly assigned check for employees
  if (project && (project.project_manager_id === user.id || project.created_by === user.id)) return true;
  return false;
}

export function canCreateProject(user: any): boolean {
  if (!user) return false;
  // Only Leadership and Department Head of Dept 3 can create projects. Employees are forbidden.
  if (user.role === 'LEADERSHIP') return true;
  if (user.role === 'DEPARTMENT_HEAD' && user.department_id === 3) return true;
  return false;
}

export function canUpdateProject(user: any, project: any): boolean {
  if (!user) return false;
  if (user.role === 'LEADERSHIP') return true;
  if (user.role === 'DEPARTMENT_HEAD' && user.department_id === 3) return true;
  if (user.role === 'EMPLOYEE' && user.department_id === 3 && (project.project_manager_id === user.id || project.created_by === user.id)) return true;
  return false;
}

export function canDeleteProject(user: any): boolean {
  if (!user) return false;
  if (user.role === 'LEADERSHIP' || user.role === 'ADMIN') return true;
  return false;
}

export function canUpdateApprovalAndContract(user: any): boolean {
  if (!user) return false;
  if (user.role === 'LEADERSHIP') return true;
  if (user.role === 'DEPARTMENT_HEAD' && user.department_id === 3) return true;
  return false;
}

export function canUpdateAcceptanceAndSettlement(user: any): boolean {
  if (!user) return false;
  if (user.role === 'LEADERSHIP') return true;
  if (user.role === 'DEPARTMENT_HEAD' && user.department_id === 3) return true;
  return false;
}

export function canManageWorkflowSteps(user: any): boolean {
  if (!user) return false;
  if (user.role === 'LEADERSHIP') return true;
  if (user.role === 'DEPARTMENT_HEAD' && user.department_id === 3) return true;
  if (user.role === 'EMPLOYEE' && user.department_id === 3) return true;
  return false;
}

export function canApproveWorkflowStep(user: any): boolean {
  if (!user) return false;
  if (user.role === 'LEADERSHIP') return true;
  if (user.role === 'DEPARTMENT_HEAD' && user.department_id === 3) return true;
  return false;
}

export function canManageDocuments(user: any, project: any): boolean {
  if (!user) return false;
  if (['LEADERSHIP', 'ADMIN'].includes(user.role)) return true;
  if (user.role === 'DEPARTMENT_HEAD' && user.department_id === 3) return true;
  if (project && (project.project_manager_id === user.id || project.created_by === user.id)) return true;
  return false;
}

export function canManageMilestones(user: any, project: any): boolean {
  if (!user) return false;
  if (user.role === 'LEADERSHIP') return true;
  if (user.role === 'DEPARTMENT_HEAD' && user.department_id === 3) return true;
  if (user.role === 'EMPLOYEE' && user.department_id === 3 && (project.project_manager_id === user.id || project.created_by === user.id)) return true;
  return false;
}
