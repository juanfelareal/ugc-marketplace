import { addCredits } from '@/lib/ai/credits';
import { createClient } from '@/lib/supabase/server';
import { CREDIT_PACKS } from '@/types/campaigns';
import { NextResponse } from 'next/server';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: balance } = await supabase
    .from('credit_balances')
    .select('*')
    .eq('user_id', user.id)
    .single();

  const { data: transactions } = await supabase
    .from('credit_transactions')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(20);

  return NextResponse.json({
    balance: balance?.balance ?? 0,
    total_purchased: balance?.total_purchased ?? 0,
    total_used: balance?.total_used ?? 0,
    transactions: transactions ?? [],
    packs: CREDIT_PACKS,
  });
}

// Direct credit addition (for testing/admin). In production, this goes through Wompi payment flow.
export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { packId } = await request.json();
  const pack = CREDIT_PACKS.find((p) => p.id === packId);
  if (!pack) return NextResponse.json({ error: 'Invalid pack' }, { status: 400 });

  // In production: create Wompi payment first, add credits on webhook confirmation
  // For MVP/testing: direct addition
  const result = await addCredits(
    user.id,
    pack.credits,
    'purchase',
    `Compra de ${pack.label}`,
    packId,
    'credit_purchase'
  );

  return NextResponse.json({
    new_balance: result.newBalance,
    credits_added: pack.credits,
  });
}
