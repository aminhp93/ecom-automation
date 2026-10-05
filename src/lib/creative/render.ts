import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdtemp, writeFile, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { MAX_BYTES, sceneIssue, type Storyboard } from './storyboard';

const exec = promisify(execFile);
const options = { timeout: 120_000, maxBuffer: 2 * 1024 * 1024 };
export class InputError extends Error {}

export async function renderStoryboard(board: Storyboard, files: Map<string, File>): Promise<Buffer> {
  const used = [...new Set(board.scenes.map(s => s.clipId))];
  let bytes = 0;
  for (const id of used) {
    if (!id || !files.has(id)) throw new InputError('Có scene chưa được gắn video.');
    bytes += files.get(id)!.size;
  }
  if (bytes > MAX_BYTES) throw new InputError('Tổng video đầu vào tối đa 300 MB.');
  const dir = await mkdtemp(path.join(tmpdir(), 'scene-builder-'));
  try {
    const sources = new Map<string, { file: string; duration: number; audio: boolean }>();
    for (const [i, id] of used.entries()) {
      const file = path.join(dir, `source-${i}`);
      await writeFile(file, Buffer.from(await files.get(id!)!.arrayBuffer()));
      const { stdout } = await exec(process.env.FFPROBE_PATH || 'ffprobe', ['-v', 'error', '-protocol_whitelist', 'file,pipe', '-format_whitelist', 'mov,matroska,webm,avi', '-show_streams', '-show_format', '-of', 'json', file], options);
      const info = JSON.parse(stdout) as { streams: { codec_type: string; duration?: string }[]; format: { duration?: string } };
      const video = info.streams.find(s => s.codec_type === 'video');
      const duration = Number(video?.duration ?? info.format.duration);
      if (!video || !Number.isFinite(duration) || duration <= 0) throw new InputError(`Video ${i + 1} không đọc được.`);
      sources.set(id!, { file, duration, audio: info.streams.some(s => s.codec_type === 'audio') });
    }
    const [width, height] = board.ratio === '9:16' ? [720, 1280] : board.ratio === '1:1' ? [720, 720] : [1280, 720];
    for (const [i, scene] of board.scenes.entries()) {
      const source = sources.get(scene.clipId!)!;
      const problem = sceneIssue(scene, source.duration);
      if (problem) throw new InputError(`Scene ${i + 1}: ${problem}`);
      const size = board.fit === 'contain'
        ? `scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2:black`
        : `scale=${width}:${height}:force_original_aspect_ratio=increase,crop=${width}:${height}`;
      const audio = source.audio && !scene.muted;
      await exec(process.env.FFMPEG_PATH || 'ffmpeg', [
        '-hide_banner', '-loglevel', 'error', '-y', '-threads', '2', '-ss', String(scene.start), '-protocol_whitelist', 'file,pipe', '-format_whitelist', 'mov,matroska,webm,avi', '-i', source.file,
        ...(audio ? [] : ['-f', 'lavfi', '-i', 'anullsrc=r=48000:cl=stereo']),
        '-map', '0:v:0', '-map', audio ? '0:a:0' : '1:a:0', '-t', String(scene.duration),
        '-vf', `${size},setsar=1,fps=30,format=yuv420p`, '-af', 'aresample=48000,apad',
        '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '21', '-threads', '2', '-c:a', 'aac', '-ar', '48000', '-ac', '2',
        '-video_track_timescale', '90000', path.join(dir, `scene-${i}.mp4`),
      ], options);
    }
    await writeFile(path.join(dir, 'concat.txt'), board.scenes.map((_, i) => `file 'scene-${i}.mp4'`).join('\n'));
    await exec(process.env.FFMPEG_PATH || 'ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-f', 'concat', '-safe', '1', '-i', path.join(dir, 'concat.txt'), '-c', 'copy', '-movflags', '+faststart', path.join(dir, 'output.mp4')], options);
    return await readFile(path.join(dir, 'output.mp4'));
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}
