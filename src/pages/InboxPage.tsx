import React, { useState } from 'react';
import {
  Mail,
  Plus,
  Upload,
  Search,
  Sparkles,
  Trash2,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Tag,
  Clock,
  User,
  AlertCircle,
  Copy,
  Check,
  RefreshCw,
} from 'lucide-react';
import { Email } from '../types';
import { classifyEmailWithGemini } from '../services/geminiService';

interface InboxPageProps {
  emails: Email[];
  onOpenAddEmail: () => void;
  onOpenImportEmail: () => void;
  onOpenDraftReply: (email: Email) => void;
  onDeleteEmail: (id: string) => void;
  onToggleReplied: (id: string) => void;
  onBatchClassifyAll: () => Promise<void>;
  isBatchClassifying?: boolean;
}

export const InboxPage: React.FC<InboxPageProps> = ({
  emails,
  onOpenAddEmail,
  onOpenImportEmail,
  onOpenDraftReply,
  onDeleteEmail,
  onToggleReplied,
  onBatchClassifyAll,
  isBatchClassifying = false,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [expandedEmailId, setExpandedEmailId] = useState<string | null>(null);
  const [copiedDraftId, setCopiedDraftId] = useState<string | null>(null);

  const tags = [
    { id: 'all', label: 'All Emails', count: emails.length },
    { id: 'Needs Reply', label: 'Needs Reply', count: emails.filter((e) => e.category === 'Needs Reply').length },
    { id: 'Urgent', label: 'Urgent', count: emails.filter((e) => e.category === 'Urgent').length },
    { id: 'FYI', label: 'FYI', count: emails.filter((e) => e.category === 'FYI').length },
    { id: 'Newsletter', label: 'Newsletter', count: emails.filter((e) => e.category === 'Newsletter').length },
  ];

  const filteredEmails = emails.filter((em) => {
    const matchesTag = selectedTag === 'all' || em.category === selectedTag;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      em.subject.toLowerCase().includes(q) ||
      em.sender.toLowerCase().includes(q) ||
      em.body.toLowerCase().includes(q);
    return matchesTag && matchesSearch;
  });

  const handleCopyDraft = async (emailId: string, draft: string) => {
    try {
      await navigator.clipboard.writeText(draft);
      setCopiedDraftId(emailId);
      setTimeout(() => setCopiedDraftId(null), 2000);
    } catch (err) {
      console.error(err);
    }
  };

  const getTagBadge = (category: Email['category']) => {
    switch (category) {
      case 'Urgent':
        return (
          <span className="inline-flex items-center gap-1 rounded-md border border-rose-200 bg-rose-50 px-2 py-0.5 text-[11px] font-bold text-rose-700">
            <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse" />
            Urgent
          </span>
        );
      case 'Needs Reply':
        return (
          <span className="inline-flex items-center gap-1 rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-800">
            Needs Reply
          </span>
        );
      case 'FYI':
        return (
          <span className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700">
            FYI
          </span>
        );
      case 'Newsletter':
        return (
          <span className="inline-flex items-center gap-1 rounded-md border border-purple-200 bg-purple-50 px-2 py-0.5 text-[11px] font-semibold text-purple-700">
            Newsletter
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
            {category}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Executive Inbox Triage</h1>
          <p className="text-xs text-slate-500 font-medium">
            AI-classified messages with draft response generation via Gemini 2.5 Flash
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onBatchClassifyAll}
            disabled={isBatchClassifying}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 active:scale-95 disabled:opacity-50"
            title="Re-run Gemini classification on all emails"
          >
            <RefreshCw className={`h-3.5 w-3.5 text-blue-600 ${isBatchClassifying ? 'animate-spin' : ''}`} />
            <span>{isBatchClassifying ? 'Analyzing...' : 'Re-classify All'}</span>
          </button>

          <button
            onClick={onOpenImportEmail}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 active:scale-95"
          >
            <Upload className="h-3.5 w-3.5 text-blue-600" />
            <span>Import CSV/JSON</span>
          </button>

          <button
            onClick={onOpenAddEmail}
            className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 active:scale-95"
          >
            <Plus className="h-4 w-4" />
            <span>Paste Email</span>
          </button>
        </div>
      </div>

      {/* Search & Tag Filter Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search emails by sender, subject, or content..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-9 pr-3.5 py-2 text-xs text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>

        {/* Tag Tabs */}
        <div className="flex flex-wrap items-center gap-1.5">
          {tags.map((tab) => {
            const isActive = selectedTag === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setSelectedTag(tab.id)}
                className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 border border-blue-200/80 shadow-xs'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`ml-1.5 rounded-full px-1.5 py-0.2 text-[10px] ${
                    isActive ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Emails List */}
      <div className="space-y-3">
        {filteredEmails.length === 0 ? (
          <div className="rounded-2xl border border-slate-200/80 bg-white p-16 text-center text-slate-400 space-y-2">
            <Mail className="h-12 w-12 mx-auto text-slate-300" />
            <p className="text-sm font-semibold text-slate-700">No emails match your filter</p>
            <p className="text-xs text-slate-400">Clear search or add an email to start triaging.</p>
          </div>
        ) : (
          filteredEmails.map((email) => {
            const isExpanded = expandedEmailId === email.id;
            const isUrgent = email.category === 'Urgent';

            return (
              <div
                key={email.id}
                className={`rounded-2xl border transition-all ${
                  isUrgent
                    ? 'border-rose-200/90 bg-rose-50/20 shadow-xs'
                    : 'border-slate-200/90 bg-white hover:border-slate-300 shadow-xs'
                }`}
              >
                <div className="p-5 space-y-3">
                  {/* Top line: Sender, Date, Tag badge */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="flex items-center gap-1.5 font-bold text-slate-900 text-sm">
                        <User className="h-3.5 w-3.5 text-slate-400" />
                        <span>{email.sender}</span>
                      </div>
                      <span className="text-slate-300">•</span>
                      <div className="flex items-center gap-1 text-slate-500 text-xs">
                        <Clock className="h-3 w-3" />
                        <span>{email.date}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {getTagBadge(email.category)}
                      {email.isReplied && (
                        <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                          <CheckCircle2 className="h-3 w-3" />
                          <span>Replied</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Subject */}
                  <h3 className="text-base font-bold text-slate-900 tracking-tight">
                    {email.subject}
                  </h3>

                  {/* AI Reason highlight bar */}
                  {email.reason && (
                    <div className="flex items-start gap-2 rounded-xl bg-slate-50 border border-slate-200/60 p-2.5 text-xs text-slate-700">
                      <Sparkles className="h-3.5 w-3.5 text-blue-600 mt-0.5 shrink-0" />
                      <div>
                        <span className="font-semibold text-slate-800">Chief Assessment: </span>
                        <span>{email.reason}</span>
                        {email.suggested_action && (
                          <span className="block text-[11px] text-blue-700 font-medium mt-0.5">
                            Suggested Action: {email.suggested_action}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Body preview / expanded */}
                  <div className="text-xs text-slate-600 leading-relaxed font-sans">
                    {isExpanded ? (
                      <p className="whitespace-pre-wrap">{email.body}</p>
                    ) : (
                      <p className="line-clamp-2">{email.body}</p>
                    )}
                  </div>

                  {/* Cached draft reply snippet if already drafted */}
                  {email.draftReply && (
                    <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-3 text-xs space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-blue-900 flex items-center gap-1.5">
                          <Sparkles className="h-3.5 w-3.5 text-blue-600" />
                          <span>Saved Reply Draft</span>
                        </span>
                        <button
                          onClick={() => handleCopyDraft(email.id, email.draftReply!)}
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 hover:underline"
                        >
                          {copiedDraftId === email.id ? (
                            <>
                              <Check className="h-3 w-3 text-emerald-600" />
                              <span className="text-emerald-700">Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="h-3 w-3" />
                              <span>Copy Draft</span>
                            </>
                          )}
                        </button>
                      </div>
                      <p className="text-slate-700 font-sans line-clamp-2 whitespace-pre-wrap italic">
                        "{email.draftReply}"
                      </p>
                    </div>
                  )}

                  {/* Bottom Action Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
                    <button
                      onClick={() => setExpandedEmailId(isExpanded ? null : email.id)}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-800"
                    >
                      {isExpanded ? (
                        <>
                          <ChevronUp className="h-3.5 w-3.5" />
                          <span>Show Less</span>
                        </>
                      ) : (
                        <>
                          <ChevronDown className="h-3.5 w-3.5" />
                          <span>Read Full Email</span>
                        </>
                      )}
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onToggleReplied(email.id)}
                        className={`rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-colors ${
                          email.isReplied
                            ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                            : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                        }`}
                        title="Toggle replied status"
                      >
                        {email.isReplied ? 'Mark Unreplied' : 'Mark Replied'}
                      </button>

                      <button
                        onClick={() => onOpenDraftReply(email)}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 active:scale-95"
                      >
                        <Sparkles className="h-3.5 w-3.5" />
                        <span>Draft Reply</span>
                      </button>

                      <button
                        onClick={() => onDeleteEmail(email.id)}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                        title="Delete Email"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
