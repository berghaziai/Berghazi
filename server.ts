import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import http from 'http';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import multer from 'multer';
import dotenv from 'dotenv';
import { WebSocketServer } from 'ws';
import { initializeApp, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import type { DecodedIdToken } from 'firebase-admin/auth';
import {
  attachLiveWebSocketServer,
  generateLyriaMusic,
  generateOmniVideo,
  generateOrEditImage,
  generateSpeechClip,
  mapGeminiError,
  runChatTurn,
  transcribeAudioClip,
} from './src/server/gemini.ts';

dotenv.config();

const firebaseConfig = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), 'firebase-applet-config.json'), 'utf-8')
);

if (!getApps().length) {
  initializeApp({
    projectId: firebaseConfig.projectId,
  });
}

const adminAuth = getAuth();

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const ROOT_DIR = process.cwd();
const UPLOADS_DIR = path.join(ROOT_DIR, 'uploads');
const DATA_DIR = path.join(ROOT_DIR, 'data');
const ANALYTICS_FILE = path.join(DATA_DIR, 'analytics.json');
const CONTACTS_FILE = path.join(DATA_DIR, 'contacts.json');

fs.mkdirSync(UPLOADS_DIR, { recursive: true });
fs.mkdirSync(DATA_DIR, { recursive: true });

app.use(express.json({ limit: '15mb' }));

// ---------------------------------------------------------------------------
// Persistent Analytics & Contact Storage (Real Server-Side Counters)
// ---------------------------------------------------------------------------
interface AnalyticsStore {
  totalPageViews: number;
  daily: Record<string, { visitors: string[]; pageViews: number; adImpressions: number; downloads: number }>;
  pages: Record<string, number>;
  adSlots: Record<string, { impressions: number; clicks: number }>;
  resources: Record<string, { title: string; type: string; downloads: number }>;
}

interface ContactSubmission {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: 'unread' | 'read' | 'replied';
  createdAt: string;
}

function readAnalytics(): AnalyticsStore {
  try {
    if (fs.existsSync(ANALYTICS_FILE)) {
      return JSON.parse(fs.readFileSync(ANALYTICS_FILE, 'utf-8'));
    }
  } catch (err) {
    console.error('Failed to read analytics store:', err);
  }
  return {
    totalPageViews: 0,
    daily: {},
    pages: {},
    adSlots: {},
    resources: {},
  };
}

function writeAnalytics(store: AnalyticsStore) {
  try {
    fs.writeFileSync(ANALYTICS_FILE, JSON.stringify(store, null, 2));
  } catch (err) {
    console.error('Failed to write analytics store:', err);
  }
}

function readContacts(): ContactSubmission[] {
  try {
    if (fs.existsSync(CONTACTS_FILE)) {
      return JSON.parse(fs.readFileSync(CONTACTS_FILE, 'utf-8'));
    }
  } catch (err) {
    console.error('Failed to read contacts store:', err);
  }
  return [];
}

function writeContacts(items: ContactSubmission[]) {
  try {
    fs.writeFileSync(CONTACTS_FILE, JSON.stringify(items, null, 2));
  } catch (err) {
    console.error('Failed to write contacts store:', err);
  }
}

// ---------------------------------------------------------------------------
// Firebase Auth & Firestore Role Verification Helper (No IAM Needed)
// ---------------------------------------------------------------------------
interface AuthRequest extends Request {
  user?: DecodedIdToken;
  rawToken?: string;
}

async function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required.' });
  }
  const token = authHeader.split('Bearer ')[1];
  try {
    const decoded = await adminAuth.verifyIdToken(token);
    req.user = decoded;
    req.rawToken = token;
    next();
  } catch (err) {
    console.error('Token verification failed:', err);
    return res.status(401).json({ error: 'Invalid or expired authentication token.' });
  }
}

interface UserPermissionsDoc {
  role: string;
  isSuspended: boolean;
  permissions: Record<string, boolean>;
}

async function fetchUserRoleFromFirestore(uid: string, idToken: string): Promise<UserPermissionsDoc | null> {
  try {
    const dbId = firebaseConfig.firestoreDatabaseId || '(default)';
    const url = `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/${dbId}/documents/users/${encodeURIComponent(uid)}`;
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${idToken}` },
    });
    if (!response.ok) return null;
    const json = await response.json();
    const fields = json.fields || {};
    const role = fields.role?.stringValue || 'ordinary_member';
    const isSuspended = Boolean(fields.isSuspended?.booleanValue);
    const permFields = fields.permissions?.mapValue?.fields || {};
    const permissions: Record<string, boolean> = {};
    for (const [k, v] of Object.entries(permFields)) {
      permissions[k] = Boolean((v as { booleanValue?: boolean }).booleanValue);
    }
    return { role, isSuspended, permissions };
  } catch (err) {
    console.error('Error reading user role from Firestore:', err);
    return null;
  }
}

function isMainAdminUser(decoded?: DecodedIdToken): boolean {
  return Boolean(decoded?.email === 'berghazi9@gmail.com' && decoded?.email_verified === true);
}

// ---------------------------------------------------------------------------
// Secure File Upload (Multer)
// ---------------------------------------------------------------------------
const ALLOWED_EXTS = new Set([
  '.pdf',
  '.pptx',
  '.ppt',
  '.docx',
  '.doc',
  '.png',
  '.jpg',
  '.jpeg',
  '.webp',
  '.svg',
  '.xlsx',
  '.txt',
]);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const safeBase = path
      .basename(file.originalname, ext)
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .slice(0, 40);
    const unique = crypto.randomBytes(6).toString('hex');
    cb(null, `${Date.now()}_${unique}_${safeBase}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!ALLOWED_EXTS.has(ext)) {
      return cb(new Error(`Unsupported file extension: ${ext}`));
    }
    cb(null, true);
  },
});

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, platform: 'Berghazi' });
});

app.post('/api/upload', requireAuth, (req: AuthRequest, res: Response) => {
  upload.single('file')(req, res, async (err: unknown) => {
    if (err) {
      const message = err instanceof Error ? err.message : 'File upload failed.';
      return res.status(400).json({ error: message });
    }
    if (!req.file || !req.user || !req.rawToken) {
      return res.status(400).json({ error: 'No file provided.' });
    }

    const purpose = String(req.body?.purpose || 'general');
    const isOwnerAdmin = isMainAdminUser(req.user);
    if (!req.user.email_verified) {
      fs.unlink(req.file.path, () => {});
      return res.status(403).json({ error: 'Verified email address is required.' });
    }
    const userDoc = isOwnerAdmin
      ? { role: 'main_admin', isSuspended: false, permissions: {} }
      : await fetchUserRoleFromFirestore(req.user.uid, req.rawToken);

    if (!userDoc || userDoc.isSuspended) {
      fs.unlink(req.file.path, () => {});
      return res.status(403).json({ error: 'Account is suspended or unverified.' });
    }

    let authorized = isOwnerAdmin;
    if (!authorized) {
      if (purpose === 'lesson') {
        authorized = userDoc.role === 'assistant_admin' && userDoc.permissions.manageLessons === true;
      } else if (purpose === 'template') {
        authorized = userDoc.role === 'assistant_admin' && userDoc.permissions.manageDocuments === true;
      } else if (purpose === 'research' || purpose === 'cover') {
        authorized = ['assistant_admin', 'page_writer', 'permanent_member'].includes(userDoc.role);
      } else if (purpose === 'avatar') {
        authorized = true;
      }
    }

    if (!authorized) {
      fs.unlink(req.file.path, () => {});
      return res.status(403).json({ error: 'Insufficient permissions to upload this resource type.' });
    }

    const ext = path.extname(req.file.originalname).toLowerCase().replace('.', '');
    let format: 'pdf' | 'pptx' | 'docx' | 'image' | 'other' = 'other';
    if (ext === 'pdf') format = 'pdf';
    else if (ext === 'pptx' || ext === 'ppt') format = 'pptx';
    else if (ext === 'docx' || ext === 'doc') format = 'docx';
    else if (['png', 'jpg', 'jpeg', 'webp', 'svg'].includes(ext)) format = 'image';

    res.json({
      url: `/api/files/${encodeURIComponent(req.file.filename)}`,
      fileName: req.file.originalname,
      size: req.file.size,
      ext,
      format,
    });
  });
});

app.get('/api/files/:filename', (req: Request, res: Response) => {
  const safeName = path.basename(String(req.params.filename || ''));
  const target = path.join(UPLOADS_DIR, safeName);
  if (!target.startsWith(UPLOADS_DIR) || !fs.existsSync(target)) {
    return res.status(404).json({ error: 'File not found.' });
  }

  res.setHeader('X-Content-Type-Options', 'nosniff');
  const downloadMode = req.query.download === '1';
  if (downloadMode) {
    return res.download(target, safeName);
  }
  const ext = path.extname(safeName).toLowerCase();
  res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
  if (ext === '.svg' || ext === '.txt') {
    res.setHeader('Content-Security-Policy', "default-src 'none'; style-src 'unsafe-inline'; sandbox");
  }
  return res.sendFile(target);
});

// ---------------------------------------------------------------------------
// Privacy-Conscious Analytics Routes
// ---------------------------------------------------------------------------
app.post('/api/analytics/visit', (req: Request, res: Response) => {
  const page = String(req.body?.page || 'home').slice(0, 80);
  const visitorHash = String(req.body?.visitorId || req.ip || 'anon').slice(0, 64);
  const today = new Date().toISOString().slice(0, 10);

  const store = readAnalytics();
  store.totalPageViews += 1;
  store.pages[page] = (store.pages[page] || 0) + 1;
  if (!store.daily[today]) {
    store.daily[today] = { visitors: [], pageViews: 0, adImpressions: 0, downloads: 0 };
  }
  store.daily[today].pageViews += 1;
  if (!store.daily[today].visitors.includes(visitorHash) && store.daily[today].visitors.length < 50000) {
    store.daily[today].visitors.push(visitorHash);
  }
  writeAnalytics(store);
  res.json({ ok: true });
});

app.post('/api/analytics/ad-impression', (req: Request, res: Response) => {
  const slotId = String(req.body?.slotId || 'default').slice(0, 64);
  const clicked = Boolean(req.body?.clicked);
  const today = new Date().toISOString().slice(0, 10);

  const store = readAnalytics();
  if (!store.adSlots[slotId]) {
    store.adSlots[slotId] = { impressions: 0, clicks: 0 };
  }
  if (clicked) {
    store.adSlots[slotId].clicks += 1;
  } else {
    store.adSlots[slotId].impressions += 1;
    if (!store.daily[today]) {
      store.daily[today] = { visitors: [], pageViews: 0, adImpressions: 0, downloads: 0 };
    }
    store.daily[today].adImpressions += 1;
  }
  writeAnalytics(store);
  res.json({ ok: true });
});

app.post('/api/analytics/download', (req: Request, res: Response) => {
  const resourceId = String(req.body?.resourceId || '').slice(0, 128);
  const title = String(req.body?.title || 'Untitled').slice(0, 200);
  const type = String(req.body?.type || 'lesson').slice(0, 32);
  if (!resourceId) return res.status(400).json({ error: 'Missing resourceId' });

  const today = new Date().toISOString().slice(0, 10);
  const store = readAnalytics();
  if (!store.resources[resourceId]) {
    store.resources[resourceId] = { title, type, downloads: 0 };
  }
  store.resources[resourceId].downloads += 1;
  store.resources[resourceId].title = title;

  if (!store.daily[today]) {
    store.daily[today] = { visitors: [], pageViews: 0, adImpressions: 0, downloads: 0 };
  }
  store.daily[today].downloads += 1;
  writeAnalytics(store);
  res.json({ ok: true });
});

app.get('/api/analytics/summary', requireAuth, async (req: AuthRequest, res: Response) => {
  if (!req.user || !req.rawToken) return res.status(401).json({ error: 'Unauthorized' });

  const isOwnerAdmin = isMainAdminUser(req.user);
  if (!isOwnerAdmin) {
    const userDoc = await fetchUserRoleFromFirestore(req.user.uid, req.rawToken);
    const allowed =
      userDoc &&
      !userDoc.isSuspended &&
      userDoc.role === 'assistant_admin' &&
      userDoc.permissions.viewAnalytics === true;
    if (!allowed) {
      return res.status(403).json({ error: 'Analytics access denied.' });
    }
  }

  const store = readAnalytics();
  const today = new Date().toISOString().slice(0, 10);
  const currentMonth = today.slice(0, 7);

  const uniqueAllVisitors = new Set<string>();
  const uniqueMonthVisitors = new Set<string>();
  let totalAdImpressions = 0;
  let totalDownloads = 0;

  for (const [dateKey, day] of Object.entries(store.daily)) {
    for (const v of day.visitors) {
      uniqueAllVisitors.add(v);
      if (dateKey.startsWith(currentMonth)) {
        uniqueMonthVisitors.add(v);
      }
    }
    totalAdImpressions += day.adImpressions || 0;
    totalDownloads += day.downloads || 0;
  }

  const topPages = Object.entries(store.pages)
    .map(([page, views]) => ({ page, views }))
    .sort((a, b) => b.views - a.views)
    .slice(0, 10);

  const topResources = Object.entries(store.resources)
    .map(([id, data]) => ({ id, ...data }))
    .sort((a, b) => b.downloads - a.downloads)
    .slice(0, 10);

  res.json({
    totalVisitors: uniqueAllVisitors.size,
    dailyVisitors: store.daily[today]?.visitors.length || 0,
    monthlyVisitors: uniqueMonthVisitors.size,
    totalPageViews: store.totalPageViews,
    totalAdImpressions,
    totalDownloads,
    adSlots: store.adSlots,
    topPages,
    topResources,
    dailySeries: Object.entries(store.daily)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-14)
      .map(([date, day]) => ({
        date,
        visitors: day.visitors.length,
        pageViews: day.pageViews,
        downloads: day.downloads,
        adImpressions: day.adImpressions,
      })),
  });
});

// ---------------------------------------------------------------------------
// Contact Messages Endpoint
// ---------------------------------------------------------------------------
app.post('/api/contact', (req: Request, res: Response) => {
  const name = String(req.body?.name || '').trim().slice(0, 120);
  const email = String(req.body?.email || '').trim().slice(0, 200);
  const subject = String(req.body?.subject || '').trim().slice(0, 200);
  const message = String(req.body?.message || '').trim().slice(0, 4000);

  if (!name || !email || !subject || !message) {
    return res.status(400).json({ error: 'All contact fields are required.' });
  }

  const items = readContacts();
  const entry: ContactSubmission = {
    id: `msg_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
    name,
    email,
    subject,
    message,
    status: 'unread',
    createdAt: new Date().toISOString(),
  };
  items.unshift(entry);
  writeContacts(items.slice(0, 500));
  res.json({ ok: true, id: entry.id });
});

app.get('/api/contact', requireAuth, async (req: AuthRequest, res: Response) => {
  if (!req.user || !req.rawToken) return res.status(401).json({ error: 'Unauthorized' });
  const isOwnerAdmin = isMainAdminUser(req.user);
  if (!isOwnerAdmin) {
    const userDoc = await fetchUserRoleFromFirestore(req.user.uid, req.rawToken);
    if (!userDoc || userDoc.isSuspended || userDoc.role !== 'assistant_admin' || !userDoc.permissions.manageUsers) {
      return res.status(403).json({ error: 'Forbidden' });
    }
  }
  res.json({ messages: readContacts() });
});

app.patch('/api/contact/:id', requireAuth, async (req: AuthRequest, res: Response) => {
  if (!req.user || !req.rawToken) return res.status(401).json({ error: 'Unauthorized' });
  const isOwnerAdmin = isMainAdminUser(req.user);
  if (!isOwnerAdmin) {
    const userDoc = await fetchUserRoleFromFirestore(req.user.uid, req.rawToken);
    if (!userDoc || userDoc.isSuspended || userDoc.role !== 'assistant_admin' || !userDoc.permissions.manageUsers) {
      return res.status(403).json({ error: 'Forbidden' });
    }
  }
  const status = req.body?.status;
  if (!['unread', 'read', 'replied'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }
  const items = readContacts();
  const idx = items.findIndex((i) => i.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Message not found' });
  items[idx].status = status;
  writeContacts(items);
  res.json({ ok: true, message: items[idx] });
});

// ---------------------------------------------------------------------------
// Platform Configuration Status & Gemini AI Server Routes
// ---------------------------------------------------------------------------
app.get('/api/config/status', (_req: Request, res: Response) => {
  res.json({
    firebaseConfigured: Boolean(firebaseConfig.projectId && firebaseConfig.firestoreDatabaseId),
    geminiConfigured: Boolean(process.env.GEMINI_API_KEY),
    mapsConfigured: Boolean(
      process.env.VITE_GOOGLE_MAPS_API_KEY || process.env.GOOGLE_MAPS_API_KEY
    ),
    mapsApiKey: process.env.VITE_GOOGLE_MAPS_API_KEY || process.env.GOOGLE_MAPS_API_KEY || '',
    postgresConfigured: Boolean(process.env.SQL_HOST && process.env.SQL_DB_NAME),
  });
});

app.post('/api/ai/chat', async (req: Request, res: Response) => {
  try {
    const message = String(req.body?.message || '').trim();
    if (!message) {
      return res.status(400).json({ error: 'Message is required.' });
    }
    const result = await runChatTurn({
      message,
      history: Array.isArray(req.body?.history) ? req.body.history : [],
      model: req.body?.model,
      systemInstruction:
        typeof req.body?.systemInstruction === 'string' ? req.body.systemInstruction : undefined,
      grounding: req.body?.grounding,
      latLng: req.body?.latLng,
      thinkingLevel: req.body?.thinkingLevel,
    });
    return res.json(result);
  } catch (err) {
    const mapped = mapGeminiError(err);
    return res.status(mapped.status).json({ error: mapped.error });
  }
});

app.post('/api/ai/music', async (req: Request, res: Response) => {
  try {
    const prompt = String(req.body?.prompt || '').trim();
    if (!prompt) {
      return res.status(400).json({ error: 'Music prompt is required.' });
    }
    const result = await generateLyriaMusic({
      prompt,
      model: req.body?.model,
      imageBase64: req.body?.imageBase64,
      imageMimeType: req.body?.imageMimeType,
    });
    return res.json(result);
  } catch (err) {
    const mapped = mapGeminiError(err);
    return res.status(mapped.status).json({ error: mapped.error });
  }
});

app.post('/api/ai/image', async (req: Request, res: Response) => {
  try {
    const prompt = String(req.body?.prompt || '').trim();
    if (!prompt) {
      return res.status(400).json({ error: 'Image prompt is required.' });
    }
    const result = await generateOrEditImage({
      prompt,
      model: req.body?.model,
      aspectRatio: req.body?.aspectRatio,
      imageSize: req.body?.imageSize,
      useSearch: Boolean(req.body?.useSearch),
      sourceImageBase64: req.body?.sourceImageBase64,
      sourceImageMimeType: req.body?.sourceImageMimeType,
    });
    return res.json(result);
  } catch (err) {
    const mapped = mapGeminiError(err);
    return res.status(mapped.status).json({ error: mapped.error });
  }
});

app.post('/api/ai/video', async (req: Request, res: Response) => {
  try {
    const prompt = String(req.body?.prompt || '').trim();
    if (!prompt) {
      return res.status(400).json({ error: 'Video prompt is required.' });
    }
    const result = await generateOmniVideo({
      prompt,
      aspectRatio: req.body?.aspectRatio,
      duration: req.body?.duration,
      imageBase64: req.body?.imageBase64,
      imageMimeType: req.body?.imageMimeType,
    });
    return res.json(result);
  } catch (err) {
    const mapped = mapGeminiError(err);
    return res.status(mapped.status).json({ error: mapped.error });
  }
});

app.post('/api/ai/transcribe', async (req: Request, res: Response) => {
  try {
    const audioBase64 = String(req.body?.audioBase64 || '').trim();
    const mimeType = String(req.body?.mimeType || 'audio/webm');
    if (!audioBase64) {
      return res.status(400).json({ error: 'Audio recording data is required.' });
    }
    const result = await transcribeAudioClip({
      audioBase64,
      mimeType,
      languageHint: typeof req.body?.languageHint === 'string' ? req.body.languageHint : undefined,
    });
    return res.json(result);
  } catch (err) {
    const mapped = mapGeminiError(err);
    return res.status(mapped.status).json({ error: mapped.error });
  }
});

app.post('/api/ai/tts', async (req: Request, res: Response) => {
  try {
    const text = String(req.body?.text || '').trim().slice(0, 2000);
    if (!text) {
      return res.status(400).json({ error: 'Text is required for speech synthesis.' });
    }
    const result = await generateSpeechClip({
      text,
      voiceName: req.body?.voiceName,
    });
    return res.json(result);
  } catch (err) {
    const mapped = mapGeminiError(err);
    return res.status(mapped.status).json({ error: mapped.error });
  }
});

// ---------------------------------------------------------------------------
// Vite Dev Middleware or Static Production Serving
// ---------------------------------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(ROOT_DIR, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const server = http.createServer(app);
  const wss = new WebSocketServer({ server, path: '/api/ai/live' });
  attachLiveWebSocketServer(wss);

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Berghazi server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
