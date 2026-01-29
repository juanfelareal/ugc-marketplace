import { getShopifyAuthUrl } from '@/lib/shopify/client';
import { createClient } from '@/lib/supabase/server';
import { randomUUID } from 'crypto';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { shop } = await request.json();
  if (!shop) return NextResponse.json({ error: 'Shop domain required' }, { status: 400 });

  // Normalize shop domain
  const shopDomain = shop.includes('.myshopify.com') ? shop : `${shop}.myshopify.com`;

  const state = randomUUID();
  // In production, store state in a session/cookie for CSRF validation
  const authUrl = getShopifyAuthUrl(shopDomain, state);

  return NextResponse.json({ url: authUrl, state });
}
