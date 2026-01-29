import { createAdminClient } from '@/lib/supabase/admin';
import { createWompiDisbursement } from './client';

export async function createEscrowTransaction(data: {
  campaignId: string;
  brandId: string;
  grossAmount: number;
  platformFeePercent: number;
}) {
  const supabase = createAdminClient();
  const platformFee = Math.round(data.grossAmount * (data.platformFeePercent / 100));
  const creatorAmount = data.grossAmount - platformFee;

  const { data: escrow, error } = await supabase
    .from('escrow_transactions')
    .insert({
      campaign_id: data.campaignId,
      brand_id: data.brandId,
      gross_amount: data.grossAmount,
      platform_fee: platformFee,
      creator_amount: creatorAmount,
      currency: 'COP',
      status: 'pending_payment',
      status_history: [{ status: 'pending_payment', at: new Date().toISOString() }],
    })
    .select()
    .single();

  if (error) throw error;
  return escrow;
}

export async function fundEscrow(escrowId: string, wompiPaymentId: string) {
  const supabase = createAdminClient();

  const { data: escrow } = await supabase
    .from('escrow_transactions')
    .select('*')
    .eq('id', escrowId)
    .single();

  if (!escrow) throw new Error('Escrow not found');

  const history = [...(escrow.status_history as Array<Record<string, unknown>>), {
    status: 'funded',
    at: new Date().toISOString(),
    wompi_payment_id: wompiPaymentId,
  }];

  await supabase.from('escrow_transactions').update({
    status: 'funded',
    wompi_payment_id: wompiPaymentId,
    status_history: history,
    funded_at: new Date().toISOString(),
  }).eq('id', escrowId);
}

export async function releaseEscrow(escrowId: string, creatorId: string, deliverableId: string) {
  const supabase = createAdminClient();

  const { data: escrow } = await supabase
    .from('escrow_transactions')
    .select('*')
    .eq('id', escrowId)
    .single();

  if (!escrow || escrow.status !== 'funded') throw new Error('Escrow not funded');

  // Get creator bank details
  const { data: creator } = await supabase
    .from('profiles')
    .select('full_name, bank_name, bank_account_type, bank_account_number_encrypted, bank_document_type, bank_document_number_encrypted')
    .eq('id', creatorId)
    .single();

  if (!creator || !creator.bank_account_number_encrypted) {
    throw new Error('Creator bank details missing');
  }

  const history = [...(escrow.status_history as Array<Record<string, unknown>>), {
    status: 'release_pending',
    at: new Date().toISOString(),
  }];

  // Update to release_pending
  await supabase.from('escrow_transactions').update({
    status: 'release_pending',
    creator_id: creatorId,
    deliverable_id: deliverableId,
    status_history: history,
  }).eq('id', escrowId);

  try {
    // Initiate Wompi disbursement
    const disbursement = await createWompiDisbursement({
      amountInCents: Math.round(escrow.creator_amount * 100),
      reference: `escrow-${escrowId}`,
      bankAccount: {
        type: creator.bank_account_type === 'ahorros' ? 'SAVINGS' : 'CHECKING',
        financialInstitutionCode: creator.bank_name || '',
        accountNumber: creator.bank_account_number_encrypted, // Decrypt in production
      },
      document: {
        type: creator.bank_document_type || 'CC',
        number: creator.bank_document_number_encrypted || '', // Decrypt in production
      },
      fullName: creator.full_name,
    });

    const finalHistory = [...history, {
      status: 'released',
      at: new Date().toISOString(),
      wompi_payout_id: disbursement?.data?.id,
    }];

    await supabase.from('escrow_transactions').update({
      status: 'released',
      wompi_payout_id: disbursement?.data?.id,
      status_history: finalHistory,
      released_at: new Date().toISOString(),
    }).eq('id', escrowId);

    // Record in platform ledger
    await supabase.from('platform_ledger').insert({
      type: 'platform_fee',
      amount: escrow.platform_fee,
      currency: 'COP',
      reference_type: 'escrow',
      reference_id: escrowId,
      description: `Comisión plataforma - Campaña ${escrow.campaign_id}`,
    });
  } catch (error) {
    // Mark as failed, will retry
    await supabase.from('escrow_transactions').update({
      status: 'funded', // Revert to funded for retry
      status_history: [...history, { status: 'release_failed', at: new Date().toISOString(), error: String(error) }],
    }).eq('id', escrowId);
    throw error;
  }
}
