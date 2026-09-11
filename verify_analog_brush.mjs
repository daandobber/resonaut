import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  permissions: [],
});
const page = await context.newPage();

const logs = [];
const errors = [];
page.on('console', msg => logs.push(`[${msg.type()}] ${msg.text()}`));
page.on('pageerror', err => errors.push(err.message));

await page.goto('http://localhost:5174/', { waitUntil: 'networkidle', timeout: 15000 });
await page.waitForTimeout(1000);

// Screenshot initial state
await page.screenshot({ path: 'verify_01_initial.png' });

// Click canvas to init audio (AudioContext needs user gesture)
const canvas = await page.$('canvas');
if (!canvas) {
  console.log('ERROR: No canvas found');
  await browser.close();
  process.exit(1);
}

// Simulate a click to start AudioContext
await page.click('canvas', { position: { x: 400, y: 300 } });
await page.waitForTimeout(500);

// ---- STEP 1: Find and click the brush button ----
// Look for brushBtn
const brushBtn = await page.$('#brushBtn, [id*="brush"], button[title*="rush"]');
if (!brushBtn) {
  // Try to find it by looking at all buttons
  const allBtns = await page.$$('button');
  let found = null;
  for (const btn of allBtns) {
    const id = await btn.getAttribute('id');
    const title = await btn.getAttribute('title');
    if ((id && id.toLowerCase().includes('brush')) || (title && title.toLowerCase().includes('brush'))) {
      found = btn;
      break;
    }
  }
  if (!found) {
    console.log('ERROR: Could not find brush button');
    const html = await page.content();
    // Print button IDs
    const btnIds = await page.$$eval('button', btns => btns.map(b => b.id + '/' + b.title + '/' + b.textContent?.slice(0, 20)).join('\n'));
    console.log('Buttons found:\n' + btnIds.slice(0, 500));
    await page.screenshot({ path: 'verify_02_no_brush.png' });
    await browser.close();
    process.exit(1);
  } else {
    await found.click();
  }
} else {
  await brushBtn.click();
}
await page.waitForTimeout(500);
await page.screenshot({ path: 'verify_02_brush_open.png' });

// ---- STEP 2: Find analog preset buttons in the brush panel ----
// Look for "Analog" section header and buttons
const sideToolbar = await page.$('#sideToolbar, .side-toolbar, [id*="sidebar"]');
const brushButtons = await page.$$('.brush-option-icon-button');
console.log(`Found ${brushButtons.length} brush option buttons`);

// Find an analog one (first 4 are likely sine/square/sawtooth/triangle)
let analogButton = null;
if (brushButtons.length > 0) {
  analogButton = brushButtons[2]; // sawtooth (3rd analog preset)
  const title = await analogButton.getAttribute('title');
  console.log(`Clicking analog button: ${title}`);
  await analogButton.click();
  await page.waitForTimeout(300);
}
await page.screenshot({ path: 'verify_03_analog_selected.png' });

// ---- STEP 3: Disable "Start chain with Pulsar" to place sound node directly ----
const pulseCheckbox = await page.$('#brushStartPulseCheckbox');
if (pulseCheckbox) {
  const checked = await pulseCheckbox.isChecked();
  console.log(`brushStartWithPulse: ${checked}`);
  if (checked) {
    // Uncheck it so we place sound node directly first time
    await pulseCheckbox.uncheck();
    await page.waitForTimeout(200);
    console.log('Unchecked brushStartWithPulse');
  }
}

// ---- STEP 4: Click canvas to place a sound node ----
// First click to init audio
await page.click('canvas', { position: { x: 300, y: 300 }, force: true });
await page.waitForTimeout(800);
await page.screenshot({ path: 'verify_04_node_placed.png' });

// ---- Check console for errors ----
const analogErrors = errors.filter(e => e.includes('analog') || e.includes('tone') || e.includes('createAnalogOrb'));
const analogLogs = logs.filter(l => l.includes('ANALOG') || l.includes('analog') || l.includes('engine') || l.includes('tone'));

console.log('\n=== CONSOLE LOGS (analog/tone related) ===');
analogLogs.forEach(l => console.log(l));
console.log('\n=== ERRORS ===');
errors.forEach(e => console.log(e));

// ---- STEP 5: Check the node was created with engine=tone ----
const nodeInfo = await page.evaluate(() => {
  // Access the nodes array from window
  if (!window.nodes) return 'No window.nodes';
  const soundNodes = window.nodes.filter(n => n.type === 'sound');
  return soundNodes.map(n => ({
    id: n.id,
    type: n.type,
    engine: n.audioParams?.engine,
    waveform: n.audioParams?.waveform,
    osc1Waveform: n.audioParams?.osc1Waveform,
    hasAudioNodes: !!n.audioNodes,
    hasGainNode: !!n.audioNodes?.gainNode,
  }));
});
console.log('\n=== SOUND NODES ===');
console.log(JSON.stringify(nodeInfo, null, 2));

// ---- STEP 6: Check if analog nodes from INSTRUMENTS toolbar also have engine=tone ----
// Click add button to open instruments
// First, close brush
await page.keyboard.press('Escape');
await page.waitForTimeout(300);

await browser.close();
