// ====================================================
// Gostart Backend — Express + WebSocket (ws) + TypeScript + MongoDB
// ====================================================

import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import { connectDB } from './db/connection';
import { JWT_SECRET } from './middleware/auth';
import { Message } from './models/Message';
import { Conversation } from './models/Conversation';

import authRouter from './routes/auth';
import matchesRouter from './routes/matches';
import creditsRouter from './routes/credits';
import messagesRouter from './routes/messages';
import filtersRouter from './routes/filters';
import profilesRouter from './routes/profiles';

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;

// ── WebSocket server ───────────────────────────────────────────────────────────
// Mounted at /ws so it coexists with Express on the same port.
// Protocol (all messages are JSON):
//   client → server:  { type: 'auth', token }
//   client → server:  { type: 'join_chat', chatId }
//   client → server:  { type: 'send_message', chatId, conversationId, text }
//   server → client:  { type: 'auth_ok' } | { type: 'error', message }
//   server → client:  { type: 'new_message', id, senderId, text, timestamp }

const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

// chatId → set of open sockets in that room
const rooms = new Map<string, Set<WebSocket>>();
// socket → { userId, chatId? }
const meta  = new Map<WebSocket, { userId: string; chatId?: string }>();

function broadcast(chatId: string, payload: object) {
  const str = JSON.stringify(payload);
  rooms.get(chatId)?.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) client.send(str);
  });
}

wss.on('connection', (ws) => {
  ws.on('message', async (raw) => {
    let msg: Record<string, any>;
    try { msg = JSON.parse(raw.toString()); } catch { return; }

    if (msg.type === 'auth') {
      try {
        const decoded = jwt.verify(msg.token, JWT_SECRET) as { userId: string };
        meta.set(ws, { userId: decoded.userId });
        ws.send(JSON.stringify({ type: 'auth_ok' }));
      } catch {
        ws.send(JSON.stringify({ type: 'error', message: 'Invalid token' }));
      }
      return;
    }

    const info = meta.get(ws);
    if (!info) { ws.send(JSON.stringify({ type: 'error', message: 'Not authenticated' })); return; }

    if (msg.type === 'join_chat') {
      const chatId = msg.chatId as string;
      const conv = await Conversation.findOne({ userId: info.userId, chatId }).catch(() => null);
      if (!conv) { ws.send(JSON.stringify({ type: 'error', message: 'Not authorized for this chat' })); return; }

      // Leave old room
      if (info.chatId) rooms.get(info.chatId)?.delete(ws);

      // Join new room
      info.chatId = chatId;
      if (!rooms.has(chatId)) rooms.set(chatId, new Set());
      rooms.get(chatId)!.add(ws);
      return;
    }

    if (msg.type === 'send_message') {
      const { chatId, conversationId, text } = msg as { chatId: string; conversationId: string; text: string };
      if (!text?.trim()) return;

      const conv = await Conversation.findOne({ userId: info.userId, chatId }).catch(() => null);
      if (!conv) return;

      try {
        const saved = await Message.create({
          chatId, conversationId,
          senderId: info.userId,
          text: text.trim(),
          timestamp: new Date(),
        });
        broadcast(chatId, {
          type: 'new_message',
          id: String(saved._id),
          senderId: saved.senderId,
          text: saved.text,
          timestamp: saved.timestamp,
        });
      } catch (err) {
        console.error('[WS] send_message error:', err);
      }
    }
  });

  ws.on('close', () => {
    const info = meta.get(ws);
    if (info?.chatId) rooms.get(info.chatId)?.delete(ws);
    meta.delete(ws);
  });
});

// ── REST middleware ────────────────────────────────────────────────────────────

app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '15mb' }));
app.use((req: Request, _res: Response, next: NextFunction) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// ── Routes ─────────────────────────────────────────────────────────────────────

app.use('/api/auth', authRouter);
app.use('/api/matches', matchesRouter);
app.use('/api/credits', creditsRouter);
app.use('/api/messages', messagesRouter);
app.use('/api/filters', filtersRouter);
app.use('/api/profiles', profilesRouter);

app.get('/api/health', (_req, res) =>
  res.json({ status: 'ok', app: 'Gostart API', version: '1.0.0', timestamp: new Date().toISOString() }),
);

app.use((req: Request, res: Response) =>
  res.status(404).json({ success: false, message: `Route ${req.method} ${req.path} not found.` }),
);

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ success: false, message: 'An unexpected error occurred.' });
});

// ── Start ──────────────────────────────────────────────────────────────────────

connectDB()
  .then(() => {
    httpServer.listen(PORT, () => {
      console.log(`\n🚀 Gostart API  →  http://localhost:${PORT}`);
      console.log(`⚡ WebSocket     →  ws://localhost:${PORT}/ws`);
      console.log(`📋 Health check  →  http://localhost:${PORT}/api/health`);
      console.log(`\nDemo credentials: demo@gostart.app / demo123\n`);
    });
  })
  .catch((err) => {
    console.error('[FATAL] Could not connect to MongoDB:', err);
    process.exit(1);
  });
