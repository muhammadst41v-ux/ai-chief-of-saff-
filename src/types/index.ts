export interface CalendarEvent {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm (24h)
  endTime: string; // HH:mm (24h)
  location?: string;
  description?: string;
  attendees?: string[];
  category?: 'meeting' | 'deep_work' | 'personal' | 'call';
}

export interface Email {
  id: string;
  sender: string;
  subject: string;
  body: string;
  date: string;
  category: 'Needs Reply' | 'FYI' | 'Urgent' | 'Newsletter';
  priority: 'high' | 'medium' | 'low';
  needs_reply: boolean;
  reason?: string;
  suggested_action?: string;
  isRead?: boolean;
  isReplied?: boolean;
  draftReply?: string;
}

export interface TaskItem {
  id: string;
  title: string;
  completed: boolean;
  dueDate: string; // YYYY-MM-DD or readable
  priority: 'urgent' | 'high' | 'medium' | 'low';
  source?: string;
  createdAt: string;
}

export interface MorningBrief {
  summary: string;
  priorities: string[];
  reply_needed: Array<{
    subject: string;
    sender: string;
    reason: string;
  }>;
  followups: string[];
  conflicts: string[];
  generatedAt: string;
}

export type ReplyTone =
  | 'Executive & Direct'
  | 'Professional & Polished'
  | 'Warm & Collaborative'
  | 'Casual & Fast';

export interface UserSettings {
  name: string;
  workHoursStart: string; // "09:00"
  workHoursEnd: string; // "18:00"
  replyTone: ReplyTone;
  briefTime: string; // "08:00 AM"
}
