import * as Tone from 'tone'

function createFoldCurve(len = 2048, folds = 3, drive = 1.0, symmetry = 0.0) {
  const curve = new Float32Array(len)
  for (let i = 0; i < len; i++) {
    let x = (i / len) * 2 - 1
    x = (x + symmetry) * drive
    curve[i] = Math.sin(x * Math.PI * folds)
  }
  return curve
}

export default class EtherAura {
  constructor(opts = {}) {
    // Wavefolder core (per-osc, with backward compatibility)
    const fallbackFolds = typeof opts.folds === 'number' ? opts.folds : 3
    const fallbackDrive = typeof opts.drive === 'number' ? opts.drive : 1.0
    const fallbackSym = typeof opts.symmetry === 'number' ? opts.symmetry : 0.0

    this.folds1 = typeof opts.folds1 === 'number' ? opts.folds1 : fallbackFolds
    this.drive1 = typeof opts.drive1 === 'number' ? opts.drive1 : fallbackDrive
    this.symmetry1 = typeof opts.symmetry1 === 'number' ? opts.symmetry1 : fallbackSym

    this.folds2 = typeof opts.folds2 === 'number' ? opts.folds2 : fallbackFolds
    this.drive2 = typeof opts.drive2 === 'number' ? opts.drive2 : fallbackDrive
    this.symmetry2 = typeof opts.symmetry2 === 'number' ? opts.symmetry2 : fallbackSym

    // Two oscillators, individual levels
    this.osc1Level = typeof opts.osc1Level === 'number' ? opts.osc1Level : 1.0
    this.osc2Level = typeof opts.osc2Level === 'number' ? opts.osc2Level : 0.8
    this.osc1Octave = typeof opts.osc1Octave === 'number' ? opts.osc1Octave : 0
    this.osc2Octave = typeof opts.osc2Octave === 'number' ? opts.osc2Octave : 0
    this.osc1Waveform = typeof opts.osc1Waveform === 'string' ? opts.osc1Waveform : 'sine'
    this.osc2Waveform = typeof opts.osc2Waveform === 'string' ? opts.osc2Waveform : 'sine'

    // Low-pass gate (filter + amp)
    this.filterEnabled = opts.filterEnabled !== undefined ? !!opts.filterEnabled : true
    this.filterType = opts.filterType || 'lowpass'
    this.filterFreq = typeof opts.filterFreq === 'number' ? opts.filterFreq : 8000
    this.filterQ = typeof opts.filterQ === 'number' ? opts.filterQ : 0.8
    this.lpgEnvAmount = typeof opts.lpgEnvAmount === 'number' ? opts.lpgEnvAmount : 4000 // Hz sweep

    // Gate envelope
    const atk = typeof opts.gateAttack === 'number' ? opts.gateAttack : 0.005
    const dec = typeof opts.gateDecay === 'number' ? opts.gateDecay : 0.25
    const sus = typeof opts.gateSustain === 'number' ? opts.gateSustain : 0.0
    const rel = typeof opts.gateRelease === 'number' ? opts.gateRelease : 0.25

    this.volume = typeof opts.volume === 'number' ? opts.volume : 0.9

    // Fold modulation (per-oscillator)
    this.foldMod1Enabled = !!opts.foldMod1Enabled
    this.foldMod1Depth = typeof opts.foldMod1Depth === 'number' ? opts.foldMod1Depth : 0.0
    this.foldMod1Rate = typeof opts.foldMod1Rate === 'number' ? opts.foldMod1Rate : 0.5
    this.foldMod2Enabled = !!opts.foldMod2Enabled
    this.foldMod2Depth = typeof opts.foldMod2Depth === 'number' ? opts.foldMod2Depth : 0.0
    this.foldMod2Rate = typeof opts.foldMod2Rate === 'number' ? opts.foldMod2Rate : 0.5

    // Build audio graph
    this.osc1 = new Tone.Oscillator({ type: this.osc1Waveform, frequency: 440 }).start()
    this.osc2 = new Tone.Oscillator({ type: this.osc2Waveform, frequency: 440 }).start()
    this.folder1 = new Tone.WaveShaper({
      curve: createFoldCurve(2048, this.folds1, this.drive1, this.symmetry1),
      oversample: '4x'
    })
    this.folder2 = new Tone.WaveShaper({
      curve: createFoldCurve(2048, this.folds2, this.drive2, this.symmetry2),
      oversample: '4x'
    })
    this.osc1Gain = new Tone.Gain(this.osc1Level)
    this.osc2Gain = new Tone.Gain(this.osc2Level)
    this.mix = new Tone.Gain(1.0)
    this.ampEnv = new Tone.AmplitudeEnvelope({ attack: atk, decay: dec, sustain: sus, release: rel })
    this.filter = new Tone.Filter({ type: this.filterType, frequency: this.filterFreq, Q: this.filterQ })
    this.out = new Tone.Gain(this.volume)

    this.osc1.connect(this.folder1)
    this.osc2.connect(this.folder2)
    this.folder1.connect(this.osc1Gain)
    this.folder2.connect(this.osc2Gain)
    this.osc1Gain.connect(this.mix)
    this.osc2Gain.connect(this.mix)
    if (this.filterEnabled) {
      this.mix.connect(this.filter)
      this.filter.connect(this.ampEnv)
    } else {
      this.mix.connect(this.ampEnv)
    }
    this.ampEnv.connect(this.out)

    // Lightweight modulation clock (~30 Hz)
    this._modPhase1 = 0
    this._modPhase2 = 0
    this._modFps = 30
    this._modClock = new Tone.Clock(() => {
      const step1 = (2 * Math.PI) * (this.foldMod1Rate || 0) / this._modFps
      const step2 = (2 * Math.PI) * (this.foldMod2Rate || 0) / this._modFps
      this._modPhase1 += step1
      this._modPhase2 += step2
      // Update folder curves if modulation enabled
      if (this.foldMod1Enabled || this.foldMod2Enabled) {
        if (this.foldMod1Enabled) {
          const f = (this.folds1 || 0) + (this.foldMod1Depth || 0) * Math.sin(this._modPhase1)
          this.folder1.curve = createFoldCurve(2048, Math.max(0.5, f), this.drive1, this.symmetry1)
        }
        if (this.foldMod2Enabled) {
          const f2 = (this.folds2 || 0) + (this.foldMod2Depth || 0) * Math.sin(this._modPhase2)
          this.folder2.curve = createFoldCurve(2048, Math.max(0.5, f2), this.drive2, this.symmetry2)
        }
      }
    }, this._modFps)
    try { this._modClock.start() } catch {}
  }

  // Per-osc fold params
  setFolds1(v) {
    this.folds1 = Math.max(1, Math.round(v))
    this.folder1.curve = createFoldCurve(2048, this.folds1, this.drive1, this.symmetry1)
  }

  setDrive1(v) {
    this.drive1 = Math.max(0, v)
    this.folder1.curve = createFoldCurve(2048, this.folds1, this.drive1, this.symmetry1)
  }

  setSymmetry1(v) {
    this.symmetry1 = Math.max(-1, Math.min(1, v))
    this.folder1.curve = createFoldCurve(2048, this.folds1, this.drive1, this.symmetry1)
  }

  setFolds2(v) {
    this.folds2 = Math.max(1, Math.round(v))
    this.folder2.curve = createFoldCurve(2048, this.folds2, this.drive2, this.symmetry2)
  }

  setDrive2(v) {
    this.drive2 = Math.max(0, v)
    this.folder2.curve = createFoldCurve(2048, this.folds2, this.drive2, this.symmetry2)
  }

  setSymmetry2(v) {
    this.symmetry2 = Math.max(-1, Math.min(1, v))
    this.folder2.curve = createFoldCurve(2048, this.folds2, this.drive2, this.symmetry2)
  }

  // Back-compat setters (apply to osc1)
  setFolds(v) { this.setFolds1(v) }
  setDrive(v) { this.setDrive1(v) }
  setSymmetry(v) { this.setSymmetry1(v) }

  // Osc levels
  setOsc1Level(v) { this.osc1Level = Math.max(0, v); try { this.osc1Gain.gain.value = this.osc1Level; } catch {} }
  setOsc2Level(v) { this.osc2Level = Math.max(0, v); try { this.osc2Gain.gain.value = this.osc2Level; } catch {} }

  // Waveforms and octaves
  setOsc1Waveform(type) { try { this.osc1.type = type; this.osc1Waveform = type; } catch {} }
  setOsc2Waveform(type) { try { this.osc2.type = type; this.osc2Waveform = type; } catch {} }
  setOctave1(o) { this.osc1Octave = Math.max(-4, Math.min(4, Math.round(o))); }
  setOctave2(o) { this.osc2Octave = Math.max(-4, Math.min(4, Math.round(o))); }

  setFilterEnabled(enabled) {
    if (enabled === this.filterEnabled) return
    this.filterEnabled = !!enabled
    try { this.mix.disconnect() } catch {}
    try { this.filter.disconnect() } catch {}
    if (this.filterEnabled) {
      this.mix.connect(this.filter)
      this.filter.connect(this.ampEnv)
    } else {
      this.mix.connect(this.ampEnv)
    }
  }

  setFilter(type, frequency, q) {
    if (type) this.filter.type = type
    if (typeof frequency === 'number') { this.filterFreq = frequency; this.filter.frequency.value = frequency }
    if (typeof q === 'number') { this.filterQ = q; this.filter.Q.value = q }
  }

  setLpgEnvAmount(v) { this.lpgEnvAmount = Math.max(0, v) }

  setGateEnvelope(a, d, s, r) {
    if (typeof a === 'number') this.ampEnv.attack = a
    if (typeof d === 'number') this.ampEnv.decay = d
    if (typeof s === 'number') this.ampEnv.sustain = s
    if (typeof r === 'number') this.ampEnv.release = r
  }

  setVolume(v) {
    this.volume = Math.max(0, v)
    this.out.gain.value = this.volume
  }

  // Fold modulation controls
  setFoldMod1Enabled(e) { this.foldMod1Enabled = !!e }
  setFoldMod1Depth(d) { this.foldMod1Depth = Math.max(0, d) }
  setFoldMod1Rate(r) { this.foldMod1Rate = Math.max(0, r) }
  setFoldMod2Enabled(e) { this.foldMod2Enabled = !!e }
  setFoldMod2Depth(d) { this.foldMod2Depth = Math.max(0, d) }
  setFoldMod2Rate(r) { this.foldMod2Rate = Math.max(0, r) }

  // Set base frequency (applies octaves)
  setBaseFrequency(freq) {
    const f1 = freq * Math.pow(2, this.osc1Octave || 0)
    const f2 = freq * Math.pow(2, this.osc2Octave || 0)
    try { this.osc1.frequency.value = f1 } catch {}
    try { this.osc2.frequency.value = f2 } catch {}
  }

  // Trigger both oscillators; modulate filter freq as LPG if enabled
  trigger(note, duration = '8n', velocity = 1.0) {
    const f = Tone.Frequency(note).toFrequency()
    this.setBaseFrequency(f)
    const vel = Math.max(0.01, Math.min(1, velocity))

    const now = Tone.now ? Tone.now() : (Tone.getContext ? Tone.getContext().currentTime : 0)
    if (this.filterEnabled && this.filter && this.lpgEnvAmount > 0) {
      const base = this.filterFreq || (this.filter.frequency && this.filter.frequency.value) || 8000
      const open = Math.min(22000, base + this.lpgEnvAmount * vel)
      try {
        this.filter.frequency.cancelScheduledValues(now)
        this.filter.frequency.setValueAtTime(base, now)
        this.filter.frequency.linearRampToValueAtTime(open, now + (this.ampEnv.attack || 0.01))
        const hold = (this.ampEnv.attack || 0) + (this.ampEnv.decay || 0)
        const sustainFreq = base + (this.ampEnv.sustain || 0) * this.lpgEnvAmount * vel
        this.filter.frequency.linearRampToValueAtTime(sustainFreq, now + hold)
        const durSec = Tone.Time ? Tone.Time(duration).toSeconds() : 0.25
        const relStart = now + durSec
        this.filter.frequency.linearRampToValueAtTime(base, relStart + (this.ampEnv.release || 0.01))
      } catch {}
    }

    this.ampEnv.triggerAttackRelease(duration, undefined, vel)
  }

  connect(destination) {
    if (!destination) return this.out
    try { this.out.connect(destination) } catch {}
    return destination
  }
}
