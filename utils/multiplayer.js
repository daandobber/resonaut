import { roomSelect, playerList } from './domElements.js';
import { lerp } from '../mathUtils.js';

const scale = (v, x1, y1, x2, y2) => (v - x1) * (y2 - x2) / (y1 - x1) + x2;
const chatSettings = {
  minDistance: 14,
  resetTimer: 2000,
};

export let ws = null;
const remoteCursors = {}; // { name: {el, chatEl} }
export let localPlayerName = null;
export let pendingState = null;
export let pendingStateVersion = 0;
let lastStateVersion = 0;
export function getLocalStateVersion() {
  return lastStateVersion;
}
export function getPendingState() {
  return pendingState;
}
export function clearPendingState() {
  pendingState = null;
  pendingStateVersion = 0;
}
const playersInRoom = new Set();

const DEFAULT_ROOM_NAMES = ['Ursa Major', 'Telescopium', 'Hercules', 'Aquarius'];

function populateRoomOptions(roomData) {
  if (!roomSelect) return;
  roomSelect.innerHTML = '';
  roomData.forEach((r) => {
    const opt = document.createElement('option');
    if (typeof r === 'string') {
      opt.value = r;
      opt.textContent = `${r} (0/2)`;
    } else {
      opt.value = r.name;
      opt.textContent = `${r.name} (${r.count}/2)`;
      if (r.count >= 2) opt.disabled = true;
    }
    roomSelect.appendChild(opt);
  });
}

const configPromise = fetch('/config.json')
  .then((r) => r.json())
  .catch(() => ({}));

const featuresPromise = fetch('/multiplayer-features.json')
  .then((r) => r.json())
  .catch(() => ({}));

export async function getMultiplayerFeatures() {
  try {
    return await featuresPromise;
  } catch {
    return {};
  }
}

export async function fetchAvailableRooms() {
  if (!roomSelect) return;
  populateRoomOptions(DEFAULT_ROOM_NAMES);
  const cfg = await configPromise;
  const proto = cfg.wss ? 'wss' : location.protocol === 'https:' ? 'wss' : 'ws';
  const host = cfg.host || location.hostname;
  const defaultPort = proto === 'wss' ? 443 : 80;
  const port = cfg.port || defaultPort;
  const url = `${proto}://${host}:${port}`;
  const socket = new WebSocket(url);
  socket.addEventListener('message', (e) => {
    let data;
    try { data = JSON.parse(e.data); } catch { return; }
    if (data.type === 'rooms') {
      populateRoomOptions(data.rooms);
      socket.close();
    }
  });
  socket.addEventListener('error', () => {
    populateRoomOptions(DEFAULT_ROOM_NAMES);
  });
}

function updateRemoteCursor(name, x, y) {
  let obj = remoteCursors[name];
  if (!obj) {
    const el = document.createElement('div');
    el.className = 'remote-cursor';
    const nameDiv = document.createElement('div');
    nameDiv.className = 'remote-name';
    nameDiv.textContent = name;
    const chatDiv = document.createElement('div');
    chatDiv.className = 'remote-chat';
    el.appendChild(nameDiv);
    el.appendChild(chatDiv);
    document.getElementById('cursorLayer').appendChild(el);
    obj = {
      el,
      chatEl: chatDiv,
      chain: [],
      mouse: { x: 0, y: 0 },
      time: 0,
      lastMoveTime: 0,
    };
    remoteCursors[name] = obj;
  }
  obj.mouse.x = x;
  obj.mouse.y = y;
  obj.lastMoveTime = Date.now();
  obj.el.style.left = x + 'px';
  obj.el.style.top = y + 'px';
}

function updateRemoteChat(name, text) {
  let obj = remoteCursors[name];
  if (!obj) {
    updateRemoteCursor(name, 0, 0);
    obj = remoteCursors[name];
  }
  if (obj.chatEl) {
    const t = text || '';
    obj.chatEl.innerHTML = '';
    obj.chain = [];
    t.split('').forEach((ch, i) => {
      const span = document.createElement('span');
      span.textContent = ch;
      span.style.position = 'absolute';
      span.style.left = '0';
      span.style.top = '0';
      obj.chatEl.appendChild(span);
      obj.chain.push({ el: span, x: obj.mouse.x, y: obj.mouse.y });
    });
  }
}

function animateChats() {
  if (typeof requestAnimationFrame === 'function') {
    requestAnimationFrame(animateChats);
  } else {
    setTimeout(animateChats, 16);
  }
  const now = Date.now();
  Object.values(remoteCursors).forEach((obj) => {
    if (!obj.chain) return;
    obj.time += 0.1;
    const moving = now - obj.lastMoveTime < chatSettings.resetTimer;
    obj.chain.forEach((link, index) => {
      if (index === 0) {
        link.x = obj.mouse.x;
        link.y = obj.mouse.y;
      }
      if (moving) {
        if (index > 0) {
          const prevLink = obj.chain[index - 1];
          const dx = link.x - prevLink.x;
          const dy = link.y - prevLink.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          if (distance > chatSettings.minDistance) {
            const ratio = chatSettings.minDistance / distance;
            link.x = lerp(link.x, prevLink.x + dx * ratio, 0.4);
            link.y = lerp(link.y, prevLink.y + dy * ratio, 0.4);
          }
        }
      } else {
        const theta = scale(index, 0, obj.chain.length, 0.3, 0.06);
        link.x = lerp(link.x, obj.mouse.x - (index + 1) * chatSettings.minDistance, theta);
        link.y = lerp(
          link.y,
          obj.mouse.y + Math.sin(obj.time * 0.3 + index * 0.5) * 3,
          theta
        );
      }
      link.el.style.transform = `translate(${link.x - obj.mouse.x}px, ${link.y - obj.mouse.y}px)`;
    });
  });
}

animateChats();

function removeRemoteCursor(name) {
  const obj = remoteCursors[name];
  if (obj && obj.el) {
    obj.el.remove();
    delete remoteCursors[name];
  }
}

function updatePlayerListDisplay() {
  if (!playerList) return;
  playerList.innerHTML = Array.from(playersInRoom)
    .map((n) => `<div>${n}</div>`)
    .join('');
}

export async function connectMultiplayer(name, room, loadStateCallback, tapeDataCallback = null) {
  localPlayerName = name;
  playersInRoom.clear();
  playersInRoom.add(name);
  updatePlayerListDisplay();
  lastStateVersion = 0;

  const cfg = await configPromise;
  const proto = cfg.wss ? 'wss' : location.protocol === 'https:' ? 'wss' : 'ws';
  const host = cfg.host || location.hostname;
  const defaultPort = proto === 'wss' ? 443 : 80;
  const port = cfg.port || defaultPort;
  const url = `${proto}://${host}:${port}`;
  ws = new WebSocket(url);
  ws.addEventListener('open', () => {
    ws.send(JSON.stringify({ type: 'join', name, room }));
  });
  ws.addEventListener('message', (e) => {
    let data;
    try { data = JSON.parse(e.data); } catch { return; }
    if (data.type === 'move') {
      updateRemoteCursor(
        data.name,
        data.x * window.innerWidth,
        data.y * window.innerHeight
      );
    } else if (data.type === 'leave') {
      removeRemoteCursor(data.name);
      playersInRoom.delete(data.name);
      updatePlayerListDisplay();
    } else if (data.type === 'join') {
      if (data.name !== localPlayerName) {
        playersInRoom.add(data.name);
        updatePlayerListDisplay();
      }
    } else if (data.type === 'playerList') {
      playersInRoom.clear();
      data.players.forEach((p) => playersInRoom.add(p));
      updatePlayerListDisplay();
    } else if (data.type === 'stateUpdate') {
      if (typeof data.version === 'number' && data.version <= lastStateVersion) {
        return;
      }
      if (typeof data.version === 'number') {
        lastStateVersion = data.version;
      }
      if (data.state && loadStateCallback) {
        try {
          const parsed = JSON.parse(data.state);
          if (globalThis.isAudioReady) {
            loadStateCallback(parsed);
          } else {
            pendingState = parsed;
            pendingStateVersion = data.version ?? 0;
          }
        } catch (e) {
          console.warn('Failed to load shared state', e);
        }
      }
    } else if (data.type === 'tapeData') {
      if (data.name !== localPlayerName && tapeDataCallback) {
        tapeDataCallback(data);
      }
    } else if (data.type === 'chat') {
      if (data.name !== localPlayerName) {
        updateRemoteChat(data.name, data.text);
      }
    } else if (data.type === 'pulse') {
      if (data.name !== localPlayerName && globalThis.createVisualPulse && globalThis.propagateTrigger) {
        const p = data.pulse || {};
        const hops = p.hopsLeft === -1 ? Infinity : p.hopsLeft;
        const connection = (globalThis.connections || []).find(c => c.id === p.connectionId);
        if (connection) {
          const targetNodeId = connection.nodeAId === p.startNodeId ? connection.nodeBId : connection.nodeAId;
          const targetNode = (globalThis.nodes || []).find(n => n.id === targetNodeId);
          globalThis.currentGlobalPulseId = (globalThis.currentGlobalPulseId || 0) + 1;
          globalThis.createVisualPulse(p.connectionId, p.duration, p.startNodeId, hops, p.pulseType, p.color, p.intensity, false);
          if (targetNode) {
            globalThis.propagateTrigger(
              targetNode,
              p.duration,
              globalThis.currentGlobalPulseId,
              p.startNodeId,
              hops,
              { type: p.pulseType, data: { intensity: p.intensity, color: p.color } },
              connection
            );
          }
        }
      }
    }
  });
}

export function sendCursorPosition(e) {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(
      JSON.stringify({
        type: 'move',
        x: e.clientX / window.innerWidth,
        y: e.clientY / window.innerHeight,
      })
    );
  }
}

export function sendChatMessage(text) {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(
      JSON.stringify({
        type: 'chat',
        text: text || '',
      })
    );
    updateRemoteChat(localPlayerName, text);
  }
}

export function sendPulse(pulse) {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(
      JSON.stringify({
        type: 'pulse',
        name: localPlayerName,
        pulse,
      })
    );
  }
}
