'use server';

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { currentUser } from '@clerk/nextjs/server';

export async function syncUserProfile({
  id,
  email,
}: {
  id: string;
  email: string;
}) {
  if (!id || !email) {
    return { success: false, error: 'Missing user data' };
  }

  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => 
              cookieStore.set(name, value, options)
            );
          } catch {}
        },
      },
    }
  );

  try {
    const { error } = await supabase
      .from('users')
      .upsert({
        id,
        email: email.toLowerCase().trim(),
        // IMPORTANT: Do NOT set diamonds_balance here — only update other fields
        updated_at: new Date().toISOString(),
      }, { 
        onConflict: 'id' 
      });

    if (error) {
      console.error('Sync error:', error);
      return { success: false, error: error.message };
    }

    console.log('✅ User synced successfully:', email);
    return { success: true };
  } catch (err: any) {
    console.error('Sync exception:', err);
    return { success: false, error: err.message };
  }
}