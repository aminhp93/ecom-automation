'use client';

import Image from 'next/image';
import { Content } from './types';

const mediaUrl = (path: string) => `/api/creative-studio/file?path=${encodeURIComponent(path)}`;
const seconds = (n: number) => `${n.toFixed(1).replace('.', ',')}s`;

export function SceneFlow({ content }: { content: Content }) {
  const anchors = content.anchors ?? [];
  const sourceVideos = content.sourceVideos ?? [];
  const scenes = content.sceneFlow ?? [];
  if (!anchors.length && !scenes.length && !sourceVideos.length) return null;

  return (
    <section className="space-y-4" aria-label="Flow cảnh và ảnh neo">
      {sourceVideos.length > 0 && <div className="rounded-lg border border-zinc-200 bg-white p-4">
        <div className="mb-3">
          <h3 className="text-sm font-semibold text-zinc-900">Input · video nguồn đầy đủ</h3>
          <p className="mt-1 text-[11px] text-zinc-500">Phát trực tiếp tại đây để xem toàn bộ mạch video Guard. Các đoạn dùng tham chiếu được ghi dưới mỗi player; không đưa footage này vào bản Noctanest.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {sourceVideos.map((source) => <figure key={source.id} className="rounded-lg border border-zinc-200 bg-zinc-50 p-3">
            <video src={mediaUrl(source.path)} controls playsInline preload="metadata" aria-label={`Video nguồn đầy đủ ${source.title}`} className="mx-auto max-h-[480px] w-full rounded bg-black object-contain" />
            <figcaption className="mt-2 space-y-1">
              <div className="font-medium text-zinc-900">{source.title} · toàn bộ video</div>
              <div className="text-[11px] text-zinc-500">{source.note}</div>
            </figcaption>
          </figure>)}
        </div>
      </div>}
      <div className="rounded-lg border border-zinc-200 bg-white p-4">
        <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
          <div>
            <h3 className="text-sm font-semibold text-zinc-900">Ảnh neo</h3>
            <p className="mt-1 text-[11px] text-zinc-500">Bản nháp AI để giữ nhân vật, phòng và hình dung sản phẩm nhất quán.</p>
          </div>
          <span className="rounded border border-amber-200 bg-amber-50 px-2 py-1 text-[10px] text-amber-800">Chưa duyệt để đăng</span>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          {anchors.map((anchor) => (
            <figure key={anchor.id} className="overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50">
              <div className="relative aspect-[4/3] bg-zinc-100">
                <Image src={mediaUrl(anchor.path)} alt={`Ảnh neo ${anchor.title}`} fill unoptimized sizes="(max-width: 640px) 100vw, 33vw" className="object-contain" />
              </div>
              <figcaption className="space-y-0.5 p-2">
                <div className="font-medium text-zinc-900">{anchor.title}</div>
                <div className="text-[11px] text-zinc-500">{anchor.note}</div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-zinc-200 bg-white p-4">
        <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
          <div>
            <h3 className="text-sm font-semibold text-zinc-900">Flow video · {seconds(scenes.at(-1)?.end ?? 0)}</h3>
            <p className="mt-1 text-[11px] text-zinc-500">Xem từ trái sang phải. Clip Guard chỉ giúp xem nhịp; các cảnh Noctanest bên dưới đều chưa được tạo.</p>
          </div>
          <span className="rounded border border-zinc-200 bg-zinc-50 px-2 py-1 text-[10px] text-zinc-600">Storyboard · chưa phải video dựng</span>
        </div>
        <div className="mb-3 flex h-2 overflow-hidden rounded-full bg-zinc-100" aria-hidden="true">
          {scenes.map((scene, i) => <div key={scene.id} style={{ flex: scene.end - scene.start }} className={i % 2 ? 'bg-violet-300' : 'bg-violet-500'} />)}
        </div>
        <ol className="grid gap-3 lg:grid-cols-3 2xl:grid-cols-6">
          {scenes.map((scene, index) => {
            const refs = scene.reference ?? [];
            const primary = refs[0];
            const sceneAnchors = anchors.filter((a) => scene.anchorIds.includes(a.id));
            return (
              <li key={scene.id} className="min-w-0 overflow-hidden rounded-lg border border-zinc-200 bg-white">
                <div className="flex items-center justify-between gap-2 border-b border-zinc-100 px-3 py-2">
                  <span className="font-semibold text-violet-800">{String(index + 1).padStart(2, '0')} · {scene.title}</span>
                  <span className="shrink-0 text-[10px] text-zinc-500">{seconds(scene.start)}–{seconds(scene.end)}</span>
                </div>
                <div className="relative aspect-[9/10] bg-zinc-950">
                  {primary ? (
                    <video src={mediaUrl(primary.path)} controls muted playsInline preload="metadata" aria-label={`Clip tham chiếu ${primary.label} cho cảnh ${index + 1}`} className="h-full w-full object-contain" />
                  ) : sceneAnchors[0] ? (
                    <Image src={mediaUrl(sceneAnchors[0].path)} alt={`Ảnh neo minh hoạ cảnh ${index + 1}`} fill unoptimized sizes="(max-width: 1024px) 100vw, 33vw" className="object-contain opacity-85" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-zinc-400">Chưa có hình tham chiếu</div>
                  )}
                  <span className={`absolute left-2 top-2 rounded px-1.5 py-0.5 text-[10px] font-medium ${primary ? 'bg-amber-50 text-amber-900' : 'bg-white/90 text-zinc-700'}`}>
                    {primary ? 'GUARD · THAM CHIẾU' : 'ẢNH NEO · MINH HOẠ'}
                  </span>
                </div>
                <div className="space-y-2 p-3">
                  <p className="min-h-12 leading-relaxed text-zinc-700">{scene.action}</p>
                  <p className="text-[10px] text-zinc-500">Ảnh neo: {sceneAnchors.map((a) => a.title).join(' · ') || '—'}</p>
                  {primary && <p className="text-[10px] text-amber-800">{primary.label}: {primary.note}</p>}
                  {refs.slice(1).map((ref) => <div key={ref.path} className="space-y-1 border-t border-zinc-100 pt-2">
                    <video src={mediaUrl(ref.path)} controls muted playsInline preload="metadata" aria-label={`Clip tham chiếu ${ref.label} cho cảnh ${index + 1}`} className="aspect-video w-full rounded bg-black object-contain" />
                    <p className="text-[10px] text-amber-800">{ref.label}: {ref.note}</p>
                  </div>)}
                  <div className="border-t border-zinc-100 pt-2 text-[10px] font-medium text-zinc-600">
                    {scene.ownScene ? <a href={mediaUrl(scene.ownScene)} target="_blank" rel="noreferrer" className="text-emerald-700 underline">Xem scene Noctanest</a> : 'Scene Noctanest: chưa tạo'}
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
