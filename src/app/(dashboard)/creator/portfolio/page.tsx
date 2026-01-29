import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { DeliverableUpload } from '@/components/creator/deliverable-upload';

const statusLabels: Record<string, string> = {
  pending: 'Pendiente',
  uploaded: 'Subido',
  in_review: 'En revisión',
  changes_requested: 'Cambios solicitados',
  approved: 'Aprobado',
  rejected: 'Rechazado',
};

export default async function CreatorPortfolioPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: deliverables } = await supabase
    .from('deliverables')
    .select(`
      *,
      campaign:campaigns!deliverables_campaign_id_fkey(title, brand_id),
      comments:review_comments(*, author:profiles!review_comments_author_id_fkey(full_name))
    `)
    .eq('creator_id', user.id)
    .order('created_at', { ascending: false });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Mi portafolio</h1>
        <p className="text-muted-foreground">Gestiona tus entregas de contenido</p>
      </div>

      {(!deliverables || deliverables.length === 0) ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No tienes entregas pendientes. Aplica a campañas para empezar.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {deliverables.map((d) => (
            <Card key={d.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">
                      {(d.campaign as { title: string }).title} - Pieza #{d.piece_number}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Revisión {d.revision_count}/{d.max_revisions}
                    </p>
                  </div>
                  <Badge variant={d.status === 'approved' ? 'default' : d.status === 'rejected' ? 'destructive' : 'secondary'}>
                    {statusLabels[d.status]}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Feedback/comments */}
                {d.brand_feedback && (
                  <div className="rounded-lg bg-yellow-50 p-3 text-sm">
                    <p className="font-medium text-yellow-800">Feedback de la marca:</p>
                    <p className="text-yellow-700">{d.brand_feedback}</p>
                  </div>
                )}
                {Array.isArray(d.comments) && d.comments.length > 0 && (
                  <div className="space-y-2">
                    {d.comments.map((c: { id: string; comment: string; author: { full_name: string }; timestamp_seconds: number | null; created_at: string }) => (
                      <div key={c.id} className="text-sm border-l-2 pl-3">
                        <p className="font-medium">{c.author.full_name}</p>
                        <p className="text-muted-foreground">{c.comment}</p>
                        {c.timestamp_seconds && (
                          <Badge variant="outline" className="text-xs mt-1">
                            @ {Math.floor(c.timestamp_seconds / 60)}:{String(Math.floor(c.timestamp_seconds % 60)).padStart(2, '0')}
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Upload area */}
                {['pending', 'changes_requested'].includes(d.status) && (
                  <DeliverableUpload
                    deliverableId={d.id}
                    campaignId={d.campaign_id}
                  />
                )}

                {/* Show uploaded file */}
                {d.file_path && d.status !== 'pending' && (
                  <div className="text-sm text-muted-foreground">
                    Archivo subido: {d.file_type} ({((d.file_size || 0) / 1024 / 1024).toFixed(1)} MB)
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
