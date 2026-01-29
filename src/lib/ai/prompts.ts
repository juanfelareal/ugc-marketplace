export const ANALYZE_PRODUCT_PROMPT = `Eres un experto en UGC (User Generated Content) y marketing digital para ecommerce en LATAM.

Analiza el siguiente producto y devuelve un JSON con:
- category: categoría del producto (1 palabra)
- target_audience: audiencia objetivo (1 frase corta)
- key_benefits: array de 3-5 beneficios clave del producto
- ugc_angles: array de 3-5 ángulos de contenido UGC recomendados
- content_recommendations: array de 3-5 recomendaciones específicas para el contenido

Producto:
Título: {title}
Descripción: {description}
Tipo: {type}
Precio: {price}
Tags: {tags}

Responde SOLO con JSON válido, sin markdown ni texto adicional.`;

export const GENERATE_ANGLES_PROMPT = `Eres un director creativo experto en UGC y contenido para redes sociales en LATAM.

Genera ángulos creativos para una campaña de contenido UGC con estas características:
- Producto: {product_title}
- Descripción: {product_description}
- Objetivo: {objective}
- Tipo de contenido: {content_type}
- Audiencia: {target_audience}

Para cada ángulo incluye:
- title: nombre del ángulo (corto, catchy)
- description: descripción de qué se trata (2-3 líneas)
- hook: el gancho inicial del video/contenido (la primera frase que engancha)
- format: formato recomendado (ej: "Unboxing", "Review honesta", "Get ready with me", "Tutorial", "Antes/después", etc.)

Genera 5 ángulos variados. Responde SOLO con JSON válido: { "angles": [...] }`;

export const GENERATE_SCRIPT_PROMPT = `Eres un guionista experto en contenido UGC viral para LATAM.

Escribe un guión completo para un video UGC con estas características:
- Producto: {product_title}
- Ángulo: {angle_title}
- Hook: {hook}
- Formato: {format}
- Duración objetivo: {duration} segundos
- Plataforma: {platform}

El guión debe incluir:
- Hook (primeros 3 segundos): la frase que detiene el scroll
- Desarrollo: el cuerpo del contenido
- CTA: llamada a la acción al final
- Notas de producción: indicaciones visuales para el creador

Usa un tono natural, colombiano, auténtico. No uses lenguaje corporativo.
Responde SOLO con JSON: { "hook": "...", "body": "...", "cta": "...", "production_notes": "...", "estimated_duration": number }`;

export function fillPrompt(template: string, vars: Record<string, string>): string {
  let result = template;
  for (const [key, value] of Object.entries(vars)) {
    result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), value || 'No disponible');
  }
  return result;
}
