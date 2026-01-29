import { createAdminClient } from '@/lib/supabase/admin';
import { generateContractHTML, getUsageMonths } from './templates';
import { createHash } from 'crypto';
import type { UsageRights } from '@/types/database';

export async function generateContract(data: {
  campaignId: string;
  deliverableId: string;
  brandId: string;
  creatorId: string;
  usageRights: UsageRights;
  amount: number;
  platformFee: number;
  creatorAmount: number;
}) {
  const supabase = createAdminClient();

  // Get brand and creator info
  const [{ data: brand }, { data: creator }, { data: campaign }] = await Promise.all([
    supabase.from('profiles').select('full_name, company_name, nit').eq('id', data.brandId).single(),
    supabase.from('profiles').select('full_name, bank_document_type, bank_document_number_encrypted').eq('id', data.creatorId).single(),
    supabase.from('campaigns').select('title, description').eq('id', data.campaignId).single(),
  ]);

  if (!brand || !creator || !campaign) throw new Error('Missing data for contract');

  const htmlContent = generateContractHTML({
    brandName: brand.company_name || brand.full_name,
    brandNit: brand.nit,
    creatorName: creator.full_name,
    creatorDocument: creator.bank_document_number_encrypted, // Decrypt in production
    campaignTitle: campaign.title,
    contentDescription: campaign.description,
    usageRights: data.usageRights,
    amount: data.amount,
    platformFee: data.platformFee,
    creatorAmount: data.creatorAmount,
    deliverableId: data.deliverableId,
    date: new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' }),
  });

  const contractHash = createHash('sha256').update(htmlContent).digest('hex');

  const contractData = {
    brand_name: brand.company_name || brand.full_name,
    creator_name: creator.full_name,
    campaign_title: campaign.title,
    usage_rights: data.usageRights,
    amount: data.amount,
    created_at: new Date().toISOString(),
  };

  const { data: contract, error } = await supabase
    .from('contracts')
    .insert({
      campaign_id: data.campaignId,
      deliverable_id: data.deliverableId,
      brand_id: data.brandId,
      creator_id: data.creatorId,
      usage_rights: data.usageRights,
      usage_months: getUsageMonths(data.usageRights),
      contract_data: contractData,
      contract_hash: contractHash,
      html_content: htmlContent,
    })
    .select()
    .single();

  if (error) throw error;
  return contract;
}

export async function signContract(contractId: string, userId: string, role: 'brand' | 'creator') {
  const supabase = createAdminClient();

  const field = role === 'brand' ? 'brand_signed_at' : 'creator_signed_at';

  const { error } = await supabase
    .from('contracts')
    .update({ [field]: new Date().toISOString() })
    .eq('id', contractId);

  if (error) throw error;
}
