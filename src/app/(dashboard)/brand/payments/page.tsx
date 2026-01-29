import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

const statusLabels: Record<string, string> = {
  pending_payment: 'Pendiente',
  payment_processing: 'Procesando',
  funded: 'Fondos en escrow',
  release_pending: 'Liberando',
  released: 'Liberado',
  refunded: 'Reembolsado',
  disputed: 'En disputa',
  failed: 'Fallido',
};

export default async function BrandPaymentsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: escrows } = await supabase
    .from('escrow_transactions')
    .select('*, campaign:campaigns!escrow_transactions_campaign_id_fkey(title)')
    .eq('brand_id', user.id)
    .order('created_at', { ascending: false });

  const formatCOP = (n: number) =>
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Pagos</h1>
        <p className="text-muted-foreground">Historial de pagos y transacciones de escrow</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Transacciones</CardTitle>
        </CardHeader>
        <CardContent>
          {(!escrows || escrows.length === 0) ? (
            <p className="text-muted-foreground text-sm">No hay transacciones aún.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Campaña</TableHead>
                  <TableHead>Monto total</TableHead>
                  <TableHead>Comisión</TableHead>
                  <TableHead>Para creador</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Fecha</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {escrows.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell className="font-medium">
                      {(e.campaign as { title: string }).title}
                    </TableCell>
                    <TableCell>{formatCOP(e.gross_amount)}</TableCell>
                    <TableCell>{formatCOP(e.platform_fee)}</TableCell>
                    <TableCell>{formatCOP(e.creator_amount)}</TableCell>
                    <TableCell>
                      <Badge variant={e.status === 'released' ? 'default' : e.status === 'failed' ? 'destructive' : 'secondary'}>
                        {statusLabels[e.status]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(e.created_at).toLocaleDateString('es-CO')}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
