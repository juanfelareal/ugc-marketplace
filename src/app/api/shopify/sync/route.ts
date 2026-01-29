import { syncProducts } from '@/lib/shopify/sync';
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: store } = await supabase
    .from('stores')
    .select('*')
    .eq('brand_id', user.id)
    .single();

  if (!store) {
    return NextResponse.json({ error: 'No store connected' }, { status: 404 });
  }

  try {
    const result = await syncProducts(
      store.id,
      user.id,
      store.shop_domain,
      store.shopify_access_token_encrypted
    );
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: 'Sync failed' }, { status: 500 });
  }
}
