import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function CreatorEarningsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: escrows } = await supabase
    .from('escrow_transactions')
    .select('*, campaign:campaigns!escrow_transactions_campaign_id_fkey(title)')
    .eq('creator_id', user.id)
    .order('created_at', { ascending: false });

  const formatCOP = (n: number) =>
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n);

  const totalEarned = (escrows || [])
    .filter((e) => e.status === 'released')
    .reduce((sum, e) => sum + e.creator_amount, 0);

  const pending = (escrows || [])
    .filter((e) => ['funded', 'release_pending'].includes(e.status))
    .reduce((sum, e) => sum + e.creator_amount, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Ganancias</h1>
        <p className="text-muted-foreground">Tu historial de ingresos</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-3xl font-bold">{formatCOP(totalEarned)}</p>
            <p className="text-sm text-muted-foreground">Total ganado</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-3xl font-bold">{formatCOP(pending)}</p>
            <p className="text-sm text-muted-foreground">Pendiente de pago</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Historial</CardTitle></CardHeader>
        <CardContent>
          {(!escrows || escrows.length === 0) ? (
            <p className="text-sm text-muted-foreground">No hay pagos aún.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Campaña</TableHead>
                  <TableHead>Monto</TableHead>
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
                    <TableCell>{formatCOP(e.creator_amount)}</TableCell>
                    <TableCell>
                      <Badge variant={e.status === 'released' ? 'default' : 'secondary'}>
                        {e.status === 'released' ? 'Pagado' : 'Pendiente'}
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
