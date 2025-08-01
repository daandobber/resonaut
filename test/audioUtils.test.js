import { describe, it, expect } from 'vitest'
import { midiToFrequency, frequencyToMidi, parseNoteNameToMidi } from '../audioUtils.js'

describe('audioUtils', () => {
  describe('midiToFrequency', () => {
    it('converts MIDI note 69 (A4) to 440 Hz', () => {
      expect(midiToFrequency(69)).toBeCloseTo(440)
    })

    it('returns NaN for NaN input', () => {
      expect(midiToFrequency(NaN)).toBeNaN()
    })
  })

  describe('frequencyToMidi', () => {
    it('converts 440 Hz to MIDI note 69', () => {
      expect(frequencyToMidi(440)).toBe(69)
    })

    it('rounds to the nearest MIDI note', () => {
      expect(frequencyToMidi(441)).toBe(69)
    })

    it('returns NaN for non-positive frequencies', () => {
      expect(frequencyToMidi(0)).toBeNaN()
      expect(frequencyToMidi(-10)).toBeNaN()
    })
  })

  describe('parseNoteNameToMidi', () => {
    it('parses simple note names', () => {
      expect(parseNoteNameToMidi('C4')).toBe(60)
      expect(parseNoteNameToMidi('a4')).toBe(69)
    })

    it('handles sharps and flats', () => {
      expect(parseNoteNameToMidi('G#3')).toBe(56)
      expect(parseNoteNameToMidi('Db4')).toBe(61)
    })

    it('parses negative octaves', () => {
      expect(parseNoteNameToMidi('C-1')).toBe(0)
    })

    it('returns NaN for invalid strings', () => {
      expect(parseNoteNameToMidi('')).toBeNaN()
      expect(parseNoteNameToMidi('H2')).toBeNaN()
      expect(parseNoteNameToMidi('A#')).toBeNaN()
    })
  })
})
