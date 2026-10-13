'use client';

import Image from 'next/image';
import { Content } from './types';

const mediaUrl = (path: string) => `/api/creative-studio/file?path=${encodeURIComponent(path)}`;
const seconds = (n: number) => `${n.toFixed(1).replace('.', ',')}s`;

export function SceneFlow({ content }: { content: Content }) {
  const anchors = content.anchors ?? [];
  const sourceVideos = content.sourceVideos ?? [];
  const attemptVideos = content.attemptVideos ?? [];
  const scenes = content.sceneFlow ?? [];
  if (!anchors.length && !scenes.length && !sourceVideos.length && !attemptVideos.length) return null;

  return (
    <section className="space-y-4" aria-label="Flow cảnh và ảnh neo">
      {attemptVideos.length > 0 && <div className="rounded-lg border border-amber-200 bg-amber-50/40 p-4">
        <h3 className="text-sm font-semibold text-zinc-900">Lần tạo đầu · cần sửa</h3>
        <p className="mt-1 text-[11px] text-zinc-600">Ba clip Flow đã sinh, lưu để so sánh với prompt sửa. Chưa có clip nào là bản được duyệt.</p>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          {attemptVideos.map((attempt) => <figure key={attempt.id} className="rounded-lg border border-amber-200 bg-white p-2">
            <video src={mediaUrl(attempt.path)} controls muted playsInline preload="metadata" aria-label={attempt.title} className="mx-auto aspect-[9/16] max-h-[440px] w-full rounded bg-black object-contain" />
            <figcaption className="mt-2 text-[11px] leading-relaxed"><p className="font-medium text-zinc-900">{attempt.title}</p><p className="text-zinc-600">{attempt.note}</p></figcaption>
          </figure>)}
        </div>
      </div>}
      {sourceVideos.length > 0 && <div className="rounded-lg border border-zinc-200 bg-white p-4">
        <div className="mb-3">
          <h3 className="text-sm font-semibold text-zinc-900">Input · video nguồn đầy đủ</h3>
          <p className="mt-1 text-[11px] text-zinc-500">Phát trực tiếp tại đây để xem toàn bộ mạch video Guard. Các đoạn dùng tham chiếu được ghi dưới mỗi player; không đưa footage này vào bản Noctanest.</p>
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
          {sourceVideos.map((source) => <figure key={source.id} className="rounded-lg border border-zinc-200 bg-zinc-50 p-3">
            <video src={mediaUrl(source.path)} controls playsInline preload="metadata" aria-label={`Video nguồn đầy đủ ${source.title}`} className="aspect-[9/16] w-full rounded bg-black object-contain" />
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
        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
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
        <ol className="grid grid-cols-2 gap-3 md:grid-cols-5">
          {scenes.map((scene, index) => {
            const refs = scene.reference ?? [];
            const primary = refs[0];
            const sceneAnchors = anchors.filter((a) => scene.anchorIds.includes(a.id));
            const inputImages = scene.inputImages ?? [];
            return (
              <li key={scene.id} className="min-w-0 overflow-hidden rounded-lg border border-zinc-200 bg-white">
                <div className="flex items-center justify-between gap-2 border-b border-zinc-100 px-3 py-2">
                  <span className="font-semibold text-violet-800">{String(index + 1).padStart(2, '0')} · {scene.title}</span>
                  <span className="shrink-0 text-[10px] text-zinc-500">{seconds(scene.start)}–{seconds(scene.end)}</span>
                </div>
                <div className="relative aspect-[9/12] bg-zinc-950">
                  {primary ? (
                    <video src={mediaUrl(primary.path)} controls muted playsInline preload="metadata" aria-label={`Clip tham chiếu ${primary.label} cho cảnh ${index + 1}`} className="h-full w-full object-contain" />
                  ) : inputImages[0] || sceneAnchors[0] ? (
                    <Image src={mediaUrl(inputImages[0] ?? sceneAnchors[0].path)} alt={`Ảnh neo minh hoạ cảnh ${index + 1}`} fill unoptimized sizes="(max-width: 1024px) 100vw, 33vw" className="object-contain opacity-85" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-zinc-400">Chưa có hình tham chiếu</div>
                  )}
                  <span className={`absolute left-2 top-2 rounded px-1.5 py-0.5 text-[10px] font-medium ${primary ? 'bg-amber-50 text-amber-900' : 'bg-white/90 text-zinc-700'}`}>
                    {primary ? 'GUARD · THAM CHIẾU' : 'ẢNH NEO · MINH HOẠ'}
                  </span>
                </div>
                <div className="space-y-2 p-3">
                  <p className="min-h-12 leading-relaxed text-zinc-700">{scene.action}</p>
                  <div>
                    <p className="mb-1 text-[10px] font-medium text-zinc-600">Input cảnh {String(index + 1).padStart(2, '0')} · {sceneAnchors.map((a) => a.title).join(' + ') || '—'}</p>
                    <div className="grid grid-cols-3 gap-1">
                      {inputImages.map((path) => <div key={path} className="relative aspect-square overflow-hidden rounded bg-zinc-100">
                        <Image src={mediaUrl(path)} alt={`Ảnh input ${path.split('/').at(-1)}`} fill unoptimized sizes="100px" className="object-cover" />
                      </div>)}
                    </div>
                  </div>
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
      {scenes.some((scene) => scene.suggestedReferences?.length) && <div className="rounded-lg border border-violet-200 bg-violet-50/40 p-4">
        <h3 className="text-sm font-semibold text-zinc-900">Gợi ý tham chiếu · thay cảnh từ video khác</h3>
        <p className="mt-1 text-[11px] text-zinc-600">Giữ nguyên flow gốc phía trên. Các clip dưới đây là lựa chọn để xem và so sánh, chưa ghép vào Video 3 và chưa được dùng làm footage Noctanest.</p>
        {anchors.length > 0 && <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {anchors.map((anchor) => <figure key={anchor.id} className="flex gap-3 rounded-lg border border-violet-100 bg-white p-2">
            <div className="relative h-32 w-24 shrink-0 overflow-hidden rounded bg-zinc-100"><Image src={mediaUrl(anchor.path)} alt={anchor.title} fill unoptimized sizes="96px" className="object-cover" /></div>
            <figcaption className="text-[11px] leading-relaxed"><p className="font-semibold text-zinc-900">{anchor.title}</p><p className="mt-1 text-zinc-600">{anchor.note}</p></figcaption>
          </figure>)}
        </div>}
        <p className="mt-3 rounded border border-amber-200 bg-amber-50 p-2 text-[11px] text-amber-900">Sản phẩm: cùng một tấm honeycomb có khung màu than cho cửa sổ này. Ảnh concept sản phẩm cũ chưa đối chiếu kích thước và cách lắp; chờ ảnh mẫu thật trước khi khoá hình sản phẩm.</p>
        <ol className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-5">
          {scenes.map((scene, index) => <li key={scene.id} className="rounded-lg border border-violet-100 bg-white p-3">
            <div className="mb-2 font-semibold text-violet-800">{String(index + 1).padStart(2, '0')} · {scene.title}</div>
            {(scene.suggestedReferences ?? []).map((ref) => <figure key={ref.path}>
              <video src={mediaUrl(ref.path)} controls muted playsInline preload="metadata" aria-label={`Gợi ý ${ref.label} thay cảnh ${index + 1}`} className="aspect-[9/12] w-full rounded bg-black object-contain" />
              <figcaption className="mt-2 space-y-1 text-[11px] leading-relaxed">
                <p className="font-medium text-zinc-900">{ref.label}</p>
                <p className="text-zinc-600">{ref.note}</p>
                <p className="text-violet-800">Vì sao: {ref.reason}</p>
              </figcaption>
            </figure>)}
            {scene.suggestedShot && <div className="mt-2 border-t border-violet-100 pt-2 text-[11px] leading-relaxed"><p className="font-semibold text-violet-900">Cảnh Noctanest cần tạo</p><p className="mt-1 text-zinc-700">{scene.suggestedShot}</p></div>}
            {!!scene.continuityNotes?.length && <ul className="mt-2 list-disc space-y-1 pl-4 text-[10px] text-zinc-600">{scene.continuityNotes.map((note) => <li key={note}>{note}</li>)}</ul>}
          </li>)}
        </ol>
      </div>}
    </section>
  );
}
