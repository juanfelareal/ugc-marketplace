'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import type { Campaign, Profile } from '@/types/database';
import { CalendarDays, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface CampaignWithBrand extends Omit<Campaign, 'brand'> {
  brand: Pick<Profile, 'id' | 'full_name' | 'company_name' | 'avatar_url'>;
}

interface Props {
  campaigns: CampaignWithBrand[];
  appliedCampaigns: Record<string, string>;
}

const objectiveLabels: Record<string, string> = {
  ads: 'Pauta pagada',
  organic: 'Orgánico',
  testimonial: 'Testimonios',
  ugc_influencer: 'UGC Influencer',
};

export function CreatorCampaignsList({ campaigns, appliedCampaigns }: Props) {
  const [pitchMessage, setPitchMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [applyingTo, setApplyingTo] = useState<string | null>(null);
  const router = useRouter();

  const formatCOP = (n: number) =>
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n);

  async function handleApply(campaignId: string) {
    setLoading(true);
    await fetch('/api/applications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ campaignId, pitchMessage }),
    });
    setLoading(false);
    setApplyingTo(null);
    setPitchMessage('');
    router.refresh();
  }

  if (campaigns.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          No hay campañas disponibles en este momento. Vuelve pronto.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4">
      {campaigns.map((campaign) => {
        const status = appliedCampaigns[campaign.id];
        const hasApplied = !!status;

        return (
          <Card key={campaign.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-lg">{campaign.title}</h3>
                    <Badge variant="outline">{objectiveLabels[campaign.objective]}</Badge>
                    <Badge variant="secondary">{campaign.content_type}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {campaign.brand.company_name || campaign.brand.full_name}
                  </p>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {campaign.description}
                  </p>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {campaign.accepted_creators_count}/{campaign.max_creators}
                    </span>
                    <span className="flex items-center gap-1">
                      <CalendarDays className="h-4 w-4" />
                      {new Date(campaign.delivery_deadline).toLocaleDateString('es-CO')}
                    </span>
                    <span>{campaign.pieces_per_creator} pieza(s)</span>
                  </div>
                </div>
                <div className="text-right space-y-2">
                  <p className="text-xl font-bold">{formatCOP(campaign.budget_per_creator)}</p>
                  <p className="text-xs text-muted-foreground">por creador</p>
                  {hasApplied ? (
                    <Badge variant={status === 'accepted' ? 'default' : status === 'rejected' ? 'destructive' : 'secondary'}>
                      {status === 'pending' ? 'Aplicación enviada' : status === 'accepted' ? 'Aceptado' : 'Rechazado'}
                    </Badge>
                  ) : (
                    <Dialog open={applyingTo === campaign.id} onOpenChange={(open) => setApplyingTo(open ? campaign.id : null)}>
                      <DialogTrigger asChild>
                        <Button size="sm">Aplicar</Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Aplicar a: {campaign.title}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <p className="text-sm text-muted-foreground mb-2">
                              Cuéntale a la marca por qué eres ideal para esta campaña
                            </p>
                            <Textarea
                              value={pitchMessage}
                              onChange={(e) => setPitchMessage(e.target.value)}
                              placeholder="Mi experiencia con este tipo de productos, mi estilo, ideas que tengo..."
                              rows={4}
                            />
                          </div>
                          <Button
                            className="w-full"
                            onClick={() => handleApply(campaign.id)}
                            disabled={loading}
                          >
                            {loading ? 'Enviando...' : 'Enviar aplicación'}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
