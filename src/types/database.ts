// ============================================================
// Database Types - UGC Marketplace
// ============================================================

// Enums
export type UserRole = 'brand' | 'creator' | 'admin';
export type CreatorLevel = 'starter' | 'pro' | 'elite';
export type StoreSyncStatus = 'pending' | 'syncing' | 'synced' | 'failed';
export type CreditTransactionType = 'purchase' | 'bonus' | 'usage' | 'refund' | 'signup_bonus';
export type CampaignObjective = 'ads' | 'organic' | 'testimonial' | 'ugc_influencer';
export type ContentType = 'video' | 'photo' | 'video_and_photo';
export type UsageRights = 'organic_only' | 'paid_ads_3m' | 'paid_ads_6m' | 'paid_ads_12m' | 'perpetual';
export type CampaignStatus = 'draft' | 'published' | 'in_progress' | 'completed' | 'cancelled';
export type ApplicationStatus = 'pending' | 'accepted' | 'rejected' | 'withdrawn';
export type DeliverableStatus = 'pending' | 'uploaded' | 'in_review' | 'changes_requested' | 'approved' | 'rejected';
export type EscrowStatus = 'pending_payment' | 'payment_processing' | 'funded' | 'release_pending' | 'released' | 'refunded' | 'disputed' | 'failed';
export type DisputeStatus = 'open' | 'under_review' | 'resolved_brand' | 'resolved_creator' | 'escalated';
export type NotificationType = 'campaign_application' | 'application_accepted' | 'application_rejected' | 'deliverable_uploaded' | 'deliverable_approved' | 'changes_requested' | 'payment_received' | 'payment_released' | 'message_received' | 'contract_ready';

// Table types
export interface Profile {
  id: string;
  email: string;
  role: UserRole;
  full_name: string;
  avatar_url: string | null;
  phone: string | null;
  country: string;
  city: string | null;
  onboarding_completed: boolean;
  // Creator fields
  creator_level: CreatorLevel | null;
  niche: string[] | null;
  gender: string | null;
  bio: string | null;
  portfolio_urls: string[] | null;
  instagram_handle: string | null;
  tiktok_handle: string | null;
  bank_name: string | null;
  bank_account_type: string | null;
  bank_account_number_encrypted: string | null;
  bank_document_type: string | null;
  bank_document_number_encrypted: string | null;
  total_completed_jobs: number;
  avg_rating: number;
  approval_rate: number;
  // Brand fields
  company_name: string | null;
  nit: string | null;
  industry: string | null;
  website: string | null;
  created_at: string;
  updated_at: string;
}

export interface Store {
  id: string;
  brand_id: string;
  shop_domain: string;
  shopify_access_token_encrypted: string;
  sync_status: StoreSyncStatus;
  last_synced_at: string | null;
  products_count: number;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  store_id: string;
  brand_id: string;
  shopify_product_id: string;
  title: string;
  description: string | null;
  price_min: number;
  price_max: number;
  image_urls: string[];
  tags: string[];
  product_type: string | null;
  vendor: string | null;
  status: string;
  ai_category: string | null;
  ai_target_audience: string | null;
  ai_key_benefits: string[] | null;
  ai_analyzed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreditBalance {
  id: string;
  user_id: string;
  balance: number;
  total_purchased: number;
  total_used: number;
  created_at: string;
  updated_at: string;
}

export interface CreditTransaction {
  id: string;
  user_id: string;
  type: CreditTransactionType;
  amount: number;
  balance_after: number;
  description: string;
  reference_id: string | null;
  reference_type: string | null;
  created_at: string;
}

export interface Campaign {
  id: string;
  brand_id: string;
  title: string;
  description: string;
  product_ids: string[];
  objective: CampaignObjective;
  content_type: ContentType;
  pieces_per_creator: number;
  max_creators: number;
  budget_per_creator: number;
  platform_fee_percent: number;
  usage_rights: UsageRights;
  delivery_deadline: string;
  brief: string | null;
  requirements: string | null;
  dos_and_donts: string | null;
  suggested_angles: Record<string, unknown> | null;
  preferred_niches: string[] | null;
  preferred_gender: string | null;
  min_creator_level: CreatorLevel;
  status: CampaignStatus;
  published_at: string | null;
  applications_count: number;
  accepted_creators_count: number;
  completed_deliverables_count: number;
  created_at: string;
  updated_at: string;
  // Joined
  brand?: Profile;
  products?: Product[];
}

export interface CampaignApplication {
  id: string;
  campaign_id: string;
  creator_id: string;
  pitch_message: string | null;
  status: ApplicationStatus;
  is_invitation: boolean;
  responded_at: string | null;
  created_at: string;
  updated_at: string;
  // Joined
  creator?: Profile;
  campaign?: Campaign;
}

export interface Deliverable {
  id: string;
  campaign_id: string;
  application_id: string;
  creator_id: string;
  brand_id: string;
  piece_number: number;
  file_path: string | null;
  file_type: string | null;
  file_size: number | null;
  thumbnail_path: string | null;
  status: DeliverableStatus;
  revision_count: number;
  max_revisions: number;
  brand_rating: number | null;
  brand_feedback: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
  // Joined
  versions?: DeliverableVersion[];
  comments?: ReviewComment[];
}

export interface DeliverableVersion {
  id: string;
  deliverable_id: string;
  version_number: number;
  file_path: string;
  file_type: string;
  file_size: number;
  thumbnail_path: string | null;
  notes: string | null;
  created_at: string;
}

export interface ReviewComment {
  id: string;
  deliverable_id: string;
  author_id: string;
  comment: string;
  timestamp_seconds: number | null;
  created_at: string;
  // Joined
  author?: Profile;
}

export interface EscrowTransaction {
  id: string;
  campaign_id: string;
  brand_id: string;
  creator_id: string | null;
  deliverable_id: string | null;
  gross_amount: number;
  platform_fee: number;
  creator_amount: number;
  currency: string;
  wompi_payment_id: string | null;
  wompi_payout_id: string | null;
  status: EscrowStatus;
  status_history: Record<string, unknown>[];
  funded_at: string | null;
  released_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Contract {
  id: string;
  campaign_id: string;
  deliverable_id: string;
  brand_id: string;
  creator_id: string;
  usage_rights: UsageRights;
  usage_months: number | null;
  contract_data: Record<string, unknown>;
  contract_hash: string;
  html_content: string;
  pdf_path: string | null;
  brand_signed_at: string | null;
  creator_signed_at: string | null;
  created_at: string;
}

export interface Message {
  id: string;
  campaign_id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
  // Joined
  sender?: Profile;
}

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  link: string | null;
  is_read: boolean;
  created_at: string;
}

export interface Dispute {
  id: string;
  campaign_id: string;
  deliverable_id: string;
  initiated_by: string;
  brand_id: string;
  creator_id: string;
  reason: string;
  status: DisputeStatus;
  resolution_notes: string | null;
  resolved_by: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface PlatformSettings {
  key: string;
  value: string;
  description: string | null;
  updated_at: string;
}

export interface PlatformLedger {
  id: string;
  type: string;
  amount: number;
  currency: string;
  reference_type: string;
  reference_id: string;
  description: string;
  created_at: string;
}
