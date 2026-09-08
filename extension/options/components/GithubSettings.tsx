import React, { useEffect, useState } from 'react';
import { storage } from '../../lib/storage';

interface GithubSettingsProps {
  onMessage: (type: 'success' | 'error', text: string) => void;
}

export default function GithubSettings({ onMessage }: GithubSettingsProps) {
  const [githubToken, setGithubToken] = useState('');
  const [githubUsername, setGithubUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    try {
      const result = await chrome.storage.local.get(['githubToken', 'githubUsername']);
      setGithubToken(result.githubToken || '');
      setGithubUsername(result.githubUsername || '');
    } catch (err) {
      console.error('Failed to load GitHub settings:', err);
    }
  }

  async function handleSave() {
    try {
      setIsLoading(true);

      // Validate token format (basic check)
      if (githubToken && !githubToken.startsWith('ghp_')) {
        onMessage('error', 'Invalid GitHub token format');
        return;
      }

      await chrome.storage.local.set({
        githubToken,
        githubUsername: githubUsername || '',
      });

      setIsSaved(true);
      onMessage('success', 'GitHub settings saved');
      setTimeout(() => setIsSaved(false), 3000);
    } catch (err) {
      onMessage('error', 'Failed to save GitHub settings');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleTestConnection() {
    if (!githubToken) {
      onMessage('error', 'Please enter a GitHub token first');
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch('https://api.github.com/user', {
        headers: {
          Authorization: `Bearer ${githubToken}`,
          Accept: 'application/vnd.github+json',
        },
      });

      if (!response.ok) {
        throw new Error('Invalid token or API error');
      }

      const data = await response.json();
      setGithubUsername(data.login);
      await chrome.storage.local.set({ githubUsername: data.login });

      onMessage('success', `Connected to GitHub as @${data.login}`);
    } catch (err) {
      onMessage('error', 'Failed to connect to GitHub. Check your token.');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDisconnect() {
    try {
      setIsLoading(true);
      await chrome.storage.local.set({
        githubToken: '',
        githubUsername: '',
      });
      setGithubToken('');
      setGithubUsername('');
      onMessage('success', 'GitHub disconnected');
    } catch (err) {
      onMessage('error', 'Failed to disconnect GitHub');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="settings-section">
      <h2>GitHub Integration</h2>
      <p>Connect your GitHub account to automatically sync assigned issues as to-dos.</p>

      <div className="info-box">
        <strong>How to get your GitHub token:</strong>
        <br />
        1. Go to GitHub Settings → Developer settings → Personal access tokens
        <br />
        2. Click "Generate new token"
        <br />
        3. Select scopes: <code>repo</code>, <code>read:user</code>
        <br />
        4. Copy the token and paste it below
      </div>

      {githubUsername && (
        <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: 'rgba(16, 185, 129, 0.1)', borderRadius: '6px', color: '#10b981' }}>
          ✓ Connected to GitHub as <strong>@{githubUsername}</strong>
        </div>
      )}

      <div className="form-group">
        <label>GitHub Personal Access Token</label>
        <input
          type="password"
          value={githubToken}
          onChange={(e) => setGithubToken(e.target.value)}
          placeholder="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxx"
          disabled={isLoading}
        />
        <div className="form-help">Your token is stored securely in your browser's local storage and never sent to external servers</div>
      </div>

      <div className="button-group">
        <button
          className="btn-primary"
          onClick={handleTestConnection}
          disabled={isLoading || !githubToken}
        >
          {isLoading ? 'Testing...' : 'Test Connection'}
        </button>
        <button
          onClick={handleSave}
          disabled={isLoading}
        >
          {isSaved ? '✓ Saved' : 'Save'}
        </button>
        {githubUsername && (
          <button
            className="btn-danger"
            onClick={handleDisconnect}
            disabled={isLoading}
          >
            Disconnect
          </button>
        )}
      </div>
    </div>
  );
}
