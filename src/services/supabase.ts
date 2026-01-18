import { createClient } from '@supabase/supabase-js';

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

export async function getUserFromToken(token: string) {
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) {
    throw new Error('Invalid authentication token');
  }
  return user;
}

export async function ensureUserExists(authUserId: string, email: string) {
  const { data: existingUser } = await supabase
    .from('users')
    .select('*')
    .eq('id', authUserId)
    .single();

  if (!existingUser) {
    const { data: newUser, error } = await supabase
      .from('users')
      .insert({
        id: authUserId,
        email: email,
        plan_tier: 'free',
        storage_quota_gb: 25,
      })
      .select()
      .single();

    if (error) throw error;
    return newUser;
  }

  return existingUser;
}