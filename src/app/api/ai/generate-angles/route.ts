import { deductCredits } from '@/lib/ai/credits';
import { aiModel } from '@/lib/ai/client';
import { GENERATE_ANGLES_PROMPT, fillPrompt } from '@/lib/ai/prompts';
import { createClient } from '@/lib/supabase/server';
import { AI_COSTS } from '@/types/campaigns';
import { generateText } from 'ai';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { productId, objective, contentType } = await request.json();

  const { data: product } = await supabase
    .from('products')
    .select('*')
    .eq('id', productId)
    .eq('brand_id', user.id)
    .single();

  if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 });

  // Deduct credits
  const creditResult = await deductCredits(
    user.id,
    AI_COSTS.generate_angles,
    `Generación de ángulos creativos: ${product.title}`,
    productId,
    'angle_generation'
  );

  if (!creditResult.success) {
    return NextResponse.json({ error: 'Créditos insuficientes' }, { status: 402 });
  }

  try {
    const prompt = fillPrompt(GENERATE_ANGLES_PROMPT, {
      product_title: product.title,
      product_description: product.description || '',
      objective: objective || 'ads',
      content_type: contentType || 'video',
      target_audience: product.ai_target_audience || 'general',
    });

    const { text } = await generateText({
      model: aiModel,
      prompt,
    });

    const result = JSON.parse(text);

    return NextResponse.json({
      ...result,
      credits_used: AI_COSTS.generate_angles,
      new_balance: creditResult.newBalance,
    });
  } catch (error) {
    return NextResponse.json({ error: 'AI generation failed' }, { status: 500 });
  }
}
