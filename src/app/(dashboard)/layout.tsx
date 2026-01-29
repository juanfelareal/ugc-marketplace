import { DashboardLayout } from '@/components/shared/dashboard-layout';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function DashboardRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!profile) redirect('/login');
  if (!profile.onboarding_completed) {
    redirect(profile.role === 'brand' ? '/onboarding/brand' : '/onboarding/creator');
  }

  return <DashboardLayout profile={profile}>{children}</DashboardLayout>;
}
