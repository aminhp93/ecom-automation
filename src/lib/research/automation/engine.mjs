// Shared by the server-rendered operations page and the standalone Node worker.
// A database audit is not a fresh market collection and never approves Gate A.
export const POLICY_VERSION = 'monitor-v1';
export const dayVN = (now = new Date()) => new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit',
}).format(now);

export function dueDay(now = new Date()) {
  const hour = Number(new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Ho_Chi_Minh', hour: '2-digit', hourCycle: 'h23',
  }).format(now));
  return hour >= 6 ? dayVN(now) : null;
}

export function ageDays(date, today) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date ?? '')) return null;
  const age = (Date.parse(today) - Date.parse(date)) / 86400000;
  return Number.isFinite(age) && age >= 0 ? age : null;
}

export function evaluate(input, today = dayVN()) {
  const { product, amazon = [], trends = [], pages = [], quotes = [], decisions = [], criteria = [] } = input;
  if (!product?.product_id) throw new Error('Không tìm thấy sản phẩm');
  const tasks = [];
  const add = (key, title, detail, kind = 'research') => tasks.push({ key, title, detail, kind });
  const current = criteria.filter(c => c.is_current);
  if (current.length !== 1 || product.score_version !== current[0].version || ageDays(product.scored_on, today) === null || ageDays(product.scored_on, today) > 7) {
    add('score', 'Cần chấm lại bằng tiêu chí hiện hành', 'Điểm thiếu, quá 7 ngày hoặc không khớp phiên bản hiện hành.');
  }
  const freshness = [];
  function check(key, title, rows, maxDays, valid) {
    const latest = [...rows].sort((a, b) => (b.captured_on ?? '').localeCompare(a.captured_on ?? ''))[0];
    const age = ageDays(latest?.captured_on, today);
    const status = !latest ? 'missing' : age === null || !valid(latest) ? 'invalid' : age > maxDays ? 'stale' : 'fresh';
    freshness.push({ key, title, status, captured_on: latest?.captured_on ?? null, maxDays });
    if (status !== 'fresh') add(key, `Cần cập nhật ${title}`, `Trạng thái: ${status}; lần chụp ${latest?.captured_on ?? 'chưa có'}.`);
  }
  check('amazon-au', 'Amazon AU', amazon, 35, r => Number.isFinite(r.searches) && r.searches >= 0 &&
    /^\d{4}-\d{2}$/.test(r.data_month ?? '') && ageDays(`${r.data_month}-01`, today) !== null && ageDays(`${r.data_month}-01`, today) <= 100);
  check('trends-au', 'Google Trends AU', trends, 35, r => r.market === 'AU');
  const verified = pages.filter(p => p.matches_product === 'yes' && p.advertisers?.kind === 'brand');
  if (!verified.length) add('competitors', 'Xác minh đối thủ đúng sản phẩm ở AU', 'Chưa có brand đã xác minh.');
  const changes = [];
  for (const p of verified) {
    const a = p.advertisers;
    const rows = [...(a.advertiser_snapshots ?? [])].sort((x, y) => y.captured_on.localeCompare(x.captured_on));
    check(`page-${p.page_id}`, `${a.name} · ads AU`, rows, 2, r => Number.isFinite(r.active_au) && r.active_au >= 0);
    const [latest] = rows;
    const previous = rows.find(r => r.captured_on < latest?.captured_on && Number.isFinite(r.active_au));
    if (Number.isFinite(latest?.active_au) && previous && ageDays(latest.captured_on, today) !== null) {
      const delta = latest.active_au - previous.active_au;
      if (delta !== 0) changes.push({ name: a.name, before: previous.active_au, after: latest.active_au, delta, from: previous.captured_on, to: latest.captured_on });
      if ((previous.active_au === 0 && delta > 0) || (previous.active_au > 0 && Math.abs(delta) / previous.active_au > 0.5)) {
        add(`anomaly-${p.page_id}`, `Kiểm tra biến động ${a.name}`, `${previous.active_au} → ${latest.active_au} ads AU; chưa suy ra hiệu quả bán hàng.`);
      }
    }
  }
  // Existing quote rows do not prove SKU matching, tax inclusion or supplier independence.
  const auQuotes = quotes.filter(q => q.ship_to === 'AU');
  const suppliers = new Set(auQuotes.map(q => q.supplier?.trim().toLowerCase()).filter(Boolean));
  add('quotes', 'Xác minh ≥2 báo giá cùng cấu hình về AU', `${suppliers.size} tên nhà cung cấp trong DB; cần kiểm tra độc lập, đúng SKU/size, hiệu lực giá và chi phí đầy đủ.`, 'human');
  add('economics', 'Hoàn thiện unit economics bằng AUD', 'Cần doanh thu thuần, landed cost, phí thanh toán, thuế áp dụng, dự phòng đổi trả/đo sai; thiếu đầu vào thì CAC hòa vốn để trống.', 'human');
  add('sku', 'Xác minh bằng chứng đúng SKU honeycomb có khung', 'Keyword blackout curtains rộng hơn sản phẩm dự định bán; cần bằng chứng nhu cầu, thông số và claims đúng SKU.', 'human');
  const decision = [...decisions].sort((a, b) => b.decided_on.localeCompare(a.decided_on))[0];
  if (!decision || decision.criteria_version !== current[0]?.version) add('decision', 'Duyệt lại quyết định theo tiêu chí hiện hành', `Quyết định gần nhất: ${decision?.criteria_version ?? 'chưa có'}.`, 'human');
  add('brief', 'Duyệt Product Brief trước bàn giao', 'Chỉ bàn giao sau khi đủ bằng chứng, chi phí và phê duyệt của chủ store.', 'human');
  return {
    policy_version: POLICY_VERSION, product_id: product.product_id, slug: product.slug, evaluated_on: today,
    scope: 'audit_existing_snapshots', gate_a: 'not_evaluated', collection_status: 'not_connected',
    summary: `${changes.length} biến động ads; ${freshness.filter(f => f.status !== 'fresh').length} nguồn cần cập nhật; ${tasks.filter(t => t.kind === 'human').length} việc cần bạn.`,
    freshness, changes, tasks, supplier_count_unverified: suppliers.size,
    limitations: ['Đọc snapshot đã có; chưa tự thu thập Topview/Meta.', 'Điểm nghiên cứu không phải xác nhận đủ điều kiện kinh doanh.'],
  };
}
