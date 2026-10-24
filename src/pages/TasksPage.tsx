import React, { useState } from 'react';
import {
  CheckSquare,
  Plus,
  Trash2,
  Calendar as CalendarIcon,
  Check,
  Tag,
  AlertCircle,
  Flag,
} from 'lucide-react';
import { TaskItem } from '../types';
import { getTodayDateString } from '../utils/sampleData';

interface TasksPageProps {
  tasks: TaskItem[];
  onToggleTask: (id: string) => void;
  onAddTask: () => void;
  onDeleteTask: (id: string) => void;
  onQuickAddTask: (title: string, priority?: TaskItem['priority']) => void;
}

export const TasksPage: React.FC<TasksPageProps> = ({
  tasks,
  onToggleTask,
  onAddTask,
  onDeleteTask,
  onQuickAddTask,
}) => {
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed' | 'urgent'>('all');
  const [quickInput, setQuickInput] = useState('');
  const [quickPriority, setQuickPriority] = useState<TaskItem['priority']>('high');

  const todayStr = getTodayDateString(0);

  const filteredTasks = tasks.filter((t) => {
    if (filter === 'pending') return !t.completed;
    if (filter === 'completed') return t.completed;
    if (filter === 'urgent') return !t.completed && (t.priority === 'urgent' || t.priority === 'high');
    return true;
  });

  const pendingCount = tasks.filter((t) => !t.completed).length;
  const completedCount = tasks.filter((t) => t.completed).length;
  const urgentCount = tasks.filter((t) => !t.completed && t.priority === 'urgent').length;

  const handleQuickAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickInput.trim()) return;
    onQuickAddTask(quickInput.trim(), quickPriority);
    setQuickInput('');
  };

  const getPriorityBadge = (priority: TaskItem['priority']) => {
    switch (priority) {
      case 'urgent':
        return (
          <span className="inline-flex items-center gap-1 rounded bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-800 uppercase">
            Urgent
          </span>
        );
      case 'high':
        return (
          <span className="inline-flex items-center gap-1 rounded bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800 uppercase">
            High
          </span>
        );
      case 'medium':
        return (
          <span className="inline-flex items-center gap-1 rounded bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-800 capitalize">
            Medium
          </span>
        );
      case 'low':
        return (
          <span className="inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-700 capitalize">
            Low
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Action Items & Tasks</h1>
          <p className="text-xs text-slate-500 font-medium">
            Executive follow-ups gathered from email requests, meetings, and manual priorities
          </p>
        </div>

        <button
          onClick={onAddTask}
          className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 active:scale-95"
        >
          <Plus className="h-4 w-4" />
          <span>New Task</span>
        </button>
      </div>

      {/* Quick Add Bar */}
      <form
        onSubmit={handleQuickAdd}
        className="flex flex-col sm:flex-row items-center gap-2 rounded-2xl border border-slate-200/90 bg-white p-3 shadow-xs"
      >
        <input
          type="text"
          placeholder="Add a new action item or executive deliverable..."
          value={quickInput}
          onChange={(e) => setQuickInput(e.target.value)}
          className="w-full flex-1 rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-xs text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        />

        <div className="flex w-full sm:w-auto items-center gap-2">
          <select
            value={quickPriority}
            onChange={(e) => setQuickPriority(e.target.value as TaskItem['priority'])}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none"
          >
            <option value="urgent">Urgent</option>
            <option value="high">High Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="low">Low Priority</option>
          </select>

          <button
            type="submit"
            className="inline-flex items-center gap-1 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 active:scale-95 shrink-0"
          >
            <Plus className="h-4 w-4" />
            <span>Add</span>
          </button>
        </div>
      </form>

      {/* Filter Tabs & Stats */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
              filter === 'all'
                ? 'bg-blue-50 text-blue-700 border border-blue-200/80 shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            All ({tasks.length})
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
              filter === 'pending'
                ? 'bg-blue-50 text-blue-700 border border-blue-200/80 shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            Pending ({pendingCount})
          </button>
          <button
            onClick={() => setFilter('urgent')}
            className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
              filter === 'urgent'
                ? 'bg-rose-50 text-rose-700 border border-rose-200 shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            Urgent / High ({urgentCount})
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
              filter === 'completed'
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            Completed ({completedCount})
          </button>
        </div>

        <span className="text-xs text-slate-500 font-medium">
          {pendingCount} remaining • {Math.round((completedCount / (tasks.length || 1)) * 100)}% done
        </span>
      </div>

      {/* Tasks List */}
      <div className="space-y-2.5">
        {filteredTasks.length === 0 ? (
          <div className="rounded-2xl border border-slate-200/80 bg-white p-16 text-center text-slate-400 space-y-2">
            <CheckSquare className="h-12 w-12 mx-auto text-slate-300" />
            <p className="text-sm font-semibold text-slate-700">No tasks in this category</p>
            <p className="text-xs text-slate-400">Add an action item or change filters above.</p>
          </div>
        ) : (
          filteredTasks.map((task) => {
            const isUrgent = task.priority === 'urgent';
            const isDueToday = task.dueDate === todayStr;

            return (
              <div
                key={task.id}
                onClick={() => onToggleTask(task.id)}
                className={`group flex items-start justify-between gap-3 rounded-2xl border p-4 text-xs transition-all cursor-pointer ${
                  task.completed
                    ? 'border-slate-100 bg-slate-50/60 opacity-60'
                    : isUrgent
                    ? 'border-amber-200/90 bg-amber-50/40 hover:bg-amber-50/70 shadow-xs'
                    : 'border-slate-200/90 bg-white hover:border-slate-300 hover:bg-slate-50/40 shadow-xs'
                }`}
              >
                <div className="flex items-start gap-3 min-w-0 flex-1">
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

                  <div className="space-y-1 min-w-0">
                    <p
                      className={`text-sm font-semibold leading-relaxed ${
                        task.completed ? 'line-through text-slate-400' : 'text-slate-900'
                      }`}
                    >
                      {task.title}
                    </p>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                      {getPriorityBadge(task.priority)}

                      {task.dueDate && (
                        <div
                          className={`flex items-center gap-1 ${
                            isDueToday && !task.completed
                              ? 'font-bold text-amber-700'
                              : 'text-slate-500'
                          }`}
                        >
                          <CalendarIcon className="h-3 w-3" />
                          <span>
                            {isDueToday ? 'Due Today' : `Due: ${task.dueDate}`}
                          </span>
                        </div>
                      )}

                      {task.source && (
                        <div className="flex items-center gap-1 text-slate-400">
                          <Tag className="h-3 w-3" />
                          <span className="truncate">From {task.source}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteTask(task.id);
                  }}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 shrink-0 self-center opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Delete Task"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
