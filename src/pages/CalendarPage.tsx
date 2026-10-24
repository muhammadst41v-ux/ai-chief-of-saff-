import React, { useState } from 'react';
import {
  Calendar as CalendarIcon,
  Plus,
  Upload,
  Download,
  Trash2,
  Edit,
  Clock,
  MapPin,
  Users,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Filter,
} from 'lucide-react';
import { CalendarEvent } from '../types';
import { getTodayDateString } from '../utils/sampleData';
import { exportEventsToIcs } from '../utils/icsParser';

interface CalendarPageProps {
  events: CalendarEvent[];
  onAddEvent: () => void;
  onEditEvent: (event: CalendarEvent) => void;
  onDeleteEvent: (id: string) => void;
  onOpenImportIcs: () => void;
}

export const CalendarPage: React.FC<CalendarPageProps> = ({
  events,
  onAddEvent,
  onEditEvent,
  onDeleteEvent,
  onOpenImportIcs,
}) => {
  const [viewMode, setViewMode] = useState<'day' | 'week'>('day');
  const [selectedDate, setSelectedDate] = useState<string>(getTodayDateString(0));
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Check for time conflicts on the selected day
  const dayEvents = events
    .filter((e) => e.date === selectedDate)
    .sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''));

  // Conflict detection
  const conflictIds = new Set<string>();
  for (let i = 0; i < dayEvents.length - 1; i++) {
    const cur = dayEvents[i];
    const nxt = dayEvents[i + 1];
    if (cur.endTime && nxt.startTime && cur.endTime > nxt.startTime) {
      conflictIds.add(cur.id);
      conflictIds.add(nxt.id);
    }
  }

  // Week view calculation: 7 days starting from selected date (or start of week)
  const getWeekDates = (baseDateStr: string): string[] => {
    const base = new Date(baseDateStr + 'T00:00:00');
    const day = base.getDay();
    const diff = base.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
    const monday = new Date(base.setDate(diff));

    const week: string[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const dt = String(d.getDate()).padStart(2, '0');
      week.push(`${y}-${m}-${dt}`);
    }
    return week;
  };

  const weekDates = getWeekDates(selectedDate);

  const handleExportIcs = () => {
    const icsData = exportEventsToIcs(events);
    const blob = new Blob([icsData], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chief-calendar-${selectedDate}.ics`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const shiftDate = (offsetDays: number) => {
    const d = new Date(selectedDate + 'T00:00:00');
    d.setDate(d.getDate() + offsetDays);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dt = String(d.getDate()).padStart(2, '0');
    setSelectedDate(`${y}-${m}-${dt}`);
  };

  const formattedSelectedDate = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(selectedDate + 'T00:00:00'));

  const filteredEvents = (list: CalendarEvent[]) => {
    if (categoryFilter === 'all') return list;
    return list.filter((e) => e.category === categoryFilter);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Executive Calendar</h1>
          <p className="text-xs text-slate-500 font-medium">
            Manage your daily commitments, detect meeting overlaps, and sync with .ics files
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onOpenImportIcs}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 active:scale-95"
          >
            <Upload className="h-3.5 w-3.5 text-blue-600" />
            <span>Import .ICS</span>
          </button>

          <button
            onClick={handleExportIcs}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 active:scale-95"
          >
            <Download className="h-3.5 w-3.5 text-slate-600" />
            <span>Export .ICS</span>
          </button>

          <button
            onClick={onAddEvent}
            className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 active:scale-95"
          >
            <Plus className="h-4 w-4" />
            <span>Add Event</span>
          </button>
        </div>
      </div>

      {/* Toolbar: Navigation & View Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs">
        {/* Date Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => shiftDate(-1)}
            className="rounded-lg border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-50"
            title="Previous Day"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => setSelectedDate(getTodayDateString(0))}
            className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
          >
            Today
          </button>
          <button
            onClick={() => shiftDate(1)}
            className="rounded-lg border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-50"
            title="Next Day"
          >
            <ChevronRight className="h-4 w-4" />
          </button>

          <div className="ml-2 font-bold text-slate-900 text-sm">
            {formattedSelectedDate}
          </div>
        </div>

        {/* View Mode & Filter */}
        <div className="flex items-center gap-3">
          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 focus:border-blue-500 focus:outline-none"
          >
            <option value="all">All Categories</option>
            <option value="meeting">Meetings</option>
            <option value="deep_work">Deep Work</option>
            <option value="call">Calls</option>
            <option value="personal">Personal</option>
          </select>

          {/* Day / Week Toggle */}
          <div className="inline-flex rounded-xl bg-slate-100 p-1 text-xs">
            <button
              onClick={() => setViewMode('day')}
              className={`rounded-lg px-3 py-1 font-semibold transition-all ${
                viewMode === 'day'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Day View
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`rounded-lg px-3 py-1 font-semibold transition-all ${
                viewMode === 'week'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Week List
            </button>
          </div>
        </div>
      </div>

      {/* Conflict Warning Banner if detected */}
      {conflictIds.size > 0 && viewMode === 'day' && (
        <div className="flex items-center gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-xs text-amber-900 shadow-xs">
          <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
          <div>
            <span className="font-bold">Schedule Overlap Alert:</span> You have overlapping meetings on this day. Chief will flag this in your Morning Brief.
          </div>
        </div>
      )}

      {/* Main Content: Day View vs Week List View */}
      {viewMode === 'day' ? (
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-800">
              Events for {formattedSelectedDate} ({filteredEvents(dayEvents).length})
            </h3>
            <span className="text-xs text-slate-400">Chronological order</span>
          </div>

          {filteredEvents(dayEvents).length === 0 ? (
            <div className="py-16 text-center text-slate-400 space-y-2">
              <CalendarIcon className="h-12 w-12 mx-auto text-slate-300" />
              <p className="text-sm font-semibold text-slate-700">No events found for this day</p>
              <p className="text-xs text-slate-400">Add an event or import an .ics calendar file above.</p>
              <button
                onClick={onAddEvent}
                className="mt-2 inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-blue-700"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Event</span>
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredEvents(dayEvents).map((evt) => {
                const isConflicted = conflictIds.has(evt.id);

                return (
                  <div
                    key={evt.id}
                    className={`group relative rounded-2xl border p-5 transition-all hover:shadow-xs ${
                      isConflicted
                        ? 'border-amber-300 bg-amber-50/40'
                        : 'border-slate-200/90 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="flex items-center gap-1 rounded-md bg-blue-50 border border-blue-200/60 px-2.5 py-1 text-xs font-bold text-blue-700">
                            <Clock className="h-3.5 w-3.5" />
                            <span>
                              {evt.startTime} - {evt.endTime}
                            </span>
                          </span>

                          <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700 capitalize">
                            {evt.category?.replace('_', ' ') || 'meeting'}
                          </span>

                          {isConflicted && (
                            <span className="inline-flex items-center gap-1 rounded-md bg-rose-100 px-2 py-0.5 text-[11px] font-bold text-rose-700">
                              <AlertTriangle className="h-3 w-3" />
                              <span>Overlapping Time</span>
                            </span>
                          )}
                        </div>

                        <h4 className="text-base font-bold text-slate-900">{evt.title}</h4>

                        {evt.description && (
                          <p className="text-xs text-slate-600 leading-relaxed font-sans max-w-2xl">
                            {evt.description}
                          </p>
                        )}

                        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1">
                          {evt.location && (
                            <div className="flex items-center gap-1.5">
                              <MapPin className="h-3.5 w-3.5 text-slate-400" />
                              <span>{evt.location}</span>
                            </div>
                          )}
                          {evt.attendees && evt.attendees.length > 0 && (
                            <div className="flex items-center gap-1.5">
                              <Users className="h-3.5 w-3.5 text-slate-400" />
                              <span>{evt.attendees.join(', ')}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-1 shrink-0 self-end sm:self-start">
                        <button
                          onClick={() => onEditEvent(evt)}
                          className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                          title="Edit Event"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => onDeleteEvent(evt.id)}
                          className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                          title="Delete Event"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* Week List View */
        <div className="space-y-4">
          {weekDates.map((dateStr) => {
            const thisDayEvents = filteredEvents(
              events
                .filter((e) => e.date === dateStr)
                .sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''))
            );
            const isToday = dateStr === getTodayDateString(0);
            const dayName = new Intl.DateTimeFormat('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
            }).format(new Date(dateStr + 'T00:00:00'));

            return (
              <div
                key={dateStr}
                className={`rounded-2xl border p-4 shadow-xs transition-all ${
                  isToday ? 'border-blue-300 bg-blue-50/20' : 'border-slate-200/90 bg-white'
                }`}
              >
                <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-900">{dayName}</span>
                    {isToday && (
                      <span className="rounded bg-blue-600 px-2 py-0.5 text-[10px] font-bold text-white uppercase">
                        Today
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-slate-400 font-medium">
                    {thisDayEvents.length} event{thisDayEvents.length === 1 ? '' : 's'}
                  </span>
                </div>

                {thisDayEvents.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-1">No scheduled events</p>
                ) : (
                  <div className="space-y-2">
                    {thisDayEvents.map((evt) => (
                      <div
                        key={evt.id}
                        className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/60 p-3 text-xs hover:bg-white"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="font-bold text-blue-700 text-[11px] shrink-0">
                            {evt.startTime} - {evt.endTime}
                          </span>
                          <span className="font-semibold text-slate-800 truncate">
                            {evt.title}
                          </span>
                          {evt.location && (
                            <span className="hidden md:inline text-slate-500 text-[11px] truncate">
                              ({evt.location})
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => onEditEvent(evt)}
                            className="p-1 text-slate-400 hover:text-slate-700"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => onDeleteEvent(evt.id)}
                            className="p-1 text-slate-400 hover:text-rose-600"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
