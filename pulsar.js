import * as Tone from "tone";

// NexusUI is only available in a browser environment.
// Use a deferred dynamic import so tests can run in Node
// without requiring a DOM implementation.
let NexusPromise = typeof window !== 'undefined' ? import('nexusui') : null;

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

export class GridSequencer {
  constructor(
    x,
    y,
    rows = 4,
    cols = 8,
    { interval = "16n", sync = true, target = null } = {}
  ) {
    // position kept for compatibility with node layout
    this.x = x;
    this.y = y;
    this.rows = rows;
    this.cols = cols;
    this.interval = interval;
    this.sync = sync;
    this.grid = Array.from({ length: rows }, () => Array(cols).fill(false));
    this.column = 0;
    this.callbacks = Array.from({ length: rows }, () => []);
    this.loop = null;
    this.sequencer = null;

    if (target && NexusPromise) {
      NexusPromise.then(({ default: Nexus }) => {
        this.sequencer = new Nexus.Sequencer(target, {
          rows,
          columns: cols,
          size: [cols * 20, rows * 20],
        });
        // allow click/drag toggling even during playback
        this.sequencer.on("change", ({ row, column, state }) => {
          this.toggle(row, column, !!state);
        });
        // reflect any pre-existing grid state
        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            if (this.grid[r][c]) {
              // Matrix.set.cell expects (column, row, value)
              this.sequencer.matrix.set.cell(c, r, 1);
            }
          }
        }
        this.bindCtrlToggle();
      }).catch(() => {
        /* ignore Nexus loading errors */
      });
    }
  }

  toggle(row, col, state = !this.grid[row][col]) {
    if (row < 0 || row >= this.rows || col < 0 || col >= this.cols) return;
    this.grid[row][col] = state;
    if (this.sequencer) {
      try {
        // Matrix.set.cell uses (column, row, value)
        this.sequencer.matrix.set.cell(col, row, state ? 1 : 0);
      } catch {
        // ignore if Nexus matrix API is unavailable
      }
    }
  }

  bindCtrlToggle() {
    const node =
      this.sequencer?.node ||
      this.sequencer?.element ||
      this.sequencer?.canvas?.element;
    if (!node) return;
    node.addEventListener("pointerdown", (e) => {
      if (e.ctrlKey) {
        const rect = node.getBoundingClientRect();
        const col = Math.floor(
          (e.clientX - rect.left) / (rect.width / this.cols),
        );
        const row = Math.floor(
          (e.clientY - rect.top) / (rect.height / this.rows),
        );
        this.toggle(row, col);
        e.preventDefault();
        e.stopPropagation();
      }
    });
  }

  on(row, callback) {
    if (row < 0 || row >= this.rows) return;
    this.callbacks[row].push(callback);
  }

  step(time) {
    if (this.sequencer) {
      try {
        this.sequencer.stepper.value = this.column;
        if (typeof this.sequencer.stepper.draw === "function") {
          this.sequencer.stepper.draw();
        } else if (typeof this.sequencer.draw === "function") {
          this.sequencer.draw();
        }
      } catch {
        /* ignore */
      }
    }
    for (let r = 0; r < this.rows; r++) {
      if (this.grid[r][this.column]) {
        for (const cb of this.callbacks[r]) cb(time);
      }
    }
    this.column = (this.column + 1) % this.cols;
  }

  start() {
    if (this.loop) return;
    this.loop = new Tone.Loop((time) => this.step(time), this.interval);
    if (this.sync) this.loop.start(0);
    else this.loop.start();
    if (Tone.Transport.state !== "started") Tone.Transport.start();
  }

  stop() {
    if (this.loop) {
      this.loop.stop();
      this.loop = null;
    }
    this.column = 0;
    if (this.sequencer) {
      try {
        this.sequencer.stepper.value = -1;
        this.sequencer.render();
      } catch {
        /* ignore */
      }
    }
  }
}
