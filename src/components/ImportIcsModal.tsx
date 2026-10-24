import React, { useState } from 'react';
import { X, Upload, FileText, Check, AlertCircle, Download } from 'lucide-react';
import { CalendarEvent } from '../types';
import { parseIcsContent, exportEventsToIcs } from '../utils/icsParser';
import { getDefaultEvents } from '../utils/sampleData';

interface ImportIcsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (events: CalendarEvent[]) => void;
  existingEvents: CalendarEvent[];
}

export const ImportIcsModal: React.FC<ImportIcsModalProps> = ({
  isOpen,
  onClose,
  onImport,
  existingEvents,
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'paste'>('upload');
  const [rawText, setRawText] = useState('');
  const [parsedPreview, setParsedPreview] = useState<CalendarEvent[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (!content) return;
      processIcsString(content);
    };
    reader.onerror = () => {
      setError('Could not read file.');
    };
    reader.readAsText(file);
  };

  const processIcsString = (text: string) => {
    try {
      const events = parseIcsContent(text);
      if (events.length === 0) {
        setError('No valid VEVENT entries found in the file.');
        setParsedPreview([]);
      } else {
        setError(null);
        setParsedPreview(events);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to parse .ics content');
      setParsedPreview([]);
    }
  };

  const handlePasteChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setRawText(val);
    if (val.trim()) {
      processIcsString(val);
    } else {
      setParsedPreview([]);
      setError(null);
    }
  };

  const handleConfirmImport = () => {
    if (parsedPreview.length === 0) return;
    onImport(parsedPreview);
    onClose();
  };

  const handleDownloadSample = () => {
    const sampleIcs = exportEventsToIcs(getDefaultEvents());
    const blob = new Blob([sampleIcs], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'chief-sample-calendar.ics';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="relative flex flex-col max-h-[90vh] w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/70 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
              <Upload className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Import Calendar (.ics)</h3>
              <p className="text-xs text-slate-500">Google Calendar, Apple iCal, or Outlook exported file</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex items-center gap-2 border-b border-slate-100 px-6 pt-3">
          <button
            onClick={() => setActiveTab('upload')}
            className={`border-b-2 px-3 py-2 text-xs font-semibold transition-all ${
              activeTab === 'upload'
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Upload File
          </button>
          <button
            onClick={() => setActiveTab('paste')}
            className={`border-b-2 px-3 py-2 text-xs font-semibold transition-all ${
              activeTab === 'paste'
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Paste Raw ICS
          </button>
          <div className="flex-1 text-right">
            <button
              onClick={handleDownloadSample}
              className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-600 hover:underline"
            >
              <Download className="h-3 w-3" />
              <span>Download sample .ics</span>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {activeTab === 'upload' ? (
            <div>
              <label className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50/70 p-6 text-center hover:border-blue-500 hover:bg-blue-50/20 cursor-pointer transition-all">
                <FileText className="h-10 w-10 text-slate-400 mb-2" />
                <span className="text-xs font-semibold text-slate-800">
                  {fileName ? fileName : 'Click to select .ics file or drag here'}
                </span>
                <span className="text-[11px] text-slate-400 mt-1">Accepts standard iCalendar (.ics)</span>
                <input
                  type="file"
                  accept=".ics,text/calendar"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Paste .ics text content
              </label>
              <textarea
                rows={6}
                value={rawText}
                onChange={handlePasteChange}
                placeholder="BEGIN:VCALENDAR&#10;VERSION:2.0&#10;BEGIN:VEVENT&#10;SUMMARY:Product Sync&#10;..."
                className="w-full font-mono text-xs rounded-xl border border-slate-300 p-3 text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 rounded-xl bg-rose-50 p-3 text-xs text-rose-700 border border-rose-200">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {parsedPreview.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Ready to Import ({parsedPreview.length} Events Detected)
                </span>
              </div>
              <div className="max-h-48 overflow-y-auto rounded-xl border border-slate-200 divide-y divide-slate-100 bg-slate-50/50">
                {parsedPreview.map((evt, idx) => (
                  <div key={idx} className="p-3 text-xs flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-slate-900">{evt.title}</p>
                      <p className="text-slate-500 text-[11px]">
                        {evt.date} • {evt.startTime} - {evt.endTime} {evt.location ? `• ${evt.location}` : ''}
                      </p>
                    </div>
                    <span className="rounded bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-800 capitalize">
                      {evt.category || 'meeting'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 border-t border-slate-100 bg-slate-50/70 px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirmImport}
            disabled={parsedPreview.length === 0}
            className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 active:scale-95 disabled:opacity-50"
          >
            <Check className="h-4 w-4" />
            <span>Import {parsedPreview.length > 0 ? `${parsedPreview.length} Events` : ''}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
