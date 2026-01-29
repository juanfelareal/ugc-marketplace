'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Check, FileText } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface ContractItem {
  id: string;
  campaign_id: string;
  usage_rights: string;
  brand_signed_at: string | null;
  creator_signed_at: string | null;
  html_content: string;
  contract_hash: string;
  created_at: string;
  campaign: { title: string };
  brand?: { full_name: string; company_name: string | null };
  creator?: { full_name: string };
}

interface Props {
  contracts: ContractItem[];
  role: 'brand' | 'creator';
}

export function ContractsList({ contracts, role }: Props) {
  const [signing, setSigning] = useState('');
  const router = useRouter();

  async function handleSign(contractId: string) {
    setSigning(contractId);
    await fetch('/api/contracts/generate-pdf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contractId }),
    });
    setSigning('');
    router.refresh();
  }

  if (contracts.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          No hay contratos aún.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {contracts.map((contract) => {
        const isSigned = role === 'brand' ? !!contract.brand_signed_at : !!contract.creator_signed_at;
        const bothSigned = !!contract.brand_signed_at && !!contract.creator_signed_at;
        const otherParty = role === 'brand' ? contract.creator?.full_name : (contract.brand?.company_name || contract.brand?.full_name);

        return (
          <Card key={contract.id}>
            <CardContent className="p-4 flex items-center gap-4">
              <FileText className="h-8 w-8 text-muted-foreground flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-medium">{contract.campaign.title}</p>
                <p className="text-sm text-muted-foreground">
                  Con: {otherParty} &middot; {contract.usage_rights}
                </p>
                <p className="text-xs text-muted-foreground">
                  Hash: {contract.contract_hash.slice(0, 16)}...
                </p>
              </div>
              <div className="flex items-center gap-2">
                {bothSigned ? (
                  <Badge className="bg-green-600">Firmado por ambos</Badge>
                ) : isSigned ? (
                  <Badge variant="secondary">Tu firma: OK</Badge>
                ) : (
                  <Button
                    size="sm"
                    onClick={() => handleSign(contract.id)}
                    disabled={signing === contract.id}
                  >
                    <Check className="mr-1 h-4 w-4" />
                    {signing === contract.id ? 'Firmando...' : 'Firmar'}
                  </Button>
                )}
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">Ver</Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-3xl max-h-[80vh] overflow-auto">
                    <DialogHeader>
                      <DialogTitle>Contrato</DialogTitle>
                    </DialogHeader>
                    <div dangerouslySetInnerHTML={{ __html: contract.html_content }} />
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
