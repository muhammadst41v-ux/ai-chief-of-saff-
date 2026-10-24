import { CalendarEvent, Email, MorningBrief } from '../types';

export interface EmailClassificationResult {
  category: 'Needs Reply' | 'FYI' | 'Urgent' | 'Newsletter';
  priority: 'high' | 'medium' | 'low';
  needs_reply: boolean;
  reason: string;
  suggested_action: string;
}

export async function checkGeminiHealth(): Promise<{ status: string; hasKey: boolean; model: string }> {
  try {
    const res = await fetch('/api/gemini/health');
    if (!res.ok) throw new Error('Health check non-200');
    return await res.json();
  } catch {
    return { status: 'offline', hasKey: false, model: 'gemini-2.5-flash' };
  }
}

export async function classifyEmailWithGemini(email: Partial<Email>): Promise<EmailClassificationResult> {
  const fallback: EmailClassificationResult = {
    category:
      (email.subject || '').toLowerCase().includes('urgent') || (email.subject || '').toLowerCase().includes('asap')
        ? 'Urgent'
        : (email.subject || '').toLowerCase().includes('newsletter') || (email.subject || '').toLowerCase().includes('digest')
        ? 'Newsletter'
        : (email.body || '').includes('?') || (email.subject || '').toLowerCase().includes('question')
        ? 'Needs Reply'
        : 'FYI',
    priority: (email.subject || '').toLowerCase().includes('urgent') ? 'high' : 'medium',
    needs_reply:
      (email.subject || '').toLowerCase().includes('urgent') ||
      (email.body || '').includes('?') ||
      (email.subject || '').toLowerCase().includes('review'),
    reason: 'Heuristic analysis based on message subject and content keywords.',
    suggested_action: 'Review message details and respond if required.',
  };

  try {
    const res = await fetch('/api/gemini/classify-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });

    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    const data = await res.json();
    return {
      category: data.category || fallback.category,
      priority: data.priority || fallback.priority,
      needs_reply: typeof data.needs_reply === 'boolean' ? data.needs_reply : fallback.needs_reply,
      reason: data.reason || fallback.reason,
      suggested_action: data.suggested_action || fallback.suggested_action,
    };
  } catch (err) {
    console.warn('Gemini classification fallback triggered:', err);
    return fallback;
  }
}

export async function draftReplyWithGemini(
  email: Partial<Email>,
  tone: string,
  userName: string
): Promise<string> {
  const fallback = `Hi ${email.sender?.split(' ')[0] || 'there'},\n\nThank you for reaching out regarding "${email.subject}". I've received your note and will review it carefully. I'll get back to you with next steps shortly.\n\nBest regards,\n${userName}`;

  try {
    const res = await fetch('/api/gemini/draft-reply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, tone, userName }),
    });

    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    const data = await res.json();
    return data.replyText || fallback;
  } catch (err) {
    console.warn('Gemini draft reply fallback triggered:', err);
    return fallback;
  }
}

export async function generateMorningBriefWithGemini(
  events: CalendarEvent[],
  emails: Email[],
  userName: string,
  dateStr: string
): Promise<MorningBrief> {
  const replyNeededFallback = emails
    .filter((e) => e.needs_reply || e.category === 'Needs Reply' || e.category === 'Urgent')
    .map((e) => ({
      subject: e.subject,
      sender: e.sender,
      reason: e.reason || 'Pending action or reply requested in email body.',
    }));

  // Detect conflicts locally
  const conflicts: string[] = [];
  const sortedEvents = [...events].sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''));
  for (let i = 0; i < sortedEvents.length - 1; i++) {
    const cur = sortedEvents[i];
    const nxt = sortedEvents[i + 1];
    if (cur.endTime && nxt.startTime && cur.endTime > nxt.startTime) {
      conflicts.push(`Schedule overlap: "${cur.title}" (${cur.startTime}-${cur.endTime}) overlaps with "${nxt.title}" (${nxt.startTime}-${nxt.endTime}).`);
    }
  }

  const fallbackBrief: MorningBrief = {
    summary: `Good morning, ${userName}. Today includes ${events.length} scheduled event${events.length === 1 ? '' : 's'} and ${replyNeededFallback.length} priority message${replyNeededFallback.length === 1 ? '' : 's'} requiring executive attention.`,
    priorities: [
      events[0]?.title ? `Prepare for key meeting: ${events[0].title}` : 'Review calendar commitments',
      replyNeededFallback[0]?.subject ? `Respond to ${replyNeededFallback[0].sender}: "${replyNeededFallback[0].subject}"` : 'Clear pending inbox replies',
      'Follow up on outstanding deliverables and maintain strategic focus',
    ].slice(0, 3),
    reply_needed: replyNeededFallback.slice(0, 5),
    followups: [
      'Confirm meeting agenda items with key attendees',
      'Track action items from executive sessions',
    ],
    conflicts: conflicts,
    generatedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  };

  try {
    const res = await fetch('/api/gemini/generate-brief', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ events, emails, userName, dateStr }),
    });

    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    const data = await res.json();
    return {
      summary: data.summary || fallbackBrief.summary,
      priorities: Array.isArray(data.priorities) && data.priorities.length > 0 ? data.priorities : fallbackBrief.priorities,
      reply_needed: Array.isArray(data.reply_needed) ? data.reply_needed : fallbackBrief.reply_needed,
      followups: Array.isArray(data.followups) ? data.followups : fallbackBrief.followups,
      conflicts: Array.isArray(data.conflicts) ? data.conflicts : fallbackBrief.conflicts,
      generatedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
  } catch (err) {
    console.warn('Gemini generate brief fallback triggered:', err);
    return fallbackBrief;
  }
}
