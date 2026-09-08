import React, { useEffect, useState } from 'react';
import { getSupabaseClient, signOut } from '../../lib/supabase';

interface AccountSettingsProps {
  onMessage: (type: 'success' | 'error', text: string) => void;
}

export default function AccountSettings({ onMessage }: AccountSettingsProps) {
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, []);

  async function loadUser() {
    try {
      const client = await getSupabaseClient();
      const { data: { user } } = await client.auth.getUser();
      if (user) {
        setUser({
          id: user.id,
          email: user.email || '',
        });
      }
    } catch (err) {
      console.error('Failed to load user:', err);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleLogout() {
    try {
      setIsLoading(true);
      await signOut();
      setUser(null);
      onMessage('success', 'Logged out successfully');
    } catch (err) {
      onMessage('error', 'Failed to logout');
    } finally {
      setIsLoading(false);
    }
  }

  if (isLoading) {
    return (
      <div className="settings-section">
        <h2>Account</h2>
        <p>Loading account information...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="settings-section">
        <h2>Account</h2>
        <p>You are not logged in. Open the extension popup to login or create an account.</p>
      </div>
    );
  }

  return (
    <div className="settings-section">
      <h2>Account</h2>
      <div className="form-group">
        <label>Email</label>
        <input type="email" value={user.email} disabled style={{ opacity: 0.7 }} />
        <div className="form-help">Your Supabase authentication email</div>
      </div>

      <div className="form-group">
        <label>User ID</label>
        <input type="text" value={user.id} disabled style={{ opacity: 0.7 }} />
        <div className="form-help">Unique identifier for your account</div>
      </div>

      <div className="button-group">
        <button
          className="btn-danger"
          onClick={handleLogout}
          disabled={isLoading}
        >
          {isLoading ? 'Logging out...' : 'Logout'}
        </button>
      </div>
    </div>
  );
}
