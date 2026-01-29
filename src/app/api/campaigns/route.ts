import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const role = searchParams.get('role');

  let query = supabase.from('campaigns').select('*, brand:profiles!campaigns_brand_id_fkey(id, full_name, company_name, avatar_url)');

  if (role === 'brand') {
    query = query.eq('brand_id', user.id);
  } else {
    // Creators see published/in_progress campaigns
    query = query.in('status', ['published', 'in_progress']);
  }

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();

  const { data, error } = await supabase
    .from('campaigns')
    .insert({
      brand_id: user.id,
      title: body.title,
      description: body.description,
      product_ids: body.product_ids || [],
      objective: body.objective,
      content_type: body.content_type,
      pieces_per_creator: body.pieces_per_creator || 1,
      max_creators: body.max_creators || 1,
      budget_per_creator: body.budget_per_creator,
      usage_rights: body.usage_rights || 'organic_only',
      delivery_deadline: body.delivery_deadline,
      brief: body.brief || null,
      requirements: body.requirements || null,
      dos_and_donts: body.dos_and_donts || null,
      suggested_angles: body.suggested_angles || null,
      preferred_niches: body.preferred_niches || [],
      preferred_gender: body.preferred_gender || null,
      min_creator_level: body.min_creator_level || 'starter',
      status: body.status || 'draft',
      published_at: body.status === 'published' ? new Date().toISOString() : null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
