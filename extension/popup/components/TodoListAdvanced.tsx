import React, { useState, useMemo } from 'react';
import type { Todo } from '../../lib/types';

interface TodoListAdvancedProps {
  todos: Todo[];
  onUpdate: (id: string, updates: Partial<Todo>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export default function TodoListAdvanced({
  todos,
  onUpdate,
  onDelete,
}: TodoListAdvancedProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  if (todos.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">📝</div>
        <div className="empty-state-text">
          No to-dos yet. Create one to get started!
        </div>
      </div>
    );
  }

  // Sort todos: active first, then by creation date
  const sortedTodos = useMemo(
    () =>
      [...todos].sort((a, b) => {
        if (a.status !== b.status) {
          return a.status === 'active' ? -1 : 1;
        }
        return (
          new Date(b.created_at).getTime() -
          new Date(a.created_at).getTime()
        );
      }),
    [todos]
  );

  async function handleToggle(todo: Todo) {
    try {
      setUpdatingId(todo.id);
      await onUpdate(todo.id, {
        status: todo.status === 'completed' ? 'active' : 'completed',
      });
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleDelete(id: string) {
    try {
      setDeletingId(id);
      await onDelete(id);
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="todo-list">
      {sortedTodos.map((todo, index) => (
        <div
          key={todo.id}
          className={`todo-item ${todo.status === 'completed' ? 'completed' : ''}`}
          style={{
            animation: `slideIn 0.3s ease-out ${index * 0.05}s both`,
          }}
        >
          <input
            type="checkbox"
            className="todo-checkbox"
            checked={todo.status === 'completed'}
            onChange={() => handleToggle(todo)}
            disabled={updatingId === todo.id}
          />
          <div className="todo-content">
            <div className="todo-title">{todo.title}</div>
            {todo.description && (
              <div className="todo-description">{todo.description}</div>
            )}
            {todo.source_url && (
              <a
                href={todo.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="todo-url"
                title={todo.source_url}
              >
                🔗 {new URL(todo.source_url).hostname}
              </a>
            )}
            {todo.source_type && (
              <div style={{ fontSize: '11px', marginTop: '4px' }}>
                <span
                  style={{
                    display: 'inline-block',
                    padding: '2px 6px',
                    borderRadius: '3px',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    color: 'var(--color-primary)',
                  }}
                >
                  {todo.source_type === 'context_menu'
                    ? '📋'
                    : todo.source_type === 'github'
                    ? '🐙'
                    : todo.source_type === 'email'
                    ? '📧'
                    : todo.source_type === 'slack'
                    ? '💬'
                    : '📌'}{' '}
                  {todo.source_type}
                </span>
              </div>
            )}
          </div>
          <button
            onClick={() => handleDelete(todo.id)}
            disabled={deletingId === todo.id}
            style={{
              padding: '4px 8px',
              fontSize: '12px',
              background: 'transparent',
              color: 'var(--color-text-lighter)',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              transition: 'var(--transition)',
            }}
            onMouseEnter={(e) => {
              (e.target as HTMLButtonElement).style.color = 'var(--color-error)';
            }}
            onMouseLeave={(e) => {
              (e.target as HTMLButtonElement).style.color = 'var(--color-text-lighter)';
            }}
            title="Delete"
          >
            {deletingId === todo.id ? '...' : '✕'}
          </button>
        </div>
      ))}
    </div>
  );
}
