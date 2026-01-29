import { createClient } from '@/lib/supabase/server';
import { signContract } from '@/lib/contracts/generator';
import { NextResponse } from 'next/server';

// Get contract HTML
export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const contractId = searchParams.get('contractId');

  if (!contractId) return NextResponse.json({ error: 'Contract ID required' }, { status: 400 });

  const { data: contract } = await supabase
    .from('contracts')
    .select('*')
    .eq('id', contractId)
    .single();

  if (!contract) return NextResponse.json({ error: 'Contract not found' }, { status: 404 });

  // Check access
  if (contract.brand_id !== user.id && contract.creator_id !== user.id) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 });
  }

  return NextResponse.json(contract);
}

// Sign contract
export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { contractId } = await request.json();
  if (!contractId) return NextResponse.json({ error: 'Contract ID required' }, { status: 400 });

  const { data: contract } = await supabase
    .from('contracts')
    .select('*')
    .eq('id', contractId)
    .single();

  if (!contract) return NextResponse.json({ error: 'Contract not found' }, { status: 404 });

  const role = contract.brand_id === user.id ? 'brand' : contract.creator_id === user.id ? 'creator' : null;
  if (!role) return NextResponse.json({ error: 'Access denied' }, { status: 403 });

  await signContract(contractId, user.id, role);
  return NextResponse.json({ success: true });
}
