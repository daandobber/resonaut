import * as Tone from "tone";

export class Pulse {
  constructor(x, y, angle, speed = 5) {
    this.x = x;
    this.y = y;
    this.angle = angle;
    this.speed = speed;
    this.radius = 5;
    this.active = true;
  }

  step() {
    if (!this.active) return;
    this.x += Math.cos(this.angle) * this.speed;
    this.y += Math.sin(this.angle) * this.speed;
  }
}

export class Pulsar {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }

  shoot(angle = 0) {
    return new Pulse(this.x, this.y, angle);
  }
}

export class GridPulsar {
  constructor(
    x,
    y,
    rows = 4,
    cols = 4,
    { interval = "8n", sync = true } = {}
  ) {
    this.x = x;
    this.y = y;
    this.rows = rows;
    this.cols = cols;
    this.interval = interval;
    this.sync = sync;
    this.grid = Array.from({ length: rows }, () => Array(cols).fill(false));
    this.column = 0;
    this.connectors = Array.from({ length: rows }, () => []);
    this.loop = null;
  }

  toggle(row, col, state = true) {
    if (row < 0 || row >= this.rows || col < 0 || col >= this.cols) return;
    this.grid[row][col] = state;
  }

  on(row, callback) {
    if (row < 0 || row >= this.rows) return;
    this.connectors[row].push(callback);
  }

  step(time) {
    const pulses = [];
    for (let r = 0; r < this.rows; r++) {
      if (this.grid[r][this.column]) {
        const pulse = new Pulse(this.x, this.y, 0);
        pulses.push(pulse);
        for (const cb of this.connectors[r]) cb(pulse, time);
      }
    }
    this.column = (this.column + 1) % this.cols;
    return pulses;
  }

  start() {
    if (this.loop) return;
    this.loop = new Tone.Loop((time) => this.step(time), this.interval);
    if (this.sync) this.loop.start(0);
    else this.loop.start();
    if (Tone.Transport.state !== "started") Tone.Transport.start();
  }

  stop() {
    if (this.loop) this.loop.stop();
  }
}
