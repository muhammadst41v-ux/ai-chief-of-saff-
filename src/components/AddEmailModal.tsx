import React, { useState } from 'react';
import { X, Mail, Sparkles, User, Calendar as CalendarIcon, AlignLeft } from 'lucide-react';
import { Email } from '../types';
import { classifyEmailWithGemini } from '../services/geminiService';

interface AddEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (email: Email) => void;
}

export const AddEmailModal: React.FC<AddEmailModalProps> = ({
  isOpen,
  onClose,
  onSave,
}) => {
  const [sender, setSender] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [date, setDate] = useState('Today, ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
  const [autoClassify, setAutoClassify] = useState(true);
  const [isClassifying, setIsClassifying] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !body.trim()) return;

    setIsClassifying(true);
    let category: Email['category'] = 'Needs Reply';
    let priority: Email['priority'] = 'medium';
    let needs_reply = true;
    let reason = 'Added to inbox for executive review.';
    let suggested_action = 'Review and follow up if needed.';

    if (autoClassify) {
      try {
        const result = await classifyEmailWithGemini({
          sender: sender.trim() || 'Unknown Sender',
          subject: subject.trim(),
          body: body.trim(),
          date,
        });
        category = result.category;
        priority = result.priority;
        needs_reply = result.needs_reply;
        reason = result.reason;
        suggested_action = result.suggested_action;
      } catch {
        // use defaults
      }
    }

    const newEmail: Email = {
      id: 'em-' + Math.random().toString(36).substring(2, 9),
      sender: sender.trim() || 'Unknown Sender',
      subject: subject.trim(),
      body: body.trim(),
      date: date.trim() || 'Today',
      category,
      priority,
      needs_reply,
      reason,
      suggested_action,
      isRead: false,
      isReplied: false,
    };

    setIsClassifying(false);
    onSave(newEmail);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="relative flex flex-col max-h-[90vh] w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200">
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/70 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
              <Mail className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Add / Paste Email</h3>
              <p className="text-xs text-slate-500">Chief will analyze urgency and reply requirements</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Sender *
            </label>
            <div className="relative">
              <User className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <input
                type="text"
                required
                placeholder="e.g. Elena Rostova <elena@client.com>"
                value={sender}
                onChange={(e) => setSender(e.target.value)}
                className="w-full rounded-xl border border-slate-300 pl-9 pr-3.5 py-2 text-xs text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Subject *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Revised SLA Contract and Review Timeline"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Received Date / Time
            </label>
            <div className="relative">
              <CalendarIcon className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Today, 09:15 AM"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-xl border border-slate-300 pl-9 pr-3.5 py-2 text-xs text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Email Body *
            </label>
            <textarea
              required
              rows={5}
              placeholder="Paste email text here..."
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="w-full rounded-xl border border-slate-300 p-3 text-xs text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 leading-relaxed font-sans"
            />
          </div>

          <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-blue-600" />
              <div>
                <p className="text-xs font-semibold text-slate-900">Auto-classify with Gemini 2.5 Flash</p>
                <p className="text-[11px] text-slate-500">Determines priority, needs_reply, and tag</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={autoClassify}
              onChange={(e) => setAutoClassify(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isClassifying}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isClassifying}
              className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 active:scale-95 disabled:opacity-60"
            >
              {isClassifying ? (
                <>
                  <Sparkles className="h-3.5 w-3.5 animate-spin" />
                  <span>Classifying...</span>
                </>
              ) : (
                <span>Add Email</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
