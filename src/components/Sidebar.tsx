import React from 'react';
import {
  LayoutDashboard,
  Calendar,
  Mail,
  CheckSquare,
  Sparkles,
  Settings,
  ShieldCheck,
  ChevronRight,
  Clock,
  X,
} from 'lucide-react';
import { UserSettings } from '../types';

export type PageId = 'today' | 'calendar' | 'inbox' | 'tasks' | 'brief' | 'settings';

interface SidebarProps {
  currentPage: PageId;
  onSelectPage: (page: PageId) => void;
  unreadReplyCount: number;
  activeTaskCount: number;
  settings: UserSettings;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  onQuickBrief: () => void;
  isGeneratingBrief?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentPage,
  onSelectPage,
  unreadReplyCount,
  activeTaskCount,
  settings,
  isOpenMobile,
  onCloseMobile,
  onQuickBrief,
  isGeneratingBrief = false,
}) => {
  const navItems = [
    {
      id: 'today' as PageId,
      label: 'Today',
      description: 'Daily overview & schedule',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'calendar' as PageId,
      label: 'Calendar',
      description: 'Schedule & meetings',
      icon: Calendar,
      badge: null,
    },
    {
      id: 'inbox' as PageId,
      label: 'Inbox',
      description: 'Triage & draft replies',
      icon: Mail,
      badge: unreadReplyCount > 0 ? `${unreadReplyCount} need reply` : null,
      badgeUrgent: unreadReplyCount > 0,
    },
    {
      id: 'tasks' as PageId,
      label: 'Tasks',
      description: 'Action items & priorities',
      icon: CheckSquare,
      badge: activeTaskCount > 0 ? `${activeTaskCount}` : null,
      badgeUrgent: false,
    },
    {
      id: 'brief' as PageId,
      label: 'Morning Brief',
      description: 'AI daily intelligence',
      icon: Sparkles,
      badge: 'AI',
      isHighlight: true,
    },
    {
      id: 'settings' as PageId,
      label: 'Settings',
      description: 'Preferences & AI config',
      icon: Settings,
      badge: null,
    },
  ];

  const handleNavClick = (page: PageId) => {
    onSelectPage(page);
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs lg:hidden"
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex w-72 flex-col border-r border-slate-200/90 bg-white transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
          isOpenMobile ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="flex h-20 items-center justify-between border-b border-slate-100 px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-500/20">
              <ShieldCheck className="h-6 w-6 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold tracking-tight text-slate-900 text-lg">Chief</span>
                <span className="rounded bg-blue-50 px-1.5 py-0.5 font-semibold text-[10px] text-blue-700 uppercase tracking-wider">
                  AI
                </span>
              </div>
              <p className="text-slate-500 text-xs font-medium">Chief of Staff</p>
            </div>
          </div>

          <button
            onClick={onCloseMobile}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 lg:hidden"
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Quick Action Banner */}
        <div className="p-4 pb-2">
          <button
            onClick={onQuickBrief}
            disabled={isGeneratingBrief}
            className="w-full group relative flex items-center justify-between overflow-hidden rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3 text-left text-white shadow-md shadow-blue-600/15 transition-all hover:shadow-lg hover:shadow-blue-600/25 active:scale-[0.99] disabled:opacity-60"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20 backdrop-blur-xs">
                <Sparkles className={`h-4 w-4 ${isGeneratingBrief ? 'animate-spin' : 'group-hover:rotate-12 transition-transform'}`} />
              </div>
              <div>
                <span className="block font-semibold text-xs tracking-wide">
                  {isGeneratingBrief ? 'Synthesizing...' : 'Morning Brief'}
                </span>
                <span className="block text-[11px] text-blue-100">
                  {isGeneratingBrief ? 'Reading calendar & inbox' : 'Generate with Gemini'}
                </span>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-blue-200 transition-transform group-hover:translate-x-0.5" />
          </button>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 space-y-1.5 px-3 py-3 overflow-y-auto">
          <div className="px-3 pb-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Workspace
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;

            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full group flex items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 font-semibold shadow-xs'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
                      isActive
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200/70 group-hover:text-slate-800'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <span className="truncate">{item.label}</span>
                </div>

                {item.badge && (
                  <span
                    className={`ml-2 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                      item.badgeUrgent
                        ? 'bg-amber-100 text-amber-800'
                        : item.isHighlight
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* User Profile & Schedule Footer */}
        <div className="border-t border-slate-100 p-4 bg-slate-50/60">
          <div
            onClick={() => handleNavClick('settings')}
            className="flex items-center justify-between rounded-xl p-2.5 transition-colors hover:bg-white cursor-pointer group"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-900 font-semibold text-white text-xs">
                {settings.name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .toUpperCase()
                  .slice(0, 2) || 'AM'}
              </div>
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold text-slate-900 group-hover:text-blue-600">
                  {settings.name}
                </p>
                <div className="flex items-center gap-1 text-[11px] text-slate-500">
                  <Clock className="h-3 w-3" />
                  <span>
                    {settings.workHoursStart} - {settings.workHoursEnd}
                  </span>
                </div>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-blue-600" />
          </div>
        </div>
      </aside>
    </>
  );
};
