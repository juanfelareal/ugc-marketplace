import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const campaignId = searchParams.get('campaignId');
  const otherUserId = searchParams.get('otherUserId');

  if (!campaignId || !otherUserId) {
    return NextResponse.json({ error: 'Missing params' }, { status: 400 });
  }

  const { data: messages } = await supabase
    .from('messages')
    .select('*, sender:profiles!messages_sender_id_fkey(full_name, avatar_url)')
    .eq('campaign_id', campaignId)
    .or(`and(sender_id.eq.${user.id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${user.id})`)
    .order('created_at', { ascending: true });

  // Mark as read
  const admin = createAdminClient();
  await admin.from('messages').update({ is_read: true })
    .eq('campaign_id', campaignId)
    .eq('receiver_id', user.id)
    .eq('sender_id', otherUserId)
    .eq('is_read', false);

  return NextResponse.json(messages || []);
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { campaignId, receiverId, content } = await request.json();
  if (!campaignId || !receiverId || !content) {
    return NextResponse.json({ error: 'Missing params' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('messages')
    .insert({
      campaign_id: campaignId,
      sender_id: user.id,
      receiver_id: receiverId,
      content,
    })
    .select('*, sender:profiles!messages_sender_id_fkey(full_name, avatar_url)')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Create notification
  const admin = createAdminClient();
  await admin.from('notifications').insert({
    user_id: receiverId,
    type: 'message_received',
    title: 'Nuevo mensaje',
    message: content.substring(0, 100),
    link: `/brand/campaigns/${campaignId}`,
  });

  return NextResponse.json(data);
}
