import { HUE_STEP } from './paletteConstants.js';
const PLANTS = new Set(['note_loom', 'chord_garden', 'arp_orbit', 'acid_mycelium']);
const FLOWERS = new Set(['sound', 'resonauter', 'radio_orb', 'alien_orb', 'prorb', 'midi_orb']);
export const isBotanicalPlant = node => PLANTS.has(node?.type);
const poses = new WeakMap(), colors = new WeakMap(), blooms = new WeakMap();
let moving = false;
export const hasBotanicalMotion = () => moving;
const wrap = (value, period) => ((value % period) + period) % period;
const mixAngle = (a, b, t, period) => a + (wrap(b-a+period/2,period)-period/2)*t;
const seed = node => {
  let n=[...String(node.id ?? node.type)].reduce((n,c)=>Math.imul(n^c.charCodeAt(0),16777619)>>>0,2166136261);
  n=Math.imul(n^(n>>>16),0x85ebca6b);n=Math.imul(n^(n>>>13),0xc2b2ae35);
  return ((n^(n>>>16))>>>0)/4294967296;
};
const clock = () => performance.now()/1000;

export function botanicalPalette(node, palette = {}, time = clock()) {
  const base = palette.baseHSL || {h:200,s:70,l:70};
  const degree = node.audioParams?.scaleIndex ?? (node.type==='chord_garden'?2:node.type==='arp_orbit'?4:0);
  const target = {h:wrap(base.h+(degree % (palette.notes?.length || 7))*HUE_STEP,360),s:base.s,l:Math.max(48,Math.min(82,base.l))};
  let state = colors.get(node);
  if (!state) colors.set(node,state={...target,time});
  const t = 1-Math.exp(-Math.max(0,time-state.time)/.18);
  state.h=mixAngle(state.h,target.h,t,360);state.s+=(target.s-state.s)*t;state.l+=(target.l-state.l)*t;state.time=time;
  if(Math.abs(mixAngle(state.h,target.h,1,360)-state.h)+Math.abs(state.s-target.s)+Math.abs(state.l-target.l)>.3)moving=true;
  return `hsl(${state.h} ${state.s}% ${state.l}%)`;
}

export function updateBotanicalLayout(nodes, connections, time = clock()) {
  moving=false;
  const byId=new Map(nodes.map(n=>[n.id,n])), directions=new Map();
  for(const c of connections) {
    const a=byId.get(c.nodeAId),b=byId.get(c.nodeBId);
    if(!a||!b)continue;
    for(const [plant,other] of [[a,b],[b,a]]) if(isBotanicalPlant(plant)&&FLOWERS.has(other.type)) {
      const v=directions.get(plant)||{x:0,y:0};const d=Math.hypot(other.x-plant.x,other.y-plant.y)||1;
      v.x+=(other.x-plant.x)/d;v.y+=(other.y-plant.y)/d;directions.set(plant,v);
    }
  }
  for(const node of nodes) if(isBotanicalPlant(node)) {
    const variation=(seed(node)-.5)*1.45, v=directions.get(node);
    const target=(v&&Math.hypot(v.x,v.y)>.01?Math.atan2(v.y,v.x)+Math.PI/2:0)+variation;
    let state=poses.get(node);
    if(!state)poses.set(node,state={angle:target,time});
    state.angle=mixAngle(state.angle,target,1-Math.exp(-Math.max(0,time-state.time)/.35),Math.PI*2);state.time=time;
    if(Math.abs(mixAngle(state.angle,target,1,Math.PI*2)-state.angle)>.003)moving=true;
  }
}

export function plantPose(node) { return poses.get(node)?.angle ?? (seed(node)-.5)*1.45; }
export function plantAnchor(node, radius) {
  const a=plantPose(node), x=(node.type==='arp_orbit'?.08875:-.0075)*radius,y=.0175*radius;
  return {x:node.x+x*Math.cos(a)-y*Math.sin(a),y:node.y+x*Math.sin(a)+y*Math.cos(a)};
}

export function flowerTransition(node, time = clock()) {
  const note=node.audioParams?.scaleIndex || 0, target=note*.12;
  let state=blooms.get(node);
  if(!state)blooms.set(node,state={rotation:target,pulse:0,note,time,changedAt:-Infinity});
  if(state.note!==note){state.note=note;state.changedAt=time;}
  const t=1-Math.exp(-Math.max(0,time-state.time)/.14);
  state.rotation=mixAngle(state.rotation,target,t,Math.PI*2);
  state.pulse+=(Math.max(0,Math.min(1,node.animationState||0))-state.pulse)*t;
  state.time=time;
  const age=Math.max(0,time-state.changedAt);
  if(age<.6||Math.abs(mixAngle(state.rotation,target,1,Math.PI*2)-state.rotation)>.003||Math.abs(state.pulse-(node.animationState||0))>.003)moving=true;
  return {rotation:state.rotation,pulse:state.pulse,unfurl:Math.sin(Math.min(1,age/.6)*Math.PI)};
}

// Derive appearance from cables, without changing an instrument or its preset.
export function botanicalConnections(nodes, connections, isOneWay = () => false) {
  const byId = new Map(nodes.map(node => [node.id, node]));
  const flowers = new Map();
  for (const cable of connections) {
    const a = byId.get(cable.nodeAId), b = byId.get(cable.nodeBId);
    if (!a || !b) continue;
    if (PLANTS.has(a.type) && FLOWERS.has(b.type)) flowers.set(b.id, a.type);
    else if (!isOneWay(cable) && PLANTS.has(b.type) && FLOWERS.has(a.type)) flowers.set(a.id, b.type);
  }
  return flowers;
}

function leaf(ctx, x, y, tipX, tipY, width, active) {
  const dx = tipX - x, dy = tipY - y, length = Math.hypot(dx, dy) || 1;
  const nx = -dy / length * width, ny = dx / length * width;
  ctx.beginPath(); ctx.moveTo(x, y);
  ctx.bezierCurveTo(x + dx * .3 + nx, y + dy * .3 + ny, tipX + nx * .5, tipY + ny * .5, tipX, tipY);
  ctx.bezierCurveTo(tipX - nx * .5, tipY - ny * .5, x + dx * .3 - nx, y + dy * .3 - ny, x, y);
  if (active) { const alpha = ctx.globalAlpha; ctx.globalAlpha *= .2; ctx.fill(); ctx.globalAlpha = alpha; }
  ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x,y); ctx.quadraticCurveTo(x+dx*.55,y+dy*.45,tipX,tipY); ctx.stroke();
}

// All coordinates stay within the existing circular hit area.
export function drawPlant(ctx, node, radius, scale, state, palette) {
  const p = node.audioParams, count = Math.max(2, Math.min(32, p.length || 16));
  const garden = node.type === 'chord_garden', vine = node.type === 'arp_orbit';
  ctx.save(); ctx.rotate(plantPose(node)); ctx.scale(radius, radius);
  ctx.strokeStyle = ctx.fillStyle = botanicalPalette(node, palette);
  ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.lineWidth = 1.2 / (radius * scale);
  if(node.type==='acid_mycelium') {
    // A mycelial fan: one fruiting body per step, with lit gills at the playhead.
    for(let i=0;i<count;i++) {
      const t=i/(count-1),a=-Math.PI*.94+t*Math.PI*.88;
      const r=.46+(i%3)*.12,x=Math.cos(a)*r,y=Math.sin(a)*r;
      const active=state.step===i,cell=p.steps[i];
      ctx.globalAlpha=cell?.enabled===false?.2:active?1:.72;
      ctx.lineWidth=(active?2:1.1)/(radius*scale);
      ctx.beginPath();ctx.moveTo(0,.35);ctx.bezierCurveTo(x*.6,.2,x*.75,y+.25,x,y);ctx.stroke();
      const cap=Math.min(.16,1.8/count)*(cell?.accent?1.2:1);
      ctx.beginPath();ctx.moveTo(x-cap,y);ctx.bezierCurveTo(x-cap,y-cap*1.6,x+cap,y-cap*1.6,x+cap,y);
      ctx.quadraticCurveTo(x,y+cap*.35,x-cap,y);ctx.stroke();
      for(const offset of [-.5,0,.5]){ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+offset*cap,y-cap*.8);ctx.stroke();}
    }
    ctx.globalAlpha=.5;
    for(let i=0;i<7;i++) {
      const x=(i-3)*.16,y=.6+(i%2)*.18;
      ctx.beginPath();ctx.moveTo(0,.35);ctx.quadraticCurveTo(x*.8,.5,x,y);ctx.lineTo(x+.06,y+.06);ctx.moveTo(x*.8,.55);ctx.lineTo(x-.09,y);ctx.stroke();
    }
    ctx.restore();return;
  }
  ctx.beginPath(); ctx.moveTo(0,.87);
  ctx.bezierCurveTo(-.12,.3, vine ? .33 : .1,-.25, vine ? .08 : 0,-.88); ctx.stroke();
  // Small exposed roots anchor each plant, with no enclosing orb outline.
  ctx.globalAlpha = .55;
  for (const side of [-1,1]) {
    ctx.beginPath();ctx.moveTo(0,.72);ctx.quadraticCurveTo(side*.12,.87,side*.27,.89);ctx.stroke();
  }
  for (let i=0;i<count;i++) {
    const t = count === 1 ? 0 : i/(count-1), active = state.step === i;
    const enabled = p.steps?.[i]?.enabled !== false;
    const degree = Math.max(-14,Math.min(14,p.steps?.[i]?.degree || 0));
    ctx.globalAlpha = enabled ? (active ? 1 : .72) : .2;
    ctx.lineWidth = (active ? 2 : 1.1) / (radius*scale);
    if (garden) {
      const angle = -.92*Math.PI + t*.84*Math.PI;
      const reach = .6 + (Math.sin(i*2.4+seed(node)*6)+1)*.09;
      const x = Math.cos(angle)*reach, y = Math.sin(angle)*reach - .04;
      ctx.beginPath();ctx.moveTo(0,.53);ctx.bezierCurveTo(x*.15,.13,x*.85,y+.3,x,y);ctx.stroke();
      leaf(ctx,x*.5,.2+y*.4,x*.5+(i%2?1:-1)*.16,y*.55,.055,active);
      const petals = p.chordShape === 'seventh' || p.chordShape === 'sixth' ? 4 : 3;
      for(let j=0;j<petals;j++) {
        const a = -Math.PI/2+(j-(petals-1)/2)*.65;
        leaf(ctx,x,y,x+Math.cos(a)*.14,y+Math.sin(a)*.14,.043,active);
      }
    } else {
      const side = i%2 ? 1 : -1;
      const y = .6-t*1.34;
      const x = vine ? Math.sin(t*Math.PI*3)*.19 : .02*Math.sin(t*Math.PI);
      const reach = (.45 + degree*.009) * (1-.48*t) * (.85+.2*Math.sin(i*2.1+seed(node)*8));
      if(vine) {
        ctx.beginPath();ctx.moveTo(0,y+.15);ctx.quadraticCurveTo(x+side*.25,y+.02,x,y);ctx.stroke();
      }
      leaf(ctx,x,y,x+side*reach,y-.16,Math.min(.105,1.25/count),active);
    }
  }
  ctx.globalAlpha=1;
  ctx.beginPath();ctx.arc(vine ? .08 : 0,-.88,.025,0,Math.PI*2);ctx.fill();
  ctx.restore();
}

export function drawFlower(ctx, node, radius, scale, plantType, palette) {
  ctx.save();ctx.translate(node.x,node.y);
  ctx.shadowBlur=0;ctx.strokeStyle=botanicalPalette(node,palette);ctx.fillStyle=ctx.strokeStyle;
  ctx.lineWidth=1.3/scale;ctx.lineCap='round';
  const {pulse,rotation,unfurl}=flowerTransition(node);
  const petals=plantType==='chord_garden'?6:plantType==='arp_orbit'?8:5;
  const r=radius*(.83+.13*pulse-.07*unfurl), center=radius*.19;
  for(let i=0;i<petals;i++) {
    const angle=i/petals*Math.PI*2+rotation;
    ctx.save();ctx.rotate(angle);
    ctx.globalAlpha=.82+.18*pulse;
    leaf(ctx,center,0,r,0,r*(plantType==='arp_orbit'?.2:.32)*(1+.3*unfurl),false);
    ctx.restore();
  }
  ctx.beginPath();ctx.arc(0,0,center,0,Math.PI*2);ctx.stroke();
  for(let i=0;i<5;i++) {
    const a=i*Math.PI*2/5;
    ctx.beginPath();ctx.arc(Math.cos(a)*center*.5,Math.sin(a)*center*.5,1/scale,0,Math.PI*2);ctx.fill();
  }
  ctx.restore();
}

export function drawBotanicalBranch(ctx, a, b, connection, start, end, scale, palette, selected) {
  const plant=isBotanicalPlant(a)?a:isBotanicalPlant(b)?b:null;
  if(!plant || !['standard','one_way',undefined,null].includes(connection.type)) return false;
  const control={x:(start.x+end.x)/2+(connection.controlPointOffsetX||0),y:(start.y+end.y)/2+(connection.controlPointOffsetY||0)};
  const point=t=>({x:(1-t)**2*start.x+2*(1-t)*t*control.x+t*t*end.x,y:(1-t)**2*start.y+2*(1-t)*t*control.y+t*t*end.y});
  ctx.save();ctx.setLineDash([]);ctx.lineCap='round';ctx.shadowBlur=0;
  ctx.strokeStyle=ctx.fillStyle=selected?'rgba(255,255,0,.9)':botanicalPalette(plant,palette);
  ctx.globalAlpha=selected?1:.75;
  let previous=start;
  for(let i=1;i<=32;i++) {
    const t=i/32,p=point(t),growth=plant===a?t:1-t;
    ctx.lineWidth=(2.1-growth*1.25+(selected?1:0))/scale;
    ctx.beginPath();ctx.moveTo(previous.x,previous.y);ctx.lineTo(p.x,p.y);ctx.stroke();previous=p;
  }
  const length=Math.hypot(end.x-start.x,end.y-start.y);
  const count=Math.min(4,Math.floor(length/70));
  for(let i=0;i<count;i++) {
    const t=(i+1)/(count+1),p=point(t),q=point(Math.min(1,t+.01));
    const angle=Math.atan2(q.y-p.y,q.x-p.x)+(plant===a?0:Math.PI);
    ctx.save();ctx.translate(p.x,p.y);ctx.rotate(angle);
    const side=i%2?1:-1,size=Math.min(15,length*.055);
    ctx.lineWidth=1/scale;
    leaf(ctx,0,0,size*.8,side*size,size*.26,false);
    ctx.restore();
  }
  ctx.restore();return true;
}

export function drawBotanicalPulse(ctx, pulse, x, y, angle, scale, source, palette, progress) {
  ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.shadowBlur=0;
  ctx.strokeStyle=ctx.fillStyle=botanicalPalette(source,palette);
  ctx.lineWidth=1.15/scale;
  const size=(4+Math.min(1,pulse.intensity||.5)*2)/scale;
  // A winged seed with a short, deterministic spore wake; no particle emitters.
  const phase=progress*Math.PI*6+(pulse.id||0);
  for(let i=3;i>=1;i--) {
    ctx.globalAlpha=(4-i)*.16;
    const tailX=-size*(1+i*.8),tailY=Math.sin(phase-i*.7)*size*.35;
    ctx.beginPath();ctx.arc(tailX,tailY,size*(.1+i*.025),0,Math.PI*2);ctx.fill();
  }
  ctx.globalAlpha=.95;
  if(source.type==='acid_mycelium') {
    ctx.beginPath();ctx.ellipse(0,0,size*.8,size*.45,0,0,Math.PI*2);ctx.stroke();
    ctx.beginPath();ctx.arc(size*.25,0,size*.15,0,Math.PI*2);ctx.fill();
    for(const side of [-1,1]) {ctx.beginPath();ctx.moveTo(-size*.5,0);ctx.quadraticCurveTo(-size,size*.8*side,-size*1.3,size*.5*side);ctx.stroke();}
  } else {
    const flutter=.8+.2*Math.sin(phase);
    leaf(ctx,-size*.5,0,size,0,size*.38*flutter,false);
    ctx.beginPath();ctx.arc(size*.2,0,1.2/scale,0,Math.PI*2);ctx.fill();
  }
  ctx.restore();
}
