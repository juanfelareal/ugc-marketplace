'use client';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Star } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface ApplicationCreator {
  id: string;
  full_name: string;
  avatar_url: string | null;
  creator_level: string | null;
  niche: string[] | null;
  bio: string | null;
  total_completed_jobs: number;
  avg_rating: number;
}

interface Application {
  id: string;
  campaign_id: string;
  creator_id: string;
  pitch_message: string | null;
  status: string;
  created_at: string;
  creator: ApplicationCreator;
}

interface Props {
  applications: Application[];
  campaignId: string;
  piecesPerCreator: number;
}

export function CampaignApplicationsList({ applications, campaignId, piecesPerCreator }: Props) {
  const [loadingId, setLoadingId] = useState('');
  const router = useRouter();

  async function handleAction(applicationId: string, status: 'accepted' | 'rejected') {
    setLoadingId(applicationId);
    await fetch('/api/applications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ applicationId, status }),
    });
    setLoadingId('');
    router.refresh();
  }

  if (applications.length === 0) {
    return <p className="text-sm text-muted-foreground">No hay aplicaciones aún.</p>;
  }

  const statusLabels: Record<string, string> = {
    pending: 'Pendiente',
    accepted: 'Aceptado',
    rejected: 'Rechazado',
    withdrawn: 'Retirado',
  };

  return (
    <div className="space-y-4">
      {applications.map((app) => {
        const creator = app.creator;
        const initials = creator.full_name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

        return (
          <div key={app.id} className="flex items-start gap-4 rounded-lg border p-4">
            <Avatar>
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-medium">{creator.full_name}</p>
                <Badge variant="outline" className="text-xs">{creator.creator_level}</Badge>
                {creator.avg_rating > 0 && (
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    {creator.avg_rating.toFixed(1)}
                  </span>
                )}
              </div>
              {creator.niche && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {creator.niche.slice(0, 4).map((n) => (
                    <Badge key={n} variant="secondary" className="text-xs">{n}</Badge>
                  ))}
                </div>
              )}
              {app.pitch_message && (
                <p className="text-sm text-muted-foreground mt-2">{app.pitch_message}</p>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                {creator.total_completed_jobs} trabajos completados
              </p>
            </div>
            <div className="flex flex-col gap-2 items-end">
              <Badge variant={app.status === 'accepted' ? 'default' : app.status === 'rejected' ? 'destructive' : 'secondary'}>
                {statusLabels[app.status]}
              </Badge>
              {app.status === 'pending' && (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleAction(app.id, 'rejected')}
                    disabled={loadingId === app.id}
                  >
                    Rechazar
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleAction(app.id, 'accepted')}
                    disabled={loadingId === app.id}
                  >
                    Aceptar
                  </Button>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
