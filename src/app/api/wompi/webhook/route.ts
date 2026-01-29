import { createAdminClient } from '@/lib/supabase/admin';
import { fundEscrow } from '@/lib/wompi/escrow';
import { createHmac } from 'crypto';
import { NextResponse } from 'next/server';

function verifySignature(body: string, signature: string): boolean {
  const secret = process.env.WOMPI_EVENTS_SECRET!;
  const hash = createHmac('sha256', secret).update(body).digest('hex');
  return hash === signature;
}

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get('x-wompi-signature') || '';

  // Verify HMAC signature
  if (!verifySignature(body, signature)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  const event = JSON.parse(body);
  const { data } = event;

  if (!data?.transaction) {
    return NextResponse.json({ ok: true });
  }

  const transaction = data.transaction;
  const reference = transaction.reference;

  // Extract campaign/escrow from reference
  // Format: campaign-{campaignId}-{escrowId}
  const parts = reference.split('-');
  if (parts.length < 3 || parts[0] !== 'campaign') {
    // Check for credit purchase reference
    if (reference.startsWith('credits-')) {
      return handleCreditPurchase(transaction);
    }
    return NextResponse.json({ ok: true });
  }

  const escrowId = parts.slice(2).join('-');

  if (transaction.status === 'APPROVED') {
    try {
      await fundEscrow(escrowId, transaction.id);
    } catch (error) {
      console.error('Failed to fund escrow:', error);
      return NextResponse.json({ error: 'Escrow funding failed' }, { status: 500 });
    }
  } else if (transaction.status === 'DECLINED' || transaction.status === 'ERROR') {
    const supabase = createAdminClient();
    await supabase.from('escrow_transactions').update({
      status: 'failed',
      wompi_payment_id: transaction.id,
    }).eq('id', escrowId);
  }

  return NextResponse.json({ ok: true });
}

async function handleCreditPurchase(transaction: { reference: string; status: string; id: string }) {
  if (transaction.status !== 'APPROVED') {
    return NextResponse.json({ ok: true });
  }

  // Handle credit purchase confirmation
  // Reference format: credits-{userId}-{packId}
  const parts = transaction.reference.split('-');
  if (parts.length < 3) return NextResponse.json({ ok: true });

  // Credit addition handled in webhook confirmation
  return NextResponse.json({ ok: true });
}
