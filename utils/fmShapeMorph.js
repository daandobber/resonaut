import { lerp } from '../mathUtils.js';

/**
 * Morph between two shapes based on a normalized amount.
 * @param {Array<{x:number,y:number}>} baseShape
 * @param {Array<{x:number,y:number}>} targetShape
 * @param {number} amount - value between 0 and 1
 * @returns {Array<{x:number,y:number}>}
 */
function resample(shape, count) {
  const points = [];
  const lengths = [];
  let total = 0;
  for (let i = 0; i < shape.length; i++) {
    const a = shape[i];
    const b = shape[(i + 1) % shape.length];
    const len = Math.hypot(b.x - a.x, b.y - a.y);
    lengths.push(len);
    total += len;
  }
  if (total === 0) {
    return Array.from({ length: count }, () => ({ ...shape[0] }));
  }
  for (let i = 0; i < count; i++) {
    const dist = (i / count) * total;
    let acc = 0;
    for (let j = 0; j < shape.length; j++) {
      const len = lengths[j];
      if (acc + len >= dist) {
        const t = (dist - acc) / len;
        const a = shape[j];
        const b = shape[(j + 1) % shape.length];
        points.push({ x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t) });
        break;
      }
      acc += len;
    }
  }
  return points;
}

export function morphShape(baseShape, targetShape, amount) {
  if (!Array.isArray(baseShape) || !Array.isArray(targetShape)) {
    throw new TypeError('Shapes must be arrays');
  }
  const t = Math.max(0, Math.min(1, amount));
  const pointCount = Math.max(baseShape.length, targetShape.length);
  const a = resample(baseShape, pointCount);
  const b = resample(targetShape, pointCount);
  return a.map((p, i) => ({
    x: lerp(p.x, b[i].x, t),
    y: lerp(p.y, b[i].y, t),
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
