import { chromium } from 'playwright';
import assert from 'node:assert/strict';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const errors = [];
page.on('pageerror', error => errors.push(error.message));
await page.route(/\/main\.js(?:\?.*)?$/, async route => {
  const response = await route.fetch();
  await route.fulfill({ response, body: await response.text() + `\nwindow.__workspaceCheck = {
    get state() { return { playing: isPlaying, history: historyStack.length, dirty: unsavedChanges, tool: currentTool,
      view: { x: viewOffsetX, y: viewOffsetY, scale: viewScale } }; },
    addGate(x = 500, y = 400) { const n = addNode(x, y, 'gate'); selectedElements.clear(); selectedElements.add({type: 'node', id: n.id}); return n.id; }
  };` });
});
try {
  await page.goto(process.env.RESONAUT_URL || 'http://127.0.0.1:5000/');
  await page.locator('#startEngineBtn').click();
  await page.waitForFunction(() => window.__workspaceCheck && window.audioContext?.state === 'running');
  await page.waitForFunction(() => !document.getElementById('startEngineBtn').disabled);
  // Queued pulses must not cross a project boundary when numeric IDs get reused.
  await page.evaluate(() => {
    window.handleNewWorkspace(true);
    const oldId = window.__workspaceCheck.addGate();
    const old = window.nodes.find(n => n.id === oldId);
    window.propagateTrigger(old, 0.2, 923412, -1, Infinity, { type: 'trigger', data: {} });
    window.handleNewWorkspace(true);
    window.__workspaceCheck.addGate(5000, 4000);
  });
  await page.waitForTimeout(400);
  assert.equal(await page.evaluate(() => window.nodes[0].gateCounter || 0), 0);
  assert.equal(await page.evaluate(() => window.__workspaceCheck.state.playing), false);
  await page.evaluate(() => {
    const editor = document.createElement('div');
    editor.id = 'shortcut-test-editor'; editor.contentEditable = 'true'; editor.textContent = 'test';
    editor.style.cssText = 'position:fixed;top:80px;left:200px;z-index:9999;background:black;color:white';
    document.body.append(editor); editor.focus();
  });
  const viewBefore = await page.evaluate(() => window.__workspaceCheck.state.view);
  await page.keyboard.press('Home');
  await page.keyboard.press('g');
  await page.keyboard.press('Backspace');
  assert.equal(await page.evaluate(() => window.nodes.length), 1);
  assert.deepEqual(await page.evaluate(() => window.__workspaceCheck.state.view), viewBefore);
  await page.evaluate(() => document.getElementById('shortcut-test-editor').remove());
  await page.keyboard.press('Home');
  assert.notDeepEqual(await page.evaluate(() => window.__workspaceCheck.state.view), viewBefore);
  const visible = await page.evaluate(() => {
    const n = window.nodes[0], v = window.__workspaceCheck.state.view;
    return { x: n.x * v.scale + v.x, y: n.y * v.scale + v.y };
  });
  assert.ok(visible.x > 140 && visible.x < 1400 && visible.y > 40 && visible.y < 860);
  const downloaded = page.waitForEvent('download');
  await page.keyboard.press('Control+s');
  const download = await downloaded;
  const chunks = [];
  for await (const chunk of await download.createReadStream()) chunks.push(chunk);
  const saved = JSON.parse(Buffer.concat(chunks).toString());
  for (const key of ['globalTransposeOffset', 'currentRootNote', 'scaleKeySequencer', 'mistGroups', 'performanceResoEnabled']) assert.ok(key in saved, `${key} survives project export`);
  assert.equal(await page.evaluate(() => window.__workspaceCheck.state.dirty), false);
  // Importing is a project boundary; undo must not resurrect the previous workspace.
  const chooserEvent = page.waitForEvent('filechooser');
  await page.keyboard.press('Control+o');
  const chooser = await chooserEvent;
  saved.nodes[0].x = 700;
  await chooser.setFiles({ name: 'workspace-check.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(saved)) });
  await page.waitForFunction(() => window.nodes[0]?.x === 700 && window.__workspaceCheck.state.history === 1);
  await page.keyboard.press('Control+z');
  assert.equal(await page.evaluate(() => window.nodes[0].x), 700);
  assert.deepEqual(errors, []);
  console.log('Workspace: stale pulse cancellation, editable shortcuts, fit view, full project export and isolated import history passed.');
} finally { await browser.close(); }
