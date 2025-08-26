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

    console.log('[GridSequencer] Initialized', {
      x,
      y,
      rows,
      cols,
      interval,
      sync,
      targetPresent: !!target,
    });
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
    if (row < 0 || row >= this.rows || col < 0 || col >= this.cols) {
      console.log('[GridSequencer.toggle] Ignored out of bounds', { row, col });
      return;
    }
    this.grid[row][col] = state;
    console.log('[GridSequencer.toggle]', { row, col, state });
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
        console.log('[GridSequencer.ctrlToggle]', { row, col });
        this.toggle(row, col);
        e.preventDefault();
        e.stopPropagation();
      }
    });
  }

  on(row, callback) {
    if (row < 0 || row >= this.rows) {
      console.log('[GridSequencer.on] Ignored out of bounds row', row);
      return;
    }
    console.log('[GridSequencer.on] Added callback for row', row);
    this.callbacks[row].push(callback);
  }

  step(time) {
    console.log('[GridSequencer.step] Column', this.column, 'Time', time);
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
        console.log('[GridSequencer.step] Trigger', { row: r, column: this.column });
        for (const cb of this.callbacks[r]) cb(time);
      }
    }
    this.column = (this.column + 1) % this.cols;
  }

  start() {
    if (this.loop) return;
    this.loop = new Tone.Loop((time) => this.step(time), this.interval);
    const transportStarted = Tone.Transport.state === "started";
    if (this.sync) {
      const startTime = transportStarted ? "+0" : 0;
      console.log('[GridSequencer.start] Sync start', {
        startTime,
        transportStarted,
      });
      this.loop.start(startTime);
    } else {
      console.log('[GridSequencer.start] Unsynced start');
      this.loop.start();
    }
    if (!transportStarted) {
      console.log('[GridSequencer.start] Starting Transport');
      Tone.Transport.start();
    }
  }

  stop() {
    if (this.loop) {
      console.log('[GridSequencer.stop] Stopping loop');
      this.loop.stop();
      this.loop = null;
    }
    this.column = 0;
    if (this.sequencer) {
      try {
        this.sequencer.stepper.value = -1;
        if (typeof this.sequencer.draw === "function") {
          this.sequencer.draw();
        } else {
          this.sequencer.render();
        }
      } catch {
        /* ignore */
      }
    }
  }
}
