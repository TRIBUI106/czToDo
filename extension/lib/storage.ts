// extension/lib/storage.ts

import { AuthToken, ExtensionState, SyncQueueItem, Todo } from './types';

// Chrome storage helpers
export const storage = {
  // Sync storage (cross-device)
  async getTodos(): Promise<Todo[]> {
    const result = (await chrome.storage.sync.get('todos')) as Record<
      string,
      unknown
    >;
    return (result.todos as Todo[]) || [];
  },

  async setTodos(todos: Todo[]): Promise<void> {
    await chrome.storage.sync.set({ todos });
  },

  async setSyncStatus(status: ExtensionState['syncStatus']): Promise<void> {
    await chrome.storage.sync.set({ syncStatus: status });
  },

  async getSyncStatus(): Promise<ExtensionState['syncStatus']> {
    const result = (await chrome.storage.sync.get('syncStatus')) as Record<
      string,
      unknown
    >;
    return (result.syncStatus as ExtensionState['syncStatus']) || 'synced';
  },

  async setLastSyncTime(time: number): Promise<void> {
    await chrome.storage.sync.set({ lastSyncTime: time });
  },

  async getLastSyncTime(): Promise<number> {
    const result = (await chrome.storage.sync.get('lastSyncTime')) as Record<
      string,
      unknown
    >;
    return (result.lastSyncTime as number) || 0;
  },

  // Local storage (device-specific)
  async getAuthToken(): Promise<AuthToken | null> {
    const result = (await chrome.storage.local.get('authToken')) as Record<
      string,
      unknown
    >;
    return (result.authToken as AuthToken) || null;
  },

  async setAuthToken(token: AuthToken | null): Promise<void> {
    if (token) {
      await chrome.storage.local.set({ authToken: token });
    } else {
      await chrome.storage.local.remove('authToken');
    }
  },

  async getSyncQueue(): Promise<SyncQueueItem[]> {
    const result = (await chrome.storage.local.get('syncQueue')) as Record<
      string,
      unknown
    >;
    return (result.syncQueue as SyncQueueItem[]) || [];
  },

  async addToSyncQueue(item: SyncQueueItem): Promise<void> {
    const queue = await this.getSyncQueue();
    queue.push(item);
    await chrome.storage.local.set({ syncQueue: queue });
  },

  async clearSyncQueue(): Promise<void> {
    await chrome.storage.local.remove('syncQueue');
  },

  async removeSyncQueueItem(id: string): Promise<void> {
    const queue = await this.getSyncQueue();
    const filtered = queue.filter(item => item.id !== id);
    await chrome.storage.local.set({ syncQueue: filtered });
  },

  async getOnlineStatus(): Promise<boolean> {
    const result = (await chrome.storage.local.get('isOnline')) as Record<
      string,
      unknown
    >;
    return (result.isOnline as boolean) !== false; // default to online
  },

  async setOnlineStatus(isOnline: boolean): Promise<void> {
    await chrome.storage.local.set({ isOnline });
  },

  async getGitHubToken(): Promise<string | null> {
    const result = (await chrome.storage.local.get('githubToken')) as Record<
      string,
      unknown
    >;
    return (result.githubToken as string) || null;
  },

  async setGitHubToken(token: string | null): Promise<void> {
    if (token) {
      await chrome.storage.local.set({ githubToken: token });
    } else {
      await chrome.storage.local.remove('githubToken');
    }
  },

  async getGitHubSyncStatus(): Promise<{
    lastSyncAt?: number;
    processedIssueIds?: string[];
  }> {
    const result = (await chrome.storage.local.get(
      'githubSyncStatus'
    )) as Record<string, unknown>;
    return (result.githubSyncStatus as {
      lastSyncAt?: number;
      processedIssueIds?: string[];
    }) || {};
  },

  async setGitHubSyncStatus(status: {
    lastSyncAt?: number;
    processedIssueIds?: string[];
  }): Promise<void> {
    await chrome.storage.local.set({ githubSyncStatus: status });
  },

  async updateSyncQueueItem(
    id: string,
    updates: Partial<SyncQueueItem>
  ): Promise<void> {
    const queue = await this.getSyncQueue();
    const index = queue.findIndex(item => item.id === id);
    if (index !== -1) {
      queue[index] = { ...queue[index], ...updates };
      await chrome.storage.local.set({ syncQueue: queue });
    }
  },
};
