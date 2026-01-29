import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// Get deliverables for a campaign or for a creator
export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const campaignId = searchParams.get('campaignId');
  const role = searchParams.get('role');

  let query = supabase
    .from('deliverables')
    .select('*, versions:deliverable_versions(*), comments:review_comments(*, author:profiles!review_comments_author_id_fkey(full_name, avatar_url))');

  if (campaignId) {
    query = query.eq('campaign_id', campaignId);
  }

  if (role === 'creator') {
    query = query.eq('creator_id', user.id);
  } else {
    query = query.eq('brand_id', user.id);
  }

  const { data, error } = await query.order('created_at', { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data);
}

// Upload deliverable / update status
export async function PATCH(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const { deliverableId, action, filePath, fileType, fileSize, rating, feedback, comment, timestampSeconds } = body;

  if (!deliverableId || !action) {
    return NextResponse.json({ error: 'Missing params' }, { status: 400 });
  }

  const admin = createAdminClient();

  const { data: deliverable } = await supabase
    .from('deliverables')
    .select('*')
    .eq('id', deliverableId)
    .single();

  if (!deliverable) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // Creator: upload
  if (action === 'upload' && deliverable.creator_id === user.id) {
    const newVersion = deliverable.revision_count + 1;

    // Save version
    await admin.from('deliverable_versions').insert({
      deliverable_id: deliverableId,
      version_number: newVersion,
      file_path: filePath,
      file_type: fileType,
      file_size: fileSize,
    });

    // Update deliverable
    await admin.from('deliverables').update({
      file_path: filePath,
      file_type: fileType,
      file_size: fileSize,
      status: 'uploaded',
      revision_count: newVersion,
    }).eq('id', deliverableId);

    return NextResponse.json({ success: true, version: newVersion });
  }

  // Brand: approve
  if (action === 'approve' && deliverable.brand_id === user.id) {
    await admin.from('deliverables').update({
      status: 'approved',
      brand_rating: rating || null,
      brand_feedback: feedback || null,
      approved_at: new Date().toISOString(),
    }).eq('id', deliverableId);

    // Update campaign completed count
    await admin.rpc('', {}); // Will handle via trigger
    return NextResponse.json({ success: true });
  }

  // Brand: request changes
  if (action === 'request_changes' && deliverable.brand_id === user.id) {
    await admin.from('deliverables').update({
      status: 'changes_requested',
      brand_feedback: feedback || null,
    }).eq('id', deliverableId);

    // Add review comment if provided
    if (comment) {
      await admin.from('review_comments').insert({
        deliverable_id: deliverableId,
        author_id: user.id,
        comment,
        timestamp_seconds: timestampSeconds || null,
      });
    }

    return NextResponse.json({ success: true });
  }

  // Brand: reject
  if (action === 'reject' && deliverable.brand_id === user.id) {
    await admin.from('deliverables').update({
      status: 'rejected',
      brand_feedback: feedback || null,
    }).eq('id', deliverableId);

    return NextResponse.json({ success: true });
  }

  // Add comment (any participant)
  if (action === 'comment' && (deliverable.brand_id === user.id || deliverable.creator_id === user.id)) {
    await admin.from('review_comments').insert({
      deliverable_id: deliverableId,
      author_id: user.id,
      comment: comment || '',
      timestamp_seconds: timestampSeconds || null,
    });

    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}
