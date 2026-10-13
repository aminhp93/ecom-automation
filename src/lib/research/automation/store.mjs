export function createStore({ url = process.env.SUPABASE_URL, key = process.env.SUPABASE_PUBLISHABLE_KEY, fetcher = fetch } = {}) {
  if (!url || !key) throw new Error('Thiếu cấu hình Supabase');
  async function request(path, body) {
    // Retry reads only. RPC writes have their own idempotency/fencing in SQL.
    const attempts = body === undefined ? 3 : 1;
    for (let attempt = 0; attempt < attempts; attempt++) {
      let response;
      try {
        response = await fetcher(`${url}/rest/v1/${path}`, {
          method: body === undefined ? 'GET' : 'POST',
          headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
          body: body === undefined ? undefined : JSON.stringify(body), cache: 'no-store',
          signal: AbortSignal.timeout(15000),
        });
      } catch {
        if (attempt + 1 === attempts) throw new Error('Supabase không phản hồi trong thời gian cho phép');
      }
      if (response?.ok) return response.json();
      if (response && response.status !== 429 && response.status < 500) throw new Error(`Supabase HTTP ${response.status} (${path.split('?')[0]})`);
      if (attempt + 1 === attempts) throw new Error(`Supabase HTTP ${response?.status ?? 'network'}`);
      await new Promise(resolve => setTimeout(resolve, 250 * 2 ** attempt));
    }
  }
  async function load(slug) {
    if (!/^[a-z0-9-]+$/.test(slug)) throw new Error('Slug không hợp lệ');
    const [product] = await request(`v_product_overview?select=*&slug=eq.${slug}`);
    if (!product) throw new Error('Không tìm thấy sản phẩm');
    const id = product.product_id;
    const keyword = encodeURIComponent(product.keyword ?? '');
    const results = await Promise.all([
      request(`amazon_keyword_snapshots?select=*&keyword=eq.${keyword}&market=eq.AU&order=captured_on.desc&limit=2`),
      request(`trend_snapshots?select=*&keyword=eq.${keyword}&market=eq.AU&order=captured_on.desc&limit=2`),
      request(`product_advertisers?select=*,advertisers(*,advertiser_snapshots(*))&product_id=eq.${id}&advertisers.advertiser_snapshots.order=captured_on.desc&advertisers.advertiser_snapshots.limit=2`),
      request(`supplier_quotes?select=*&product_id=eq.${id}&order=quoted_on.desc&limit=100`),
      request(`decisions?select=*&product_id=eq.${id}&order=decided_on.desc&limit=1`),
      request('criteria_versions?select=version,is_current&is_current=eq.true'),
    ]);
    const [amazon, trends, pages, quotes, decisions, criteria] = results;
    return { product, amazon, trends, pages, quotes, decisions, criteria };
  }
  return { request, load };
}
