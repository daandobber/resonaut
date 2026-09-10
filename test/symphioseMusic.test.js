import { describe, it, expect, vi } from 'vitest';
import { symphioseContext, symphioseNote, advanceSymphioseClock } from '../utils/symphioseMusic.js';
vi.mock('tone', () => ({ Gain: class { connect() {} disconnect() {} } }));
import { createMindOrb, DEFAULT_MIND_PARAMS, DEFAULT_QUEEN_MIND_PARAMS } from '../orbs/mind-orb.js';

function mind(id, queen = false) {
  const node = { id, type: queen ? 'queen_mind' : 'mind', audioParams: { ...(queen ? DEFAULT_QUEEN_MIND_PARAMS : DEFAULT_MIND_PARAMS) } };
  node.audioNodes = createMindOrb(node);
  return node;
}

describe('Symphiose musical relationships', () => {
  it('arpeggiates chord tones in each direction without repeating turning points', () => {
    const render = direction => Array.from({ length: 12 }, (_, tick) => {
      const params = { musicalRole: 'arp', arpDirection: direction, dreamDepth: 16, variation: 0, progression: 'home' };
      return symphioseNote(params, symphioseContext(params, tick), 0, 1).degree;
    });
    expect(render('up').slice(0, 6)).toEqual([0, 2, 4, 0, 2, 4]);
    expect(render('down').slice(0, 6)).toEqual([4, 2, 0, 4, 2, 0]);
    expect(render('pendulum').slice(0, 8)).toEqual([0, 2, 4, 2, 0, 2, 4, 2]);
  });
  it('shares Queen chord colors with both chords and arpeggios without changing member settings', () => {
    const context = symphioseContext({ isQueen: true, chordColor: 'seventh' }, 0);
    const member = { chordColor: 'sus2', musicalRole: 'chords' };
    expect([0, 1, 2, 3].map(i => symphioseNote(member, context, i, 4).degree)).toEqual([0, 2, 4, 6]);
    expect(symphioseNote({ ...member, musicalRole: 'arp' }, context, 3, 4).degree).toBe(6);
    expect(member.chordColor).toBe('sus2');
    expect([0, 1, 2].map(i => symphioseNote(member, context, i, 3).degree)).toEqual([0, 2, 6]);
    expect(symphioseNote(member, symphioseContext(member, 0), 1, 3).degree).toBe(1);
  });
  it('plays named grooves at their accents, scales to longer cycles, and still honors mute', () => {
    const hits = (rhythmStyle, length = 16) => Array.from({ length }, (_, tick) => {
      const p = { musicalRole: 'rhythm', rhythmStyle, variation: 0, consciousnessSpan: length };
      return symphioseNote(p, symphioseContext(p, tick), 0, 1) ? tick : null;
    }).filter(n => n !== null);
    expect(hits('clave')).toEqual([0, 3, 6, 10, 12]);
    expect(hits('backbeat')).toEqual([4, 12]);
    expect(hits('offbeat', 32)).toEqual([4, 12, 20, 28]);
    expect(symphioseNote({ musicalRole: 'rhythm', rhythmStyle: 'clave', dreamDepth: 0 }, symphioseContext({}, 0), 0, 1)).toBeNull();
  });
  it('changes harmony only at cycle boundaries and holds each chord for its chosen duration', () => {
    const params = { consciousnessSpan: 16, barsPerChord: 2, progression: 'journey' };
    expect([0, 15, 16, 31].map(tick => symphioseContext(params, tick).chordDegree)).toEqual([0, 0, 0, 0]);
    expect([32, 64, 96, 128].map(tick => symphioseContext(params, tick).chordDegree)).toEqual([5, 3, 4, 0]);
  });
  it('gives bass, chords and melody complementary rhythm and register', () => {
    const params = { dreamDepth: 7, variation: 0 };
    const notes = role => Array.from({ length: 16 }, (_, tick) => symphioseNote(params, symphioseContext(params, tick), 0, 1, role));
    const bass = notes('bass'), melody = notes('melody');
    expect(bass[0].octave).toBe(-1);
    expect(melody[0]).toBeNull();
    expect(melody.filter(Boolean).every(n => n.octave === 1)).toBe(true);
    expect([0, 1, 2].map(i => symphioseNote(params, symphioseContext(params, 0), i, 3, 'chords').degree)).toEqual([0, 2, 4]);
  });
  it('repeats seeded phrases exactly and honors zero density and zero dynamics', () => {
    const params = { musicalRole: 'melody', imaginationSeed: 7, variation: 0.8 };
    const render = () => Array.from({ length: 128 }, (_, tick) => symphioseNote(params, symphioseContext(params, tick), 0, 1));
    expect(render()).toEqual(render());
    expect(symphioseNote({ dreamDepth: 0 }, symphioseContext({}, 0), 0, 1)).toBeNull();
    expect(symphioseNote({ focusIntensity: 0 }, symphioseContext({}, 0), 0, 1).intensity).toBe(0);
  });
  it('uses absolute audio time without duplicate frame triggers or catch-up bursts', () => {
    const clock = {};
    expect(advanceSymphioseClock(clock, 10, 0.125, 10)).toBe(0);
    expect(advanceSymphioseClock(clock, 10.02, 0.125, 10)).toBeNull();
    expect(advanceSymphioseClock(clock, 10.126, 0.125, 10)).toBe(1);
    expect(advanceSymphioseClock(clock, 14, 0.125, 10)).toBe(32);
    expect(advanceSymphioseClock(clock, 14.01, 0.125, 10)).toBeNull();
  });
  it('conducts every member on the same tick without multiplying their stored volume', () => {
    const queen = mind(0, true), bass = mind(1), melody = mind(2);
    const bassTrigger = vi.fn(), melodyTrigger = vi.fn();
    bass.addVein({ id: 3, type: 'sound', triggerFromLife: bassTrigger });
    melody.addVein({ id: 4, type: 'sound', triggerFromLife: melodyTrigger });
    melody.audioParams.musicalRole = 'melody';
    queen.addVein(bass); queen.addVein(melody);
    const before = [bass.audioParams.focusIntensity, melody.audioParams.focusIntensity];
    for (let tick = 0; tick < 128; tick++) {
      queen.processSequenceStep(symphioseContext(queen.audioParams, tick));
      expect(bass.lifeSystem.musicalContext.tick).toBe(tick);
      expect(melody.lifeSystem.musicalContext.chordDegree).toBe(bass.lifeSystem.musicalContext.chordDegree);
      queen.commandHivePatterns();
    }
    expect([bass.audioParams.focusIntensity, melody.audioParams.focusIntensity]).toEqual(before);
    expect(bassTrigger).toHaveBeenCalled(); expect(melodyTrigger).toHaveBeenCalled();
    expect(bassTrigger.mock.calls.every(([gain]) => gain <= 1.4)).toBe(true);
    queen.removeVein(queen.lifeSystem.veins[0].id);
    expect(bass.lifeSystem.queenController).toBeUndefined();
  });
  it('deduplicates veins, uses unique IDs, and keeps a member under one Queen', () => {
    const a = mind(0, true), b = mind(1, true), member = mind(2);
    const vein = a.addVein(member);
    expect(a.addVein(member)).toBe(vein);
    expect(a.lifeSystem.veins).toHaveLength(1);
    a.discoverHiveMinds(); b.addVein(member); b.discoverHiveMinds();
    expect(member.lifeSystem.queenController).toBe(a);
    a.removeVein(vein.id); b.discoverHiveMinds();
    expect(member.lifeSystem.queenController).toBe(b);
  });
  it('lets Queen density and dynamics shape the ensemble without changing member settings', () => {
    const queen = mind(0, true), member = mind(1), trigger = vi.fn();
    member.addVein({ id: 2, type: 'sound', triggerFromLife: trigger });
    queen.addVein(member);
    queen.audioParams.dreamDepth = 0;
    queen.processSequenceStep(symphioseContext(queen.audioParams, 0));
    expect(trigger).not.toHaveBeenCalled();
    queen.audioParams.dreamDepth = 6;
    queen.audioParams.focusIntensity = 0;
    queen.processSequenceStep(symphioseContext(queen.audioParams, 16));
    expect(trigger.mock.calls[0][0]).toBe(0);
    expect(member.audioParams.dreamDepth).toBe(DEFAULT_MIND_PARAMS.dreamDepth);
    expect(member.audioParams.focusIntensity).toBe(1);
  });
});
