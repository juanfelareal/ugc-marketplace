import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { ShopifyConnect } from '@/components/brand/shopify-connect';

export default async function BrandSettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  const { data: store } = await supabase
    .from('stores')
    .select('*')
    .eq('brand_id', user.id)
    .single();

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">Configuración</h1>
        <p className="text-muted-foreground">Gestiona tu cuenta y conexiones</p>
      </div>

      <Card>
        <CardHeader><CardTitle>Datos de la empresa</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Nombre</span>
            <span>{profile?.company_name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">NIT</span>
            <span>{profile?.nit || 'No registrado'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Industria</span>
            <span>{profile?.industry}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Email</span>
            <span>{profile?.email}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Tienda Shopify</CardTitle></CardHeader>
        <CardContent>
          {store ? (
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Dominio</span>
                <span>{store.shop_domain}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Estado</span>
                <span>{store.sync_status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Productos</span>
                <span>{store.products_count}</span>
              </div>
              {store.last_synced_at && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Última sincronización</span>
                  <span>{new Date(store.last_synced_at).toLocaleString('es-CO')}</span>
                </div>
              )}
            </div>
          ) : (
            <ShopifyConnect />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
