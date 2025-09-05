import * as Tone from 'tone'

function createFoldCurve(len = 2048, folds = 3, drive = 1.0, symmetry = 0.0) {
  let curve = new Float32Array(len)
  for (let i = 0; i < len; i++) {
    let x = (i / len) * 2 - 1
    x = (x + symmetry) * drive
    curve[i] = Math.sin(x * Math.PI * folds)
  }
  return curve
}

export default class EtherAura {
  constructor(opts = {}) {
    this.folds = typeof opts.folds === 'number' ? opts.folds : 3
    this.drive = typeof opts.drive === 'number' ? opts.drive : 1.0
    this.symmetry = typeof opts.symmetry === 'number' ? opts.symmetry : 0.0
    this.filterEnabled = !!opts.filterEnabled
    this.filterType = opts.filterType || 'lowpass'
    this.filterFreq = typeof opts.filterFreq === 'number' ? opts.filterFreq : 12000
    this.filterQ = typeof opts.filterQ === 'number' ? opts.filterQ : 0.7
    this.volume = typeof opts.volume === 'number' ? opts.volume : 0.9

    this.osc = new Tone.Oscillator({ type: 'sine', frequency: 440 }).start()
    this.folder = new Tone.WaveShaper({
      curve: createFoldCurve(2048, this.folds, this.drive, this.symmetry),
      oversample: '4x'
    })
    this.ampEnv = new Tone.AmplitudeEnvelope({ attack: 0.005, decay: 0.25, sustain: 0.0, release: 0.25 })
    this.filter = new Tone.Filter({ type: this.filterType, frequency: this.filterFreq, Q: this.filterQ })
    this.out = new Tone.Gain(this.volume)

    this.osc.connect(this.folder)
    if (this.filterEnabled) {
      this.folder.connect(this.filter)
      this.filter.connect(this.ampEnv)
    } else {
      this.folder.connect(this.ampEnv)
    }
    this.ampEnv.connect(this.out)
  }

  setFolds(v) {
    this.folds = Math.max(1, Math.round(v))
    this.folder.curve = createFoldCurve(2048, this.folds, this.drive, this.symmetry)
  }

  setDrive(v) {
    this.drive = Math.max(0, v)
    this.folder.curve = createFoldCurve(2048, this.folds, this.drive, this.symmetry)
  }

  setSymmetry(v) {
    this.symmetry = Math.max(-1, Math.min(1, v))
    this.folder.curve = createFoldCurve(2048, this.folds, this.drive, this.symmetry)
  }

  setFilterEnabled(enabled) {
    if (enabled === this.filterEnabled) return
    this.filterEnabled = !!enabled
    try { this.folder.disconnect() } catch {}
    try { this.filter.disconnect() } catch {}
    if (this.filterEnabled) {
      this.folder.connect(this.filter)
      this.filter.connect(this.ampEnv)
    } else {
      this.folder.connect(this.ampEnv)
    }
  }

  setFilter(type, frequency, q) {
    if (type) this.filter.type = type
    if (typeof frequency === 'number') this.filter.frequency.value = frequency
    if (typeof q === 'number') this.filter.Q.value = q
  }

  setVolume(v) {
    this.volume = Math.max(0, v)
    this.out.gain.value = this.volume
  }

  trigger(note, duration = '8n', velocity = 1.0) {
    const f = Tone.Frequency(note).toFrequency()
    this.osc.frequency.value = f
    const vel = Math.max(0.01, Math.min(1, velocity))
    this.ampEnv.triggerAttackRelease(duration, undefined, vel)
  }

  connect(destination) {
    if (!destination) return this.out
    try { this.out.connect(destination) } catch {}
    return destination
  }

  createUI() {
    const container = document.createElement('div')
    container.style.display = 'grid'
    container.style.gridTemplateColumns = 'repeat(3, 1fr)'
    container.style.gap = '6px'

    const mk = (label, min, max, step, value, onInput, format) => {
      const wrap = document.createElement('div')
      wrap.style.display = 'flex'
      wrap.style.flexDirection = 'column'
      wrap.style.alignItems = 'stretch'
      const lab = document.createElement('div')
      lab.textContent = `${label}: ${format(value)}`
      lab.style.fontSize = '10px'
      const input = document.createElement('input')
      input.type = 'range'
      input.min = String(min)
      input.max = String(max)
      input.step = String(step)
      input.value = String(value)
      input.addEventListener('input', e => {
        const v = parseFloat(e.target.value)
        onInput(v)
        lab.textContent = `${label}: ${format(v)}`
      })
      wrap.appendChild(input)
      wrap.appendChild(lab)
      return wrap
    }

    const foldsCtrl = mk('Folds', 1, 8, 1, this.folds, v => this.setFolds(v), v => Math.round(v))
    const driveCtrl = mk('Drive', 0, 5, 0.01, this.drive, v => this.setDrive(v), v => v.toFixed(2))
    const symCtrl = mk('Sym', -1, 1, 0.01, this.symmetry, v => this.setSymmetry(v), v => v.toFixed(2))

    container.appendChild(foldsCtrl)
    container.appendChild(driveCtrl)
    container.appendChild(symCtrl)

    return container
  }
}

