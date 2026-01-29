'use client';

import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { Upload } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';

interface Props {
  deliverableId: string;
  campaignId: string;
}

const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB

export function DeliverableUpload({ deliverableId, campaignId }: Props) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const supabase = createClient();

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      setError('El archivo excede el límite de 500MB');
      return;
    }

    setUploading(true);
    setError('');

    const ext = file.name.split('.').pop();
    const filePath = `deliverables/${campaignId}/${deliverableId}/${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('deliverables')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      setError('Error al subir archivo: ' + uploadError.message);
      setUploading(false);
      return;
    }

    // Update deliverable
    const res = await fetch('/api/deliverables', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        deliverableId,
        action: 'upload',
        filePath,
        fileType: file.type,
        fileSize: file.size,
      }),
    });

    if (!res.ok) {
      setError('Error al registrar entrega');
    }

    setUploading(false);
    router.refresh();
  }

  return (
    <div className="space-y-2">
      <input
        ref={fileRef}
        type="file"
        className="hidden"
        accept="video/*,image/*"
        onChange={handleUpload}
      />
      <Button
        variant="outline"
        onClick={() => fileRef.current?.click()}
        disabled={uploading}
        className="w-full"
      >
        <Upload className="mr-2 h-4 w-4" />
        {uploading ? 'Subiendo...' : 'Subir contenido'}
      </Button>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <p className="text-xs text-muted-foreground text-center">
        Máximo 500MB. Videos o imágenes.
      </p>
    </div>
  );
}
