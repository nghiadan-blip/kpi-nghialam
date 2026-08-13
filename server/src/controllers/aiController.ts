import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || '';
const DEEPSEEK_API_URL = process.env.DEEPSEEK_API_URL || 'https://api.deepseek.com/chat/completions';
const DEEPSEEK_MODEL = process.env.DEEPSEEK_MODEL || 'deepseek-chat';

async function callDeepSeek(messages: Array<{ role: string; content: string }>, maxTokens = 1000): Promise<string> {
  if (!DEEPSEEK_API_KEY) {
    throw new Error('NO_API_KEY');
  }

  const response = await fetch(DEEPSEEK_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
    },
    body: JSON.stringify({
      model: DEEPSEEK_MODEL,
      messages,
      max_tokens: maxTokens,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`DeepSeek API Error: ${response.status} - ${errorText}`);
  }

  const data = (await response.json()) as any;
  return data.choices?.[0]?.message?.content || '';
}

// 1. Generate Evaluation Remarks
export async function generateEvaluationRemark(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { employee_name, position, department, month, score, items, role_type } = req.body;

    const user = req.user;
    if (!user) {
      res.status(401).json({ message: 'Chưa xác thực danh tính.' });
      return;
    }

    const itemsSummary = (items || [])
      .map(
        (it: any, idx: number) =>
          `${idx + 1}. ${it.catalog_name || it.name || 'Sản phẩm'} (Số lượng: ${it.quantity || 1}, Điểm: ${it.self_points || it.points || 0}đ)`
      )
      .join('\n');

    let prompt = '';
    if (role_type === 'SELF') {
      prompt = `Bạn là Trợ lý AI hành chính chuyên nghiệp của UBND xã Nghĩa Lâm.
Hãy viết đoạn Tự nhận xét, đánh giá kết quả công tác trong tháng ${month} cho cán bộ:
- Họ và tên: ${employee_name || user.fullname}
- Chức vụ: ${position || user.position}
- Bộ phận: ${department || user.department_name}
- Tổng điểm tự chấm: ${score} điểm
- Các sản phẩm/nhiệm vụ hoàn thành trong tháng theo Nghị định 335/2025/NĐ-CP:
${itemsSummary}

Yêu cầu:
- Độ dài: 3-5 câu súc tích, văn phong hành chính nhà nước chuẩn mực, khiêm tốn nhưng nêu bật kết quả hoàn thành.
- Cấu trúc: Nêu tinh thần trách nhiệm, mức độ hoàn thành chỉ tiêu/nhiệm vụ được giao theo kế hoạch, sự phối hợp với đồng nghiệp và hướng phát huy trong tháng tới.`;
    } else if (role_type === 'MANAGER') {
      prompt = `Bạn là Trưởng bộ phận / Trưởng phòng tại UBND xã Nghĩa Lâm.
Hãy viết đoạn nhận xét, thẩm định và đánh giá kết quả công tác tháng ${month} cho cán bộ cấp dưới:
- Cán bộ được đánh giá: ${employee_name} (${position}, ${department})
- Tổng điểm thẩm định: ${score} điểm
- Các sản phẩm chuyên môn thực hiện:
${itemsSummary}

Yêu cầu:
- Độ dài: 3-5 câu chuẩn mực theo quy định đánh giá cán bộ công chức (Nghị định 335/2025/NĐ-CP).
- Nêu rõ: Ý thức chấp hành kỷ luật kỷ cương hành chính, chất lượng và tiến độ hồ sơ/sản phẩm công việc, thái độ phục vụ nhân dân, kết luận đồng ý đề nghị xếp loại.`;
    } else {
      prompt = `Bạn là Lãnh đạo UBND xã Nghĩa Lâm (Chủ tịch / Phó Chủ tịch UBND xã).
Hãy viết nhận xét phê duyệt và kết luận xếp loại tháng ${month} cho cán bộ:
- Cán bộ: ${employee_name} (${position}, ${department})
- Điểm phê duyệt chính thức: ${score} điểm
- Các sản phẩm công tác:
${itemsSummary}

Yêu cầu:
- Độ dài: 2-4 câu chuẩn mực quyết định của Lãnh đạo cơ quan.
- Đánh giá tổng quan hiệu quả công tác, tinh thần trách nhiệm, biểu dương (nếu điểm cao) hoặc nhắc nhở khắc phục tồn tại, kết luận xếp loại tháng theo NĐ 335.`;
    }

    try {
      const aiResponse = await callDeepSeek([
        {
          role: 'system',
          content:
            'Bạn là chuyên gia cố vấn chuyển đổi số và quản trị nhân sự công vụ nhà nước Việt Nam, đặc biệt am hiểu Nghị định số 335/2025/NĐ-CP về đánh giá cán bộ, công chức.',
        },
        { role: 'user', content: prompt },
      ]);

      res.status(200).json({
        source: 'deepseek-ai',
        remark: aiResponse.trim(),
      });
      return;
    } catch (apiErr: any) {
      // Fallback: Smart heuristic administrative template
      let fallbackRemark = '';
      const numScore = Number(score) || 80;

      if (role_type === 'SELF') {
        if (numScore >= 90) {
          fallbackRemark = `Trong tháng ${month}, bản thân luôn nêu cao tinh thần trách nhiệm, chấp hành nghiêm túc sự phân công của Lãnh đạo UBND xã và Trưởng bộ phận. Đã chủ động hoàn thành 100% khối lượng công việc và sản phẩm chuyên môn đúng tiến độ, đảm bảo chất lượng theo Nghị định 335/2025/NĐ-CP, không để hồ sơ quá hạn. Tự nhận thấy đủ điều kiện xếp loại Hoàn thành xuất sắc nhiệm vụ.`;
        } else if (numScore >= 70) {
          fallbackRemark = `Trong tháng ${month}, bản thân chấp hành tốt nội quy, quy chế làm việc của cơ quan; hoàn thành tốt các nhiệm vụ chuyên môn được giao theo kế hoạch. Tích cực phối hợp với các bộ phận liên quan giải quyết thủ tục hành chính cho tổ chức và công dân đúng quy định. Tự nhận thấy đủ điều kiện xếp loại Hoàn thành tốt nhiệm vụ.`;
        } else {
          fallbackRemark = `Trong tháng ${month}, bản thân đã cố gắng thực hiện các nhiệm vụ được giao; cơ bản hoàn thành khối lượng công việc. Tháng tới sẽ tiếp tục nỗ lực đẩy nhanh tiến độ xử lý hồ sơ chuyên môn và nâng cao chất lượng công tác tham mưu.`;
        }
      } else if (role_type === 'MANAGER') {
        if (numScore >= 90) {
          fallbackRemark = `Đồng chí ${employee_name || 'cán bộ'} có lập trường tư tưởng vững vàng, chấp hành nghiêm kỷ luật hành chính; năng nổ, trách nhiệm cao trong công việc. Các sản phẩm chuyên môn trong tháng đều hoàn thành vượt chỉ tiêu, hồ sơ giải quyết chính xác, đúng hạn. Trưởng bộ phận nhất trí thẩm định điểm và đề nghị Lãnh đạo UBND xã xếp loại Hoàn thành xuất sắc nhiệm vụ.`;
        } else {
          fallbackRemark = `Đồng chí ${employee_name || 'cán bộ'} chấp hành tốt sự điều hành của bộ phận, giải quyết công việc được giao đúng quy trình và thời hạn quy định. Tinh thần phối hợp công tác tốt, thái độ phục vụ nhân dân hòa nhã. Thống nhất điểm đánh giá và đề nghị Lãnh đạo UBND xã phê duyệt xếp loại.`;
        }
      } else {
        if (numScore >= 90) {
          fallbackRemark = `UBND xã biểu dương tinh thần trách nhiệm, tính chủ động và hiệu quả công tác của đồng chí ${employee_name || ''} trong tháng ${month}. Hồ sơ công việc giải quyết kịp thời, đạt chất lượng cao. Thống nhất phê duyệt điểm số và quyết định xếp loại Hoàn thành xuất sắc nhiệm vụ (Loại A).`;
        } else {
          fallbackRemark = `UBND xã thống nhất với kết quả thẩm định của Trưởng bộ phận. Đồng chí đã hoàn thành tốt các nhiệm vụ được giao trong tháng. Đề nghị tiếp tục phát huy tinh thần trách nhiệm trong các tháng tiếp theo. Phê duyệt kết quả xếp loại theo quy định.`;
        }
      }

      res.status(200).json({
        source: 'smart-template-engine',
        remark: fallbackRemark,
      });
    }
  } catch (err: any) {
    console.error('Lỗi sinh nhận xét AI:', err);
    res.status(500).json({ message: 'Lỗi máy chủ khi sinh nhận xét AI.' });
  }
}

// 2. Suggest Task Details
export async function suggestTaskDetails(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { title, department_name, position } = req.body;

    const prompt = `Bạn là Trợ lý Quản lý Nhiệm vụ của UBND xã Nghĩa Lâm.
Dựa vào tiêu đề công việc: "${title}" dành cho vị trí "${position || 'Cán bộ chuyên môn'}" thuộc "${department_name || 'UBND xã'}".
Hãy đề xuất:
1. Mô tả chi tiết các bước thực hiện (2-3 gạch đầu dòng rõ ràng, đúng thủ tục hành chính).
2. Tiêu chuẩn kết quả đầu ra / Minh chứng cần nộp (Ví dụ: Biên bản, Tờ trình, Báo cáo, Quyết định).
3. Trọng số khuyến nghị (từ 1.0 đến 2.0).

Trả về định dạng văn bản ngắn gọn, thực tế, đúng quy trình hành chính cấp xã Việt Nam.`;

    try {
      const aiResponse = await callDeepSeek([
        {
          role: 'system',
          content: 'Bạn là chuyên gia phân công và kiểm soát công việc hành chính tại chính quyền cơ sở cấp xã.',
        },
        { role: 'user', content: prompt },
      ]);

      res.status(200).json({
        source: 'deepseek-ai',
        suggestion: aiResponse.trim(),
      });
    } catch {
      const fallbackSuggestion = `• Bước 1: Tiếp nhận thông tin, tiến hành rà soát hồ sơ và kiểm tra thực địa (nếu có).\n• Bước 2: Soạn thảo văn bản tham mưu / báo cáo đề xuất theo đúng thẩm quyền và biểu mẫu quy định.\n• Bước 3: Trình Lãnh đạo phê duyệt và bàn giao kết quả; đính kèm bản scan/ảnh biên bản hoàn thành làm minh chứng.`;
      res.status(200).json({
        source: 'smart-template-engine',
        suggestion: fallbackSuggestion,
      });
    }
  } catch (err: any) {
    console.error('Lỗi gợi ý nhiệm vụ AI:', err);
    res.status(500).json({ message: 'Lỗi máy chủ khi gợi ý nhiệm vụ.' });
  }
}

// 3. Interactive Legal & Decree 335 Chat Assistant
export async function chatWithAI(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { messages } = req.body;
    const user = req.user;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      res.status(400).json({ message: 'Danh sách tin nhắn không hợp lệ.' });
      return;
    }

    const systemPrompt = `Bạn là Trợ Lý AI Chuyên Nghiệp của UBND xã Nghĩa Lâm (tỉnh Nghệ An).
Bạn am hiểu sâu sắc:
1. Nghị định số 335/2025/NĐ-CP về đánh giá, xếp loại cán bộ, công chức:
   - Công thức tính điểm sản phẩm: Điểm = Số lượng x (5.0 x Hệ số K).
   - Quy trình đánh giá 3 cấp tuần tự: Cá nhân tự chấm -> Trưởng bộ phận thẩm định -> Lãnh đạo UBND xã phê duyệt.
   - Thang điểm xếp loại: Loại A (Xuất sắc >= 90đ), Loại B (Tốt 70-89đ), Loại C (Hoàn thành 50-69đ), Loại D (Không đạt < 50đ).
2. Quy chế làm việc, phân công nhiệm vụ và thủ tục hành chính tại UBND xã Nghĩa Lâm.

Hãy trả lời ngắn gọn, lịch thiệp, chính xác, có dẫn chứng điều khoản rõ ràng theo phong cách công vụ nhà nước.`;

    const formattedMessages = [
      { role: 'system', content: systemPrompt },
      ...messages.slice(-6).map((m: any) => ({
        role: m.role === 'user' ? 'user' : 'assistant',
        content: String(m.content),
      })),
    ];

    try {
      const reply = await callDeepSeek(formattedMessages, 800);
      res.status(200).json({
        reply: reply.trim(),
        source: 'deepseek-ai',
      });
    } catch {
      // Intelligent contextual rule-based answers
      const lastUserMsg = messages[messages.length - 1]?.content?.toLowerCase() || '';
      let reply = '';

      if (lastUserMsg.includes('cách tính điểm') || lastUserMsg.includes('công thức') || lastUserMsg.includes('hệ số')) {
        reply = `Theo **Nghị định số 335/2025/NĐ-CP**, điểm số của từng sản phẩm/tiêu chí công việc được tính theo công thức:\n\n**Điểm sản phẩm = Số lượng × (5.0 × Hệ số quy đổi K)**\n\nTrong đó:\n- **Điểm chuẩn cơ sở**: Mặc định là 5.0 điểm/sản phẩm chuẩn.\n- **Hệ số quy đổi (K)**: Dao động từ 0.8 đến 2.5 tùy độ phức tạp, mức độ khẩn trương và tính chất chuyên môn của từng nhóm sản phẩm (Phần A, Phần B.I, Phần B.II).`;
      } else if (lastUserMsg.includes('xếp loại') || lastUserMsg.includes('loại a') || lastUserMsg.includes('xuất sắc')) {
        reply = `Khung xếp loại đánh giá tháng của CBCC theo **Nghị định số 335/2025/NĐ-CP** gồm 4 mức:\n\n1. **Hoàn thành xuất sắc nhiệm vụ (Loại A)**: Tổng điểm ≥ 90 điểm.\n2. **Hoàn thành tốt nhiệm vụ (Loại B)**: Tổng điểm từ 70 đến dưới 90 điểm.\n3. **Hoàn thành nhiệm vụ (Loại C)**: Tổng điểm từ 50 đến dưới 70 điểm.\n4. **Không hoàn thành nhiệm vụ (Loại D)**: Tổng điểm dưới 50 điểm.`;
      } else if (lastUserMsg.includes('quy trình') || lastUserMsg.includes('các bước') || lastUserMsg.includes('duyệt')) {
        reply = `Quy trình đánh giá hàng tháng tại UBND xã Nghĩa Lâm gồm 3 bước khép kín:\n\n1. **Bước 1 (Cá nhân)**: Tự kê khai sản phẩm, chấm điểm và nộp phiếu đánh giá trước ngày 25 hàng tháng.\n2. **Bước 2 (Trưởng phòng/bộ phận)**: Thẩm định điểm, ghi nhận xét và chuyển lên Lãnh đạo xã trước ngày 28 hàng tháng.\n3. **Bước 3 (Chủ tịch/Phó Chủ tịch UBND xã)**: Phê duyệt điểm chính thức và ký ban hành kết quả xếp loại trước ngày 30 hàng tháng.`;
      } else {
        reply = `Chào đồng chí ${user?.fullname || 'cán bộ'}! Em là Trợ lý AI của UBND xã Nghĩa Lâm. Em có thể hỗ trợ đồng chí:\n- Tra cứu cách tính điểm & hệ số quy đổi K theo Nghị định 335/2025/NĐ-CP.\n- Giải đáp tiêu chí xếp loại cán bộ tháng (Loại A, B, C, D).\n- Hướng dẫn quy trình giao việc, nộp minh chứng và duyệt đánh giá.\n\nĐồng chí cần hỗ trợ nội dung nào ạ?`;
      }

      res.status(200).json({
        reply,
        source: 'smart-assistant-engine',
      });
    }
  } catch (err: any) {
    console.error('Lỗi đối thoại AI:', err);
    res.status(500).json({ message: 'Lỗi máy chủ khi đối thoại AI.' });
  }
}

// 4. Smart AI Search & Catalog Matching for Task Assignment
export async function matchCatalogItems(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { query, position, department, limit = 8 } = req.body;
    const db = (await import('../config/db')).default;

    const allCatalog = await db('product_catalog').where('status', 'ACTIVE').select('*');

    const cleanQuery = (query || '').toLowerCase().trim();
    const cleanPos = (position || '').toLowerCase().trim();
    const cleanDept = (department || '').toLowerCase().trim();

    if (!cleanQuery && !cleanPos && !cleanDept) {
      res.status(200).json({
        matches: allCatalog.slice(0, Number(limit)).map((item) => ({
          item,
          confidence: 0.9,
          match_reason: 'Danh mục công việc chuẩn',
        })),
        source: 'catalog-default',
      });
      return;
    }

    // Try DeepSeek AI first if query is descriptive
    if (cleanQuery.length >= 4 && DEEPSEEK_API_KEY) {
      try {
        const candidateSlice = allCatalog.slice(0, 100).map((c) => ({
          id: c.id,
          code: c.code,
          name: c.name,
          cat: c.category,
          k: c.coefficient,
        }));

        const prompt = `Bạn là hệ thống AI phân loại và tra cứu danh mục công việc theo Nghị định 335/2025/NĐ-CP của UBND xã Nghĩa Lâm.
Dưới đây là mô tả nhiệm vụ cần giao:
- Yêu cầu/Tiêu đề: "${cleanQuery}"
- Vị trí cán bộ: "${cleanPos || 'Công chức chuyên môn'}"
- Phòng ban: "${cleanDept || 'UBND xã Nghĩa Lâm'}"

Dưới đây là danh sách các mã sản phẩm mẫu trong cơ sở dữ liệu:
${JSON.stringify(candidateSlice)}

Hãy chọn ra từ 3 đến 6 mã ID phù hợp nhất và trả về định dạng JSON hợp lệ dạng mảng:
[{"id": 12, "confidence": 0.95, "reason": "Phù hợp trực tiếp với thủ tục hành chính tiếp dân"}, ...]
Chỉ trả về JSON thuần túy, không kèm văn bản giải thích.`;

        const aiResponse = await callDeepSeek([{ role: 'user', content: prompt }], 400);
        const jsonMatch = aiResponse.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          const results = parsed
            .map((p: any) => {
              const matchedItem = allCatalog.find((c) => c.id === p.id);
              if (!matchedItem) return null;
              return {
                item: matchedItem,
                confidence: p.confidence || 0.85,
                match_reason: p.reason || 'AI DeepSeek khớp nối ngữ nghĩa chính xác',
              };
            })
            .filter(Boolean);

          if (results.length > 0) {
            res.status(200).json({
              matches: results.slice(0, Number(limit)),
              source: 'deepseek-ai',
            });
            return;
          }
        }
      } catch (aiErr) {
        console.warn('DeepSeek match catalog fallback to local scoring:', aiErr);
      }
    }

    // High-performance local semantic scoring engine
    const scored = allCatalog.map((item) => {
      let score = 0;
      const reasons: string[] = [];

      const nameLower = item.name.toLowerCase();
      const codeLower = item.code.toLowerCase();
      const descLower = (item.description || '').toLowerCase();

      // Direct query matches
      if (cleanQuery) {
        const queryTerms = cleanQuery.split(/\s+/).filter((t: string) => t.length > 1);
        let termMatches = 0;
        for (const term of queryTerms) {
          if (nameLower.includes(term)) {
            score += 15;
            termMatches++;
          }
          if (descLower.includes(term)) {
            score += 8;
            termMatches++;
          }
          if (codeLower.includes(term)) {
            score += 20;
            termMatches++;
          }
        }
        if (nameLower.includes(cleanQuery)) {
          score += 40;
          reasons.push(`Khớp chính xác cụm từ "${cleanQuery}"`);
        } else if (termMatches > 0) {
          reasons.push(`Khớp ${termMatches} từ khóa liên quan`);
        }
      }

      // Position / Department affinity matching
      const targetText = `${cleanPos} ${cleanDept}`;
      if (
        (targetText.includes('địa chính') || targetText.includes('xây dựng') || targetText.includes('môi trường') || targetText.includes('nông nghiệp')) &&
        (nameLower.includes('đất') || nameLower.includes('địa chính') || nameLower.includes('xây dựng') || nameLower.includes('quy hoạch') || nameLower.includes('môi trường') || nameLower.includes('nông thôn'))
      ) {
        score += 25;
        reasons.push('Phù hợp chuyên môn Địa chính - Xây dựng');
      }

      if (
        (targetText.includes('tư pháp') || targetText.includes('hộ tịch')) &&
        (nameLower.includes('tư pháp') || nameLower.includes('hộ tịch') || nameLower.includes('chứng thực') || nameLower.includes('khai sinh') || nameLower.includes('kết hôn') || nameLower.includes('hòa giải'))
      ) {
        score += 25;
        reasons.push('Phù hợp chuyên môn Tư pháp - Hộ tịch');
      }

      if (
        (targetText.includes('văn phòng') || targetText.includes('thống kê') || targetText.includes('nội vụ')) &&
        (nameLower.includes('báo cáo') || nameLower.includes('văn phòng') || nameLower.includes('công văn') || nameLower.includes('lưu trữ') || nameLower.includes('tiếp dân') || nameLower.includes('họp'))
      ) {
        score += 25;
        reasons.push('Phù hợp chuyên môn Văn phòng - Thống kê');
      }

      if (
        (targetText.includes('tài chính') || targetText.includes('kế toán')) &&
        (nameLower.includes('tài chính') || nameLower.includes('kế toán') || nameLower.includes('ngân sách') || nameLower.includes('thu chi') || nameLower.includes('thanh quyết toán'))
      ) {
        score += 25;
        reasons.push('Phù hợp chuyên môn Tài chính - Kế toán');
      }

      if (
        (targetText.includes('văn hóa') || targetText.includes('xã hội') || targetText.includes('lao động') || targetText.includes('thương binh')) &&
        (nameLower.includes('văn hóa') || nameLower.includes('xã hội') || nameLower.includes('chính sách') || nameLower.includes('hộ nghèo') || nameLower.includes('thể thao') || nameLower.includes('thông tin'))
      ) {
        score += 25;
        reasons.push('Phù hợp chuyên môn Văn hóa - Xã hội');
      }

      if (
        (targetText.includes('lãnh đạo') || targetText.includes('chủ tịch') || targetText.includes('hđnd')) &&
        (item.category === 'PART_A' || nameLower.includes('chủ trì') || nameLower.includes('chỉ đạo') || nameLower.includes('quyết định') || nameLower.includes('kết luận'))
      ) {
        score += 20;
        reasons.push('Phù hợp nhiệm vụ chỉ đạo Lãnh đạo');
      }

      return {
        item,
        score,
        match_reason: reasons.length > 0 ? reasons.join(' • ') : 'Danh mục công việc Nghị định 335',
      };
    });

    const sorted = scored
      .filter((s) => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, Number(limit))
      .map((s, idx) => ({
        item: s.item,
        confidence: Math.max(0.6, Number((1 - idx * 0.05).toFixed(2))),
        match_reason: s.match_reason,
      }));

    res.status(200).json({
      matches: sorted.length > 0 ? sorted : allCatalog.slice(0, Number(limit)).map((item) => ({
        item,
        confidence: 0.7,
        match_reason: 'Danh mục công việc tiêu chuẩn',
      })),
      source: 'smart-semantic-engine',
    });
  } catch (err: any) {
    console.error('Lỗi tìm kiếm danh mục AI:', err);
    res.status(500).json({ message: 'Lỗi máy chủ khi tìm kiếm danh mục.' });
  }
}

