import { hexToRgba, hexToRgbForGradient } from './colorUtils.js';
import { distance } from '../mathUtils.js';
import { DEFAULT_PULSE_INTENSITY, PORTAL_NEBULA_TYPE, PRORB_TYPE } from '../utils/appConstants.js';
import { triggerNodeEffect } from '../main.js';

export const METEOR_SHOWER_DEFAULT_MAX_RADIUS = 250;
export const METEOR_SHOWER_DEFAULT_GROWTH_RATE = 100;
export const MAX_METEOR_SHOWER_GENERATIONS = 2;
export const PAIR_INTERACTION_COOLDOWN_SECONDS = 5;
export const COLLISION_SPAWN_COOLDOWN_SECONDS = 5;

export let activeMeteorShowers = [];
export let meteorShowerIdCounter = 0;
export let recentlyInteractedShowerPairs = new Map();

export function startMeteorShower(originConfig) {
  const audioContext = globalThis.audioContext;
  const pulsarTypes = globalThis.pulsarTypes;
  const nodes = globalThis.nodes;
  const propagateTrigger = globalThis.propagateTrigger;
  const isPulsarType = globalThis.isPulsarType;
  const isDrumType = globalThis.isDrumType;
  if (!originConfig) return;

  let idPrefix = 'ms_';
  let originX, originY, maxRadius, growthRate, color, generation, sourceNodeIdForTracking;
  let pulseIntensity = DEFAULT_PULSE_INTENSITY;
  let isCollisionProduct = false;
  let canSpawnFromCollisionUntil = 0;
  const currentTime = audioContext ? audioContext.currentTime : performance.now() / 1000;

  if (originConfig.type === 'node') {
    const sourceNode = originConfig.node;
    if (!sourceNode || !sourceNode.audioParams || (originConfig.generation !== undefined && originConfig.generation >= MAX_METEOR_SHOWER_GENERATIONS)) {
      return;
    }

    originX = sourceNode.x;
    originY = sourceNode.y;
    maxRadius = sourceNode.audioParams.meteorMaxRadius || METEOR_SHOWER_DEFAULT_MAX_RADIUS;
    growthRate = sourceNode.audioParams.meteorGrowthRate || METEOR_SHOWER_DEFAULT_GROWTH_RATE;
    generation = originConfig.generation || 0;
    sourceNodeIdForTracking = sourceNode.id;
    idPrefix = `ms_node_${sourceNode.id}_gen${generation}_`;
    pulseIntensity = sourceNode.audioParams.pulseIntensity || DEFAULT_PULSE_INTENSITY;
    isCollisionProduct = false;
    canSpawnFromCollisionUntil = 0;

    if (originConfig.previousShowerColor && typeof originConfig.previousShowerColor === 'string' && originConfig.previousShowerColor.startsWith('rgba')) {
      try {
        const match = originConfig.previousShowerColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d\.]+))?\)/);
        if (match) {
          const [rVal, gVal, bVal, aVal = 1] = match.slice(1).map(Number);
          const newR = Math.min(255, Math.max(0, rVal + generation * 10 + 10));
          const newG = Math.min(255, Math.max(0, gVal - generation * 15 - 10));
          const newB = Math.min(255, Math.max(0, bVal + generation * 5 + 5));
          color = `rgba(${newR},${newG},${newB},${Math.max(0.1, parseFloat(aVal) * 0.85).toFixed(2)})`;
        } else { color = 'rgba(225, 120, 150, 0.6)'; }
      } catch (e) { color = 'rgba(225, 120, 150, 0.6)'; }
    } else if (sourceNode.color && typeof sourceNode.color === 'string') {
      const showerAlpha = 0.7;
      if (sourceNode.color.startsWith('rgba')) {
        try {
          const match = sourceNode.color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d\.]+))?\)/);
          if (match) {
            const [rVal, gVal, bVal] = match.slice(1).map(Number);
            color = `rgba(${rVal},${gVal},${bVal},${showerAlpha})`;
          } else { color = `rgba(200, 200, 200, ${showerAlpha})`; }
        } catch (e) { color = `rgba(200, 200, 200, ${showerAlpha})`; }
      } else if (sourceNode.color.startsWith('#')) {
        color = hexToRgba(sourceNode.color, showerAlpha) || `rgba(200, 200, 200, ${showerAlpha})`;
      } else {
        const pulsarDef = pulsarTypes.find(p => p.type === sourceNode.type);
        if (pulsarDef && pulsarDef.type === 'pulsar_meteorshower') {
          color = `rgba(255, 150, 50, ${showerAlpha})`;
        } else {
          color = `rgba(200, 220, 255, ${showerAlpha})`;
        }
      }
    } else {
      const defaultMeteorColors = [`rgba(255,100,100,0.7)`, `rgba(100,255,100,0.7)`, `rgba(100,100,255,0.7)`];
      color = defaultMeteorColors[Math.floor(Math.random() * defaultMeteorColors.length)];
    }
  } else if (originConfig.type === 'collision') {
    if (originConfig.generation >= MAX_METEOR_SHOWER_GENERATIONS) {
      return;
    }
    originX = originConfig.x;
    originY = originConfig.y;
    generation = originConfig.generation || 0;
    color = originConfig.color || 'rgba(180, 220, 255, 0.7)';
    maxRadius = originConfig.maxRadius || METEOR_SHOWER_DEFAULT_MAX_RADIUS * 0.6;
    growthRate = originConfig.growthRate || METEOR_SHOWER_DEFAULT_GROWTH_RATE * 1.2;
    sourceNodeIdForTracking = 'COLLISION_SPAWNED_SHOWER';
    idPrefix = `ms_coll_gen${generation}_`;
    pulseIntensity = DEFAULT_PULSE_INTENSITY * 0.6;
    isCollisionProduct = true;
    canSpawnFromCollisionUntil = currentTime + COLLISION_SPAWN_COOLDOWN_SECONDS;
  } else {
    return;
  }

  if (typeof color !== 'string' || !(color.startsWith('rgba') || color.startsWith('#') || /^[a-zA-Z]+$/.test(color))) {
    color = 'rgba(255, 0, 0, 0.5)';
  }
  if (isNaN(originX) || isNaN(originY) || isNaN(maxRadius) || isNaN(growthRate) || isNaN(generation) || isNaN(pulseIntensity)) {
    return;
  }

  const newShower = {
    id: `${idPrefix}${meteorShowerIdCounter++}`,
    originX,
    originY,
    currentRadius: 0,
    maxRadius,
    growthRate,
    color,
    startTime: currentTime,
    sourceNodeId: sourceNodeIdForTracking,
    triggeredNodes: new Set(),
    generation,
    pulseData: { intensity: pulseIntensity, color },
    isCollisionProduct,
    canSpawnFromCollisionUntil
  };
  activeMeteorShowers.push(newShower);
}

export function updateAndDrawMeteorShowers(deltaTime, now) {
  const ctx = globalThis.ctx;
  const nodes = globalThis.nodes;
  const propagateTrigger = globalThis.propagateTrigger;
  const isPulsarType = globalThis.isPulsarType;
  const isDrumType = globalThis.isDrumType;
  const survivors = [];
  const collisionSpawnConfigs = [];

  if (Math.random() < 0.01) {
    for (const [key, expiry] of recentlyInteractedShowerPairs) {
      if (now > expiry + (PAIR_INTERACTION_COOLDOWN_SECONDS * 10)) {
        recentlyInteractedShowerPairs.delete(key);
      }
    }
  }

  const viewScale = globalThis.viewScale || 1;

  for (let i = 0; i < activeMeteorShowers.length; i++) {
    const shower1 = activeMeteorShowers[i];
    if (!shower1 || typeof shower1.currentRadius === 'undefined' || typeof shower1.growthRate === 'undefined') {
      continue;
    }
    shower1.currentRadius += shower1.growthRate * deltaTime;
    if (shower1.currentRadius < shower1.maxRadius) {
      const mainRingProgress = Math.min(1.0, shower1.currentRadius / shower1.maxRadius);
      const overallAlphaFade = Math.max(0, 1 - mainRingProgress * mainRingProgress);
      const targetLineWidth = (4 / viewScale) * Math.max(0.1, 1 - mainRingProgress);
      if (ctx && shower1.color && overallAlphaFade > 0.005 && targetLineWidth > 0.05 / viewScale) {
        ctx.beginPath();
        ctx.arc(shower1.originX, shower1.originY, shower1.currentRadius, 0, Math.PI * 2);
        const originalGlobalAlphaCtx = ctx.globalAlpha;
        let strokeStyleToUse = shower1.color;
        try {
          const grad = ctx.createRadialGradient(
            shower1.originX, shower1.originY, Math.max(0, shower1.currentRadius - targetLineWidth / 2 -1),
            shower1.originX, shower1.originY, shower1.currentRadius + targetLineWidth / 2 +1
          );
          let rVal = 200, gVal = 220, bVal = 255;
          if (typeof shower1.color === 'string') {
            if (shower1.color.startsWith('rgba')) {
              const match = shower1.color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d\.]+))?\)/);
              if (match) { rVal = parseInt(match[1]); gVal = parseInt(match[2]); bVal = parseInt(match[3]); }
            } else if (shower1.color.startsWith('#')) {
              const rgbObj = hexToRgbForGradient(shower1.color);
              if (rgbObj) { rVal = rgbObj.r; gVal = rgbObj.g; bVal = rgbObj.b; }
            }
          }
          grad.addColorStop(0, `rgba(${rVal},${gVal},${bVal},0)`);
          grad.addColorStop(0.5, `rgba(${rVal},${gVal},${bVal},${overallAlphaFade.toFixed(2)})`);
          grad.addColorStop(1, `rgba(${rVal},${gVal},${bVal},0)`);
          strokeStyleToUse = grad;
          ctx.globalAlpha = 1.0;
        } catch (e) {
          ctx.globalAlpha = overallAlphaFade;
          if (typeof shower1.color === 'string' && shower1.color.startsWith('rgba')) {
            strokeStyleToUse = shower1.color.replace(/[\d\.]+\)$/g, `${overallAlphaFade.toFixed(2)})`);
          } else if (typeof shower1.color === 'string') {
            strokeStyleToUse = shower1.color;
          } else {
            strokeStyleToUse = `rgba(200,200,200,${overallAlphaFade.toFixed(2)})`;
          }
        }
        ctx.strokeStyle = strokeStyleToUse;
        ctx.lineWidth = targetLineWidth;
        ctx.stroke();
        ctx.globalAlpha = originalGlobalAlphaCtx;
      }

      nodes.forEach(node => {
        if (node.id === shower1.sourceNodeId || shower1.triggeredNodes.has(node.id) || node.type === 'pulsar_meteorshower') {
          return;
        }
        const dxNode = node.x - shower1.originX;
        const dyNode = node.y - shower1.originY;
        const distNodeToOrigin = Math.sqrt(dxNode * dxNode + dyNode * dyNode);
        const nodeRadius = globalThis.NODE_RADIUS_BASE * node.size;
        const prevShowerRadius = shower1.currentRadius - (shower1.growthRate * deltaTime);

        if (distNodeToOrigin < shower1.currentRadius + nodeRadius && distNodeToOrigin > prevShowerRadius - nodeRadius) {
          if (!shower1.triggeredNodes.has(node.id)) {
            shower1.triggeredNodes.add(node.id);
            const pulseId = `meteor_${shower1.id}_${node.id}`;
            const initialIntensity = shower1.pulseData?.intensity || DEFAULT_PULSE_INTENSITY;
            const expansionProgressForSound = Math.min(1.0, shower1.currentRadius / shower1.maxRadius);
            const minIntensityFactorAtEdge = 0.25;
            const dynamicIntensity = initialIntensity * (1.0 - expansionProgressForSound * (1.0 - minIntensityFactorAtEdge));
            const finalSoundIntensity = Math.max(initialIntensity * minIntensityFactorAtEdge, dynamicIntensity);
            if (propagateTrigger && globalThis.isAudioReady)
              propagateTrigger(node, 0, pulseId, shower1.sourceNodeId, Infinity, {
                type: 'trigger',
                data: { intensity: finalSoundIntensity, color: shower1.pulseData?.color || shower1.color }
              }, null);
            triggerNodeEffect(node, {
              intensity: finalSoundIntensity,
              color: shower1.pulseData?.color || shower1.color
            });
            const canPropagateShowerTypes = ['sound', 'nebula', PORTAL_NEBULA_TYPE, PRORB_TYPE];
            const isAllowedToPropagate = canPropagateShowerTypes.includes(node.type) || (isPulsarType && isPulsarType(node.type)) || (isDrumType && isDrumType(node.type));
            if (isAllowedToPropagate) {
              if (shower1.generation < MAX_METEOR_SHOWER_GENERATIONS) {
                startMeteorShower({ type: 'node', node: node, generation: shower1.generation + 1, previousShowerColor: shower1.color });
              }
            }
          }
        }
      });

      for (let j = i + 1; j < activeMeteorShowers.length; j++) {
        const shower2 = activeMeteorShowers[j];
        if (!shower2 || shower2.currentRadius >= shower2.maxRadius) continue;
        if ((shower1.isCollisionProduct && now < shower1.canSpawnFromCollisionUntil) ||
            (shower2.isCollisionProduct && now < shower2.canSpawnFromCollisionUntil)) {
          continue;
        }
        if (shower1.sourceNodeId === shower2.sourceNodeId && shower1.sourceNodeId !== 'COLLISION_SPAWNED_SHOWER') {
          continue;
        }
        if (shower1.sourceNodeId === 'COLLISION_SPAWNED_SHOWER' && shower2.sourceNodeId === 'COLLISION_SPAWNED_SHOWER') {
          continue;
        }
        const pairIdKey = shower1.id < shower2.id ? `${shower1.id}-${shower2.id}` : `${shower2.id}-${shower1.id}`;
        if (recentlyInteractedShowerPairs.has(pairIdKey) && now < recentlyInteractedShowerPairs.get(pairIdKey)) {
          continue;
        }
        const distBetweenOrigins = distance(shower1.originX, shower1.originY, shower2.originX, shower2.originY);
        const sumOfCurrentRadii = shower1.currentRadius + shower2.currentRadius;
        if (distBetweenOrigins > 0.1 && distBetweenOrigins < sumOfCurrentRadii) {
          const newCollisionGeneration = Math.max(shower1.generation, shower2.generation) + 1;
          if (newCollisionGeneration < MAX_METEOR_SHOWER_GENERATIONS) {
            recentlyInteractedShowerPairs.set(pairIdKey, now + PAIR_INTERACTION_COOLDOWN_SECONDS);
            const collisionRatio = distBetweenOrigins > 0 ? shower1.currentRadius / sumOfCurrentRadii : 0.5;
            const collisionX = shower1.originX + (shower2.originX - shower1.originX) * collisionRatio;
            const collisionY = shower1.originY + (shower2.originY - shower1.originY) * collisionRatio;
            let mergedColor = 'rgba(220, 200, 255, 0.7)';
            try {
              const c1Match = (typeof shower1.color === 'string') ? shower1.color.match(/\d+/g) : null;
              const c2Match = (typeof shower2.color === 'string') ? shower2.color.match(/\d+/g) : null;
              if (c1Match && c1Match.length >=3 && c2Match && c2Match.length >= 3) {
                const c1 = c1Match.map(Number);
                const c2 = c2Match.map(Number);
                mergedColor = `rgba(${Math.round((c1[0]+c2[0])/2)}, ${Math.round((c1[1]+c2[1])/2)}, ${Math.round((c1[2]+c2[2])/2)}, 0.7)`;
              }
            } catch(e){}
            createCollisionImpactVisual(collisionX, collisionY, mergedColor);
            collisionSpawnConfigs.push({
              type: 'collision',
              x: collisionX,
              y: collisionY,
              generation: newCollisionGeneration,
              color: mergedColor,
              maxRadius: METEOR_SHOWER_DEFAULT_MAX_RADIUS * 0.6,
              growthRate: METEOR_SHOWER_DEFAULT_GROWTH_RATE * 1.3,
              parentSourceId: 'COLLISION_SPAWNED_SHOWER'
            });
          }
        }
      }
      survivors.push(shower1);
    }
  }
  activeMeteorShowers = survivors;
  collisionSpawnConfigs.forEach(config => startMeteorShower(config));
}

export function createCollisionImpactVisual(x, y, baseColorString) {
  const activeParticles = globalThis.activeParticles;
  let particleIdCounter = globalThis.particleIdCounter;
  const numImpactParticles = 15 + Math.floor(Math.random() * 10);
  let particleColorForFlash = 'rgba(250, 250, 250, 0.9)';
  if (baseColorString && typeof baseColorString === 'string') {
    if (baseColorString.startsWith('rgba')) {
      try {
        const match = baseColorString.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d\.]+))?\)/);
        if (match) {
          const [r, g, b] = match.slice(1).map(Number);
          particleColorForFlash = `rgba(${r},${g},${b},0.9)`;
        }
      } catch (e) {
        particleColorForFlash = 'rgba(250, 250, 250, 0.9)';
      }
    } else if (baseColorString.startsWith('#')) {
      particleColorForFlash = hexToRgba(baseColorString, 0.9) || 'rgba(250, 250, 250, 0.9)';
    } else {
      particleColorForFlash = 'rgba(250, 250, 250, 0.9)';
    }
  }
  for (let i = 0; i < numImpactParticles; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 2.0 + Math.random() * 2.5;
    const life = 0.18 + Math.random() * 0.25;
    if (activeParticles) {
      activeParticles.push({
        id: particleIdCounter++,
        x: x + (Math.random() - 0.5) * 3,
        y: y + (Math.random() - 0.5) * 3,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: life,
        maxLife: life,
        radius: 1.8 + Math.random() * 2.2,
        color: particleColorForFlash,
      });
    }
  }
  globalThis.particleIdCounter = particleIdCounter;
}
