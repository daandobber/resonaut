// Upgrade the editors' native value controls while retaining their existing
// model bindings, keyboard support, disabled states and undo/commit events.
function observeProperty(input, key, sync) {
  const descriptor=Object.getOwnPropertyDescriptor(Object.getPrototypeOf(input),key);
  if(!descriptor?.set)return;
  Object.defineProperty(input,key,{configurable:true,get(){return descriptor.get.call(this);},set(value){const before=descriptor.get.call(this);descriptor.set.call(this,value);if(before!==descriptor.get.call(this))sync();}});
}
function labelFor(input) {
  return input.getAttribute('aria-label') || input.labels?.[0]?.firstChild?.textContent?.trim() || input.closest('label')?.firstChild?.textContent?.trim() || input.title || 'Value';
}
function emit(input,type) {input.dispatchEvent(new Event(type,{bubbles:true}));}

function numeric(input) {
  const value=input.value,label=labelFor(input);
  input.type='range';input.value=value;
  // Preserve existing fractional timings (e.g. 0.125 s) and preset values that
  // did not align with the old number field's suggested increment.
  if(value!=='' && Number(input.value)!==Number(value) && Number(value)>=Number(input.min||0) && Number(value)<=Number(input.max||100)) {
    const decimals=Math.max((value.split('.')[1]||'').length,(input.min.split('.')[1]||'').length);
    input.step=String(Math.min(Number(input.step)||1,10**-decimals));input.value=value;
  }
  input.setAttribute('aria-label',label);
  const kind=input.dataset.stepParam==='degree'?'pitch':input.dataset.stepParam?'fader':'dial';
  const wrapper=document.createElement('span');wrapper.className=`instrument-control instrument-${kind}`;
  input.replaceWith(wrapper);wrapper.append(input);
  const output=document.createElement('output');output.setAttribute('aria-hidden','true');wrapper.append(output);
  const min=()=>Number(input.min||0),max=()=>Number(input.max||100),step=()=>Number(input.step)||1;
  const set=(value,commit=false)=>{
    if(input.disabled)return;
    input.value=String(Math.max(min(),Math.min(max(),min()+Math.round((value-min())/step())*step())));
    sync();emit(input,'input');if(commit)emit(input,'change');
  };
  const sync=()=>{
    output.textContent=String(Number(Number(input.value).toFixed(3)));
    input.setAttribute('aria-valuetext',output.textContent);
    wrapper.style.setProperty('--dial-angle',`${-135+270*(Number(input.value)-min())/(max()-min()||1)}deg`);
    wrapper.classList.toggle('disabled',input.disabled);
    wrapper.querySelectorAll('button').forEach(b=>b.disabled=input.disabled);
  };
  if(kind==='pitch') {
    for(const [text,delta] of [['+',1],['−',-1]]) {
      const b=document.createElement('button');b.type='button';b.textContent=text;
      b.setAttribute('aria-label',`${label} ${delta>0?'up':'down'}`);
      b.addEventListener('click',()=>set(Number(input.value)+delta*step(),true));wrapper.append(b);
    }
    input.classList.add('instrument-pitch-keys');
  } else if(kind==='dial') {
    const needle=document.createElement('i');needle.className='instrument-needle';needle.setAttribute('aria-hidden','true');wrapper.append(needle);
    let drag;
    input.addEventListener('pointerdown',event=>{
      if(input.disabled || event.button!==0)return;
      event.preventDefault();input.focus();input.setPointerCapture?.(event.pointerId);
      drag={id:event.pointerId,y:event.clientY,x:event.clientX,value:Number(input.value)};
    });
    input.addEventListener('pointermove',event=>{
      if(!drag || event.pointerId!==drag.id)return;
      const distance=drag.y-event.clientY+(event.clientX-drag.x)*.4;
      set(drag.value+distance*(max()-min())/(event.shiftKey?1200:180));
    });
    const end=event=>{if(!drag || event.pointerId!==drag.id)return;drag=null;emit(input,'change');};
    input.addEventListener('pointerup',end);input.addEventListener('pointercancel',end);input.addEventListener('lostpointercapture',end);
  }
  input.addEventListener('input',sync);input.addEventListener('change',sync);
  observeProperty(input,'value',sync);observeProperty(input,'disabled',sync);sync();
}

function choices(input) {
  const label=labelFor(input),wrapper=document.createElement('span');wrapper.className='instrument-choices';
  wrapper.setAttribute('role','group');wrapper.setAttribute('aria-label',label);
  input.replaceWith(wrapper);wrapper.append(input);input.hidden=true;
  const buttons=[];
  const choose=value=>{if(input.disabled)return;input.value=value;emit(input,'change');sync();};
  function button(text,action){const b=document.createElement('button');b.type='button';b.textContent=text;b.addEventListener('click',action);wrapper.append(b);buttons.push(b);return b;}
  let display;
  if(input.options.length<=4 && [...input.options].every(option=>option.textContent.length<=18)) {
    [...input.options].forEach(option=>{const b=button(option.textContent,()=>choose(option.value));b.dataset.choiceValue=option.value;});
  } else {
    wrapper.classList.add('instrument-cycle');
    const prev=button('‹',()=>choose(input.options[(input.selectedIndex-1+input.options.length)%input.options.length].value));prev.setAttribute('aria-label',`${label} previous`);
    display=button('',()=>choose(input.options[(input.selectedIndex+1)%input.options.length].value));
    const next=button('›',()=>choose(input.options[(input.selectedIndex+1)%input.options.length].value));next.setAttribute('aria-label',`${label} next`);
  }
  const sync=()=>{
    if(display){const text=input.selectedOptions[0]?.textContent||'—';if(display.textContent!==text){display.textContent=text;display.setAttribute('aria-label',`${label}: ${text}`);}}
    buttons.forEach(b=>{
      if(b.disabled!==input.disabled)b.disabled=input.disabled;
      if(b.dataset.choiceValue!==undefined){const pressed=String(b.dataset.choiceValue===input.value);if(b.getAttribute('aria-pressed')!==pressed)b.setAttribute('aria-pressed',pressed);}
    });
  };
  input.syncInstrumentControl=sync;input.addEventListener('change',sync);sync();
}

export function instrumentControls(root) {
  root.querySelectorAll('input[type="number"],select').forEach(input=>{
    if(input.dataset.instrumentControl)return;
    input.dataset.instrumentControl='true';
    if(input.tagName==='SELECT')choices(input);else numeric(input);
  });
}

export function syncInstrumentControls(root) { root.querySelectorAll('select[data-instrument-control]').forEach(input=>input.syncInstrumentControl?.()); }
