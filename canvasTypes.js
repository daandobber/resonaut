// Canvas type definitions and logic
export const CANVAS_TYPES = {
  FREEFORM: 'freeform'
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

// Factory function to create canvas types
export function createCanvasType(type, config = {}) {
  switch (type) {
    case CANVAS_TYPES.FREEFORM:
      return new FreeformCanvasType(config);
    default:
      return new FreeformCanvasType(config);
  }
}
