'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AI_COSTS, CREDIT_PACKS } from '@/types/campaigns';
import { Sparkles, Zap } from 'lucide-react';
import { useState } from 'react';

interface AIToolsClientProps {
  products: Array<{ id: string; title: string; image_urls: string[]; ai_category: string | null }>;
  initialBalance: number;
}

export function AIToolsClient({ products, initialBalance }: AIToolsClientProps) {
  const [balance, setBalance] = useState(initialBalance);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [analysisResult, setAnalysisResult] = useState<Record<string, unknown> | null>(null);
  const [anglesResult, setAnglesResult] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState('');
  const [error, setError] = useState('');

  async function handleAnalyze() {
    if (!selectedProduct) return;
    setLoading('analyze');
    setError('');
    setAnalysisResult(null);

    const res = await fetch('/api/ai/analyze-product', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId: selectedProduct }),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error);
    } else {
      setAnalysisResult(data);
      if (data.new_balance !== undefined) setBalance(data.new_balance);
    }
    setLoading('');
  }

  async function handleGenerateAngles() {
    if (!selectedProduct) return;
    setLoading('angles');
    setError('');
    setAnglesResult(null);

    const res = await fetch('/api/ai/generate-angles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        productId: selectedProduct,
        objective: 'ads',
        contentType: 'video',
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error);
    } else {
      setAnglesResult(data);
      if (data.new_balance !== undefined) setBalance(data.new_balance);
    }
    setLoading('');
  }

  async function handleBuyCredits(packId: string) {
    const res = await fetch('/api/credits', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ packId }),
    });
    const data = await res.json();
    if (data.new_balance !== undefined) setBalance(data.new_balance);
  }

  const formatCOP = (n: number) =>
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Herramientas IA</h1>
          <p className="text-muted-foreground">Analiza productos y genera ángulos creativos con IA</p>
        </div>
        <Badge variant="secondary" className="text-base px-4 py-2">
          <Zap className="mr-1 h-4 w-4" />
          {balance} créditos
        </Badge>
      </div>

      {/* Credit Packs */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Comprar créditos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {CREDIT_PACKS.map((pack) => (
              <button
                key={pack.id}
                onClick={() => handleBuyCredits(pack.id)}
                className={`relative rounded-lg border-2 p-4 text-center transition-colors hover:border-primary ${
                  pack.popular ? 'border-primary bg-primary/5' : ''
                }`}
              >
                {pack.popular && (
                  <Badge className="absolute -top-2 left-1/2 -translate-x-1/2 text-xs">Popular</Badge>
                )}
                <p className="text-2xl font-bold">{pack.credits}</p>
                <p className="text-xs text-muted-foreground">créditos</p>
                <p className="text-sm font-medium mt-1">{formatCOP(pack.price_cop)}</p>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Product Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Seleccionar producto</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Select value={selectedProduct} onValueChange={setSelectedProduct}>
            <SelectTrigger>
              <SelectValue placeholder="Selecciona un producto para analizar" />
            </SelectTrigger>
            <SelectContent>
              {products.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.title} {p.ai_category ? '(analizado)' : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex gap-3">
            <Button
              onClick={handleAnalyze}
              disabled={!selectedProduct || loading === 'analyze'}
            >
              <Sparkles className="mr-2 h-4 w-4" />
              {loading === 'analyze' ? 'Analizando...' : `Analizar producto (${AI_COSTS.analyze_product} créditos)`}
            </Button>
            <Button
              variant="outline"
              onClick={handleGenerateAngles}
              disabled={!selectedProduct || loading === 'angles'}
            >
              {loading === 'angles' ? 'Generando...' : `Generar ángulos (${AI_COSTS.generate_angles} créditos)`}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Analysis Results */}
      {analysisResult && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Resultado del análisis</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Categoría</p>
              <p>{String(analysisResult.category)}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Audiencia objetivo</p>
              <p>{String(analysisResult.target_audience)}</p>
            </div>
            {Array.isArray(analysisResult.key_benefits) && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Beneficios clave</p>
                <ul className="list-disc list-inside mt-1">
                  {analysisResult.key_benefits.map((b: string, i: number) => (
                    <li key={i}>{b}</li>
                  ))}
                </ul>
              </div>
            )}
            {Array.isArray(analysisResult.ugc_angles) && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Ángulos UGC sugeridos</p>
                <ul className="list-disc list-inside mt-1">
                  {analysisResult.ugc_angles.map((a: string, i: number) => (
                    <li key={i}>{a}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Angles Results */}
      {anglesResult && Array.isArray((anglesResult as { angles?: unknown[] }).angles) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Ángulos creativos generados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              {((anglesResult as { angles: Array<{ title: string; description: string; hook: string; format: string }> }).angles).map((angle, i) => (
                <div key={i} className="rounded-lg border p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold">{angle.title}</h4>
                    <Badge variant="outline">{angle.format}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{angle.description}</p>
                  <div className="bg-gray-50 rounded p-2">
                    <p className="text-xs font-medium text-muted-foreground">Hook</p>
                    <p className="text-sm italic">&ldquo;{angle.hook}&rdquo;</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
