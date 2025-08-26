let NexusPromise = typeof window !== "undefined" ? import("nexusui") : null;

export class GridSequencer {
  constructor(target, { rows = 4, columns = 8, interval = 150 } = {}) {
    this.rows = rows;
    this.columns = columns;
    this.interval = interval;
    this.position = 0;
    this.timer = null;
    this.matrix = Array.from({ length: rows }, () =>
      Array(columns).fill(false)
    );
    this.handlers = { pulse: [] };
    this.sequencer = null;

    if (target && NexusPromise) {
      NexusPromise.then(({ default: Nexus }) => {
        this.sequencer = new Nexus.Sequencer(target, { rows, columns });
        this.sequencer.on("change", ({ row, column, state }) => {
          if (row < rows && column < columns) {
            this.matrix[row][column] = state;
          }
        });
      }).catch(() => {
        /* ignore load errors */
      });
    }
  }

  on(type, fn) {
    if (this.handlers[type]) {
      this.handlers[type].push(fn);
    }
  }

  off(type, fn) {
    if (this.handlers[type]) {
      this.handlers[type] = this.handlers[type].filter((h) => h !== fn);
    }
  }

  _emit(type, detail) {
    (this.handlers[type] || []).forEach((fn) => {
      try {
        fn(detail);
      } catch {
        /* ignore handler errors */
      }
    });
  }

  setPattern(pattern) {
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.columns; c++) {
        this.matrix[r][c] = !!(pattern[r] && pattern[r][c]);
      }
    }
    if (this.sequencer && this.sequencer.matrix && this.sequencer.matrix.set) {
      this.sequencer.matrix.set.all(this.matrix);
    }
  }

  toggle(row, column) {
    if (row < 0 || row >= this.rows || column < 0 || column >= this.columns) {
      return;
    }
    this.matrix[row][column] = !this.matrix[row][column];
    if (this.sequencer && this.sequencer.matrix && this.sequencer.matrix.toggle) {
      this.sequencer.matrix.toggle(row, column);
    }
  }

  step() {
    const column = this.position % this.columns;
    for (let r = 0; r < this.rows; r++) {
      if (this.matrix[r][column]) {
        this._emit("pulse", { row: r, column });
        if (typeof this.onPulse === "function") {
          this.onPulse(r, column);
        }
      }
    }
    if (this.sequencer && typeof this.sequencer.next === "function") {
      this.sequencer.next();
    }
    this.position = (column + 1) % this.columns;
  }

  start() {
    if (this.timer) return;
    this.position = 0;
    this.timer = setInterval(() => this.step(), this.interval);
  }

  stop() {
    if (!this.timer) return;
    clearInterval(this.timer);
    this.timer = null;
  }
}
