// extension/lib/types.ts

export interface Todo {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  status: 'active' | 'completed' | 'archived';
  priority?: 'low' | 'medium' | 'high';
  source_url?: string;
  source_type?: 'popup' | 'context_menu' | 'github' | 'email';
  github_issue_id?: string;
  created_at: string;
  updated_at: string;
  due_date?: string;
  tags?: string[];
}

export interface AuthToken {
  access_token: string;
  refresh_token: string;
  expires_at: number;
}

export interface SyncQueueItem {
  id: string;
  action: 'insert' | 'update' | 'delete';
  table: 'todos';
  data: Partial<Todo>;
  timestamp: number;
  retries: number;
}

export interface ExtensionState {
  todos: Todo[];
  auth: AuthToken | null;
  syncStatus: 'synced' | 'syncing' | 'offline' | 'error';
  lastSyncTime: number;
  isOnline: boolean;
}
