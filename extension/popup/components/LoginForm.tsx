import React, { useState } from 'react';

interface LoginFormProps {
  onLogin: (
    email: string,
    password: string,
    isSignUp?: boolean
  ) => Promise<void>;
}

export default function LoginForm({ onLogin }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await onLogin(email, password, isSignUp);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : String(err);
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div
      style={{
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
      }}
    >
      <h2 style={{ marginTop: 0 }}>
        {isSignUp ? 'Create Account' : 'Login'}
      </h2>

      {error && (
        <div
          style={{
            padding: '8px 12px',
            backgroundColor: 'var(--color-error)',
            color: 'white',
            borderRadius: '4px',
            fontSize: '13px',
          }}
        >
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '12px' }}>
          <label
            htmlFor="email"
            style={{ display: 'block', marginBottom: '4px' }}
          >
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            disabled={isLoading}
            style={{ width: '100%' }}
          />
        </div>

        <div style={{ marginBottom: '12px' }}>
          <label
            htmlFor="password"
            style={{ display: 'block', marginBottom: '4px' }}
          >
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            disabled={isLoading}
            style={{ width: '100%' }}
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          style={{
            width: '100%',
            padding: '10px',
            backgroundColor: isLoading
              ? 'var(--color-text-light)'
              : 'var(--color-primary)',
            color: 'white',
            border: 'none',
            cursor: isLoading ? 'not-allowed' : 'pointer',
          }}
        >
          {isLoading ? 'Processing...' : isSignUp ? 'Sign Up' : 'Login'}
        </button>
      </form>

      <button
        onClick={() => setIsSignUp(!isSignUp)}
        disabled={isLoading}
        style={{
          width: '100%',
          backgroundColor: 'transparent',
          color: 'var(--color-primary)',
          border: '1px solid var(--color-primary)',
        }}
      >
        {isSignUp
          ? 'Already have an account? Login'
          : 'Create new account'}
      </button>
    </div>
  );
}
