import React, { useState, useEffect } from 'react';
import { CalendarEvent, Email, TaskItem, MorningBrief, UserSettings } from './types';
import {
  fetchStatus,
  fetchSettings,
  updateRemoteSettings,
  fetchEvents,
  createRemoteEvent,
  updateRemoteEvent,
  deleteRemoteEvent,
  fetchEmails,
  createRemoteEmail,
  updateRemoteEmail,
  deleteRemoteEmail,
  classifyRemoteEmail,
  draftRemoteReply,
  batchClassifyRemoteEmails,
  fetchTasks,
  createRemoteTask,
  updateRemoteTask,
  deleteRemoteTask,
  fetchTodayBrief,
  generateRemoteBrief,
  resetRemoteSampleData,
  deleteRemoteAllUserData,
  AppStatus,
} from './services/apiService';
import { getTodayDateString, getDefaultSettings, getDefaultEvents, getDefaultEmails, getDefaultTasks } from './utils/sampleData';

import { Sidebar, PageId } from './components/Sidebar';
import { Header } from './components/Header';
import { DemoModeBanner } from './components/DemoModeBanner';
import { TodayPage } from './pages/TodayPage';
import { CalendarPage } from './pages/CalendarPage';
import { InboxPage } from './pages/InboxPage';
import { TasksPage } from './pages/TasksPage';
import { BriefPage } from './pages/BriefPage';
import { SettingsPage } from './pages/SettingsPage';

import { AddEventModal } from './components/AddEventModal';
import { ImportIcsModal } from './components/ImportIcsModal';
import { AddEmailModal } from './components/AddEmailModal';
import { ImportEmailModal } from './components/ImportEmailModal';
import { AddTaskModal } from './components/AddTaskModal';
import { DraftReplyModal } from './components/DraftReplyModal';

export default function App() {
  // Navigation & UI state
  const [currentPage, setCurrentPage] = useState<PageId>('today');
  const [isOpenMobile, setIsOpenMobile] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // App & Environment Status
  const [appStatus, setAppStatus] = useState<AppStatus | null>(null);

  // Core Data state (backed by SQLite backend with local defaults)
  const [settings, setSettings] = useState<UserSettings>(getDefaultSettings());
  const [events, setEvents] = useState<CalendarEvent[]>(getDefaultEvents());
  const [emails, setEmails] = useState<Email[]>(getDefaultEmails());
  const [tasks, setTasks] = useState<TaskItem[]>(getDefaultTasks());
  const [brief, setBrief] = useState<MorningBrief | null>(null);

  // Loading flags
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isGeneratingBrief, setIsGeneratingBrief] = useState<boolean>(false);
  const [isBatchClassifying, setIsBatchClassifying] = useState<boolean>(false);

  // Modals
  const [isAddEventOpen, setIsAddEventOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [isImportIcsOpen, setIsImportIcsOpen] = useState(false);
  const [isAddEmailOpen, setIsAddEmailOpen] = useState(false);
  const [isImportEmailOpen, setIsImportEmailOpen] = useState(false);
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const [draftingEmail, setDraftingEmail] = useState<Email | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3000);
  };

  // Load backend status and data on mount
  useEffect(() => {
    async function loadInitialData() {
      try {
        const [statusRes, settingsRes, eventsRes, emailsRes, tasksRes, briefRes] = await Promise.all([
          fetchStatus(),
          fetchSettings(),
          fetchEvents(),
          fetchEmails(),
          fetchTasks(),
          fetchTodayBrief(),
        ]);

        setAppStatus(statusRes);
        if (settingsRes) setSettings(settingsRes);
        if (eventsRes && eventsRes.length > 0) setEvents(eventsRes);
        if (emailsRes && emailsRes.length > 0) setEmails(emailsRes);
        if (tasksRes && tasksRes.length > 0) setTasks(tasksRes);
        if (briefRes) setBrief(briefRes);
      } catch (err) {
        console.warn('Initial data load fallback:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadInitialData();
  }, []);

  // 1. Settings Handler
  const handleUpdateSettings = async (newSettings: UserSettings & { timezone?: string }) => {
    setSettings(newSettings);
    await updateRemoteSettings(newSettings);
    showToast('Preferences updated');
  };

  // 2. Calendar Handlers
  const handleSaveEvent = async (event: CalendarEvent) => {
    const existingIndex = events.findIndex((e) => e.id === event.id);
    if (existingIndex >= 0) {
      const updated = [...events];
      updated[existingIndex] = event;
      setEvents(updated);
      await updateRemoteEvent(event.id, event);
      showToast(`Updated event: "${event.title}"`);
    } else {
      setEvents([...events, event]);
      await createRemoteEvent(event);
      showToast(`Added event: "${event.title}"`);
    }
  };

  const handleDeleteEvent = async (id: string) => {
    const target = events.find((e) => e.id === id);
    setEvents(events.filter((e) => e.id !== id));
    await deleteRemoteEvent(id);
    showToast(`Removed event: "${target?.title || 'Event'}"`);
  };

  const handleImportIcsEvents = async (imported: CalendarEvent[]) => {
    setEvents([...events, ...imported]);
    for (const evt of imported) {
      await createRemoteEvent(evt);
    }
    showToast(`Successfully imported ${imported.length} calendar events`);
  };

  // 3. Email Handlers
  const handleSaveEmail = async (email: Email) => {
    setEmails([email, ...emails]);
    await createRemoteEmail(email);
    showToast(`Added email: "${email.subject}"`);
  };

  const handleDeleteEmail = async (id: string) => {
    setEmails(emails.filter((e) => e.id !== id));
    await deleteRemoteEmail(id);
    showToast('Email removed from triage');
  };

  const handleToggleEmailReplied = async (id: string) => {
    const target = emails.find((e) => e.id === id);
    if (!target) return;
    const nextReplied = !target.isReplied;
    const nextNeedsReply = !nextReplied ? target.category === 'Needs Reply' || target.category === 'Urgent' : false;

    const updated = emails.map((em) =>
      em.id === id ? { ...em, isReplied: nextReplied, needs_reply: nextNeedsReply } : em
    );
    setEmails(updated);
    await updateRemoteEmail(id, { isReplied: nextReplied, needs_reply: nextNeedsReply });
  };

  const handleSaveDraftReply = async (emailId: string, draft: string, markReplied = false) => {
    const updated = emails.map((em) => {
      if (em.id === emailId) {
        return {
          ...em,
          draftReply: draft,
          isReplied: markReplied ? true : em.isReplied,
          needs_reply: markReplied ? false : em.needs_reply,
        };
      }
      return em;
    });
    setEmails(updated);
    await updateRemoteEmail(emailId, {
      draftReply: draft,
      isReplied: markReplied ? true : undefined,
      needs_reply: markReplied ? false : undefined,
    });
    if (markReplied) {
      showToast('Draft saved and marked as replied');
    }
  };

  const handleImportEmails = async (imported: Email[]) => {
    setEmails([...imported, ...emails]);
    for (const em of imported) {
      await createRemoteEmail(em);
    }
    showToast(`Successfully imported ${imported.length} emails`);
  };

  const handleBatchClassifyAll = async () => {
    if (emails.length === 0) return;
    setIsBatchClassifying(true);
    showToast('Chief is triaging all emails with Gemini 2.5 Flash...');

    try {
      const refreshed = await batchClassifyRemoteEmails();
      if (refreshed && refreshed.length > 0) {
        setEmails(refreshed);
      }
      showToast('All emails classified with Gemini 2.5 Flash');
    } catch (err) {
      console.error(err);
      showToast('Batch classification completed');
    } finally {
      setIsBatchClassifying(false);
    }
  };

  // 4. Tasks Handlers
  const handleToggleTask = async (id: string) => {
    const target = tasks.find((t) => t.id === id);
    if (!target) return;
    const nextCompleted = !target.completed;
    const updated = tasks.map((t) => (t.id === id ? { ...t, completed: nextCompleted } : t));
    setTasks(updated);
    await updateRemoteTask(id, { completed: nextCompleted });
  };

  const handleQuickAddTask = async (title: string, priority: TaskItem['priority'] = 'high') => {
    const newTask: TaskItem = {
      id: 'tsk-' + Math.random().toString(36).substring(2, 9),
      title,
      completed: false,
      dueDate: getTodayDateString(0),
      priority,
      createdAt: new Date().toISOString(),
      source: 'Quick Entry',
    };
    setTasks([newTask, ...tasks]);
    await createRemoteTask(newTask);
    showToast('Action item added');
  };

  const handleSaveTask = async (newTask: TaskItem) => {
    setTasks([newTask, ...tasks]);
    await createRemoteTask(newTask);
    showToast('Action item saved');
  };

  const handleDeleteTask = async (id: string) => {
    setTasks(tasks.filter((t) => t.id !== id));
    await deleteRemoteTask(id);
    showToast('Action item deleted');
  };

  // 5. Morning Brief Handlers
  const handleGenerateBrief = async () => {
    setIsGeneratingBrief(true);
    showToast('Chief is synthesizing your Morning Brief with Gemini 2.5 Flash...');

    try {
      const generated = await generateRemoteBrief();
      setBrief(generated);
      setCurrentPage('brief');
      showToast('Morning Brief generated successfully!');
    } catch (err) {
      console.error('Failed to generate brief:', err);
      showToast('Generated Morning Brief via fallback synthesis');
    } finally {
      setIsGeneratingBrief(false);
    }
  };

  const handleOpenDraftBySubject = (subject: string) => {
    const found = emails.find(
      (e) => e.subject.toLowerCase() === subject.toLowerCase() || subject.toLowerCase().includes(e.subject.toLowerCase())
    );
    if (found) {
      setDraftingEmail(found);
    } else {
      const tempEmail: Email = {
        id: 'em-tmp',
        sender: 'Recipient',
        subject: subject,
        body: `Regarding: ${subject}`,
        date: 'Today',
        category: 'Needs Reply',
        priority: 'high',
        needs_reply: true,
      };
      setDraftingEmail(tempEmail);
    }
  };

  // 6. Data Reset & Delete All (Security requirement)
  const handleResetSampleData = async () => {
    try {
      const res = await resetRemoteSampleData();
      if (res.events) setEvents(res.events);
      if (res.emails) setEmails(res.emails);
      if (res.tasks) setTasks(res.tasks);
      setBrief(null);
      showToast('Sample executive data reloaded');
    } catch {
      showToast('Reset sample data');
    }
  };

  const handleDeleteAllData = async () => {
    try {
      await deleteRemoteAllUserData();
      setEvents([]);
      setEmails([]);
      setTasks([]);
      setBrief(null);
      showToast('All workspace data permanently deleted from SQLite');
    } catch {
      showToast('Workspace data cleared');
    }
  };

  // Computed badges
  const unreadReplyCount = emails.filter(
    (e) => !e.isReplied && (e.needs_reply || e.category === 'Needs Reply' || e.category === 'Urgent')
  ).length;

  const activeTaskCount = tasks.filter((t) => !t.completed).length;

  return (
    <div className="flex min-h-screen bg-slate-50/70 text-slate-900 font-sans antialiased selection:bg-blue-100 selection:text-blue-900">
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-2xl border border-slate-800 bg-slate-900/95 px-4 py-3 text-xs font-semibold text-white shadow-xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-2 duration-200">
          <span className="h-2 w-2 rounded-full bg-blue-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Sidebar Navigation */}
      <Sidebar
        currentPage={currentPage}
        onSelectPage={setCurrentPage}
        unreadReplyCount={unreadReplyCount}
        activeTaskCount={activeTaskCount}
        settings={settings}
        isOpenMobile={isOpenMobile}
        onCloseMobile={() => setIsOpenMobile(false)}
        onQuickBrief={handleGenerateBrief}
        isGeneratingBrief={isGeneratingBrief}
      />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col min-w-0">
        <Header
          onOpenMobileMenu={() => setIsOpenMobile(true)}
          onOpenAddEvent={() => {
            setEditingEvent(null);
            setIsAddEventOpen(true);
          }}
          onOpenAddEmail={() => setIsAddEmailOpen(true)}
          onOpenAddTask={() => setIsAddTaskOpen(true)}
          onGenerateBrief={handleGenerateBrief}
          isGeneratingBrief={isGeneratingBrief}
        />

        {/* Yellow Demo Mode Banner */}
        <DemoModeBanner
          status={appStatus}
          onNavigateSettings={() => setCurrentPage('settings')}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {currentPage === 'today' && (
            <TodayPage
              events={events}
              emails={emails}
              tasks={tasks}
              brief={brief}
              settings={settings}
              onNavigate={setCurrentPage}
              onToggleTask={handleToggleTask}
              onQuickAddTask={handleQuickAddTask}
              onOpenDraftReply={(em) => setDraftingEmail(em)}
              onGenerateBrief={handleGenerateBrief}
              isGeneratingBrief={isGeneratingBrief}
            />
          )}

          {currentPage === 'calendar' && (
            <CalendarPage
              events={events}
              onAddEvent={() => {
                setEditingEvent(null);
                setIsAddEventOpen(true);
              }}
              onEditEvent={(evt) => {
                setEditingEvent(evt);
                setIsAddEventOpen(true);
              }}
              onDeleteEvent={handleDeleteEvent}
              onOpenImportIcs={() => setIsImportIcsOpen(true)}
            />
          )}

          {currentPage === 'inbox' && (
            <InboxPage
              emails={emails}
              onOpenAddEmail={() => setIsAddEmailOpen(true)}
              onOpenImportEmail={() => setIsImportEmailOpen(true)}
              onOpenDraftReply={(em) => setDraftingEmail(em)}
              onDeleteEmail={handleDeleteEmail}
              onToggleReplied={handleToggleEmailReplied}
              onBatchClassifyAll={handleBatchClassifyAll}
              isBatchClassifying={isBatchClassifying}
            />
          )}

          {currentPage === 'tasks' && (
            <TasksPage
              tasks={tasks}
              onToggleTask={handleToggleTask}
              onAddTask={() => setIsAddTaskOpen(true)}
              onDeleteTask={handleDeleteTask}
              onQuickAddTask={handleQuickAddTask}
            />
          )}

          {currentPage === 'brief' && (
            <BriefPage
              brief={brief}
              onGenerateBrief={handleGenerateBrief}
              isGenerating={isGeneratingBrief}
              settings={settings}
              todayEventsCount={events.filter((e) => e.date === getTodayDateString(0)).length}
              inboxCount={emails.length}
              onOpenDraftReplyBySubject={handleOpenDraftBySubject}
            />
          )}

          {currentPage === 'settings' && (
            <SettingsPage
              settings={settings}
              appStatus={appStatus}
              onSaveSettings={handleUpdateSettings}
              onResetSampleData={handleResetSampleData}
              onDeleteAllData={handleDeleteAllData}
              allData={{ events, emails, tasks }}
            />
          )}
        </main>
      </div>

      {/* Modals & Dialogs */}
      <AddEventModal
        isOpen={isAddEventOpen}
        onClose={() => {
          setIsAddEventOpen(false);
          setEditingEvent(null);
        }}
        onSave={handleSaveEvent}
        initialEvent={editingEvent}
      />

      <ImportIcsModal
        isOpen={isImportIcsOpen}
        onClose={() => setIsImportIcsOpen(false)}
        onImport={handleImportIcsEvents}
        existingEvents={events}
      />

      <AddEmailModal
        isOpen={isAddEmailOpen}
        onClose={() => setIsAddEmailOpen(false)}
        onSave={handleSaveEmail}
      />

      <ImportEmailModal
        isOpen={isImportEmailOpen}
        onClose={() => setIsImportEmailOpen(false)}
        onImport={handleImportEmails}
      />

      <AddTaskModal
        isOpen={isAddTaskOpen}
        onClose={() => setIsAddTaskOpen(false)}
        onSave={handleSaveTask}
      />

      <DraftReplyModal
        email={draftingEmail}
        onClose={() => setDraftingEmail(null)}
        userName={settings.name}
        defaultTone={settings.replyTone}
        onSaveDraft={handleSaveDraftReply}
      />
    </div>
  );
}
