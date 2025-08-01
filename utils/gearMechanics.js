export function computeDrivenSpeed(driverSpeed, driverTeeth, drivenTeeth) {
  return (driverSpeed * driverTeeth) / drivenTeeth;
}

export function stepAngle(angle, speed, dt) {
  const newAngle = angle + speed * dt;
  const full = Math.PI * 2;
  return ((newAngle % full) + full) % full;
}

export function rotateDrivenGear(motor, gear, dt) {
  const speed = computeDrivenSpeed(
    motor.speed,
    motor.teeth,
    gear.teeth,
  );
  const newAngle = stepAngle(gear.angle || 0, speed, dt);
  gear.angle = newAngle;
  return newAngle;
}

