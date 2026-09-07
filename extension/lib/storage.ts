// extension/lib/storage.ts

import { AuthToken, ExtensionState, SyncQueueItem, Todo } from './types';

// Chrome storage helpers
export const storage = {
  // Sync storage (cross-device)
  async getTodos(): Promise<Todo[]> {
    const result = await chrome.storage.sync.get('todos');
    return result.todos || [];
  },

  async setTodos(todos: Todo[]): Promise<void> {
    await chrome.storage.sync.set({ todos });
  },

  async setSyncStatus(status: ExtensionState['syncStatus']): Promise<void> {
    await chrome.storage.sync.set({ syncStatus: status });
  },

  async getSyncStatus(): Promise<ExtensionState['syncStatus']> {
    const result = await chrome.storage.sync.get('syncStatus');
    return result.syncStatus || 'synced';
  },

  async setLastSyncTime(time: number): Promise<void> {
    await chrome.storage.sync.set({ lastSyncTime: time });
  },

  async getLastSyncTime(): Promise<number> {
    const result = await chrome.storage.sync.get('lastSyncTime');
    return result.lastSyncTime || 0;
  },

  // Local storage (device-specific)
  async getAuthToken(): Promise<AuthToken | null> {
    const result = await chrome.storage.local.get('authToken');
    return result.authToken || null;
  },

  async setAuthToken(token: AuthToken | null): Promise<void> {
    if (token) {
      await chrome.storage.local.set({ authToken: token });
    } else {
      await chrome.storage.local.remove('authToken');
    }
  },

  async getSyncQueue(): Promise<SyncQueueItem[]> {
    const result = await chrome.storage.local.get('syncQueue');
    return result.syncQueue || [];
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
    const result = await chrome.storage.local.get('isOnline');
    return result.isOnline !== false; // default to online
  },

  async setOnlineStatus(isOnline: boolean): Promise<void> {
    await chrome.storage.local.set({ isOnline });
  },
};
