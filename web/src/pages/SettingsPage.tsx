import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sliders,
  Bell,
  Cpu,
  AlertTriangle,
  Moon,
  Sun,
  Globe,
  Download,
  Trash2,
  Loader2,
  Volume2,
  Mail,
  Smartphone,
  X,
  Mic,
  MessageSquare,
} from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';

type SettingsTab = 'preferences' | 'notifications' | 'integrations' | 'account';

type UserSettings = {
  theme: 'light' | 'dark';
  timezone: string;
  pushNotifications: boolean;
  emailNotifications: boolean;
  reminderSound: boolean;
  githubConnected: boolean;
  githubHandle: string | null;
};

function GithubIcon({ size = 20, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
      />
    </svg>
  );
}

const COMMON_TIMEZONES = [
  'UTC',
  'Asia/Dhaka',
  'America/New_York',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Paris',
  'Asia/Tokyo',
  'Asia/Kolkata',
  'Australia/Sydney',
];

export function SettingsPage() {
  const queryClient = useQueryClient();
  const { logout } = useAuth();
  const { theme: activeTheme, setTheme: setActiveTheme } = useTheme();
  const { addToast } = useToast();

  const [activeTab, setActiveTab] = useState<SettingsTab>('preferences');

  // Edith preferences local state
  const [aiVoiceMode, setAiVoiceMode] = useState(false);
  const [aiPromptStyle, setAiPromptStyle] = useState<'concise' | 'detailed' | 'encouraging'>('concise');

  // Delete modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  // Fetch settings
  const { data: settingsData, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const { data } = await api.get('/api/settings');
      return data.settings as UserSettings;
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (updatedPayload: Partial<UserSettings>) => {
      const { data } = await api.put('/api/settings', updatedPayload);
      return data.settings as UserSettings;
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(['settings'], updated);
      addToast({
        type: 'success',
        title: 'Settings Saved',
        message: 'Your preferences have been updated.',
      });
    },
  });

  const disconnectGithubMutation = useMutation({
    mutationFn: async () => {
      await api.post('/api/settings/github/disconnect');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      queryClient.invalidateQueries({ queryKey: ['githubData'] });
      addToast({
        type: 'info',
        title: 'GitHub Disconnected',
        message: 'Your GitHub account link has been removed.',
      });
    },
  });

  const exportMutation = useMutation({
    mutationFn: async () => {
      const response = await api.get('/api/user/export');
      return response.data;
    },
    onSuccess: (data) => {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Progress_Copilot_Export_${Date.now()}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      addToast({
        type: 'success',
        title: 'Data Exported',
        message: 'Your complete user JSON file has been downloaded.',
      });
    },
  });

  const deleteAccountMutation = useMutation({
    mutationFn: async () => {
      await api.delete('/api/user/account', {
        data: { password: deletePassword, confirmText: deleteConfirmText },
      });
    },
    onSuccess: () => {
      addToast({
        type: 'warning',
        title: 'Account Deleted',
        message: 'Your account has been permanently removed.',
      });
      logout();
    },
    onError: (err: any) => {
      addToast({
        type: 'warning',
        title: 'Deletion Failed',
        message: err?.response?.data?.error || err?.message || 'Could not delete account.',
      });
    },
  });

  const settings = settingsData || {
    theme: activeTheme,
    timezone: 'UTC',
    pushNotifications: true,
    emailNotifications: true,
    reminderSound: true,
    githubConnected: false,
    githubHandle: null,
  };

  const handleTogglePreference = (key: keyof UserSettings, currentValue: boolean) => {
    updateMutation.mutate({ [key]: !currentValue });
  };

  const handleThemeChange = (newTheme: 'light' | 'dark') => {
    setActiveTheme(newTheme);
    updateMutation.mutate({ theme: newTheme });
  };

  const handleAutoDetectTimezone = () => {
    try {
      const detected = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (detected) {
        updateMutation.mutate({ timezone: detected });
        addToast({
          type: 'success',
          title: 'Timezone Detected',
          message: `Set to ${detected}`,
        });
      }
    } catch {
      // Fallback
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header Bar */}
      <div className="rounded-2xl border border-purple-200/80 dark:border-cardBorder bg-gradient-to-br from-slate-50/95 via-indigo-50/70 to-purple-50/60 dark:from-[#160e2e]/90 dark:to-[#0c071a]/95 p-5 sm:p-6 shadow-md">
        <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
          <Sliders className="text-purple-600 dark:text-fuchsia-400" size={26} /> Application Settings
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-violet-300/80 mt-1">
          Manage your app preferences, notifications, integrations, and account safety.
        </p>
      </div>

      {/* Main Split Layout */}
      <div className="flex flex-col md:flex-row gap-6">
        {/* Left Navigation Sidebar Tabs */}
        <aside className="w-full md:w-64 shrink-0 space-y-1.5">
          <TabButton
            active={activeTab === 'preferences'}
            onClick={() => setActiveTab('preferences')}
            icon={<Sliders size={18} />}
            label="App Preferences"
          />
          <TabButton
            active={activeTab === 'notifications'}
            onClick={() => setActiveTab('notifications')}
            icon={<Bell size={18} />}
            label="Notifications"
          />
          <TabButton
            active={activeTab === 'integrations'}
            onClick={() => setActiveTab('integrations')}
            icon={<Cpu size={18} />}
            label="Integrations & AI"
          />
          <TabButton
            active={activeTab === 'account'}
            onClick={() => setActiveTab('account')}
            icon={<AlertTriangle size={18} />}
            label="Account & Danger Zone"
            danger
          />
        </aside>

        {/* Right Content View */}
        <main className="flex-1 rounded-2xl border border-purple-200/80 dark:border-cardBorder bg-gradient-to-br from-slate-50/95 via-indigo-50/70 to-purple-50/60 dark:from-[#160e2e]/90 dark:to-[#0c071a]/95 p-6 sm:p-8 shadow-md">
          {isLoading && (
            <div className="space-y-4 py-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 rounded-xl bg-slate-200/60 dark:bg-white/5 animate-pulse" />
              ))}
            </div>
          )}

          {!isLoading && (
            <AnimatePresence mode="wait">
              {/* Tab 1: App Preferences */}
              {activeTab === 'preferences' && (
                <motion.div
                  key="preferences"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="space-y-6"
                >
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-1">Theme Mode</h2>
                    <p className="text-xs text-slate-500 dark:text-violet-300/70 mb-4">
                      Select your preferred UI appearance theme.
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        type="button"
                        onClick={() => handleThemeChange('light')}
                        className={`p-4 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all transform active:scale-95 font-bold text-sm ${
                          activeTheme === 'light'
                            ? 'bg-gradient-to-br from-indigo-600 to-purple-600 text-white border-purple-500 shadow-glow-indigo ring-2 ring-purple-400'
                            : 'border-slate-300 dark:border-cardBorder text-slate-700 dark:text-violet-200 hover:bg-purple-500/10 bg-white dark:bg-[#161F30]'
                        }`}
                      >
                        <Sun size={24} className={activeTheme === 'light' ? 'text-amber-300' : 'text-amber-500'} />
                        <span>Light Mode</span>
                        <span className="text-[10px] opacity-80 font-normal">Clean Slate & Soft Gradients</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleThemeChange('dark')}
                        className={`p-4 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all transform active:scale-95 font-bold text-sm ${
                          activeTheme === 'dark'
                            ? 'bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 text-white border-purple-500 shadow-glow-purple ring-2 ring-purple-400'
                            : 'border-slate-300 dark:border-cardBorder text-slate-700 dark:text-violet-200 hover:bg-purple-500/10 bg-white dark:bg-[#161F30]'
                        }`}
                      >
                        <Moon size={24} className={activeTheme === 'dark' ? 'text-purple-200' : 'text-purple-400'} />
                        <span>Dark Mode</span>
                        <span className="text-[10px] opacity-80 font-normal">Deep Obsidian & Neon Glows</span>
                      </button>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-purple-200/60 dark:border-cardBorder/40">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-2">
                      <Globe size={20} className="text-purple-600 dark:text-fuchsia-400" /> Timezone Setting
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-violet-300/70 mb-4">
                      Ensure your reminders and target deadlines trigger at the exact right local time.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center gap-3">
                      <select
                        value={settings.timezone}
                        onChange={(e) => updateMutation.mutate({ timezone: e.target.value })}
                        className="w-full sm:flex-1 rounded-xl bg-slate-100 dark:bg-[#0c0a17] border border-purple-200 dark:border-cardBorder px-4 py-2.5 text-slate-900 dark:text-white font-medium text-sm focus:outline-none focus:border-purple-500 transition"
                      >
                        {COMMON_TIMEZONES.map((tz) => (
                          <option key={tz} value={tz}>
                            {tz}
                          </option>
                        ))}
                      </select>

                      <button
                        type="button"
                        onClick={handleAutoDetectTimezone}
                        className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-purple-500/15 hover:bg-purple-500/25 text-purple-700 dark:text-fuchsia-300 font-bold text-xs transition border border-purple-500/20 shrink-0"
                      >
                        Auto-Detect Timezone
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Tab 2: Notifications */}
              {activeTab === 'notifications' && (
                <motion.div
                  key="notifications"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="space-y-6"
                >
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-1">Notification Preferences</h2>
                  <p className="text-xs text-slate-500 dark:text-violet-300/70 mb-6">
                    Control how and when Progress Copilot alerts you.
                  </p>

                  <div className="space-y-4">
                    <ToggleCard
                      icon={<Smartphone size={18} className="text-sky-500" />}
                      title="Push Notifications"
                      subtitle="Get real-time browser alerts when targets and tasks are due."
                      checked={settings.pushNotifications}
                      onChange={() => handleTogglePreference('pushNotifications', settings.pushNotifications)}
                    />

                    <ToggleCard
                      icon={<Mail size={18} className="text-fuchsia-500" />}
                      title="Email Reports & Summary"
                      subtitle="Receive daily streak updates and progress reports in your inbox."
                      checked={settings.emailNotifications}
                      onChange={() => handleTogglePreference('emailNotifications', settings.emailNotifications)}
                    />

                    <ToggleCard
                      icon={<Volume2 size={18} className="text-amber-500" />}
                      title="Reminder Sound Effects"
                      subtitle="Play a gentle audio chime when a reminder alert pops up."
                      checked={settings.reminderSound}
                      onChange={() => handleTogglePreference('reminderSound', settings.reminderSound)}
                    />
                  </div>
                </motion.div>
              )}

              {/* Tab 3: Integrations & AI */}
              {activeTab === 'integrations' && (
                <motion.div
                  key="integrations"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="space-y-6"
                >
                  {/* GitHub Card */}
                  <div className="p-5 rounded-2xl bg-white/70 dark:bg-white/[0.02] border border-purple-200/80 dark:border-cardBorder space-y-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-md">
                          <GithubIcon size={22} />
                        </div>
                        <div>
                          <h3 className="font-bold text-base text-slate-900 dark:text-white">GitHub Integration</h3>
                          <p className="text-xs text-slate-500 dark:text-violet-300/70">
                            {settings.githubConnected
                              ? `Connected as @${settings.githubHandle}`
                              : 'Not connected to any GitHub profile'}
                          </p>
                        </div>
                      </div>

                      {settings.githubConnected ? (
                        <button
                          type="button"
                          onClick={() => disconnectGithubMutation.mutate()}
                          disabled={disconnectGithubMutation.isPending}
                          className="px-4 py-2 rounded-xl border border-rose-300 dark:border-rose-500/30 text-rose-600 dark:text-rose-400 font-bold text-xs hover:bg-rose-500/10 transition shrink-0"
                        >
                          {disconnectGithubMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : 'Disconnect'}
                        </button>
                      ) : (
                        <span className="text-xs font-semibold text-slate-400 dark:text-violet-300/50">
                          Use Projects page to connect
                        </span>
                      )}
                    </div>
                  </div>

                  {/* AI Assistant (Edith) Card */}
                  <div className="p-5 rounded-2xl bg-white/70 dark:bg-white/[0.02] border border-purple-200/80 dark:border-cardBorder space-y-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-fuchsia-600 to-indigo-600 text-white flex items-center justify-center shadow-md">
                        <Cpu size={22} />
                      </div>
                      <div>
                        <h3 className="font-bold text-base text-slate-900 dark:text-white">Edith AI Assistant Settings</h3>
                        <p className="text-xs text-slate-500 dark:text-violet-300/70">
                          Customize your AI Copilot responses and voice mode.
                        </p>
                      </div>
                    </div>

                    <ToggleCard
                      icon={<Mic size={18} className="text-purple-500" />}
                      title="AI Voice Mode"
                      subtitle="Allow Edith AI assistant to answer using voice speech output."
                      checked={aiVoiceMode}
                      onChange={() => setAiVoiceMode((v) => !v)}
                    />

                    <div>
                      <label className="block text-xs font-bold text-slate-600 dark:text-violet-300/80 mb-2 flex items-center gap-1.5">
                        <MessageSquare size={14} /> AI Response Style
                      </label>
                      <div className="grid grid-cols-3 gap-3">
                        {(['concise', 'detailed', 'encouraging'] as const).map((style) => (
                          <button
                            key={style}
                            type="button"
                            onClick={() => setAiPromptStyle(style)}
                            className={`py-2 rounded-xl text-xs font-bold capitalize transition border ${
                              aiPromptStyle === style
                                ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                                : 'border-purple-200 dark:border-cardBorder text-slate-700 dark:text-violet-200 hover:bg-purple-500/10'
                            }`}
                          >
                            {style}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Tab 4: Account & Danger Zone */}
              {activeTab === 'account' && (
                <motion.div
                  key="account"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="space-y-6"
                >
                  {/* Export Data */}
                  <div className="p-5 rounded-2xl bg-white/70 dark:bg-white/[0.02] border border-purple-200/80 dark:border-cardBorder space-y-3">
                    <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                      <Download size={18} className="text-purple-600 dark:text-fuchsia-400" /> Export Personal Data
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-violet-300/70 leading-relaxed">
                      Download a complete backup JSON file containing all your targets, tasks, study notes, courses, reminders, and profile records.
                    </p>
                    <button
                      type="button"
                      onClick={() => exportMutation.mutate()}
                      disabled={exportMutation.isPending}
                      className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-sky-600 text-white text-xs font-bold shadow-md hover:brightness-110 active:scale-[0.98] disabled:opacity-50 inline-flex items-center gap-2 transition"
                    >
                      {exportMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                      Export My Data (JSON)
                    </button>
                  </div>

                  {/* Danger Zone: Delete Account */}
                  <div className="p-5 rounded-2xl bg-rose-500/10 border border-rose-500/30 space-y-3">
                    <h3 className="font-bold text-base text-rose-600 dark:text-rose-400 flex items-center gap-2">
                      <AlertTriangle size={18} /> Danger Zone: Delete Account
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-rose-200/80 leading-relaxed">
                      Permanently delete your account and all stored data. This action is irreversible and cannot be undone.
                    </p>
                    <button
                      type="button"
                      onClick={() => setDeleteModalOpen(true)}
                      className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md active:scale-[0.98] inline-flex items-center gap-2 transition"
                    >
                      <Trash2 size={16} /> Delete Account
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </main>
      </div>

      {/* Delete Account Confirmation Modal */}
      <AnimatePresence>
        {deleteModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 15 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-md rounded-2xl border-2 border-rose-500/40 bg-gradient-to-b from-slate-50 via-rose-50/50 to-purple-50 dark:from-[#1d0b17] dark:via-[#150711] dark:to-[#0b0617] p-6 shadow-2xl space-y-5"
            >
              <div className="flex items-center justify-between pb-3 border-b border-rose-500/20">
                <h3 className="text-xl font-bold text-rose-600 dark:text-rose-400 flex items-center gap-2">
                  <AlertTriangle size={22} /> Confirm Account Deletion
                </h3>
                <button
                  type="button"
                  onClick={() => setDeleteModalOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white"
                >
                  <X size={18} />
                </button>
              </div>

              <p className="text-xs text-slate-600 dark:text-rose-200/80 leading-relaxed font-medium">
                This will permanently delete your profile, targets, tasks, notes, courses, and reminders. Enter your password and type <span className="font-extrabold text-rose-600 dark:text-rose-400 uppercase">"DELETE"</span> to confirm.
              </p>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-violet-200 mb-1">
                    Your Password
                  </label>
                  <input
                    type="password"
                    required
                    value={deletePassword}
                    onChange={(e) => setDeletePassword(e.target.value)}
                    placeholder="Enter current password"
                    className="w-full rounded-xl bg-slate-100 dark:bg-[#0c0a17] border border-rose-300 dark:border-rose-500/40 px-4 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-rose-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-violet-200 mb-1">
                    Type "DELETE" to confirm
                  </label>
                  <input
                    type="text"
                    required
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    placeholder="DELETE"
                    className="w-full rounded-xl bg-slate-100 dark:bg-[#0c0a17] border border-rose-300 dark:border-rose-500/40 px-4 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-rose-500 transition font-bold"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-rose-500/20">
                <button
                  type="button"
                  onClick={() => setDeleteModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 dark:border-cardBorder text-slate-700 dark:text-violet-200 text-xs font-bold hover:bg-slate-500/10"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={
                    deleteAccountMutation.isPending ||
                    !deletePassword ||
                    deleteConfirmText !== 'DELETE'
                  }
                  onClick={() => deleteAccountMutation.mutate()}
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md disabled:opacity-50 inline-flex items-center gap-1.5 transition"
                >
                  {deleteAccountMutation.isPending && <Loader2 size={14} className="animate-spin" />}
                  <Trash2 size={14} /> Permanently Delete Account
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ──────────────── Helper Components ──────────────── */

function TabButton({
  active,
  onClick,
  icon,
  label,
  danger = false,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-xs sm:text-sm transition text-left ${
        active
          ? danger
            ? 'bg-rose-600 text-white shadow-md'
            : 'bg-purple-600 text-white shadow-md'
          : danger
          ? 'text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 border border-rose-500/20'
          : 'text-slate-700 dark:text-violet-200 hover:bg-purple-500/10 border border-purple-200/50 dark:border-white/5'
      }`}
    >
      <span className="shrink-0">{icon}</span>
      <span className="truncate">{label}</span>
    </button>
  );
}

function ToggleCard({
  icon,
  title,
  subtitle,
  checked,
  onChange,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 p-4 rounded-xl bg-white/70 dark:bg-white/[0.02] border border-purple-200/80 dark:border-cardBorder">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-9 h-9 rounded-xl bg-purple-500/10 flex items-center justify-center shrink-0">
          {icon}
        </div>
        <div className="min-w-0">
          <h4 className="font-bold text-sm text-slate-900 dark:text-white truncate">{title}</h4>
          <p className="text-xs text-slate-500 dark:text-violet-300/70 truncate">{subtitle}</p>
        </div>
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={onChange}
        className={`w-12 h-6 rounded-full p-1 transition-colors duration-200 relative shrink-0 cursor-pointer ${
          checked ? 'bg-purple-600' : 'bg-slate-300 dark:bg-white/20'
        }`}
      >
        <motion.div
          animate={{ x: checked ? 24 : 0 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          className="w-4 h-4 rounded-full bg-white shadow-md"
        />
      </button>
    </div>
  );
}
