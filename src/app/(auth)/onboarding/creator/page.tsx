'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

const NICHES = [
  'Moda', 'Belleza', 'Fitness', 'Gastronomía', 'Tecnología',
  'Lifestyle', 'Mascotas', 'Viajes', 'Gaming', 'Educación',
  'Hogar', 'Salud', 'Maternidad', 'Deportes', 'Finanzas',
];

export default function CreatorOnboardingPage() {
  const [step, setStep] = useState(1);
  const [bio, setBio] = useState('');
  const [selectedNiches, setSelectedNiches] = useState<string[]>([]);
  const [gender, setGender] = useState('');
  const [city, setCity] = useState('');
  const [phone, setPhone] = useState('');
  const [instagramHandle, setInstagramHandle] = useState('');
  const [tiktokHandle, setTiktokHandle] = useState('');
  const [portfolioUrl, setPortfolioUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const supabase = createClient();

  function toggleNiche(niche: string) {
    setSelectedNiches((prev) =>
      prev.includes(niche)
        ? prev.filter((n) => n !== niche)
        : prev.length < 5 ? [...prev, niche] : prev
    );
  }

  async function handleComplete() {
    setLoading(true);
    setError('');

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        bio: bio || null,
        niche: selectedNiches,
        gender: gender || null,
        city: city || null,
        phone: phone || null,
        instagram_handle: instagramHandle || null,
        tiktok_handle: tiktokHandle || null,
        portfolio_urls: portfolioUrl ? [portfolioUrl] : [],
        onboarding_completed: true,
      })
      .eq('id', user.id);

    if (updateError) {
      setError(updateError.message);
      setLoading(false);
      return;
    }

    router.push('/creator/campaigns');
    router.refresh();
  }

  return (
    <Card className="max-w-lg mx-auto">
      <CardHeader>
        <CardTitle>Configura tu perfil de creador</CardTitle>
        <p className="text-sm text-muted-foreground">Paso {step} de 3</p>
      </CardHeader>
      <CardContent>
        {step === 1 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nichos (selecciona hasta 5) *</Label>
              <div className="grid grid-cols-3 gap-2">
                {NICHES.map((niche) => (
                  <label
                    key={niche}
                    className={`flex items-center gap-2 rounded-lg border p-2 text-sm cursor-pointer transition-colors ${
                      selectedNiches.includes(niche) ? 'border-primary bg-primary/5' : ''
                    }`}
                  >
                    <Checkbox
                      checked={selectedNiches.includes(niche)}
                      onCheckedChange={() => toggleNiche(niche)}
                    />
                    {niche}
                  </label>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Género</Label>
              <Select value={gender} onValueChange={setGender}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="female">Femenino</SelectItem>
                  <SelectItem value="male">Masculino</SelectItem>
                  <SelectItem value="non_binary">No binario</SelectItem>
                  <SelectItem value="prefer_not_say">Prefiero no decir</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              className="w-full"
              onClick={() => setStep(2)}
              disabled={selectedNiches.length === 0}
            >
              Siguiente
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="bio">Sobre ti *</Label>
              <Textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Cuéntale a las marcas sobre ti, tu estilo y experiencia creando contenido..."
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="city">Ciudad</Label>
              <Input
                id="city"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Medellín"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Teléfono</Label>
              <Input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+57 300 123 4567"
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                Atrás
              </Button>
              <Button onClick={() => setStep(3)} disabled={!bio} className="flex-1">
                Siguiente
              </Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="instagram">Instagram</Label>
              <Input
                id="instagram"
                value={instagramHandle}
                onChange={(e) => setInstagramHandle(e.target.value)}
                placeholder="@tu_usuario"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tiktok">TikTok</Label>
              <Input
                id="tiktok"
                value={tiktokHandle}
                onChange={(e) => setTiktokHandle(e.target.value)}
                placeholder="@tu_usuario"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="portfolio">Link de portafolio (opcional)</Label>
              <Input
                id="portfolio"
                value={portfolioUrl}
                onChange={(e) => setPortfolioUrl(e.target.value)}
                placeholder="https://tu-portafolio.com"
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(2)} className="flex-1">
                Atrás
              </Button>
              <Button onClick={handleComplete} disabled={loading} className="flex-1">
                {loading ? 'Guardando...' : 'Completar perfil'}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
