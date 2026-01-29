import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { campaignId, pitchMessage } = await request.json();
  if (!campaignId) return NextResponse.json({ error: 'Campaign ID required' }, { status: 400 });

  // Check campaign exists and is published
  const { data: campaign } = await supabase
    .from('campaigns')
    .select('id, max_creators, accepted_creators_count')
    .eq('id', campaignId)
    .in('status', ['published', 'in_progress'])
    .single();

  if (!campaign) return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });

  // Check not already applied
  const { data: existing } = await supabase
    .from('campaign_applications')
    .select('id')
    .eq('campaign_id', campaignId)
    .eq('creator_id', user.id)
    .single();

  if (existing) return NextResponse.json({ error: 'Ya aplicaste a esta campaña' }, { status: 409 });

  const { data, error } = await supabase
    .from('campaign_applications')
    .insert({
      campaign_id: campaignId,
      creator_id: user.id,
      pitch_message: pitchMessage || null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}

// Accept/reject application (brand endpoint)
export async function PATCH(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { applicationId, status } = await request.json();
  if (!applicationId || !['accepted', 'rejected'].includes(status)) {
    return NextResponse.json({ error: 'Invalid params' }, { status: 400 });
  }

  // Verify the application belongs to user's campaign
  const { data: application } = await supabase
    .from('campaign_applications')
    .select('*, campaign:campaigns!campaign_applications_campaign_id_fkey(brand_id, pieces_per_creator)')
    .eq('id', applicationId)
    .single();

  if (!application || (application.campaign as { brand_id: string }).brand_id !== user.id) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
  }

  const { error: updateError } = await supabase
    .from('campaign_applications')
    .update({ status, responded_at: new Date().toISOString() })
    .eq('id', applicationId);

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

  // If accepted, create deliverable records
  if (status === 'accepted') {
    const piecesPerCreator = (application.campaign as { pieces_per_creator: number }).pieces_per_creator;
    const admin = createAdminClient();

    const deliverables = Array.from({ length: piecesPerCreator }, (_, i) => ({
      campaign_id: application.campaign_id,
      application_id: applicationId,
      creator_id: application.creator_id,
      brand_id: user.id,
      piece_number: i + 1,
      status: 'pending' as const,
    }));

    await admin.from('deliverables').insert(deliverables);

    // Update campaign status to in_progress
    await admin.from('campaigns').update({ status: 'in_progress' }).eq('id', application.campaign_id);
  }

  return NextResponse.json({ success: true });
}
