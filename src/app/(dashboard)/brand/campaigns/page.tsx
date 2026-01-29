import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/server';
import type { Campaign } from '@/types/database';
import { CalendarDays, Plus, Users } from 'lucide-react';
import Link from 'next/link';
import { redirect } from 'next/navigation';

const statusLabels: Record<string, string> = {
  draft: 'Borrador',
  published: 'Publicada',
  in_progress: 'En progreso',
  completed: 'Completada',
  cancelled: 'Cancelada',
};

const statusVariants: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  draft: 'secondary',
  published: 'default',
  in_progress: 'default',
  completed: 'outline',
  cancelled: 'destructive',
};

export default async function BrandCampaignsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: campaigns } = await supabase
    .from('campaigns')
    .select('*')
    .eq('brand_id', user.id)
    .order('created_at', { ascending: false });

  const formatCOP = (n: number) =>
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Campañas</h1>
          <p className="text-muted-foreground">Gestiona tus campañas de contenido UGC</p>
        </div>
        <Link href="/brand/campaigns/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nueva campaña
          </Button>
        </Link>
      </div>

      {(!campaigns || campaigns.length === 0) ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">No tienes campañas aún</p>
            <Link href="/brand/campaigns/new">
              <Button>Crear tu primera campaña</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {campaigns.map((campaign: Campaign) => (
            <Link key={campaign.id} href={`/brand/campaigns/${campaign.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-lg">{campaign.title}</h3>
                        <Badge variant={statusVariants[campaign.status]}>
                          {statusLabels[campaign.status]}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {campaign.description}
                      </p>
                    </div>
                    <p className="text-lg font-semibold whitespace-nowrap">
                      {formatCOP(campaign.budget_per_creator)}
                      <span className="text-xs text-muted-foreground">/creador</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {campaign.accepted_creators_count}/{campaign.max_creators} creadores
                    </span>
                    <span className="flex items-center gap-1">
                      <CalendarDays className="h-4 w-4" />
                      {new Date(campaign.delivery_deadline).toLocaleDateString('es-CO')}
                    </span>
                    <span>{campaign.applications_count} aplicaciones</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
