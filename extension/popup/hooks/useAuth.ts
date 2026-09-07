import { useEffect, useState } from 'react';
import {
  signInWithPassword,
  signUp,
  getSupabaseClient,
  signOut,
} from '../../lib/supabase';
import { storage } from '../../lib/storage';

export interface User {
  id: string;
  email: string;
}

export interface UseAuthResult {
  user: User | null;
  login: (
    email: string,
    password: string,
    isSignUp?: boolean
  ) => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

export function useAuth(): UseAuthResult {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function checkAuth() {
      try {
        const client = await getSupabaseClient();
        const { data: { user: sessionUser } } =
          await client.auth.getUser();

        if (sessionUser) {
          setUser({
            id: sessionUser.id,
            email: sessionUser.email || '',
          });
        }
      } catch (err) {
        const message =
          err instanceof Error ? err.message : String(err);
        console.error('Auth check failed:', message);
        setError(message);
      } finally {
        setIsLoading(false);
      }
    }

    checkAuth();
  }, []);

  async function login(
    email: string,
    password: string,
    isSignUp = false
  ): Promise<void> {
    try {
      setIsLoading(true);
      setError(null);

      const result = isSignUp
        ? await signUp(email, password)
        : await signInWithPassword(email, password);

      if (!result.user) {
        throw new Error(
          isSignUp ? 'Sign up failed' : 'Login failed'
        );
      }

      setUser({
        id: result.user.id,
        email: result.user.email || '',
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : String(err);
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }

  async function logout(): Promise<void> {
    try {
      setIsLoading(true);
      setError(null);
      await signOut();
      await storage.setAuthToken(null);
      setUser(null);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : String(err);
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }

  return {
    user,
    login,
    logout,
    isLoading,
    error,
  };
}
