# Creative Studio (Step 6)

Open `/creative` directly or choose `06 Creative Studio` in the dashboard.
Replaces the previous angle / AI image-video generation / storefront UI in Step 6.
Existing historical creative packs and generation endpoints are retained.

## Workflow

1. Add local MP4/MOV/WebM videos to the library.
2. Choose a 19-second, 30-second, or freeform storyboard.
3. Select a scene and attach a library clip, or use Replace to upload a different clip.
4. Set the source start and scene duration, role, audio mute, order, output ratio and fit.
5. Preview sequentially, then render MP4. The exported result has a separate player and download action.

Replacing footage preserves the scene duration and resets the source start to zero.
A short clip is flagged, never silently stretched, looped or truncated to fit.
The browser sequence preview can pause between clips; exported MP4 is concatenated.
Exports: H.264/AAC, 30fps, 720×1280 / 720×720 / 1280×720, up to 180 seconds and 60 scenes.
Library/upload limit: 300 MB. Rendering is limited to one concurrent request per server process.

## Storage and runtime

The editor holds source files in browser memory. Save/Open downloads/imports a JSON storyboard.
Reloading requires the original video files; matching name + size + last-modified reattaches automatically.
If originals have changed, attach them explicitly. No database or Supabase writes are performed.
Rendering uses an OS temporary directory, removed on success or failure. No media is added to the repository.
Keep the page open during rendering. Save the storyboard and download the MP4 before leaving.
This version does not composite text overlays or a separate music/voiceover track.

The Node server needs `ffmpeg` and `ffprobe` on PATH, or absolute executable paths in
`FFMPEG_PATH` and `FFPROBE_PATH`. Deployment must support native processes and sufficient render time.
The supplied localhost environment has both binaries. No cloud render service is used.

## Verification

- `node --test tests/creative-storyboard.test.cjs`
- `node --test tests/creative-render.integration.cjs` (app running at localhost:3000, override with CREATIVE_TEST_URL)
- `npx tsc --noEmit`

Integration test verifies exported scene order, normalized size/rate, preserved audio, muted scenes,
footage without audio, invalid/missing clip rejection, and cross-origin rejection.
