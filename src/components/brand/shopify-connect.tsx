'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState } from 'react';

export function ShopifyConnect() {
  const [shop, setShop] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleConnect() {
    if (!shop) return;
    setLoading(true);

    const res = await fetch('/api/shopify/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ shop }),
    });

    const data = await res.json();
    if (data.url) {
      window.location.href = data.url;
    }
    setLoading(false);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Conectar tienda Shopify</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Conecta tu tienda de Shopify para importar productos automáticamente y crear campañas de contenido.
        </p>
        <div className="space-y-2">
          <Label htmlFor="shop">Dominio de tu tienda</Label>
          <div className="flex gap-2">
            <Input
              id="shop"
              value={shop}
              onChange={(e) => setShop(e.target.value)}
              placeholder="mi-tienda"
            />
            <span className="flex items-center text-sm text-muted-foreground whitespace-nowrap">
              .myshopify.com
            </span>
          </div>
        </div>
        <Button onClick={handleConnect} disabled={!shop || loading}>
          {loading ? 'Conectando...' : 'Conectar Shopify'}
        </Button>
      </CardContent>
    </Card>
  );
}
