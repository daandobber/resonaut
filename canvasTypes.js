// Canvas type definitions and logic
export const CANVAS_TYPES = {
  FREEFORM: 'freeform',
  MUSICAL_STAFF: 'musical_staff'
};

export class CanvasType {
  constructor(type, config = {}) {
    this.type = type;
    this.config = config;
  }
  
  // Override these methods in subclasses
  canPlaceNode(nodeType, x, y) { return true; }
  adjustNodePlacement(nodeType, x, y) { return { x, y }; }
  drawBackground(ctx, canvas) {}
  getNodeProperties(nodeType, x, y) { return {}; }
  getAllowedNodeTypes() { return null; } // null means all types allowed
}

export class FreeformCanvasType extends CanvasType {
  constructor(config = {}) {
    super(CANVAS_TYPES.FREEFORM, config);
  }
}

export class MusicalStaffCanvasType extends CanvasType {
  constructor(config = {}) {
    super(CANVAS_TYPES.MUSICAL_STAFF, {
      staffSpacing: 40,
      staffCount: 11, // Standard treble clef staff (5) + bass clef staff (5) + middle line
      offsetY: 100,
      noteNames: ['C6', 'B5', 'A5', 'G5', 'F5', 'E5', 'D5', 'C5', 'B4', 'A4', 'G4'],
      ...config
    });
    
    // Playback state
    this.isPlaying = false;
    this.scanLineX = 0;
    this.playbackSpeed = 100; // pixels per second
    this.startTime = 0;
    this.canvasWidth = 1200; // Default canvas width, updated during drawing
  }
  
  getAllowedNodeTypes() {
    // Only allow sound/instrument nodes on staff
    return ['sound'];
  }
  
  canPlaceNode(nodeType, x, y) {
    return this.getAllowedNodeTypes().includes(nodeType);
  }
  
  adjustNodePlacement(nodeType, x, y) {
    const { staffSpacing, staffCount, offsetY } = this.config;
    
    // Snap to nearest staff line
    const relativeY = y - offsetY;
    const staffLine = Math.round(relativeY / staffSpacing);
    const clampedStaffLine = Math.max(0, Math.min(staffCount - 1, staffLine));
    const snappedY = offsetY + (clampedStaffLine * staffSpacing);
    
    return { x, y: snappedY };
  }
  
  getNodeProperties(nodeType, x, y) {
    const { staffSpacing, staffCount, offsetY, noteNames } = this.config;
    
    // Determine which staff line this is on
    const relativeY = y - offsetY;
    const staffLine = Math.round(relativeY / staffSpacing);
    const clampedStaffLine = Math.max(0, Math.min(staffCount - 1, staffLine));
    
    // Get the note for this staff line
    const noteName = noteNames[clampedStaffLine] || 'C4';
    
    return {
      baseNote: noteName,
      staffLine: clampedStaffLine
    };
  }
  
  // Playback control methods
  play() {
    if (!this.isPlaying) {
      this.isPlaying = true;
      this.startTime = Date.now() - (this.scanLineX / this.playbackSpeed * 1000);
    }
  }
  
  pause() {
    this.isPlaying = false;
  }
  
  stop() {
    this.isPlaying = false;
    this.scanLineX = 0;
  }
  
  togglePlayback() {
    if (this.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  }
  
  updateScanLine() {
    if (this.isPlaying) {
      const prevX = this.scanLineX;
      const elapsed = (Date.now() - this.startTime) / 1000; // seconds
      this.scanLineX = elapsed * this.playbackSpeed;
      
      // Check for collisions with nodes
      this.checkCollisions(prevX, this.scanLineX);
      
      // Reset when reaching end
      if (this.scanLineX > this.canvasWidth) {
        this.scanLineX = 0;
        this.startTime = Date.now();
      }
    }
  }
  
  checkCollisions(prevX, currentX) {
    if (typeof window.nodes === 'undefined') return;
    
    // Only check nodes that are sound types
    const soundNodes = window.nodes.filter(node => node.type === 'sound');
    
    soundNodes.forEach(node => {
      // Check if scan line passed through this node
      if (prevX <= node.x && node.x <= currentX) {
        this.triggerNode(node);
      }
    });
  }
  
  triggerNode(node) {
    try {
      // Use the same trigger mechanism as pulse propagation
      if (typeof window.triggerNodeEffect === 'function') {
        window.triggerNodeEffect(node, { 
          intensity: 1.0, 
          color: '#ff0000',
          fromScanLine: true 
        });
      }
    } catch (error) {
      console.warn('Error triggering node from scan line:', error);
    }
  }
  
  drawBackground(ctx, canvas) {
    const { staffSpacing, staffCount, offsetY } = this.config;
    
    // Update canvas width
    this.canvasWidth = canvas.width / (window.viewScale || 1);
    
    // Update scan line position
    this.updateScanLine();
    
    ctx.save();
    ctx.globalCompositeOperation = 'source-over';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.lineWidth = 2;
    ctx.setLineDash([]);
    
    // Draw staff lines
    for (let i = 0; i < staffCount; i++) {
      const y = offsetY + (i * staffSpacing);
      
      // Make main staff lines (treble and bass clef) more prominent
      if (i <= 4 || i >= 6) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.lineWidth = 2;
      } else {
        // Middle line (middle C)
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.lineWidth = 1;
      }
      
      ctx.beginPath();
      ctx.moveTo(-2000, y);
      ctx.lineTo(4000, y);
      ctx.stroke();
    }
    
    // Draw note names on the left
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.font = '12px monospace';
    ctx.textAlign = 'left';
    
    for (let i = 0; i < staffCount && i < this.config.noteNames.length; i++) {
      const y = offsetY + (i * staffSpacing) + 4; // Offset for text alignment
      ctx.fillText(this.config.noteNames[i], 10, y);
    }
    
    // Draw scan line if playing
    if (this.isPlaying) {
      ctx.strokeStyle = 'rgba(255, 0, 0, 0.8)';
      ctx.lineWidth = 3;
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.moveTo(this.scanLineX, 0);
      ctx.lineTo(this.scanLineX, canvas.height);
      ctx.stroke();
      
      // Add a glow effect
      ctx.shadowColor = 'rgba(255, 0, 0, 0.5)';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.moveTo(this.scanLineX, 0);
      ctx.lineTo(this.scanLineX, canvas.height);
      ctx.stroke();
      ctx.shadowBlur = 0;
    }
    
    ctx.restore();
  }
}

// Factory function to create canvas types
export function createCanvasType(type, config = {}) {
  switch (type) {
    case CANVAS_TYPES.FREEFORM:
      return new FreeformCanvasType(config);
    case CANVAS_TYPES.MUSICAL_STAFF:
      return new MusicalStaffCanvasType(config);
    default:
      return new FreeformCanvasType(config);
  }
}