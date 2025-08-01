export function drawStarShape(ctx, x, y, points, outerR, innerR) {
  ctx.beginPath();
  const numPoints = Math.max(3, Math.round(points));
  for (let i = 0; i < numPoints * 2; i++) {
    const radius = i % 2 === 0 ? innerR : outerR;
    const angle = (i / (numPoints * 2)) * Math.PI * 2 - Math.PI / 2 + Math.PI / numPoints;
    const px = x + Math.cos(angle) * radius;
    const py = y + Math.sin(angle) * radius;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
}

export function drawSatelliteShape(ctx, x, y, r, arms = 1) {
  const coreRadius = r * 0.5;
  const armLength = r * 1.1;
  const armWidth = r * 0.2;
  const armAngleOffset = Math.PI / 4;
  ctx.beginPath();
  ctx.arc(x, y, coreRadius, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  for (let i = 0; i < arms; i++) {
    const angle = (i / arms) * Math.PI * 2 + armAngleOffset;
    const armStartX = x + Math.cos(angle) * coreRadius * 1.1;
    const armStartY = y + Math.sin(angle) * coreRadius * 1.1;
    const armEndX = x + Math.cos(angle) * armLength;
    const armEndY = y + Math.sin(angle) * armLength;
    const anglePerp = angle + Math.PI / 2;
    const halfWidth = armWidth / 2;
    ctx.beginPath();
    ctx.moveTo(
      armStartX + Math.cos(anglePerp) * halfWidth,
      armStartY + Math.sin(anglePerp) * halfWidth,
    );
    ctx.lineTo(
      armEndX + Math.cos(anglePerp) * halfWidth,
      armEndY + Math.sin(anglePerp) * halfWidth,
    );
    ctx.lineTo(
      armEndX - Math.cos(anglePerp) * halfWidth,
      armEndY - Math.sin(anglePerp) * halfWidth,
    );
    ctx.lineTo(
      armStartX - Math.cos(anglePerp) * halfWidth,
      armStartY + Math.sin(anglePerp) * halfWidth,
    );
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
}

export function drawMidiOrbShape(ctx, x, y, r) {
  ctx.save();
  ctx.lineWidth *= 0.9;
  drawStarShape(ctx, x, y, 5, r * 0.9, r * 0.4);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

export function drawRoundedRect(ctx, x, y, width, height, radius) {
  if (typeof ctx.roundRect === "function") {
    ctx.beginPath();
    ctx.roundRect(x, y, width, height, radius);
  } else {
    radius = Math.min(radius, width / 2, height / 2);
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }
}

export function drawGear(ctx, x, y, outerR, teeth, innerR = outerR * 0.4) {
  ctx.beginPath();
  const step = (Math.PI * 2) / teeth;
  const toothWidth = step * 0.5; // fraction of a step that forms the tooth top

  ctx.moveTo(x + Math.cos(0) * innerR, y + Math.sin(0) * innerR);

  for (let i = 0; i < teeth; i++) {
    const start = i * step;
    const end = start + toothWidth;
    const next = (i + 1) * step;

    // Tooth flank going outward
    ctx.lineTo(x + Math.cos(start) * outerR, y + Math.sin(start) * outerR);
    // Flat top of the tooth
    ctx.lineTo(x + Math.cos(end) * outerR, y + Math.sin(end) * outerR);
    // Tooth flank going inward
    ctx.lineTo(x + Math.cos(end) * innerR, y + Math.sin(end) * innerR);
    // Base arc along the inner radius
    ctx.lineTo(x + Math.cos(next) * innerR, y + Math.sin(next) * innerR);
  }

  ctx.closePath();
}
