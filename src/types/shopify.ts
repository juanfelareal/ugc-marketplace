export interface ShopifyProduct {
  id: number;
  title: string;
  body_html: string | null;
  vendor: string;
  product_type: string;
  tags: string;
  status: string;
  variants: ShopifyVariant[];
  images: ShopifyImage[];
}

export interface ShopifyVariant {
  id: number;
  title: string;
  price: string;
  compare_at_price: string | null;
  sku: string | null;
}

export interface ShopifyImage {
  id: number;
  src: string;
  alt: string | null;
  position: number;
}

export interface ShopifyOAuthResponse {
  access_token: string;
  scope: string;
}
