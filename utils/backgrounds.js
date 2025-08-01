import { randomRange } from '../mathUtils.js';
import { canvas, ctx } from './domElements.js';

export let backgroundMode = 'starfield';

export function setBackgroundMode(mode) {
  backgroundMode = mode;
}
let starfieldLayers = null;
let neuralNodes = [];
let neuralConnections = [];
let maxNeuralNodes = 60;
let neuralGrowthCooldown = 0;
let neuralWindPhase = 0;
export const NEURAL_SPRING_RADIUS = 90;
const NEURAL_SPRING_STRENGTH = 0.002;
const NEURAL_FRICTION = 0.96;
const NEURAL_WIND_STRENGTH_X = 6;
const NEURAL_WIND_STRENGTH_Y = 4;
const NEURAL_ZOOM = 1.5;
let bgAngle = Math.random() * Math.PI * 2;

export function initStarfield() {
  starfieldLayers = [
    { parallax: 0.2, stars: [] },
    { parallax: 0.5, stars: [] },
    { parallax: 0.8, stars: [] },
  ];
  for (const layer of starfieldLayers) {
    for (let i = 0; i < 60; i++) {
      layer.stars.push({
        x: randomRange(0, canvas.width),
        y: randomRange(0, canvas.height),
        size: randomRange(0.5, 2.5),
      });
    }
  }
}

export function initNeuralBackground() {
  neuralNodes = [];
  neuralConnections = [];
  for (let i = 0; i < 40; i++) {
    neuralNodes.push({
      x: randomRange(0, canvas.width),
      y: randomRange(0, canvas.height),
      angle: randomRange(0, Math.PI * 2),
      speed: randomRange(0.1, 0.4),
      vx: 0,
      vy: 0,
    });
  }
}

export function spawnNeuralNode(base) {
  const node = {
    x: (base ? base.x : randomRange(0, canvas.width)) + randomRange(-15, 15),
    y: (base ? base.y : randomRange(0, canvas.height)) + randomRange(-15, 15),
    angle: randomRange(0, Math.PI * 2),
    speed: randomRange(0.1, 0.4),
    vx: 0,
    vy: 0,
  };
  neuralNodes.push(node);
  if (neuralNodes.length > maxNeuralNodes) neuralNodes.shift();
}

export function drawBackgroundGradient(now, getWorldCoords) {
  bgAngle += 0.0002;
  const topLeft = getWorldCoords(0, 0);
  const bottomRight = getWorldCoords(canvas.width, canvas.height);
  const worldWidth = bottomRight.x - topLeft.x;
  const worldHeight = bottomRight.y - topLeft.y;
  const worldCenterX = topLeft.x + worldWidth / 2;
  const worldCenterY = topLeft.y + worldHeight / 2;
  const diagonal = Math.sqrt(worldWidth * worldWidth + worldHeight * worldHeight) * 0.7;
  const gradX1 = worldCenterX + Math.cos(bgAngle) * diagonal;
  const gradY1 = worldCenterY + Math.sin(bgAngle) * diagonal;
  const gradX2 = worldCenterX + Math.cos(bgAngle + Math.PI) * diagonal;
  const gradY2 = worldCenterY + Math.sin(bgAngle + Math.PI) * diagonal;
  const color1 = getComputedStyle(document.documentElement)
    .getPropertyValue("--bg-gradient-stop-1")
    .trim() || "#1a2a40";
  const color2 = getComputedStyle(document.documentElement)
    .getPropertyValue("--bg-gradient-stop-2")
    .trim() || "#2c3a5f";
  const gradient = ctx.createLinearGradient(gradX1, gradY1, gradX2, gradY2);
  gradient.addColorStop(0, color1);
  gradient.addColorStop(1, color2);
  ctx.fillStyle = gradient;
  ctx.fillRect(topLeft.x, topLeft.y, worldWidth, worldHeight);
}

export function drawBackgroundFlat(now, getWorldCoords) {
  const topLeft = getWorldCoords(0, 0);
  const bottomRight = getWorldCoords(canvas.width, canvas.height);
  const worldWidth = bottomRight.x - topLeft.x;
  const worldHeight = bottomRight.y - topLeft.y;
  const color = getComputedStyle(document.documentElement)
    .getPropertyValue("--flat-bg-color")
    .trim() || "#000";
  ctx.fillStyle = color;
  ctx.fillRect(topLeft.x, topLeft.y, worldWidth, worldHeight);
}

export function drawBackgroundStarfield(now, getWorldCoords, viewOffsetX, viewOffsetY) {
  if (!starfieldLayers) {
    initStarfield();
  }
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  for (const layer of starfieldLayers) {
    const offsetX = (-viewOffsetX * layer.parallax) % canvas.width;
    const offsetY = (-viewOffsetY * layer.parallax) % canvas.height;
    for (const star of layer.stars) {
      let x = star.x + offsetX;
      let y = star.y + offsetY;
      if (x < 0) x += canvas.width;
      if (x > canvas.width) x -= canvas.width;
      if (y < 0) y += canvas.height;
      if (y > canvas.height) y -= canvas.height;
      ctx.fillStyle = `rgba(255,255,255,${0.5 + 0.5 * layer.parallax})`;
      ctx.fillRect(x, y, star.size, star.size);
    }
  }
  ctx.restore();
}

export function drawBackgroundNeural(now, getWorldCoords, previousFrameTime, masterAnalyser, currentScale, rgbaToHsl) {
  if (neuralNodes.length === 0) initNeuralBackground();
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.scale(NEURAL_ZOOM, NEURAL_ZOOM);
  ctx.translate(-canvas.width / 2, -canvas.height / 2);

  const delta = Math.max(0, Math.min(0.1, now - (previousFrameTime || now)));

  let amp = 0;
  let bass = 0;
  let mid = 0;
  let treble = 0;

  if (masterAnalyser) {
    const data = new Uint8Array(masterAnalyser.frequencyBinCount);
    masterAnalyser.getByteFrequencyData(data);
    amp = data.reduce((a, b) => a + b, 0) / data.length / 255;
    const third = Math.floor(data.length / 3);
    for (let i = 0; i < data.length; i++) {
      if (i < third) bass += data[i];
      else if (i < third * 2) mid += data[i];
      else treble += data[i];
    }
    bass /= third;
    mid /= third;
    treble /= data.length - third * 2;
  }

  neuralWindPhase += delta * (1 + amp * 5);
  const bassAmp = bass / 255;
  const trebleAmp = treble / 255;
  const windX = Math.sin(neuralWindPhase * 0.6) * bassAmp * NEURAL_WIND_STRENGTH_X;
  const windY = Math.cos(neuralWindPhase * 0.4) * trebleAmp * NEURAL_WIND_STRENGTH_Y;

  neuralGrowthCooldown -= delta;
  if (amp > 0.4 && neuralGrowthCooldown <= 0 && neuralNodes.length < maxNeuralNodes) {
    const base = neuralNodes[Math.floor(Math.random() * neuralNodes.length)];
    spawnNeuralNode(base);
    neuralGrowthCooldown = 0.05;
  } else if (amp < 0.05 && neuralNodes.length > 40 && Math.random() < 0.02) {
    neuralNodes.shift();
  }

  const styles = getComputedStyle(document.documentElement);
  const orbHsl1 = rgbaToHsl(styles.getPropertyValue('--prorb-color').trim());
  const orbHsl2 = rgbaToHsl(styles.getPropertyValue('--midi-orb-color').trim());
  const orbHue = (orbHsl1.h + orbHsl2.h) / 2 || 200;

  for (const node of neuralNodes) {
    const speedFactor = 0.5 + amp;
    node.angle += node.speed * speedFactor * 0.002;
    node.vx += Math.cos(node.angle) * node.speed * speedFactor * 0.05;
    node.vy += Math.sin(node.angle) * node.speed * speedFactor * 0.05;
    node.vx += windX * delta * 0.5;
    node.vy += windY * delta * 0.5;

    let nx = 0, ny = 0, count = 0;
    for (const other of neuralNodes) {
      if (other === node) continue;
      const dx = other.x - node.x;
      const dy = other.y - node.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < NEURAL_SPRING_RADIUS) {
        nx += other.x;
        ny += other.y;
        count++;
      }
    }
    if (count > 0) {
      nx /= count;
      ny /= count;
      node.vx += (nx - node.x) * NEURAL_SPRING_STRENGTH;
      node.vy += (ny - node.y) * NEURAL_SPRING_STRENGTH;
    }

    node.vx *= NEURAL_FRICTION;
    node.vy *= NEURAL_FRICTION;
    node.x += node.vx;
    node.y += node.vy;

    if (node.x < 0) node.x += canvas.width;
    if (node.x > canvas.width) node.x -= canvas.width;
    if (node.y < 0) node.y += canvas.height;
    if (node.y > canvas.height) node.y -= canvas.height;
  }

  let hue = (currentScale && currentScale.baseHSL) ? currentScale.baseHSL.h : 200;
  if (bass > mid && bass > treble) hue = (hue - 40 + 360) % 360;
  else if (treble > mid && treble > bass) hue = (hue + 40) % 360;
  hue = (hue * 0.7 + orbHue * 0.3) % 360;
  const sat = (currentScale && currentScale.baseHSL) ? currentScale.baseHSL.s : 80;
  const light = (currentScale && currentScale.baseHSL) ? currentScale.baseHSL.l : 65;
  const strokeColor = `hsla(${hue}, ${sat}%, ${light}%, ${0.2 + amp * 0.8})`;
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = 1 + amp * 2;

  for (let i = 0; i < neuralNodes.length; i++) {
    for (let j = i + 1; j < neuralNodes.length; j++) {
      const a = neuralNodes[i];
      const b = neuralNodes[j];
      const dx = a.x - b.x;
      const dy = a.y - b.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 120) {
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
    }
  }

  const flashChance = amp * 0.3;
  if (Math.random() < flashChance) {
    const a = neuralNodes[Math.floor(Math.random() * neuralNodes.length)];
    const b = neuralNodes[Math.floor(Math.random() * neuralNodes.length)];
    if (a && b && a !== b) {
      neuralConnections.push({ a, b, life: 0.3 + Math.random() * 0.4 });
    }
  }

  ctx.shadowColor = strokeColor;
  neuralConnections = neuralConnections.filter((conn) => {
    conn.life -= delta;
    if (conn.life <= 0) return false;
    const alpha = Math.min(1, conn.life * 3);
    ctx.shadowBlur = 20 * alpha * (0.5 + amp);
    ctx.lineWidth = 2 + amp * 2;
    ctx.globalAlpha = alpha;
    ctx.beginPath();
    ctx.moveTo(conn.a.x, conn.a.y);
    ctx.lineTo(conn.b.x, conn.b.y);
    ctx.stroke();
    ctx.globalAlpha = 1;
    return true;
  });
  ctx.shadowBlur = 0;
  ctx.restore();
}

export function drawBackground(now, getWorldCoords, viewOffsetX, viewOffsetY, previousFrameTime, masterAnalyser, currentScale, rgbaToHsl) {
  switch (backgroundMode) {
    case "flat":
      drawBackgroundFlat(now, getWorldCoords);
      break;
    case "starfield":
      drawBackgroundStarfield(now, getWorldCoords, viewOffsetX, viewOffsetY);
      break;
    case "neural":
      drawBackgroundNeural(now, getWorldCoords, previousFrameTime, masterAnalyser, currentScale, rgbaToHsl);
      break;
    default:
      drawBackgroundGradient(now, getWorldCoords);
  }
}
