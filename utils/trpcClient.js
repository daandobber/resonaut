import { createWSClient, createTRPCProxyClient, wsLink } from '@trpc/client';

const configPromise = fetch('/config.json').then(r => r.json()).catch(() => ({}));

let wsClient = null;
export let trpc = null;

export async function connectTRPC() {
  if (trpc) return trpc;
  const cfg = await configPromise;
  const proto = cfg.wss ? 'wss' : location.protocol === 'https:' ? 'wss' : 'ws';
  const host = cfg.host || location.hostname;
  const defaultPort = proto === 'wss' ? 443 : 80;
  const port = cfg.port || defaultPort;
  const url = `${proto}://${host}:${port}`;
  wsClient = createWSClient({ url });
  trpc = createTRPCProxyClient({
    links: [wsLink({ client: wsClient })],
  });
  return trpc;
}

export function closeTRPC() {
  wsClient?.close();
  wsClient = null;
  trpc = null;
}
