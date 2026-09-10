import { drawPlant, botanicalPalette } from './botanicalVisuals.js';
import { withPulseNote, readPulseNote } from './notePulse.js';
export const ORBIT_RHYTHM_TYPE = 'orbit_rhythm';
export const NOTE_LOOM_TYPE = 'note_loom';
export const CHORD_ORB_TYPE = 'chord_garden';
export const ARP_ORB_TYPE = 'arp_orbit';
export const ACID_ORB_TYPE = 'acid_mycelium';
export const CHORD_SHAPES = { triad: [0, 2, 4], seventh: [0, 2, 4, 6], sus2: [0, 1, 4], sus4: [0, 3, 4], sixth: [0, 2, 4, 5] };
export const PATTERN_ORBS = [
  { type: ORBIT_RHYTHM_TYPE, label: 'Orbit Rhythm', description: 'Editable rhythm pulsar' },
  { type: NOTE_LOOM_TYPE, label: 'Note Loom', description: 'Personal step melody sequencer' },
  { type: CHORD_ORB_TYPE, label: 'Chord Garden', description: 'Chord roots, inversions and strummed voicings' },
  { type: ARP_ORB_TYPE, label: 'Arp Orbit', description: 'Editable arpeggios across octaves, follows incoming notes' },
  { type: ACID_ORB_TYPE, label: 'Acid Mycelium', description: 'Acid bass fungus with accents, slides and a resonant filter' },
];
export const isPatternOrb = type => PATTERN_ORBS.some(item => item.type === type);
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const wrap = (value, length) => ((value % length) + length) % length;
const states = new WeakMap();
export function patternState(node) {
  if (!states.has(node)) states.set(node, { tick: 0, step: -1 });
  return states.get(node);
}
export function resetPattern(node) { states.delete(node); }
export function patternDefaults(type) {
  return { advanceOnPulse: type === CHORD_ORB_TYPE, length: [CHORD_ORB_TYPE, ARP_ORB_TYPE].includes(type) ? 4 : 16, hits: 5, rotation: 0, direction: 'forward',
    pulseIntensity: 0.7, probability: 1, accentEvery: 4, seed: 1,
    syncSubdivisionIndex: type === CHORD_ORB_TYPE ? 6 : 2, triggerInterval: type === CHORD_ORB_TYPE ? 0.5 : 0.125, ignoreGlobalSync: false,
    chordShape: 'triad', inversion: 0, openVoicing: false, strumMs: 0, octaves: 2,
    transpose: type === ACID_ORB_TYPE ? -7 : 0, noteMode: 'relative', rhythmOverrides: {},
    cutoff: 450, resonance: 7, envDepth: 3, acidDecay: .2, gate: .85, slideMs: 70, acidWave: 'sawtooth', acidSound: true,
    steps: Array.from({ length: 32 }, (_, i) => ({
      degree: type === ACID_ORB_TYPE ? [0,0,7,0,3,0,5,2][i%8] : type === CHORD_ORB_TYPE ? [0, 5, 3, 4][i % 4] : type === ARP_ORB_TYPE ? [0, 2, 4, 6][i % 4] : [0, 2, 4, 7, 4, 2, 1, 4][i % 8],
      enabled: type === ACID_ORB_TYPE ? i % 8 !== 6 : type !== NOTE_LOOM_TYPE || i % 4 !== 3,
      velocity: i % 4 === 0 ? 1 : 0.75, probability: 1,
      accent: i % 4 === 0, slide: i % 4 === 2,
    })),
  };
}
export function rhythmHit(params, step) {
  const length = clamp(Math.round(params.length ?? 16), 2, 32);
  if (typeof params.rhythmOverrides?.[step] === 'boolean') return params.rhythmOverrides[step];
  const hits = clamp(Math.round(params.hits ?? 5), 0, length);
  return wrap((step - (params.rotation ?? 0)) * hits, length) < hits;
}
function seeded(seed) {
  let n = Math.imul(seed ^ 0x9e3779b9, 0x85ebca6b);
  n = Math.imul(n ^ (n >>> 13), 0xc2b2ae35);
  return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
}
export function chordIntervals(params, scaleLength = 7) {
  const notes = [...(CHORD_SHAPES[params.chordShape] || CHORD_SHAPES.triad)];
  const inversion = clamp(Math.round(params.inversion || 0), 0, notes.length - 1);
  for (let i = 0; i < inversion; i++) notes[i] += scaleLength;
  notes.sort((a, b) => a - b);
  if (params.openVoicing && notes.length > 2) notes[1] += scaleLength;
  return notes.sort((a, b) => a - b);
}

export function advancePattern(node, incoming = {}, scaleLength = 7) {
  const p = node.audioParams, state = patternState(node);
  const length = clamp(Math.round(p.length ?? 16), 2, 32);
  const tick = state.tick++;
  const arp = node.type === ARP_ORB_TYPE;
  const total = length * (arp ? clamp(Math.round(p.octaves ?? 2), 1, 3) : 1);
  let position = wrap(tick, total);
  if (p.direction === 'reverse') position = total - 1 - position;
  if (p.direction === 'pendulum') {
    position = wrap(tick, 2 * (total - 1));
    position = Math.min(position, 2 * (total - 1) - position);
  }
  const step = position % length;
  state.octave = Math.floor(position / length);
  state.step = step;
  const cell = p.steps?.[step] || { enabled: true, degree: 0, velocity: 1, probability: 1 };
  const melodic = node.type !== ORBIT_RHYTHM_TYPE;
  if ([ARP_ORB_TYPE, CHORD_ORB_TYPE, ACID_ORB_TYPE].includes(node.type) && readPulseNote(incoming)) state.root = readPulseNote(incoming);
  const enabled = melodic ? cell.enabled !== false : rhythmHit(p, step);
  const chance = clamp((p.probability ?? 1) * (melodic ? cell.probability ?? 1 : 1), 0, 1);
  if (!enabled || seeded(tick * 97 + (p.seed ?? 1) * 503) >= chance) return null;
  const accent = p.accentEvery > 0 && step % p.accentEvery === 0 ? 1 : 0.72;
  const intensity = clamp((incoming.intensity ?? 1) * (p.pulseIntensity ?? 0.7) *
    (melodic ? cell.velocity ?? 1 : accent), 0, 1);
  if (intensity === 0) return null;
  const data = { ...incoming, intensity };
  if (!melodic) return data;
  const root = [ARP_ORB_TYPE, CHORD_ORB_TYPE, ACID_ORB_TYPE].includes(node.type) ? state.root : null;
  const result = withPulseNote(data, clamp(Math.round(cell.degree ?? 0) + Math.round(p.transpose ?? 0) +
    (root?.degree || 0) + (arp ? state.octave * scaleLength : 0), -56, 56), root?.mode || p.noteMode);
  if (node.type === CHORD_ORB_TYPE) result.chord = { intervals: chordIntervals(p, scaleLength), strumMs: clamp(p.strumMs || 0, 0, 150) };
  // An arpeggiator turns an incoming chord into single notes.
  if (arp || node.type === ACID_ORB_TYPE) delete result.chord;
  return result;
}

export function drawPatternOrb(ctx, node, radius, scale, selected, showInfo = true, palette) {
  const p = node.audioParams || patternDefaults(node.type);
  const length = clamp(Math.round(p.length ?? 16), 2, 32);
  const melodic = node.type !== ORBIT_RHYTHM_TYPE;
  const state = patternState(node);
  const color = botanicalPalette(node, palette);
  ctx.save(); ctx.translate(node.x, node.y);
  ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = 1.3 / scale;
  if (melodic) {
    drawPlant(ctx, node, radius, scale, state, palette);
  } else {
    ctx.beginPath();
    for (let i=0;i<12;i++) {
      const a=i/12*Math.PI*2-Math.PI/2, r=radius*(i%2?.85:1);
      if (!i) ctx.moveTo(Math.cos(a)*r,Math.sin(a)*r); else ctx.lineTo(Math.cos(a)*r,Math.sin(a)*r);
    }
    ctx.closePath();ctx.stroke();
    for(let i=0;i<length;i++) {
      const a=i/length*Math.PI*2-Math.PI/2;
      ctx.globalAlpha=state.step===i?1:rhythmHit(p,i)?.7:.18;
      ctx.beginPath();ctx.moveTo(Math.cos(a)*radius*.7,Math.sin(a)*radius*.7);
      ctx.lineTo(Math.cos(a)*radius*.91,Math.sin(a)*radius*.91);ctx.stroke();
    }
    ctx.globalAlpha=1;
  }
  if (selected) {
    ctx.setLineDash([3/scale,4/scale]);
    ctx.beginPath();ctx.arc(0,0,radius+6/scale,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);
  }
  if (showInfo) {
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.font = `bold ${10 / scale}px sans-serif`;
    const y = radius * 1.1 + 9 / scale;
    ctx.fillText(PATTERN_ORBS.find(item => item.type === node.type)?.label || 'Pattern', 0, y);
    ctx.fillText(`${state.step + 1}/${length}${node.type === ARP_ORB_TYPE ? ` · octave ${(state.octave || 0) + 1}` : ''}`, 0, y + 11 / scale);
  }
  ctx.restore();
}
