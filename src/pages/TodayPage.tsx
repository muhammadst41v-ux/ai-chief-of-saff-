import React, { useState } from 'react';
import {
  Calendar,
  Mail,
  CheckSquare,
  Sparkles,
  Clock,
  ArrowRight,
  AlertCircle,
  MapPin,
  Users,
  Check,
  Plus,
  Zap,
} from 'lucide-react';
import { CalendarEvent, Email, TaskItem, MorningBrief, UserSettings } from '../types';
import { getTodayDateString } from '../utils/sampleData';
import { PageId } from '../components/Sidebar';

interface TodayPageProps {
  events: CalendarEvent[];
  emails: Email[];
  tasks: TaskItem[];
  brief: MorningBrief | null;
  settings: UserSettings;
  onNavigate: (page: PageId) => void;
  onToggleTask: (taskId: string) => void;
  onQuickAddTask: (title: string) => void;
  onOpenDraftReply: (email: Email) => void;
  onGenerateBrief: () => void;
  isGeneratingBrief?: boolean;
}

export const TodayPage: React.FC<TodayPageProps> = ({
  events,
  emails,
  tasks,
  brief,
  settings,
  onNavigate,
  onToggleTask,
  onQuickAddTask,
  onOpenDraftReply,
  onGenerateBrief,
  isGeneratingBrief = false,
}) => {
  const [quickTaskInput, setQuickTaskInput] = useState('');

  const todayStr = getTodayDateString(0);
  const todayEvents = events
    .filter((e) => e.date === todayStr)
    .sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''));

  const emailsNeedingReply = emails.filter((e) => e.needs_reply || e.category === 'Needs Reply' || e.category === 'Urgent');
  const urgentEmails = emails.filter((e) => e.category === 'Urgent' || e.priority === 'high');
  const pendingTasks = tasks.filter((t) => !t.completed);

  // Time greeting helper
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const todayFormatted = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date());

  const handleQuickAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTaskInput.trim()) return;
    onQuickAddTask(quickTaskInput.trim());
    setQuickTaskInput('');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-3xl bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 p-6 sm:p-8 text-white shadow-xl shadow-blue-950/10">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-blue-200 backdrop-blur-md">
            <Sparkles className="h-3.5 w-3.5 text-blue-300" />
            <span>AI Executive Briefing Ready</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            {greeting}, {settings.name.split(' ')[0]}!
          </h1>
          <p className="text-sm text-blue-200/90 font-medium">{todayFormatted}</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onGenerateBrief}
            disabled={isGeneratingBrief}
            className="group relative inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-bold text-blue-950 shadow-md transition-all hover:bg-blue-50 active:scale-95 disabled:opacity-60"
          >
            <Sparkles className={`h-4 w-4 text-blue-600 ${isGeneratingBrief ? 'animate-spin' : 'group-hover:rotate-12 transition-transform'}`} />
            <span>{isGeneratingBrief ? 'Synthesizing...' : 'Run Morning Brief'}</span>
          </button>
        </div>
      </div>

      {/* 3 Core Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card 1: Meetings Today */}
        <div
          onClick={() => onNavigate('calendar')}
          className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition-all hover:shadow-md hover:border-blue-300 cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Meetings Today
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 transition-colors group-hover:bg-blue-600 group-hover:text-white">
              <Calendar className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {todayEvents.length}
            </span>
            <span className="text-xs text-slate-500 font-medium">scheduled</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs pt-3 border-t border-slate-100">
            <span className="text-slate-600 truncate font-medium">
              {todayEvents[0] ? `Next: ${todayEvents[0].startTime} ${todayEvents[0].title}` : 'No remaining meetings'}
            </span>
            <span className="text-blue-600 font-semibold group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5 shrink-0">
              View <ArrowRight className="h-3 w-3" />
            </span>
          </div>
        </div>

        {/* Card 2: Emails Need Reply */}
        <div
          onClick={() => onNavigate('inbox')}
          className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition-all hover:shadow-md hover:border-amber-300 cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Emails Need Reply
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600 transition-colors group-hover:bg-amber-600 group-hover:text-white">
              <Mail className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {emailsNeedingReply.length}
            </span>
            {urgentEmails.length > 0 && (
              <span className="inline-flex items-center rounded-full bg-rose-100 px-2 py-0.5 text-[11px] font-bold text-rose-700">
                {urgentEmails.length} urgent
              </span>
            )}
          </div>
          <div className="mt-3 flex items-center justify-between text-xs pt-3 border-t border-slate-100">
            <span className="text-slate-600 truncate font-medium">
              {urgentEmails[0] ? `Urgent: ${urgentEmails[0].subject}` : 'Inbox monitored'}
            </span>
            <span className="text-amber-700 font-semibold group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5 shrink-0">
              Triage <ArrowRight className="h-3 w-3" />
            </span>
          </div>
        </div>

        {/* Card 3: Follow-ups / Action Items */}
        <div
          onClick={() => onNavigate('tasks')}
          className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition-all hover:shadow-md hover:border-emerald-300 cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Follow-ups & Tasks
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 transition-colors group-hover:bg-emerald-600 group-hover:text-white">
              <CheckSquare className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {pendingTasks.length}
            </span>
            <span className="text-xs text-slate-500 font-medium">active items</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs pt-3 border-t border-slate-100">
            <span className="text-slate-600 truncate font-medium">
              {tasks.filter((t) => t.completed).length} completed today
            </span>
            <span className="text-emerald-700 font-semibold group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5 shrink-0">
              Tasks <ArrowRight className="h-3 w-3" />
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid: Today's Schedule + Action Items */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Schedule Timeline (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
                <Clock className="h-4 w-4" />
              </div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight">Today's Schedule</h2>
            </div>
            <button
              onClick={() => onNavigate('calendar')}
              className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700"
            >
              <span>View full calendar</span>
              <ArrowRight className="h-3 w-3" />
            </button>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
            {todayEvents.length === 0 ? (
              <div className="py-12 text-center text-slate-500">
                <Calendar className="h-10 w-10 mx-auto text-slate-300 mb-2" />
                <p className="text-sm font-semibold text-slate-700">No meetings scheduled for today</p>
                <p className="text-xs text-slate-400 mt-1">Enjoy focused deep work time.</p>
              </div>
            ) : (
              <div className="relative border-l-2 border-slate-100 ml-4 pl-6 space-y-6 my-2">
                {todayEvents.map((event, idx) => (
                  <div key={event.id} className="relative group">
                    {/* Timeline bullet */}
                    <div className="absolute -left-[31px] top-1.5 flex h-4 w-4 items-center justify-center rounded-full border-2 border-white bg-blue-600 shadow-xs ring-2 ring-blue-100" />

                    <div className="rounded-xl border border-slate-200/90 bg-slate-50/50 p-4 transition-all hover:bg-white hover:shadow-xs hover:border-slate-300">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2 text-xs font-bold text-blue-700">
                          <Clock className="h-3.5 w-3.5" />
                          <span>
                            {event.startTime} - {event.endTime}
                          </span>
                        </div>
                        <span className="rounded-md bg-white border border-slate-200/80 px-2 py-0.5 text-[10px] font-semibold text-slate-700 capitalize">
                          {event.category || 'meeting'}
                        </span>
                      </div>

                      <h4 className="mt-1.5 text-sm font-bold text-slate-900">
                        {event.title}
                      </h4>

                      {event.location && (
                        <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-600">
                          <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{event.location}</span>
                        </div>
                      )}

                      {event.attendees && event.attendees.length > 0 && (
                        <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
                          <Users className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{event.attendees.join(', ')}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Inbox Peek Card */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
                  <Mail className="h-4 w-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">Urgent & Reply Needed</h3>
              </div>
              <button
                onClick={() => onNavigate('inbox')}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                <span>View all ({emails.length})</span>
                <ArrowRight className="h-3 w-3" />
              </button>
            </div>

            <div className="space-y-2">
              {emailsNeedingReply.slice(0, 3).map((email) => (
                <div
                  key={email.id}
                  onClick={() => onOpenDraftReply(email)}
                  className={`flex items-start justify-between gap-3 rounded-xl border p-3.5 text-xs transition-all cursor-pointer ${
                    email.category === 'Urgent'
                      ? 'border-rose-200 bg-rose-50/40 hover:bg-rose-50/80'
                      : 'border-slate-200 bg-slate-50/50 hover:bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-900 truncate">
                        {email.sender.split('<')[0]}
                      </span>
                      <span
                        className={`rounded px-1.5 py-0.2 text-[10px] font-bold ${
                          email.category === 'Urgent'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {email.category}
                      </span>
                    </div>
                    <p className="font-medium text-slate-800 truncate">{email.subject}</p>
                    {email.reason && (
                      <p className="text-[11px] text-slate-500 line-clamp-1">
                        Reason: {email.reason}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenDraftReply(email);
                    }}
                    className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-2.5 py-1 text-[11px] font-semibold text-white shadow-xs hover:bg-blue-700 active:scale-95 shrink-0"
                  >
                    <Sparkles className="h-3 w-3" />
                    <span>Draft</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Action Items List (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
                <CheckSquare className="h-4 w-4" />
              </div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight">Action Items</h2>
            </div>
            <button
              onClick={() => onNavigate('tasks')}
              className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700"
            >
              <span>View all ({tasks.length})</span>
              <ArrowRight className="h-3 w-3" />
            </button>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs space-y-4">
            {/* Quick add input */}
            <form onSubmit={handleQuickAdd} className="flex gap-2">
              <input
                type="text"
                placeholder="Add a new action item..."
                value={quickTaskInput}
                onChange={(e) => setQuickTaskInput(e.target.value)}
                className="flex-1 rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
              <button
                type="submit"
                className="inline-flex items-center gap-1 rounded-xl bg-blue-600 px-3 py-2 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 active:scale-95"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add</span>
              </button>
            </form>

            {/* Tasks list */}
            <div className="space-y-2.5">
              {tasks.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs">
                  No action items logged. Add one above!
                </div>
              ) : (
                tasks.map((task) => {
                  const isUrgent = task.priority === 'urgent';
                  const isHigh = task.priority === 'high';

                  return (
                    <div
                      key={task.id}
                      onClick={() => onToggleTask(task.id)}
                      className={`group flex items-start gap-3 rounded-xl border p-3 text-xs transition-all cursor-pointer ${
                        task.completed
                          ? 'border-slate-100 bg-slate-50/50 opacity-60'
                          : isUrgent
                          ? 'border-amber-200 bg-amber-50/50 hover:bg-amber-50/80'
                          : 'border-slate-200/90 bg-white hover:border-slate-300 hover:bg-slate-50/40'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleTask(task.id);
                        }}
                        className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-md border transition-colors ${
                          task.completed
                            ? 'border-emerald-600 bg-emerald-600 text-white'
                            : 'border-slate-300 bg-white group-hover:border-blue-500'
                        }`}
                      >
                        {task.completed && <Check className="h-3 w-3 stroke-[3]" />}
                      </button>

                      <div className="min-w-0 flex-1">
                        <p
                          className={`font-semibold leading-relaxed ${
                            task.completed
                              ? 'line-through text-slate-400'
                              : 'text-slate-900'
                          }`}
                        >
                          {task.title}
                        </p>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-[10px] text-slate-500">
                          {isUrgent && (
                            <span className="font-bold text-rose-700 bg-rose-100 px-1.5 py-0.2 rounded">
                              URGENT
                            </span>
                          )}
                          {isHigh && (
                            <span className="font-semibold text-amber-700 bg-amber-100 px-1.5 py-0.2 rounded">
                              HIGH
                            </span>
                          )}
                          {task.dueDate && <span>Due: {task.dueDate}</span>}
                          {task.source && (
                            <span className="text-slate-400 truncate">• {task.source}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Morning Brief Snippet Card */}
          {brief ? (
            <div
              onClick={() => onNavigate('brief')}
              className="rounded-2xl border border-blue-200/80 bg-blue-50/40 p-5 shadow-xs hover:border-blue-300 cursor-pointer transition-all space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-blue-600" />
                  <span className="text-xs font-bold text-blue-900 uppercase tracking-wider">
                    Morning Brief ({brief.generatedAt})
                  </span>
                </div>
                <span className="text-xs font-semibold text-blue-600 flex items-center gap-0.5">
                  Full brief <ArrowRight className="h-3 w-3" />
                </span>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed font-medium">
                {brief.summary}
              </p>
              {brief.priorities && brief.priorities.length > 0 && (
                <div className="space-y-1 pt-1 border-t border-blue-100">
                  <span className="text-[11px] font-semibold text-blue-800">Top Priority:</span>
                  <p className="text-xs font-medium text-slate-800">
                    • {brief.priorities[0]}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/50 p-5 text-center space-y-2">
              <Zap className="h-6 w-6 text-blue-600 mx-auto" />
              <p className="text-xs font-bold text-slate-800">No Morning Brief generated yet</p>
              <p className="text-[11px] text-slate-500">
                Click "Run Morning Brief" to have Gemini synthesize your calendar & inbox.
              </p>
              <button
                onClick={onGenerateBrief}
                disabled={isGeneratingBrief}
                className="mt-1 inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 active:scale-95 disabled:opacity-60"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>Generate Brief Now</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
