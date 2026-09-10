import { chromium } from 'playwright';
import assert from 'node:assert/strict';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const errors = [];
page.on('pageerror', error => errors.push(error.message));
await page.route(/\/main\.js(?:\?.*)?$/, async route => {
  const response = await route.fetch();
  await route.fulfill({ response, body: await response.text() + `\nwindow.__usabilityCheck = {
    get state() { return { tool: currentTool, type: nodeTypeToAdd, engine: soundEngineToAdd,
      waveform: waveformToAdd, history: historyStack.length, busy: isPerformingUndoRedo, connections: connections.length, selected: selectedElements.size }; },
    setupSelection() {
      handleNewWorkspace(true);
      const a = addNode(500, 400, 'gate'), b = addNode(700, 400, 'gate');
      connectNodes(a, b);
      selectedElements.clear();
      [a, b].forEach(n => selectedElements.add({ type: 'node', id: n.id }));
      saveState();
    },
    openSamplers() { soundEngineToAdd = null; setupAddTool(null, 'sound', true, 'samplers', 'Samples'); }
  };` });
});
async function search(query) {
  await page.keyboard.press('Control+k');
  await page.locator('#workspaceCommandInput').fill(query);
}
try {
  await page.goto(process.env.RESONAUT_URL || 'http://127.0.0.1:5000/');
  await page.locator('#startEngineBtn').click();
  await page.waitForFunction(() => window.__usabilityCheck && window.audioContext?.state === 'running');
  await page.waitForFunction(() => !document.getElementById('startEngineBtn').disabled);
  await page.locator('#loadingIndicator').waitFor({ state: 'hidden' });
  await page.evaluate(() => window.handleNewWorkspace(true));
  await search('tonnetz');
  assert.equal(await page.locator('#workspaceCommandResults [role="option"]').count(), 1);
  await page.keyboard.press('Enter');
  assert.equal(await page.evaluate(() => window.__usabilityCheck.state.type), 'tonnetz_sequencer');
  await page.mouse.click(850, 420);
  assert.equal(await page.evaluate(() => window.nodes.filter(n => n.type === 'tonnetz_sequencer').length), 1);
  await page.keyboard.press('Escape');
  await search('piano sampler');
  assert.ok(await page.locator('#workspaceCommandResults [role="option"]').count() > 0);
  await page.keyboard.press('Enter');
  const sampler = await page.evaluate(() => window.__usabilityCheck.state);
  assert.equal(sampler.type, 'sound');
  assert.equal(sampler.engine, null);
  assert.ok(sampler.waveform);
  await page.keyboard.press('Escape');

  await page.evaluate(() => window.__usabilityCheck.openSamplers());
  const filter = page.locator('#sideToolbarContent .menu-search');
  await filter.fill('piano');
  const labels = await page.locator('#sideToolbarContent .sampler-button:visible').allTextContents();
  assert.ok(labels.length > 0 && labels.every(label => /piano/i.test(label)));
  await filter.fill('zz-no-match');
  assert.equal(await page.locator('#sideToolbarContent .sampler-button:visible').count(), 0);
  await page.keyboard.press('Escape');
  assert.equal(await filter.inputValue(), '');
  assert.equal(await page.evaluate(() => window.__usabilityCheck.state.tool), 'add');
  await page.keyboard.press('Escape');
  assert.equal(await page.evaluate(() => window.__usabilityCheck.state.tool), 'edit');

  // Closing search must preserve the active tool; its letters cannot reach canvas shortcuts.
  await page.keyboard.press('c');
  await search('gate');
  await page.keyboard.press('ArrowDown');
  assert.equal(await page.locator('#workspaceCommandResults [aria-selected="true"]').count(), 1);
  await page.keyboard.press('Escape');
  assert.equal(await page.evaluate(() => window.__usabilityCheck.state.tool), 'connect');
  await search('nothing-matches-zz');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');
  assert.equal(await page.locator('#workspaceCommandPalette').evaluate(el => el.open), true);
  await page.keyboard.press('Escape');
  await page.keyboard.press('Control+g');
  assert.equal(await page.evaluate(() => window.__usabilityCheck.state.tool), 'connect');

  for (const gesture of ['Delete', 'Control+x']) {
    await page.evaluate(() => window.__usabilityCheck.setupSelection());
    await page.keyboard.press('Control+a');
    assert.equal(await page.evaluate(() => window.__usabilityCheck.state.selected), 3);
    const history = await page.evaluate(() => window.__usabilityCheck.state.history);
    await page.keyboard.press(gesture);
    assert.equal(await page.evaluate(() => window.nodes.length), 0);
    assert.equal(await page.evaluate(() => window.__usabilityCheck.state.history), history + 1);
    await page.keyboard.press('Control+z');
    await page.waitForFunction(() => !window.__usabilityCheck.state.busy && window.nodes.length === 2);
    assert.equal(await page.evaluate(() => window.__usabilityCheck.state.connections), 1);
  }
  await page.evaluate(() => window.__usabilityCheck.setupSelection());
  await page.keyboard.press('Control+c');
  const beforePaste = await page.evaluate(() => window.__usabilityCheck.state.history);
  await page.keyboard.press('Control+v');
  assert.equal(await page.evaluate(() => window.nodes.length), 4);
  assert.equal(await page.evaluate(() => window.__usabilityCheck.state.history), beforePaste + 1);
  await page.keyboard.press('Control+z');
  await page.waitForFunction(() => !window.__usabilityCheck.state.busy && window.nodes.length === 2);
  await page.locator('#workspaceSearchBtn').click();
  await page.locator('#workspaceCommandInput').fill('synth');
  await page.screenshot({ path: `${process.env.TEMP}/resonaut-workspace-search.png` });
  await page.setViewportSize({ width: 720, height: 620 });
  const bounds = await page.locator('#workspaceCommandPalette').boundingBox();
  assert.ok(bounds.x >= 0 && bounds.x + bounds.width <= 720 && bounds.y + bounds.height <= 620);
  assert.deepEqual(errors, []);
  console.log('Workspace usability: search, actual orb placement, presets, filtering, keyboard isolation, grouped delete/cut/paste undo and responsive palette passed.');
} finally { await browser.close(); }
