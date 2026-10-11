export interface Version { file: string; version: string; n: number; variant: string; mtime: number; size: number; url: string }
export interface Check { status: 'ok' | 'fail' | 'pending'; note?: string }
export interface Review { at: string; by: string; file: string; decision: 'comment' | 'request' | 'approve' | 'reject'; note: string }
export interface Anchor { id: string; title: string; path: string; note: string }
export interface SourceVideo { id: string; title: string; path: string; note: string }
export interface SceneFlowItem {
  id: string; start: number; end: number; title: string; action: string; anchorIds: string[];
  reference?: { path: string; label: string; note: string }[];
  ownScene?: string | null;
}
export interface Content {
  id: string; folder: string; type: string; title: string; angle?: string; hook?: string; status: string; length?: string; music?: string; voice?: string;
  scenes?: string; sourcesNote?: string; reviewer?: string; updatedAt?: string;
  anchors?: Anchor[]; sourceVideos?: SourceVideo[]; sceneFlow?: SceneFlowItem[];
  script?: { caption?: string; beats?: { sec: string; desc: string }[] };
  checks?: Record<string, Check>; publishBlockers?: string[]; reviews?: Review[]; approved?: { file: string; by: string; at: string } | null;
  versionNotes?: Record<string, string>; versions: Version[]; latestFile: string | null; eligibility: string[];
}
export interface Angle { id: string; name: string; status: string; summary: string; evidence: string[]; videos: string[]; decision?: string | null; decisionNote?: string | null }
export interface Post {
  id: string; content: string; file: string; channel: 'instagram' | 'tiktok' | 'facebook'; caption: string; aspect: string; plannedDate: string;
  status: 'planned' | 'ready' | 'posted' | 'skipped'; url: string; postedBy: string; postedAt: string; metrics: unknown; updatedAt: string;
}
export interface Channel {
  id: 'instagram' | 'tiktok' | 'facebook'; name: string; handle: string; url: string; created: boolean; dataConnected: boolean; canPost: boolean;
  avatar: string | null; bio: string | null; link: string | null; category: string | null; lastChecked: string; checkNote: string; todo: string[];
}
export interface Reference {
  competitor: string; note: string;
  ads: { id: string; start: string; seconds: number; scenes: number; note: string }[];
  reels: { n: string; hook: string; angle: string; structure: string; audio: string; seconds: number; views: number | null }[];
  docs: { label: string; path: string }[];
}
export interface Data { product: string; angles: Angle[]; contents: Content[]; posts: Post[]; channels: { brand: string; channels: Channel[] } | null; reference: Reference | null }

export const PROD_STATUS: Record<string, { label: string; chip: string }> = {
  idea: { label: 'Ý tưởng', chip: 'bg-zinc-100 text-zinc-600 border-zinc-200' },
  scenes: { label: 'Đang sinh scene', chip: 'bg-sky-50 text-sky-800 border-sky-200' },
  assembled: { label: 'Đã ghép', chip: 'bg-violet-50 text-violet-800 border-violet-200' },
  review: { label: 'Chờ duyệt', chip: 'bg-amber-50 text-amber-800 border-amber-200' },
  approved: { label: 'Đã duyệt', chip: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
};
export const POST_STATUS: Record<string, { label: string; chip: string }> = {
  planned: { label: 'Đã lên kế hoạch', chip: 'bg-zinc-100 text-zinc-700 border-zinc-200' },
  ready: { label: 'Sẵn sàng đăng', chip: 'bg-sky-50 text-sky-800 border-sky-200' },
  posted: { label: 'Đã đăng', chip: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
  skipped: { label: 'Bỏ qua', chip: 'bg-zinc-50 text-zinc-400 border-zinc-200' },
};
export const CHANNEL_LABEL: Record<string, string> = { instagram: 'Instagram', tiktok: 'TikTok', facebook: 'Facebook' };
export const CHECK_LABEL: Record<string, string> = { character: 'Nhân vật', room: 'Phòng', product: 'Sản phẩm', claim: 'Claim', audio: 'Âm thanh', rights: 'Nguồn / quyền tư liệu' };
export const CHECK_STYLE: Record<string, string> = { ok: 'text-emerald-700', fail: 'text-red-700', pending: 'text-amber-700' };
export const CHECK_TEXT: Record<string, string> = { ok: 'Đạt', fail: 'Chưa đạt', pending: 'Chưa kiểm' };
export const fmtSize = (b: number) => `${(b / 1048576).toFixed(1)} MB`;
export const fmtDate = (ms: number | string) => new Date(ms).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });

export async function act(body: Record<string, unknown>): Promise<string | null> {
  const r = await fetch('/api/creative-studio/action', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  if (r.ok) return null;
  return (await r.json().catch(() => ({})))?.error || 'Không ghi được.';
}
