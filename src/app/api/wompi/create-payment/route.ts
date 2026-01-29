import { createClient } from '@/lib/supabase/server';
import { createEscrowTransaction } from '@/lib/wompi/escrow';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { campaignId } = await request.json();
  if (!campaignId) return NextResponse.json({ error: 'Campaign ID required' }, { status: 400 });

  const { data: campaign } = await supabase
    .from('campaigns')
    .select('*')
    .eq('id', campaignId)
    .eq('brand_id', user.id)
    .single();

  if (!campaign) return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });

  const totalAmount = campaign.budget_per_creator * campaign.max_creators;
  const platformFee = totalAmount * (campaign.platform_fee_percent / 100);
  const grossAmount = totalAmount + platformFee;

  try {
    // Create escrow record
    const escrow = await createEscrowTransaction({
      campaignId,
      brandId: user.id,
      grossAmount,
      platformFeePercent: campaign.platform_fee_percent,
    });

    // In production: create Wompi checkout widget or redirect
    // For MVP: return the escrow data with payment reference
    const appUrl = process.env.NEXT_PUBLIC_APP_URL!;
    const reference = `campaign-${campaignId}-${escrow.id}`;

    return NextResponse.json({
      escrowId: escrow.id,
      reference,
      amountInCents: Math.round(grossAmount * 100),
      currency: 'COP',
      publicKey: process.env.WOMPI_PUBLIC_KEY,
      redirectUrl: `${appUrl}/brand/campaigns/${campaignId}?payment=success`,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create payment' }, { status: 500 });
  }
}
