'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { Product } from '@/types/database';
import { RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface ProductsListProps {
  products: Product[];
  storeId: string;
}

export function ProductsList({ products, storeId }: ProductsListProps) {
  const [syncing, setSyncing] = useState(false);
  const router = useRouter();

  async function handleSync() {
    setSyncing(true);
    await fetch('/api/shopify/sync', { method: 'POST' });
    setSyncing(false);
    router.refresh();
  }

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(price);

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={handleSync} disabled={syncing}>
          <RefreshCw className={`mr-2 h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
          {syncing ? 'Sincronizando...' : 'Sincronizar productos'}
        </Button>
      </div>

      {products.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No hay productos importados. Sincroniza tu tienda Shopify.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <Card key={product.id} className="overflow-hidden">
              {product.image_urls[0] && (
                <div className="aspect-square relative bg-gray-100">
                  <img
                    src={product.image_urls[0]}
                    alt={product.title}
                    className="object-cover w-full h-full"
                  />
                  {product.ai_category && (
                    <Badge className="absolute top-2 right-2" variant="secondary">
                      IA analizado
                    </Badge>
                  )}
                </div>
              )}
              <CardContent className="p-4">
                <h3 className="font-medium truncate">{product.title}</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {product.price_min === product.price_max
                    ? formatPrice(product.price_min)
                    : `${formatPrice(product.price_min)} - ${formatPrice(product.price_max)}`}
                </p>
                {product.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {product.tags.slice(0, 3).map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
