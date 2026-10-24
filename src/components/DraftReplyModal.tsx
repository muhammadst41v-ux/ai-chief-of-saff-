import React, { useState, useEffect } from 'react';
import { X, Copy, Check, Sparkles, RefreshCw, Send, CheckCircle2, User, Clock, ArrowRight } from 'lucide-react';
import { Email, ReplyTone } from '../types';
import { draftReplyWithGemini } from '../services/geminiService';

interface DraftReplyModalProps {
  email: Email | null;
  onClose: () => void;
  userName: string;
  defaultTone: ReplyTone;
  onSaveDraft: (emailId: string, draft: string, markReplied?: boolean) => void;
}

export const DraftReplyModal: React.FC<DraftReplyModalProps> = ({
  email,
  onClose,
  userName,
  defaultTone,
  onSaveDraft,
}) => {
  const [selectedTone, setSelectedTone] = useState<ReplyTone>(defaultTone);
  const [draftText, setDraftText] = useState<string>('');
  const [isDrafting, setIsDrafting] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('');

  const tones: ReplyTone[] = [
    'Executive & Direct',
    'Professional & Polished',
    'Warm & Collaborative',
    'Casual & Fast',
  ];

  useEffect(() => {
    if (email) {
      if (email.draftReply) {
        setDraftText(email.draftReply);
      } else {
        handleGenerateDraft(selectedTone);
      }
    }
  }, [email]);

  const handleGenerateDraft = async (toneToUse: ReplyTone) => {
    if (!email) return;
    setIsDrafting(true);
    setStatusMessage('');
    try {
      const generated = await draftReplyWithGemini(email, toneToUse, userName);
      setDraftText(generated);
      onSaveDraft(email.id, generated, false);
    } catch {
      setStatusMessage('Used local fallback template.');
    } finally {
      setIsDrafting(false);
    }
  };

  const handleToneChange = (tone: ReplyTone) => {
    setSelectedTone(tone);
    handleGenerateDraft(tone);
  };

  const handleCopy = async () => {
    if (!draftText) return;
    try {
      await navigator.clipboard.writeText(draftText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  const handleMarkRepliedAndClose = () => {
    if (!email) return;
    onSaveDraft(email.id, draftText, true);
    onClose();
  };

  if (!email) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="relative flex flex-col max-h-[90vh] w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/70 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">AI Draft Response</h3>
              <p className="text-xs text-slate-500">Composed with Gemini 2.5 Flash on behalf of {userName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Email Context Card */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 text-xs space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/80 pb-2">
              <div className="flex items-center gap-1.5 font-medium text-slate-700">
                <User className="h-3.5 w-3.5 text-slate-400" />
                <span className="font-semibold text-slate-900">{email.sender}</span>
              </div>
              <div className="flex items-center gap-1 text-slate-400">
                <Clock className="h-3 w-3" />
                <span>{email.date}</span>
              </div>
            </div>
            <p className="font-semibold text-slate-800 text-sm">{email.subject}</p>
            <p className="text-slate-600 line-clamp-3 leading-relaxed whitespace-pre-wrap">{email.body}</p>
          </div>

          {/* Tone Selector */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Select Tone
              </label>
              <button
                onClick={() => handleGenerateDraft(selectedTone)}
                disabled={isDrafting}
                className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700 disabled:opacity-50"
              >
                <RefreshCw className={`h-3 w-3 ${isDrafting ? 'animate-spin' : ''}`} />
                <span>Regenerate</span>
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {tones.map((tone) => (
                <button
                  key={tone}
                  onClick={() => handleToneChange(tone)}
                  className={`rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-all ${
                    selectedTone === tone
                      ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-xs'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {tone}
                </button>
              ))}
            </div>
          </div>

          {/* Draft text area */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Generated Reply Draft
            </label>
            <div className="relative">
              <textarea
                value={draftText}
                onChange={(e) => setDraftText(e.target.value)}
                rows={7}
                placeholder={isDrafting ? 'Gemini is drafting a response...' : 'Draft will appear here...'}
                className="w-full rounded-xl border border-slate-300 p-3.5 text-sm text-slate-800 shadow-inner focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 leading-relaxed font-sans"
              />
              {isDrafting && (
                <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-white/70 backdrop-blur-xs">
                  <div className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-md">
                    <Sparkles className="h-4 w-4 animate-spin" />
                    <span>Writing draft reply...</span>
                  </div>
                </div>
              )}
            </div>
            {statusMessage && <p className="mt-1 text-xs text-amber-600">{statusMessage}</p>}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/70 px-6 py-4">
          <button
            onClick={handleCopy}
            className={`w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-xl border px-4 py-2 text-xs font-semibold shadow-xs transition-all ${
              copied
                ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50 active:scale-95'
            }`}
          >
            {copied ? (
              <>
                <Check className="h-4 w-4 text-emerald-600" />
                <span>Copied to Clipboard!</span>
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                <span>Copy Reply Text</span>
              </>
            )}
          </button>

          <div className="flex w-full sm:w-auto items-center gap-2">
            <button
              onClick={onClose}
              className="flex-1 sm:flex-none rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>

            <button
              onClick={handleMarkRepliedAndClose}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 active:scale-95"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>Mark Replied</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
