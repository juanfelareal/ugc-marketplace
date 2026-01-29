import type { Campaign, CampaignApplication, Deliverable, Product, Profile } from './database';

export interface CampaignWithDetails extends Campaign {
  brand: Profile;
  products: Product[];
  applications: CampaignApplication[];
}

export interface CampaignFormData {
  title: string;
  description: string;
  product_ids: string[];
  objective: Campaign['objective'];
  content_type: Campaign['content_type'];
  pieces_per_creator: number;
  max_creators: number;
  budget_per_creator: number;
  usage_rights: Campaign['usage_rights'];
  delivery_deadline: string;
  brief: string;
  requirements: string;
  dos_and_donts: string;
  suggested_angles: Record<string, unknown> | null;
  preferred_niches: string[];
  preferred_gender: string | null;
  min_creator_level: Campaign['min_creator_level'];
}

export interface ApplicationWithDetails extends CampaignApplication {
  creator: Profile;
  campaign: Campaign;
  deliverables: Deliverable[];
}

export interface AIProductAnalysis {
  category: string;
  target_audience: string;
  key_benefits: string[];
  ugc_angles: string[];
  content_recommendations: string[];
}

export interface AICreativeAngles {
  angles: Array<{
    title: string;
    description: string;
    hook: string;
    format: string;
  }>;
}

export interface CreditPack {
  id: string;
  credits: number;
  price_cop: number;
  label: string;
  popular?: boolean;
}

export const CREDIT_PACKS: CreditPack[] = [
  { id: 'pack_10', credits: 10, price_cop: 15000, label: '10 créditos' },
  { id: 'pack_50', credits: 50, price_cop: 60000, label: '50 créditos', popular: true },
  { id: 'pack_100', credits: 100, price_cop: 100000, label: '100 créditos' },
  { id: 'pack_500', credits: 500, price_cop: 400000, label: '500 créditos' },
];

export const AI_COSTS = {
  analyze_product: 2,
  generate_angles: 5,
  generate_script: 10,
} as const;
