// Run against Vite: node scripts/check-sequencer-connections.mjs
import { chromium } from 'playwright';
import assert from 'node:assert/strict';

const browser = await chromium.launch({ headless: true });
try {
  for (const kind of ['Tonnetz', 'CircleFifths']) {
    for (const reverse of [false, true]) {
      const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
      const errors = [];
      await page.route(/\/main\.js(?:\?.*)?$/, async route => {
        const response = await route.fetch();
        await route.fulfill({ response, body: await response.text() + '\nwindow.__sequencerCheck = { get playing() { return isPlaying; } };' });
      });
      page.on('pageerror', error => errors.push(error.message));
      await page.goto(process.env.RESONAUT_URL || 'http://127.0.0.1:5000/');
      await page.locator('#startEngineBtn').click();
      await page.locator(`#add${kind}Btn`).click();
      await page.mouse.click(950, 400);
      await page.locator('#addPulsarBtn').click();
      await page.locator('#sideToolbarContent .type-button').filter({ hasText: 'Standard' }).click();
      await page.mouse.click(600, 400);
      await page.locator('#connectionsMenuBtn').click();
      await page.locator('#sideToolbarContent .type-button').filter({ hasText: 'Standard' }).click();
      await page.mouse.move(reverse ? 860 : 600, 400);
      await page.mouse.down();
      await page.mouse.move(reverse ? 600 : 860, 400, { steps: 15 });
      await page.mouse.up();
      const snapshot = await page.evaluate(() => ({ state: window.getLatestState(), nodes: window.nodes.map(n => ({ id: n.id, type: n.type, x: n.x, y: n.y, patternIndex: n.patternIndex })) }));
      const sequencer = snapshot.nodes.find(n => n.type === (kind === 'Tonnetz' ? 'tonnetz_sequencer' : 'circle_fifths'));
      const pulsar = snapshot.nodes.find(n => n.type === 'pulsar_standard');
      assert.ok(sequencer && pulsar, JSON.stringify(snapshot.nodes));
      const connection = snapshot.state.connections.find(c => [c.nodeAId, c.nodeBId].includes(sequencer.id) && [c.nodeAId, c.nodeBId].includes(pulsar.id));
      assert.ok(connection, JSON.stringify(snapshot));
      assert.equal(reverse ? connection.nodeAHandle : connection.nodeBHandle, reverse ? 0 : -1);
      // Run the real pulsar clock and require several successive sequencer steps.
      await page.evaluate(id => {
        window.nodes.find(n => n.id === id).audioParams.triggerInterval = 0.15;
      }, pulsar.id);
      if (!await page.evaluate(() => window.__sequencerCheck.playing)) await page.locator('#app-menu-play-pause-btn').click();
      let before = sequencer.patternIndex;
      for (let pulse = 0; pulse < 3; pulse++) {
        await page.waitForFunction(({ id, before }) => window.nodes.find(n => n.id === id).patternIndex !== before,
          { id: sequencer.id, before }, { timeout: 5000 }).catch(async error => {
            console.log(await page.evaluate(() => ({ audio: window.audioContext.state, nodes: window.nodes.map(n => ({ id: n.id, type: n.type, last: n.lastTriggerTime, step: n.patternIndex, enabled: n.isEnabled, connections: [...n.connections] })) })), errors);
            throw error;
          });
        before = await page.evaluate(id => window.nodes.find(n => n.id === id).patternIndex, sequencer.id);
      }
      // Loading a legacy patch with a cable on the center instrument repairs the endpoint.
      const repaired = await page.evaluate(async ({ sequencerId, clockId }) => {
        const saved = structuredClone(window.getLatestState());
        const parent = saved.nodes.find(n => n.id === sequencerId);
        const wire = saved.connections.find(c => [c.nodeAId, c.nodeBId].includes(clockId));
        if (wire.nodeAId === sequencerId) wire.nodeAId = parent.audioParams.centerAttachedNodeId;
        else wire.nodeBId = parent.audioParams.centerAttachedNodeId;
        await window.loadState(saved);
        window.saveState();
        return window.getLatestState().connections.find(c => c.id === wire.id);
      }, { sequencerId: sequencer.id, clockId: pulsar.id });
      assert.ok([repaired.nodeAId, repaired.nodeBId].includes(sequencer.id));
      assert.deepEqual(errors, []);
      console.log(`${kind}: ${reverse ? 'sequencer → pulsar' : 'pulsar → sequencer'} passed`);
      await page.close();
    }
  }
} finally { await browser.close(); }
