import { deductCredits } from '@/lib/ai/credits';
import { aiModel } from '@/lib/ai/client';
import { ANALYZE_PRODUCT_PROMPT, fillPrompt } from '@/lib/ai/prompts';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { AI_COSTS } from '@/types/campaigns';
import { generateText } from 'ai';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { productId } = await request.json();
  if (!productId) return NextResponse.json({ error: 'Product ID required' }, { status: 400 });

  // Get product
  const { data: product } = await supabase
    .from('products')
    .select('*')
    .eq('id', productId)
    .eq('brand_id', user.id)
    .single();

  if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 });

  // Check if already analyzed (use cached result for free)
  if (product.ai_category) {
    return NextResponse.json({
      category: product.ai_category,
      target_audience: product.ai_target_audience,
      key_benefits: product.ai_key_benefits,
      cached: true,
    });
  }

  // Deduct credits
  const creditResult = await deductCredits(
    user.id,
    AI_COSTS.analyze_product,
    `Análisis AI de producto: ${product.title}`,
    productId,
    'product_analysis'
  );

  if (!creditResult.success) {
    return NextResponse.json({ error: 'Créditos insuficientes' }, { status: 402 });
  }

  try {
    const prompt = fillPrompt(ANALYZE_PRODUCT_PROMPT, {
      title: product.title,
      description: product.description || '',
      type: product.product_type || '',
      price: `${product.price_min}`,
      tags: product.tags.join(', '),
    });

    const { text } = await generateText({
      model: aiModel,
      prompt,
    });

    const analysis = JSON.parse(text);

    // Cache the analysis
    const admin = createAdminClient();
    await admin.from('products').update({
      ai_category: analysis.category,
      ai_target_audience: analysis.target_audience,
      ai_key_benefits: analysis.key_benefits,
      ai_analyzed_at: new Date().toISOString(),
    }).eq('id', productId);

    return NextResponse.json({
      ...analysis,
      credits_used: AI_COSTS.analyze_product,
      new_balance: creditResult.newBalance,
    });
  } catch (error) {
    return NextResponse.json({ error: 'AI analysis failed' }, { status: 500 });
  }
}
