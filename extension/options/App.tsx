import React, { useEffect, useState } from 'react';
import { storage } from '../lib/storage';
import GithubSettings from './components/GithubSettings';
import NotificationSettings from './components/NotificationSettings';
import AccountSettings from './components/AccountSettings';
import IntegrationStatus from './components/IntegrationStatus';

export default function App() {
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  return (
    <div>
      {message && (
        <div className={`message show ${message.type}`} role="alert">
          {message.text}
        </div>
      )}

      <AccountSettings onMessage={showMessage} />
      <div className="section-divider"></div>

      <GithubSettings onMessage={showMessage} />
      <div className="section-divider"></div>

      <NotificationSettings onMessage={showMessage} />
      <div className="section-divider"></div>

      <IntegrationStatus />
    </div>
  );
}
