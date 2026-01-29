'use client';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useUser } from '@/hooks/use-user';
import { createClient } from '@/lib/supabase/client';
import { Star } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function CreatorProfilePage() {
  const { profile, loading: profileLoading } = useUser();
  const [saving, setSaving] = useState(false);
  const [bio, setBio] = useState('');
  const [instagram, setInstagram] = useState('');
  const [tiktok, setTiktok] = useState('');
  const [phone, setPhone] = useState('');
  const [initialized, setInitialized] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  if (!initialized && profile) {
    setBio(profile.bio || '');
    setInstagram(profile.instagram_handle || '');
    setTiktok(profile.tiktok_handle || '');
    setPhone(profile.phone || '');
    setInitialized(true);
  }

  if (profileLoading || !profile) {
    return <div className="text-muted-foreground">Cargando...</div>;
  }

  const initials = profile.full_name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

  async function handleSave() {
    if (!profile) return;
    setSaving(true);
    await supabase.from('profiles').update({
      bio,
      instagram_handle: instagram || null,
      tiktok_handle: tiktok || null,
      phone: phone || null,
    }).eq('id', profile.id);
    setSaving(false);
    router.refresh();
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">Mi perfil</h1>
        <p className="text-muted-foreground">Edita tu información de creador</p>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-6">
        <Avatar className="h-16 w-16">
          <AvatarFallback className="text-xl">{initials}</AvatarFallback>
        </Avatar>
        <div>
          <h2 className="text-xl font-bold">{profile.full_name}</h2>
          <div className="flex items-center gap-3 mt-1">
            <Badge>{profile.creator_level}</Badge>
            {profile.avg_rating > 0 && (
              <span className="flex items-center gap-1 text-sm">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                {Number(profile.avg_rating).toFixed(1)}
              </span>
            )}
            <span className="text-sm text-muted-foreground">
              {profile.total_completed_jobs} trabajos
            </span>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle>Información</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Bio</Label>
            <Textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={4} />
          </div>
          <div className="space-y-2">
            <Label>Nichos</Label>
            <div className="flex flex-wrap gap-1">
              {profile.niche?.map((n) => (
                <Badge key={n} variant="secondary">{n}</Badge>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Instagram</Label>
              <Input value={instagram} onChange={(e) => setInstagram(e.target.value)} placeholder="@usuario" />
            </div>
            <div className="space-y-2">
              <Label>TikTok</Label>
              <Input value={tiktok} onChange={(e) => setTiktok(e.target.value)} placeholder="@usuario" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Teléfono</Label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
