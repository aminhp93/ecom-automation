'use client';

import { useCallback, useEffect, useState } from 'react';
import { CreativeProcessView } from '@/components/stages/CreativeProcessView';
import { AnglesView, ReferenceView } from './AngleReference';
import { ContentDetail, ContentList, ReviewQueue } from './ContentViews';
import { ChannelsView, PostsView } from './PublishViews';
import { Data } from './types';

type View = 'content' | 'review' | 'angles' | 'posts' | 'channels' | 'reference' | 'process';

export function CreativeStudio() {
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState('');
  const [view, setView] = useState<View>('content');
  const [openId, setOpenId] = useState('');
  const [preset, setPreset] = useState('');

  const load = useCallback(() => {
    fetch('/api/creative-studio', { cache: 'no-store' })
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error || 'Lỗi tải dữ liệu');
        setData(d);
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Lỗi tải dữ liệu'));
  }, []);
  useEffect(load, [load]);

  const toReview = data ? data.contents.filter((c) => c.versions.length > 0 && c.status !== 'idea' && (c.status === 'review' || c.approved?.file !== c.latestFile)).length : 0;
  const go = (v: View) => { setView(v); setOpenId(''); };
  const openContent = (id: string) => { setView('content'); setOpenId(id); };

  const groups: { title: string; items: { id: View; label: string; badge?: number }[] }[] = [
    { title: 'Sản xuất', items: [{ id: 'content', label: 'Nội dung' }, { id: 'review', label: 'Cần duyệt', badge: toReview }, { id: 'angles', label: 'Angle' }] },
    { title: 'Xuất bản', items: [{ id: 'posts', label: 'Bài đăng & lịch' }, { id: 'channels', label: 'Kết nối kênh' }] },
    { title: 'Tham khảo', items: [{ id: 'reference', label: 'Tư liệu đối thủ' }, { id: 'process', label: 'Hướng dẫn quy trình' }] },
  ];
  const detail = data?.contents.find((c) => c.folder === openId);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-base font-semibold text-zinc-900">Creative Studio · Noctanest</h1>
        <p className="text-xs text-zinc-500 mt-1">Từ ý tưởng đến duyệt, chuẩn bị bài và theo dõi trên Instagram, TikTok, Facebook. Ghi nhận thủ công; không tự đăng.</p>
      </div>
      <div className="grid gap-5 md:grid-cols-[190px_1fr]">
        <nav className="space-y-4 text-xs">
          {groups.map((g) => (
            <div key={g.title}>
              <div className="text-[10px] uppercase tracking-wider text-zinc-400 mb-1">{g.title}</div>
              {g.items.map((i) => (
                <button key={i.id} type="button" onClick={() => go(i.id)} className={`w-full flex items-center justify-between rounded-md px-2.5 py-1.5 text-left ${view === i.id ? 'bg-zinc-900 text-white' : 'text-zinc-700 hover:bg-zinc-100'}`}>
                  <span>{i.label}</span>
                  {!!i.badge && <span className={`text-[10px] rounded px-1.5 ${view === i.id ? 'bg-white/20' : 'bg-amber-100 text-amber-900'}`}>{i.badge}</span>}
                </button>
              ))}
            </div>
          ))}
        </nav>
        <div className="min-w-0">
          {view === 'process' && (
            <div className="space-y-3">
              <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-xs text-zinc-600">Hướng dẫn quy trình (tham khảo). Trạng thái duyệt và đăng của từng nội dung xem ở Nội dung và Cần duyệt.</div>
              <CreativeProcessView />
            </div>
          )}
          {view !== 'process' && error && <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-xs text-red-800">{error}</div>}
          {view !== 'process' && !error && !data && <div className="p-6 text-xs text-zinc-500">Đang tải…</div>}
          {data && view === 'content' && (detail ? <ContentDetail c={detail} data={data} back={() => setOpenId('')} reload={load} goPost={(id) => { setPreset(id); go('posts'); }} /> : <ContentList data={data} open={setOpenId} />)}
          {data && view === 'review' && <ReviewQueue data={data} reload={load} />}
          {data && view === 'angles' && <AnglesView data={data} reload={load} open={openContent} />}
          {data && view === 'posts' && <PostsView data={data} reload={load} preset={preset} />}
          {data && view === 'channels' && <ChannelsView channels={data.channels} />}
          {data && view === 'reference' && <ReferenceView reference={data.reference} />}
        </div>
      </div>
    </div>
  );
}
