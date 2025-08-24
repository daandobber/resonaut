import { lerp } from '../mathUtils.js';

/**
 * Morph between two shapes based on a normalized amount.
 * @param {Array<{x:number,y:number}>} baseShape
 * @param {Array<{x:number,y:number}>} targetShape
 * @param {number} amount - value between 0 and 1
 * @returns {Array<{x:number,y:number}>}
 */
export function morphShape(baseShape, targetShape, amount) {
  if (!Array.isArray(baseShape) || !Array.isArray(targetShape)) {
    throw new TypeError('Shapes must be arrays');
  }
  if (baseShape.length !== targetShape.length) {
    throw new Error('Shapes must have the same number of points');
  }
  const t = Math.max(0, Math.min(1, amount));
  return baseShape.map((p, i) => ({
    x: lerp(p.x, targetShape[i].x, t),
    y: lerp(p.y, targetShape[i].y, t),
  }));
}

/**
 * Simple FM oscillator value mapped to 0-1 for shape morphing.
 * @param {number} carrierFreq
 * @param {number} modFreq
 * @param {number} modulationIndex
 * @param {number} time - in seconds
 * @returns {number} value between 0 and 1
 */
export function fmMorphAmount(carrierFreq, modFreq, modulationIndex, time) {
  const mod = Math.sin(2 * Math.PI * modFreq * time) * modulationIndex;
  const instantaneousFreq = carrierFreq + mod;
  const sample = Math.sin(2 * Math.PI * instantaneousFreq * time);
  return (sample + 1) / 2; // map from [-1,1] to [0,1]
}

export default { morphShape, fmMorphAmount };
