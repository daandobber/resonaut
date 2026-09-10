// Verify rendered audio direction (including a trimmed loop), not just transport labels.
import { chromium } from 'playwright';
import assert from 'node:assert/strict';
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage();
  await page.goto(process.env.RESONAUT_URL || 'http://127.0.0.1:5000/');
  const rendered = await page.evaluate(async () => {
    const { createTapeVoice, TAPE_PRESETS } = await import('/utils/tapeAudio.js');
    const results = [];
    for (const rate of [1, -1, -2, 0]) {
      const ctx = new OfflineAudioContext(2, 9600, 48000);
      const buffer = ctx.createBuffer(2, 48000, 48000);
      for (let i = 0; i < buffer.length; i++) {
        buffer.getChannelData(0)[i] = i / buffer.length * 0.6;
        buffer.getChannelData(1)[i] = -i / buffer.length * 0.3;
      }
      const voice = createTapeVoice(ctx, buffer, ctx.destination, TAPE_PRESETS.clean, 0.2, 0.85, rate);
      voice.start(0, 0.6);
      const audio = await ctx.startRendering();
      results.push({ rate, a: audio.getChannelData(0)[2400], b: audio.getChannelData(0)[7200], right: audio.getChannelData(1)[7200] });
    }
    return results;
  });
  assert.ok(rendered[0].b > rendered[0].a + 0.04, 'forward samples ascend');
  assert.ok(rendered[1].b < rendered[1].a - 0.04, 'reverse samples descend');
  assert.ok(rendered[2].a - rendered[2].b > 1.9 * (rendered[1].a - rendered[1].b), 'farther left doubles reverse speed');
  assert.equal(rendered[3].a, 0);
  assert.equal(rendered[3].b, 0);
  for (const sample of rendered) assert.ok(Math.abs(sample.right + sample.b / 2) < 0.0001, 'stereo channels stay aligned');
  console.log('Rendered tape audio: forward, reverse, 2x reverse, center silence and stereo passed.');
} finally { await browser.close(); }
