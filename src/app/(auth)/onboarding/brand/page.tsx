'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

const INDUSTRIES = [
  'Moda y Ropa',
  'Belleza y Cuidado Personal',
  'Alimentos y Bebidas',
  'Tecnología',
  'Hogar y Decoración',
  'Deportes y Fitness',
  'Salud y Bienestar',
  'Mascotas',
  'Juguetes y Niños',
  'Otro',
];

export default function BrandOnboardingPage() {
  const [step, setStep] = useState(1);
  const [companyName, setCompanyName] = useState('');
  const [nit, setNit] = useState('');
  const [industry, setIndustry] = useState('');
  const [website, setWebsite] = useState('');
  const [city, setCity] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const supabase = createClient();

  async function handleComplete() {
    setLoading(true);
    setError('');

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        company_name: companyName,
        nit: nit || null,
        industry,
        website: website || null,
        city: city || null,
        phone: phone || null,
        onboarding_completed: true,
      })
      .eq('id', user.id);

    if (updateError) {
      setError(updateError.message);
      setLoading(false);
      return;
    }

    router.push('/brand/campaigns');
    router.refresh();
  }

  return (
    <Card className="max-w-lg mx-auto">
      <CardHeader>
        <CardTitle>Configurar tu marca</CardTitle>
        <p className="text-sm text-muted-foreground">Paso {step} de 2</p>
      </CardHeader>
      <CardContent>
        {step === 1 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="companyName">Nombre de la empresa *</Label>
              <Input
                id="companyName"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Mi Empresa SAS"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nit">NIT (opcional)</Label>
              <Input
                id="nit"
                value={nit}
                onChange={(e) => setNit(e.target.value)}
                placeholder="900.123.456-7"
              />
            </div>
            <div className="space-y-2">
              <Label>Industria *</Label>
              <Select value={industry} onValueChange={setIndustry}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona tu industria" />
                </SelectTrigger>
                <SelectContent>
                  {INDUSTRIES.map((ind) => (
                    <SelectItem key={ind} value={ind}>{ind}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              className="w-full"
              onClick={() => setStep(2)}
              disabled={!companyName || !industry}
            >
              Siguiente
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="website">Sitio web (opcional)</Label>
              <Input
                id="website"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://miempresa.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="city">Ciudad</Label>
              <Input
                id="city"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Bogotá"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Teléfono (opcional)</Label>
              <Input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+57 300 123 4567"
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                Atrás
              </Button>
              <Button onClick={handleComplete} disabled={loading} className="flex-1">
                {loading ? 'Guardando...' : 'Completar'}
              </Button>
            </div>
            <p className="text-xs text-center text-muted-foreground">
              Recibirás 50 créditos de IA gratis para empezar
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
