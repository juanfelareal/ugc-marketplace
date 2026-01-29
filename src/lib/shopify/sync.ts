import { createAdminClient } from '@/lib/supabase/admin';
import type { ShopifyProduct } from '@/types/shopify';
import { fetchShopifyProducts } from './client';

export async function syncProducts(storeId: string, brandId: string, shopDomain: string, accessToken: string) {
  const supabase = createAdminClient();

  // Update sync status
  await supabase.from('stores').update({ sync_status: 'syncing' }).eq('id', storeId);

  try {
    const products: ShopifyProduct[] = await fetchShopifyProducts(shopDomain, accessToken);

    for (const product of products) {
      const priceValues = product.variants.map((v) => parseFloat(v.price));
      const priceMin = Math.min(...priceValues);
      const priceMax = Math.max(...priceValues);
      const imageUrls = product.images.map((img) => img.src);
      const tags = product.tags ? product.tags.split(',').map((t) => t.trim()).filter(Boolean) : [];

      await supabase.from('products').upsert(
        {
          store_id: storeId,
          brand_id: brandId,
          shopify_product_id: String(product.id),
          title: product.title,
          description: product.body_html,
          price_min: priceMin,
          price_max: priceMax,
          image_urls: imageUrls,
          tags,
          product_type: product.product_type || null,
          vendor: product.vendor || null,
          status: product.status,
        },
        { onConflict: 'store_id,shopify_product_id' }
      );
    }

    await supabase.from('stores').update({
      sync_status: 'synced',
      last_synced_at: new Date().toISOString(),
      products_count: products.length,
    }).eq('id', storeId);

    return { success: true, count: products.length };
  } catch (error) {
    await supabase.from('stores').update({ sync_status: 'failed' }).eq('id', storeId);
    throw error;
  }
}
