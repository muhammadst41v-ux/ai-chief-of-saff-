import { CalendarEvent, Email, TaskItem, MorningBrief, UserSettings } from '../types';
import { getDefaultEvents, getDefaultEmails, getDefaultTasks, getDefaultSettings } from './sampleData';

const STORAGE_KEYS = {
  EVENTS: 'chief_calendar_events_v1',
  EMAILS: 'chief_inbox_emails_v1',
  TASKS: 'chief_tasks_v1',
  BRIEF: 'chief_morning_brief_v1',
  SETTINGS: 'chief_user_settings_v1',
};

export function loadSettings(): UserSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (!raw) {
      const def = getDefaultSettings();
      saveSettings(def);
      return def;
    }
    return JSON.parse(raw);
  } catch {
    return getDefaultSettings();
  }
}

export function saveSettings(settings: UserSettings): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  } catch (err) {
    console.error('Failed to save settings to localStorage:', err);
  }
}

export function loadEvents(): CalendarEvent[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.EVENTS);
    if (!raw) {
      const def = getDefaultEvents();
      saveEvents(def);
      return def;
    }
    return JSON.parse(raw);
  } catch {
    return getDefaultEvents();
  }
}

export function saveEvents(events: CalendarEvent[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(events));
  } catch (err) {
    console.error('Failed to save events to localStorage:', err);
  }
}

export function loadEmails(): Email[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.EMAILS);
    if (!raw) {
      const def = getDefaultEmails();
      saveEmails(def);
      return def;
    }
    return JSON.parse(raw);
  } catch {
    return getDefaultEmails();
  }
}

export function saveEmails(emails: Email[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.EMAILS, JSON.stringify(emails));
  } catch (err) {
    console.error('Failed to save emails to localStorage:', err);
  }
}

export function loadTasks(): TaskItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.TASKS);
    if (!raw) {
      const def = getDefaultTasks();
      saveTasks(def);
      return def;
    }
    return JSON.parse(raw);
  } catch {
    return getDefaultTasks();
  }
}

export function saveTasks(tasks: TaskItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
  } catch (err) {
    console.error('Failed to save tasks to localStorage:', err);
  }
}

export function loadBrief(): MorningBrief | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.BRIEF);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveBrief(brief: MorningBrief | null): void {
  try {
    if (!brief) {
      localStorage.removeItem(STORAGE_KEYS.BRIEF);
    } else {
      localStorage.setItem(STORAGE_KEYS.BRIEF, JSON.stringify(brief));
    }
  } catch (err) {
    console.error('Failed to save brief to localStorage:', err);
  }
}

export function resetAllDataToDefault(): {
  settings: UserSettings;
  events: CalendarEvent[];
  emails: Email[];
  tasks: TaskItem[];
  brief: null;
} {
  const settings = getDefaultSettings();
  const events = getDefaultEvents();
  const emails = getDefaultEmails();
  const tasks = getDefaultTasks();

  saveSettings(settings);
  saveEvents(events);
  saveEmails(emails);
  saveTasks(tasks);
  saveBrief(null);

  return {
    settings,
    events,
    emails,
    tasks,
    brief: null,
  };
}
