import fs from 'fs';
import path from 'path';
import http from 'http';
import https from 'https';
import { WebSocketServer } from 'ws';
import { applyWSSHandler } from '@trpc/server/adapters/ws';
import { initTRPC } from '@trpc/server';
import { z } from 'zod';
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
if (useTLS) {
  const certPath = process.env.SSL_CERT || config.ssl_cert || 'cert.pem';
  const keyPath = process.env.SSL_KEY || config.ssl_key || 'key.pem';
  if (!fs.existsSync(certPath) || !fs.existsSync(keyPath)) {
    console.log('WSS enabled but SSL_CERT/SSL_KEY not found. Running HTTP server expecting TLS termination upstream.');
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

const ROOM_NAMES = ['Ursa Major', 'Telescopium', 'Hercules', 'Aquarius'];
const rooms = {};
const roomStates = {};
ROOM_NAMES.forEach((n) => {
  rooms[n] = new Map();
  roomStates[n] = { state: null, version: 0 };
});

const t = initTRPC.create();
const router = t.router({
  rooms: t.procedure.query(() => ROOM_NAMES.map((r) => ({ name: r, count: rooms[r].size }))),
  join: t.procedure.input(z.object({ name: z.string(), room: z.string() })).mutation(({ input, ctx }) => {
    const { name, room } = input;
    if (!ROOM_NAMES.includes(room)) {
      return { error: 'Invalid room' };
    }
    if (rooms[room].size >= 2) {
      return { error: 'full' };
    }
    rooms[room].set(ctx.ws, name);
    if (roomStates[room].state) {
      ctx.ws.send(
        JSON.stringify({
          type: 'stateUpdate',
          state: JSON.stringify(roomStates[room].state),
          version: roomStates[room].version,
          name: 'server'
        })
      );
    }
    broadcast(room, JSON.stringify({ type: 'join', name }));
    return { players: Array.from(rooms[room].values()) };
  }),
  move: t.procedure.input(z.object({ room: z.string(), name: z.string(), x: z.number(), y: z.number() })).mutation(({ input }) => {
    const { room, name, x, y } = input;
    broadcast(room, JSON.stringify({ type: 'move', name, x, y }));
    return true;
  }),
  stateUpdate: t.procedure.input(z.object({ room: z.string(), name: z.string(), state: z.string() })).mutation(({ input, ctx }) => {
    const { room, state } = input;
    let parsed;
    try {
      parsed = JSON.parse(state);
    } catch {
      return false;
    }
    roomStates[room].state = parsed;
    roomStates[room].version += 1;
    const msg = JSON.stringify({
      type: 'stateUpdate',
      state,
      version: roomStates[room].version,
      name: 'server'
    });
    for (const [client] of rooms[room]) {
      if (client.readyState === 1) {
        client.send(msg);
      }
    }
    return true;
  }),
  chat: t.procedure.input(z.object({ room: z.string(), name: z.string(), text: z.string() })).mutation(({ input }) => {
    const { room, name, text } = input;
    broadcast(room, JSON.stringify({ type: 'chat', text, name }));
    return true;
  }),
});

function broadcast(room, message) {
  if (!rooms[room]) return;
  for (const [client] of rooms[room]) {
    if (client.readyState === 1) {
      client.send(message);
    }
  }
}

applyWSSHandler({ wss, router, createContext: ({ ws }) => ({ ws }) });

const protocol = useTLS ? 'wss' : 'ws';
const standardPort = (!useTLS && port === 80) || (useTLS && port === 443);
const portSuffix = standardPort ? '' : `:${port}`;
console.log(`tRPC server running at ${protocol}://${host}${portSuffix}`);
