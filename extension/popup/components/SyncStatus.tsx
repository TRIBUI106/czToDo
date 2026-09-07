import React from 'react';

interface SyncStatusProps {
  status: string;
}

export default function SyncStatus({ status }: SyncStatusProps) {
  const statusConfig: Record<
    string,
    { color: string; label: string }
  > = {
    synced: {
      color: 'var(--color-success)',
      label: 'Synced',
    },
    syncing: {
      color: 'var(--color-primary)',
      label: 'Syncing...',
    },
    offline: {
      color: 'var(--color-text-light)',
      label: 'Offline',
    },
    error: {
      color: 'var(--color-error)',
      label: 'Sync Error',
    },
  };

  const config = statusConfig[status] || statusConfig.offline;

  return (
    <div
      style={{
        fontSize: '12px',
        color: config.color,
        fontWeight: 500,
      }}
    >
      {config.label}
    </div>
  );
}
