import { createAdminClient } from '@/lib/supabase/admin';

export async function deductCredits(
  userId: string,
  amount: number,
  description: string,
  referenceId?: string,
  referenceType?: string
): Promise<{ success: boolean; newBalance: number }> {
  const supabase = createAdminClient();

  const { data, error } = await supabase.rpc('deduct_credits', {
    p_user_id: userId,
    p_amount: amount,
    p_description: description,
    p_reference_id: referenceId || null,
    p_reference_type: referenceType || null,
  });

  if (error) throw error;

  const result = data?.[0];
  return {
    success: result?.success ?? false,
    newBalance: result?.new_balance ?? 0,
  };
}

export async function addCredits(
  userId: string,
  amount: number,
  type: 'purchase' | 'bonus' | 'refund' | 'signup_bonus',
  description: string,
  referenceId?: string,
  referenceType?: string
): Promise<{ newBalance: number }> {
  const supabase = createAdminClient();

  const { data, error } = await supabase.rpc('add_credits', {
    p_user_id: userId,
    p_amount: amount,
    p_type: type,
    p_description: description,
    p_reference_id: referenceId || null,
    p_reference_type: referenceType || null,
  });

  if (error) throw error;

  const result = data?.[0];
  return { newBalance: result?.new_balance ?? 0 };
}
