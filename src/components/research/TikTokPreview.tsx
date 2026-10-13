'use client';

import { useEffect, useState } from 'react';

// Xem trước video TikTok ngay trong ô của bảng: hiện ảnh bìa (oEmbed công khai của TikTok, gọi từ trình duyệt); rê chuột vào thì video chạy luôn tại chỗ (có tiếng), rê ra thì về ảnh bìa.
const thumbCache = new Map<string, string | null>();
const videoId = (url: string) => url.match(/\/video\/(\d+)/)?.[1] ?? null;

export function TikTokPreview({ url }: { url: string }) {
  const id = videoId(url);
  const [thumb, setThumb] = useState<string | null | undefined>(thumbCache.get(url));
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    if (thumbCache.has(url)) return;
    let alive = true;
    fetch(`https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((j: { thumbnail_url?: string } | null) => {
        const t = j?.thumbnail_url ?? null;
        thumbCache.set(url, t);
        if (alive) setThumb(t);
      })
      .catch(() => { thumbCache.set(url, null); if (alive) setThumb(null); });
    return () => { alive = false; };
  }, [url]);

  return (
    <div
      onMouseEnter={() => id && setPlaying(true)}
      onMouseLeave={() => setPlaying(false)}
      className="relative w-40 h-72 rounded-md overflow-hidden bg-zinc-900 border border-zinc-200"
      title="Rê chuột vào để phát video"
    >
      {playing && id ? (
        <iframe
          src={`https://www.tiktok.com/player/v1/${id}?autoplay=1&loop=1&music_info=0&description=0&rel=0&native_context_menu=0`}
          allow="autoplay; fullscreen; encrypted-media"
          className="absolute inset-0 w-full h-full border-0"
          title="Video TikTok"
        />
      ) : thumb ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={thumb} alt="Ảnh bìa video TikTok" className="absolute inset-0 w-full h-full object-cover" />
      ) : (
        <span className="absolute inset-0 flex items-center justify-center text-xs text-zinc-400">{thumb === undefined ? '…' : 'Rê chuột để phát'}</span>
      )}
      {!playing && <span className="absolute bottom-1 right-1 bg-black/60 text-white text-[10px] leading-none px-1.5 py-1 rounded">▶</span>}
      <a href={url} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="absolute top-1 right-1 z-10 bg-black/60 hover:bg-black/80 text-white text-[10px] leading-none px-1.5 py-1 rounded" title="Mở trên TikTok">↗</a>
    </div>
  );
}
