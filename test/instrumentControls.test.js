// @vitest-environment jsdom
import {it,expect,vi,afterEach} from 'vitest';
import {instrumentControls,syncInstrumentControls} from '../utils/instrumentControls.js';
afterEach(()=>document.body.replaceChildren());
it('keeps fractional timings when replacing number fields',()=>{
  document.body.innerHTML='<input type="number" min="0.04" max="4" step="0.01" value="0.125">';
  instrumentControls(document.body);expect(document.querySelector('input').value).toBe('0.125');
  expect(document.querySelector('output').textContent).toBe('0.125');
});
it('drags a dial live, commits once, and preserves programmatic values and disabled state',()=>{
  document.body.innerHTML='<label>Cutoff<input type="number" min="0" max="100" step="1" value="20"></label>';
  const input=document.querySelector('input'),live=vi.fn(),commit=vi.fn();input.addEventListener('input',live);input.addEventListener('change',commit);
  instrumentControls(document.body);
  input.dispatchEvent(new MouseEvent('pointerdown',{clientX:0,clientY:100,button:0}));
  input.dispatchEvent(new MouseEvent('pointermove',{clientX:0,clientY:64}));
  expect(input.value).toBe('40');expect(commit).not.toHaveBeenCalled();expect(live).toHaveBeenCalledOnce();
  input.dispatchEvent(new MouseEvent('pointerup'));expect(commit).toHaveBeenCalledOnce();
  input.value='75';expect(document.querySelector('output').textContent).toBe('75');
  input.disabled=true;expect(input.parentElement.classList.contains('disabled')).toBe(true);
});
it('edits notes with keys and respects note limits without an editable number field',()=>{
  document.body.innerHTML='<input aria-label="Step 1 Note" data-step-param="degree" type="number" min="-2" max="2" value="1">';
  instrumentControls(document.body);const input=document.querySelector('input');
  document.querySelector('[aria-label="Step 1 Note up"]').click();document.querySelector('[aria-label="Step 1 Note up"]').click();expect(input.value).toBe('2');
  document.querySelector('[aria-label="Step 1 Note down"]').click();expect(input.value).toBe('1');
  expect(document.querySelector('input[type=number]')).toBeNull();
});
it('updates choice keys and their disabled states when presets change',()=>{
  document.body.innerHTML='<label>Direction<select><option value="up">Up</option><option value="down">Down</option></select></label>';
  instrumentControls(document.body);const select=document.querySelector('select'),commit=vi.fn();select.addEventListener('change',commit);
  document.querySelector('[data-choice-value="down"]').click();expect(select.value).toBe('down');expect(commit).toHaveBeenCalledOnce();
  select.value='up';select.disabled=true;syncInstrumentControls(document.body);
  expect(document.querySelector('[data-choice-value="up"]').getAttribute('aria-pressed')).toBe('true');
  expect(document.querySelector('[data-choice-value="down"]').disabled).toBe(true);
});
