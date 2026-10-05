/* eslint-disable @typescript-eslint/no-require-imports */
// Requires the app on CREATIVE_TEST_URL (default http://localhost:3000) and FFmpeg.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { mkdtemp, readFile, writeFile, rm } = require('node:fs/promises');
const { execFileSync } = require('node:child_process');
const { tmpdir } = require('node:os');
const path = require('node:path');
const endpoint = `${process.env.CREATIVE_TEST_URL || 'http://localhost:3000'}/api/creative/render`;
const ffmpeg = (...args) => execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', ...args]);

test('real export preserves sequence, handles silent footage and mute, rejects invalid trims', async () => {
  const dir = await mkdtemp(path.join(tmpdir(), 'creative-test-'));
  try {
    const red = path.join(dir, 'red.mp4'), blue = path.join(dir, 'blue.mp4');
    ffmpeg('-f','lavfi','-i','color=c=red:s=320x240:r=24','-f','lavfi','-i','sine=frequency=440:sample_rate=44100','-t','2','-c:v','libx264','-pix_fmt','yuv420p','-c:a','aac',red);
    ffmpeg('-f','lavfi','-i','color=c=blue:s=160x90:r=25','-t','2','-c:v','libx264','-pix_fmt','yuv420p',blue);
    const board = { version:1, name:'Integration', ratio:'9:16', fit:'cover', scenes:[
      {id:'a',role:'Mở đầu',clipId:'red',start:0.2,duration:1,muted:false},
      {id:'b',role:'Chứng minh',clipId:'red',start:0.5,duration:1,muted:true},
      {id:'c',role:'Kêu gọi mua',clipId:'blue',start:0,duration:1,muted:false},
    ] };
    async function send(spec) {
      const data = new FormData(); data.set('storyboard', JSON.stringify(spec));
      data.set('red', new Blob([await readFile(red)]), 'red.mp4');
      data.set('blue', new Blob([await readFile(blue)]), 'blue.mp4');
      return fetch(endpoint,{method:'POST',body:data});
    }
    const response = await send(board);
    assert.equal(response.status,200, response.status === 200 ? '' : await response.text());
    const output = path.join(dir,'output.mp4'); await writeFile(output, Buffer.from(await response.arrayBuffer()));
    const info = JSON.parse(execFileSync('ffprobe',['-v','error','-show_streams','-show_format','-of','json',output],{encoding:'utf8'}));
    assert.ok(Math.abs(Number(info.format.duration)-3)<0.1);
    const video = info.streams.find(s=>s.codec_type==='video');
    assert.equal(video.width,720); assert.equal(video.height,1280); assert.equal(video.r_frame_rate,'30/1');
    assert.ok(info.streams.some(s=>s.codec_type==='audio'));
    for (const [at, channel] of [[0.4,0],[1.4,0],[2.4,2]]) {
      const rgb = ffmpeg('-ss',String(at),'-i',output,'-frames:v','1','-vf','scale=1:1','-f','rawvideo','-pix_fmt','rgb24','pipe:1');
      assert.ok(rgb[channel]>200,`wrong scene at ${at}`);
    }
    function amplitude(at) {
      const pcm = ffmpeg('-ss',String(at),'-i',output,'-t','0.2','-vn','-f','f32le','-ac','1','pipe:1');
      let max=0; for(let i=0;i<pcm.length;i+=4) max=Math.max(max,Math.abs(pcm.readFloatLE(i))); return max;
    }
    assert.ok(amplitude(0.4)>0.01,'original audio must remain');
    assert.ok(amplitude(1.4)<0.001,'muted scene must be silent');
    assert.ok(amplitude(2.4)<0.001,'silent source must receive silent audio');
    const bad = structuredClone(board); bad.scenes[0].start=9;
    const invalid = await send(bad); assert.equal(invalid.status,400); assert.match((await invalid.json()).error,/không đủ dài/);
    const missing = structuredClone(board); missing.scenes[0].clipId=null;
    assert.equal((await send(missing)).status,400);
    assert.equal((await fetch(endpoint,{method:'POST',headers:{Origin:'https://unrelated.example'},body:''})).status,403);
  } finally { await rm(dir,{recursive:true,force:true}); }
});
