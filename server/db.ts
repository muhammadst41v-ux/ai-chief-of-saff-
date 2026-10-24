import initSqlJs, { Database } from 'sql.js';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.resolve(__dirname, '../data');
const DB_FILE = path.join(DATA_DIR, 'chief.db');

let db: Database;

// Helper to encrypt sensitive tokens
export function encryptToken(text: string, secret: string): string {
  try {
    const key = crypto.createHash('sha256').update(secret || 'default-chief-secret-key-salt').digest();
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return `${iv.toString('hex')}:${encrypted}`;
  } catch (err) {
    console.error('Encryption error:', err);
    return text;
  }
}

export function decryptToken(encryptedText: string, secret: string): string {
  try {
    if (!encryptedText.includes(':')) return encryptedText;
    const [ivHex, cipherHex] = encryptedText.split(':');
    const key = crypto.createHash('sha256').update(secret || 'default-chief-secret-key-salt').digest();
    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    let decrypted = decipher.update(cipherHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (err) {
    console.error('Decryption error:', err);
    return encryptedText;
  }
}

export function saveDatabase(): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_FILE, buffer);
  } catch (err) {
    console.error('Error saving SQLite database to disk:', err);
  }
}

export async function initDatabase(): Promise<Database> {
  const SQL = await initSqlJs();

  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (fs.existsSync(DB_FILE)) {
    try {
      const fileBuffer = fs.readFileSync(DB_FILE);
      db = new SQL.Database(fileBuffer);
    } catch {
      db = new SQL.Database();
    }
  } else {
    db = new SQL.Database();
  }

  // Create SQLite tables
  db.run(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    );

    CREATE TABLE IF NOT EXISTS events (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      date TEXT NOT NULL,
      startTime TEXT,
      endTime TEXT,
      location TEXT,
      description TEXT,
      attendees TEXT,
      category TEXT,
      is_sample INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS emails (
      id TEXT PRIMARY KEY,
      sender TEXT NOT NULL,
      subject TEXT NOT NULL,
      body TEXT,
      date TEXT,
      category TEXT,
      priority TEXT,
      needs_reply INTEGER DEFAULT 1,
      reason TEXT,
      suggested_action TEXT,
      is_read INTEGER DEFAULT 0,
      is_replied INTEGER DEFAULT 0,
      draft_reply TEXT,
      is_sample INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      completed INTEGER DEFAULT 0,
      due_date TEXT,
      priority TEXT,
      source TEXT,
      created_at TEXT
    );

    CREATE TABLE IF NOT EXISTS briefs (
      id TEXT PRIMARY KEY,
      summary TEXT,
      priorities TEXT,
      reply_needed TEXT,
      followups TEXT,
      conflicts TEXT,
      generated_at TEXT,
      date_str TEXT
    );

    CREATE TABLE IF NOT EXISTS oauth_tokens (
      id TEXT PRIMARY KEY,
      access_token TEXT,
      refresh_token TEXT,
      expiry_date INTEGER,
      email TEXT,
      updated_at TEXT
    );
  `);

  // Initialize sample data if events or emails are empty
  seedInitialDataIfEmpty();
  saveDatabase();
  return db;
}

export function getTodayDateString(offsetDays = 0): string {
  const d = new Date();
  if (offsetDays !== 0) {
    d.setDate(d.getDate() + offsetDays);
  }
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function seedInitialDataIfEmpty(force = false): void {
  const eventCountRes = db.exec('SELECT COUNT(*) as count FROM events');
  const eventCount = eventCountRes[0]?.values[0]?.[0] as number;

  if (eventCount > 0 && !force) {
    return;
  }

  if (force) {
    db.run('DELETE FROM events');
    db.run('DELETE FROM emails');
    db.run('DELETE FROM tasks');
    db.run('DELETE FROM briefs');
  }

  const today = getTodayDateString(0);
  const tomorrow = getTodayDateString(1);

  // Default settings
  const defaultSettings: Record<string, string> = {
    name: 'Alex Morgan',
    timezone: 'America/Los_Angeles',
    workHoursStart: '09:00',
    workHoursEnd: '18:00',
    replyTone: 'Professional & Polished',
    briefTime: '08:00',
    emailBriefsEnabled: 'true',
  };

  for (const [key, val] of Object.entries(defaultSettings)) {
    db.run('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', [key, val]);
  }

  // 3 Realistic meetings for today (+ 1 for tomorrow)
  const sampleEvents = [
    {
      id: 'evt-1',
      title: 'Q4 Product Strategy & Roadmap Review',
      date: today,
      startTime: '09:30',
      endTime: '10:30',
      location: 'Conference Room 4A / Zoom',
      description: 'Review final sprint deliverables, OKR pacing, and executive demo timeline.',
      attendees: JSON.stringify(['Elena Rostova (VP Product)', 'Marcus Vance (Enterprise Lead)', 'Sarah Chen (UX Lead)']),
      category: 'meeting',
      is_sample: 1,
    },
    {
      id: 'evt-2',
      title: '1:1 Sync with Sarah (Lead Designer)',
      date: today,
      startTime: '13:00',
      endTime: '13:45',
      location: 'Huddle Pod B / Google Meet',
      description: 'Review revised dashboard layout tokens and design system decisions.',
      attendees: JSON.stringify(['Sarah Chen (UX Lead)']),
      category: 'meeting',
      is_sample: 1,
    },
    {
      id: 'evt-3',
      title: 'Executive Leadership Sync: Budget & Growth',
      date: today,
      startTime: '15:30',
      endTime: '16:30',
      location: 'Executive Boardroom',
      description: 'Quarterly financial performance, headcount requests, and board meeting prep.',
      attendees: JSON.stringify(['David Vance (CEO)', 'Claire Dupont (CFO)', 'Engineering VP']),
      category: 'meeting',
      is_sample: 1,
    },
    {
      id: 'evt-4',
      title: 'Deep Work: Customer Proposal Finalization',
      date: tomorrow,
      startTime: '10:00',
      endTime: '12:00',
      location: 'Private Office',
      description: 'Focus block for preparing enterprise responses and contract addendums.',
      attendees: JSON.stringify([]),
      category: 'deep_work',
      is_sample: 1,
    },
  ];

  for (const evt of sampleEvents) {
    db.run(
      `INSERT INTO events (id, title, date, startTime, endTime, location, description, attendees, category, is_sample)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [evt.id, evt.title, evt.date, evt.startTime, evt.endTime, evt.location, evt.description, evt.attendees, evt.category, evt.is_sample]
    );
  }

  // 5 Realistic sample emails
  const sampleEmails = [
    {
      id: 'em-1',
      sender: 'Marcus Vance <marcus.v@acmecorp.com>',
      subject: 'URGENT: Enterprise Contract Terms & Sign-off Deadline',
      body: `Hi Alex,\n\nWe need your final executive sign-off on the Master Services Agreement for Acme Corp before 2:00 PM today to close the Q4 deal. Legal has approved clauses 4 and 8 with the indemnification cap we agreed upon.\n\nCan you confirm approval or flag any remaining blockers asap so we can route for electronic signature?\n\nBest regards,\nMarcus Vance\nHead of Strategic Partnerships | Acme Corp`,
      date: 'Today, 08:14 AM',
      category: 'Urgent',
      priority: 'high',
      needs_reply: 1,
      reason: 'Requires final executive contract sign-off before the 2:00 PM enterprise deal deadline.',
      suggested_action: 'Review clauses 4 & 8 and approve via reply or flag blockers.',
      is_read: 0,
      is_replied: 0,
      draft_reply: null,
      is_sample: 1,
    },
    {
      id: 'em-2',
      sender: 'Sarah Chen <sarah.c@designcorp.io>',
      subject: 'Design system refresh: feedback needed before 1:1',
      body: `Hey Alex,\n\nI just published the revised dashboard tokens and Chief of Staff components to the Figma preview workspace.\n\nCould you take a quick look before our 1:00 PM sync today? The main question for you is whether you prefer the high-density table view or modular cards for the morning inbox triage view.\n\nTalk soon,\nSarah`,
      date: 'Today, 07:45 AM',
      category: 'Needs Reply',
      priority: 'medium',
      needs_reply: 1,
      reason: 'Asks for design preference on high-density vs modular card layout ahead of your 1:00 PM meeting.',
      suggested_action: 'Check preview link and send quick preference to Sarah.',
      is_read: 0,
      is_replied: 0,
      draft_reply: null,
      is_sample: 1,
    },
    {
      id: 'em-3',
      sender: 'David Miller <d.miller@summit-vc.com>',
      subject: 'Board Deck revisions & preliminary CAC metrics',
      body: `Alex,\n\nThanks for sending over the draft board presentation deck. The CAC payback graphs look solid, but the audit committee requested clarification on whether the European expansion numbers are fully finalized or still preliminary.\n\nNo immediate rush, but having this confirmed before Thursday morning would be ideal.\n\nBest,\nDavid Miller\nPartner | Summit Capital`,
      date: 'Yesterday, 06:30 PM',
      category: 'Needs Reply',
      priority: 'medium',
      needs_reply: 1,
      reason: 'Requests clarification on whether EU expansion numbers in board deck are final or preliminary.',
      suggested_action: 'Confirm audit status with finance and reply to David.',
      is_read: 1,
      is_replied: 0,
      draft_reply: null,
      is_sample: 1,
    },
    {
      id: 'em-4',
      sender: 'DevOps & Reliability Bot <bot@cloudinfra.internal>',
      subject: 'FYI: Core Cloud Cluster Migration Completed Successfully',
      body: `All Systems Status Notification:\n\nCluster migration for US-East and EU-Central finished at 05:45 UTC without downtime. Database read replicas and caching layers switched seamlessly.\n\n- P99 latency: 38ms (down from 45ms)\n- Error rate: 0.001%\n- Status: Fully Healthy\n\nNo action required from leadership.`,
      date: 'Today, 06:00 AM',
      category: 'FYI',
      priority: 'low',
      needs_reply: 0,
      reason: 'Automated engineering notification confirming scheduled cloud migration was successful.',
      suggested_action: 'File as FYI; no response needed.',
      is_read: 1,
      is_replied: 0,
      draft_reply: null,
      is_sample: 1,
    },
    {
      id: 'em-5',
      sender: 'Executive Operations Digest <dispatch@chiefbrief.tech>',
      subject: 'Weekly Brief: Structuring the Modern AI Executive Suite',
      body: `Good morning Alex,\n\nIn this week's executive edition:\n1. Frameworks for delegating email triage to automated LLM agents.\n2. How top operating executives protect 40% of their calendar for unscheduled deep thought.\n3. Emerging patterns for daily morning synthesis vs reactive inbox scanning.\n\nClick here to read the full 6-minute executive briefing.`,
      date: 'Today, 05:15 AM',
      category: 'Newsletter',
      priority: 'low',
      needs_reply: 0,
      reason: 'Weekly industry newsletter covering executive operations and time management.',
      suggested_action: 'Skim when free or archive.',
      is_read: 1,
      is_replied: 0,
      draft_reply: null,
      is_sample: 1,
    },
  ];

  for (const em of sampleEmails) {
    db.run(
      `INSERT INTO emails (id, sender, subject, body, date, category, priority, needs_reply, reason, suggested_action, is_read, is_replied, draft_reply, is_sample)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [em.id, em.sender, em.subject, em.body, em.date, em.category, em.priority, em.needs_reply, em.reason, em.suggested_action, em.is_read, em.is_replied, em.draft_reply, em.is_sample]
    );
  }

  // Sample tasks
  const sampleTasks = [
    {
      id: 'tsk-1',
      title: 'Reply to Marcus: Final sign-off on Acme Corp contract terms before 2 PM',
      completed: 0,
      due_date: today,
      priority: 'urgent',
      source: 'Marcus Vance email',
      created_at: new Date().toISOString(),
    },
    {
      id: 'tsk-2',
      title: 'Review Figma design system tokens before 1:00 PM sync with Sarah',
      completed: 0,
      due_date: today,
      priority: 'high',
      source: 'Sarah Chen email',
      created_at: new Date().toISOString(),
    },
    {
      id: 'tsk-3',
      title: 'Prepare talking points for 3:30 PM Executive Leadership sync',
      completed: 0,
      due_date: today,
      priority: 'high',
      source: 'Calendar: Executive Sync',
      created_at: new Date().toISOString(),
    },
    {
      id: 'tsk-4',
      title: 'Confirm European expansion CAC audit numbers with Claire before Thursday',
      completed: 0,
      due_date: tomorrow,
      priority: 'medium',
      source: 'David Miller email',
      created_at: new Date().toISOString(),
    },
  ];

  for (const t of sampleTasks) {
    db.run(
      `INSERT INTO tasks (id, title, completed, due_date, priority, source, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [t.id, t.title, t.completed, t.due_date, t.priority, t.source, t.created_at]
    );
  }

  saveDatabase();
}

// Database helper functions
export function getAllEvents() {
  const res = db.exec('SELECT * FROM events ORDER BY date ASC, startTime ASC');
  if (!res[0]) return [];
  const columns = res[0].columns;
  return res[0].values.map((row) => {
    const obj: any = {};
    columns.forEach((col, idx) => {
      if (col === 'attendees') {
        try {
          obj[col] = JSON.parse(row[idx] as string || '[]');
        } catch {
          obj[col] = [];
        }
      } else {
        obj[col] = row[idx];
      }
    });
    return obj;
  });
}

export function getAllEmails() {
  const res = db.exec('SELECT * FROM emails ORDER BY date DESC');
  if (!res[0]) return [];
  const columns = res[0].columns;
  return res[0].values.map((row) => {
    const obj: any = {};
    columns.forEach((col, idx) => {
      if (col === 'needs_reply' || col === 'is_read' || col === 'is_replied' || col === 'is_sample') {
        obj[col] = Boolean(row[idx]);
      } else {
        obj[col] = row[idx];
      }
    });
    return obj;
  });
}

export function getAllTasks() {
  const res = db.exec('SELECT * FROM tasks ORDER BY completed ASC, created_at DESC');
  if (!res[0]) return [];
  const columns = res[0].columns;
  return res[0].values.map((row) => {
    const obj: any = {};
    columns.forEach((col, idx) => {
      if (col === 'completed') {
        obj[col] = Boolean(row[idx]);
      } else {
        obj[col] = row[idx];
      }
    });
    return obj;
  });
}

export function getSettings(): Record<string, string> {
  const res = db.exec('SELECT key, value FROM settings');
  const settings: Record<string, string> = {};
  if (res[0]) {
    res[0].values.forEach((row) => {
      settings[row[0] as string] = row[1] as string;
    });
  }
  return settings;
}

export function updateSettings(newSettings: Record<string, string>): void {
  for (const [k, v] of Object.entries(newSettings)) {
    db.run('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', [k, String(v)]);
  }
  saveDatabase();
}

export function getLatestBrief() {
  const res = db.exec('SELECT * FROM briefs ORDER BY generated_at DESC LIMIT 1');
  if (!res[0] || !res[0].values[0]) return null;
  const row = res[0].values[0];
  const columns = res[0].columns;
  const obj: any = {};
  columns.forEach((col, idx) => {
    if (['priorities', 'reply_needed', 'followups', 'conflicts'].includes(col)) {
      try {
        obj[col] = JSON.parse(row[idx] as string || '[]');
      } catch {
        obj[col] = [];
      }
    } else {
      obj[col] = row[idx];
    }
  });
  return obj;
}

export function saveBriefRecord(brief: any) {
  const id = 'brf-' + Math.random().toString(36).substring(2, 9);
  db.run(
    `INSERT INTO briefs (id, summary, priorities, reply_needed, followups, conflicts, generated_at, date_str)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      brief.summary,
      JSON.stringify(brief.priorities || []),
      JSON.stringify(brief.reply_needed || []),
      JSON.stringify(brief.followups || []),
      JSON.stringify(brief.conflicts || []),
      brief.generatedAt || new Date().toISOString(),
      brief.dateStr || getTodayDateString(0),
    ]
  );
  saveDatabase();
  return id;
}

export function wipeAllUserData() {
  db.run('DELETE FROM events');
  db.run('DELETE FROM emails');
  db.run('DELETE FROM tasks');
  db.run('DELETE FROM briefs');
  db.run('DELETE FROM oauth_tokens');
  saveDatabase();
}
