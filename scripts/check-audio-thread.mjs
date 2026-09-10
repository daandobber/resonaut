import { chromium } from 'playwright';
import assert from 'node:assert/strict';
const browser = await chromium.launch({headless: true});
const page = await browser.newPage();
const errors = [];
page.on('pageerror', e => errors.push(e.message));
try {
  await page.goto(process.env.RESONAUT_URL || 'http://127.0.0.1:5000/');
  await page.locator('#startEngineBtn').click();
  await page.waitForFunction(() => window.audioContext?.state === 'running' && !document.getElementById('startEngineBtn').disabled);
  const results = await page.evaluate(async () => {
    const { createRealtimeDSP, prepareRealtimeAudio } = await import('/utils/realtimeAudio.js');
    const ctx = window.audioContext;
    await prepareRealtimeAudio(ctx);
    await ctx.audioWorklet.addModule('/scripts/fixtures/audio-continuity.worklet.js');
    const measure = async kind => {
      const source = ctx.createConstantSource(); source.offset.value = 0.25;
      let processor;
      if (kind === 'legacy') {
        processor = ctx.createScriptProcessor(256,2,2);
        processor.onaudioprocess = e => {
          e.outputBuffer.getChannelData(0).set(e.inputBuffer.getChannelData(0));
          e.outputBuffer.getChannelData(1).set(e.inputBuffer.getChannelData(1));
        };
      } else processor = createRealtimeDSP(ctx, { kind, bits: 8, normFreq: 1, params: {gMix: 0} });
      const meter = new AudioWorkletNode(ctx, 'continuity-meter');
      source.connect(processor); processor.connect(meter); meter.connect(ctx.destination); source.start();
      await new Promise(resolve => setTimeout(resolve,250));
      meter.port.postMessage('arm');
      await new Promise(resolve => setTimeout(resolve,40));
      for (let i=0;i<4;i++) {
        const until=performance.now()+120;
        while(performance.now()<until) { /* deterministic UI-thread stall */ }
        await new Promise(resolve=>setTimeout(resolve,30));
      }
      const report = await new Promise(resolve => { meter.port.onmessage = e => resolve(e.data); meter.port.postMessage('report'); });
      source.stop(); source.disconnect(); processor.disconnect(); meter.disconnect();
      processor.onaudioprocess = null;
      processor.port?.close(); meter.port.close();
      return {...report, processor: processor.constructor.name};
    };
    return { legacy: await measure('legacy'), crusher: await measure('bitcrusher'), granular: await measure('granular'),
      sampleRate:ctx.sampleRate, baseLatency:ctx.baseLatency };
  });
  console.log(JSON.stringify(results,null,2));
  assert.ok(results.legacy.bad > 0, 'the test reproduces dropped samples in the old UI-thread processor');
  for (const result of [results.crusher,results.granular]) {
    assert.equal(result.processor,'AudioWorkletNode');
    assert.ok(result.frames > 10000);
    assert.equal(result.bad,0,'single-source audio stays continuous during UI stalls');
  }
  assert.deepEqual(errors,[]);
} finally {await browser.close();}
