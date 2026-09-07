// extension/lib/supabase.ts

import { createClient } from '@supabase/supabase-js';
import { AuthToken } from './types';
import { storage } from './storage';

const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY!;

export async function createSupabaseClient() {
  const token = await storage.getAuthToken();

  const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      persistSession: false, // Don't use browser session storage
    },
  });

  if (token) {
    // Set existing session
    await client.auth.setSession({
      access_token: token.access_token,
      refresh_token: token.refresh_token,
    });
  }

  // Listen for auth changes and store token
  const { data: { subscription } } = client.auth.onAuthStateChange(
    async (event, session) => {
      if (session?.user && session.access_token && session.refresh_token) {
        const newToken: AuthToken = {
          access_token: session.access_token,
          refresh_token: session.refresh_token,
          expires_at: session.expires_at || Date.now() + 3600000,
        };
        await storage.setAuthToken(newToken);
      } else if (event === 'SIGNED_OUT') {
        await storage.setAuthToken(null);
      }
    }
  );

  return { client, subscription };
}

export async function getSupabaseClient() {
  const { client } = await createSupabaseClient();
  return client;
}

export async function signOut() {
  const client = await getSupabaseClient();
  await client.auth.signOut();
  await storage.setAuthToken(null);
}

export async function signInWithPassword(email: string, password: string) {
  const client = await getSupabaseClient();
  const { data, error } = await client.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
  return data;
}

export async function signUp(email: string, password: string) {
  const client = await getSupabaseClient();
  const { data, error } = await client.auth.signUp({
    email,
    password,
  });
  if (error) throw error;
  return data;
}
