import { CalendarEvent, Email, TaskItem, MorningBrief, UserSettings } from '../types';

export interface AppStatus {
  status: string;
  isDemoMode: boolean;
  model: string;
  keys: {
    gemini: boolean;
    googleClientId: boolean;
    googleClientSecret: boolean;
    googleRedirectUri: boolean;
    sessionSecret: boolean;
  };
  isGoogleConnected: boolean;
}

export async function fetchStatus(): Promise<AppStatus> {
  try {
    const res = await fetch('/api/status');
    if (!res.ok) throw new Error('Failed to fetch status');
    return await res.json();
  } catch {
    return {
      status: 'ok',
      isDemoMode: true,
      model: 'gemini-2.5-flash',
      keys: {
        gemini: true,
        googleClientId: false,
        googleClientSecret: false,
        googleRedirectUri: false,
        sessionSecret: false,
      },
      isGoogleConnected: false,
    };
  }
}

export async function fetchSettings(): Promise<UserSettings> {
  try {
    const res = await fetch('/api/settings');
    if (!res.ok) throw new Error('Failed to fetch settings');
    const data = await res.json();
    return {
      name: data.name || 'Alex Morgan',
      workHoursStart: data.workHoursStart || '09:00',
      workHoursEnd: data.workHoursEnd || '18:00',
      replyTone: data.replyTone || 'Professional & Polished',
      briefTime: data.briefTime || '08:00',
    };
  } catch {
    return {
      name: 'Alex Morgan',
      workHoursStart: '09:00',
      workHoursEnd: '18:00',
      replyTone: 'Professional & Polished',
      briefTime: '08:00',
    };
  }
}

export async function updateRemoteSettings(settings: UserSettings): Promise<boolean> {
  try {
    const res = await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function fetchEvents(): Promise<CalendarEvent[]> {
  try {
    const res = await fetch('/api/events');
    if (!res.ok) throw new Error('Failed to fetch events');
    return await res.json();
  } catch {
    return [];
  }
}

export async function createRemoteEvent(event: CalendarEvent): Promise<CalendarEvent> {
  const res = await fetch('/api/events', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(event),
  });
  const data = await res.json();
  return data.event || event;
}

export async function updateRemoteEvent(id: string, event: CalendarEvent): Promise<boolean> {
  const res = await fetch(`/api/events/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(event),
  });
  return res.ok;
}

export async function deleteRemoteEvent(id: string): Promise<boolean> {
  const res = await fetch(`/api/events/${id}`, { method: 'DELETE' });
  return res.ok;
}

export async function fetchEmails(): Promise<Email[]> {
  try {
    const res = await fetch('/api/emails');
    if (!res.ok) throw new Error('Failed to fetch emails');
    return await res.json();
  } catch {
    return [];
  }
}

export async function createRemoteEmail(email: Email): Promise<Email> {
  const res = await fetch('/api/emails', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(email),
  });
  const data = await res.json();
  return data.email || email;
}

export async function updateRemoteEmail(id: string, email: Partial<Email>): Promise<boolean> {
  const res = await fetch(`/api/emails/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(email),
  });
  return res.ok;
}

export async function deleteRemoteEmail(id: string): Promise<boolean> {
  const res = await fetch(`/api/emails/${id}`, { method: 'DELETE' });
  return res.ok;
}

export async function classifyRemoteEmail(id: string): Promise<any> {
  const res = await fetch(`/api/emails/${id}/classify`, { method: 'POST' });
  return await res.json();
}

export async function draftRemoteReply(id: string, tone?: string): Promise<string> {
  const res = await fetch(`/api/emails/${id}/draft-reply`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tone }),
  });
  const data = await res.json();
  return data.replyText || '';
}

export async function batchClassifyRemoteEmails(): Promise<Email[]> {
  const res = await fetch('/api/emails/batch-classify', { method: 'POST' });
  const data = await res.json();
  return data.emails || [];
}

export async function fetchTasks(): Promise<TaskItem[]> {
  try {
    const res = await fetch('/api/tasks');
    if (!res.ok) throw new Error('Failed to fetch tasks');
    return await res.json();
  } catch {
    return [];
  }
}

export async function createRemoteTask(task: TaskItem): Promise<TaskItem> {
  const res = await fetch('/api/tasks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(task),
  });
  const data = await res.json();
  return data.task || task;
}

export async function updateRemoteTask(id: string, task: Partial<TaskItem>): Promise<boolean> {
  const res = await fetch(`/api/tasks/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(task),
  });
  return res.ok;
}

export async function deleteRemoteTask(id: string): Promise<boolean> {
  const res = await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
  return res.ok;
}

export async function fetchTodayBrief(): Promise<MorningBrief | null> {
  try {
    const res = await fetch('/api/brief/today');
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function generateRemoteBrief(): Promise<MorningBrief> {
  const res = await fetch('/api/brief/generate', { method: 'POST' });
  if (!res.ok) throw new Error('Failed to generate brief');
  return await res.json();
}

export async function resetRemoteSampleData(): Promise<any> {
  const res = await fetch('/api/data/reset-sample', { method: 'POST' });
  return await res.json();
}

export async function deleteRemoteAllUserData(): Promise<any> {
  const res = await fetch('/api/data/delete-all', { method: 'POST' });
  return await res.json();
}
