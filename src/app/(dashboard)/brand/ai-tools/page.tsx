import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { AIToolsClient } from '@/components/brand/ai-tools-client';

export default async function AIToolsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: products } = await supabase
    .from('products')
    .select('id, title, image_urls, ai_category')
    .eq('brand_id', user.id)
    .order('title');

  const { data: creditBalance } = await supabase
    .from('credit_balances')
    .select('balance')
    .eq('user_id', user.id)
    .single();

  return (
    <AIToolsClient
      products={products || []}
      initialBalance={creditBalance?.balance ?? 0}
    />
  );
}
