import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { CampaignForm } from '@/components/brand/campaign-form';

export default async function NewCampaignPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: products } = await supabase
    .from('products')
    .select('id, title, image_urls, price_min, price_max, ai_category, ai_target_audience, ai_key_benefits')
    .eq('brand_id', user.id)
    .eq('status', 'active')
    .order('title');

  const { data: creditBalance } = await supabase
    .from('credit_balances')
    .select('balance')
    .eq('user_id', user.id)
    .single();

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Nueva campaña</h1>
        <p className="text-muted-foreground">Crea una campaña de contenido UGC paso a paso</p>
      </div>
      <CampaignForm
        products={products || []}
        creditBalance={creditBalance?.balance ?? 0}
      />
    </div>
  );
}
