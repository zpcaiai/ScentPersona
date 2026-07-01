// Standalone WebSocket server for self-hosted Node deployments.
// Clients subscribe with ?orderId=...; the Next.js payment webhook publishes
// events via POST /internal/publish (shared-secret). Run: npm run ws:server
import http from "node:http";
import { WebSocketServer } from "ws";

const PORT = process.env.WS_PORT ? Number(process.env.WS_PORT) : 3001;
const SECRET = process.env.WS_PUBLISH_SECRET || "";

/** orderId -> Set<WebSocket> */
const subs = new Map();

const server = http.createServer((req, res) => {
  if (req.method === "GET" && req.url === "/health") {
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify({ ok: true, orders: subs.size }));
    return;
  }
  if (req.method === "POST" && req.url === "/internal/publish") {
    if (!SECRET || req.headers["x-publish-secret"] !== SECRET) {
      res.writeHead(403); res.end("forbidden"); return;
    }
    let body = "";
    req.on("data", (c) => { body += c; if (body.length > 1e6) req.destroy(); });
    req.on("end", () => {
      try {
        const { orderId, event, data } = JSON.parse(body || "{}");
        if (!orderId || !event) { res.writeHead(400); res.end("bad"); return; }
        let delivered = 0;
        const set = subs.get(orderId);
        if (set) for (const ws of set) {
          if (ws.readyState === ws.OPEN) { ws.send(JSON.stringify({ event, data: data ?? {} })); delivered++; }
        }
        res.writeHead(200, { "content-type": "application/json" });
        res.end(JSON.stringify({ ok: true, delivered }));
      } catch { res.writeHead(400); res.end("bad json"); }
    });
    return;
  }
  res.writeHead(404); res.end("not found");
});

const wss = new WebSocketServer({ server });
wss.on("connection", (ws, req) => {
  const url = new URL(req.url || "/", "http://localhost");
  const orderId = url.searchParams.get("orderId");
  if (!orderId) { ws.close(); return; }
  if (!subs.has(orderId)) subs.set(orderId, new Set());
  subs.get(orderId).add(ws);
  ws.send(JSON.stringify({ event: "open", data: {} }));
  const ping = setInterval(() => { if (ws.readyState === ws.OPEN) ws.ping(); }, 30_000);
  ws.on("close", () => {
    clearInterval(ping);
    const s = subs.get(orderId);
    if (s) { s.delete(ws); if (!s.size) subs.delete(orderId); }
  });
  ws.on("error", () => {});
});

server.listen(PORT, () => console.log(`[ws] listening on :${PORT}`));
