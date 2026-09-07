import React, { useState } from 'react';

interface TodoFormProps {
  onAdd: (
    title: string,
    description?: string,
    dueDate?: string
  ) => Promise<void>;
}

export default function TodoForm({ onAdd }: TodoFormProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;

    setError('');
    setIsLoading(true);

    try {
      await onAdd(title, description, dueDate);
      setTitle('');
      setDescription('');
      setDueDate('');
    } catch (err) {
      const message =
        err instanceof Error ? err.message : String(err);
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        padding: '12px',
        borderBottom: '1px solid var(--color-border)',
        marginBottom: '12px',
      }}
    >
      {error && (
        <div
          style={{
            padding: '8px',
            backgroundColor: 'var(--color-error)',
            color: 'white',
            borderRadius: '4px',
            fontSize: '12px',
            marginBottom: '8px',
          }}
        >
          {error}
        </div>
      )}

      <input
        type="text"
        placeholder="Add a new todo..."
        value={title}
        onChange={e => setTitle(e.target.value)}
        disabled={isLoading}
        style={{
          width: '100%',
          marginBottom: '8px',
        }}
      />

      <textarea
        placeholder="Description (optional)"
        value={description}
        onChange={e => setDescription(e.target.value)}
        disabled={isLoading}
        style={{
          width: '100%',
          marginBottom: '8px',
          minHeight: '40px',
          resize: 'none',
        }}
      />

      <input
        type="date"
        value={dueDate}
        onChange={e => setDueDate(e.target.value)}
        disabled={isLoading}
        style={{
          width: '100%',
          marginBottom: '8px',
        }}
      />

      <button
        type="submit"
        disabled={isLoading || !title.trim()}
        style={{
          width: '100%',
          padding: '8px',
          backgroundColor:
            isLoading || !title.trim()
              ? 'var(--color-text-light)'
              : 'var(--color-success)',
          color: 'white',
          border: 'none',
          cursor:
            isLoading || !title.trim()
              ? 'not-allowed'
              : 'pointer',
          borderRadius: '4px',
        }}
      >
        {isLoading ? 'Adding...' : 'Add Todo'}
      </button>
    </form>
  );
}
