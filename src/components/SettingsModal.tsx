import React, { useState, useEffect } from 'react';
import { X, Bell, Palette, Eye, Save, Loader, TestTube, Mail } from 'lucide-react';
import { UserSettings } from '../types/Settings';
import { useTheme } from '../contexts/ThemeContext';
import { settingsService } from '../services/settingsService';
import { enhancedNotificationService } from '../services/enhancedNotificationService';
import { emailNotificationService } from '../services/emailNotificationService';

interface SettingsModalProps {
  userId: string;
  onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ userId, onClose }) => {
  const { setTheme } = useTheme();
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notificationToken, setNotificationToken] = useState<string | null>(null);
  const [notificationStatus, setNotificationStatus] = useState<NotificationPermission | 'unsupported'>('default');

  useEffect(() => {
    loadSettings();
    checkNotificationPermission();
  }, [userId]);

  const loadSettings = async () => {
    try {
      let userSettings = await settingsService.getUserSettings(userId);
      if (!userSettings) {
        userSettings = await settingsService.createDefaultSettings(userId);
      }
      if (!userSettings.emailNotifications) {
        userSettings = {
          ...userSettings,
          emailNotifications: {
            enabled: false,
            senderEmail: '',
            receiverEmail: '',
            apiUrl: '',
            authToken: '',
          },
        };
      }
      setSettings(userSettings);
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkNotificationPermission = async () => {
    if (!('Notification' in window)) {
      setNotificationStatus('unsupported');
      return;
    }

    setNotificationStatus(Notification.permission);

    if (Notification.permission === 'granted') {
      const token = await enhancedNotificationService.requestPermission();
      setNotificationToken(token);
    }
  };

  const handleSave = async () => {
    if (!settings) return;

    setSaving(true);
    try {
      await settingsService.updateUserSettings(userId, {
        theme: settings.theme,
        notifications: settings.notifications,
        emailNotifications: settings.emailNotifications,
        preferences: settings.preferences,
      });
      
      // Update theme context
      setTheme(settings.theme);
      
      // Save notification token if available
      if (notificationToken) {
        await enhancedNotificationService.saveNotificationToken(userId, notificationToken);
      }
      
      onClose();
    } catch (error) {
      console.error('Failed to save settings:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleNotificationToggle = async (enabled: boolean) => {
    if (enabled && Notification.permission !== 'granted') {
      const token = await enhancedNotificationService.requestPermission();
      setNotificationToken(token);
      if ('Notification' in window) {
        setNotificationStatus(Notification.permission);
      }
      if (!token) {
        // Permission denied
        return;
      }
    }

    setSettings(prev => prev ? {
      ...prev,
      notifications: { ...prev.notifications, enabled }
    } : null);
  };

  const handleTestNotification = async () => {
    try {
      await enhancedNotificationService.testNotification();
    } catch (error) {
      console.error('Test notification failed:', error);
    }
  };

  const handleTestEmail = async () => {
    if (!settings) return;

    const result = await emailNotificationService.sendTestEmail(settings.emailNotifications);

    switch (result.status) {
      case 'disabled':
        window.alert('Email notifications are disabled. Enable them to send a test.');
        break;
      case 'missing-receiver':
        window.alert('Please enter a receiver email address.');
        break;
      case 'mailto':
        window.alert('No email API configured. Opened a mail draft instead.');
        break;
      case 'sent':
        window.alert('Test email sent successfully.');
        break;
      case 'failed':
        window.alert(`Failed to send test email: ${result.error}`);
        break;
      default:
        break;
    }
  };
  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md p-6">
          <div className="flex items-center justify-center">
            <Loader className="w-6 h-6 animate-spin text-blue-600" />
            <span className="ml-2 text-gray-600 dark:text-gray-300">Loading settings...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!settings) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Settings</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        <div className="p-6 space-y-8">
          {/* Theme Settings */}
          <div>
            <div className="flex items-center mb-4">
              <Palette className="w-5 h-5 text-gray-600 dark:text-gray-400 mr-2" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Appearance</h3>
            </div>
            
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Theme
              </label>
              <div className="grid grid-cols-3 gap-3">
                {(['light', 'dark', 'system'] as const).map((themeOption) => (
                  <button
                    key={themeOption}
                    onClick={() => setSettings(prev => prev ? { ...prev, theme: themeOption } : null)}
                    className={`p-3 rounded-lg border-2 transition-colors capitalize ${
                      settings.theme === themeOption
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                    }`}
                  >
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {themeOption}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Notification Settings */}
          <div>
            <div className="flex items-center mb-4">
              <Bell className="w-5 h-5 text-gray-600 dark:text-gray-400 mr-2" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Notifications</h3>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Enable Notifications
                  </label>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Receive push notifications for important updates
                  </p>
                </div>
                <button
                  onClick={() => handleNotificationToggle(!settings.notifications.enabled)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.notifications.enabled ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.notifications.enabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {notificationStatus === 'denied' && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800">
                  Notifications are blocked in your browser settings. Enable them for this site to receive reminders.
                </div>
              )}

              {notificationStatus === 'unsupported' && (
                <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-xs text-gray-600">
                  Notifications aren&apos;t supported in this browser.
                </div>
              )}

              {settings.notifications.enabled && (
                <>
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Deadline Reminders
                    </label>
                    <button
                      onClick={() => setSettings(prev => prev ? {
                        ...prev,
                        notifications: { ...prev.notifications, deadlineReminders: !prev.notifications.deadlineReminders }
                      } : null)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        settings.notifications.deadlineReminders ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-600'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          settings.notifications.deadlineReminders ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Status Updates
                    </label>
                    <button
                      onClick={() => setSettings(prev => prev ? {
                        ...prev,
                        notifications: { ...prev.notifications, statusUpdates: !prev.notifications.statusUpdates }
                      } : null)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        settings.notifications.statusUpdates ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-600'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          settings.notifications.statusUpdates ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Notification Frequency
                    </label>
                    <select
                      value={settings.notifications.frequency}
                      onChange={(e) => setSettings(prev => prev ? {
                        ...prev,
                        notifications: { ...prev.notifications, frequency: e.target.value as any }
                      } : null)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="immediate">Immediate</option>
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Reminder Days Before Deadline
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="30"
                      value={settings.notifications.reminderDays}
                      onChange={(e) => setSettings(prev => prev ? {
                        ...prev,
                        notifications: { ...prev.notifications, reminderDays: parseInt(e.target.value) }
                      } : null)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>

                  <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                    <button
                      onClick={handleTestNotification}
                      className="flex items-center px-4 py-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                    >
                      <TestTube className="w-4 h-4 mr-2" />
                      Test Notification
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Email Notifications */}
          <div>
            <div className="flex items-center mb-4">
              <Mail className="w-5 h-5 text-gray-600 dark:text-gray-400 mr-2" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Email Notifications</h3>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Enable Email Reminders
                  </label>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Send reminder emails automatically (requires an email API).
                  </p>
                </div>
                <button
                  onClick={() => setSettings(prev => prev ? {
                    ...prev,
                    emailNotifications: {
                      ...prev.emailNotifications,
                      enabled: !prev.emailNotifications.enabled,
                    },
                  } : null)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.emailNotifications.enabled ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.emailNotifications.enabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Sender Email
                  </label>
                  <input
                    type="email"
                    value={settings.emailNotifications.senderEmail}
                    onChange={(e) => setSettings(prev => prev ? {
                      ...prev,
                      emailNotifications: { ...prev.emailNotifications, senderEmail: e.target.value },
                    } : null)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="sender@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Receiver Email
                  </label>
                  <input
                    type="email"
                    value={settings.emailNotifications.receiverEmail}
                    onChange={(e) => setSettings(prev => prev ? {
                      ...prev,
                      emailNotifications: { ...prev.emailNotifications, receiverEmail: e.target.value },
                    } : null)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="a.anassabbou@gmail.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email API URL
                </label>
                <input
                  type="url"
                  value={settings.emailNotifications.apiUrl}
                  onChange={(e) => setSettings(prev => prev ? {
                    ...prev,
                    emailNotifications: { ...prev.emailNotifications, apiUrl: e.target.value },
                  } : null)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="https://your-email-api.example.com/send"
                />
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  Provide an email API endpoint to send reminders automatically (defaults to /api/reminders).
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Authorization Token
                </label>
                <input
                  type="password"
                  value={settings.emailNotifications.authToken}
                  onChange={(e) => setSettings(prev => prev ? {
                    ...prev,
                    emailNotifications: { ...prev.emailNotifications, authToken: e.target.value },
                  } : null)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Bearer token"
                />
              </div>

              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={handleTestEmail}
                  className="flex items-center px-4 py-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                >
                  <TestTube className="w-4 h-4 mr-2" />
                  Send Test Email
                </button>
              </div>
            </div>
          </div>

          {/* View Preferences */}
          <div>
            <div className="flex items-center mb-4">
              <Eye className="w-5 h-5 text-gray-600 dark:text-gray-400 mr-2" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">View Preferences</h3>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Default View
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {(['grid', 'list'] as const).map((view) => (
                    <button
                      key={view}
                      onClick={() => setSettings(prev => prev ? {
                        ...prev,
                        preferences: { ...prev.preferences, defaultView: view }
                      } : null)}
                      className={`p-3 rounded-lg border-2 transition-colors capitalize ${
                        settings.preferences.defaultView === view
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                      }`}
                    >
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {view}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Show Statistics
                </label>
                <button
                  onClick={() => setSettings(prev => prev ? {
                    ...prev,
                    preferences: { ...prev.preferences, showStats: !prev.preferences.showStats }
                  } : null)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.preferences.showStats ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.preferences.showStats ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end space-x-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <Loader className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
