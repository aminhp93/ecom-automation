import { AIProvider, AIRequest, AIResponse } from '../types';

export class MockProvider implements AIProvider {
  readonly name = 'mock' as const;
  readonly defaultModel = 'local-simulation-v1';

  isAvailable(): boolean {
    return true;
  }

  async generate<T = any>(request: AIRequest): Promise<AIResponse<T>> {
    const latencyMs = 250;
    await new Promise((r) => setTimeout(r, latencyMs));

    let content = 'Phân tích sản phẩm thành công.';
    let data: any = undefined;

    if (request.task === 'product_classification') {
      // stage01 asks for classification AND the 6-factor scores in a single call,
      // so the offline mock must return both (otherwise discovery falls back to rock-bottom scores).
      data = {
        category: 'Baby Care & Safety',
        target_audience: 'New mothers & fathers (infants 3-18 months)',
        pain_points: [
          'Messy food drool causing rash',
          'Sore gums while teething making babies cry at night',
          'Choking hazards with regular chew toys',
        ],
        wow_factor: 'Self-cooling textured surface soothes inflamed gums instantly in 30 seconds',
        angles: [
          'Problem: Sleepless nights from teething distress',
          'Before/After: Fussy screaming baby vs happily self-soothing',
          'Demonstration: Safe food-grade silicone freezing test',
        ],
        marketing_angles: [
          {
            id: 1,
            name: 'Mất ngủ 2h sáng',
            sub_audience: 'Bố mẹ con 4-10 tháng, kiệt sức vì bị đánh thức mỗi đêm',
            core_emotion: 'Tuyệt vọng, kiệt sức, thấy có lỗi',
            belief_to_shift: 'Con mọc răng thì cả nhà phải chịu mất ngủ, rồi cũng qua',
            promise: 'Một cách dỗ con nhanh hơn để cả nhà ngủ tiếp',
            proof_needed: 'Quay cảnh dùng thật lúc tối; không hứa số phút/kết quả cụ thể',
            awareness_level: 'problem_aware',
            recommended_format: 'UGC talking-head mẹ quay trong phòng bé + b-roll',
            hooks: [
              { variation: 'A', platform: 'tiktok', spoken_hook: 'Cần viết lại cụ thể: mô tả đúng khoảnh khắc 2h sáng con thức giấc', visual_first_frame: 'Đồng hồ 2:14 sáng, mẹ bế con trong phòng tối', on_screen_text: 'POV: đêm thứ 5 liên tiếp', why_it_stops_scroll: 'Bố mẹ mất ngủ nhận ra chính mình ngay giây đầu' },
              { variation: 'B', platform: 'meta', spoken_hook: 'Cần viết lại cụ thể', visual_first_frame: 'Cận mặt bé nhăn nhó cắn tay', on_screen_text: 'Chèn bám lời thoại', why_it_stops_scroll: 'Placeholder — cần trau' },
              { variation: 'C', platform: 'both', spoken_hook: 'Cần viết lại cụ thể', visual_first_frame: 'Mẹ ngáp, quầng thâm mắt', on_screen_text: 'Chèn bám lời thoại', why_it_stops_scroll: 'Placeholder — cần trau' },
            ],
          },
          {
            id: 2,
            name: 'Không muốn dùng gel gây tê hoá chất',
            sub_audience: 'Bố mẹ ưu tiên tự nhiên, dè chừng thuốc/gel bôi',
            core_emotion: 'Lo lắng, muốn bảo vệ con',
            belief_to_shift: 'Gel bôi nướu là chuẩn và an toàn',
            promise: 'Một lựa chọn không cần bôi hoạt chất vào miệng con',
            proof_needed: 'Đối chiếu bảng thành phần / tài liệu nhà sản xuất, không tự khẳng định an toàn',
            awareness_level: 'solution_aware',
            recommended_format: 'So sánh cách cũ vs cách mới (không dàn dựng kết quả)',
            hooks: [
              { variation: 'A', platform: 'tiktok', spoken_hook: 'Cần viết lại cụ thể', visual_first_frame: 'Tay đang vặn nắp tuýp gel rồi dừng lại', on_screen_text: 'Đọc kỹ thành phần trước khi bôi cho con', why_it_stops_scroll: 'Chạm nỗi lo hoá chất' },
              { variation: 'B', platform: 'meta', spoken_hook: 'Cần viết lại cụ thể', visual_first_frame: 'Hai sản phẩm đặt cạnh nhau', on_screen_text: 'Chèn bám lời thoại', why_it_stops_scroll: 'Placeholder — cần trau' },
              { variation: 'C', platform: 'both', spoken_hook: 'Cần viết lại cụ thể', visual_first_frame: 'Mẹ đọc nhãn dưới ánh đèn', on_screen_text: 'Chèn bám lời thoại', why_it_stops_scroll: 'Placeholder — cần trau' },
            ],
          },
        ],
        demand_score: 78,
        competition_score: 62,
        creative_score: 82,
        problem_score: 80,
        shipping_score: 84,
      };
      content = JSON.stringify(data, null, 2);
    } else if (request.task === 'product_scoring') {
      data = {
        demand_score: 88,
        competition_score: 64,
        margin_score: 92,
        creative_score: 90,
        problem_score: 86,
        shipping_score: 82,
        recommendation: 'TEST',
        reason: 'Strong visual problem-solving angle, 74% gross margin, active TikTok momentum',
      };
      content = JSON.stringify(data, null, 2);
    } else {
      content = 'Phản hồi từ AI OS: Tác vụ đã được phân tích theo các tiêu chuẩn Dropshipping.';
    }

    return {
      provider: 'mock',
      model: this.defaultModel,
      content,
      data: data as T,
      usage: {
        inputTokens: 250,
        outputTokens: 180,
        totalTokens: 430,
      },
      costUsd: 0.0,
      latencyMs,
    };
  }
}
