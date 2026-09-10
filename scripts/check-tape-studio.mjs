// Run against a local Vite server: node scripts/check-tape-studio.mjs
import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });
const errors = [];
page.on('pageerror', error => { errors.push(error.message); console.error(error.stack); });
// Observe private tape state in this test page only, without exposing a production API.
await page.route(/\/main\.js(?:\?.*)?$/, async route => {
  const response = await route.fetch();
  const source = await response.text();
  await route.fulfill({ response, body: source + `\nwindow.__tapeCheck = {
    get peaks() { return tapeTrackAnalyserNodes.map(n => { const data = new Float32Array(n.fftSize);
      n.getFloatTimeDomainData(data); return data.reduce((p, v) => Math.max(p, Math.abs(v)), 0); }); },
    get state() { return { recording: isTapeLoopRecording, playing: isTapeLoopPlaying, selected: currentTapeTrack,
      tracks: tapeTracks.map(t => ({ duration: t.buffer?.duration, length: t.buffer?.length, written: t.writePosition, character: t.character,
        peak: t.buffer && t.buffer.getChannelData(0).reduce((peak, sample) => Math.max(peak, Math.abs(sample)), 0) })),
      sources: tapeLoopSourceNodes.map(s => s && ({ start: s.loopStart, end: s.loopEnd, rate: s.playbackRate.value })) }; },
    get transport() { return tapeVoices[currentTapeTrack] && { position: tapeVoices[currentTapeTrack].getPosition(), rate: tapeVoices[currentTapeTrack].rate }; },
    startTone() { const o = audioContext.createOscillator(); const g = audioContext.createGain(); g.gain.value = 0.12;
      o.connect(g).connect(masterGain); o.start(); return () => o.stop(); }
  };` });
});
try {
  await page.goto(process.env.RESONAUT_URL || 'http://127.0.0.1:5000/');
  await page.locator('#startEngineBtn').click();
  await page.locator('#app-menu-toggle-tape-looper-btn').click();
  await page.locator('.tape-character-drawer summary').click();
  await page.waitForFunction(() => window.audioContext?.state === 'running');
  await page.waitForFunction(() => window.__tapeCheck, { timeout: 5000 });
  await page.evaluate(() => window.__stopTestTone = window.__tapeCheck.startTone());
  await page.locator('#tapeLoopDurationInput').fill('1');
  await page.locator('#tapeLoopDurationInput').dispatchEvent('change');
  await page.locator('#tapeLoopRecordBtn').click();
  assert.equal(await page.locator('.tape-track-btn[data-track="1"]').isDisabled(), true);
  await page.waitForFunction(() => window.__tapeCheck.state.playing);
  let state = await page.evaluate(() => window.__tapeCheck.state);
  assert.equal(state.tracks[0].duration, 1);
  assert.equal(state.tracks[0].written, state.tracks[0].length);
  assert.ok(state.tracks[0].peak > 0.01, 'recorded take contains audio');
  await page.waitForFunction(() => window.__tapeCheck.peaks[0] > 0.01);
  const speed = page.locator('#tapeLoopSpeedSlider');
  assert.equal(await speed.getAttribute('min'), '-2');
  assert.equal(await speed.getAttribute('max'), '2');
  await speed.fill('0');
  const held = await page.evaluate(() => window.__tapeCheck.transport.position);
  await page.waitForTimeout(100);
  assert.equal(await page.evaluate(() => window.__tapeCheck.transport.position), held);
  assert.ok((await page.evaluate(() => window.__tapeCheck.peaks[0])) < 0.0001, 'center is silent');
  const heldReel = await page.locator('#tapeReelLeft').getAttribute('style');
  await page.waitForTimeout(100);
  assert.equal(await page.locator('#tapeReelLeft').getAttribute('style'), heldReel, 'reels stop at center');
  await speed.fill('-1');
  const reverseStart = await page.evaluate(() => window.__tapeCheck.transport.position);
  assert.ok(Math.abs(reverseStart - held) < 0.1, 'reverse resumes from the held position');
  await page.waitForTimeout(100);
  let transport = await page.evaluate(() => window.__tapeCheck.transport);
  assert.equal(transport.rate, -1);
  assert.ok(((reverseStart - transport.position + 1) % 1) > 0.05, 'playhead moves backward');
  assert.notEqual(await page.locator('#tapeReelLeft').getAttribute('style'), heldReel, 'reels move in reverse even without project playback');
  await page.waitForFunction(() => window.__tapeCheck.peaks[0] > 0.01);
  await speed.fill('-2');
  assert.equal((await page.evaluate(() => window.__tapeCheck.transport)).rate, -2);
  await speed.fill('0');
  await page.locator('#tapeLoopResetSpeedBtn').click();
  assert.equal((await page.evaluate(() => window.__tapeCheck.transport)).rate, 1);
  await page.locator('[data-preset="worn"]').click();
  assert.equal(await page.locator('[data-preset="worn"]').getAttribute('aria-pressed'), 'true');
  await page.locator('#tapeLoopStartInput').fill('0.2');
  await page.locator('#tapeLoopEndInput').fill('0.8');
  await page.locator('#tapeLoopSetLoopPointsBtn').click();
  state = await page.evaluate(() => window.__tapeCheck.state);
  assert.equal(state.sources[0].start, 0.2);
  assert.equal(state.sources[0].end, 0.8);
  const downloadEvent = page.waitForEvent('download');
  await page.locator('#tapeLoopExportBtn').click();
  const download = await downloadEvent;
  assert.equal(download.suggestedFilename(), 'resonaut-track-1.wav');
  const stream = await download.createReadStream();
  const chunks = [];
  for await (const chunk of stream) chunks.push(chunk);
  const wav = Buffer.concat(chunks);
  assert.equal(wav.toString('ascii', 0, 4), 'RIFF');
  assert.equal(wav.readUInt32LE(40), Math.round(0.6 * wav.readUInt32LE(24)) * 4);
  await page.locator('.tape-track-btn[data-track="1"]').click();
  await page.locator('#tapeLoopStopBtn').click();
  assert.equal(await page.locator('#tapeLoopPlayBtn').isDisabled(), false);
  await page.locator('#tapeLoopDurationInput').fill('4');
  await page.locator('#tapeLoopRecordBtn').click();
  await page.waitForFunction(() => window.__tapeCheck.state.tracks[1].written > window.audioContext.sampleRate * 0.25);
  await page.locator('#tapeLoopStopBtn').click();
  state = await page.evaluate(() => window.__tapeCheck.state);
  assert.equal(state.recording, false);
  assert.equal(state.playing, false);
  assert.ok(state.tracks[1].duration > 0.2 && state.tracks[1].duration < 2);
  await page.locator('#tapeLoopPlayBtn').click();
  assert.ok((await page.evaluate(() => window.__tapeCheck.state.sources)).every((s, i) => i > 1 || s));
  await page.locator('#tapeLoopStopBtn').click();
  await page.locator('#app-menu-sync-toggle-btn').click();
  await page.locator('#tapeRecordBars').selectOption('1');
  await page.locator('#tapeLoopRecordBtn').click();
  await page.waitForFunction(() => window.__tapeCheck.state.playing);
  state = await page.evaluate(() => window.__tapeCheck.state);
  assert.equal(state.tracks[1].duration, 2);
  await page.locator('#tapeLoopStopBtn').click();
  // Cancel an armed replacement before its scheduled beat; preserve the previous take.
  await page.locator('#app-menu-bpm-input').fill('30');
  await page.locator('#app-menu-bpm-input').dispatchEvent('change');
  const previousTake = await page.evaluate(() => window.__tapeCheck.state.tracks[1]);
  const wasArmed = await page.evaluate(() => {
    document.getElementById('tapeLoopRecordBtn').click();
    const armed = document.getElementById('tapeLoopRecordBtn').dataset.isArmed === 'true';
    document.getElementById('tapeLoopStopBtn').click();
    return armed;
  });
  assert.equal(wasArmed, true);
  assert.deepEqual(await page.evaluate(() => window.__tapeCheck.state.tracks[1]), previousTake);
  await page.locator('#tapeLoopPlayBtn').click();
  await page.locator('#tapeLoopClearBtn').click();
  state = await page.evaluate(() => window.__tapeCheck.state);
  assert.equal(state.playing, true);
  assert.ok(state.sources[0]);
  assert.equal(state.sources[1], null);
  await page.locator('#tapeLoopStopBtn').click();
  await page.evaluate(() => window.__stopTestTone());
  await page.locator('.tape-track-btn[data-track="0"]').click();
  await page.locator('.tape-character-drawer summary').click();
  await page.screenshot({ path: join(tmpdir(), 'resonaut-tape-studio.png') });
  await page.setViewportSize({ width: 390, height: 844 });
  const panelBounds = await page.locator('#tapeLooperPanel').boundingBox();
  assert.ok(panelBounds.x >= 0 && panelBounds.x + panelBounds.width <= 390);
  assert.ok(panelBounds.y >= 0 && panelBounds.y + panelBounds.height <= 844);
  // New project must clear playing, recording and armed tape state, including all tracks.
  await page.setViewportSize({ width: 1440, height: 1100 });
  await page.locator('#tapeLoopPlayBtn').click();
  page.once('dialog', dialog => dialog.accept());
  await page.getByRole('button', { name: 'File', exact: true }).hover();
  await page.locator('#app-menu-new').click();
  state = await page.evaluate(() => window.__tapeCheck.state);
  assert.equal(state.playing, false);
  assert.equal(state.recording, false);
  assert.equal(state.selected, 0);
  assert.ok(state.tracks.every(t => !t.length));
  assert.ok(state.sources.every(s => s === null));
  await page.evaluate(() => {
    document.getElementById('tapeLoopRecordBtn').click();
    window.handleNewWorkspace(true);
  });
  await page.waitForTimeout(300);
  assert.equal(await page.evaluate(() => window.__tapeCheck.state.recording), false);
  assert.equal(await page.locator('#tapeLoopRecordBtn').getAttribute('data-is-armed'), 'false');
  assert.deepEqual(errors, []);
  console.log(JSON.stringify({ tape: 'passed', state, screenshot: join(tmpdir(), 'resonaut-tape-studio.png') }, null, 2));
} finally {
  await browser.close();
}
