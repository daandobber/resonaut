import { switchTo } from './canvasManager.js';

export class CanvasReceiveOrb {
  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
    this.radius = 20;
  }
}

export class CanvasSendOrb {
  constructor(x = 0, y = 0, targetCanvasIndex = 0, receiverId = null) {
    this.x = x;
    this.y = y;
    this.radius = 20;
    this.targetCanvasIndex = targetCanvasIndex;
    this.receiverId = receiverId;
  }

  checkHit(pulse) {
    const dx = this.x - pulse.x;
    const dy = this.y - pulse.y;
    return Math.sqrt(dx * dx + dy * dy) <= this.radius + pulse.radius;
  }

  trigger(pulse, receivers = []) {
    switchTo(this.targetCanvasIndex);
    const target = receivers.find(r => r.id === this.receiverId);
    if (target && pulse) {
      pulse.x = target.x;
      pulse.y = target.y;
    }
  }
}
