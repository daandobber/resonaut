import { chromium } from 'playwright';
import assert from 'node:assert/strict';
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const errors = [];
page.on('pageerror', e => errors.push(e.message));
await page.route(/\/main\.js(?:\?.*)?$/, async route => {
  const response = await route.fetch();
  await route.fulfill({ response, body: await response.text() + `\nwindow.__symphCheck = {
    snapshot() { saveState(); return getLatestState(); },
    load: loadState,
    get busy() { return isPerformingUndoRedo; },
    get playing() { return isPlaying; },
    editMind() {
      const mind = nodes.find(n => n.type === 'mind' && n.audioParams.musicalRole === 'melody');
      selectedElements.clear(); selectedElements.add({type:'node',id:mind.id}); populateEditPanel();
      return mind.id;
    },
    veinFixture(queen) {
      handleNewWorkspace(true);
      const a = addNode(600, 400, queen ? QUEEN_MIND_TYPE : 'mind');
      a.audioParams.isAlive = false;
      const b = addNode(950, 400, queen ? 'mind' : 'sound', queen ? null : 'sine');
      setActiveTool('vein');
      const rect = canvas.getBoundingClientRect();
      const point = n => { const p = getScreenCoords(n.x,n.y); return {x:p.x+rect.left,y:p.y+rect.top}; };
      return { a: point(a), b: point(b) };
    },
    get views() { return nodes.map(n => ({ id: n.id, type: n.type, targets: n.lifeSystem?.veins.map(v => v.targetNode.id),
      step: n.lifeSystem?.musicalContext?.tick, chord: n.lifeSystem?.musicalContext?.chordDegree, gain: n.audioParams.focusIntensity,
      role: n.audioParams.musicalRole, controller: n.lifeSystem?.queenController?.id })); },
    instrumentEvents: [],
    watch() { nodes.filter(n => n.type === 'sound').forEach(n => {
      const original = n.triggerFromLife; n.triggerFromLife = function(gain, event) {
        window.__symphCheck.instrumentEvents.push({id:n.id, gain, ...event}); return original.call(this,gain,event);
      };
    }); },
    rms() { const data = new Float32Array(masterAnalyser.fftSize); masterAnalyser.getFloatTimeDomainData(data); return Math.sqrt(data.reduce((sum,n)=>sum+n*n,0)/data.length); }
  };` });
});
try {
  await page.goto(process.env.RESONAUT_URL || 'http://127.0.0.1:5000/');
  await page.locator('#startEngineBtn').click();
  await page.waitForFunction(() => window.__symphCheck && window.audioContext?.state === 'running');
  await page.waitForFunction(() => !document.getElementById('startEngineBtn').disabled);
  await page.locator('#loadingIndicator').waitFor({ state: 'hidden' });
  for (const queen of [true, false]) {
    for (const reverse of [false, true]) {
      const points = await page.evaluate(queen => window.__symphCheck.veinFixture(queen), queen);
      const start = reverse ? points.b : points.a, end = reverse ? points.a : points.b;
      await page.mouse.move(start.x, start.y);
      await page.mouse.down();
      await page.mouse.move(end.x, end.y, { steps: 10 });
      await page.mouse.up();
      assert.deepEqual(await page.evaluate(() => window.__symphCheck.views[0].targets), [1]);
    }
  }
  await page.evaluate(() => window.handleNewWorkspace(true));
  await page.locator('#symphioseMenuBtn').click();
  await page.locator('#createSymphioseEnsembleBtn').click();
  assert.equal(await page.evaluate(() => window.nodes.length), 9);
  assert.equal(await page.locator('.symphiose-music-editor').count(), 1);
  const initial = await page.evaluate(() => window.__symphCheck.views);
  assert.deepEqual(initial.filter(n => n.type === 'mind').map(n => n.role), ['bass','chords','melody']);
  await page.evaluate(() => window.__symphCheck.watch());
  await page.locator('#app-menu-play-pause-btn').click();
  await page.waitForFunction(() => window.__symphCheck.instrumentEvents.length > 20);
  await page.waitForFunction(() => window.__symphCheck.rms() > 0.001);
  const running = await page.evaluate(() => window.__symphCheck.views.filter(n => n.type.includes('mind')));
  assert.ok(running.every(n => n.step === running[0].step && n.chord === running[0].chord));
  assert.deepEqual(running.map(n => n.gain), initial.filter(n => n.type.includes('mind')).map(n => n.gain));
  const events = await page.evaluate(() => window.__symphCheck.instrumentEvents);
  assert.ok(events.some(e => e.role === 'bass') && events.some(e => e.role === 'chords') && events.some(e => e.role === 'melody'));
  await page.locator('#app-menu-play-pause-btn').click();
  const count = await page.evaluate(() => window.__symphCheck.instrumentEvents.length);
  await page.waitForTimeout(350);
  assert.equal(await page.evaluate(() => window.__symphCheck.instrumentEvents.length), count);
  const saved = await page.evaluate(() => window.__symphCheck.snapshot());
  assert.ok(saved.nodes.every(n => !n.lifeSystem));
  await page.evaluate(state => window.__symphCheck.load(state), saved);
  const restored = await page.evaluate(() => window.__symphCheck.views);
  assert.deepEqual(restored.map(n => n.targets), initial.map(n => n.targets));
  await page.locator('[data-symphiose-preset="breathe"]').click();
  assert.equal(await page.locator('[data-symphiose-param="progression"]').inputValue(), 'drift');
  await page.locator('[data-symphiose-param="chordColor"]').selectOption('seventh');
  const arpId = await page.evaluate(() => window.__symphCheck.editMind());
  await page.locator('[data-symphiose-preset="starlight"]').click();
  assert.equal(await page.locator('[data-symphiose-param="musicalRole"]').inputValue(), 'arp');
  assert.equal(await page.locator('[data-symphiose-param="arpDirection"]').inputValue(), 'pendulum');
  await page.evaluate(() => window.__symphCheck.watch());
  await page.locator('#app-menu-play-pause-btn').click();
  await page.waitForFunction(() => window.__symphCheck.instrumentEvents.some(e => e.role === 'arp'));
  await page.waitForFunction(() => document.querySelector('[data-symphiose-param="chordColor"]').disabled);
  await page.locator('#app-menu-play-pause-btn').click();
  const musicalSave = await page.evaluate(() => window.__symphCheck.snapshot());
  const arp = musicalSave.nodes.find(n => n.id === arpId);
  assert.equal(arp.audioParams.arpDirection, 'pendulum');
  assert.equal(arp.audioParams.chordColor, 'seventh');
  await page.locator('[data-symphiose-preset="clave"]').click();
  assert.equal(await page.locator('[data-symphiose-param="rhythmStyle"]').inputValue(), 'clave');
  assert.equal(await page.locator('[data-symphiose-param="musicalRole"]').inputValue(), 'rhythm');
  await page.screenshot({ path: `${process.env.TEMP}/resonaut-symphiose.png` });
  await page.keyboard.press('Escape');
  await page.keyboard.press('Control+a');
  await page.keyboard.press('Control+c');
  await page.keyboard.press('Control+v');
  assert.equal(await page.evaluate(() => window.nodes.length), 18);
  const copied = await page.evaluate(() => window.__symphCheck.views.slice(9));
  const copyIds = new Set(copied.map(n => n.id));
  assert.ok(copied.filter(n => n.targets).every(n => n.targets.every(id => copyIds.has(id))));
  await page.keyboard.press('Control+z');
  await page.waitForFunction(() => !window.__symphCheck.busy && window.nodes.length === 9);
  await page.evaluate(() => window.handleNewWorkspace(true));
  assert.equal(await page.evaluate(() => window.nodes.length), 0);
  assert.deepEqual(errors, []);
  console.log('Symphiose: ensemble, shared clock/harmony, role events, stable gain, pause, saved veins, presets, isolated duplication and cleanup passed.');
} finally { await browser.close(); }
