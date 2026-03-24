'use server';

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { currentUser } from '@clerk/nextjs/server';

export async function syncUserProfile() {
  const clerkUser = await currentUser();

  if (!clerkUser) {
    return { error: 'Not authenticated' };
  }

  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Ignore error in Server Component - safe if middleware refreshes sessions
          }
        },
      },
    }
  );

  const userData = {
    id: clerkUser.id,
    email: clerkUser.emailAddresses[0]?.emailAddress || null,
  };

  const { error } = await supabase
    .from('users')
    .upsert(userData, { onConflict: 'id' });

  if (error) {
    console.error('Server sync failed:', error);
    return { error: error.message };
  }

  console.log('Server sync success');
  return { success: true };
}