'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createClient } from '@/lib/supabase/client';
import type { UserRole } from '@/types/database';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function SignupPage() {
  const [step, setStep] = useState<'role' | 'details'>('role');
  const [role, setRole] = useState<UserRole | null>(null);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const supabase = createClient();

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    if (!role) return;
    setLoading(true);
    setError('');

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, role },
        emailRedirectTo: `${window.location.origin}/api/auth/callback`,
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    if (data.user) {
      // Create profile
      const { error: profileError } = await supabase.from('profiles').insert({
        id: data.user.id,
        email,
        role,
        full_name: fullName,
        country: 'CO',
      });

      if (profileError) {
        setError(profileError.message);
        setLoading(false);
        return;
      }

      const onboardingPath = role === 'brand' ? '/onboarding/brand' : '/onboarding/creator';
      router.push(onboardingPath);
    }
  }

  if (step === 'role') {
    return (
      <Card>
        <CardHeader>
          <CardTitle>¿Cómo quieres usar la plataforma?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <button
            onClick={() => { setRole('brand'); setStep('details'); }}
            className="w-full rounded-lg border-2 p-4 text-left hover:border-primary transition-colors"
          >
            <p className="font-semibold">Soy una Marca</p>
            <p className="text-sm text-muted-foreground">
              Quiero encontrar creadores de contenido para mis productos
            </p>
          </button>
          <button
            onClick={() => { setRole('creator'); setStep('details'); }}
            className="w-full rounded-lg border-2 p-4 text-left hover:border-primary transition-colors"
          >
            <p className="font-semibold">Soy Creador/a</p>
            <p className="text-sm text-muted-foreground">
              Quiero crear contenido UGC para marcas y ganar dinero
            </p>
          </button>
        </CardContent>
        <CardFooter className="justify-center">
          <p className="text-sm text-muted-foreground">
            ¿Ya tienes cuenta?{' '}
            <Link href="/login" className="font-medium text-primary underline">
              Inicia sesión
            </Link>
          </p>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          Crear cuenta como {role === 'brand' ? 'Marca' : 'Creador/a'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSignup} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">Nombre completo</Label>
            <Input
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Contraseña</Label>
            <Input
              id="password"
              type="password"
              placeholder="Mínimo 6 caracteres"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={6}
              required
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Creando cuenta...' : 'Crear cuenta'}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex-col gap-2">
        <Button variant="ghost" size="sm" onClick={() => setStep('role')}>
          Cambiar tipo de cuenta
        </Button>
        <p className="text-sm text-muted-foreground">
          ¿Ya tienes cuenta?{' '}
          <Link href="/login" className="font-medium text-primary underline">
            Inicia sesión
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
