// ====================================================
// Gostart Backend — Express + TypeScript + MongoDB
// ====================================================
// Run with:  npm run dev    (nodemon + ts-node, auto-restarts)
//            npm start      (ts-node, single run)
//
// SETUP:
//   1. Install MongoDB locally  OR  create a free cluster at mongodb.com/atlas
//   2. Set MONGO_URI in the .env file
//   3. npm run dev
//
// On first start, the DB seeds 5 profiles + the demo account automatically.
// Demo login: demo@gostart.app / demo123
// ====================================================

import 'dotenv/config';          // load .env before anything else
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { connectDB } from './db/connection';

import authRouter from './routes/auth';
import matchesRouter from './routes/matches';
import creditsRouter from './routes/credits';
import messagesRouter from './routes/messages';
import filtersRouter from './routes/filters';
import profilesRouter from './routes/profiles';

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;

// ── Middleware ─────────────────────────────────────────────────────────────────

app.use(cors({ origin: '*' }));
app.use(express.json());

// Log every request so you can see what the app is doing in the terminal
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

app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', app: 'Gostart API', version: '1.0.0', timestamp: new Date().toISOString() });
});

app.use((req: Request, res: Response) => {
  res.status(404).json({ success: false, message: `Route ${req.method} ${req.path} not found.` });
});

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ success: false, message: 'An unexpected error occurred.' });
});

// ── Start ──────────────────────────────────────────────────────────────────────
// Connect to MongoDB first, then start listening for requests.

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`\n🚀 Gostart API running on http://localhost:${PORT}`);
      console.log(`📋 Health check: http://localhost:${PORT}/api/health`);
      console.log(`\nDemo credentials: demo@gostart.app / demo123\n`);
    });
  })
  .catch((err: unknown) => {
    console.error('[FATAL] Could not connect to MongoDB:', err);
    process.exit(1);
  });
