import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { createClient } from '@/lib/supabase/server';
import { notFound, redirect } from 'next/navigation';
import { CampaignApplicationsList } from '@/components/brand/campaign-applications-list';

export default async function CampaignDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: campaign } = await supabase
    .from('campaigns')
    .select('*')
    .eq('id', id)
    .eq('brand_id', user.id)
    .single();

  if (!campaign) notFound();

  const { data: applications } = await supabase
    .from('campaign_applications')
    .select('*, creator:profiles!campaign_applications_creator_id_fkey(id, full_name, avatar_url, creator_level, niche, bio, total_completed_jobs, avg_rating)')
    .eq('campaign_id', id)
    .order('created_at', { ascending: false });

  const { data: deliverables } = await supabase
    .from('deliverables')
    .select('*')
    .eq('campaign_id', id)
    .order('created_at', { ascending: false });

  const formatCOP = (n: number) =>
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n);

  const statusLabels: Record<string, string> = {
    draft: 'Borrador',
    published: 'Publicada',
    in_progress: 'En progreso',
    completed: 'Completada',
    cancelled: 'Cancelada',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{campaign.title}</h1>
            <Badge>{statusLabels[campaign.status]}</Badge>
          </div>
          <p className="text-muted-foreground mt-1">{campaign.description}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{campaign.applications_count}</p>
            <p className="text-xs text-muted-foreground">Aplicaciones</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{campaign.accepted_creators_count}/{campaign.max_creators}</p>
            <p className="text-xs text-muted-foreground">Creadores</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{campaign.completed_deliverables_count}</p>
            <p className="text-xs text-muted-foreground">Entregas aprobadas</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{formatCOP(campaign.budget_per_creator)}</p>
            <p className="text-xs text-muted-foreground">Por creador</p>
          </CardContent>
        </Card>
      </div>

      {/* Campaign Details */}
      <Card>
        <CardHeader>
          <CardTitle>Detalles de la campaña</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {campaign.brief && (
            <div>
              <p className="font-medium">Brief</p>
              <p className="text-muted-foreground whitespace-pre-wrap">{campaign.brief}</p>
            </div>
          )}
          {campaign.requirements && (
            <div>
              <p className="font-medium">Requisitos</p>
              <p className="text-muted-foreground whitespace-pre-wrap">{campaign.requirements}</p>
            </div>
          )}
          {campaign.dos_and_donts && (
            <div>
              <p className="font-medium">Dos and Don&apos;ts</p>
              <p className="text-muted-foreground whitespace-pre-wrap">{campaign.dos_and_donts}</p>
            </div>
          )}
          <Separator />
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="font-medium">Objetivo</p>
              <p className="text-muted-foreground">{campaign.objective}</p>
            </div>
            <div>
              <p className="font-medium">Tipo de contenido</p>
              <p className="text-muted-foreground">{campaign.content_type}</p>
            </div>
            <div>
              <p className="font-medium">Derechos de uso</p>
              <p className="text-muted-foreground">{campaign.usage_rights}</p>
            </div>
            <div>
              <p className="font-medium">Fecha límite</p>
              <p className="text-muted-foreground">
                {new Date(campaign.delivery_deadline).toLocaleDateString('es-CO')}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Applications */}
      <Card>
        <CardHeader>
          <CardTitle>Aplicaciones ({applications?.length || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          <CampaignApplicationsList
            applications={applications || []}
            campaignId={id}
            piecesPerCreator={campaign.pieces_per_creator}
          />
        </CardContent>
      </Card>
    </div>
  );
}
