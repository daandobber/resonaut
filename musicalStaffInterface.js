// Musical Staff Interface - Mario Paint / DAW style
export class MusicalStaffInterface {
  constructor(container) {
    this.container = container;
    this.canvas = null;
    this.ctx = null;
    this.isActive = false;
    
    // Musical staff configuration
    this.staffLineHeight = 35;
    this.staffCount = 11;
    this.staffStartY = 80;
    this.noteNames = ['C6', 'B5', 'A5', 'G5', 'F5', 'E5', 'D5', 'C5', 'B4', 'A4', 'G4'];
    
    // Viewport and scrolling
    this.scrollX = 0;
    this.viewWidth = 1200;
    this.totalWidth = 4800; // 4 screens worth
    this.measureWidth = 200; // pixels per measure
    this.measuresTotal = this.totalWidth / this.measureWidth;
    
    // Global playback control
    this.isPlaying = false;
    this.globalStartTime = 0;
    this.playbackSpeed = 100; // pixels per second (default)
    
    // BPM synchronization
    this.lastKnownBPM = 120;
    this.bpmSyncEnabled = true;
    
    // Grid-based block system
    this.blocks = [];
    this.currentBlockId = null;
    this.selectedNotes = [];
    
    // Grid configuration
    this.gridCols = 8; // 8x8 grid
    this.gridRows = 8;
    this.gridCellSize = 120; // Size of each grid cell
    this.gridPadding = 4; // Padding between cells
    
    // Block states
    this.expandedBlockId = null; // Which block is currently expanded for editing
    this.expandedBlockSize = { width: 800, height: 400 }; // Size when expanded
    
    // Expanded block position (for editing overlay)
    this.expandedBlockOverlay = null;
    
    // Instrument selection
    this.currentInstrument = {
      engine: 'pulse',
      waveform: 'pulse',
      subtype: 'pulse'
    };
    
    // Note length settings
    this.noteLengths = [
      { name: '1/16', value: 0.25, pixels: 12.5 },
      { name: '1/8', value: 0.5, pixels: 25 },
      { name: '1/4', value: 1, pixels: 50 },
      { name: '1/2', value: 2, pixels: 100 },
      { name: '1', value: 4, pixels: 200 }
    ];
    this.currentNoteLengthIndex = 2; // Default to 1/4 note
    
    this.init();
  }
  
  init() {
    this.createInterface();
    this.setupEventListeners();
    this.createDefaultBlock();
    this.render();
  }

  createBlock(length = 4, name = null) {
    const blockId = 'block_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    const block = {
      id: blockId,
      name: name || `Block ${this.blocks.length + 1}`,
      length: length, // Length in measures
      width: length * this.measureWidth,
      notes: [],
      isPlaying: false,
      playbackPosition: 0,
      startTime: 0,
      isMuted: false,
      isSolo: false,
      color: this.generateBlockColor(),
      gridX: 0, // Grid position X (will be set when placed)
      gridY: 0, // Grid position Y (will be set when placed)
      x: 0, // Pixel position (calculated from grid position)
      y: 0, // Pixel position (calculated from grid position)
      width: this.gridCellSize - this.gridPadding, // Visual width when collapsed
      height: this.gridCellSize - this.gridPadding, // Visual height when collapsed
      isExpanded: false
    };
    
    this.blocks.push(block);
    return block;
  }

  createDefaultBlock() {
    const defaultBlock = this.createBlock(4, "Main Pattern");
    this.placeBlockOnGrid(defaultBlock);
    this.currentBlockId = defaultBlock.id;
  }
  
  placeBlockOnGrid(block, gridX = null, gridY = null) {
    if (gridX === null || gridY === null) {
      const emptyPos = this.findEmptyGridPosition();
      gridX = emptyPos.x;
      gridY = emptyPos.y;
    }
    
    block.gridX = gridX;
    block.gridY = gridY;
    this.updateBlockPosition(block);
  }

  generateBlockColor() {
    const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3', '#54a0ff'];
    return colors[this.blocks.length % colors.length];
  }

  getCurrentBlock() {
    return this.blocks.find(b => b.id === this.currentBlockId);
  }

  getBlockAt(x, y) {
    // Check expanded block first
    if (this.expandedBlockId) {
      const expandedBlock = this.blocks.find(b => b.id === this.expandedBlockId);
      if (expandedBlock && this.isPointInExpandedBlock(x, y, expandedBlock)) {
        return expandedBlock;
      }
    }
    
    // Check grid blocks
    for (let block of this.blocks) {
      if (!block.isExpanded && 
          x >= block.x && x <= block.x + block.width && 
          y >= block.y && y <= block.y + block.height) {
        return block;
      }
    }
    return null;
  }
  
  isPointInExpandedBlock(x, y, block) {
    // Expanded blocks appear as overlay in center of screen
    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;
    const expandedX = centerX - this.expandedBlockSize.width / 2;
    const expandedY = centerY - this.expandedBlockSize.height / 2;
    
    return x >= expandedX && x <= expandedX + this.expandedBlockSize.width &&
           y >= expandedY && y <= expandedY + this.expandedBlockSize.height;
  }
  
  findEmptyGridPosition() {
    for (let row = 0; row < this.gridRows; row++) {
      for (let col = 0; col < this.gridCols; col++) {
        if (!this.isGridPositionOccupied(col, row)) {
          return { x: col, y: row };
        }
      }
    }
    return { x: 0, y: 0 }; // Fallback to origin
  }
  
  isGridPositionOccupied(gridX, gridY) {
    return this.blocks.some(block => 
      block.gridX === gridX && block.gridY === gridY
    );
  }
  
  updateBlockPosition(block) {
    block.x = block.gridX * (this.gridCellSize + this.gridPadding);
    block.y = block.gridY * (this.gridCellSize + this.gridPadding) + 60; // Offset for toolbar
  }
  
  createInterface() {
    // Create main staff container
    this.staffContainer = document.createElement('div');
    this.staffContainer.id = 'musicalStaffContainer';
    this.staffContainer.className = 'musical-staff-container';
    
    // Create toolbar
    this.toolbar = document.createElement('div');
    this.toolbar.className = 'musical-staff-toolbar';
    
    // Play/pause button
    this.playBtn = document.createElement('button');
    this.playBtn.innerHTML = '▶️';
    this.playBtn.className = 'staff-play-btn';
    this.playBtn.addEventListener('click', () => this.togglePlayback());
    
    // Stop button
    this.stopBtn = document.createElement('button');
    this.stopBtn.innerHTML = '⏹️';
    this.stopBtn.className = 'staff-stop-btn';
    this.stopBtn.addEventListener('click', () => this.stop());
    
    // Loop controls
    this.loopBtn = document.createElement('button');
    this.loopBtn.innerHTML = '🔁';
    this.loopBtn.className = 'staff-loop-btn';
    this.loopBtn.title = 'Toggle Loop';
    
    // Instrument selection button
    this.instrumentBtn = document.createElement('button');
    this.instrumentBtn.innerHTML = '🎼';
    this.instrumentBtn.className = 'staff-instrument-btn';
    this.instrumentBtn.title = 'Select Instrument';
    
    // Note length button
    this.noteLengthBtn = document.createElement('button');
    this.noteLengthBtn.innerHTML = '♪';
    this.noteLengthBtn.className = 'staff-note-length-btn';
    this.noteLengthBtn.title = `Note Length: ${this.noteLengths[this.currentNoteLengthIndex].name}`;
    
    // Block management buttons
    this.addBlockBtn = document.createElement('button');
    this.addBlockBtn.innerHTML = '➕';
    this.addBlockBtn.className = 'staff-add-block-btn';
    this.addBlockBtn.title = 'Add New Block';
    
    this.blockSelectBtn = document.createElement('button');
    this.blockSelectBtn.innerHTML = '📋';
    this.blockSelectBtn.className = 'staff-block-select-btn';
    this.blockSelectBtn.title = 'Block Manager';
    
    this.toolbar.appendChild(this.playBtn);
    this.toolbar.appendChild(this.stopBtn);
    this.toolbar.appendChild(this.loopBtn);
    this.toolbar.appendChild(this.instrumentBtn);
    this.toolbar.appendChild(this.noteLengthBtn);
    this.toolbar.appendChild(this.addBlockBtn);
    this.toolbar.appendChild(this.blockSelectBtn);
    
    // Create staff canvas
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'musical-staff-canvas';
    this.ctx = this.canvas.getContext('2d');
    
    // Set canvas size after it's added to DOM
    this.resizeCanvas = () => {
      const rect = this.canvas.getBoundingClientRect();
      this.canvas.width = rect.width;
      
      // Calculate height needed for grid
      const gridHeight = 60 + this.gridRows * (this.gridCellSize + this.gridPadding) + 50;
      this.canvas.height = Math.max(rect.height, gridHeight);
      
      this.viewWidth = rect.width;
      this.render();
    };
    
    // Create horizontal scrollbar
    this.scrollbar = document.createElement('div');
    this.scrollbar.className = 'musical-staff-scrollbar';
    
    this.scrollThumb = document.createElement('div');
    this.scrollThumb.className = 'musical-staff-scroll-thumb';
    this.scrollbar.appendChild(this.scrollThumb);
    
    // Assemble interface
    this.staffContainer.appendChild(this.toolbar);
    this.staffContainer.appendChild(this.canvas);
    this.staffContainer.appendChild(this.scrollbar);
    
    this.container.appendChild(this.staffContainer);
  }
  
  setupEventListeners() {
    // Canvas mouse events for placing/selecting notes
    this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
    this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
    this.canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));
    
    // Scrollbar events
    this.setupScrollbar();
    
    // Window resize events
    window.addEventListener('resize', () => {
      if (this.isActive) {
        this.resizeCanvas();
      }
    });
    
    // Instrument selection button event
    this.instrumentBtn.addEventListener('click', (e) => {
      e.preventDefault();
      this.showInstrumentMenu();
    });
    
    // Note length button event
    this.noteLengthBtn.addEventListener('click', (e) => {
      e.preventDefault();
      this.showNoteLengthMenu();
    });
    
    // Block management button events
    this.addBlockBtn.addEventListener('click', (e) => {
      e.preventDefault();
      this.showAddBlockMenu();
    });
    
    this.blockSelectBtn.addEventListener('click', (e) => {
      e.preventDefault();
      this.showBlockManager();
    });
    
    // Keyboard events
    document.addEventListener('keydown', (e) => {
      if (!this.isActive) return;
      if (e.code === 'Space') {
        e.preventDefault();
        this.togglePlayback();
      }
      if (e.code === 'Escape' && this.expandedBlockId) {
        e.preventDefault();
        this.collapseBlock();
      }
    });
  }
  
  setupScrollbar() {
    let isDragging = false;
    
    const updateThumbPosition = () => {
      const thumbWidth = (this.viewWidth / this.totalWidth) * this.scrollbar.clientWidth;
      const thumbPosition = (this.scrollX / (this.totalWidth - this.viewWidth)) * (this.scrollbar.clientWidth - thumbWidth);
      this.scrollThumb.style.width = thumbWidth + 'px';
      this.scrollThumb.style.left = Math.max(0, thumbPosition) + 'px';
    };
    
    this.scrollThumb.addEventListener('mousedown', (e) => {
      isDragging = true;
      e.preventDefault();
    });
    
    document.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      
      const scrollbarRect = this.scrollbar.getBoundingClientRect();
      const relativeX = e.clientX - scrollbarRect.left;
      const thumbWidth = this.scrollThumb.clientWidth;
      const maxThumbPosition = this.scrollbar.clientWidth - thumbWidth;
      const thumbPosition = Math.max(0, Math.min(maxThumbPosition, relativeX - thumbWidth / 2));
      
      this.scrollX = (thumbPosition / maxThumbPosition) * (this.totalWidth - this.viewWidth);
      this.render();
      updateThumbPosition();
    });
    
    document.addEventListener('mouseup', () => {
      isDragging = false;
    });
    
    // Initial thumb position
    updateThumbPosition();
  }
  
  handleMouseDown(e) {
    if (!this.isActive) return;
    
    const rect = this.canvas.getBoundingClientRect();
    const canvasX = e.clientX - rect.left;
    const canvasY = e.clientY - rect.top;
    
    // Check if clicking on expanded block
    if (this.expandedBlockId) {
      const expandedBlock = this.blocks.find(b => b.id === this.expandedBlockId);
      if (expandedBlock && this.isPointInExpandedBlock(canvasX, canvasY, expandedBlock)) {
        this.handleExpandedBlockClick(canvasX, canvasY, expandedBlock);
        return;
      } else {
        // Clicked outside expanded block - collapse it
        this.collapseBlock();
        return;
      }
    }
    
    // Convert to world coordinates for grid
    const worldX = canvasX + this.scrollX;
    
    // Find which block we're clicking in
    const clickedBlock = this.getBlockAt(worldX, canvasY);
    if (!clickedBlock) {
      // Clicked empty grid space - could add new block placement here
      return;
    }
    
    // Expand the block for editing
    this.expandBlock(clickedBlock);
  }
  
  handleExpandedBlockClick(canvasX, canvasY, block) {
    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;
    const expandedX = centerX - this.expandedBlockSize.width / 2;
    const expandedY = centerY - this.expandedBlockSize.height / 2;
    
    // Calculate relative position within expanded block
    const relativeX = canvasX - expandedX;
    const relativeY = canvasY - expandedY;
    
    // Check if clicking on existing note in this block
    const clickedNote = this.findNoteAtInExpandedBlock(relativeX, relativeY, block);
    if (clickedNote) {
      this.selectNote(clickedNote);
      return;
    }
    
    // Place new note if clicking on staff line
    const staffStartY = 60; // Staff starts 60px from top of expanded block
    const staffRelativeY = relativeY - staffStartY;
    const staffLine = this.getStaffLineAtRelative(staffRelativeY);
    if (staffLine !== -1) {
      this.placeNoteInExpandedBlock(relativeX, staffLine, block);
    }
  }
  
  expandBlock(block) {
    this.expandedBlockId = block.id;
    this.currentBlockId = block.id;
    block.isExpanded = true;
    this.render();
  }
  
  collapseBlock() {
    if (this.expandedBlockId) {
      const block = this.blocks.find(b => b.id === this.expandedBlockId);
      if (block) {
        block.isExpanded = false;
      }
      this.expandedBlockId = null;
      this.render();
    }
  }
  
  handleMouseMove(e) {
    // Handle note dragging here
  }
  
  handleMouseUp(e) {
    // Handle drag end here
  }
  
  getStaffLineAt(y) {
    for (let i = 0; i < this.staffCount; i++) {
      const lineY = this.staffStartY + (i * this.staffLineHeight);
      if (Math.abs(y - lineY) < this.staffLineHeight / 2) {
        return i;
      }
    }
    return -1;
  }

  getStaffLineAtRelative(relativeY) {
    // Similar to getStaffLineAt but works with Y relative to block start
    const blockStaffStartY = 30; // Offset within each block
    for (let i = 0; i < this.staffCount; i++) {
      const lineY = blockStaffStartY + (i * this.staffLineHeight);
      if (Math.abs(relativeY - lineY) < this.staffLineHeight / 2) {
        return i;
      }
    }
    return -1;
  }
  
  placeNoteInExpandedBlock(relativeX, staffLine, block) {
    // Snap to measure grid (quarter notes) - relative to expanded block
    const snappedX = Math.round(relativeX / (this.measureWidth / 4)) * (this.measureWidth / 4);
    
    const currentLength = this.noteLengths[this.currentNoteLengthIndex];
    const staffStartY = 60; // Staff starts 60px from top of expanded block
    const note = {
      id: Date.now() + Math.random(),
      x: snappedX,  // Relative X coordinate within the block
      staffLine: staffLine,
      y: staffStartY + (staffLine * this.staffLineHeight), // Relative Y coordinate within the block
      note: this.noteNames[staffLine],
      selected: false,
      length: currentLength.value, // Note length in beats
      width: currentLength.pixels, // Visual width in pixels
      glowIntensity: 0, // For glow effect when triggered
      lastPlayTime: null, // For preventing double triggers
      blockId: block.id // Reference to parent block
    };
    
    console.log('Placing note in expanded block:', note, 'Block:', block.name);
    
    block.notes.push(note);
    this.render();
    
    // Trigger audio preview
    this.playNotePreview(note);
  }

  findNoteAtInExpandedBlock(relativeX, relativeY, block) {
    return block.notes.find(note => {
      return Math.abs(note.x - relativeX) < 15 && Math.abs(note.y - relativeY) < 15;
    });
  }

  findNoteAtInBlock(x, y, block) {
    return block.notes.find(note => {
      return Math.abs(note.x - x) < 15 && Math.abs(note.y - y) < 15;
    });
  }
  
  selectNote(note) {
    this.selectedNotes = [note];
    
    // Clear all selections first
    this.blocks.forEach(block => {
      block.notes.forEach(n => n.selected = false);
    });
    
    // Select the clicked note
    note.selected = true;
    this.render();
  }
  
  togglePlayback() {
    if (this.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  }
  
  play() {
    this.isPlaying = true;
    this.updatePlaybackSpeed(); // Update speed based on current BPM
    this.globalStartTime = Date.now();
    
    // Start all unmuted blocks
    this.blocks.forEach(block => {
      if (!block.isMuted) {
        block.isPlaying = true;
        block.startTime = this.globalStartTime;
        block.playbackPosition = 0;
      }
    });
    
    this.playBtn.innerHTML = '⏸️';
    this.animatePlayback();
  }
  
  pause() {
    this.isPlaying = false;
    this.blocks.forEach(block => {
      block.isPlaying = false;
    });
    this.playBtn.innerHTML = '▶️';
  }
  
  stop() {
    this.isPlaying = false;
    this.blocks.forEach(block => {
      block.isPlaying = false;
      block.playbackPosition = 0;
      block.notes.forEach(note => {
        note.lastPlayTime = null;
        note.glowIntensity = 0;
      });
    });
    this.playBtn.innerHTML = '▶️';
    this.render();
  }
  
  animatePlayback() {
    if (!this.isPlaying) return;
    
    // Update playback speed if BPM changed
    this.updatePlaybackSpeed();
    
    const elapsed = (Date.now() - this.globalStartTime) / 1000;
    
    // Update each block's playback position
    this.blocks.forEach(block => {
      if (block.isPlaying && !block.isMuted) {
        const blockElapsed = elapsed * this.playbackSpeed;
        block.playbackPosition = blockElapsed % block.width; // Loop within block
        
        // Check for notes to play in this block
        this.checkNotesToPlayInBlock(block);
      }
    });
    
    // Auto-scroll to follow the longest playing block
    const maxPosition = Math.max(...this.blocks.map(b => b.playbackPosition || 0));
    if (maxPosition - this.scrollX > this.viewWidth * 0.8) {
      this.scrollX = Math.min(this.totalWidth - this.viewWidth, maxPosition - this.viewWidth * 0.2);
    }
    
    this.render();
    requestAnimationFrame(() => this.animatePlayback());
  }
  
  checkNotesToPlayInBlock(block) {
    const tolerance = this.playbackSpeed * 0.016; // ~1 frame tolerance
    
    block.notes.forEach(note => {
      if (!note.lastPlayTime && Math.abs(note.x - block.playbackPosition) < tolerance) {
        this.playNote(note);
        note.lastPlayTime = Date.now();
        note.glowIntensity = 1.0; // Start glow effect
      } else if (note.lastPlayTime && Math.abs(note.x - block.playbackPosition) > tolerance * 2) {
        note.lastPlayTime = null; // Reset for next loop
      }
      
      // Update glow effect - fade out over time
      if (note.glowIntensity > 0) {
        note.glowIntensity = Math.max(0, note.glowIntensity - 0.05);
      }
    });
  }
  
  playNote(note) {
    // Create a temporary node and trigger it
    try {
      if (typeof window.triggerNodeEffect === 'function' && typeof window.createAudioNodesForNode === 'function') {
        // Create a complete sound node structure
        const tempNode = {
          id: 'staff_temp_' + Date.now(),
          type: 'sound',
          x: note.x,
          y: note.y,
          size: 1,
          audioParams: {
            engine: this.currentInstrument.engine,
            waveform: this.currentInstrument.waveform,
            baseNote: note.note,
            pitch: this.noteToFrequency(note.note),
            scaleIndex: note.staffLine,
            volume: 1.0,
            // Add basic default parameters for pulse engine
            duty: 0.5,
            ampEnvAttack: 0.01,
            ampEnvDecay: 0.1,
            ampEnvSustain: 0.7,
            ampEnvRelease: 0.3,
            reverbSend: 0.1,
            delaySend: 0.05
          },
          audioNodes: null
        };
        
        // Create audio nodes
        tempNode.audioNodes = window.createAudioNodesForNode(tempNode);
        
        if (tempNode.audioNodes) {
          window.triggerNodeEffect(tempNode, { 
            intensity: 1.0, 
            color: '#ff0000',
            fromStaff: true 
          });
        }
      }
    } catch (error) {
      console.warn('Error playing staff note:', error);
    }
  }
  
  playNotePreview(note) {
    this.playNote(note);
  }
  
  noteToFrequency(noteName) {
    // Convert note names like C4, A4, etc. to frequency
    const noteMap = {
      'C': -9, 'C#': -8, 'Db': -8, 'D': -7, 'D#': -6, 'Eb': -6, 
      'E': -5, 'F': -4, 'F#': -3, 'Gb': -3, 'G': -2, 'G#': -1, 'Ab': -1, 
      'A': 0, 'A#': 1, 'Bb': 1, 'B': 2
    };
    
    const match = noteName.match(/^([A-G][#b]?)(\d+)$/);
    if (!match) return 440; // Default to A4
    
    const [, note, octave] = match;
    const octaveNum = parseInt(octave);
    const semitonesFromA4 = noteMap[note] + (octaveNum - 4) * 12;
    
    return 440 * Math.pow(2, semitonesFromA4 / 12);
  }
  
  updatePlaybackSpeed() {
    if (!this.bpmSyncEnabled) return;
    
    // Get global BPM from window
    const currentBPM = (typeof window.globalBPM === 'number' && window.globalBPM > 0) ? window.globalBPM : 120;
    
    if (currentBPM !== this.lastKnownBPM) {
      // Update playback speed based on BPM
      // At 120 BPM, we want the default speed. Scale proportionally.
      const baseBPM = 120;
      const baseSpeed = 100; // pixels per second at 120 BPM
      this.playbackSpeed = baseSpeed * (currentBPM / baseBPM);
      this.lastKnownBPM = currentBPM;
      
      console.log(`Updated staff playback speed to ${this.playbackSpeed} px/s for BPM ${currentBPM}`);
    }
  }
  
  showNoteLengthMenu() {
    // Create note length selection menu
    const menu = document.createElement('div');
    menu.className = 'staff-note-length-menu';
    menu.style.position = 'absolute';
    menu.style.background = '#2a2a2a';
    menu.style.border = '1px solid #555';
    menu.style.borderRadius = '5px';
    menu.style.padding = '10px';
    menu.style.zIndex = '1000';
    menu.style.minWidth = '150px';
    
    // Position menu near the note length button
    const buttonRect = this.noteLengthBtn.getBoundingClientRect();
    menu.style.left = buttonRect.left + 'px';
    menu.style.top = (buttonRect.bottom + 5) + 'px';
    
    this.noteLengths.forEach((noteLength, index) => {
      const item = document.createElement('div');
      item.textContent = `${noteLength.name} Note`;
      item.style.padding = '5px';
      item.style.cursor = 'pointer';
      item.style.color = '#fff';
      item.style.borderRadius = '3px';
      
      if (index === this.currentNoteLengthIndex) {
        item.style.backgroundColor = '#4a4a4a';
      }
      
      item.addEventListener('mouseenter', () => {
        item.style.backgroundColor = '#3a3a3a';
      });
      
      item.addEventListener('mouseleave', () => {
        if (index !== this.currentNoteLengthIndex) {
          item.style.backgroundColor = 'transparent';
        } else {
          item.style.backgroundColor = '#4a4a4a';
        }
      });
      
      item.addEventListener('click', () => {
        this.currentNoteLengthIndex = index;
        this.noteLengthBtn.title = `Note Length: ${noteLength.name}`;
        document.body.removeChild(menu);
      });
      
      menu.appendChild(item);
    });
    
    // Close menu when clicking outside
    const closeMenu = (e) => {
      if (!menu.contains(e.target)) {
        document.body.removeChild(menu);
        document.removeEventListener('click', closeMenu);
      }
    };
    
    document.body.appendChild(menu);
    setTimeout(() => document.addEventListener('click', closeMenu), 0);
  }
  
  showInstrumentMenu() {
    // Create a simple instrument selection menu
    const menu = document.createElement('div');
    menu.className = 'staff-instrument-menu';
    menu.style.position = 'absolute';
    menu.style.background = '#2a2a2a';
    menu.style.border = '1px solid #555';
    menu.style.borderRadius = '5px';
    menu.style.padding = '10px';
    menu.style.zIndex = '1000';
    menu.style.minWidth = '200px';
    
    // Position menu near the instrument button
    const buttonRect = this.instrumentBtn.getBoundingClientRect();
    menu.style.left = buttonRect.left + 'px';
    menu.style.top = (buttonRect.bottom + 5) + 'px';
    
    const instruments = [
      { name: 'Pulse', engine: 'pulse', waveform: 'pulse', subtype: 'pulse' },
      { name: 'Sine Wave', engine: 'tone', waveform: 'sine', subtype: 'sine' },
      { name: 'Square Wave', engine: 'tone', waveform: 'square', subtype: 'square' },
      { name: 'Sawtooth', engine: 'tone', waveform: 'sawtooth', subtype: 'sawtooth' },
      { name: 'Triangle', engine: 'tone', waveform: 'triangle', subtype: 'triangle' }
    ];
    
    instruments.forEach(instrument => {
      const item = document.createElement('div');
      item.textContent = instrument.name;
      item.style.padding = '5px';
      item.style.cursor = 'pointer';
      item.style.color = '#fff';
      item.style.borderRadius = '3px';
      
      if (this.currentInstrument.engine === instrument.engine && 
          this.currentInstrument.waveform === instrument.waveform) {
        item.style.backgroundColor = '#4a4a4a';
      }
      
      item.addEventListener('mouseenter', () => {
        item.style.backgroundColor = '#3a3a3a';
      });
      
      item.addEventListener('mouseleave', () => {
        if (!(this.currentInstrument.engine === instrument.engine && 
              this.currentInstrument.waveform === instrument.waveform)) {
          item.style.backgroundColor = 'transparent';
        } else {
          item.style.backgroundColor = '#4a4a4a';
        }
      });
      
      item.addEventListener('click', () => {
        this.currentInstrument = instrument;
        this.instrumentBtn.title = `Instrument: ${instrument.name}`;
        document.body.removeChild(menu);
      });
      
      menu.appendChild(item);
    });
    
    // Close menu when clicking outside
    const closeMenu = (e) => {
      if (!menu.contains(e.target)) {
        document.body.removeChild(menu);
        document.removeEventListener('click', closeMenu);
      }
    };
    
    document.body.appendChild(menu);
    setTimeout(() => document.addEventListener('click', closeMenu), 0);
  }

  showAddBlockMenu() {
    const menu = document.createElement('div');
    menu.className = 'staff-add-block-menu';
    menu.style.position = 'absolute';
    menu.style.background = '#2a2a2a';
    menu.style.border = '1px solid #555';
    menu.style.borderRadius = '5px';
    menu.style.padding = '10px';
    menu.style.zIndex = '1000';
    menu.style.minWidth = '200px';
    
    const buttonRect = this.addBlockBtn.getBoundingClientRect();
    menu.style.left = buttonRect.left + 'px';
    menu.style.top = (buttonRect.bottom + 5) + 'px';
    
    const lengths = [2, 4, 8, 16];
    lengths.forEach(length => {
      const item = document.createElement('div');
      item.textContent = `${length} Measure Block`;
      item.style.padding = '5px';
      item.style.cursor = 'pointer';
      item.style.color = '#fff';
      item.style.borderRadius = '3px';
      
      item.addEventListener('mouseenter', () => item.style.backgroundColor = '#3a3a3a');
      item.addEventListener('mouseleave', () => item.style.backgroundColor = 'transparent');
      
      item.addEventListener('click', () => {
        const newBlock = this.createBlock(length);
        this.placeBlockOnGrid(newBlock);
        this.render();
        document.body.removeChild(menu);
      });
      
      menu.appendChild(item);
    });
    
    const closeMenu = (e) => {
      if (!menu.contains(e.target)) {
        document.body.removeChild(menu);
        document.removeEventListener('click', closeMenu);
      }
    };
    
    document.body.appendChild(menu);
    setTimeout(() => document.addEventListener('click', closeMenu), 0);
  }

  showBlockManager() {
    const menu = document.createElement('div');
    menu.className = 'staff-block-manager';
    menu.style.position = 'absolute';
    menu.style.background = '#2a2a2a';
    menu.style.border = '1px solid #555';
    menu.style.borderRadius = '5px';
    menu.style.padding = '10px';
    menu.style.zIndex = '1000';
    menu.style.minWidth = '300px';
    menu.style.maxHeight = '400px';
    menu.style.overflowY = 'auto';
    
    const buttonRect = this.blockSelectBtn.getBoundingClientRect();
    menu.style.left = buttonRect.left + 'px';
    menu.style.top = (buttonRect.bottom + 5) + 'px';
    
    this.blocks.forEach((block, index) => {
      const blockItem = document.createElement('div');
      blockItem.style.display = 'flex';
      blockItem.style.alignItems = 'center';
      blockItem.style.padding = '8px';
      blockItem.style.margin = '2px 0';
      blockItem.style.border = '1px solid #444';
      blockItem.style.borderRadius = '3px';
      blockItem.style.backgroundColor = this.currentBlockId === block.id ? '#4a4a4a' : 'transparent';
      
      // Block color indicator
      const colorIndicator = document.createElement('div');
      colorIndicator.style.width = '12px';
      colorIndicator.style.height = '12px';
      colorIndicator.style.backgroundColor = block.color;
      colorIndicator.style.borderRadius = '50%';
      colorIndicator.style.marginRight = '8px';
      
      // Block name
      const nameSpan = document.createElement('span');
      nameSpan.textContent = block.name;
      nameSpan.style.color = '#fff';
      nameSpan.style.flex = '1';
      nameSpan.style.cursor = 'pointer';
      nameSpan.addEventListener('click', () => {
        this.currentBlockId = block.id;
        this.render();
        document.body.removeChild(menu);
      });
      
      // Mute button
      const muteBtn = document.createElement('button');
      muteBtn.innerHTML = block.isMuted ? '🔇' : '🔊';
      muteBtn.style.marginLeft = '8px';
      muteBtn.style.background = 'none';
      muteBtn.style.border = 'none';
      muteBtn.style.cursor = 'pointer';
      muteBtn.addEventListener('click', () => {
        block.isMuted = !block.isMuted;
        muteBtn.innerHTML = block.isMuted ? '🔇' : '🔊';
      });
      
      // Length controls
      const lengthControl = document.createElement('select');
      lengthControl.style.marginLeft = '8px';
      lengthControl.style.background = '#1a1a1a';
      lengthControl.style.color = '#fff';
      lengthControl.style.border = '1px solid #555';
      [2, 4, 8, 16].forEach(length => {
        const option = document.createElement('option');
        option.value = length;
        option.textContent = `${length}m`;
        option.selected = block.length === length;
        lengthControl.appendChild(option);
      });
      lengthControl.addEventListener('change', () => {
        block.length = parseInt(lengthControl.value);
        block.width = block.length * this.measureWidth;
      });
      
      blockItem.appendChild(colorIndicator);
      blockItem.appendChild(nameSpan);
      blockItem.appendChild(muteBtn);
      blockItem.appendChild(lengthControl);
      menu.appendChild(blockItem);
    });
    
    const closeMenu = (e) => {
      if (!menu.contains(e.target)) {
        document.body.removeChild(menu);
        document.removeEventListener('click', closeMenu);
      }
    };
    
    document.body.appendChild(menu);
    setTimeout(() => document.addEventListener('click', closeMenu), 0);
  }
  
  render() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Draw grid
    this.drawGrid();
    
    // Draw collapsed blocks on grid
    this.blocks.forEach(block => {
      if (!block.isExpanded) {
        this.drawCollapsedBlock(block);
      }
    });
    
    // Draw expanded block overlay if any
    if (this.expandedBlockId) {
      this.drawExpandedBlockOverlay();
    }
  }
  
  drawGrid() {
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    this.ctx.lineWidth = 1;
    
    const gridOffsetY = 60; // Offset for toolbar
    
    // Draw vertical grid lines
    for (let col = 0; col <= this.gridCols; col++) {
      const x = col * (this.gridCellSize + this.gridPadding) - this.scrollX;
      if (x >= -this.gridPadding && x <= this.canvas.width + this.gridPadding) {
        this.ctx.beginPath();
        this.ctx.moveTo(x, gridOffsetY);
        this.ctx.lineTo(x, gridOffsetY + this.gridRows * (this.gridCellSize + this.gridPadding));
        this.ctx.stroke();
      }
    }
    
    // Draw horizontal grid lines
    for (let row = 0; row <= this.gridRows; row++) {
      const y = gridOffsetY + row * (this.gridCellSize + this.gridPadding);
      if (y >= gridOffsetY - this.gridPadding && y <= this.canvas.height + this.gridPadding) {
        this.ctx.beginPath();
        this.ctx.moveTo(-this.scrollX, y);
        this.ctx.lineTo(this.gridCols * (this.gridCellSize + this.gridPadding) - this.scrollX, y);
        this.ctx.stroke();
      }
    }
  }
  
  drawCollapsedBlock(block) {
    const x = block.x - this.scrollX;
    const y = block.y;
    
    if (x + block.width < 0 || x > this.canvas.width) return; // Outside view
    
    // Draw block background
    this.ctx.fillStyle = block.color + '40'; // Semi-transparent
    this.ctx.fillRect(x, y, block.width, block.height);
    
    // Draw block border
    this.ctx.strokeStyle = block.color;
    this.ctx.lineWidth = block.id === this.currentBlockId ? 3 : 2;
    this.ctx.strokeRect(x, y, block.width, block.height);
    
    // Draw block name
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = '12px monospace';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(block.name, x + block.width/2, y + 20);
    
    // Draw note count
    this.ctx.font = '10px monospace';
    this.ctx.fillText(`${block.notes.length} notes`, x + block.width/2, y + 35);
    
    // Draw length info
    this.ctx.fillText(`${block.length}m`, x + block.width/2, y + 50);
    
    // Draw mute indicator
    if (block.isMuted) {
      this.ctx.fillStyle = '#ff0000';
      this.ctx.fillText('MUTED', x + block.width/2, y + 65);
    }
    
    // Draw playhead if playing
    if (block.isPlaying && !block.isMuted) {
      const progress = (block.playbackPosition / block.width) * block.width;
      this.ctx.fillStyle = '#ff0000';
      this.ctx.fillRect(x + progress - 1, y, 2, block.height);
    }
    
    // Draw simple waveform representation of notes
    this.drawMiniWaveform(block, x, y);
  }
  
  drawMiniWaveform(block, blockX, blockY) {
    if (block.notes.length === 0) return;
    
    this.ctx.strokeStyle = '#ffffff';
    this.ctx.lineWidth = 1;
    
    const waveY = blockY + block.height - 20;
    const waveHeight = 10;
    
    block.notes.forEach(note => {
      const noteX = blockX + (note.x / block.width) * block.width;
      const noteHeight = waveHeight * (1 - note.staffLine / this.staffCount);
      
      this.ctx.beginPath();
      this.ctx.moveTo(noteX, waveY);
      this.ctx.lineTo(noteX, waveY - noteHeight);
      this.ctx.stroke();
    });
  }
  
  drawExpandedBlockOverlay() {
    const expandedBlock = this.blocks.find(b => b.id === this.expandedBlockId);
    if (!expandedBlock) return;
    
    // Draw semi-transparent background
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Calculate expanded block position (centered)
    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;
    const expandedX = centerX - this.expandedBlockSize.width / 2;
    const expandedY = centerY - this.expandedBlockSize.height / 2;
    
    // Draw expanded block background
    this.ctx.fillStyle = '#2a2a2a';
    this.ctx.fillRect(expandedX, expandedY, this.expandedBlockSize.width, this.expandedBlockSize.height);
    
    // Draw expanded block border
    this.ctx.strokeStyle = expandedBlock.color;
    this.ctx.lineWidth = 3;
    this.ctx.strokeRect(expandedX, expandedY, this.expandedBlockSize.width, this.expandedBlockSize.height);
    
    // Draw close button
    this.ctx.fillStyle = '#ff0000';
    this.ctx.fillRect(expandedX + this.expandedBlockSize.width - 30, expandedY + 5, 25, 25);
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = '16px monospace';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('×', expandedX + this.expandedBlockSize.width - 17, expandedY + 22);
    
    // Draw block title
    this.ctx.fillStyle = expandedBlock.color;
    this.ctx.font = '18px monospace';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(`${expandedBlock.name} (${expandedBlock.length} measures)`, expandedX + 20, expandedY + 25);
    
    // Draw staff lines within expanded block
    this.drawStaffInExpandedBlock(expandedBlock, expandedX, expandedY);
    
    // Draw measure lines within expanded block
    this.drawMeasureLinesInExpandedBlock(expandedBlock, expandedX, expandedY);
    
    // Draw notes within expanded block
    this.drawNotesInExpandedBlock(expandedBlock, expandedX, expandedY);
    
    // Draw playhead in expanded block
    if (expandedBlock.isPlaying && !expandedBlock.isMuted) {
      this.drawPlayheadInExpandedBlock(expandedBlock, expandedX, expandedY);
    }
  }
  
  drawStaffInExpandedBlock(block, blockX, blockY) {
    const staffStartY = 60;
    const staffWidth = this.expandedBlockSize.width - 100; // Leave margin
    
    // Draw staff lines
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    this.ctx.lineWidth = 1;
    
    for (let i = 0; i < this.staffCount; i++) {
      const y = blockY + staffStartY + (i * this.staffLineHeight);
      this.ctx.beginPath();
      this.ctx.moveTo(blockX + 80, y);
      this.ctx.lineTo(blockX + 80 + staffWidth, y);
      this.ctx.stroke();
    }
    
    // Draw note names
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    this.ctx.font = '12px monospace';
    this.ctx.textAlign = 'right';
    
    for (let i = 0; i < this.staffCount; i++) {
      const y = blockY + staffStartY + (i * this.staffLineHeight) + 4;
      this.ctx.fillText(this.noteNames[i], blockX + 75, y);
    }
  }
  
  drawMeasureLinesInExpandedBlock(block, blockX, blockY) {
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    this.ctx.lineWidth = 1;
    
    const staffStartX = 80;
    const staffWidth = this.expandedBlockSize.width - 100;
    const measureWidth = staffWidth / block.length;
    
    for (let i = 0; i <= block.length; i++) {
      const x = blockX + staffStartX + (i * measureWidth);
      
      this.ctx.beginPath();
      this.ctx.moveTo(x, blockY + 50);
      this.ctx.lineTo(x, blockY + 50 + (this.staffCount * this.staffLineHeight) + 20);
      this.ctx.stroke();
      
      // Measure numbers
      if (i < block.length) {
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        this.ctx.font = '10px monospace';
        this.ctx.textAlign = 'left';
        this.ctx.fillText((i + 1).toString(), x + 2, blockY + 48);
      }
    }
  }
  
  drawNotesInExpandedBlock(block, blockX, blockY) {
    const staffStartX = 80;
    const staffStartY = 60;
    
    block.notes.forEach(note => {
      const x = blockX + staffStartX + note.x;
      const y = blockY + note.y;
      
      // Draw note length as a horizontal bar
      const noteWidth = note.width || 25;
      
      // Base color
      let fillColor = note.selected ? '#ffff00' : '#00ff88';
      
      // Apply glow effect if note is glowing
      if (note.glowIntensity > 0) {
        this.ctx.save();
        this.ctx.shadowColor = fillColor;
        this.ctx.shadowBlur = 15 * note.glowIntensity;
        this.ctx.shadowOffsetX = 0;
        this.ctx.shadowOffsetY = 0;
        
        // Make note brighter when glowing
        const glowAlpha = 0.5 + (note.glowIntensity * 0.5);
        if (fillColor === '#00ff88') {
          this.ctx.fillStyle = `rgba(0, 255, 136, ${glowAlpha})`;
        } else {
          this.ctx.fillStyle = `rgba(255, 255, 0, ${glowAlpha})`;
        }
      } else {
        this.ctx.fillStyle = fillColor;
      }
      
      // Draw note length bar
      const barHeight = 6;
      this.ctx.fillRect(x - 2, y - barHeight/2, noteWidth, barHeight);
      
      // Draw note circle
      this.ctx.beginPath();
      this.ctx.arc(x, y, 8, 0, Math.PI * 2);
      this.ctx.fill();
      
      if (note.glowIntensity > 0) {
        this.ctx.restore();
      }
      
      // Draw selection outline
      if (note.selected) {
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.arc(x, y, 10, 0, Math.PI * 2);
        this.ctx.stroke();
      }
    });
  }
  
  drawPlayheadInExpandedBlock(block, blockX, blockY) {
    const staffStartX = 80;
    const staffWidth = this.expandedBlockSize.width - 100;
    const progress = block.playbackPosition / block.width; // 0 to 1
    const x = blockX + staffStartX + (progress * staffWidth);
    
    this.ctx.strokeStyle = '#ff0000';
    this.ctx.lineWidth = 3;
    this.ctx.beginPath();
    this.ctx.moveTo(x, blockY + 50);
    this.ctx.lineTo(x, blockY + 50 + (this.staffCount * this.staffLineHeight) + 20);
    this.ctx.stroke();
    
    // Add glow effect
    this.ctx.save();
    this.ctx.shadowColor = 'rgba(255, 0, 0, 0.7)';
    this.ctx.shadowBlur = 8;
    this.ctx.stroke();
    this.ctx.restore();
  }
  
  
  show() {
    this.isActive = true;
    this.staffContainer.style.display = 'block';
    
    // Hide the main edit toolbar
    const editToolbar = document.getElementById('toolbar');
    if (editToolbar) {
      this.previousToolbarDisplay = editToolbar.style.display;
      editToolbar.style.display = 'none';
    }
    
    // Resize canvas after showing and then render
    setTimeout(() => {
      this.resizeCanvas();
    }, 0);
  }
  
  hide() {
    this.isActive = false;
    this.staffContainer.style.display = 'none';
    this.pause();
    
    // Restore the main edit toolbar
    const editToolbar = document.getElementById('toolbar');
    if (editToolbar && this.previousToolbarDisplay !== undefined) {
      editToolbar.style.display = this.previousToolbarDisplay;
    }
  }
  
  destroy() {
    this.hide();
    this.container.removeChild(this.staffContainer);
  }
}