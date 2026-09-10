// @vitest-environment jsdom
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { buildPatternOrbEditor } from '../patternOrbUI.js';
import { mountSymphioseEditor } from '../symphioseUI.js';
import { patternDefaults, rhythmHit } from '../utils/patternOrbs.js';

beforeEach(() => { vi.stubGlobal('requestAnimationFrame', vi.fn()); });
afterEach(() => { document.body.replaceChildren(); vi.unstubAllGlobals(); });
const subdivisions = [{ label: '1/4' }, { label: '1/8' }, { label: '1/16' }];
it.each(['chord_garden', 'arp_orbit', 'acid_mycelium'])('exposes %s musical controls and every note without submenus', type => {
  const node = { type, audioParams: patternDefaults(type) };
  const editor = buildPatternOrbEditor(node, { onChange: vi.fn(), onStep: vi.fn(), subdivisionOptions: subdivisions });
  document.body.append(editor);
  expect(editor.querySelector('input[type=number], input[type=text], select:not([hidden])')).toBeNull();
  expect(editor.querySelector('details')).toBeNull();
  expect(editor.querySelectorAll('[data-step-param="degree"]')).toHaveLength(type==='acid_mycelium'?16:4);
  if (type === 'chord_garden') {
    change(editor.querySelector('[data-pattern-param="chordShape"]'), 'seventh');
    change(editor.querySelector('[data-pattern-param="openVoicing"]'), 'true');
    change(editor.querySelector('[data-pattern-param="strumMs"]'), 50);
    expect(node.audioParams).toMatchObject({ chordShape: 'seventh', openVoicing: true, strumMs: 50 });
  } else if(type==='arp_orbit') {
    change(editor.querySelector('[data-pattern-param="octaves"]'), 3);
    expect(node.audioParams.octaves).toBe(3);
  } else {
    editor.querySelector('[data-step-param="slide"][data-step-index="0"]').click();
    expect(node.audioParams.steps[0].slide).toBe(true);
    change(editor.querySelector('[data-pattern-param="cutoff"]'),1600);
    expect(node.audioParams.cutoff).toBe(1600);
  }
});
function change(input, value) {
  input.value = String(value); input.dispatchEvent(new Event('change', { bubbles: true }));
}

it('edits multiple notes and dynamics directly without a selected-step menu or losing focus', () => {
  const node = { type: 'note_loom', audioParams: patternDefaults('note_loom') }, save = vi.fn();
  const editor = buildPatternOrbEditor(node, { onChange: save, onStep: vi.fn(), subdivisionOptions: subdivisions });
  document.body.append(editor);
  expect(editor.querySelector('details, .pattern-step-detail')).toBeNull();
  expect(editor.querySelectorAll('[data-step-param="degree"]')).toHaveLength(16);
  const note = editor.querySelector('[data-step-index="7"][data-step-param="degree"]');
  note.focus(); change(note, -5);
  expect(document.activeElement).toBe(note);
  change(editor.querySelector('[data-step-index="2"][data-step-param="velocity"]'), 40);
  change(editor.querySelector('[data-step-index="7"][data-step-param="probability"]'), 25);
  expect(node.audioParams.steps[7].degree).toBe(-5);
  expect(node.audioParams.steps[7].probability).toBe(.25);
  expect(node.audioParams.steps[2].velocity).toBe(.4);
  expect(save).toHaveBeenCalledTimes(3);
  editor.querySelector('[data-pattern-step="7"]').click();
  expect(node.audioParams.steps[7].enabled).toBe(true);
  expect(node.audioParams.steps[7].degree).toBe(-5);
  change(editor.querySelector('[data-pattern-param="length"]'), 32);
  expect(editor.querySelectorAll('[data-step-param="degree"]')).toHaveLength(32);
  expect(node.audioParams.steps[7].degree).toBe(-5);
});

it.each(['note_loom', 'chord_garden', 'arp_orbit', 'acid_mycelium'])('gives %s a Random button that reshuffles the pattern and commits once', type => {
  const node = { type, audioParams: patternDefaults(type) }, save = vi.fn();
  const before = JSON.stringify(node.audioParams.steps);
  const editor = buildPatternOrbEditor(node, { onChange: save, onStep: vi.fn(), subdivisionOptions: subdivisions });
  document.body.append(editor);
  const randomBtn = [...editor.querySelectorAll('.pattern-actions button')].find(b => b.textContent === 'Random');
  expect(randomBtn).toBeTruthy();
  randomBtn.click();
  expect(JSON.stringify(node.audioParams.steps)).not.toBe(before);
  expect(save).toHaveBeenCalledOnce();
  expect(node.audioParams.steps.slice(0, node.audioParams.length).some(s => s.enabled)).toBe(true);
});

it('defaults freshly created melodic pattern orbs to following the project scale', () => {
  expect(patternDefaults('note_loom').noteMode).toBe('absolute');
  expect(patternDefaults('acid_mycelium').noteMode).toBe('absolute');
});

it('keeps generated rhythm and external clock controls directly editable', () => {
  const node = { type: 'orbit_rhythm', audioParams: patternDefaults('orbit_rhythm') };
  const editor = buildPatternOrbEditor(node, { onChange: vi.fn(), onStep: vi.fn(), subdivisionOptions: subdivisions });
  expect(editor.querySelector('details')).toBeNull();
  const oldHit = rhythmHit(node.audioParams, 0);
  editor.querySelector('[data-pattern-step="0"]').click();
  expect(rhythmHit(node.audioParams, 0)).toBe(!oldHit);
  change(editor.querySelector('[data-pattern-param="advanceOnPulse"]'), 'true');
  expect(editor.querySelector('[data-pattern-param="syncSubdivisionIndex"]').disabled).toBe(true);
  change(editor.querySelector('[data-pattern-param="advanceOnPulse"]'), 'false');
  expect(editor.querySelector('[data-pattern-param="syncSubdivisionIndex"]').disabled).toBe(false);
});

it('shows Mind and Hive controls once, without nested pages, and updates dependent controls in place', () => {
  const node = { audioParams: { isQueen: true, isAlive: false, clawsEnabled: false, moveWithHive: false, dreamDepth: 4 } };
  const save = vi.fn(changes => Object.assign(node.audioParams, changes));
  const editor = mountSymphioseEditor(node, save, { subdivisionOptions: subdivisions });
  document.body.append(editor);
  expect(editor.querySelector('details')).toBeNull();
  const inputs = [...editor.querySelectorAll('[data-symphiose-param]')];
  expect(new Set(inputs.map(input => input.dataset.symphioseParam)).size).toBe(inputs.length);
  const tension = editor.querySelector('[data-symphiose-param="stringTension"]');
  expect(tension.disabled).toBe(true);
  editor.querySelector('[data-symphiose-param="clawsEnabled"]').click();
  expect(node.audioParams.clawsEnabled).toBe(true);
  expect(tension.disabled).toBe(false);
  change(tension, .45);
  expect(node.audioParams.stringTension).toBe(.45);
  editor.querySelector('[data-symphiose-preset="conversation"]').click();
  expect(editor.querySelector('[data-symphiose-param="dreamDepth"]').value).toBe('7');
  expect(editor.querySelector('[data-symphiose-param="progression"]').value).toBe('orbit');
});
