'use client';

import React, { useEffect, useState } from 'react';

// Step 0 — mindset self-talk, adapted from Leon's "2. Mindset" video (reference/leon/2. mindset).
// Source script: ~/working/roadmap/workspace/MINDSET-LEON-SELF-TALK-EN.md. Reworded, not copied.
// The blanks are filled in by the user and kept only in this browser (localStorage); personal details are not stored in code.

const STORE_KEY = 'dropship_mindset_v2';

type Blanks = { why: string; maxLoss: string; stopOn: string; todayOutput: string };
const EMPTY: Blanks = { why: '', maxLoss: '', stopOn: '', todayOutput: '' };

const SECTIONS: { title: string; body: string[] }[] = [
  {
    title: '1. My why',
    body: [
      "Before I work today, I remind myself why I'm doing this.",
      "Without a reason, I'll quit after the first product test that fails. With one, a bad week is just a bad week.",
    ],
  },
  {
    title: '2. The valley of death',
    body: [
      "Things will stop working: a supplier goes quiet, a number comes back worse than I hoped, a competitor runs six hundred ads and I run none. That's the valley. It isn't proof I'm wrong.",
      "I don't get too excited by the ups or too upset by the downs. I keep my rhythm and keep working.",
      'I change direction only at a criterion I set in advance, not when I feel afraid.',
    ],
  },
  {
    title: '3. Work with focus',
    body: [
      'No half-hearted days. Each morning I do two to four hours of deep, real work on one thing, then build it, look at the numbers, adjust.',
      "I don't need twelve hours. I need one real output a day.",
    ],
  },
  {
    title: '4. Only the important things',
    body: [
      'Twenty percent of the work gives eighty percent of the result. Right now that is: a real supplier quote, my unit economics, one product decision.',
      'Not tuning a button, not polishing a page nobody has seen. The details come only after the three things that decide the outcome work.',
    ],
  },
  {
    title: '5. I accept losing, inside limits I set',
    body: [
      'I will lose some money and some time. Fear freezes people, so I stop being scared of that.',
      'But I say my limit in advance: the most I can lose, and the date or event I stop on. My family safety money is not part of this.',
    ],
  },
  {
    title: '6. Priorities, but not by stepping away from my family or my health',
    body: [
      'Leon says step back from friends and even family. I do not. The people I love are the reason I work.',
      'I protect my sleep, my exercise and my days off. I can step back from noise and from things that do not matter.',
    ],
  },
  {
    title: '7. Reinvest, do not show off',
    body: [
      'When money comes, it goes back into what makes more income and into my safety net, not into feeling like I have made it.',
      'Spending is fine when it removes a named bottleneck and has a cap. A tool I cannot explain is a tool I cancel. Anything not yet approved I still ask first.',
    ],
  },
  {
    title: '8. Test fast, test small',
    body: [
      'One quote, one sample, one video, one test. Small early failures cost less than big late ones.',
      'Fast does not mean reckless: I check every claim, and nothing is published, spent or sent without my approval.',
    ],
  },
  {
    title: '9. A note I keep in mind',
    body: [
      "Leon sells courses and tools, and his numbers are his own. I take the habits, not the promises.",
      'My measure is not a million-dollar month. It is: did I finish the flow and the process I set out to build?',
    ],
  },
];

function Field({ label, value, onChange, rows = 2 }: { label: string; value: string; onChange: (v: string) => void; rows?: number }) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-zinc-700">{label}</span>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        className="mt-1 w-full rounded-md border border-zinc-200 bg-white p-2 text-sm text-zinc-800 focus:outline-none focus:ring-1 focus:ring-zinc-400"
      />
    </label>
  );
}

export function MindsetView() {
  const [b, setB] = useState<Blanks>(EMPTY);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (raw) setB({ ...EMPTY, ...JSON.parse(raw) });
    } catch {
      // storage blocked or corrupt: page still works, it just won't remember
    }
  }, []);

  const set = (k: keyof Blanks) => (v: string) => setB((p) => ({ ...p, [k]: v }));

  const save = () => {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(b));
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    } catch {
      // ignore
    }
  };

  const show = (v: string, fallback: string) => (v.trim() ? v.trim() : fallback);

  return (
    <div className="space-y-6">
      <header>
        <p className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">Step 0</p>
        <h1 className="text-xl font-semibold text-zinc-900">Mindset</h1>
        <p className="text-sm text-zinc-500 mt-1">
          Adapted from Leon&apos;s mindset video. Read the morning lines aloud before work, the evening lines before bed.
        </p>
      </header>

      <section className="rounded-lg border border-zinc-200 bg-white p-4 space-y-3">
        <h2 className="text-sm font-semibold text-zinc-900">Fill in my blanks</h2>
        <p className="text-xs text-zinc-500">Saved only in this browser. Clearing site data erases them.</p>
        <Field label="My why" value={b.why} onChange={set('why')} rows={3} />
        <div className="grid gap-3 md:grid-cols-2">
          <Field label="The most I can lose" value={b.maxLoss} onChange={set('maxLoss')} />
          <Field label="I stop on (date or event)" value={b.stopOn} onChange={set('stopOn')} />
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={save}
            className="rounded-md bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-zinc-700 transition"
          >
            Save
          </button>
          {saved && <span className="text-xs text-emerald-600">Saved</span>}
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-2">
        <div className="rounded-lg border border-zinc-200 bg-white p-4">
          <h2 className="text-sm font-semibold text-zinc-900 mb-2">Morning</h2>
          <ul className="space-y-1.5 text-sm text-zinc-700 list-disc pl-5">
            <li>I know why I&apos;m doing this: {show(b.why, '___')}</li>
            <li>Today I produce one real output, and I do the few things that decide the result.</li>
            <li>
              I can lose inside the limits I set ({show(b.maxLoss, '___')}), and I stop on {show(b.stopOn, '___')}.
            </li>
            <li>I protect my family and my health, because they&apos;re the reason I work.</li>
          </ul>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white p-4 space-y-2">
          <h2 className="text-sm font-semibold text-zinc-900">Evening</h2>
          <ul className="space-y-1.5 text-sm text-zinc-700 list-disc pl-5">
            <li>What real output got done today?</li>
            <li>Did I spend time on something that doesn&apos;t matter?</li>
            <li>Did I stay inside my limits?</li>
            <li>Tomorrow&apos;s output is…</li>
          </ul>
        </div>
      </section>

      <section className="space-y-3">
        {SECTIONS.map((s) => (
          <article key={s.title} className="rounded-lg border border-zinc-200 bg-white p-4">
            <h3 className="text-sm font-semibold text-zinc-900">{s.title}</h3>
            <div className="mt-1.5 space-y-1.5 text-sm text-zinc-600">
              {s.body.map((line) => (
                <p key={line}>{line}</p>
              ))}
            </div>
          </article>
        ))}
      </section>

      <p className="text-[11px] text-zinc-400">
        Source: reference/leon/2. mindset (video and script). Reworded, not copied.
      </p>
    </div>
  );
}
