import * as Tone from 'tone';

// Example of using Tone.PolySynth to trigger chord orbitones
const synth = new Tone.PolySynth(Tone.Synth).toDestination();

const C_chord = ['C3', 'E3', 'G3'];
const F_chord = ['F2', 'C3', 'A3'];
const G_chord = ['G2', 'D3', 'B3'];

const pianoPart = new Tone.Part((time, chord) => {
  synth.triggerAttackRelease(chord, '2n', time);
}, [
  ['0:0', C_chord],
  ['0:2', F_chord],
  ['0:4', C_chord],
  ['0:6', G_chord],
  ['0:8', C_chord],
  ['0:10', F_chord],
  ['0:12', C_chord],
  ['0:13', G_chord],
  ['0:14', C_chord.concat('C4')],
]).start(0);

pianoPart.loop = true;
pianoPart.loopEnd = '4m';

export function setup() {
  pianoPart.start();
  Tone.Transport.start();
}
