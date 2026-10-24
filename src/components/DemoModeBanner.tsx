import React, { useState } from 'react';
import { AlertCircle, Key, ChevronRight, X, ExternalLink, Sparkles, ShieldAlert } from 'lucide-react';
import { AppStatus } from '../services/apiService';

interface DemoModeBannerProps {
  status: AppStatus | null;
  onNavigateSettings: () => void;
}

export const DemoModeBanner: React.FC<DemoModeBannerProps> = ({
  status,
  onNavigateSettings,
}) => {
  const [isMinimized, setIsMinimized] = useState(false);

  if (!status || !status.isDemoMode) {
    return null;
  }

  if (isMinimized) {
    return (
      <div className="bg-amber-100/90 border-b border-amber-200/80 px-4 py-1.5 text-xs text-amber-900 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
          <span className="font-bold">Demo Mode Active:</span>
          <span>Sample calendar & emails loaded</span>
        </div>
        <button
          onClick={() => setIsMinimized(false)}
          className="text-amber-800 underline hover:text-amber-950 font-semibold text-[11px]"
        >
          Expand details
        </button>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-amber-50 via-amber-100/80 to-yellow-50 border-b border-amber-200/90 px-4 py-3 text-amber-950 shadow-xs">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Left: Message */}
        <div className="flex items-start sm:items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-200/80 text-amber-800 shrink-0 mt-0.5 sm:mt-0">
            <AlertCircle className="h-4 w-4" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-extrabold text-xs tracking-tight text-amber-950">
                Demo mode: add keys in .env to connect real data
              </span>
              <span className="rounded-full bg-amber-200/90 px-2 py-0.5 text-[10px] font-bold text-amber-900 uppercase tracking-wider">
                Realistic Sample Data
              </span>
            </div>
            <p className="text-[11px] text-amber-800/90 mt-0.5">
              Chief is currently running with realistic executive meetings, emails, and action items. Add your Google OAuth credentials to sync your live Gmail and Google Calendar.
            </p>
          </div>
        </div>

        {/* Right: Key Status Breakdown & CTA */}
        <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
          <div className="hidden lg:flex items-center gap-1.5 text-[10px] font-mono bg-white/70 px-2.5 py-1 rounded-lg border border-amber-200">
            <span className={status.keys.gemini ? 'text-emerald-700 font-bold' : 'text-slate-400'}>
              Gemini {status.keys.gemini ? '✓' : '✗'}
            </span>
            <span className="text-slate-300">|</span>
            <span className={status.keys.googleClientId ? 'text-emerald-700 font-bold' : 'text-amber-800'}>
              Google OAuth {status.keys.googleClientId ? '✓' : 'Missing'}
            </span>
          </div>

          <button
            onClick={onNavigateSettings}
            className="inline-flex items-center gap-1.5 rounded-xl bg-amber-900 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-amber-950 active:scale-95 transition-all"
          >
            <Key className="h-3.5 w-3.5 text-amber-300" />
            <span>Setup Instructions</span>
          </button>

          <button
            onClick={() => setIsMinimized(true)}
            className="rounded-lg p-1 text-amber-800 hover:bg-amber-200/80 transition-colors"
            title="Minimize banner"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
