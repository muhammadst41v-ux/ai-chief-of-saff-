import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import cron from 'node-cron';
import {
  initDatabase,
  getAllEvents,
  getAllEmails,
  getAllTasks,
  getSettings,
  updateSettings,
  getLatestBrief,
  saveBriefRecord,
  seedInitialDataIfEmpty,
  wipeAllUserData,
  getTodayDateString,
  saveDatabase,
} from './server/db.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '10mb' }));

// 1. Environment and Key Validation on Startup
const envStatus = {
  gemini: Boolean(process.env.GEMINI_API_KEY),
  googleClientId: Boolean(process.env.GOOGLE_CLIENT_ID),
  googleClientSecret: Boolean(process.env.GOOGLE_CLIENT_SECRET),
  googleRedirectUri: Boolean(process.env.GOOGLE_REDIRECT_URI),
  sessionSecret: Boolean(process.env.SESSION_SECRET),
};

const isDemoMode = !envStatus.googleClientId || !envStatus.googleClientSecret;

console.log('====================================================');
console.log('  CHIEF – AI Chief of Staff (Backend Server)');
console.log('====================================================');
console.log(`• Operating Mode: ${isDemoMode ? '🟡 DEMO MODE (Add keys to .env to connect real data)' : '🟢 LIVE MODE (Google OAuth Keys Present)'}`);
console.log(`• Gemini API Key: ${envStatus.gemini ? 'Detected' : 'Missing (Using intelligent local synthesis fallback)'}`);
console.log(`• Google Client ID: ${envStatus.googleClientId ? 'Configured' : 'Not set (Demo mode active)'}`);
console.log(`• Google Client Secret: ${envStatus.googleClientSecret ? 'Configured' : 'Not set (Demo mode active)'}`);
console.log('====================================================');

// 2. Initialize Gemini 2.5 Flash SDK
const apiKey = process.env.GEMINI_API_KEY || '';
const ai = apiKey
  ? new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    })
  : null;

const MODEL_NAME = 'gemini-2.5-flash';

// Helper: Parse JSON safely by stripping markdown fences
function cleanAndParseJSON<T>(rawText: string, fallback: T): T {
  if (!rawText) return fallback;
  try {
    let cleaned = rawText.trim();
    if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```(?:json)?\s*/i, '');
      cleaned = cleaned.replace(/\s*```$/, '');
    }
    return JSON.parse(cleaned) as T;
  } catch (err) {
    try {
      const match = rawText.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
      if (match) return JSON.parse(match[1]) as T;
    } catch {
      // ignore
    }
    return fallback;
  }
}

// REST Endpoints

// Status endpoint
app.get('/api/status', (_req, res) => {
  res.json({
    status: 'ok',
    isDemoMode,
    model: MODEL_NAME,
    keys: envStatus,
    isGoogleConnected: false, // Updated when real OAuth is established in step 3
  });
});

// Settings endpoints
app.get('/api/settings', (_req, res) => {
  const settings = getSettings();
  res.json(settings);
});

app.post('/api/settings', (req, res) => {
  const newSettings = req.body;
  if (!newSettings || typeof newSettings !== 'object') {
    return res.status(400).json({ error: 'Settings object required' });
  }
  updateSettings(newSettings);
  res.json({ success: true, settings: getSettings() });
});

// Events endpoints
app.get('/api/events', (_req, res) => {
  const events = getAllEvents();
  res.json(events);
});

app.post('/api/events', async (req, res) => {
  const evt = req.body;
  if (!evt || !evt.title) {
    return res.status(400).json({ error: 'Title is required' });
  }
  const id = evt.id || 'evt-' + Math.random().toString(36).substring(2, 9);
  const db = await initDatabase();
  db.run(
    `INSERT OR REPLACE INTO events (id, title, date, startTime, endTime, location, description, attendees, category, is_sample)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      evt.title,
      evt.date || getTodayDateString(0),
      evt.startTime || '09:00',
      evt.endTime || '10:00',
      evt.location || '',
      evt.description || '',
      JSON.stringify(evt.attendees || []),
      evt.category || 'meeting',
      evt.is_sample ? 1 : 0,
    ]
  );
  saveDatabase();
  res.json({ success: true, id, event: { ...evt, id } });
});

app.put('/api/events/:id', async (req, res) => {
  const { id } = req.params;
  const evt = req.body;
  const db = await initDatabase();
  db.run(
    `UPDATE events SET title = ?, date = ?, startTime = ?, endTime = ?, location = ?, description = ?, attendees = ?, category = ?
     WHERE id = ?`,
    [
      evt.title,
      evt.date,
      evt.startTime,
      evt.endTime,
      evt.location,
      evt.description,
      JSON.stringify(evt.attendees || []),
      evt.category,
      id,
    ]
  );
  saveDatabase();
  res.json({ success: true });
});

app.delete('/api/events/:id', async (req, res) => {
  const { id } = req.params;
  const db = await initDatabase();
  db.run('DELETE FROM events WHERE id = ?', [id]);
  saveDatabase();
  res.json({ success: true });
});

// Emails endpoints
app.get('/api/emails', (_req, res) => {
  const emails = getAllEmails();
  res.json(emails);
});

app.post('/api/emails', async (req, res) => {
  const em = req.body;
  if (!em || !em.subject) {
    return res.status(400).json({ error: 'Subject is required' });
  }
  const id = em.id || 'em-' + Math.random().toString(36).substring(2, 9);
  const db = await initDatabase();
  db.run(
    `INSERT OR REPLACE INTO emails (id, sender, subject, body, date, category, priority, needs_reply, reason, suggested_action, is_read, is_replied, draft_reply, is_sample)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      em.sender || 'Unknown Sender',
      em.subject,
      em.body || '',
      em.date || 'Today',
      em.category || 'Needs Reply',
      em.priority || 'medium',
      em.needs_reply ? 1 : 0,
      em.reason || '',
      em.suggested_action || '',
      em.is_read ? 1 : 0,
      em.is_replied ? 1 : 0,
      em.draft_reply || null,
      em.is_sample ? 1 : 0,
    ]
  );
  saveDatabase();
  res.json({ success: true, id, email: { ...em, id } });
});

app.put('/api/emails/:id', async (req, res) => {
  const { id } = req.params;
  const em = req.body;
  const db = await initDatabase();
  db.run(
    `UPDATE emails SET category = ?, priority = ?, needs_reply = ?, reason = ?, suggested_action = ?, is_read = ?, is_replied = ?, draft_reply = ?
     WHERE id = ?`,
    [
      em.category,
      em.priority,
      em.needs_reply ? 1 : 0,
      em.reason,
      em.suggested_action,
      em.is_read ? 1 : 0,
      em.is_replied ? 1 : 0,
      em.draft_reply,
      id,
    ]
  );
  saveDatabase();
  res.json({ success: true });
});

app.delete('/api/emails/:id', async (req, res) => {
  const { id } = req.params;
  const db = await initDatabase();
  db.run('DELETE FROM emails WHERE id = ?', [id]);
  saveDatabase();
  res.json({ success: true });
});

// Tasks endpoints
app.get('/api/tasks', (_req, res) => {
  const tasks = getAllTasks();
  res.json(tasks);
});

app.post('/api/tasks', async (req, res) => {
  const tsk = req.body;
  if (!tsk || !tsk.title) {
    return res.status(400).json({ error: 'Task title is required' });
  }
  const id = tsk.id || 'tsk-' + Math.random().toString(36).substring(2, 9);
  const db = await initDatabase();
  db.run(
    `INSERT OR REPLACE INTO tasks (id, title, completed, due_date, priority, source, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      tsk.title,
      tsk.completed ? 1 : 0,
      tsk.due_date || getTodayDateString(0),
      tsk.priority || 'high',
      tsk.source || 'Manual',
      tsk.created_at || new Date().toISOString(),
    ]
  );
  saveDatabase();
  res.json({ success: true, id, task: { ...tsk, id } });
});

app.put('/api/tasks/:id', async (req, res) => {
  const { id } = req.params;
  const tsk = req.body;
  const db = await initDatabase();
  db.run(
    `UPDATE tasks SET title = ?, completed = ?, due_date = ?, priority = ?, source = ?
     WHERE id = ?`,
    [tsk.title, tsk.completed ? 1 : 0, tsk.due_date, tsk.priority, tsk.source, id]
  );
  saveDatabase();
  res.json({ success: true });
});

app.delete('/api/tasks/:id', async (req, res) => {
  const { id } = req.params;
  const db = await initDatabase();
  db.run('DELETE FROM tasks WHERE id = ?', [id]);
  saveDatabase();
  res.json({ success: true });
});

// Morning Brief endpoints
app.get('/api/brief/today', (_req, res) => {
  const latest = getLatestBrief();
  res.json(latest);
});

app.post('/api/brief/generate', async (req, res) => {
  const events = getAllEvents();
  const emails = getAllEmails();
  const settings = getSettings();
  const userName = settings.name || 'Alex';
  const todayStr = getTodayDateString(0);
  const todayEvents = events.filter((e) => e.date === todayStr);

  // Fallback brief calculation
  const replyNeededFallback = emails
    .filter((e) => e.needs_reply || e.category === 'Needs Reply' || e.category === 'Urgent')
    .map((e) => ({
      subject: e.subject,
      sender: e.sender,
      reason: e.reason || 'Pending executive response or contract review.',
    }));

  const conflicts: string[] = [];
  const sorted = [...todayEvents].sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''));
  for (let i = 0; i < sorted.length - 1; i++) {
    const cur = sorted[i];
    const nxt = sorted[i + 1];
    if (cur.endTime && nxt.startTime && cur.endTime > nxt.startTime) {
      conflicts.push(`Schedule overlap: "${cur.title}" (${cur.startTime}-${cur.endTime}) overlaps with "${nxt.title}" (${nxt.startTime}-${nxt.endTime}).`);
    }
  }

  const fallbackBrief = {
    summary: `Good morning, ${userName}. Today includes ${todayEvents.length} scheduled event${todayEvents.length === 1 ? '' : 's'} and ${replyNeededFallback.length} priority message${replyNeededFallback.length === 1 ? '' : 's'} requiring executive attention.`,
    priorities: [
      todayEvents[0]?.title ? `Prepare for key meeting: ${todayEvents[0].title}` : 'Review calendar commitments',
      replyNeededFallback[0]?.subject ? `Respond to ${replyNeededFallback[0].sender}: "${replyNeededFallback[0].subject}"` : 'Clear pending inbox replies',
      'Follow up on outstanding deliverables and maintain strategic focus',
    ].slice(0, 3),
    reply_needed: replyNeededFallback.slice(0, 5),
    followups: [
      'Confirm meeting agenda items with attendees',
      'Track action items from executive sessions',
    ],
    conflicts,
    generatedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    dateStr: todayStr,
  };

  let briefResult = fallbackBrief;

  if (ai && apiKey) {
    try {
      const prompt = `You are Chief – executive AI Chief of Staff for ${userName}.
Today is ${todayStr}.
Analyze the user's scheduled calendar events and inbox emails provided below.

Strict instructions:
1. ONLY use the calendar and email data provided below. NEVER invent meetings, emails, clients, or commitments.
2. Return a structured Morning Brief as JSON with the exact following schema:
{
  "summary": "Crisp 2-3 sentence overview of the day's cadence, focus areas, and time allocation.",
  "priorities": ["Top priority 1", "Top priority 2", "Top priority 3"],
  "reply_needed": [
    {
      "subject": "Email Subject",
      "sender": "Sender Name / Email",
      "reason": "One-line clear executive explanation of why a reply is required"
    }
  ],
  "followups": ["Action item or follow-up to track 1", "Action item or follow-up to track 2"],
  "conflicts": ["List any overlapping meeting times or high-risk back-to-back crunch times found in the events list. If none, return an empty array []"]
}

CALENDAR EVENTS:
${JSON.stringify(todayEvents, null, 2)}

INBOX EMAILS:
${JSON.stringify(emails, null, 2)}
`;

      const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.2,
        },
      });

      const parsed = cleanAndParseJSON(response.text || '', fallbackBrief);
      briefResult = {
        ...parsed,
        generatedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        dateStr: todayStr,
      };
    } catch (err) {
      console.error('Error generating brief via Gemini API:', err);
    }
  }

  // Save in SQLite
  saveBriefRecord(briefResult);
  res.json(briefResult);
});

// Single Email Classification
app.post('/api/emails/:id/classify', async (req, res) => {
  const { id } = req.params;
  const emails = getAllEmails();
  const target = emails.find((e) => e.id === id);
  if (!target) return res.status(404).json({ error: 'Email not found' });

  const fallback = {
    category:
      target.subject.toLowerCase().includes('urgent') || target.subject.toLowerCase().includes('asap')
        ? 'Urgent'
        : target.subject.toLowerCase().includes('newsletter')
        ? 'Newsletter'
        : target.body?.includes('?') || target.subject.toLowerCase().includes('question')
        ? 'Needs Reply'
        : 'FYI',
    priority: target.subject.toLowerCase().includes('urgent') ? 'high' : 'medium',
    needs_reply: target.subject.toLowerCase().includes('urgent') || target.body?.includes('?'),
    reason: 'Heuristic analysis based on keywords in subject and body.',
    suggested_action: 'Review message details and respond if required.',
  };

  let classification = fallback;

  if (ai && apiKey) {
    try {
      const prompt = `You are Chief, an executive AI Chief of Staff.
Analyze this single email and classify it.
Strict rule: Rely ONLY on the provided email text. Do not invent any facts.

Email:
Sender: ${target.sender}
Subject: ${target.subject}
Date: ${target.date}
Body:
${target.body}

Return ONLY valid JSON matching this schema:
{
  "category": "Needs Reply" | "FYI" | "Urgent" | "Newsletter",
  "priority": "high" | "medium" | "low",
  "needs_reply": true | false,
  "reason": "short 1-sentence reason why it is classified this way",
  "suggested_action": "brief suggested next step for the executive"
}`;

      const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.2,
        },
      });

      classification = cleanAndParseJSON(response.text || '', fallback);
    } catch (err) {
      console.error('Gemini classify error:', err);
    }
  }

  // Update in SQLite
  const db = await initDatabase();
  db.run(
    `UPDATE emails SET category = ?, priority = ?, needs_reply = ?, reason = ?, suggested_action = ?
     WHERE id = ?`,
    [
      classification.category,
      classification.priority,
      classification.needs_reply ? 1 : 0,
      classification.reason,
      classification.suggested_action,
      id,
    ]
  );
  saveDatabase();

  res.json({ success: true, classification });
});

// Draft reply endpoint
app.post('/api/emails/:id/draft-reply', async (req, res) => {
  const { id } = req.params;
  const emails = getAllEmails();
  const target = emails.find((e) => e.id === id);
  if (!target) return res.status(404).json({ error: 'Email not found' });

  const settings = getSettings();
  const userName = settings.name || 'Alex';
  const tone = req.body.tone || settings.replyTone || 'Professional & Polished';

  const defaultDraft = `Hi ${target.sender.split(' ')[0] || 'there'},\n\nThank you for reaching out regarding "${target.subject}". I've received your note and will review it carefully. I'll get back to you with next steps shortly.\n\nBest regards,\n${userName}`;

  let replyText = defaultDraft;

  if (ai && apiKey) {
    try {
      const prompt = `You are Chief, the executive AI Chief of Staff drafting an email response on behalf of ${userName}.
Requested communication tone: ${tone}.
Strict rule: Rely ONLY on the provided email context. Do not invent external facts or make promises not requested. Keep the draft crisp, executive-ready, and addressing the specific points.

Email received:
Sender: ${target.sender}
Subject: ${target.subject}
Body:
${target.body}

Write a clean draft email response from ${userName}. Output only the draft reply body.`;

      const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: prompt,
        config: {
          temperature: 0.3,
        },
      });

      replyText = response.text?.trim() || defaultDraft;
    } catch (err) {
      console.error('Gemini draft-reply error:', err);
    }
  }

  // Save draft in SQLite
  const db = await initDatabase();
  db.run('UPDATE emails SET draft_reply = ? WHERE id = ?', [replyText, id]);
  saveDatabase();

  res.json({ success: true, replyText });
});

// Batch classify all emails
app.post('/api/emails/batch-classify', async (_req, res) => {
  const emails = getAllEmails();
  const db = await initDatabase();

  for (const em of emails) {
    let cat = em.category;
    let pri = em.priority;
    let nr = em.needs_reply ? 1 : 0;
    let reason = em.reason;
    let action = em.suggested_action;

    if (em.subject.toLowerCase().includes('urgent')) {
      cat = 'Urgent';
      pri = 'high';
      nr = 1;
      reason = 'High priority deadline requires executive sign-off.';
      action = 'Review immediately and respond.';
    } else if (em.subject.toLowerCase().includes('newsletter')) {
      cat = 'Newsletter';
      pri = 'low';
      nr = 0;
      reason = 'Automated periodic executive briefing newsletter.';
      action = 'Archive or skim when time permits.';
    }

    db.run(
      `UPDATE emails SET category = ?, priority = ?, needs_reply = ?, reason = ?, suggested_action = ?
       WHERE id = ?`,
      [cat, pri, nr, reason, action, em.id]
    );
  }
  saveDatabase();
  res.json({ success: true, emails: getAllEmails() });
});

// Data Reset & Delete All (Security requirement)
app.post('/api/data/reset-sample', (_req, res) => {
  seedInitialDataIfEmpty(true);
  res.json({
    success: true,
    events: getAllEvents(),
    emails: getAllEmails(),
    tasks: getAllTasks(),
    settings: getSettings(),
  });
});

app.post('/api/data/delete-all', (_req, res) => {
  wipeAllUserData();
  res.json({ success: true, message: 'All stored workspace data and tokens wiped.' });
});

// 5. Daily Morning Brief Cron Job (Runs every morning at configured time)
function scheduleDailyBriefCron() {
  const settings = getSettings();
  const briefTime = settings.briefTime || '08:00';
  const [hourStr, minStr] = briefTime.split(':');
  const hour = parseInt(hourStr || '8', 10);
  const min = parseInt(minStr || '0', 10);

  // Run at minute, hour every day
  const cronExp = `${min} ${hour} * * *`;
  console.log(`• Morning Brief Cron Scheduled: "${cronExp}" (${briefTime} daily)`);

  cron.schedule(cronExp, async () => {
    console.log(`[CRON] Generating scheduled Morning Brief at ${new Date().toISOString()}...`);
    try {
      const events = getAllEvents();
      const emails = getAllEmails();
      const userName = settings.name || 'Alex';
      const todayStr = getTodayDateString(0);
      const todayEvents = events.filter((e) => e.date === todayStr);

      const brief = {
        summary: `Good morning, ${userName}. Scheduled Morning Brief generated at ${briefTime}.`,
        priorities: ['Review daily roadmap', 'Triage pending messages', 'Track deliverables'],
        reply_needed: [],
        followups: ['Track meeting notes'],
        conflicts: [],
        generatedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        dateStr: todayStr,
      };

      saveBriefRecord(brief);
      console.log('[CRON] Morning Brief generated and saved to SQLite database.');
    } catch (err) {
      console.error('[CRON] Failed to generate scheduled brief:', err);
    }
  });
}

// Vite middleware or static serving
async function startServer() {
  await initDatabase();
  scheduleDailyBriefCron();

  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Chief AI Chief of Staff ready at http://0.0.0.0:${PORT} [${isProduction ? 'prod' : 'dev'}]`);
  });
}

startServer();
