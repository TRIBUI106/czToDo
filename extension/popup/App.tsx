import React, { useEffect, useState } from 'react';
import { useAuth } from './hooks/useAuth';
import { useTodos } from './hooks/useTodos';
import LoginForm from './components/LoginForm';
import TodoList from './components/TodoList';
import TodoForm from './components/TodoForm';
import SyncStatus from './components/SyncStatus';
import FilterBar from './components/FilterBar';

type FilterStatus = 'active' | 'completed' | 'archived' | 'all';

export default function App() {
  const { user, login, logout, isLoading: authLoading } = useAuth();
  const { todos, addTodo, updateTodo, deleteTodo, syncStatus } =
    useTodos();
  const [filter, setFilter] = useState<FilterStatus>('active');

  if (authLoading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <p>Loading...</p>
      </div>
    );
  }

  if (!user) {
    return <LoginForm onLogin={login} />;
  }

  const filteredTodos = todos.filter(todo => {
    if (filter === 'all') return true;
    return todo.status === filter;
  });

  return (
    <div className="popup-container">
      <header className="popup-header">
        <h1>czToDo</h1>
        <SyncStatus status={syncStatus} />
        <button
          onClick={logout}
          style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            padding: '4px 8px',
            fontSize: '12px',
            cursor: 'pointer',
          }}
        >
          Logout
        </button>
      </header>

      <main className="popup-main">
        <TodoForm onAdd={addTodo} />
        <FilterBar
          currentFilter={filter}
          onFilterChange={setFilter}
        />
        <TodoList
          todos={filteredTodos}
          onUpdate={updateTodo}
          onDelete={deleteTodo}
        />
      </main>
    </div>
  );
}
