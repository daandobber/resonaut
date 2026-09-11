import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const errors = []; page.on('pageerror', error => errors.push(error.message));
await page.route(/\/main\.js(?:\?.*)?$/, async route => {
  const response = await route.fetch();
  await route.fulfill({ response, body: await response.text() + `
    window.__sidebar = {
      open(type) {
        handleNewWorkspace(true);
        const node=addNode(740,400,type==='queen' ? QUEEN_MIND_TYPE : type);
        setActiveTool('edit');selectedElements.clear();selectedElements.add({type:'node',id:node.id});populateEditPanel();
        this.node=node;
      },
      tape(){if(tapeLooperPanel.classList.contains('hidden'))appMenuToggleTapeLooperBtn.click();},
      get params(){return this.node.audioParams;},
      get formation(){return this.node.lifeSystem?.currentFormation;},
      cleanup(){handleNewWorkspace(true);},
    };
  ` });
});
try {
  await page.goto(process.env.RESONAUT_URL || 'http://127.0.0.1:5000/');
  await page.locator('#startEngineBtn').click();
  await page.waitForFunction(()=>window.__sidebar && window.audioContext?.state==='running' && !document.getElementById('startEngineBtn').disabled);
  await page.locator('#loadingIndicator').waitFor({ state: 'hidden' });
  for (const type of ['note_loom','orbit_rhythm','chord_garden','arp_orbit','acid_mycelium','mind','queen']) {
    await page.evaluate(type=>window.__sidebar.open(type),type);
    const editor=page.locator(type==='mind'||type==='queen' ? '.symphiose-music-editor' : '.pattern-orb-editor');
    await editor.waitFor({ state: 'visible' });
    assert.equal(await editor.locator('details, [role="tab"], .pattern-step-detail').count(),0);
    if(type==='note_loom') {
      for(let i=0;i<9;i++) await editor.getByRole('button',{name:'Step 8 Note down',exact:true}).click();
      assert.equal(await page.evaluate(()=>window.__sidebar.params.steps[7].degree),-5);
      await editor.getByRole('button',{name:'Step 8, rest',exact:true}).click();
      assert.equal(await page.evaluate(()=>window.__sidebar.params.steps[7].enabled),true);
    }
    assert.equal(await editor.locator('input[type=number],input[type=text],select:not([hidden])').count(),0);
    if(type==='queen') {
      await editor.locator('[data-symphiose-param="moveWithHive"]').check();
      for(let i=0;i<3;i++) await editor.getByRole('button',{name:'Formation next',exact:true}).click();
      assert.equal(await page.evaluate(()=>window.__sidebar.formation),'spiral');
      await editor.locator('[data-symphiose-param="clawsEnabled"]').check();
      assert.equal(await editor.locator('[data-symphiose-param="stringTension"]').isEnabled(),true);
      await editor.locator('[data-symphiose-param="clawsEnabled"]').uncheck();
    }
    if(type==='acid_mycelium') {
      const knob=editor.locator('[data-pattern-param="cutoff"]');
      await knob.scrollIntoViewIfNeeded(); const box=await knob.boundingBox();
      await page.mouse.move(box.x+box.width/2,box.y+box.height/2);await page.mouse.down();await page.mouse.move(box.x+box.width/2,box.y+box.height/2-25,{steps:6});await page.mouse.up();
      assert.ok(await page.evaluate(()=>window.__sidebar.params.cutoff)>450);
    }
    const size=await editor.evaluate(el=>({ width:el.clientWidth,scrollWidth:el.scrollWidth,height:el.getBoundingClientRect().height }));
    assert.ok(size.scrollWidth<=size.width+1,`${type} fits horizontally: ${JSON.stringify(size)}`);
    await page.locator('#hamburgerMenuPanel').evaluate(el=>{el.scrollTop=0;});
    await page.screenshot({path:path.join(os.tmpdir(),`resonaut-sidebar-${type}.png`)});
    console.log(type,size);
  }
  await page.evaluate(()=>window.__sidebar.open('grid_sequencer'));
  const lab=page.locator('.grid-pattern-lab');await lab.waitFor({state:'visible'});
  assert.equal(await lab.locator('input[type=number],input[type=text],select:not([hidden])').count(),0);
  await lab.locator('summary').click();
  const hits=lab.getByRole('slider',{name:'Hits',exact:true});await hits.press('End');
  await lab.getByRole('button',{name:'Generate evenly spaced hits on the selected row',exact:true}).click();
  assert.ok(await page.evaluate(()=>window.__sidebar.node.grid[0].every(Boolean)));
  await page.evaluate(()=>window.__sidebar.tape());
  const tape=page.locator('#tapeLooperPanel');await tape.waitFor({state:'visible'});
  assert.equal(await tape.locator('input[type=number],input[type=text],select:not([hidden])').count(),0);
  await tape.locator('.tape-character-drawer summary').click();
  await tape.getByRole('button',{name:'Tape record length next',exact:true}).click();
  assert.equal(await tape.locator('#tapeRecordBars').inputValue(),'1');
  await page.screenshot({path:path.join(os.tmpdir(),'resonaut-tape-controls.png')});
  console.log('Pattern Lab generation and tape recording controls passed.');
  await page.evaluate(()=>window.__sidebar.cleanup());
  assert.deepEqual(errors,[]);
} finally { await browser.close(); }
