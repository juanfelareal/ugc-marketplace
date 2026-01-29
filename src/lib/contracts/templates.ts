import type { UsageRights } from '@/types/database';

const usageRightsLabels: Record<UsageRights, string> = {
  organic_only: 'Uso orgánico únicamente (sin pauta pagada)',
  paid_ads_3m: 'Uso en pauta pagada por 3 meses',
  paid_ads_6m: 'Uso en pauta pagada por 6 meses',
  paid_ads_12m: 'Uso en pauta pagada por 12 meses',
  perpetual: 'Derechos perpetuos (todos los usos)',
};

const usageMonths: Record<UsageRights, number | null> = {
  organic_only: null,
  paid_ads_3m: 3,
  paid_ads_6m: 6,
  paid_ads_12m: 12,
  perpetual: null,
};

export function getUsageMonths(rights: UsageRights): number | null {
  return usageMonths[rights];
}

export function generateContractHTML(data: {
  brandName: string;
  brandNit: string | null;
  creatorName: string;
  creatorDocument: string | null;
  campaignTitle: string;
  contentDescription: string;
  usageRights: UsageRights;
  amount: number;
  platformFee: number;
  creatorAmount: number;
  deliverableId: string;
  date: string;
}): string {
  const formatCOP = (n: number) =>
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n);

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Contrato de Cesión de Derechos - UGC Marketplace</title>
  <style>
    body { font-family: 'Inter', sans-serif; max-width: 800px; margin: 0 auto; padding: 40px; color: #1a1a1a; line-height: 1.6; }
    h1 { text-align: center; font-size: 20px; margin-bottom: 30px; }
    h2 { font-size: 16px; margin-top: 24px; }
    .parties { background: #f5f5f5; padding: 16px; border-radius: 8px; margin: 20px 0; }
    .clause { margin: 16px 0; }
    .signatures { display: flex; gap: 40px; margin-top: 40px; }
    .signature-block { flex: 1; border-top: 1px solid #999; padding-top: 12px; text-align: center; }
    .amount { font-size: 18px; font-weight: bold; color: #16a34a; }
    .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #666; }
    .signed { color: #16a34a; font-weight: bold; }
  </style>
</head>
<body>
  <h1>CONTRATO DE CESIÓN DE DERECHOS DE CONTENIDO</h1>
  <p style="text-align:center;color:#666;">Contrato electrónico - Ley 527 de 1999 (Colombia)</p>

  <div class="parties">
    <p><strong>LA MARCA (Cesionario):</strong> ${data.brandName}${data.brandNit ? ` - NIT: ${data.brandNit}` : ''}</p>
    <p><strong>EL CREADOR (Cedente):</strong> ${data.creatorName}${data.creatorDocument ? ` - Doc: ${data.creatorDocument}` : ''}</p>
    <p><strong>Fecha:</strong> ${data.date}</p>
    <p><strong>Referencia:</strong> ${data.deliverableId}</p>
  </div>

  <h2>1. OBJETO DEL CONTRATO</h2>
  <div class="clause">
    <p>El Creador cede a la Marca los derechos de uso sobre el contenido generado en el marco de la campaña "<strong>${data.campaignTitle}</strong>".</p>
    <p><strong>Descripción del contenido:</strong> ${data.contentDescription}</p>
  </div>

  <h2>2. ALCANCE DE LA CESIÓN</h2>
  <div class="clause">
    <p><strong>${usageRightsLabels[data.usageRights]}</strong></p>
    ${data.usageRights !== 'perpetual' && data.usageRights !== 'organic_only'
      ? `<p>Vigencia: ${usageMonths[data.usageRights]} meses a partir de la fecha de firma.</p>`
      : ''}
    <p>La Marca podrá utilizar el contenido en sus redes sociales, sitio web, y materiales de marketing digital${
      data.usageRights !== 'organic_only' ? ', incluyendo pauta pagada en plataformas digitales' : ''
    }.</p>
  </div>

  <h2>3. CONTRAPRESTACIÓN</h2>
  <div class="clause">
    <p>Monto total: <span class="amount">${formatCOP(data.amount)}</span></p>
    <p>Comisión plataforma: ${formatCOP(data.platformFee)}</p>
    <p>Monto para el creador: <strong>${formatCOP(data.creatorAmount)}</strong></p>
    <p>Todos los montos + IVA (19%) cuando aplique.</p>
  </div>

  <h2>4. DERECHOS MORALES</h2>
  <div class="clause">
    <p>De conformidad con la Ley 23 de 1982, los derechos morales del creador son inalienables e irrenunciables. La Marca se compromete a dar crédito al creador cuando sea razonablemente posible.</p>
  </div>

  <h2>5. GARANTÍAS</h2>
  <div class="clause">
    <p>El Creador garantiza que: (a) es el autor original del contenido; (b) el contenido no infringe derechos de terceros; (c) no ha cedido previamente los mismos derechos a terceros.</p>
  </div>

  <h2>6. LEY APLICABLE</h2>
  <div class="clause">
    <p>Este contrato se rige por las leyes de la República de Colombia. Para la resolución de controversias, las partes acuerdan someterse a la jurisdicción de los tribunales de Bogotá, Colombia.</p>
  </div>

  <h2>7. PROTECCIÓN DE DATOS</h2>
  <div class="clause">
    <p>Las partes se comprometen a cumplir con la Ley 1581 de 2012 (Habeas Data) en el tratamiento de datos personales.</p>
  </div>

  <div class="signatures">
    <div class="signature-block">
      <p><strong>LA MARCA</strong></p>
      <p>${data.brandName}</p>
      <p id="brand-signature"></p>
    </div>
    <div class="signature-block">
      <p><strong>EL CREADOR</strong></p>
      <p>${data.creatorName}</p>
      <p id="creator-signature"></p>
    </div>
  </div>

  <div class="footer">
    <p>Documento generado electrónicamente por UGC Marketplace</p>
    <p>Válido como contrato electrónico según Ley 527 de 1999</p>
  </div>
</body>
</html>`;
}
