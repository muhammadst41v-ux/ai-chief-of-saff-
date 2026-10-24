import { Email } from '../types';

export function parseEmailsFromJsonOrCsv(text: string): { emails: Email[]; error?: string } {
  const trimmed = text.trim();
  if (!trimmed) {
    return { emails: [], error: 'Input is empty' };
  }

  // Attempt JSON parse first
  if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
    try {
      const parsed = JSON.parse(trimmed);
      const rawList = Array.isArray(parsed) ? parsed : [parsed];
      const validEmails: Email[] = [];

      for (const item of rawList) {
        if (item.subject || item.body || item.sender) {
          validEmails.push({
            id: 'em-' + Math.random().toString(36).substring(2, 9),
            sender: String(item.sender || 'Unknown Sender'),
            subject: String(item.subject || '(No Subject)'),
            body: String(item.body || ''),
            date: String(item.date || 'Today'),
            category: (item.category as Email['category']) || 'Needs Reply',
            priority: (item.priority as Email['priority']) || 'medium',
            needs_reply: Boolean(item.needs_reply ?? true),
            reason: item.reason ? String(item.reason) : undefined,
            suggested_action: item.suggested_action ? String(item.suggested_action) : undefined,
            isRead: false,
            isReplied: false,
          });
        }
      }

      if (validEmails.length > 0) {
        return { emails: validEmails };
      }
    } catch {
      // Fall through to CSV parsing
    }
  }

  // Parse CSV
  try {
    const lines = parseCsvLines(trimmed);
    if (lines.length < 2) {
      return { emails: [], error: 'CSV requires at least a header row and 1 data row.' };
    }

    const headers = lines[0].map((h) => h.trim().toLowerCase());
    const senderIdx = headers.findIndex((h) => h.includes('sender') || h.includes('from'));
    const subjectIdx = headers.findIndex((h) => h.includes('subject') || h.includes('title'));
    const bodyIdx = headers.findIndex((h) => h.includes('body') || h.includes('content') || h.includes('message'));
    const dateIdx = headers.findIndex((h) => h.includes('date') || h.includes('time'));

    const emails: Email[] = [];
    for (let i = 1; i < lines.length; i++) {
      const row = lines[i];
      if (row.length === 0 || (row.length === 1 && !row[0].trim())) continue;

      const sender = senderIdx !== -1 && row[senderIdx] ? row[senderIdx] : 'Unknown Sender';
      const subject = subjectIdx !== -1 && row[subjectIdx] ? row[subjectIdx] : '(No Subject)';
      const body = bodyIdx !== -1 && row[bodyIdx] ? row[bodyIdx] : '';
      const date = dateIdx !== -1 && row[dateIdx] ? row[dateIdx] : 'Today';

      emails.push({
        id: 'em-' + Math.random().toString(36).substring(2, 9),
        sender,
        subject,
        body,
        date,
        category: 'Needs Reply',
        priority: 'medium',
        needs_reply: true,
        isRead: false,
        isReplied: false,
      });
    }

    return { emails };
  } catch (err: unknown) {
    return { emails: [], error: err instanceof Error ? err.message : 'Failed to parse CSV' };
  }
}

// Simple RFC 4180 CSV parser
function parseCsvLines(csv: string): string[][] {
  const result: string[][] = [];
  let row: string[] = [];
  let inQuotes = false;
  let curVal = '';

  for (let i = 0; i < csv.length; i++) {
    const char = csv[i];
    const nextChar = csv[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        curVal += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      row.push(curVal);
      curVal = '';
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++;
      }
      row.push(curVal);
      curVal = '';
      if (row.some((val) => val.trim())) {
        result.push(row);
      }
      row = [];
    } else {
      curVal += char;
    }
  }

  if (curVal || row.length > 0) {
    row.push(curVal);
    if (row.some((val) => val.trim())) {
      result.push(row);
    }
  }

  return result;
}

export function getSampleCsvTemplate(): string {
  return `sender,subject,body,date
"elena.r@enterprise.com","Project Milestones Q4","Please confirm the Q4 deliverable dates before tomorrow noon.","Today, 09:00 AM"
"jordan@techpartners.io","Question about API integration limits","Hi, does the enterprise tier support 100k requests per minute or should we provision dedicated instances?","Today, 10:15 AM"
"news@fintechdigest.com","Fintech Weekly Digest","Top 10 executive moves in banking technology this week.","Yesterday, 04:00 PM"`;
}

export function getSampleJsonTemplate(): string {
  return JSON.stringify(
    [
      {
        sender: 'elena.r@enterprise.com',
        subject: 'Project Milestones Q4',
        body: 'Please confirm the Q4 deliverable dates before tomorrow noon.',
        date: 'Today, 09:00 AM',
      },
      {
        sender: 'jordan@techpartners.io',
        subject: 'Question about API integration limits',
        body: 'Hi, does the enterprise tier support 100k requests per minute or should we provision dedicated instances?',
        date: 'Today, 10:15 AM',
      },
    ],
    null,
    2
  );
}
