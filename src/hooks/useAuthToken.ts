import { useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

/**
 * Centralized hook for getting auth tokens
 * Reduces duplicate supabase.auth.getSession() calls across hooks
 */
export function useAuthToken() {
  const { session } = useAuth();

  const getToken = useCallback(async (): Promise<string | undefined> => {
    // First try to use cached session token
    if (session?.access_token) {
      return session.access_token;
    }
    
    // Fallback: refresh session if needed
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token;
  }, [session]);

  const getAuthHeaders = useCallback(async (): Promise<Record<string, string> | undefined> => {
    const token = await getToken();
    return token ? { Authorization: `Bearer ${token}` } : undefined;
  }, [getToken]);

  return { 
    token: session?.access_token, 
    getToken,
    getAuthHeaders,
  };
}
