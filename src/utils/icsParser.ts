import { CalendarEvent } from '../types';

export function parseIcsContent(icsText: string): CalendarEvent[] {
  const events: CalendarEvent[] = [];
  const lines = icsText.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');

  // Handle line folding (lines beginning with space or tab are continuation of previous line)
  const unfoldedLines: string[] = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if ((line.startsWith(' ') || line.startsWith('\t')) && unfoldedLines.length > 0) {
      unfoldedLines[unfoldedLines.length - 1] += line.slice(1);
    } else {
      unfoldedLines.push(line);
    }
  }

  let inEvent = false;
  let currentEvent: Partial<CalendarEvent> = {};

  for (const line of unfoldedLines) {
    const trimmed = line.trim();
    if (trimmed === 'BEGIN:VEVENT') {
      inEvent = true;
      currentEvent = {
        id: 'ics-' + Math.random().toString(36).substring(2, 9),
        category: 'meeting',
      };
      continue;
    }

    if (trimmed === 'END:VEVENT') {
      if (inEvent && currentEvent.title && currentEvent.date) {
        // Fallback default times if none found
        if (!currentEvent.startTime) currentEvent.startTime = '09:00';
        if (!currentEvent.endTime) {
          // add 1 hour
          const [h, m] = currentEvent.startTime.split(':').map(Number);
          const nextH = Math.min(23, (h || 9) + 1);
          currentEvent.endTime = `${String(nextH).padStart(2, '0')}:${String(m || 0).padStart(2, '0')}`;
        }
        events.push(currentEvent as CalendarEvent);
      }
      inEvent = false;
      currentEvent = {};
      continue;
    }

    if (!inEvent) continue;

    const colonIdx = line.indexOf(':');
    if (colonIdx === -1) continue;

    const rawKey = line.slice(0, colonIdx).trim().toUpperCase();
    const rawVal = line.slice(colonIdx + 1).trim();

    // Key may include parameters like DTSTART;TZID=America/New_York
    const key = rawKey.split(';')[0];

    switch (key) {
      case 'SUMMARY':
        currentEvent.title = unescapeIcsText(rawVal);
        break;

      case 'DESCRIPTION':
        currentEvent.description = unescapeIcsText(rawVal);
        break;

      case 'LOCATION':
        currentEvent.location = unescapeIcsText(rawVal);
        break;

      case 'DTSTART': {
        const { date, time } = parseIcsDateTime(rawVal);
        if (date) currentEvent.date = date;
        if (time) currentEvent.startTime = time;
        break;
      }

      case 'DTEND': {
        const { date, time } = parseIcsDateTime(rawVal);
        if (!currentEvent.date && date) currentEvent.date = date;
        if (time) currentEvent.endTime = time;
        break;
      }

      case 'ATTENDEE': {
        const attendeeName = extractAttendee(rawVal, line);
        if (attendeeName) {
          if (!currentEvent.attendees) currentEvent.attendees = [];
          currentEvent.attendees.push(attendeeName);
        }
        break;
      }
    }
  }

  return events;
}

function unescapeIcsText(text: string): string {
  return text
    .replace(/\\n/g, '\n')
    .replace(/\\N/g, '\n')
    .replace(/\\,/g, ',')
    .replace(/\\;/g, ';')
    .replace(/\\\\/g, '\\');
}

function parseIcsDateTime(val: string): { date: string; time: string } {
  // Format examples:
  // 20261024T093000Z
  // 20261024T093000
  // 20261024
  const cleaned = val.replace(/[^0-9T]/g, '');
  if (cleaned.length >= 8) {
    const year = cleaned.slice(0, 4);
    const month = cleaned.slice(4, 6);
    const day = cleaned.slice(6, 8);
    const date = `${year}-${month}-${day}`;

    if (cleaned.includes('T') && cleaned.length >= 13) {
      const tIdx = cleaned.indexOf('T');
      const hours = cleaned.slice(tIdx + 1, tIdx + 3);
      const minutes = cleaned.slice(tIdx + 3, tIdx + 5);
      return { date, time: `${hours}:${minutes}` };
    }
    return { date, time: '09:00' };
  }
  return { date: '', time: '' };
}

function extractAttendee(val: string, fullLine: string): string {
  // Match CN=Some Name:mailto:...
  const cnMatch = fullLine.match(/CN=([^;:]+)/i);
  if (cnMatch) {
    return cnMatch[1].replace(/["']/g, '');
  }
  // Or mailto:address
  if (val.toLowerCase().startsWith('mailto:')) {
    return val.slice(7);
  }
  return val;
}

export function exportEventsToIcs(events: CalendarEvent[]): string {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Chief AI//AI Chief of Staff//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
  ];

  events.forEach((evt) => {
    const dateStr = (evt.date || '').replace(/-/g, '');
    const startStr = (evt.startTime || '09:00').replace(':', '') + '00';
    const endStr = (evt.endTime || '10:00').replace(':', '') + '00';

    lines.push('BEGIN:VEVENT');
    lines.push(`UID:${evt.id}@chief.ai`);
    lines.push(`DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z`);
    lines.push(`DTSTART:${dateStr}T${startStr}`);
    lines.push(`DTEND:${dateStr}T${endStr}`);
    lines.push(`SUMMARY:${escapeIcsText(evt.title)}`);
    if (evt.location) {
      lines.push(`LOCATION:${escapeIcsText(evt.location)}`);
    }
    if (evt.description) {
      lines.push(`DESCRIPTION:${escapeIcsText(evt.description)}`);
    }
    if (evt.attendees && evt.attendees.length > 0) {
      evt.attendees.forEach((att) => {
        lines.push(`ATTENDEE;CN=${escapeIcsText(att)}:mailto:attendee@example.com`);
      });
    }
    lines.push('END:VEVENT');
  });

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

function escapeIcsText(text: string): string {
  return text.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
}
