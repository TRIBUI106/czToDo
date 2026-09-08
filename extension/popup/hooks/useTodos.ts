import { useEffect, useState } from 'react';
import { getSupabaseClient } from '../../lib/supabase';
import { storage } from '../../lib/storage';
import { Todo } from '../../lib/types';

export interface UseTodosResult {
  todos: Todo[];
  addTodo: (
    title: string,
    description?: string,
    dueDate?: string
  ) => Promise<void>;
  updateTodo: (id: string, updates: Partial<Todo>) => Promise<void>;
  deleteTodo: (id: string) => Promise<void>;
  syncStatus: string;
}

export function useTodos(): UseTodosResult {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [syncStatus, setSyncStatus] = useState<string>('synced');

  useEffect(() => {
    async function loadTodos() {
      try {
        setSyncStatus('syncing');
        const cached = await storage.getTodos();
        setTodos(cached);

        const client = await getSupabaseClient();
        const { data: { user } } = await client.auth.getUser();

        if (!user) {
          setSyncStatus('offline');
          return;
        }

        const { data, error } = await client
          .from('todos')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;

        const fetchedTodos = (data || []) as Todo[];
        setTodos(fetchedTodos);
        await storage.setTodos(fetchedTodos);
        setSyncStatus('synced');
      } catch (err) {
        const message =
          err instanceof Error ? err.message : String(err);
        console.error('Load todos failed:', message);
        setSyncStatus('error');
      }
    }

    loadTodos();
  }, []);

  async function addTodo(
    title: string,
    description?: string,
    dueDate?: string
  ): Promise<void> {
    try {
      setSyncStatus('syncing');
      const client = await getSupabaseClient();
      const { data: { user } } = await client.auth.getUser();

      if (!user) {
        throw new Error('Not authenticated');
      }

      const newTodo: Partial<Todo> = {
        title,
        description,
        due_date: dueDate,
        status: 'active',
        priority: 'medium',
        source_type: 'popup',
      };

      const { data, error } = await client
        .from('todos')
        .insert([newTodo])
        .select()
        .single();

      if (error) throw error;

      const todo = data as Todo;
      const updated = [todo, ...todos];
      setTodos(updated);
      await storage.setTodos(updated);
      setSyncStatus('synced');
    } catch (err) {
      const message =
        err instanceof Error ? err.message : String(err);
      console.error('Add todo failed:', message);
      setSyncStatus('error');
      throw err;
    }
  }

  async function updateTodo(
    id: string,
    updates: Partial<Todo>
  ): Promise<void> {
    try {
      setSyncStatus('syncing');
      const client = await getSupabaseClient();

      const { error } = await client
        .from('todos')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      const updated = todos.map(todo =>
        todo.id === id ? { ...todo, ...updates } : todo
      );
      setTodos(updated);
      await storage.setTodos(updated);
      setSyncStatus('synced');
    } catch (err) {
      const message =
        err instanceof Error ? err.message : String(err);
      console.error('Update todo failed:', message);
      setSyncStatus('error');
      throw err;
    }
  }

  async function deleteTodo(id: string): Promise<void> {
    try {
      setSyncStatus('syncing');
      const client = await getSupabaseClient();

      const { error } = await client
        .from('todos')
        .delete()
        .eq('id', id);

      if (error) throw error;

      const updated = todos.filter(todo => todo.id !== id);
      setTodos(updated);
      await storage.setTodos(updated);
      setSyncStatus('synced');
    } catch (err) {
      const message =
        err instanceof Error ? err.message : String(err);
      console.error('Delete todo failed:', message);
      setSyncStatus('error');
      throw err;
    }
  }

  return {
    todos,
    addTodo,
    updateTodo,
    deleteTodo,
    syncStatus,
  };
}
