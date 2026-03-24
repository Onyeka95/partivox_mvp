// lib/supabase-client.ts
import { createClient } from "@supabase/supabase-js";
import { useAuth } from "@clerk/nextjs";
import { useMemo } from "react";

export function useSupabase() {
  const { getToken } = useAuth();

  return useMemo(() => {
    return createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
        global: {
          fetch: async (url: RequestInfo | URL, options: RequestInit = {}) => {
            try {
              const token = await getToken();

              if (token) {
                // Proper way to handle headers
                const headers = new Headers(options.headers || {});
                headers.set("Authorization", `Bearer ${token}`);

                options.headers = headers;
              }
            } catch (e) {
              console.warn("Failed to get Clerk token for Supabase request", e);
            }

            return fetch(url, options);
          },
        },
      }
    );
  }, [getToken]);
}