import React from 'react';
import { Todo } from '../../lib/types';

interface TodoListProps {
  todos: Todo[];
  onUpdate: (id: string, updates: Partial<Todo>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export default function TodoList({
  todos,
  onUpdate,
  onDelete,
}: TodoListProps) {
  if (todos.length === 0) {
    return (
      <div
        style={{
          padding: '20px',
          textAlign: 'center',
          color: 'var(--color-text-light)',
        }}
      >
        No todos yet
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {todos.map(todo => (
        <div
          key={todo.id}
          style={{
            padding: '12px',
            border: '1px solid var(--color-border)',
            borderRadius: '4px',
            display: 'flex',
            gap: '8px',
            alignItems: 'flex-start',
          }}
        >
          <input
            type="checkbox"
            checked={todo.status === 'completed'}
            onChange={e =>
              onUpdate(todo.id, {
                status: e.target.checked ? 'completed' : 'active',
              })
            }
            style={{ marginTop: '2px', cursor: 'pointer' }}
          />

          <div style={{ flex: 1 }}>
            <div
              style={{
                textDecoration:
                  todo.status === 'completed'
                    ? 'line-through'
                    : 'none',
                fontWeight: 500,
              }}
            >
              {todo.title}
            </div>

            {todo.description && (
              <div
                style={{
                  fontSize: '12px',
                  color: 'var(--color-text-light)',
                  marginTop: '4px',
                }}
              >
                {todo.description}
              </div>
            )}

            {todo.due_date && (
              <div
                style={{
                  fontSize: '12px',
                  color: 'var(--color-text-light)',
                  marginTop: '4px',
                }}
              >
                Due: {new Date(todo.due_date).toLocaleDateString()}
              </div>
            )}

            {todo.priority && (
              <div
                style={{
                  fontSize: '11px',
                  display: 'inline-block',
                  padding: '2px 6px',
                  backgroundColor:
                    todo.priority === 'high'
                      ? 'var(--color-error)'
                      : todo.priority === 'medium'
                        ? 'var(--color-primary)'
                        : 'var(--color-success)',
                  color: 'white',
                  borderRadius: '2px',
                  marginTop: '4px',
                  textTransform: 'capitalize',
                }}
              >
                {todo.priority}
              </div>
            )}
          </div>

          <button
            onClick={() => onDelete(todo.id)}
            style={{
              padding: '4px 8px',
              fontSize: '12px',
              backgroundColor: 'transparent',
              color: 'var(--color-error)',
              border: '1px solid var(--color-error)',
              borderRadius: '2px',
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            Delete
          </button>
        </div>
      ))}
    </div>
  );
}
