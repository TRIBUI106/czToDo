import React, { useEffect, useState } from 'react';

interface Integration {
  name: string;
  status: 'configured' | 'not_configured';
  description: string;
  icon: string;
}

export default function IntegrationStatus() {
  const [integrations, setIntegrations] = useState<Integration[]>([
    {
      name: 'GitHub',
      status: 'not_configured',
      description: 'Automatically sync assigned GitHub issues',
      icon: '🐙',
    },
    {
      name: 'Gmail',
      status: 'not_configured',
      description: 'Capture emails directly as to-dos',
      icon: '📧',
    },
    {
      name: 'Slack',
      status: 'not_configured',
      description: 'Create to-dos from Slack messages',
      icon: '💬',
    },
    {
      name: 'Supabase Sync',
      status: 'configured',
      description: 'Sync to-dos across all your devices',
      icon: '☁️',
    },
  ]);

  useEffect(() => {
    checkIntegrationStatus();
  }, []);

  async function checkIntegrationStatus() {
    try {
      const result = await chrome.storage.local.get(['githubToken']);

      setIntegrations(prev => prev.map(integration => {
        if (integration.name === 'GitHub') {
          return {
            ...integration,
            status: result.githubToken ? 'configured' : 'not_configured',
          };
        }
        return integration;
      }));
    } catch (err) {
      console.error('Failed to check integration status:', err);
    }
  }

  return (
    <div className="settings-section">
      <h2>Integration Status</h2>
      <p>Overview of available integrations and their current status.</p>

      <div style={{ display: 'grid', gap: '16px', marginTop: '16px' }}>
        {integrations.map(integration => (
          <div
            key={integration.name}
            style={{
              padding: '16px',
              border: `1px solid var(--color-border)`,
              borderRadius: '6px',
              backgroundColor: integration.status === 'configured'
                ? 'rgba(16, 185, 129, 0.05)'
                : 'rgba(107, 114, 128, 0.05)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <span style={{ fontSize: '24px' }}>{integration.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600 }}>{integration.name}</div>
                <div style={{ fontSize: '12px', color: 'var(--color-text-light)' }}>
                  {integration.description}
                </div>
              </div>
              <div
                className="status-indicator"
                style={{
                  backgroundColor: integration.status === 'configured'
                    ? 'rgba(16, 185, 129, 0.1)'
                    : 'rgba(107, 114, 128, 0.1)',
                }}
              >
                <span
                  className={`status-dot ${integration.status === 'configured' ? 'online' : 'offline'}`}
                ></span>
                <span>{integration.status === 'configured' ? 'Connected' : 'Not connected'}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: '24px', padding: '16px', backgroundColor: 'rgba(59, 130, 246, 0.05)', borderRadius: '6px', borderLeft: '4px solid var(--color-primary)' }}>
        <strong>💡 Tip:</strong> More integrations (Gmail, Slack) will be available soon. Come back to this page to enable them.
      </div>
    </div>
  );
}
