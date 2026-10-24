import React, { useState } from 'react';
import {
  Sparkles,
  Copy,
  Check,
  AlertTriangle,
  Clock,
  Mail,
  CheckSquare,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Send,
  Zap,
} from 'lucide-react';
import { MorningBrief, Email, CalendarEvent, UserSettings } from '../types';

interface BriefPageProps {
  brief: MorningBrief | null;
  onGenerateBrief: () => Promise<void>;
  isGenerating: boolean;
  settings: UserSettings;
  todayEventsCount: number;
  inboxCount: number;
  onOpenDraftReplyBySubject: (subject: string) => void;
}

export const BriefPage: React.FC<BriefPageProps> = ({
  brief,
  onGenerateBrief,
  isGenerating,
  settings,
  todayEventsCount,
  inboxCount,
  onOpenDraftReplyBySubject,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopyBrief = async () => {
    if (!brief) return;

    const dateFormatted = new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(new Date());

    let text = `🌅 CHIEF MORNING BRIEF – ${dateFormatted}\n`;
    text += `Prepared for: ${settings.name} (${brief.generatedAt})\n\n`;
    text += `📋 EXECUTIVE SUMMARY:\n${brief.summary}\n\n`;

    text += `🎯 TOP PRIORITIES:\n`;
    brief.priorities.forEach((p, idx) => {
      text += `${idx + 1}. ${p}\n`;
    });
    text += `\n`;

    text += `✉️ EMAILS NEEDING REPLY:\n`;
    if (brief.reply_needed.length === 0) {
      text += `None pending.\n`;
    } else {
      brief.reply_needed.forEach((em) => {
        text += `• ${em.sender}: "${em.subject}"\n  Reason: ${em.reason}\n`;
      });
    }
    text += `\n`;

    text += `⚡ FOLLOW-UPS & ACTION ITEMS:\n`;
    if (brief.followups.length === 0) {
      text += `None recorded.\n`;
    } else {
      brief.followups.forEach((f) => {
        text += `• ${f}\n`;
      });
    }
    text += `\n`;

    text += `⚠️ CONFLICTS & RISKS:\n`;
    if (!brief.conflicts || brief.conflicts.length === 0) {
      text += `No schedule conflicts detected.\n`;
    } else {
      brief.conflicts.forEach((c) => {
        text += `• ${c}\n`;
      });
    }

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch (err) {
      console.error('Failed to copy brief:', err);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Morning Intelligence Brief
            </h1>
            <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-bold text-blue-800">
              Gemini 2.5 Flash
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium">
            AI synthesis of your calendar schedule, email triage, action items, and meeting risks
          </p>
        </div>

        <div className="flex items-center gap-2">
          {brief && (
            <button
              onClick={handleCopyBrief}
              className={`inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-semibold shadow-xs transition-all ${
                copied
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 active:scale-95'
              }`}
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 text-emerald-600" />
                  <span>Copied Brief!</span>
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 text-slate-600" />
                  <span>Copy Brief</span>
                </>
              )}
            </button>
          )}

          <button
            onClick={onGenerateBrief}
            disabled={isGenerating}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2 text-xs font-bold text-white shadow-md shadow-blue-500/20 hover:from-blue-700 hover:to-indigo-700 active:scale-95 disabled:opacity-60 transition-all"
          >
            <Sparkles className={`h-4 w-4 ${isGenerating ? 'animate-spin' : ''}`} />
            <span>{isGenerating ? 'Synthesizing...' : brief ? 'Regenerate Brief' : 'Generate Morning Brief'}</span>
          </button>
        </div>
      </div>

      {/* Input Context Pill Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-slate-50/80 px-4 py-3 text-xs text-slate-600">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 font-medium">
            <Clock className="h-3.5 w-3.5 text-blue-600" />
            <span>{todayEventsCount} Meetings Today</span>
          </div>
          <span className="text-slate-300">•</span>
          <div className="flex items-center gap-1.5 font-medium">
            <Mail className="h-3.5 w-3.5 text-blue-600" />
            <span>{inboxCount} Monitored Emails</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-mono">
          <span>Brief Time: {settings.briefTime}</span>
          <span className="text-slate-300">•</span>
          <span>Target: {settings.name}</span>
        </div>
      </div>

      {/* Main Brief Content Card */}
      {isGenerating ? (
        <div className="rounded-3xl border border-blue-200/80 bg-white p-12 text-center shadow-lg space-y-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 shadow-inner">
            <Sparkles className="h-8 w-8 animate-spin" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-900">
              Chief is reviewing your schedule and inbox...
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Synthesizing today's calendar commitments, detecting overlapping meeting risks, and identifying emails needing executive reply.
            </p>
          </div>
        </div>
      ) : !brief ? (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-16 text-center space-y-4 shadow-xs">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
            <Zap className="h-7 w-7" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-slate-900">No Brief Generated for Today</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Click the button below to generate your custom morning intelligence summary using Gemini 2.5 Flash.
            </p>
          </div>
          <button
            onClick={onGenerateBrief}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-xs font-bold text-white shadow-md hover:bg-blue-700 active:scale-95"
          >
            <Sparkles className="h-4 w-4" />
            <span>Generate Morning Brief</span>
          </button>
        </div>
      ) : (
        <div className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-sm space-y-8">
          {/* Card Top: Brief Title & Timestamp */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-500/20">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">
                  Daily Executive Intelligence
                </h2>
                <p className="text-xs text-slate-500">
                  Generated at {brief.generatedAt} • Chief of Staff
                </p>
              </div>
            </div>

            <button
              onClick={handleCopyBrief}
              className="inline-flex items-center gap-1.5 self-start sm:self-auto rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copied ? 'Copied' : 'Copy Plain Text'}</span>
            </button>
          </div>

          {/* 1. Summary of the Day */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-blue-700 uppercase tracking-wider">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 text-blue-800 text-[10px]">
                1
              </span>
              <span>Executive Summary</span>
            </div>
            <div className="rounded-2xl border border-blue-100 bg-blue-50/40 p-4 text-sm font-medium text-slate-800 leading-relaxed">
              {brief.summary}
            </div>
          </div>

          {/* 2. Top 3 Priorities */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-900 text-white text-[10px]">
                2
              </span>
              <span>Top 3 Daily Priorities</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {brief.priorities.map((priority, idx) => (
                <div
                  key={idx}
                  className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-amber-100 text-amber-900 font-bold text-xs">
                      #{idx + 1}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Priority
                    </span>
                  </div>
                  <p className="text-xs font-bold text-slate-900 leading-snug">
                    {priority}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* 3. Emails Needing Reply */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-900 text-white text-[10px]">
                  3
                </span>
                <span>Emails Needing Reply ({brief.reply_needed.length})</span>
              </div>
            </div>

            {brief.reply_needed.length === 0 ? (
              <div className="rounded-xl border border-slate-200/80 bg-slate-50 p-4 text-xs text-slate-500 italic">
                Inbox clear: No emails currently require executive reply.
              </div>
            ) : (
              <div className="space-y-2.5">
                {brief.reply_needed.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-amber-200/80 bg-amber-50/30 p-4 text-xs transition-all hover:bg-amber-50/60"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 truncate">
                          {item.sender}
                        </span>
                        <span className="rounded bg-amber-200/60 px-1.5 py-0.2 text-[10px] font-bold text-amber-900">
                          Action Required
                        </span>
                      </div>
                      <p className="font-semibold text-slate-800 text-xs">
                        "{item.subject}"
                      </p>
                      <p className="text-slate-600 text-[11px] leading-relaxed">
                        <span className="font-semibold text-slate-700">Reason:</span> {item.reason}
                      </p>
                    </div>

                    <button
                      onClick={() => onOpenDraftReplyBySubject(item.subject)}
                      className="inline-flex items-center gap-1.5 self-start sm:self-center rounded-xl bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 active:scale-95 shrink-0"
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                      <span>Draft Reply</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 4. Follow-ups & Deliverables */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-900 text-white text-[10px]">
                4
              </span>
              <span>Follow-ups & Action Items</span>
            </div>
            <div className="rounded-2xl border border-slate-200/80 bg-slate-50/50 p-4 space-y-2">
              {brief.followups.map((item, idx) => (
                <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-800 font-medium">
                  <div className="mt-1 h-1.5 w-1.5 rounded-full bg-blue-600 shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 5. Conflicts / Risks */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-900 text-white text-[10px]">
                5
              </span>
              <span>Conflicts & Risks</span>
            </div>

            {brief.conflicts && brief.conflicts.length > 0 ? (
              <div className="space-y-2 rounded-2xl border border-rose-300 bg-rose-50/40 p-4">
                {brief.conflicts.map((conflict, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 text-xs text-rose-900 font-medium">
                    <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                    <span>{conflict}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 text-xs text-emerald-800 font-medium">
                <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>No schedule overlaps or critical risks detected on today's calendar.</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
