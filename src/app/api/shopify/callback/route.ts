import { exchangeShopifyToken } from '@/lib/shopify/client';
import { syncProducts } from '@/lib/shopify/sync';
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const shop = searchParams.get('shop');
  const code = searchParams.get('code');
  const appUrl = process.env.NEXT_PUBLIC_APP_URL!;

  if (!shop || !code) {
    return NextResponse.redirect(`${appUrl}/brand/settings?error=missing_params`);
  }

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.redirect(`${appUrl}/login`);
    }

    const accessToken = await exchangeShopifyToken(shop, code);

    // Store the connection (token should be encrypted in production via Vault)
    const { data: store, error: storeError } = await supabase
      .from('stores')
      .upsert(
        {
          brand_id: user.id,
          shop_domain: shop,
          shopify_access_token_encrypted: accessToken, // Encrypt via Vault in production
          sync_status: 'pending',
        },
        { onConflict: 'shop_domain' }
      )
      .select()
      .single();

    if (storeError || !store) {
      return NextResponse.redirect(`${appUrl}/brand/settings?error=store_save_failed`);
    }

    // Trigger initial product sync
    await syncProducts(store.id, user.id, shop, accessToken);

    return NextResponse.redirect(`${appUrl}/brand/products?synced=true`);
  } catch {
    return NextResponse.redirect(`${appUrl}/brand/settings?error=shopify_auth_failed`);
  }
}
