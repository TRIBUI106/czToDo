/**
 * Chrome extension background service worker.
 * Manifest V3 compatible: no window globals, uses chrome.alarms for scheduling.
 * Manages Supabase sync, message routing, and context menu registration.
 */

import { getSupabaseClient, signOut } from '../lib/supabase';
import { storage } from '../lib/storage';
import type {
  Message,
  MessageResponse,
} from '../lib/messages';
import type {
  Todo,
  SyncQueueItem,
} from '../lib/types';

/**
 * Service worker initialization and event listeners.
 * Idempotent: safe to call multiple times after worker restart.
 */

let supabaseClient: Awaited<
  ReturnType<typeof getSupabaseClient>
> | null = null;

/**
 * Initialize Supabase and Realtime subscription once per worker lifetime.
 */
async function initializeSupabase() {
  if (supabaseClient) {
    return;
  }

  try {
    const client = await getSupabaseClient();
    supabaseClient = client;

    // Subscribe to todo changes in Realtime
    client
      .channel('public:todos')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'todos',
        },
        payload => {
          handleRealtimeChange(payload);
        }
      )
      .subscribe();
  } catch (err) {
    console.error('Failed to initialize Supabase:', err);
  }
}

/**
 * Handle incoming Realtime change events and refresh cache.
 */
async function handleRealtimeChange(payload: any) {
  try {
    const todos = await storage.getTodos();
    const updated = [...todos];

    if (payload.eventType === 'INSERT') {
      const newTodo = payload.new as Todo;
      if (!updated.find(t => t.id === newTodo.id)) {
        updated.push(newTodo);
      }
    } else if (payload.eventType === 'UPDATE') {
      const updated_todo = payload.new as Todo;
      const index = updated.findIndex(t => t.id === updated_todo.id);
      if (index !== -1) {
        updated[index] = updated_todo;
      }
    } else if (payload.eventType === 'DELETE') {
      const deleted_id = payload.old.id;
      const index = updated.findIndex(t => t.id === deleted_id);
      if (index !== -1) {
        updated.splice(index, 1);
      }
    }

    await storage.setTodos(updated);
  } catch (err) {
    console.error('Error handling Realtime change:', err);
  }
}

/**
 * Process sync queue: retry failed writes with exponential backoff.
 */
async function processSyncQueue() {
  try {
    if (!supabaseClient) {
      await initializeSupabase();
    }

    const queue = await storage.getSyncQueue();
    const now = Date.now();

    for (const item of queue) {
      const nextAttempt = (item.next_attempt_at || 0) * 1000;
      if (nextAttempt > now) {
        continue;
      }

      try {
        await processQueueItem(item);
        // Remove from queue on success
        await storage.removeSyncQueueItem(item.id);
      } catch (err) {
        // Update retry count and schedule next attempt
        const maxRetries = 5;
        const retries = (item.retries || 0) + 1;

        if (retries >= maxRetries) {
          console.error(
            `Max retries reached for queue item ${item.id}:`,
            err
          );
          await storage.removeSyncQueueItem(item.id);
        } else {
          // Exponential backoff: 2^retries seconds
          const backoffSeconds = Math.pow(2, retries);
          const nextAttemptTime = now + backoffSeconds * 1000;

          await storage.updateSyncQueueItem(item.id, {
            retries,
            next_attempt_at: nextAttemptTime / 1000,
          });
        }
      }
    }
  } catch (err) {
    console.error('Error processing sync queue:', err);
  }
}

/**
 * Process individual queue item based on action.
 */
async function processQueueItem(item: SyncQueueItem) {
  if (!supabaseClient) {
    throw new Error('Supabase not initialized');
  }

  const { action, table, data, id: todo_id } = item;

  if (table !== 'todos') {
    throw new Error(`Unknown table: ${table}`);
  }

  if (action === 'insert') {
    const { error } = await supabaseClient
      .from('todos')
      .insert([data]);
    if (error) throw error;
  } else if (action === 'update') {
    const { error } = await supabaseClient
      .from('todos')
      .update(data)
      .eq('id', todo_id);
    if (error) throw error;
  } else if (action === 'delete') {
    const { error } = await supabaseClient
      .from('todos')
      .delete()
      .eq('id', todo_id);
    if (error) throw error;
  }
}

/**
 * Register Chrome alarm for periodic sync.
 */
function setupAlarms() {
  chrome.alarms.create('sync_queue', {
    periodInMinutes: 1,
  });
}

/**
 * Message handler for popup/content script communication.
 */
chrome.runtime.onMessage.addListener(
  (
    message: Message,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response: MessageResponse) => void
  ) => {
    handleMessage(message)
      .then(data => {
        sendResponse({
          success: true,
          data,
        });
      })
      .catch(error => {
        sendResponse({
          success: false,
          error:
            error instanceof Error
              ? error.message
              : String(error),
        });
      });

    // Keep channel open for async response
    return true;
  }
);

/**
 * Process incoming messages from popup/content scripts.
 */
async function handleMessage(message: Message): Promise<any> {
  if (!supabaseClient) {
    await initializeSupabase();
  }

  switch (message.type) {
    case 'ADD_TODO': {
      const { title, description, dueDate } = message.payload;
      if (!supabaseClient) throw new Error('Not initialized');

      const { data: { user } } = await supabaseClient.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const newTodo: Partial<Todo> = {
        title,
        description,
        due_date: dueDate,
        status: 'active',
        priority: 'medium',
        source_type: 'popup',
      };

      const { data, error } = await supabaseClient
        .from('todos')
        .insert([newTodo])
        .select()
        .single();

      if (error) throw error;
      return data;
    }

    case 'UPDATE_TODO': {
      const { id, updates } = message.payload;
      if (!supabaseClient) throw new Error('Not initialized');

      const { error } = await supabaseClient
        .from('todos')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      return { success: true };
    }

    case 'DELETE_TODO': {
      const { id } = message.payload;
      if (!supabaseClient) throw new Error('Not initialized');

      const { error } = await supabaseClient
        .from('todos')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { success: true };
    }

    case 'GET_TODOS': {
      return await storage.getTodos();
    }

    case 'SYNC_STATUS': {
      return {
        status: await storage.getSyncStatus(),
        lastSync: await storage.getLastSyncTime(),
      };
    }

    case 'LOGOUT': {
      await signOut();
      await storage.setAuthToken(null);
      return { success: true };
    }

    case 'CAPTURE_TEXT': {
      const { text, url, title, description, domain } =
        message.payload;

      if (!supabaseClient) throw new Error('Not initialized');
      const { data: { user } } = await supabaseClient.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const newTodo: Partial<Todo> = {
        title: text.substring(0, 200) || title || 'Captured text',
        description: text.length > 200 ? text : undefined,
        source_url: url,
        source_type: 'context_menu',
        status: 'active',
        priority: 'medium',
      };

      const { data, error } = await supabaseClient
        .from('todos')
        .insert([newTodo])
        .select()
        .single();

      if (error) throw error;
      return data;
    }

    case 'ADD_GITHUB': {
      const { title, description, url, github_issue_id, type } =
        message.payload;

      if (!supabaseClient) throw new Error('Not initialized');
      const { data: { user } } = await supabaseClient.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const newTodo: Partial<Todo> = {
        title: title.substring(0, 200),
        description,
        source_url: url,
        source_type: 'github',
        github_issue_id,
        status: 'active',
        priority: 'high',
      };

      const { data, error } = await supabaseClient
        .from('todos')
        .insert([newTodo])
        .select()
        .single();

      if (error) throw error;
      return data;
    }

    default:
      throw new Error(`Unknown message type: ${message.type}`);
  }
}

/**
 * Alarm handler for periodic sync.
 */
chrome.alarms.onAlarm.addListener(alarm => {
  if (alarm.name === 'sync_queue') {
    processSyncQueue().catch(err =>
      console.error('Sync queue processing failed:', err)
    );
  }
});

/**
 * Register context menu items once.
 * Idempotent: safely called multiple times.
 */
function registerContextMenus() {
  // Clear existing menus
  chrome.contextMenus.removeAll(() => {
    // Add "Add to czToDo" for text selection
    chrome.contextMenus.create({
      id: 'add-selected-text',
      title: 'Add selected text to czToDo',
      contexts: ['selection'],
    });

    // Add "Add to czToDo" for links
    chrome.contextMenus.create({
      id: 'add-link',
      title: 'Add link to czToDo',
      contexts: ['link'],
    });

    // Add "Add to czToDo" for page
    chrome.contextMenus.create({
      id: 'add-page',
      title: 'Add this page to czToDo',
      contexts: ['page'],
    });
  });
}

/**
 * Handle context menu clicks.
 */
chrome.contextMenus.onClicked.addListener(
  async (info: chrome.contextMenus.OnClickData) => {
    try {
      if (!supabaseClient) {
        await initializeSupabase();
      }

      const { data: { user } } = await supabaseClient!.auth.getUser();
      if (!user) {
        console.warn('User not authenticated for context menu action');
        return;
      }

      let title = '';
      let sourceUrl = '';
      let sourceType: 'context_menu' | 'popup' | 'github' | 'email' =
        'context_menu';

      if (info.menuItemId === 'add-selected-text') {
        title = info.selectionText || '';
        sourceUrl = info.pageUrl || '';
      } else if (info.menuItemId === 'add-link') {
        title = info.linkUrl || '';
        sourceUrl = info.linkUrl || '';
      } else if (info.menuItemId === 'add-page') {
        title = 'Page';
        sourceUrl = info.pageUrl || '';
      }

      if (!title.trim()) {
        console.warn('No title for context menu action');
        return;
      }

      const newTodo: Partial<Todo> = {
        title: title.substring(0, 500),
        source_url: sourceUrl,
        source_type: sourceType,
        status: 'active',
        priority: 'medium',
      };

      const { error } = await supabaseClient!
        .from('todos')
        .insert([newTodo]);

      if (error) {
        console.error('Failed to add todo from context menu:', error);
      }
    } catch (err) {
      console.error('Context menu handler error:', err);
    }
  }
);

/**
 * Initialize on service worker startup.
 */
initializeSupabase()
  .then(() => {
    setupAlarms();
    registerContextMenus();
  })
  .catch(err => console.error('Initialization failed:', err));
