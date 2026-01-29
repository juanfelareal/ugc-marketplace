import { ContractsList } from '@/components/shared/contracts-list';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function CreatorContractsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: contracts } = await supabase
    .from('contracts')
    .select('*, campaign:campaigns!contracts_campaign_id_fkey(title), brand:profiles!contracts_brand_id_fkey(full_name, company_name)')
    .eq('creator_id', user.id)
    .order('created_at', { ascending: false });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Contratos</h1>
        <p className="text-muted-foreground">Tus contratos de cesión de derechos</p>
      </div>
      <ContractsList contracts={contracts || []} role="creator" />
    </div>
  );
}
