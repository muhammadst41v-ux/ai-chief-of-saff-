import { CalendarEvent, Email, TaskItem, UserSettings } from '../types';

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

export function getDefaultSettings(): UserSettings {
  return {
    name: 'Alex Morgan',
    workHoursStart: '09:00',
    workHoursEnd: '18:00',
    replyTone: 'Professional & Polished',
    briefTime: '08:00 AM',
  };
}

export function getDefaultEvents(): CalendarEvent[] {
  const today = getTodayDateString(0);
  const tomorrow = getTodayDateString(1);

  return [
    {
      id: 'evt-1',
      title: 'Q4 Product Strategy & Roadmap Review',
      date: today,
      startTime: '09:30',
      endTime: '10:30',
      location: 'Conference Room 4A / Zoom',
      description: 'Review final sprint deliverables, OKR pacing, and executive demo timeline.',
      attendees: ['Elena Rostova (VP Product)', 'Marcus Vance (Enterprise Lead)', 'Sarah Chen (UX Lead)'],
      category: 'meeting',
    },
    {
      id: 'evt-2',
      title: '1:1 Sync with Sarah (Lead Designer)',
      date: today,
      startTime: '13:00',
      endTime: '13:45',
      location: 'Huddle Pod B / Google Meet',
      description: 'Review revised dashboard layout tokens and design system decisions.',
      attendees: ['Sarah Chen (UX Lead)'],
      category: 'meeting',
    },
    {
      id: 'evt-3',
      title: 'Executive Leadership Sync: Budget & Growth',
      date: today,
      startTime: '15:30',
      endTime: '16:30',
      location: 'Executive Boardroom',
      description: 'Quarterly financial performance, headcount requests, and board meeting prep.',
      attendees: ['David Vance (CEO)', 'Claire Dupont (CFO)', 'Engineering VP'],
      category: 'meeting',
    },
    {
      id: 'evt-4',
      title: 'Deep Work: Customer Proposal Finalization',
      date: tomorrow,
      startTime: '10:00',
      endTime: '12:00',
      location: 'Private Office',
      description: 'Focus block for preparing enterprise responses and contract addendums.',
      attendees: [],
      category: 'deep_work',
    },
  ];
}

export function getDefaultEmails(): Email[] {
  return [
    {
      id: 'em-1',
      sender: 'Marcus Vance <marcus.v@acmecorp.com>',
      subject: 'URGENT: Enterprise Contract Terms & Sign-off Deadline',
      date: 'Today, 08:14 AM',
      body: `Hi Alex,

We need your final executive sign-off on the Master Services Agreement for Acme Corp before 2:00 PM today to close the Q4 deal. Legal has approved clauses 4 and 8 with the indemnification cap we agreed upon. 

Can you confirm approval or flag any remaining blockers asap so we can route for electronic signature?

Best regards,
Marcus Vance
Head of Strategic Partnerships | Acme Corp`,
      category: 'Urgent',
      priority: 'high',
      needs_reply: true,
      reason: 'Requires final executive contract sign-off before the 2:00 PM enterprise deal deadline.',
      suggested_action: 'Review clauses 4 & 8 and approve via reply or flag blockers.',
      isRead: false,
      isReplied: false,
    },
    {
      id: 'em-2',
      sender: 'Sarah Chen <sarah.c@designcorp.io>',
      subject: 'Design system refresh: feedback needed before 1:1',
      date: 'Today, 07:45 AM',
      body: `Hey Alex,

I just published the revised dashboard tokens and Chief of Staff components to the Figma preview workspace.

Could you take a quick look before our 1:00 PM sync today? The main question for you is whether you prefer the high-density table view or modular cards for the morning inbox triage view.

Preview link: https://figma.com/file/chief-mockups-v2

Talk soon,
Sarah`,
      category: 'Needs Reply',
      priority: 'medium',
      needs_reply: true,
      reason: 'Asks for design preference on high-density vs modular card layout ahead of your 1:00 PM meeting.',
      suggested_action: 'Check preview link and send quick preference to Sarah.',
      isRead: false,
      isReplied: false,
    },
    {
      id: 'em-3',
      sender: 'David Miller <d.miller@summit-vc.com>',
      subject: 'Board Deck revisions & preliminary CAC metrics',
      date: 'Yesterday, 06:30 PM',
      body: `Alex,

Thanks for sending over the draft board presentation deck. The CAC payback graphs look solid, but the audit committee requested clarification on whether the European expansion numbers are fully finalized or still preliminary.

No immediate rush, but having this confirmed before Thursday morning would be ideal.

Best,
David Miller
Partner | Summit Capital`,
      category: 'Needs Reply',
      priority: 'medium',
      needs_reply: true,
      reason: 'Requests clarification on whether EU expansion numbers in board deck are final or preliminary.',
      suggested_action: 'Confirm audit status with finance and reply to David.',
      isRead: true,
      isReplied: false,
    },
    {
      id: 'em-4',
      sender: 'DevOps & Reliability Bot <bot@cloudinfra.internal>',
      subject: 'FYI: Core Cloud Cluster Migration Completed Successfully',
      date: 'Today, 06:00 AM',
      body: `All Systems Status Notification:

Cluster migration for US-East and EU-Central finished at 05:45 UTC without downtime. Database read replicas and caching layers switched seamlessly. 

- P99 latency: 38ms (down from 45ms)
- Error rate: 0.001%
- Status: Fully Healthy

No action required from leadership.`,
      category: 'FYI',
      priority: 'low',
      needs_reply: false,
      reason: 'Automated engineering notification confirming scheduled cloud migration was successful.',
      suggested_action: 'File as FYI; no response needed.',
      isRead: true,
      isReplied: false,
    },
    {
      id: 'em-5',
      sender: 'Executive Operations Digest <dispatch@chiefbrief.tech>',
      subject: 'Weekly Brief: Structuring the Modern AI Executive Suite',
      date: 'Today, 05:15 AM',
      body: `Good morning Alex,

In this week's executive edition:
1. Frameworks for delegating email triage to automated LLM agents.
2. How top operating executives protect 40% of their calendar for unscheduled deep thought.
3. Emerging patterns for daily morning synthesis vs reactive inbox scanning.

Click here to read the full 6-minute executive briefing.`,
      category: 'Newsletter',
      priority: 'low',
      needs_reply: false,
      reason: 'Weekly industry newsletter covering executive operations and time management.',
      suggested_action: 'Skim when free or archive.',
      isRead: true,
      isReplied: false,
    },
  ];
}

export function getDefaultTasks(): TaskItem[] {
  const today = getTodayDateString(0);
  const tomorrow = getTodayDateString(1);

  return [
    {
      id: 'tsk-1',
      title: 'Reply to Marcus: Final sign-off on Acme Corp contract terms before 2 PM',
      completed: false,
      dueDate: today,
      priority: 'urgent',
      source: 'Marcus Vance email',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'tsk-2',
      title: 'Review Figma design system tokens before 1:00 PM sync with Sarah',
      completed: false,
      dueDate: today,
      priority: 'high',
      source: 'Sarah Chen email',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'tsk-3',
      title: 'Prepare talking points for 3:30 PM Executive Leadership sync',
      completed: false,
      dueDate: today,
      priority: 'high',
      source: 'Calendar: Executive Sync',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'tsk-4',
      title: 'Confirm European expansion CAC audit numbers with Claire before Thursday',
      completed: false,
      dueDate: tomorrow,
      priority: 'medium',
      source: 'David Miller email',
      createdAt: new Date().toISOString(),
    },
  ];
}
