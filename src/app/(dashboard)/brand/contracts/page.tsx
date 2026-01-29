import { ContractsList } from '@/components/shared/contracts-list';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function BrandContractsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: contracts } = await supabase
    .from('contracts')
    .select('*, campaign:campaigns!contracts_campaign_id_fkey(title), creator:profiles!contracts_creator_id_fkey(full_name)')
    .eq('brand_id', user.id)
    .order('created_at', { ascending: false });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Contratos</h1>
        <p className="text-muted-foreground">Contratos de cesión de derechos de contenido</p>
      </div>
      <ContractsList contracts={contracts || []} role="brand" />
    </div>
  );
}
