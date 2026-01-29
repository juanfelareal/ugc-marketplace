import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, onboarding_completed')
    .eq('id', user.id)
    .single();

  if (!profile) redirect('/login');

  if (!profile.onboarding_completed) {
    redirect(profile.role === 'brand' ? '/onboarding/brand' : '/onboarding/creator');
  }

  redirect(profile.role === 'creator' ? '/creator/campaigns' : '/brand/campaigns');
}
