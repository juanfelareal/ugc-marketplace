import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { CreatorCampaignsList } from '@/components/creator/campaigns-list';

export default async function CreatorCampaignsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Get published campaigns
  const { data: campaigns } = await supabase
    .from('campaigns')
    .select('*, brand:profiles!campaigns_brand_id_fkey(id, full_name, company_name, avatar_url)')
    .in('status', ['published', 'in_progress'])
    .order('published_at', { ascending: false });

  // Get creator's applications
  const { data: applications } = await supabase
    .from('campaign_applications')
    .select('campaign_id, status')
    .eq('creator_id', user.id);

  const appliedCampaigns = new Map(
    (applications || []).map((a) => [a.campaign_id, a.status])
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Campañas disponibles</h1>
        <p className="text-muted-foreground">Descubre campañas de marcas y aplica para crear contenido</p>
      </div>
      <CreatorCampaignsList
        campaigns={campaigns || []}
        appliedCampaigns={Object.fromEntries(appliedCampaigns)}
      />
    </div>
  );
}
