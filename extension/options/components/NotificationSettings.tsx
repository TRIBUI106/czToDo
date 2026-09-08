import React, { useEffect, useState } from 'react';

interface NotificationPreferences {
  enableNotifications: boolean;
  notifyOnSync: boolean;
  notifyOnError: boolean;
  notifyOnNewTodo: boolean;
}

interface NotificationSettingsProps {
  onMessage: (type: 'success' | 'error', text: string) => void;
}

export default function NotificationSettings({ onMessage }: NotificationSettingsProps) {
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    enableNotifications: true,
    notifyOnSync: false,
    notifyOnError: true,
    notifyOnNewTodo: true,
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadPreferences();
  }, []);

  async function loadPreferences() {
    try {
      const result = await chrome.storage.local.get('notificationPreferences');
      if (result.notificationPreferences) {
        setPreferences(result.notificationPreferences);
      }
    } catch (err) {
      console.error('Failed to load notification preferences:', err);
    }
  }

  async function handleSave() {
    try {
      setIsLoading(true);
      await chrome.storage.local.set({ notificationPreferences: preferences });
      onMessage('success', 'Notification settings saved');
    } catch (err) {
      onMessage('error', 'Failed to save notification settings');
    } finally {
      setIsLoading(false);
    }
  }

  function handleToggle(key: keyof NotificationPreferences) {
    setPreferences(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  }

  return (
    <div className="settings-section">
      <h2>Notifications</h2>
      <p>Configure how and when you receive notifications from czToDo.</p>

      <div className="form-group">
        <label className="toggle">
          <input
            type="checkbox"
            checked={preferences.enableNotifications}
            onChange={() => handleToggle('enableNotifications')}
            disabled={isLoading}
          />
          <span>Enable notifications</span>
        </label>
        <div className="form-help">Global toggle for all notification types</div>
      </div>

      {preferences.enableNotifications && (
        <>
          <div className="form-group">
            <label className="toggle">
              <input
                type="checkbox"
                checked={preferences.notifyOnSync}
                onChange={() => handleToggle('notifyOnSync')}
                disabled={isLoading}
              />
              <span>Notify when sync completes</span>
            </label>
            <div className="form-help">Shows notification when to-dos are synced to the cloud</div>
          </div>

          <div className="form-group">
            <label className="toggle">
              <input
                type="checkbox"
                checked={preferences.notifyOnError}
                onChange={() => handleToggle('notifyOnError')}
                disabled={isLoading}
              />
              <span>Notify on errors</span>
            </label>
            <div className="form-help">Shows notification if something goes wrong during sync</div>
          </div>

          <div className="form-group">
            <label className="toggle">
              <input
                type="checkbox"
                checked={preferences.notifyOnNewTodo}
                onChange={() => handleToggle('notifyOnNewTodo')}
                disabled={isLoading}
              />
              <span>Notify when new to-do is added</span>
            </label>
            <div className="form-help">Shows notification when a to-do is added from context menu or integrations</div>
          </div>
        </>
      )}

      <div className="button-group">
        <button
          className="btn-primary"
          onClick={handleSave}
          disabled={isLoading}
        >
          Save Preferences
        </button>
      </div>
    </div>
  );
}
