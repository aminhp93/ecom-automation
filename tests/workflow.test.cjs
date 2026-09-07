const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");

const root = path.resolve(__dirname, "..");
const validation = {
  trend_status: "steady",
  trend_growth_pct: null,
  active_competitor_ads: null,
  ads_longevity_days: null,
  review_sentiment_score: 60,
  negative_reviews_mined: [
    { issue: "Risk", frequency: "Unknown", workaround: "Verify sample" },
  ],
  validation_score: 70,
  verdict: "CONDITIONAL_GO",
  verdict_reason: "Requires verification",
};
const competitor = {
  competitors: [
    {
      name: "Example",
      url: "https://example.com",
      selling_price: 20,
      shipping_days: "Unknown",
      rating: 3,
      offer_type: "Single",
      hook_score: 50,
      weakness: "Unknown",
      platform: "WooCommerce",
      shopify_detected: false,
    },
  ],
  outpositioning_strategy: "Test sample",
  price_opportunity: "Compare quotes",
  gap_identified: "Needs research",
};
const supplier = {
  suppliers: [
    {
      source: "Estimate",
      unit_cost: 14,
      shipping_cost: 2,
      moq: 1,
      shipping_method: "Unknown",
      delivery_days: "Unknown",
      reliability_rating: 50,
    },
  ],
  break_even_roas: 7.94,
  target_roas: 12.31,
  profit_projection_100_orders: 90,
  profit_projection_500_orders: 450,
};
const packages = ["A", "B", "C"].map((tier, i) => ({
  tier,
  name: `Pack ${i + 1}`,
  price: 25 * (i + 1),
  value: 25 * (i + 1),
  savings: "None",
  description: "Draft",
  items: [`${i + 1}x item`],
}));
const offer = {
  positioning_statement: "Draft",
  target_desire: "Useful",
  packages,
  risk_reversal_guarantee: "14-day returns only",
  urgency_hook: "View options",
};
const creative = {
  viral_hooks: [
    { id: 1, angle: "Demo", hook_text: "Watch demo", category: "Demo" },
  ],
  video_scripts: [
    {
      title: "Demo",
      framework: "Demo",
      target_length: "30s",
      scenes: [
        {
          time: "0-30s",
          visual: "Product",
          audio: "Description",
          text_overlay: "Demo",
        },
      ],
    },
  ],
  shopify_page: {
    headline: "Item",
    subheadline: "Draft",
    benefits: [{ title: "Feature", desc: "Check sample" }],
    faqs: [{ q: "Returns?", a: "14-day returns only" }],
    html_description: "<p>Draft</p>",
  },
};
function fixture() {
  return structuredClone({
    id: "p",
    revision: 1,
    name: "Test Product",
    source: "manual",
    url: "https://example.com/item",
    image_url: "",
    niche: "Home",
    category: "Home",
    supplier_price: 14,
    shipping_cost: 2,
    selling_price: 20,
    payment_fee: 0.88,
    refund_reserve: 0.6,
    landed_cost: 17.48,
    gross_margin: 2.52,
    margin_percentage: 12.6,
    status: "approved_for_validation",
    shipping_score: 80,
    product_score: 70,
    recommendation: "CONSIDER",
    wow_factor: "Demo",
    target_audience: "Adults",
    pain_points: ["Task"],
    angles: ["Demo"],
    validation,
    competitor_analysis: competitor,
    supplier_economics: supplier,
    offer_package: offer,
    creative_pack: creative,
    pipeline_stage: "06_CREATIVE",
    stage_status: Object.fromEntries(
      ["01", "02", "03", "04", "05", "06"].map((s) => [s, "completed"]),
    ),
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  });
}

// Real workflow modules, isolated filesystem + AI. Never loads .env or writes the workspace's .data.
function harness(
  product = fixture(),
  ai = async () => {
    throw new Error("offline");
  },
) {
  const storeFile = path.join(root, ".data/ecom_store.json");
  const files = new Map([
    [
      storeFile,
      JSON.stringify({
        products: [product],
        workflow_runs: [],
        agent_runs: [],
      }),
    ],
  ]);
  const dirs = new Set([path.dirname(storeFile)]);
  const fakeFs = {
    existsSync: (p) => files.has(p) || dirs.has(p),
    mkdirSync(p, opts) {
      if (dirs.has(p) && !opts?.recursive) throw new Error("EEXIST");
      dirs.add(p);
    },
    rmdirSync: (p) => dirs.delete(p),
    readFileSync(p) {
      if (!files.has(p)) throw new Error("ENOENT");
      return files.get(p);
    },
    writeFileSync: (p, value) => files.set(p, value),
    renameSync(a, b) {
      files.set(b, files.get(a));
      files.delete(a);
    },
  };
  const cache = new Map();
  const aiRouter = {
    run: async (request) => {
      const data = await ai(request);
      return {
        provider: "mock",
        model: "test",
        data,
        latencyMs: 0,
        costUsd: 0,
        usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0 },
      };
    },
  };
  function load(relative) {
    const filename = path.isAbsolute(relative)
      ? relative
      : path.join(root, relative);
    if (cache.has(filename)) return cache.get(filename).exports;
    const mod = { exports: {} };
    cache.set(filename, mod);
    const source = fs.readFileSync(filename, "utf8");
    const code = ts.transpileModule(source, {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
        esModuleInterop: true,
      },
    }).outputText;
    function localRequire(name) {
      if (name === "fs") return fakeFs;
      if (name === "next/server")
        return {
          NextResponse: { json: (data, init) => Response.json(data, init) },
        };
      if (name.endsWith("/ai/router")) return { aiRouter };
      if (name.startsWith(".") || name.startsWith("@/")) {
        const resolved = name.startsWith("@/")
          ? path.join(root, "src", name.slice(2))
          : path.resolve(path.dirname(filename), name);
        return load(resolved + ".ts");
      }
      return require(name);
    }
    vm.runInNewContext(
      code,
      {
        module: mod,
        exports: mod.exports,
        require: localRequire,
        process: { cwd: () => root },
        console: { log() {}, warn() {}, error() {} },
        structuredClone,
        setTimeout: (fn) => {
          fn();
          return 0;
        },
        Date,
        Math,
        TextEncoder,
        Response,
        ReadableStream,
        setInterval: () => 0,
        clearInterval() {},
      },
      { filename },
    );
    return mod.exports;
  }
  const store = load("src/lib/db/store.ts").ecomStore;
  const run = (n) => {
    const names = {
      "02": ["validation", "runProductValidationWorkflow"],
      "03": ["competitor", "runCompetitorResearchWorkflow"],
      "04": ["supplier", "runSupplierValidationWorkflow"],
      "05": ["offer", "runOfferCreationWorkflow"],
      "06": ["creative", "runCreativeProductionWorkflow"],
    };
    return load(`src/lib/workflows/stage${n}-${names[n][0]}.ts`)[names[n][1]];
  };
  return { load, store, run, files, dirs, fakeFs, storeFile, aiRouter };
}

test("Stage02 rejects incomplete JSON without changing saved data", async () => {
  const h = harness(fixture(), async () => ({ negative_reviews_mined: [] }));
  await assert.rejects(h.run("02")({ productId: "p" }));
  assert.equal(h.store.getProductById("p").revision, 1);
});
test("Stage02 keeps legitimate zero, assigns NO_GO and invalidates every downstream artifact", async () => {
  const h = harness(fixture(), async () => ({
    ...validation,
    validation_score: 0,
    review_sentiment_score: 0,
    verdict: "GO",
  }));
  const { product } = await h.run("02")({ productId: "p" });
  assert.equal(product.validation.validation_score, 0);
  assert.equal(product.validation.review_sentiment_score, 0);
  assert.equal(product.validation.verdict, "NO_GO");
  assert.equal(product.validation.trend_growth_pct, null);
  for (const key of [
    "competitor_analysis",
    "supplier_economics",
    "offer_package",
    "creative_pack",
  ])
    assert.equal(product[key], undefined);
  assert.equal(product.stage_status["06"], "locked");
});
test("Stage02 rejects unknown verdict instead of inventing a passing score", async () => {
  const h = harness(fixture(), async () => ({
    ...validation,
    verdict: "INVALID",
  }));
  await assert.rejects(h.run("02")({ productId: "p" }));
});
test("AI-only positive validation remains conditional and explicitly unverified", async () => {
  const h = harness(fixture(), async () => ({
    ...validation,
    validation_score: 95,
    verdict: "GO",
  }));
  const { validation: v } = await h.run("02")({ productId: "p" });
  assert.equal(v.verdict, "CONDITIONAL_GO");
  assert.equal(v.requires_review, true);
  assert.equal(v.active_competitor_ads, null);
});
test("Stage03 never forces a WooCommerce or search URL into verified Shopify", async () => {
  const h = harness(fixture(), async () => competitor);
  const result = await h.run("03")({ productId: "p" });
  const c = result.competitorAnalysis.competitors[0];
  assert.equal(c.shopify_detected, false);
  assert.equal(c.shopify_theme, undefined);
  assert.equal(c.products_json_url, undefined);
  assert.equal(result.competitorAnalysis.requires_review, true);
});
test("All downstream stages reject a rejected product even with old artifacts", async () => {
  for (const stage of ["02", "03", "04", "05", "06"]) {
    const p = fixture();
    p.status = "rejected";
    const h = harness(p);
    await assert.rejects(
      h.run(stage)({ productId: "p", allowNoGoOverride: true }),
      /duyệt/,
    );
  }
});
test("NO_GO requires explicit Stage03 override; override is cleared on new validation", async () => {
  const p = fixture();
  p.validation.verdict = "NO_GO";
  const h = harness(p, async (req) =>
    req.task === "market_extraction" ? validation : competitor,
  );
  await assert.rejects(h.run("06")({ productId: "p" }), /NO_GO/);
  await h.run("03")({ productId: "p", allowNoGoOverride: true });
  assert.equal(h.store.getProductById("p").no_go_override, true);
  await h.run("02")({ productId: "p" });
  assert.equal(h.store.getProductById("p").no_go_override, undefined);
});
test("Stage04 rejects negative and zero margin instead of clamping to 0.01", async () => {
  for (const price of [30, 18.52]) {
    const p = fixture();
    p.supplier_price = price;
    p.shipping_cost = 0;
    const h = harness(p);
    await assert.rejects(h.run("04")({ productId: "p" }), /Margin/);
    assert.equal(h.store.getProductById("p").revision, 1);
  }
});
test("Stage04 recomputes valid economics and labels suppliers as estimates", async () => {
  const h = harness();
  const { supplierEconomics: s } = await h.run("04")({ productId: "p" });
  assert.ok(s.target_roas > s.break_even_roas);
  assert.ok(s.ad_spend_projection_100 >= 0);
  assert.equal(
    s.net_profit_projection_100_orders,
    s.gross_margin_pool_100 - s.ad_spend_projection_100,
  );
  assert.equal(s.data_quality, "estimated");
  assert.ok(!s.suppliers.some((s) => s.badge === "CJ API Connected"));
});
test("Bundle price floor prevents loss; savings computed from actual reference price", async () => {
  const h = harness();
  const { offerPackage: o, product } = await h.run("05")({ productId: "p" });
  for (const item of o.packages) {
    assert.ok(item.contribution > 0);
    assert.equal(item.quantity, ["A", "B", "C"].indexOf(item.tier) + 1);
    assert.equal(item.items.length, 1);
    if (item.value > item.price)
      assert.equal(
        item.savings,
        `Tiết kiệm ${Math.round(((item.value - item.price) / item.value) * 10000) / 100}%`,
      );
    else assert.equal(item.savings, "Không giảm giá");
  }
  assert.equal(product.creative_pack, undefined);
  assert.equal(product.stage_status["06"], "pending");
  assert.ok(!JSON.stringify(o).includes("84%"));
  assert.ok(!JSON.stringify(o).includes("35 suất"));
});
test("Empty offer packages and incomplete creative are rejected before any commit", async () => {
  for (const [stage, data] of [
    ["05", { packages: [] }],
    ["06", { viral_hooks: [] }],
  ]) {
    const h = harness(fixture(), async () => data);
    await assert.rejects(h.run(stage)({ productId: "p" }));
    assert.equal(h.store.getProductById("p").revision, 1);
    assert.notEqual(h.store.getProductById("p").pipeline_stage, "LAUNCH_READY");
  }
});
test("Fallback creative CTA uses the selected offer guarantee, never fixed 60 days", async () => {
  const h = harness();
  const { creativePack: c, product } = await h.run("06")({ productId: "p" });
  const cta = c.video_scripts[0].scenes.at(-1).audio;
  assert.ok(cta.includes("14-day returns only"));
  assert.ok(!cta.includes("BOGO 50%"));
  assert.ok(!cta.includes("60 ngày"));
  assert.equal(product.pipeline_stage, "06_CREATIVE");
  assert.equal(c.requires_review, true);
});
test("A late AI response cannot overwrite inputs changed during the run", async () => {
  const h = harness(fixture(), async () => {
    h.store.updateProductStatus("p", "rejected");
    return creative;
  });
  await assert.rejects(h.run("06")({ productId: "p" }), /thay đổi/);
  const saved = h.store.getProductById("p");
  assert.equal(saved.status, "rejected");
  assert.equal(saved.creative_pack, undefined);
});
test("Compare-and-swap prevents late downstream commits after a new NO_GO result", () => {
  const h = harness();
  const { commitStage } = h.load("src/lib/workflows/pipeline.ts");
  const a = h.store.getProductById("p");
  const b = h.store.getProductById("p");
  commitStage(a, "02", (p) => {
    p.validation = { ...validation, verdict: "NO_GO" };
  });
  assert.throws(
    () =>
      commitStage(b, "05", (p) => {
        p.offer_package = offer;
      }),
    /thay đổi/,
  );
  assert.equal(h.store.getProductById("p").validation.verdict, "NO_GO");
});
test("Cross-process lock contention fails closed", () => {
  const h = harness();
  h.dirs.add(`${h.storeFile}.lock`);
  assert.throws(() => h.store.updateProductStatus("p", "rejected"), /lock/);
  assert.equal(h.store.getProductById("p").status, "approved_for_validation");
});
test("Persistence failures propagate; no silent success", () => {
  const h = harness();
  h.fakeFs.renameSync = () => {
    throw new Error("disk full");
  };
  assert.throws(
    () => h.store.updateProductStatus("p", "rejected"),
    /Không lưu/,
  );
  assert.equal(h.store.getProductById("p").status, "approved_for_validation");
  assert.equal(h.dirs.has(`${h.storeFile}.lock`), false);
});
test("Corrupt store never silently reseeds over existing data", () => {
  const h = harness();
  h.files.set(h.storeFile, "invalid json");
  assert.throws(() => h.store.getProducts(), /Không đọc/);
  assert.equal(h.files.get(h.storeFile), "invalid json");
});
test("Invalid financial input is rejected; zero margin never gets TEST", () => {
  const h = harness();
  const { calculateFinancials, calculateProductScore } = h.load(
    "src/lib/tools/scoring.ts",
  );
  for (const bad of [NaN, Infinity, -1])
    assert.throws(() =>
      calculateFinancials({
        supplier_price: bad,
        shipping_cost: 2,
        selling_price: 20,
      }),
    );
  for (const bad of [0, NaN, Infinity, -1])
    assert.throws(() =>
      calculateFinancials({
        supplier_price: 5,
        shipping_cost: 2,
        selling_price: bad,
      }),
    );
  const s = calculateProductScore({
    demand: 100,
    competition: 100,
    margin: 0,
    creative: 100,
    problem: 100,
    shipping: 100,
  });
  assert.equal(s.recommendation, "KILL");
});
test("Product API rejects malformed prices before invoking AI", async () => {
  let calls = 0;
  const h = harness(fixture(), async () => {
    calls++;
    return {};
  });
  const { POST } = h.load("src/app/api/products/route.ts");
  for (const bad of ["abc", null, "", Infinity, -1]) {
    const response = await POST({
      json: async () => ({ name: "New", supplier_price: bad }),
    });
    assert.equal(response.status, 400);
  }
  assert.equal(calls, 0);
});

test('Workflow API validates override types and records failed attempts', async () => {
  const h=harness(fixture(),async()=>({viral_hooks:[]}));
  const {POST}=h.load('src/app/api/workflows/run-stage/route.ts');
  for(const body of [null,[],{productId:'p',stage:'12'},{productId:'p',stage:'03',allowNoGoOverride:'false'}]) {
    assert.equal((await POST({json:async()=>body})).status,400);
  }
  const response=await POST({json:async()=>({productId:'p',stage:'06'})});
  const events=await response.text();
  assert.ok(events.includes('"type":"error"'));
  const runs=JSON.parse(h.files.get(h.storeFile)).workflow_runs;
  assert.equal(runs.length,1); assert.equal(runs[0].status,'failed');
  assert.ok(runs[0].completed_at); assert.equal(h.store.getProductById('p').revision,1);
});
test('Workflow API success has one run ID, accurate logs and no automatic launch', async () => {
  const h=harness(fixture(),async()=>creative);
  const {POST}=h.load('src/app/api/workflows/run-stage/route.ts');
  const response=await POST({json:async()=>({productId:'p',stage:'06'})});
  await response.text();
  const runs=JSON.parse(h.files.get(h.storeFile)).workflow_runs;
  assert.equal(runs.length,1); assert.equal(runs[0].status,'completed');
  assert.ok(runs[0].logs.some(e=>e.type==='done'));
  assert.notEqual(h.store.getProductById('p').pipeline_stage,'LAUNCH_READY');
});
test('Discovery rerun deduplicates without overwriting existing product or revision', async () => {
  const h=harness(fixture(),async()=>({demand_score:0,competition_score:0,creative_score:0,problem_score:0,shipping_score:0}));
  const run=h.load('src/lib/workflows/stage01-discovery.ts').runProductDiscoveryWorkflow;
  await run({niche:'baby'});
  const before=JSON.stringify(h.store.getProducts());
  await run({niche:'baby'});
  assert.equal(JSON.stringify(h.store.getProducts()),before);
  const generated=h.store.getProducts().find(p=>p.id!=='p');
  assert.equal(generated.demand_score,0); assert.equal(generated.shipping_score,0);
});
test('Provider fallback tries remaining live providers when primary and secondary fail', async () => {
  const calls=[];
  const source=fs.readFileSync(path.join(root,'src/lib/ai/router.ts'),'utf8');
  const result={provider:'claude',model:'test',data:{ok:true},usage:{inputTokens:0,outputTokens:0,totalTokens:0},costUsd:0,latencyMs:0};
  const provider=name=>class {
    constructor(){this.name=name;this.defaultModel='test';}
    isAvailable(){return true;}
    async generate(){calls.push(name); if(name==='gemini') throw new Error('offline'); if(name==='openai') return {...result,data:undefined}; return result;}
  };
  const classes={gemini:provider('gemini'),openai:provider('openai'),claude:provider('claude'),mock:provider('mock')};
  const mod={exports:{}};
  const code=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
  vm.runInNewContext(code,{module:mod,exports:mod.exports,console:{warn(){}},require:name=>{
    const id=name.split('/').at(-1); return {[id[0].toUpperCase()+id.slice(1)+'Provider']:classes[id],OpenAIProvider:classes.openai};
  }});
  const router=new mod.exports.AIRouter();
  const response=await router.run({task:'market_extraction',prompt:'test',jsonMode:true,skipAutoLog:true});
  assert.equal(response.provider,'claude'); assert.deepEqual(calls,['gemini','openai','claude']);
});
