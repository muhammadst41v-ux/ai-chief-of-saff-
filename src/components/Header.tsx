import React from 'react';
import {
  Menu,
  Plus,
  Sparkles,
  Calendar as CalendarIcon,
  Mail as MailIcon,
  CheckSquare as TaskIcon,
  Zap,
} from 'lucide-react';

interface HeaderProps {
  onOpenMobileMenu: () => void;
  onOpenAddEvent: () => void;
  onOpenAddEmail: () => void;
  onOpenAddTask: () => void;
  onGenerateBrief: () => void;
  isGeneratingBrief?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenMobileMenu,
  onOpenAddEvent,
  onOpenAddEmail,
  onOpenAddTask,
  onGenerateBrief,
  isGeneratingBrief = false,
}) => {
  // Format current date nicely
  const todayFormatted = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date());

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200/80 bg-white/95 px-4 backdrop-blur-md sm:px-6">
      {/* Left side: Hamburger on mobile + Date display */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileMenu}
          className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900 lg:hidden"
          aria-label="Open navigation menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-2.5">
          <div className="hidden sm:flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
            <CalendarIcon className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-xs font-semibold text-slate-900 sm:text-sm">
              {todayFormatted}
            </h2>
            <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
              <span>Chief of Staff Active</span>
              <span className="text-slate-300">•</span>
              <span className="font-mono text-slate-500">gemini-2.5-flash</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right side: Quick Action Buttons */}
      <div className="flex items-center gap-2">
        {/* Quick Add Dropdown / Buttons */}
        <div className="hidden md:flex items-center gap-1.5 border-r border-slate-200 pr-2">
          <button
            onClick={onOpenAddEvent}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 shadow-xs hover:bg-slate-50 hover:text-slate-900 active:scale-95 transition-all"
            title="Add Calendar Event"
          >
            <CalendarIcon className="h-3.5 w-3.5 text-blue-600" />
            <span>Event</span>
          </button>

          <button
            onClick={onOpenAddEmail}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 shadow-xs hover:bg-slate-50 hover:text-slate-900 active:scale-95 transition-all"
            title="Paste or Import Email"
          >
            <MailIcon className="h-3.5 w-3.5 text-blue-600" />
            <span>Email</span>
          </button>

          <button
            onClick={onOpenAddTask}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 shadow-xs hover:bg-slate-50 hover:text-slate-900 active:scale-95 transition-all"
            title="Add Action Item"
          >
            <TaskIcon className="h-3.5 w-3.5 text-amber-600" />
            <span>Task</span>
          </button>
        </div>

        {/* Mobile single add button */}
        <div className="flex md:hidden items-center">
          <button
            onClick={onOpenAddEvent}
            className="rounded-lg p-2 text-slate-700 hover:bg-slate-100"
            title="Add Event"
          >
            <Plus className="h-5 w-5" />
          </button>
        </div>

        {/* Generate Brief CTA */}
        <button
          onClick={onGenerateBrief}
          disabled={isGeneratingBrief}
          className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 active:scale-95 disabled:opacity-60 transition-all"
        >
          {isGeneratingBrief ? (
            <>
              <Sparkles className="h-3.5 w-3.5 animate-spin" />
              <span>Analyzing...</span>
            </>
          ) : (
            <>
              <Zap className="h-3.5 w-3.5 fill-current" />
              <span>Morning Brief</span>
            </>
          )}
        </button>
      </div>
    </header>
  );
};
