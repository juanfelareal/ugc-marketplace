'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import type { CampaignObjective, ContentType, CreatorLevel, UsageRights } from '@/types/database';
import { Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface Product {
  id: string;
  title: string;
  image_urls: string[];
  price_min: number;
  price_max: number;
  ai_category: string | null;
  ai_target_audience: string | null;
  ai_key_benefits: string[] | null;
}

interface CampaignFormProps {
  products: Product[];
  creditBalance: number;
}

const STEPS = [
  'Productos',
  'Objetivo',
  'Brief',
  'Requisitos',
  'Budget',
  'Publicar',
];

export function CampaignForm({ products, creditBalance }: CampaignFormProps) {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  // Form state
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [objective, setObjective] = useState<CampaignObjective>('ads');
  const [contentType, setContentType] = useState<ContentType>('video');
  const [brief, setBrief] = useState('');
  const [requirements, setRequirements] = useState('');
  const [dosAndDonts, setDosAndDonts] = useState('');
  const [suggestedAngles, setSuggestedAngles] = useState<Record<string, unknown> | null>(null);
  const [piecesPerCreator, setPiecesPerCreator] = useState(1);
  const [maxCreators, setMaxCreators] = useState(3);
  const [budgetPerCreator, setBudgetPerCreator] = useState(200000);
  const [usageRights, setUsageRights] = useState<UsageRights>('organic_only');
  const [deliveryDeadline, setDeliveryDeadline] = useState('');
  const [minCreatorLevel, setMinCreatorLevel] = useState<CreatorLevel>('starter');

  // AI loading
  const [aiLoading, setAiLoading] = useState('');

  function toggleProduct(id: string) {
    setSelectedProducts((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  }

  async function handleAnalyzeProduct(productId: string) {
    setAiLoading(productId);
    await fetch('/api/ai/analyze-product', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId }),
    });
    setAiLoading('');
  }

  async function handleGenerateAngles() {
    if (selectedProducts.length === 0) return;
    setAiLoading('angles');
    const res = await fetch('/api/ai/generate-angles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        productId: selectedProducts[0],
        objective,
        contentType,
      }),
    });
    const data = await res.json();
    if (data.angles) setSuggestedAngles(data);
    setAiLoading('');
  }

  async function handleSubmit(status: 'draft' | 'published') {
    setLoading(true);
    setError('');

    const res = await fetch('/api/campaigns', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        description,
        product_ids: selectedProducts,
        objective,
        content_type: contentType,
        pieces_per_creator: piecesPerCreator,
        max_creators: maxCreators,
        budget_per_creator: budgetPerCreator,
        usage_rights: usageRights,
        delivery_deadline: deliveryDeadline,
        brief,
        requirements,
        dos_and_donts: dosAndDonts,
        suggested_angles: suggestedAngles,
        min_creator_level: minCreatorLevel,
        status,
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || 'Error al crear campaña');
      setLoading(false);
      return;
    }

    const campaign = await res.json();
    router.push(`/brand/campaigns/${campaign.id}`);
  }

  const formatCOP = (n: number) =>
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n);

  return (
    <div className="space-y-6">
      {/* Progress */}
      <div className="flex gap-2">
        {STEPS.map((s, i) => (
          <button
            key={s}
            onClick={() => i <= step ? setStep(i) : undefined}
            className={`flex-1 h-2 rounded-full transition-colors ${
              i <= step ? 'bg-primary' : 'bg-gray-200'
            }`}
          />
        ))}
      </div>
      <p className="text-sm font-medium text-muted-foreground">
        Paso {step + 1} de {STEPS.length}: {STEPS[step]}
      </p>

      {/* Step 0: Products */}
      {step === 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Selecciona productos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {products.length === 0 ? (
              <p className="text-muted-foreground">
                No hay productos. Conecta tu tienda Shopify primero.
              </p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {products.map((product) => (
                  <label
                    key={product.id}
                    className={`flex items-start gap-3 rounded-lg border-2 p-3 cursor-pointer transition-colors ${
                      selectedProducts.includes(product.id) ? 'border-primary bg-primary/5' : ''
                    }`}
                  >
                    <Checkbox
                      checked={selectedProducts.includes(product.id)}
                      onCheckedChange={() => toggleProduct(product.id)}
                      className="mt-1"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{product.title}</p>
                      {product.ai_category && (
                        <Badge variant="outline" className="text-xs mt-1">
                          {product.ai_category}
                        </Badge>
                      )}
                    </div>
                    {product.image_urls[0] && (
                      <img
                        src={product.image_urls[0]}
                        alt=""
                        className="h-12 w-12 rounded object-cover"
                      />
                    )}
                  </label>
                ))}
              </div>
            )}
            <Button
              onClick={() => setStep(1)}
              disabled={selectedProducts.length === 0}
              className="w-full"
            >
              Siguiente
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Step 1: Objective */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Objetivo y formato</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Título de la campaña *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ej: UGC Videos para lanzamiento de producto"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Descripción *</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe qué tipo de contenido necesitas..."
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Objetivo</Label>
                <Select value={objective} onValueChange={(v) => setObjective(v as CampaignObjective)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ads">Pauta pagada</SelectItem>
                    <SelectItem value="organic">Contenido orgánico</SelectItem>
                    <SelectItem value="testimonial">Testimonios</SelectItem>
                    <SelectItem value="ugc_influencer">UGC Influencer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Tipo de contenido</Label>
                <Select value={contentType} onValueChange={(v) => setContentType(v as ContentType)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="video">Video</SelectItem>
                    <SelectItem value="photo">Foto</SelectItem>
                    <SelectItem value="video_and_photo">Video + Foto</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(0)}>Atrás</Button>
              <Button onClick={() => setStep(2)} disabled={!title || !description} className="flex-1">
                Siguiente
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Brief */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Brief creativo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="brief">Brief para creadores</Label>
              <Textarea
                id="brief"
                value={brief}
                onChange={(e) => setBrief(e.target.value)}
                placeholder="Describe el tono, estilo, mensaje principal..."
                rows={4}
              />
            </div>
            <Button
              variant="outline"
              onClick={handleGenerateAngles}
              disabled={aiLoading === 'angles'}
              className="w-full"
            >
              <Sparkles className="mr-2 h-4 w-4" />
              {aiLoading === 'angles'
                ? 'Generando ángulos...'
                : `Generar ángulos con IA (5 créditos)`}
            </Button>
            {suggestedAngles && Array.isArray((suggestedAngles as { angles?: unknown[] }).angles) && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Ángulos sugeridos por IA:</p>
                {((suggestedAngles as { angles: Array<{ title: string; description: string; hook: string }> }).angles).map((angle, i) => (
                  <div key={i} className="rounded border p-3 text-sm">
                    <p className="font-medium">{angle.title}</p>
                    <p className="text-muted-foreground">{angle.description}</p>
                    <p className="italic mt-1">&ldquo;{angle.hook}&rdquo;</p>
                  </div>
                ))}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="dosdonts">Dos and Don&apos;ts</Label>
              <Textarea
                id="dosdonts"
                value={dosAndDonts}
                onChange={(e) => setDosAndDonts(e.target.value)}
                placeholder="Qué sí hacer y qué no hacer..."
                rows={3}
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(1)}>Atrás</Button>
              <Button onClick={() => setStep(3)} className="flex-1">Siguiente</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Creator Requirements */}
      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>Requisitos del creador</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="requirements">Requisitos adicionales</Label>
              <Textarea
                id="requirements"
                value={requirements}
                onChange={(e) => setRequirements(e.target.value)}
                placeholder="Ej: Tener experiencia con productos de belleza, grabar en buena iluminación..."
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>Nivel mínimo del creador</Label>
              <Select value={minCreatorLevel} onValueChange={(v) => setMinCreatorLevel(v as CreatorLevel)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="starter">Starter (cualquier nivel)</SelectItem>
                  <SelectItem value="pro">Pro (5+ trabajos completados)</SelectItem>
                  <SelectItem value="elite">Elite (20+ trabajos, 4.5+ rating)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(2)}>Atrás</Button>
              <Button onClick={() => setStep(4)} className="flex-1">Siguiente</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Budget */}
      {step === 4 && (
        <Card>
          <CardHeader>
            <CardTitle>Presupuesto y plazos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="pieces">Piezas por creador</Label>
                <Input
                  id="pieces"
                  type="number"
                  min={1}
                  max={10}
                  value={piecesPerCreator}
                  onChange={(e) => setPiecesPerCreator(Number(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxCreators">Máximo de creadores</Label>
                <Input
                  id="maxCreators"
                  type="number"
                  min={1}
                  max={50}
                  value={maxCreators}
                  onChange={(e) => setMaxCreators(Number(e.target.value))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="budget">Presupuesto por creador (COP)</Label>
              <Input
                id="budget"
                type="number"
                min={50000}
                step={10000}
                value={budgetPerCreator}
                onChange={(e) => setBudgetPerCreator(Number(e.target.value))}
              />
              <p className="text-xs text-muted-foreground">
                Total estimado: {formatCOP(budgetPerCreator * maxCreators)} + 15% comisión plataforma
              </p>
            </div>
            <div className="space-y-2">
              <Label>Derechos de uso</Label>
              <Select value={usageRights} onValueChange={(v) => setUsageRights(v as UsageRights)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="organic_only">Solo orgánico</SelectItem>
                  <SelectItem value="paid_ads_3m">Pauta pagada - 3 meses</SelectItem>
                  <SelectItem value="paid_ads_6m">Pauta pagada - 6 meses</SelectItem>
                  <SelectItem value="paid_ads_12m">Pauta pagada - 12 meses</SelectItem>
                  <SelectItem value="perpetual">Perpetuo (todos los derechos)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="deadline">Fecha límite de entrega</Label>
              <Input
                id="deadline"
                type="date"
                value={deliveryDeadline}
                onChange={(e) => setDeliveryDeadline(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(3)}>Atrás</Button>
              <Button
                onClick={() => setStep(5)}
                disabled={!deliveryDeadline || budgetPerCreator < 50000}
                className="flex-1"
              >
                Siguiente
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 5: Review & Publish */}
      {step === 5 && (
        <Card>
          <CardHeader>
            <CardTitle>Resumen y publicación</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Título</span>
                <span className="font-medium">{title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Productos</span>
                <span>{selectedProducts.length} seleccionados</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Objetivo</span>
                <span>{objective}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Contenido</span>
                <span>{contentType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Creadores</span>
                <span>{maxCreators} máx, {piecesPerCreator} pieza(s) c/u</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Presupuesto/creador</span>
                <span className="font-medium">{formatCOP(budgetPerCreator)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total estimado</span>
                <span className="font-bold">{formatCOP(budgetPerCreator * maxCreators * 1.15)} (inc. comisión)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Derechos</span>
                <span>{usageRights}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Fecha límite</span>
                <span>{new Date(deliveryDeadline).toLocaleDateString('es-CO')}</span>
              </div>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(4)}>Atrás</Button>
              <Button
                variant="outline"
                onClick={() => handleSubmit('draft')}
                disabled={loading}
                className="flex-1"
              >
                Guardar borrador
              </Button>
              <Button
                onClick={() => handleSubmit('published')}
                disabled={loading}
                className="flex-1"
              >
                {loading ? 'Publicando...' : 'Publicar campaña'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
