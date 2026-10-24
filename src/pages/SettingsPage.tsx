import React, { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon,
  Save,
  RotateCcw,
  Download,
  Trash2,
  Sparkles,
  ShieldCheck,
  Check,
  Key,
  Clock,
  User,
  MessageSquare,
  Globe,
  AlertTriangle,
  ExternalLink,
  Lock,
  Mail,
  Calendar,
  FileText,
} from 'lucide-react';
import { UserSettings, ReplyTone, CalendarEvent, Email, TaskItem } from '../types';
import { AppStatus } from '../services/apiService';

interface SettingsPageProps {
  settings: UserSettings;
  appStatus: AppStatus | null;
  onSaveSettings: (settings: UserSettings & { timezone?: string }) => void;
  onResetSampleData: () => void;
  onDeleteAllData: () => void;
  allData: {
    events: CalendarEvent[];
    emails: Email[];
    tasks: TaskItem[];
  };
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  settings,
  appStatus,
  onSaveSettings,
  onResetSampleData,
  onDeleteAllData,
  allData,
}) => {
  const [name, setName] = useState(settings.name);
  const [timezone, setTimezone] = useState('America/Los_Angeles');
  const [workHoursStart, setWorkHoursStart] = useState(settings.workHoursStart);
  const [workHoursEnd, setWorkHoursEnd] = useState(settings.workHoursEnd);
  const [replyTone, setReplyTone] = useState<ReplyTone>(settings.replyTone);
  const [briefTime, setBriefTime] = useState(settings.briefTime);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showSetupModal, setShowSetupModal] = useState(false);

  const timezones = [
    { value: 'America/Los_Angeles', label: 'Pacific Time (PT) - America/Los_Angeles' },
    { value: 'America/Denver', label: 'Mountain Time (MT) - America/Denver' },
    { value: 'America/Chicago', label: 'Central Time (CT) - America/Chicago' },
    { value: 'America/New_York', label: 'Eastern Time (ET) - America/New_York' },
    { value: 'Europe/London', label: 'London (GMT/BST) - Europe/London' },
    { value: 'Europe/Paris', label: 'Central European (CET) - Europe/Paris' },
    { value: 'Asia/Tokyo', label: 'Tokyo (JST) - Asia/Tokyo' },
    { value: 'UTC', label: 'Coordinated Universal Time (UTC)' },
  ];

  const tones: { label: ReplyTone; desc: string }[] = [
    {
      label: 'Executive & Direct',
      desc: 'Crisp, decisive, bottom-line focused with zero filler.',
    },
    {
      label: 'Professional & Polished',
      desc: 'Balanced, articulate, courteous corporate communications.',
    },
    {
      label: 'Warm & Collaborative',
      desc: 'Approachable, encouraging, empathetic relationship-building.',
    },
    {
      label: 'Casual & Fast',
      desc: 'Brief, modern, quick mobile-style sign-offs.',
    },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings({
      name: name.trim() || 'Alex Morgan',
      timezone,
      workHoursStart,
      workHoursEnd,
      replyTone,
      briefTime,
    });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleExportBackup = () => {
    const backup = {
      settings: { ...settings, timezone },
      events: allData.events,
      emails: allData.emails,
      tasks: allData.tasks,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chief-ai-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleConnectGoogle = () => {
    if (appStatus?.isDemoMode) {
      setShowSetupModal(true);
    } else {
      // In live mode with keys set, opens OAuth redirect endpoint
      window.location.href = '/api/auth/google';
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Settings & Configuration</h1>
        <p className="text-xs text-slate-500 font-medium">
          Manage your executive profile, working hours, AI tone, Google credentials, and data privacy
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Profile & Working Hours Card */}
        <div className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex items-center gap-2.5 border-b border-slate-100 pb-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
              <User className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Executive Identity & Timezone</h2>
              <p className="text-xs text-slate-500">How Chief addresses you and schedules your daily brief</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                My Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Alex Morgan"
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Timezone
              </label>
              <div className="relative">
                <Globe className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <select
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 pl-9 pr-3.5 py-2.5 text-xs text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  {timezones.map((tz) => (
                    <option key={tz.value} value={tz.value}>
                      {tz.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Morning Brief Time
              </label>
              <input
                type="time"
                value={briefTime}
                onChange={(e) => setBriefTime(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Work Hours Start
              </label>
              <input
                type="time"
                value={workHoursStart}
                onChange={(e) => setWorkHoursStart(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Work Hours End
              </label>
              <input
                type="time"
                value={workHoursEnd}
                onChange={(e) => setWorkHoursEnd(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>
        </div>

        {/* Tone for Draft Replies Card */}
        <div className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex items-center gap-2.5 border-b border-slate-100 pb-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
              <MessageSquare className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Draft Reply Tone</h2>
              <p className="text-xs text-slate-500">Default communication voice when drafting email responses</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {tones.map((t) => {
              const isSelected = replyTone === t.label;
              return (
                <div
                  key={t.label}
                  onClick={() => setReplyTone(t.label)}
                  className={`rounded-2xl border p-4 text-xs transition-all cursor-pointer ${
                    isSelected
                      ? 'border-blue-600 bg-blue-50/50 shadow-xs ring-1 ring-blue-500'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-slate-900">{t.label}</span>
                    <div
                      className={`h-4 w-4 rounded-full border flex items-center justify-center ${
                        isSelected ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-300'
                      }`}
                    >
                      {isSelected && <Check className="h-2.5 w-2.5 stroke-[3]" />}
                    </div>
                  </div>
                  <p className="text-slate-500 text-[11px] leading-relaxed">{t.desc}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Save button bar */}
        <div className="flex items-center justify-between">
          <div>
            {saveSuccess && (
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl">
                <Check className="h-4 w-4" />
                <span>Preferences updated successfully!</span>
              </span>
            )}
          </div>
          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-blue-700 active:scale-95"
          >
            <Save className="h-4 w-4" />
            <span>Save Preferences</span>
          </button>
        </div>
      </form>

      {/* Google Workspace Connection Card */}
      <div className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Mail className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Google Workspace (Gmail & Calendar)</h2>
              <p className="text-xs text-slate-500">Live data synchronization via Google OAuth 2.0</p>
            </div>
          </div>

          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
              appStatus?.isDemoMode
                ? 'bg-amber-100 text-amber-800'
                : 'bg-emerald-100 text-emerald-800'
            }`}
          >
            {appStatus?.isDemoMode ? 'Demo Mode' : 'Connected'}
          </span>
        </div>

        <div className="space-y-3">
          <p className="text-xs text-slate-600 leading-relaxed font-sans">
            Chief connects with minimum requested privileges to read your upcoming calendar events and recent inbox emails. Chief never automatically sends emails and only creates drafts upon your approval.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 space-y-1">
              <span className="font-semibold text-slate-900 flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-blue-600" />
                <span>Google Calendar API</span>
              </span>
              <p className="text-[11px] text-slate-500">
                Scope: <code className="font-mono text-slate-700">calendar.readonly</code> (read events, detect meeting overlaps)
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 space-y-1">
              <span className="font-semibold text-slate-900 flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5 text-blue-600" />
                <span>Gmail API</span>
              </span>
              <p className="text-[11px] text-slate-500">
                Scopes: <code className="font-mono text-slate-700">gmail.readonly</code>, <code className="font-mono text-slate-700">gmail.compose</code> (draft replies only)
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSetupModal(true)}
              className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:underline"
            >
              <FileText className="h-3.5 w-3.5" />
              <span>View SETUP.md Guide</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleConnectGoogle}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-slate-800 active:scale-95"
          >
            <Lock className="h-3.5 w-3.5 text-blue-400" />
            <span>{appStatus?.isDemoMode ? 'Connect Google (OAuth Setup)' : 'Reconnect Google'}</span>
          </button>
        </div>
      </div>

      {/* Security & Data Privacy Card */}
      <div className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-xs space-y-5">
        <div className="flex items-center gap-2.5 border-b border-slate-100 pb-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">Security & Data Deletion</h2>
            <p className="text-xs text-slate-500">Local SQLite storage, token encryption, and full data deletion</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <div className="space-y-1 w-full sm:w-auto">
            <h4 className="text-xs font-bold text-slate-800">Reset to Sample Data</h4>
            <p className="text-[11px] text-slate-500">
              Reloads the 3 realistic executive meetings, 5 triaged emails, and today's action items.
            </p>
          </div>

          <button
            type="button"
            onClick={onResetSampleData}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 active:scale-95 shadow-xs"
          >
            <RotateCcw className="h-3.5 w-3.5 text-blue-600" />
            <span>Reset Sample Data</span>
          </button>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100">
          <div className="space-y-1 w-full sm:w-auto">
            <h4 className="text-xs font-bold text-slate-800">Export All Data (JSON)</h4>
            <p className="text-[11px] text-slate-500">
              Download complete calendar, inbox, tasks, and settings to a JSON file.
            </p>
          </div>

          <button
            type="button"
            onClick={handleExportBackup}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 active:scale-95 shadow-xs"
          >
            <Download className="h-3.5 w-3.5 text-slate-600" />
            <span>Export Backup</span>
          </button>
        </div>

        {/* Delete My Data (Mandatory Security Rule) */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100">
          <div className="space-y-1 w-full sm:w-auto">
            <h4 className="text-xs font-bold text-rose-800">Delete My Data</h4>
            <p className="text-[11px] text-slate-500">
              Permanently clears all stored OAuth tokens, calendar events, emails, tasks, and morning briefs from SQLite.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100 active:scale-95"
          >
            <Trash2 className="h-3.5 w-3.5 text-rose-600" />
            <span>Delete My Data</span>
          </button>
        </div>
      </div>

      {/* Explicit Confirmation Dialog for Delete My Data */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl space-y-4 border border-rose-200">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-rose-100">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Delete All Workspace Data?</h3>
                <p className="text-xs text-slate-500">This action cannot be undone.</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed font-sans">
              Are you sure you want to delete all stored calendar events, inbox messages, tasks, morning briefs, and tokens from the database?
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteAllData();
                  setShowDeleteConfirm(false);
                }}
                className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-rose-700"
              >
                Yes, Delete Everything
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Setup Guide Modal */}
      {showSetupModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="relative flex flex-col max-h-[85vh] w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-6 py-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
                  <FileText className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Connecting Google Calendar & Gmail</h3>
                  <p className="text-xs text-slate-500">Summary from SETUP.md</p>
                </div>
              </div>
              <button
                onClick={() => setShowSetupModal(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs text-slate-700 leading-relaxed">
              <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-amber-900">
                <span className="font-bold">Currently in Demo Mode:</span> Add the 3 Google OAuth credentials to your <code className="font-mono text-amber-950 font-bold">.env</code> file to enable live sync.
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-slate-900 text-sm">Quick Steps:</h4>
                <ol className="list-decimal pl-5 space-y-2 text-slate-600">
                  <li>
                    <span className="font-semibold text-slate-800">Google Cloud Console:</span> Create a project and enable both the <strong>Google Calendar API</strong> and <strong>Gmail API</strong>.
                  </li>
                  <li>
                    <span className="font-semibold text-slate-800">OAuth Consent Screen:</span> Add scopes <code className="font-mono text-slate-700">calendar.readonly</code>, <code className="font-mono text-slate-700">gmail.readonly</code>, and <code className="font-mono text-slate-700">gmail.compose</code>. Whitelist your Gmail as a test user.
                  </li>
                  <li>
                    <span className="font-semibold text-slate-800">Credentials:</span> Create a Web Application OAuth Client ID with authorized redirect URI:
                    <div className="mt-1 font-mono text-[11px] bg-slate-100 p-1.5 rounded border border-slate-200 text-slate-800 select-all">
                      http://localhost:3000/api/auth/google/callback
                    </div>
                  </li>
                  <li>
                    <span className="font-semibold text-slate-800">Update .env:</span> Set <code className="font-mono text-slate-800">GOOGLE_CLIENT_ID</code> and <code className="font-mono text-slate-800">GOOGLE_CLIENT_SECRET</code>.
                  </li>
                </ol>
              </div>

              <p className="text-slate-500 italic pt-2">
                Refer to the root <code className="font-mono text-slate-700">SETUP.md</code> file for complete screenshots and instructions.
              </p>
            </div>

            <div className="border-t border-slate-100 bg-slate-50 px-6 py-3 text-right">
              <button
                onClick={() => setShowSetupModal(false)}
                className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-blue-700"
              >
                Close Guide
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
