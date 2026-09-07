import fs from 'fs';
import path from 'path';

export interface ProductValidation {
  trend_status: 'surging' | 'steady' | 'declining';
  trend_growth_pct: number;
  active_competitor_ads: number;
  ads_longevity_days: number;
  review_sentiment_score: number;
  negative_reviews_mined: Array<{ issue: string; frequency: string; workaround: string }>;
  validation_score: number;
  verdict: 'GO' | 'CONDITIONAL_GO' | 'NO_GO';
  verdict_reason: string;
}

export interface CompetitorItem {
  name: string;
  url: string;
  selling_price: number;
  shipping_days: string;
  rating: number;
  offer_type: string;
  hook_score: number;
  weakness: string;
}

export interface CompetitorAnalysis {
  competitors: CompetitorItem[];
  outpositioning_strategy: string;
  price_opportunity: string;
  gap_identified: string;
}

export interface SupplierOption {
  source: string;
  unit_cost: number;
  moq: number;
  shipping_method: string;
  shipping_cost: number;
  delivery_days: string;
  reliability_rating: number;
}

export interface SupplierEconomics {
  suppliers: SupplierOption[];
  break_even_roas: number;
  target_roas: number;
  profit_projection_100_orders: number;
  profit_projection_500_orders: number;
}

export interface OfferPackageItem {
  tier: 'A' | 'B' | 'C';
  name: string;
  badge?: string;
  price: number;
  value: number;
  savings: string;
  description: string;
  items: string[];
}

export interface OfferPackage {
  positioning_statement: string;
  target_desire: string;
  packages: OfferPackageItem[];
  risk_reversal_guarantee: string;
  urgency_hook: string;
}

export interface SceneItem {
  time: string;
  visual: string;
  audio: string;
  text_overlay: string;
}

export interface VideoScript {
  title: string;
  framework: string;
  target_length: string;
  scenes: SceneItem[];
}

export interface CreativePack {
  viral_hooks: Array<{ id: number; angle: string; hook_text: string; category: string }>;
  video_scripts: VideoScript[];
  shopify_page: {
    headline: string;
    subheadline: string;
    benefits: Array<{ title: string; desc: string }>;
    faqs: Array<{ q: string; a: string }>;
    html_description: string;
  };
}

export interface Product {
  id: string;
  name: string;
  source: 'tiktok' | 'meta_ads' | 'amazon' | 'aliexpress' | 'manual';
  url: string;
  image_url: string;
  niche: string;
  category: string;

  // Financials & Economics
  supplier_price: number;
  selling_price: number;
  shipping_cost: number;
  payment_fee: number;
  refund_reserve: number;
  landed_cost: number;
  gross_margin: number;
  margin_percentage: number;

  // AI 6-factor Scoring (0-100)
  demand_score: number;
  competition_score: number;
  margin_score: number;
  creative_score: number;
  problem_score: number;
  shipping_score: number;
  product_score: number;

  status: 'discovered' | 'approved_for_validation' | 'rejected' | 'testing';
  recommendation: 'TEST' | 'CONSIDER' | 'KILL';
  recommendation_reason: string;

  // Marketing Hooks & Insights
  wow_factor: string;
  target_audience: string;
  pain_points: string[];
  angles: string[];

  // Deep Pipeline Stages (Stages 02 -> 06/07)
  validation?: ProductValidation;
  competitor_analysis?: CompetitorAnalysis;
  supplier_economics?: SupplierEconomics;
  offer_package?: OfferPackage;
  creative_pack?: CreativePack;

  created_at: string;
  updated_at: string;
}

export interface WorkflowEvent {
  id: string;
  timestamp: string;
  type: 'info' | 'search' | 'found' | 'ai_analyze' | 'score' | 'approval' | 'done' | 'error';
  stage: string;
  message: string;
  data?: any;
}

export interface WorkflowRun {
  id: string;
  workflow: string;
  niche: string;
  status: 'running' | 'completed' | 'failed';
  progress: number;
  started_at: string;
  completed_at?: string;
  logs: WorkflowEvent[];
  discovered_count: number;
}

export interface AgentRun {
  id: string;
  workflow_run_id?: string;
  agent: string;
  provider: string;
  model: string;
  task: string;
  input_tokens: number;
  output_tokens: number;
  total_tokens: number;
  cost_usd: number;
  latency_ms: number;
  created_at: string;
}

interface EcomStoreData {
  products: Product[];
  workflow_runs: WorkflowRun[];
  agent_runs: AgentRun[];
}

const DATA_DIR = path.join(process.cwd(), '.data');
const DATA_FILE = path.join(DATA_DIR, 'ecom_store.json');

// Initial seed products with rich sample data for immediate exploration
const SEED_PRODUCTS: Product[] = [
  {
    id: 'prod_snuglet_roller',
    name: 'Snuglet™ Natural Teething Comfort Roller (10ml)',
    source: 'manual',
    url: 'https://snuglet.com/products/snuglet-natural-teething-comfort-roller',
    image_url: '/images/snuglet/roller_01_hero_lifestyle.jpg',
    niche: 'Baby Products',
    category: 'Infant Teething & Natural Sleep Soothing',
    supplier_price: 3.80,
    selling_price: 24.99,
    shipping_cost: 2.90,
    payment_fee: 1.02,
    refund_reserve: 0.75,
    landed_cost: 8.47,
    gross_margin: 16.52,
    margin_percentage: 66.1,
    demand_score: 94,
    competition_score: 72,
    margin_score: 92,
    creative_score: 96,
    problem_score: 95,
    shipping_score: 97,
    product_score: 91.2,
    status: 'approved_for_validation',
    recommendation: 'TEST',
    recommendation_reason: 'Bi lăn thép làm mát 360° kết hợp 100% thảo mộc hữu cơ bôi ngoài quai hàm (không nhét tay bẩn vào miệng). Margin 66.1%, lãi gộp $16.52/đơn, giải quyết dứt điểm cơn khóc lúc 2h sáng.',
    wow_factor: 'Đầu bi lăn thép y tế 360° lướt êm dọc xương hàm dưới, thẩm thấu nhanh trong 30 giây không nhờn rít, hạ nhiệt nướu sưng đau ngay trước giờ ngủ.',
    target_audience: 'Bố mẹ có con 3-18 tháng đang quấy khóc vì mọc răng nứt nướu, mất ngủ về đêm, mẹ bỉm sữa tìm giải pháp hữu cơ an toàn thay thế gel bôi hóa học.',
    pain_points: [
      'Bé đau nhức nướu gào khóc lúc 2h sáng khiến cả gia đình kiệt sức vì mất ngủ liên miên',
      'Gel tra nướu phải thọc ngón tay người lớn vào miệng bé rất mất vệ sinh và dễ bị bé cắn đau',
      'Thuốc giảm đau hóa học hoặc gel tê nhân tạo tiềm ẩn nguy cơ tác dụng phụ đáng lo ngại',
      'Đồ cắn răng bằng nhựa thường xuyên rơi xuống sàn bụi bẩn, phải đun sôi tiệt trùng hàng chục lần mỗi ngày'
    ],
    angles: [
      'Góc 2:14 AM Wakeup (PAS): Cảnh mẹ bế con khóc trong đêm tối mệt mỏi vs Lướt nhẹ bi lăn mát lạnh ru con ngủ say sau 5 phút',
      'Góc Vệ Sinh Không Chạm (No-Touch): Lăn bên ngoài viền hàm dưới — sạch sẽ 100%, không dính bẩn tay, không đưa vi khuẩn vào miệng con',
      'Góc Đối Đầu CopaCalmer: Công thức thảo mộc hữu cơ Organic Camellia & Chamomile cao cấp hơn, giá $24.99 kèm BOGO 50% ($37.48/cặp) đè bẹp đối thủ $29.99',
      'Góc Bác Sĩ Nhi (Pediatrician POV): Tại sao massage làm mát ngoài viền hàm là liệu pháp an toàn và hiệu quả nhất cho trẻ mọc răng'
    ],
    validation: {
      trend_status: 'surging',
      trend_growth_pct: 185,
      active_competitor_ads: 34,
      ads_longevity_days: 28,
      review_sentiment_score: 89,
      negative_reviews_mined: [
        {
          issue: 'Bi lăn kim loại đôi khi bị kẹt rít hoặc chảy quá nhiều dầu khi dốc ngược',
          frequency: '22%',
          workaround: 'Gia công đầu bi thép không gỉ 360° kiểm soát vi áp lực, test 100% độ trơn tru chống rò rỉ trước khi xuất xưởng'
        },
        {
          issue: 'Mùi thảo mộc nhân tạo quá nồng làm bé cay mắt hoặc hắt xì',
          frequency: '17%',
          workaround: 'Cân bằng tỷ lệ dầu hạt hoa trà hữu cơ (Camellia seed oil) và cúc La Mã dịu nhẹ tuyệt đối, 0% hương liệu tổng hợp'
        },
        {
          issue: 'Nắp vặn dễ tuột làm chảy dầu ra túi bỉm sữa đựng đồ',
          frequency: '14%',
          workaround: 'Nâng cấp nắp vặn ren kép Double-Seal Lock chuyên dụng chống sốc và chống tràn khi di chuyển'
        }
      ],
      validation_score: 93,
      verdict: 'GO',
      verdict_reason: 'Nhu cầu tìm kiếm tăng +185% YoY. CopaCalmer và 3 đối thủ duy trì ads sinh lời > 28 ngày trên TikTok/Meta. Nhu cầu mọc răng của trẻ sơ sinh là evergreen quanh năm.'
    },
    competitor_analysis: {
      competitors: [
        {
          name: 'CopaCalmer™ Official',
          url: 'https://www.copacalmer.com',
          selling_price: 29.99,
          shipping_days: '5-9d',
          rating: 4.3,
          offer_type: 'Single Unit + Fake Countdown Timer',
          hook_score: 84,
          weakness: 'Giá bán đơn lẻ đắt ($29.99), ship $4.99, dùng countdown timer giả làm giảm lòng tin, không có combo bundle kèm dụng cụ gặm nướu.'
        },
        {
          name: 'Punkin Butt Teething Oil',
          url: 'https://punkinbutt.example.com',
          selling_price: 14.99,
          shipping_days: '7-12d',
          rating: 4.1,
          offer_type: 'Glass Dropper Bottle',
          hook_score: 65,
          weakness: 'Chai dạng ống nhỏ giọt thủy tinh dễ rơi vỡ nguy hiểm, bắt buộc mẹ phải dùng tay không bôi vào nướu gây dính nhớt và mất vệ sinh.'
        },
        {
          name: 'Camilia Teething Relief (Boiron)',
          url: 'https://boironusa.example.com',
          selling_price: 13.99,
          shipping_days: '3-5d',
          rating: 4.5,
          offer_type: 'Single-dose liquid vials',
          hook_score: 72,
          weakness: 'Ống nước đơn liều bé dễ phun nhè ra ngoài, dùng rất nhanh hết (hộp 30 ống hết trong 4-5 ngày) tốn kém chi phí lâu dài.'
        }
      ],
      outpositioning_strategy: 'Định vị Snuglet là "Hệ thống giảm đau mọc răng không chạm tay" (No-Touch Teething Relief): Kết hợp bi lăn thép làm mát bên ngoài + Tặng kèm ngàm ngậm silicone thực phẩm đạt chuẩn FDA. Không nhét ngón tay bẩn vào miệng con.',
      price_opportunity: 'Định giá $24.99 (rẻ hơn CopaCalmer $5) nhưng đẩy mạnh Gói Cặp Đôi Ngủ Ngon (Buy 1 Get 1 50% = $37.48) đạt AOV cao và Miễn phí vận chuyển (Free US Shipping trên $25).',
      gap_identified: 'CopaCalmer chỉ có 1 chai lăn đơn điệu, không giải quyết được nhu cầu gặm cắn vật lý khi răng nhú lên của bé. Snuglet cung cấp giải pháp kép toàn diện cả bên ngoài lẫn đồ gặm bên trong.'
    },
    supplier_economics: {
      suppliers: [
        {
          source: 'Guangdong Botanical Lab & Newsun OEM',
          unit_cost: 3.80,
          moq: 50,
          shipping_method: 'YunExpress Special Line (Chất lỏng & Mỹ phẩm)',
          shipping_cost: 2.90,
          delivery_days: '6-9d',
          reliability_rating: 96
        },
        {
          source: 'Zhejiang Baby Care Co. (Alibaba Verified)',
          unit_cost: 4.20,
          moq: 100,
          shipping_method: 'CJPacket Sensitive',
          shipping_cost: 3.40,
          delivery_days: '8-12d',
          reliability_rating: 90
        },
        {
          source: 'US Domestic Private Label 3PL',
          unit_cost: 7.50,
          moq: 500,
          shipping_method: 'USPS Ground Advantage',
          shipping_cost: 4.10,
          delivery_days: '2-4d',
          reliability_rating: 98
        }
      ],
      break_even_roas: 1.51,
      target_roas: 2.45,
      profit_projection_100_orders: 1652,
      profit_projection_500_orders: 8260
    },
    offer_package: {
      positioning_statement: 'Giải pháp xoa dịu cơn đau mọc răng hữu cơ không chạm ngón tay đầu tiên với đầu bi lăn thép y tế 360° làm mát tức thì.',
      target_desire: 'Giúp con dứt cơn quấy khóc sưng nướu sau 30 giây để cả con và bố mẹ ngủ trọn giấc suốt đêm.',
      packages: [
        {
          tier: 'A',
          name: '1x Starter Roller (10ml)',
          price: 24.99,
          value: 34.99,
          savings: 'TIẾT KIỆM $10',
          description: '1 chai bi lăn thảo mộc Snuglet™ Comfort Roller dùng trong 30-45 ngày liên tục.',
          items: [
            '1x Snuglet™ Comfort Roller (10ml)',
            'Hướng dẫn massage viền hàm 3 bước từ chuyên gia',
            'Túi vải cotton bảo quản chống bám bụi'
          ]
        },
        {
          tier: 'B',
          badge: 'POPULAR — BÁN CHẠY NHẤT',
          name: '2x Peaceful Nights Twin Pack (Buy 1 Get 1 50% OFF)',
          price: 37.48,
          value: 69.99,
          savings: 'TIẾT KIỆM 46%',
          description: '1 chai để đầu giường phòng ngủ ban đêm + 1 chai để trong túi bỉm sữa mang theo ra ngoài.',
          items: [
            '2x Snuglet™ Comfort Rollers (10ml)',
            'Miễn phí vận chuyển nhanh toàn nước Mỹ (Trị giá $4.99)',
            'Túi nhung du lịch kháng khuẩn',
            'Cam kết bảo hành giấc ngủ 90 ngày'
          ]
        },
        {
          tier: 'C',
          name: 'Complete Day & Night Relief System',
          price: 52.99,
          value: 94.99,
          savings: 'TIẾT KIỆM 50%',
          description: 'Combo tối ưu: 2 chai lăn ban đêm + 1 đồ gặm silicone sao biển Snuglet ban ngày.',
          items: [
            '2x Snuglet™ Comfort Rollers (10ml)',
            '1x Snuglet™ Starfish Sensory Teether (100% Food Grade Silicone)',
            'Free Priority Insured Shipping',
            'Cam kết bảo hành giấc ngủ 90 ngày',
            'VIP Hotline tư vấn chuyên sâu chăm sóc bé mọc răng'
          ]
        }
      ],
      risk_reversal_guarantee: 'Cam kết "Ngủ Ngon Sau 7 Đêm Hoặc Hoàn Tiền 100%": Nếu trong 7 đêm sử dụng bé không bớt quấy khóc và ngủ ngoan hơn, bố mẹ chỉ cần gửi email cho chúng tôi để nhận lại 100% tiền mà không cần gửi trả lại chai đã mở nắp.',
      urgency_hook: 'Đợt chiết xuất thảo mộc hữu cơ tự nhiên Mẻ #4 — Chỉ còn 48 bộ Twin Pack giá ưu đãi mở bán trong kho US hôm nay.'
    },
    creative_pack: {
      viral_hooks: [
        {
          id: 1,
          angle: 'Problem Hook (Mất ngủ 2h sáng)',
          hook_text: 'Nếu đêm qua con bạn thức giấc lúc 2:14 sáng gào khóc vì nứt nướu... đừng vội thọc ngón tay vào miệng bé, xem ngay video này.',
          category: 'Sleep Deprivation'
        },
        {
          id: 2,
          angle: 'Outpositioning CopaCalmer & Gel',
          hook_text: 'Tại sao các bà mẹ Mỹ đang vứt bỏ hết gel tra nướu hóa học để chuyển sang thanh lăn kim loại mát lạnh này?',
          category: 'Competitor Displacement'
        },
        {
          id: 3,
          angle: 'Hygiene & Bacteria Shock',
          hook_text: 'Bạn có biết ngón tay người lớn chứa hàng triệu vi khuẩn khi chạm trực tiếp vào nướu đang rách của con không?',
          category: 'Safety & Hygiene'
        },
        {
          id: 4,
          angle: 'Visual ASMR Cooling Glide',
          hook_text: 'Đầu bi lăn thép 360° lướt nhẹ dọc quai hàm — xem cách cơ mặt bé đang nhăn nhó lập tức giãn ra mỉm cười...',
          category: 'Visual Proof'
        },
        {
          id: 5,
          angle: '100% Organic Purity',
          hook_text: 'Chỉ 5 loại thảo dược hữu cơ nguyên chất: Dầu hoa trà, cúc La Mã và Copaiba. Không một giọt cồn hay chất gây tê nhân tạo.',
          category: 'Ingredient Purity'
        },
        {
          id: 6,
          angle: 'Diaper Bag Lifestyle',
          hook_text: 'Thứ duy nhất mọi bà mẹ bỉm sữa bắt buộc phải có trong túi xách mỗi khi ra ngoài cùng em bé mọc răng.',
          category: 'Lifestyle Habit'
        },
        {
          id: 7,
          angle: 'Pediatrician Authority',
          hook_text: 'Bác sĩ nhi giải thích: Tại sao massage làm mát viền xương hàm ngoài lại hiệu quả gấp 3 lần đồ cắn thông thường?',
          category: 'Doctor Authority'
        },
        {
          id: 8,
          angle: 'Husband / Dad POV',
          hook_text: 'Vợ tôi đã không ngủ một giấc trọn vẹn suốt 2 tuần liền... cho đến khi tôi bí mật mua cho cô ấy món này.',
          category: 'Emotional Storytelling'
        },
        {
          id: 9,
          angle: 'First Impression Unboxing',
          hook_text: 'Cầm trên tay chai lăn Snuglet nắp kim loại: Cảm giác mát lạnh ngay lập tức không cần cất tủ lạnh!',
          category: 'Unboxing Demo'
        },
        {
          id: 10,
          angle: 'Risk-Free Guarantee',
          hook_text: 'Thử trong 7 đêm: Bé ngủ ngon hoặc bạn giữ lại chai và nhận lại 100% tiền. Không có rủi ro nào cả.',
          category: 'Irresistible Offer'
        }
      ],
      video_scripts: [
        {
          title: 'The 2:14 AM Screaming Wakeup (PAS Framework)',
          framework: 'Problem - Agitation - Solution',
          target_length: '35s',
          scenes: [
            {
              time: '0-4s',
              visual: 'Phòng ngủ tối, đồng hồ chỉ 2:14 AM. Mẹ bơ phờ ôm em bé đang khóc thét, tay bé giật mạnh cào vào má vì đau nướu.',
              audio: 'Nếu đêm nào bạn cũng phải thức giấc lúc 2 giờ sáng với một em bé gào khóc không thể dỗ vì nứt nướu...',
              text_overlay: 'POV: 2:14 AM với bé mọc răng 😭'
            },
            {
              time: '4-12s',
              visual: 'Cảnh mẹ dùng ngón tay bôi gel dính nhớt vào miệng bé, bé khóc nhè ra và cắn ngón tay mẹ.',
              audio: 'Đừng cố nhét ngón tay bẩn vào miệng bé nữa. Gel tê hóa học chỉ làm con cay miệng và nôn trớ.',
              text_overlay: 'Gel bôi thông thường: Dơ tay & Bé nhè ra ❌'
            },
            {
              time: '12-25s',
              visual: 'Cận cảnh thanh lăn Snuglet™: Bi lăn thép y tế 360° lướt nhẹ nhàng dọc xương hàm dưới của bé. Bé dừng khóc, cơ mặt giãn ra và mỉm cười.',
              audio: 'Đây là thanh lăn làm mát Snuglet. Bi thép y tế massage hạ nhiệt bên ngoài xương hàm kết hợp dầu hoa cúc La Mã hữu cơ xoa dịu tức thì trong 30 giây.',
              text_overlay: 'Bi lăn thép 360° + Thảo mộc dịu nướu ✨'
            },
            {
              time: '25-35s',
              visual: 'Bé ngủ say bình yên trong nôi. Mẹ mỉm cười cầm gói Twin Pack BOGO 50% có tem bảo hành 90 ngày.',
              audio: 'Đặt ngay Gói Cặp Đôi với ưu đãi Mua 1 Tặng 1 Giảm 50%. Bảo hành bé ngủ ngon sau 7 đêm hoặc hoàn tiền 100%!',
              text_overlay: 'BOGO 50% OFF + Bảo hành giấc ngủ 90 ngày 🛡️'
            }
          ]
        },
        {
          title: 'Outpositioning CopaCalmer & No-Touch Demo',
          framework: 'Comparison & Demonstration',
          target_length: '30s',
          scenes: [
            {
              time: '0-5s',
              visual: 'Đặt chai CopaCalmer bên trái (mờ) vs Chai Snuglet bên phải (sáng bóng, sang trọng nền gỗ mộc).',
              audio: 'Đừng mua dầu lăn mọc răng cho đến khi bạn biết 2 điểm khác biệt sống còn này...',
              text_overlay: 'CopaCalmer vs Snuglet: Có gì khác? 🔍'
            },
            {
              time: '5-16s',
              visual: 'Cận cảnh bi lăn thép của Snuglet lướt êm ái trên da, giọt dầu thực vật trong vắt thẩm thấu ngay sau 10 giây không để lại vệt nhờn.',
              audio: 'Snuglet dùng đầu bi thép y tế làm mát thật sự và 100% dầu hạt hoa trà hữu cơ. Không nhờn rít, không mùi hắc nhân tạo.',
              text_overlay: 'Đầu bi thép y tế 360° + Dầu hữu cơ tự nhiên 🌿'
            },
            {
              time: '16-30s',
              visual: 'Mẹ đặt chai Snuglet nhỏ gọn vào túi bỉm sữa cùng set gặm silicone sao biển.',
              audio: 'Giá chỉ $24.99 kèm chương trình bảo hành hoàn tiền không cần trả hàng. Nhấp link bên dưới để nhận mã giảm giá ra mắt!',
              text_overlay: 'Chỉ $24.99 • Hoàn tiền 100% nếu bé không hợp'
            }
          ]
        }
      ],
      shopify_page: {
        headline: 'Dứt Cơn Quấy Khóc Mọc Răng Trong 30 Giây — Thanh Lăn Thảo Mộc Tự Nhiên Không Cần Chạm Tay',
        subheadline: 'Thiết kế bi lăn thép y tế 360° lướt êm dịu theo viền xương hàm ngoài, kết hợp dầu hoa cúc La Mã hữu cơ hạ nhiệt nướu sưng đau để con và bố mẹ cùng ngủ trọn giấc.',
        benefits: [
          {
            title: 'Đầu bi thép y tế làm mát 360°',
            desc: 'Lướt êm dịu bên ngoài quai hàm, hạ nhiệt vùng nướu căng viêm ngay lập tức mà không cần để trong tủ lạnh.'
          },
          {
            title: 'Vệ sinh 100% — Không chạm ngón tay',
            desc: 'Loại bỏ hoàn toàn nguy cơ lây nhiễm vi khuẩn từ ngón tay người lớn vào vết nứt nướu non nớt của trẻ.'
          },
          {
            title: '100% Hữu cơ & Dược thảo lành tính',
            desc: 'Chiết xuất từ dầu hoa trà (Camellia), cúc La Mã, trầm hương hữu cơ và Vitamin E. Tuyệt đối 0% cồn, 0% paraben, 0% hóa chất gây tê.'
          },
          {
            title: 'Thẩm thấu tức thì — Không nhờn rít',
            desc: 'Công thức dầu nhẹ tự nhiên thấm vào da trong 30 giây, không dính bết ra gối ngủ hay quần áo của bé.'
          }
        ],
        faqs: [
          {
            q: 'Sản phẩm này có dùng được cho trẻ sơ sinh dưới 6 tháng không?',
            a: 'Hoàn toàn an toàn cho trẻ từ 3 tháng tuổi trở lên vì sản phẩm chỉ thoa ngoài da dọc viền hàm, không đưa vào niêm mạc miệng.'
          },
          {
            q: 'Tại sao lại thoa bên ngoài viền hàm thay vì bôi trực tiếp vào nướu?',
            a: 'Xương hàm dưới của trẻ nhỏ có các đầu mút dây thần kinh cảm giác rất gần da. Việc massage làm mát viền hàm ngoài giúp chặn xung truyền tín hiệu đau lên não bộ hiệu quả mà vẫn giữ vệ sinh tuyệt đối.'
          },
          {
            q: 'Một chai 10ml dùng được trong bao lâu?',
            a: 'Đầu bi lăn tiết chế lượng dầu siêu mỏng, 1 chai 10ml dùng được từ 30 đến 45 ngày với tần suất thoa 2-3 lần/ngày.'
          },
          {
            q: 'Chính sách bảo hành và hoàn tiền 90 ngày hoạt động ra sao?',
            a: 'Nếu bé dùng không ưng ý hoặc không ngủ ngoan hơn sau 7 ngày, bạn chỉ cần gửi email cho chúng tôi. Chúng tôi hoàn tiền 100% vào tài khoản mà bạn không cần gửi trả sản phẩm.'
          }
        ],
        html_description: `<div class="snuglet-pdp"><h2>Dứt Cơn Quấy Khóc Mọc Răng Trong 30 Giây</h2><p>Được thiết kế để bố mẹ không còn phải trải qua những đêm 2h sáng thức trắng vì bé đau nhức nướu.</p><ul><li><strong>Bi lăn thép 360°:</strong> Làm mát tức thì không cần tủ lạnh.</li><li><strong>Không chạm tay:</strong> Giữ vệ sinh tuyệt đối cho niêm mạc miệng non nớt của bé.</li><li><strong>100% Dược thảo hữu cơ:</strong> Cúc La Mã, dầu hoa trà, Vitamin E tự nhiên.</li></ul><p><em>Cam kết hoàn tiền 100% trong 90 ngày nếu bé không ngủ ngon hơn.</em></p></div>`
      }
    },
    created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'prod_snuglet_teether',
    name: 'Snuglet™ 3-Piece Sensory Silicone Teether Set',
    source: 'manual',
    url: 'https://snuglet.com/products/snuglet-3-piece-sensory-silicone-teether-set',
    image_url: '/images/snuglet/star-toy/01-hero-colors.jpg',
    niche: 'Baby Products',
    category: 'Đồ chơi gặm nướu giác quan & Silicone thực phẩm',
    supplier_price: 1.14,
    selling_price: 19.99,
    shipping_cost: 2.60,
    payment_fee: 0.88,
    refund_reserve: 0.60,
    landed_cost: 5.22,
    gross_margin: 14.77,
    margin_percentage: 73.9,
    demand_score: 91,
    competition_score: 70,
    margin_score: 96,
    creative_score: 92,
    problem_score: 90,
    shipping_score: 98,
    product_score: 89.5,
    status: 'approved_for_validation',
    recommendation: 'TEST',
    recommendation_reason: '100% Food-grade Platinum Silicone đạt chuẩn FDA/CPSIA, trọng lượng siêu nhẹ 25g, 6 màu pastel hiện đại. Giá vốn $1.14/set 3 cái từ Newsun Silicone, tỷ lệ lãi 73.9% ($14.77 gross margin).',
    wow_factor: 'Bề mặt đa kết cấu mô phỏng tự nhiên tiếp cận đúng vùng răng hàm sâu nhất, siêu dẻo dai bẻ gập 360° không biến dạng, làm lạnh an toàn trong ngăn đông tủ lạnh.',
    target_audience: 'Bố mẹ có con 3-18 tháng trong giai đoạn cắn nhai dữ dội, muốn tập phản xạ cầm nắm giác quan và tìm sản phẩm silicone không chứa BPA.',
    pain_points: [
      'Bé ngứa nướu cắn mọi đồ vật mất vệ sinh trong nhà hoặc cắn chảy máu tay mẹ',
      'Đồ chơi gặm nướu thông thường quá cứng làm tổn thương lợi non nớt của trẻ',
      'Khó vệ sinh cặn bẩn trong các kẽ hở tạo môi trường cho vi khuẩn sinh sôi'
    ],
    angles: [
      'Góc Vật Liệu 100% Platinum Silicone: An toàn tuyệt đối khi đun sôi tiệt trùng 100°C hoặc để ngăn đá làm mát',
      'Góc Trọng Lượng Siêu Nhẹ 25g: Thiết kế ngôi sao thông minh giúp bàn tay tí hon của bé cầm nắm chắc chắn không rơi',
      'Góc Bundle 3 Món: Mua 1 set 3 màu khác nhau để xoay vòng — 1 cái trong ngăn đông, 1 cái bé đang chơi, 1 cái mang đi ngoài đường'
    ],
    validation: {
      trend_status: 'surging',
      trend_growth_pct: 145,
      active_competitor_ads: 24,
      ads_longevity_days: 35,
      review_sentiment_score: 92,
      negative_reviews_mined: [
        {
          issue: 'Đồ gặm silicone hút lông bụi khi rơi xuống nền nhà',
          frequency: '20%',
          workaround: 'Tráng lớp phủ silicone chống tĩnh điện mịn màng (Anti-dust smooth finish) và tặng kèm hộp đựng kháng khuẩn'
        }
      ],
      validation_score: 90,
      verdict: 'GO',
      verdict_reason: 'Thị trường đồ gặm silicone luôn ổn định. Trọng lượng nhẹ 25g tối ưu chi phí vận chuyển quốc tế YunExpress (< $2.60).'
    },
    supplier_economics: {
      suppliers: [
        {
          source: 'Newsun Silicone Products Co., Limited (Guangdong, Diamond)',
          unit_cost: 1.14,
          moq: 20,
          shipping_method: 'YunExpress US Direct',
          shipping_cost: 2.60,
          delivery_days: '7-10d',
          reliability_rating: 98
        }
      ],
      break_even_roas: 1.35,
      target_roas: 2.20,
      profit_projection_100_orders: 1477,
      profit_projection_500_orders: 7385
    },
    created_at: new Date(Date.now() - 3600000 * 6).toISOString(),
    updated_at: new Date().toISOString()
  },
];

class EcomStore {
  private data: EcomStoreData;

  constructor() {
    this.data = this.load();
  }

  private load(): EcomStoreData {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      if (fs.existsSync(DATA_FILE)) {
        const raw = fs.readFileSync(DATA_FILE, 'utf-8');
        return JSON.parse(raw);
      }
    } catch (e) {
      console.warn('Could not read store file, using in-memory default:', e);
    }
    return {
      products: SEED_PRODUCTS,
      workflow_runs: [],
      agent_runs: [],
    };
  }

  private save() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DATA_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (e) {
      console.warn('Could not persist store data:', e);
    }
  }

  // --- Products ---
  getProducts(filters?: { niche?: string; status?: string; minScore?: number }): Product[] {
    this.data = this.load();
    let list = [...this.data.products];
    if (filters?.niche && filters.niche !== 'all') {
      list = list.filter((p) => p.niche.toLowerCase().includes(filters.niche!.toLowerCase()));
    }
    if (filters?.status && filters.status !== 'all') {
      list = list.filter((p) => p.status === filters.status);
    }
    if (filters?.minScore) {
      list = list.filter((p) => p.product_score >= filters.minScore!);
    }
    return list.sort((a, b) => b.product_score - a.product_score);
  }

  getProductById(id: string): Product | undefined {
    this.data = this.load();
    return this.data.products.find((p) => p.id === id);
  }

  saveProduct(product: Product): Product {
    const idx = this.data.products.findIndex((p) => p.id === product.id);
    if (idx >= 0) {
      this.data.products[idx] = { ...product, updated_at: new Date().toISOString() };
    } else {
      this.data.products.unshift(product);
    }
    this.save();
    return product;
  }

  updateProductStatus(id: string, status: Product['status']): Product | undefined {
    const product = this.data.products.find((p) => p.id === id);
    if (product) {
      product.status = status;
      product.updated_at = new Date().toISOString();
      this.save();
      return product;
    }
    return undefined;
  }

  updateProductField<K extends keyof Product>(id: string, key: K, value: Product[K]): Product | undefined {
    const product = this.data.products.find((p) => p.id === id);
    if (product) {
      product[key] = value;
      product.updated_at = new Date().toISOString();
      this.save();
      return product;
    }
    return undefined;
  }

  // --- Workflow Runs ---
  saveWorkflowRun(run: WorkflowRun) {
    const idx = this.data.workflow_runs.findIndex((r) => r.id === run.id);
    if (idx >= 0) {
      this.data.workflow_runs[idx] = run;
    } else {
      this.data.workflow_runs.unshift(run);
    }
    this.save();
  }

  getWorkflowRun(id: string): WorkflowRun | undefined {
    return this.data.workflow_runs.find((r) => r.id === id);
  }

  // --- Agent Runs (Token & Cost tracking) ---
  addAgentRun(run: AgentRun) {
    this.data.agent_runs.unshift(run);
    this.save();
  }

  getStats() {
    const totalProducts = this.data.products.length;
    const approvedProducts = this.data.products.filter(
      (p) => p.status === 'approved_for_validation'
    ).length;
    const totalRuns = this.data.workflow_runs.length;

    let totalTokens = 0;
    let totalCostUsd = 0;
    const providerUsage: Record<string, { calls: number; tokens: number; cost: number }> = {};

    for (const r of this.data.agent_runs) {
      totalTokens += r.total_tokens;
      totalCostUsd += r.cost_usd;
      if (!providerUsage[r.provider]) {
        providerUsage[r.provider] = { calls: 0, tokens: 0, cost: 0 };
      }
      providerUsage[r.provider].calls += 1;
      providerUsage[r.provider].tokens += r.total_tokens;
      providerUsage[r.provider].cost += r.cost_usd;
    }

    return {
      totalProducts,
      approvedProducts,
      totalRuns,
      totalTokens,
      totalCostUsd: Number(totalCostUsd.toFixed(4)),
      providerUsage,
    };
  }
}

export const ecomStore = new EcomStore();
