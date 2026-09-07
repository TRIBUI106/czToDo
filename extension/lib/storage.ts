// extension/lib/storage.ts

import { AuthToken, ExtensionState, SyncQueueItem, Todo } from './types';

// Chrome storage helpers
export const storage = {
  // Supabase is the cross-device source of truth; its cache stays device-local.
  async getTodos(): Promise<Todo[]> {
    const result = await chrome.storage.local.get('todos') as {
      todos?: Todo[];
    };
    return result.todos || [];
  },

  async setTodos(todos: Todo[]): Promise<void> {
    await chrome.storage.local.set({ todos });
  },

  async setSyncStatus(status: ExtensionState['syncStatus']): Promise<void> {
    await chrome.storage.local.set({ syncStatus: status });
  },

  async getSyncStatus(): Promise<ExtensionState['syncStatus']> {
    const result = await chrome.storage.local.get('syncStatus') as {
      syncStatus?: ExtensionState['syncStatus'];
    };
    return result.syncStatus || 'synced';
  },

  async setLastSyncTime(time: number): Promise<void> {
    await chrome.storage.local.set({ lastSyncTime: time });
  },

  async getLastSyncTime(): Promise<number> {
    const result = await chrome.storage.local.get('lastSyncTime') as {
      lastSyncTime?: number;
    };
    return result.lastSyncTime || 0;
  },

  // Local storage (device-specific)
  async getAuthToken(): Promise<AuthToken | null> {
    const result = await chrome.storage.local.get('authToken') as {
      authToken?: AuthToken;
    };
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
    const result = await chrome.storage.local.get('syncQueue') as {
      syncQueue?: SyncQueueItem[];
    };
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

  async updateSyncQueueItem(
    id: string,
    updates: Partial<SyncQueueItem>
  ): Promise<void> {
    const queue = await this.getSyncQueue();
    const index = queue.findIndex(item => item.id === id);
    if (index !== -1) {
      queue[index] = { ...queue[index], ...updates };
      await chrome.storage.local.set({
        syncQueue: queue,
      });
    }
  },

  async getOnlineStatus(): Promise<boolean> {
    const result = await chrome.storage.local.get('isOnline');
    return result.isOnline !== false; // default to online
  },

  async setOnlineStatus(isOnline: boolean): Promise<void> {
    await chrome.storage.local.set({ isOnline });
  },

  async getGitHubToken(): Promise<string | null> {
    const result = await chrome.storage.local.get('githubToken') as {
      githubToken?: string;
    };
    return result.githubToken || null;
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
    const result = await chrome.storage.local.get(
      'githubSyncStatus'
    ) as {
      githubSyncStatus?: {
        lastSyncAt?: number;
        processedIssueIds?: string[];
      };
    };
    return result.githubSyncStatus || {};
  },

  async setGitHubSyncStatus(status: {
    lastSyncAt?: number;
    processedIssueIds?: string[];
  }): Promise<void> {
    await chrome.storage.local.set({ githubSyncStatus: status });
  },
};
