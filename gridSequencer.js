import { rgbToHex, lerpColor } from "./utils/colorUtils.js";
let NexusPromise = typeof window !== "undefined" ? import("nexusui") : null;

export class GridSequencer {
  constructor(
    target,
    {
      rows = 4,
      columns = 8,
      interval = 150,
      subdivision = 1,
      bpm,
      useGlobalSync = false,
    } = {},
  ) {
    this.rows = rows;
    this.columns = columns;
    this.interval = interval;
    this.subdivision = subdivision;
    this.bpm = bpm;
    this.useGlobalSync = useGlobalSync;
    this.position = 0;
    this.timer = null;
    this.matrix = Array.from({ length: rows }, () =>
      Array(columns).fill(false)
    );
    this.handlers = { pulse: [] };
    this.sequencer = null;
    this.scanlineColor = "#fff";
    this.scanlineAlpha = 1;
    this.borderAlpha = 1;
    this.activeAlpha = 1;
    this.inactiveAlpha = 1;
    this.activeColor = "#ffd700";
    this.inactiveColor = "#222";

    if (target && NexusPromise) {
      NexusPromise.then(({ default: Nexus }) => {
        this.sequencer = new Nexus.Sequencer(target, {
          rows,
          columns,
          paddingRow: 4,
          paddingColumn: 4,
        });

        this.updateColors();

        const element =
          this.sequencer.element || this.sequencer.canvas || target;
        try {
          const rect = element.getBoundingClientRect();
          this.cellSize = rect.height / rows;
        } catch {
          this.cellSize = (element?.height || element?.offsetHeight || 0) / rows;
        }

        const originalRender = this.sequencer.render.bind(this.sequencer);
        this.sequencer.render = () => {
          originalRender();
          if (this.sequencer?.cells) {
            this.sequencer.cells.forEach((cell) => {
              const { pad } = cell;
              pad.setAttribute("stroke", this.borderColor || "transparent");
              pad.setAttribute("stroke-width", "1");
              pad.setAttribute("stroke-opacity", this.borderAlpha);
              pad.setAttribute(
                "fill",
                cell.state ? this.activeColor : this.inactiveColor,
              );
              pad.setAttribute(
                "fill-opacity",
                cell.state ? this.activeAlpha : this.inactiveAlpha,
              );
              console.log("render pad", {
                row: cell.row,
                column: cell.column,
                state: cell.state,
                color: cell.state ? this.activeColor : this.inactiveColor,
              });
            });
          }
          const col = this.sequencer.stepper.value;
          if (col >= 0) {
            for (let r = 0; r < this.sequencer.rows; r++) {
              const idx = r * this.sequencer.columns + col;
              const pad = this.sequencer.cells[idx].pad;
              pad.setAttribute("stroke", this.scanlineColor);
              pad.setAttribute("stroke-width", "2");
              pad.setAttribute("stroke-opacity", this.scanlineAlpha);
            }
            console.log("scanline", { column: col, color: this.scanlineColor });
          }
        };

        this.sequencer.on("change", ({ row, column, state }) => {
          if (row < rows && column < columns) {
            this.matrix[row][column] = state;
            if (this.sequencer?.cells) {
              const idx = row * this.sequencer.columns + column;
              const pad = this.sequencer.cells[idx].pad;
              pad.setAttribute(
                "fill",
                state ? this.activeColor : this.inactiveColor,
              );
              pad.setAttribute(
                "fill-opacity",
                state ? this.activeAlpha : this.inactiveAlpha,
              );
            }
            console.log("toggle", {
              row,
              column,
              state,
              color: state ? this.activeColor : this.inactiveColor,
            });
          }
        });

        window.addEventListener("scale-changed", () => this.updateColors());
      }).catch(() => {
        /* ignore load errors */
      });
    }
  }

  updateColors() {
    if (!this.sequencer) return;
    const style = getComputedStyle(document.body || document.documentElement);

    const parseColor = (value, fallback = "#000") => {
      if (!value) return { hex: fallback, alpha: 1 };
      const val = value.trim();
      if (val.startsWith("rgba")) {
        const parts = val
          .substring(val.indexOf("(") + 1, val.lastIndexOf(")"))
          .split(",");
        const r = parseFloat(parts[0]);
        const g = parseFloat(parts[1]);
        const b = parseFloat(parts[2]);
        const a = parseFloat(parts[3]);
        return { hex: rgbToHex(r, g, b), alpha: isNaN(a) ? 1 : a };
      }
      if (val.startsWith("rgb")) {
        const parts = val
          .substring(val.indexOf("(") + 1, val.lastIndexOf(")"))
          .split(",");
        const r = parseFloat(parts[0]);
        const g = parseFloat(parts[1]);
        const b = parseFloat(parts[2]);
        return { hex: rgbToHex(r, g, b), alpha: 1 };
      }
      return { hex: val, alpha: 1 };
    };

    const inactive = parseColor(style.getPropertyValue("--grid-color") || "#222");
    const baseActive = parseColor(
      style.getPropertyValue("--start-node-color") || "#ffd700",
    );
    const baseScan = parseColor(
      style.getPropertyValue("--timeline-grid-default-scanline-color") ||
        baseActive.hex,
    );
    const border = parseColor(
      style.getPropertyValue("--timeline-grid-default-border-color") ||
        baseActive.hex,
    );

    const activeHex = lerpColor(baseActive.hex, "#ffffff", 0.25);
    const scanHex = lerpColor(baseScan.hex, "#ffffff", 0.5);

    this.scanlineColor = scanHex;
    this.scanlineAlpha = baseScan.alpha;
    this.borderColor = border.hex;
    this.borderAlpha = border.alpha;
    this.activeAlpha = baseActive.alpha;
    this.inactiveAlpha = inactive.alpha;
    this.activeColor = activeHex;
    this.inactiveColor = inactive.hex;

    this.sequencer.colorize("fill", inactive.hex);
    this.sequencer.colorize("accent", activeHex);
    if (this.sequencer?.cells) {
      this.sequencer.cells.forEach((cell) => {
        const { pad } = cell;
        pad.setAttribute("stroke", this.borderColor);
        pad.setAttribute("stroke-width", "1");
        pad.setAttribute("stroke-opacity", this.borderAlpha);
        pad.setAttribute(
          "fill-opacity",
          cell.state ? this.activeAlpha : this.inactiveAlpha,
        );
      });
    }
    if (typeof this.sequencer.render === "function") {
      this.sequencer.render();
    }
    console.log("updateColors", {
      active: this.activeColor,
      inactive: this.inactiveColor,
      scanline: this.scanlineColor,
      alpha: {
        active: this.activeAlpha,
        inactive: this.inactiveAlpha,
        scanline: this.scanlineAlpha,
      },
    });
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
    console.log("toggle method", {
      row,
      column,
      state: this.matrix[row][column],
    });
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
    this.updateInterval();
    this.timer = setInterval(() => this.step(), this.interval);
  }

  stop() {
    if (!this.timer) return;
    clearInterval(this.timer);
    this.timer = null;
  }

  updateInterval() {
    let newInterval = this.interval;
    if (
      this.useGlobalSync &&
      typeof isGlobalSyncEnabled !== "undefined" &&
      isGlobalSyncEnabled &&
      typeof globalBPM === "number" &&
      globalBPM > 0
    ) {
      const secondsPerBeat = 60 / globalBPM;
      newInterval = secondsPerBeat * 1000 * this.subdivision;
    } else if (this.bpm && this.bpm > 0) {
      const secondsPerBeat = 60 / this.bpm;
      newInterval = secondsPerBeat * 1000 * this.subdivision;
    }
    this.interval = newInterval;
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = setInterval(() => this.step(), this.interval);
    }
  }

  setSubdivision(sub) {
    this.subdivision = sub;
    this.updateInterval();
  }

  setBpm(bpm) {
    this.bpm = bpm;
    this.updateInterval();
  }

  setUseGlobalSync(flag) {
    this.useGlobalSync = flag;
    this.updateInterval();
  }

  setSteps(columns) {
    if (!Number.isInteger(columns) || columns <= 0) return;
    this.columns = columns;
    this.matrix = Array.from({ length: this.rows }, () =>
      Array(columns).fill(false)
    );
    this.position = 0;
    if (this.sequencer) {
      try {
        const element = this.sequencer.element || this.sequencer.canvas;
        if (element && typeof this.cellSize === "number") {
          const width = this.cellSize * columns;
          const height = this.cellSize * this.rows;
          if (element.width !== undefined) element.width = width;
          if (element.height !== undefined) element.height = height;
          if (element.style) {
            element.style.width = `${width}px`;
            element.style.height = `${height}px`;
          }
        }
        if (typeof this.sequencer.set === "function") {
          this.sequencer.set({ columns, rows: this.rows });
        }
        if (this.sequencer.matrix && this.sequencer.matrix.set) {
          this.sequencer.matrix.set.all(this.matrix);
        }
      } catch {
        /* ignore resize errors */
      }
    }
  }
}
