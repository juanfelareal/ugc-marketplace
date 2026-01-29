import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { ProductsList } from '@/components/brand/products-list';
import { ShopifyConnect } from '@/components/brand/shopify-connect';

export default async function BrandProductsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: store } = await supabase
    .from('stores')
    .select('*')
    .eq('brand_id', user.id)
    .single();

  const { data: products } = await supabase
    .from('products')
    .select('*')
    .eq('brand_id', user.id)
    .order('created_at', { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Productos</h1>
          <p className="text-muted-foreground">Gestiona los productos de tu tienda Shopify</p>
        </div>
        {store && (
          <Badge variant={store.sync_status === 'synced' ? 'default' : 'secondary'}>
            {store.sync_status === 'synced' ? 'Sincronizado' : store.sync_status}
          </Badge>
        )}
      </div>

      {!store ? (
        <ShopifyConnect />
      ) : (
        <ProductsList products={products || []} storeId={store.id} />
      )}
    </div>
  );
}
