import fs from 'fs';
import path from 'path';
import http from 'http';
import https from 'https';
import WebSocket, { WebSocketServer } from 'ws';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let config = {};
try {
  const configPath = path.join(__dirname, 'server-config.json');
  if (fs.existsSync(configPath)) {
    config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  }
} catch (e) {
  console.warn('Failed to load server-config.json:', e);
}
const useTLS = process.env.WSS ? process.env.WSS === '1' : !!config.wss;
const defaultPort = useTLS ? 443 : 80;
const port = process.env.PORT || config.port || defaultPort;
const host = process.env.HOST || config.host || 'localhost';
try {
  const publicCfgPath = path.join(__dirname, 'public', 'config.json');
  const clientCfg = { port, wss: useTLS, host };
  fs.writeFileSync(publicCfgPath, JSON.stringify(clientCfg, null, 2));
} catch (e) {
  console.warn('Failed to write public/config.json:', e);
}
let server;
// Determine if clients should connect via ws:// or wss://.
let protocol = useTLS ? 'wss' : 'ws';
if (useTLS) {
  // When WSS=1, read certificate and key files for HTTPS
  const certPath = process.env.SSL_CERT || config.ssl_cert || 'cert.pem';
  const keyPath = process.env.SSL_KEY || config.ssl_key || 'key.pem';
  if (!fs.existsSync(certPath) || !fs.existsSync(keyPath)) {
    console.log(
      'WSS enabled but SSL_CERT/SSL_KEY not found. Running HTTP server and expecting TLS termination upstream.'
    );
    server = http.createServer();
  } else {
    const cert = fs.readFileSync(certPath);
    const key = fs.readFileSync(keyPath);
    server = https.createServer({ cert, key });
  }
} else {
  server = http.createServer();
}
const wss = new WebSocketServer({ server });
server.listen(port);
// Predefined rooms that users can join. Each room has space for two
// participants. The client displays the current occupancy as "name (0/2)" etc.
// A room is considered full when it reaches two members.
const ROOM_NAMES = ['Ursa Major', 'Telescopium', 'Hercules', 'Aquarius'];
const rooms = {}; // {roomName: Map<ws, name>}
const roomStates = {}; // {roomName: { state: object, version: number }}
ROOM_NAMES.forEach(name => {
  rooms[name] = new Map();
  roomStates[name] = { state: null, version: 0 };
});

function broadcast(room, message) {
  if (!rooms[room]) return;
  for (const [client] of rooms[room]) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  }
}

wss.on('connection', (ws) => {
  // send list of available rooms on new connection
  ws.send(
    JSON.stringify({
      type: 'rooms',
      rooms: ROOM_NAMES.map(r => ({ name: r, count: rooms[r].size }))
    })
  );

  let room = null;
  let name = null;
  ws.on('message', (msg) => {
    let data;
    try {
      data = JSON.parse(msg);
    } catch (e) {
      return;
    }
    if (data.type === 'join') {
      room = String(data.room);
      name = data.name;
      if (!ROOM_NAMES.includes(room)) {
        ws.send(JSON.stringify({ type: 'error', message: 'Invalid room' }));
        return;
      }
      if (rooms[room].size >= 2) {
        ws.send(JSON.stringify({ type: 'full', room }));
        return;
      }
      rooms[room].set(ws, name);
      ws.send(
        JSON.stringify({ type: 'playerList', players: Array.from(rooms[room].values()) })
      );
      if (roomStates[room].state) {
        ws.send(
          JSON.stringify({
            type: 'stateUpdate',
            state: JSON.stringify(roomStates[room].state),
            version: roomStates[room].version,
            name: 'server'
          })
        );
      }
      broadcast(room, JSON.stringify({ type: 'join', name }));
      return;
    }
    if (!room) return;
    if (data.type === 'move') {
      broadcast(room, JSON.stringify({ type: 'move', name, x: data.x, y: data.y }));
    } else if (data.type === 'stateUpdate') {
      let parsed;
      try {
        parsed = JSON.parse(data.state);
      } catch {
        return;
      }
      if (typeof data.version !== 'number' || data.version !== roomStates[room].version) {
        ws.send(
          JSON.stringify({
            type: 'stateUpdate',
            state: JSON.stringify(roomStates[room].state),
            version: roomStates[room].version,
            name: 'server'
          })
        );
        return;
      }
      roomStates[room].state = parsed;
      roomStates[room].version += 1;
      const msg = JSON.stringify({
        type: 'stateUpdate',
        state: data.state,
        version: roomStates[room].version,
        name: 'server'
      });
      broadcast(room, msg);
    } else if (data.type === 'tapeData') {
      broadcast(room, JSON.stringify({ type: 'tapeData', track: data.track, data: data.data, name }));
    } else if (data.type === 'chat') {
      broadcast(room, JSON.stringify({ type: 'chat', text: data.text, name }));
    } else if (data.type === 'pulse') {
      broadcast(room, JSON.stringify({ type: 'pulse', pulse: data.pulse, name }));
    }
  });

  ws.on('close', () => {
    if (room && rooms[room]) {
      rooms[room].delete(ws);
      broadcast(room, JSON.stringify({ type: 'leave', name }));
    }
  });
});

const standardPort = (!useTLS && port === 80) || (useTLS && port === 443);
const portSuffix = standardPort ? '' : `:${port}`;
console.log(`Multiplayer server running at ${protocol}://${host}${portSuffix}`);
