import { createClient } from '@supabase/supabase-js';
import { useUser } from '@clerk/nextjs'; // We'll use this in components

// Basic client (for cases where we don't have session yet)
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Function to create a client with Clerk token (recommended)
export const createSupabaseClientWithClerk = (clerkToken?: string) => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: {
          Authorization: clerkToken ? `Bearer ${clerkToken}` : '',
        },
      },
    }
  );
};