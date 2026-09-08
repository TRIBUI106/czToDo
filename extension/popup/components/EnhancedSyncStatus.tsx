import React from 'react';
import type { ExtensionState } from '../../lib/types';

interface EnhancedSyncStatusProps {
  status: ExtensionState['syncStatus'];
  lastSyncTime?: number;
}

export default function EnhancedSyncStatus({
  status,
  lastSyncTime,
}: EnhancedSyncStatusProps) {
  const getStatusInfo = () => {
    switch (status) {
      case 'synced':
        return {
          icon: '✓',
          text: 'Synced',
          color: 'var(--color-success)',
        };
      case 'syncing':
        return {
          icon: '⟳',
          text: 'Syncing...',
          color: 'var(--color-primary)',
          animated: true,
        };
      case 'offline':
        return {
          icon: '⚠',
          text: 'Offline',
          color: 'var(--color-warning)',
        };
      case 'error':
        return {
          icon: '✕',
          text: 'Error',
          color: 'var(--color-error)',
        };
      default:
        return {
          icon: '?',
          text: 'Unknown',
          color: 'var(--color-text-lighter)',
        };
    }
  };

  const info = getStatusInfo();
  const lastSyncMinutesAgo = lastSyncTime
    ? Math.floor((Date.now() - lastSyncTime) / 1000 / 60)
    : null;

  return (
    <div className="sync-status" style={{ color: info.color }}>
      <span
        className={info.animated ? 'sync-spinner' : ''}
        style={{
          display: 'inline-block',
          fontSize: '14px',
        }}
      >
        {info.icon}
      </span>
      <span>{info.text}</span>
      {lastSyncMinutesAgo !== null && (
        <span
          style={{
            fontSize: '11px',
            opacity: 0.7,
            marginLeft: '4px',
          }}
        >
          {lastSyncMinutesAgo === 0 ? 'just now' : `${lastSyncMinutesAgo}m ago`}
        </span>
      )}
    </div>
  );
}
