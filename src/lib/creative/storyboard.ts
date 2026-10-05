import { z } from 'zod';

export const roles = ['Mở đầu', 'Nỗi đau', 'Cơ chế', 'Kết quả', 'Chứng minh', 'So sánh', 'Gỡ lo ngại', 'Kêu gọi mua', 'Khác'] as const;
export const sceneSchema = z.object({
  id: z.string().min(1).max(100),
  role: z.enum(roles),
  clipId: z.string().max(512).nullable(),
  start: z.number().finite().min(0).max(7200),
  duration: z.number().finite().min(0.2).max(120),
  muted: z.boolean(),
});
export const storyboardSchema = z.object({
  version: z.literal(1),
  name: z.string().trim().min(1).max(100),
  ratio: z.enum(['9:16', '1:1', '16:9']),
  fit: z.enum(['contain', 'cover']),
  scenes: z.array(sceneSchema).min(1).max(60),
}).refine(v => v.scenes.reduce((s, c) => s + c.duration, 0) <= 180, 'Video tối đa 180 giây.');
export type Scene = z.infer<typeof sceneSchema>;
export type Storyboard = z.infer<typeof storyboardSchema>;
export const MAX_BYTES = 300 * 1024 * 1024;
export function makeScene(role: Scene['role'] = 'Khác', duration = 3): Scene {
  return { id: crypto.randomUUID(), role, duration, clipId: null, start: 0, muted: false };
}
export function templateScenes(template: 'short' | 'story' | 'free'): Scene[] {
  if (template === 'free') return [makeScene('Mở đầu')];
  const entries: [Scene['role'], number][] = template === 'short'
    ? [['Mở đầu', 3], ['Cơ chế', 4], ['Kết quả', 3], ['Chứng minh', 5], ['Kêu gọi mua', 4]]
    : [['Mở đầu', 3], ['Nỗi đau', 4], ['Cơ chế', 4], ['Kết quả', 4], ['Chứng minh', 4], ['So sánh', 4], ['Gỡ lo ngại', 3], ['Kêu gọi mua', 4]];
  return entries.map(([role, duration]) => makeScene(role, duration));
}
export function sceneIssue(scene: Scene, duration?: number): string | null {
  if (!scene.clipId || duration === undefined) return 'Chưa chọn video';
  if (!Number.isFinite(scene.start) || !Number.isFinite(scene.duration) || scene.start < 0 || scene.duration < 0.2) return 'Đoạn cắt không hợp lệ';
  if (scene.start + scene.duration > duration + 0.025) return `Clip không đủ dài: cần đến ${(scene.start + scene.duration).toFixed(2)}s / có ${duration.toFixed(2)}s`;
  return null;
}
