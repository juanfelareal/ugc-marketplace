import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/server';
import { Star } from 'lucide-react';
import { redirect } from 'next/navigation';

export default async function BrandCreatorsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: creators } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', 'creator')
    .eq('onboarding_completed', true)
    .order('total_completed_jobs', { ascending: false })
    .limit(50);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Creadores</h1>
        <p className="text-muted-foreground">Explora creadores de contenido disponibles</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {(creators || []).map((creator) => {
          const initials = creator.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);

          return (
            <Card key={creator.id}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback>{initials}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium truncate">{creator.full_name}</p>
                      <Badge variant="outline" className="text-xs shrink-0">{creator.creator_level}</Badge>
                    </div>
                    {creator.avg_rating > 0 && (
                      <div className="flex items-center gap-1 text-sm">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        <span>{Number(creator.avg_rating).toFixed(1)}</span>
                        <span className="text-muted-foreground">
                          ({creator.total_completed_jobs} trabajos)
                        </span>
                      </div>
                    )}
                    {creator.niche && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {creator.niche.slice(0, 3).map((n: string) => (
                          <Badge key={n} variant="secondary" className="text-xs">{n}</Badge>
                        ))}
                      </div>
                    )}
                    {creator.bio && (
                      <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{creator.bio}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
