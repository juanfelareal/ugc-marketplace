-- ============================================================
-- UGC Marketplace - Initial Schema
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- ENUMS
-- ============================================================

CREATE TYPE user_role AS ENUM ('brand', 'creator', 'admin');
CREATE TYPE creator_level AS ENUM ('starter', 'pro', 'elite');
CREATE TYPE store_sync_status AS ENUM ('pending', 'syncing', 'synced', 'failed');
CREATE TYPE credit_transaction_type AS ENUM ('purchase', 'bonus', 'usage', 'refund', 'signup_bonus');
CREATE TYPE campaign_objective AS ENUM ('ads', 'organic', 'testimonial', 'ugc_influencer');
CREATE TYPE content_type AS ENUM ('video', 'photo', 'video_and_photo');
CREATE TYPE usage_rights AS ENUM ('organic_only', 'paid_ads_3m', 'paid_ads_6m', 'paid_ads_12m', 'perpetual');
CREATE TYPE campaign_status AS ENUM ('draft', 'published', 'in_progress', 'completed', 'cancelled');
CREATE TYPE application_status AS ENUM ('pending', 'accepted', 'rejected', 'withdrawn');
CREATE TYPE deliverable_status AS ENUM ('pending', 'uploaded', 'in_review', 'changes_requested', 'approved', 'rejected');
CREATE TYPE escrow_status AS ENUM ('pending_payment', 'payment_processing', 'funded', 'release_pending', 'released', 'refunded', 'disputed', 'failed');
CREATE TYPE dispute_status AS ENUM ('open', 'under_review', 'resolved_brand', 'resolved_creator', 'escalated');
CREATE TYPE notification_type AS ENUM (
  'campaign_application', 'application_accepted', 'application_rejected',
  'deliverable_uploaded', 'deliverable_approved', 'changes_requested',
  'payment_received', 'payment_released', 'message_received', 'contract_ready'
);

-- ============================================================
-- TABLES
-- ============================================================

-- Profiles (extends auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role user_role NOT NULL,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  phone TEXT,
  country TEXT NOT NULL DEFAULT 'CO',
  city TEXT,
  onboarding_completed BOOLEAN NOT NULL DEFAULT FALSE,
  -- Creator fields
  creator_level creator_level DEFAULT 'starter',
  niche TEXT[],
  gender TEXT,
  bio TEXT,
  portfolio_urls TEXT[],
  instagram_handle TEXT,
  tiktok_handle TEXT,
  bank_name TEXT,
  bank_account_type TEXT,
  bank_account_number_encrypted TEXT,
  bank_document_type TEXT,
  bank_document_number_encrypted TEXT,
  total_completed_jobs INTEGER NOT NULL DEFAULT 0,
  avg_rating NUMERIC(3,2) NOT NULL DEFAULT 0,
  approval_rate NUMERIC(5,2) NOT NULL DEFAULT 0,
  -- Brand fields
  company_name TEXT,
  nit TEXT,
  industry TEXT,
  website TEXT,
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Stores (Shopify connections)
CREATE TABLE stores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  shop_domain TEXT NOT NULL UNIQUE,
  shopify_access_token_encrypted TEXT NOT NULL,
  sync_status store_sync_status NOT NULL DEFAULT 'pending',
  last_synced_at TIMESTAMPTZ,
  products_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Products
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  brand_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  shopify_product_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  price_min NUMERIC(12,2) NOT NULL DEFAULT 0,
  price_max NUMERIC(12,2) NOT NULL DEFAULT 0,
  image_urls TEXT[] NOT NULL DEFAULT '{}',
  tags TEXT[] NOT NULL DEFAULT '{}',
  product_type TEXT,
  vendor TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  -- AI analysis cache
  ai_category TEXT,
  ai_target_audience TEXT,
  ai_key_benefits TEXT[],
  ai_analyzed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(store_id, shopify_product_id)
);

-- Credit Balances
CREATE TABLE credit_balances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  balance INTEGER NOT NULL DEFAULT 0 CHECK (balance >= 0),
  total_purchased INTEGER NOT NULL DEFAULT 0,
  total_used INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Credit Transactions
CREATE TABLE credit_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type credit_transaction_type NOT NULL,
  amount INTEGER NOT NULL,
  balance_after INTEGER NOT NULL,
  description TEXT NOT NULL,
  reference_id TEXT,
  reference_type TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Campaigns
CREATE TABLE campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  product_ids UUID[] NOT NULL DEFAULT '{}',
  objective campaign_objective NOT NULL,
  content_type content_type NOT NULL,
  pieces_per_creator INTEGER NOT NULL DEFAULT 1,
  max_creators INTEGER NOT NULL DEFAULT 1,
  budget_per_creator NUMERIC(12,2) NOT NULL,
  platform_fee_percent NUMERIC(5,2) NOT NULL DEFAULT 15.00,
  usage_rights usage_rights NOT NULL DEFAULT 'organic_only',
  delivery_deadline TIMESTAMPTZ NOT NULL,
  brief TEXT,
  requirements TEXT,
  dos_and_donts TEXT,
  suggested_angles JSONB,
  preferred_niches TEXT[],
  preferred_gender TEXT,
  min_creator_level creator_level NOT NULL DEFAULT 'starter',
  status campaign_status NOT NULL DEFAULT 'draft',
  published_at TIMESTAMPTZ,
  -- Denormalized counts
  applications_count INTEGER NOT NULL DEFAULT 0,
  accepted_creators_count INTEGER NOT NULL DEFAULT 0,
  completed_deliverables_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Campaign Applications
CREATE TABLE campaign_applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  pitch_message TEXT,
  status application_status NOT NULL DEFAULT 'pending',
  is_invitation BOOLEAN NOT NULL DEFAULT FALSE,
  responded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(campaign_id, creator_id)
);

-- Deliverables
CREATE TABLE deliverables (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  application_id UUID NOT NULL REFERENCES campaign_applications(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  brand_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  piece_number INTEGER NOT NULL DEFAULT 1,
  file_path TEXT,
  file_type TEXT,
  file_size BIGINT,
  thumbnail_path TEXT,
  status deliverable_status NOT NULL DEFAULT 'pending',
  revision_count INTEGER NOT NULL DEFAULT 0,
  max_revisions INTEGER NOT NULL DEFAULT 3,
  brand_rating NUMERIC(3,2),
  brand_feedback TEXT,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Deliverable Versions
CREATE TABLE deliverable_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  deliverable_id UUID NOT NULL REFERENCES deliverables(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  thumbnail_path TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(deliverable_id, version_number)
);

-- Review Comments
CREATE TABLE review_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  deliverable_id UUID NOT NULL REFERENCES deliverables(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  comment TEXT NOT NULL,
  timestamp_seconds NUMERIC(10,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Escrow Transactions
CREATE TABLE escrow_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  brand_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  creator_id UUID REFERENCES profiles(id),
  deliverable_id UUID REFERENCES deliverables(id),
  gross_amount NUMERIC(12,2) NOT NULL,
  platform_fee NUMERIC(12,2) NOT NULL,
  creator_amount NUMERIC(12,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'COP',
  wompi_payment_id TEXT,
  wompi_payout_id TEXT,
  status escrow_status NOT NULL DEFAULT 'pending_payment',
  status_history JSONB NOT NULL DEFAULT '[]',
  funded_at TIMESTAMPTZ,
  released_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Contracts
CREATE TABLE contracts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  deliverable_id UUID NOT NULL REFERENCES deliverables(id) ON DELETE CASCADE,
  brand_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  usage_rights usage_rights NOT NULL,
  usage_months INTEGER,
  contract_data JSONB NOT NULL DEFAULT '{}',
  contract_hash TEXT NOT NULL,
  html_content TEXT NOT NULL,
  pdf_path TEXT,
  brand_signed_at TIMESTAMPTZ,
  creator_signed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Messages
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Notifications
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type notification_type NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Disputes
CREATE TABLE disputes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  deliverable_id UUID NOT NULL REFERENCES deliverables(id) ON DELETE CASCADE,
  initiated_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  brand_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  status dispute_status NOT NULL DEFAULT 'open',
  resolution_notes TEXT,
  resolved_by UUID REFERENCES profiles(id),
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Platform Settings
CREATE TABLE platform_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Platform Ledger
CREATE TABLE platform_ledger (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type TEXT NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'COP',
  reference_type TEXT NOT NULL,
  reference_id TEXT NOT NULL,
  description TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_creator_level ON profiles(creator_level) WHERE role = 'creator';
CREATE INDEX idx_stores_brand_id ON stores(brand_id);
CREATE INDEX idx_products_brand_id ON products(brand_id);
CREATE INDEX idx_products_store_id ON products(store_id);
CREATE INDEX idx_credit_transactions_user_id ON credit_transactions(user_id);
CREATE INDEX idx_campaigns_brand_id ON campaigns(brand_id);
CREATE INDEX idx_campaigns_status ON campaigns(status);
CREATE INDEX idx_campaigns_published ON campaigns(status, published_at) WHERE status = 'published';
CREATE INDEX idx_applications_campaign ON campaign_applications(campaign_id);
CREATE INDEX idx_applications_creator ON campaign_applications(creator_id);
CREATE INDEX idx_deliverables_campaign ON deliverables(campaign_id);
CREATE INDEX idx_deliverables_creator ON deliverables(creator_id);
CREATE INDEX idx_deliverables_status ON deliverables(status);
CREATE INDEX idx_escrow_campaign ON escrow_transactions(campaign_id);
CREATE INDEX idx_escrow_status ON escrow_transactions(status);
CREATE INDEX idx_messages_campaign ON messages(campaign_id);
CREATE INDEX idx_messages_receiver ON messages(receiver_id, is_read);
CREATE INDEX idx_notifications_user ON notifications(user_id, is_read);

-- ============================================================
-- FUNCTIONS
-- ============================================================

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Atomic credit deduction
CREATE OR REPLACE FUNCTION deduct_credits(
  p_user_id UUID,
  p_amount INTEGER,
  p_description TEXT,
  p_reference_id TEXT DEFAULT NULL,
  p_reference_type TEXT DEFAULT NULL
) RETURNS TABLE(success BOOLEAN, new_balance INTEGER, transaction_id UUID) AS $$
DECLARE
  v_current_balance INTEGER;
  v_new_balance INTEGER;
  v_transaction_id UUID;
BEGIN
  -- Lock the row for update
  SELECT balance INTO v_current_balance
  FROM credit_balances
  WHERE user_id = p_user_id
  FOR UPDATE;

  IF v_current_balance IS NULL OR v_current_balance < p_amount THEN
    RETURN QUERY SELECT FALSE, COALESCE(v_current_balance, 0), NULL::UUID;
    RETURN;
  END IF;

  v_new_balance := v_current_balance - p_amount;

  UPDATE credit_balances
  SET balance = v_new_balance,
      total_used = total_used + p_amount,
      updated_at = NOW()
  WHERE user_id = p_user_id;

  INSERT INTO credit_transactions (user_id, type, amount, balance_after, description, reference_id, reference_type)
  VALUES (p_user_id, 'usage', -p_amount, v_new_balance, p_description, p_reference_id, p_reference_type)
  RETURNING id INTO v_transaction_id;

  RETURN QUERY SELECT TRUE, v_new_balance, v_transaction_id;
END;
$$ LANGUAGE plpgsql;

-- Add credits (for purchases and bonuses)
CREATE OR REPLACE FUNCTION add_credits(
  p_user_id UUID,
  p_amount INTEGER,
  p_type credit_transaction_type,
  p_description TEXT,
  p_reference_id TEXT DEFAULT NULL,
  p_reference_type TEXT DEFAULT NULL
) RETURNS TABLE(new_balance INTEGER, transaction_id UUID) AS $$
DECLARE
  v_new_balance INTEGER;
  v_transaction_id UUID;
BEGIN
  INSERT INTO credit_balances (user_id, balance, total_purchased)
  VALUES (p_user_id, p_amount, CASE WHEN p_type = 'purchase' THEN p_amount ELSE 0 END)
  ON CONFLICT (user_id) DO UPDATE SET
    balance = credit_balances.balance + p_amount,
    total_purchased = credit_balances.total_purchased + CASE WHEN p_type = 'purchase' THEN p_amount ELSE 0 END,
    updated_at = NOW()
  RETURNING balance INTO v_new_balance;

  INSERT INTO credit_transactions (user_id, type, amount, balance_after, description, reference_id, reference_type)
  VALUES (p_user_id, p_type, p_amount, v_new_balance, p_description, p_reference_id, p_reference_type)
  RETURNING id INTO v_transaction_id;

  RETURN QUERY SELECT v_new_balance, v_transaction_id;
END;
$$ LANGUAGE plpgsql;

-- Give signup credits trigger function
CREATE OR REPLACE FUNCTION give_signup_credits()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role = 'brand' THEN
    PERFORM add_credits(NEW.id, 50, 'signup_bonus', 'Créditos de bienvenida');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Update creator level based on metrics
CREATE OR REPLACE FUNCTION update_creator_level()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role = 'creator' THEN
    IF NEW.total_completed_jobs >= 20 AND NEW.avg_rating >= 4.5 AND NEW.approval_rate >= 90 THEN
      NEW.creator_level := 'elite';
    ELSIF NEW.total_completed_jobs >= 5 AND NEW.avg_rating >= 4.0 AND NEW.approval_rate >= 75 THEN
      NEW.creator_level := 'pro';
    ELSE
      NEW.creator_level := 'starter';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Update creator metrics on deliverable approval
CREATE OR REPLACE FUNCTION update_creator_metrics_on_approval()
RETURNS TRIGGER AS $$
DECLARE
  v_creator_id UUID;
  v_completed INTEGER;
  v_avg_rating NUMERIC;
  v_approval_rate NUMERIC;
BEGIN
  IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
    v_creator_id := NEW.creator_id;

    SELECT COUNT(*) INTO v_completed
    FROM deliverables WHERE creator_id = v_creator_id AND status = 'approved';

    SELECT COALESCE(AVG(brand_rating), 0) INTO v_avg_rating
    FROM deliverables WHERE creator_id = v_creator_id AND status = 'approved' AND brand_rating IS NOT NULL;

    SELECT CASE WHEN COUNT(*) > 0
      THEN (COUNT(*) FILTER (WHERE status = 'approved')::NUMERIC / COUNT(*)::NUMERIC * 100)
      ELSE 0 END INTO v_approval_rate
    FROM deliverables WHERE creator_id = v_creator_id AND status IN ('approved', 'rejected');

    UPDATE profiles SET
      total_completed_jobs = v_completed,
      avg_rating = v_avg_rating,
      approval_rate = v_approval_rate
    WHERE id = v_creator_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Update campaign application count
CREATE OR REPLACE FUNCTION update_campaign_application_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE campaigns SET applications_count = applications_count + 1 WHERE id = NEW.campaign_id;
  END IF;
  IF TG_OP = 'UPDATE' AND NEW.status = 'accepted' AND OLD.status != 'accepted' THEN
    UPDATE campaigns SET accepted_creators_count = accepted_creators_count + 1 WHERE id = NEW.campaign_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- TRIGGERS
-- ============================================================

-- updated_at triggers
CREATE TRIGGER set_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON stores FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON credit_balances FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON campaigns FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON campaign_applications FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON deliverables FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON escrow_transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON disputes FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Business logic triggers
CREATE TRIGGER on_profile_created AFTER INSERT ON profiles FOR EACH ROW EXECUTE FUNCTION give_signup_credits();
CREATE TRIGGER on_profile_metrics_change BEFORE UPDATE OF total_completed_jobs, avg_rating, approval_rate ON profiles FOR EACH ROW EXECUTE FUNCTION update_creator_level();
CREATE TRIGGER on_deliverable_approved AFTER UPDATE OF status ON deliverables FOR EACH ROW EXECUTE FUNCTION update_creator_metrics_on_approval();
CREATE TRIGGER on_application_change AFTER INSERT OR UPDATE OF status ON campaign_applications FOR EACH ROW EXECUTE FUNCTION update_campaign_application_count();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE deliverables ENABLE ROW LEVEL SECURITY;
ALTER TABLE deliverable_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE escrow_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_ledger ENABLE ROW LEVEL SECURITY;

-- Profiles: users can read any profile, update own
CREATE POLICY profiles_select ON profiles FOR SELECT USING (true);
CREATE POLICY profiles_update ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY profiles_insert ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Stores: brand sees own
CREATE POLICY stores_select ON stores FOR SELECT USING (brand_id = auth.uid());
CREATE POLICY stores_insert ON stores FOR INSERT WITH CHECK (brand_id = auth.uid());
CREATE POLICY stores_update ON stores FOR UPDATE USING (brand_id = auth.uid());
CREATE POLICY stores_delete ON stores FOR DELETE USING (brand_id = auth.uid());

-- Products: brand sees own, creators see all active
CREATE POLICY products_brand ON products FOR ALL USING (brand_id = auth.uid());
CREATE POLICY products_creator_read ON products FOR SELECT USING (status = 'active');

-- Credit balances: own only
CREATE POLICY credits_select ON credit_balances FOR SELECT USING (user_id = auth.uid());
CREATE POLICY credits_transactions_select ON credit_transactions FOR SELECT USING (user_id = auth.uid());

-- Campaigns: brands see own, creators see published
CREATE POLICY campaigns_brand ON campaigns FOR ALL USING (brand_id = auth.uid());
CREATE POLICY campaigns_published ON campaigns FOR SELECT USING (status IN ('published', 'in_progress'));

-- Applications: creator sees own, brand sees campaign's
CREATE POLICY applications_creator ON campaign_applications FOR ALL USING (creator_id = auth.uid());
CREATE POLICY applications_brand ON campaign_applications FOR SELECT USING (
  campaign_id IN (SELECT id FROM campaigns WHERE brand_id = auth.uid())
);
CREATE POLICY applications_brand_update ON campaign_applications FOR UPDATE USING (
  campaign_id IN (SELECT id FROM campaigns WHERE brand_id = auth.uid())
);

-- Deliverables: creator and brand see own
CREATE POLICY deliverables_creator ON deliverables FOR ALL USING (creator_id = auth.uid());
CREATE POLICY deliverables_brand ON deliverables FOR SELECT USING (brand_id = auth.uid());
CREATE POLICY deliverables_brand_update ON deliverables FOR UPDATE USING (brand_id = auth.uid());

-- Deliverable versions: same as deliverables
CREATE POLICY versions_access ON deliverable_versions FOR SELECT USING (
  deliverable_id IN (SELECT id FROM deliverables WHERE creator_id = auth.uid() OR brand_id = auth.uid())
);
CREATE POLICY versions_insert ON deliverable_versions FOR INSERT WITH CHECK (
  deliverable_id IN (SELECT id FROM deliverables WHERE creator_id = auth.uid())
);

-- Review comments: participants can read and write
CREATE POLICY comments_read ON review_comments FOR SELECT USING (
  deliverable_id IN (SELECT id FROM deliverables WHERE creator_id = auth.uid() OR brand_id = auth.uid())
);
CREATE POLICY comments_insert ON review_comments FOR INSERT WITH CHECK (author_id = auth.uid());

-- Escrow: brand and creator see own
CREATE POLICY escrow_brand ON escrow_transactions FOR SELECT USING (brand_id = auth.uid());
CREATE POLICY escrow_creator ON escrow_transactions FOR SELECT USING (creator_id = auth.uid());

-- Contracts: brand and creator see own
CREATE POLICY contracts_brand ON contracts FOR SELECT USING (brand_id = auth.uid());
CREATE POLICY contracts_creator ON contracts FOR SELECT USING (creator_id = auth.uid());
CREATE POLICY contracts_update ON contracts FOR UPDATE USING (brand_id = auth.uid() OR creator_id = auth.uid());

-- Messages: sender or receiver
CREATE POLICY messages_access ON messages FOR SELECT USING (sender_id = auth.uid() OR receiver_id = auth.uid());
CREATE POLICY messages_insert ON messages FOR INSERT WITH CHECK (sender_id = auth.uid());
CREATE POLICY messages_update ON messages FOR UPDATE USING (receiver_id = auth.uid());

-- Notifications: own only
CREATE POLICY notifications_select ON notifications FOR SELECT USING (user_id = auth.uid());
CREATE POLICY notifications_update ON notifications FOR UPDATE USING (user_id = auth.uid());

-- Disputes: participants only
CREATE POLICY disputes_access ON disputes FOR SELECT USING (brand_id = auth.uid() OR creator_id = auth.uid());
CREATE POLICY disputes_insert ON disputes FOR INSERT WITH CHECK (initiated_by = auth.uid());

-- Platform settings: read by all authenticated
CREATE POLICY settings_read ON platform_settings FOR SELECT USING (auth.role() = 'authenticated');

-- Platform ledger: admin only (via service role)
CREATE POLICY ledger_admin ON platform_ledger FOR ALL USING (false);

-- ============================================================
-- INITIAL DATA
-- ============================================================

INSERT INTO platform_settings (key, value, description) VALUES
  ('platform_fee_percent', '15', 'Porcentaje de comisión de la plataforma'),
  ('max_file_size_mb', '500', 'Tamaño máximo de archivo en MB'),
  ('max_revisions', '3', 'Número máximo de revisiones por entregable'),
  ('signup_credits_brand', '50', 'Créditos de bienvenida para marcas'),
  ('iva_percent', '19', 'Porcentaje de IVA Colombia');
