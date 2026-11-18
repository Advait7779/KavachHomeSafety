CREATE TABLE IF NOT EXISTS admin_users (
  id BIGSERIAL PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS admin_sessions (
  token_hash TEXT PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  csrf_token TEXT NOT NULL,
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL
);
ALTER TABLE admin_sessions ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now();

CREATE TABLE IF NOT EXISTS admin_events (
  id BIGSERIAL PRIMARY KEY,
  admin_user_id BIGINT NOT NULL REFERENCES admin_users(id),
  action TEXT NOT NULL,
  record_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS admin_events_created_idx ON admin_events (created_at DESC);

CREATE TABLE IF NOT EXISTS leads (
  id BIGSERIAL PRIMARY KEY,
  submission_key UUID UNIQUE,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  service TEXT NOT NULL,
  message TEXT NOT NULL DEFAULT '',
  source TEXT NOT NULL DEFAULT 'website',
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new','contacted','survey_scheduled','quoted','won','lost')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS leads_created_idx ON leads (created_at DESC);
CREATE INDEX IF NOT EXISTS leads_status_idx ON leads (status);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS lead_notes (
  id BIGSERIAL PRIMARY KEY,
  lead_id BIGINT NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  admin_user_id BIGINT NOT NULL REFERENCES admin_users(id),
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS site_content (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  published JSONB NOT NULL,
  draft JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS site_revisions (
  id BIGSERIAL PRIMARY KEY,
  content JSONB NOT NULL,
  published_by BIGINT REFERENCES admin_users(id),
  published_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS media_assets (
  id BIGSERIAL PRIMARY KEY,
  storage_key TEXT NOT NULL UNIQUE,
  original_name TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  alt_text TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE SEQUENCE IF NOT EXISTS bill_number_seq START 1;
CREATE TABLE IF NOT EXISTS bills (
  id BIGSERIAL PRIMARY KEY,
  bill_number TEXT UNIQUE,
  source_estimate_id BIGINT REFERENCES bills(id),
  lead_id BIGINT REFERENCES leads(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','issued','paid','void')),
  customer JSONB NOT NULL,
  business JSONB NOT NULL,
  estimate JSONB NOT NULL DEFAULT '{}'::jsonb,
  draft_data JSONB,
  issue_date DATE,
  due_date DATE,
  notes TEXT NOT NULL DEFAULT '',
  subtotal NUMERIC(12,2) NOT NULL DEFAULT 0,
  discount NUMERIC(12,2) NOT NULL DEFAULT 0,
  tax_total NUMERIC(12,2) NOT NULL DEFAULT 0,
  total NUMERIC(12,2) NOT NULL DEFAULT 0,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS bills_created_idx ON bills (created_at DESC);
CREATE INDEX IF NOT EXISTS bills_status_idx ON bills (status);
ALTER TABLE bills ADD COLUMN IF NOT EXISTS estimate JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE bills ADD COLUMN IF NOT EXISTS source_estimate_id BIGINT REFERENCES bills(id);
ALTER TABLE bills ADD COLUMN IF NOT EXISTS draft_data JSONB;
ALTER TABLE bills ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
CREATE UNIQUE INDEX IF NOT EXISTS bills_active_source_estimate_idx ON bills (source_estimate_id) WHERE source_estimate_id IS NOT NULL AND deleted_at IS NULL;
CREATE TABLE IF NOT EXISTS bill_items (
  id BIGSERIAL PRIMARY KEY,
  bill_id BIGINT NOT NULL REFERENCES bills(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  item_code TEXT NOT NULL DEFAULT '',
  quantity NUMERIC(12,2) NOT NULL,
  unit TEXT NOT NULL,
  unit_price NUMERIC(12,2) NOT NULL,
  tax_rate NUMERIC(5,2) NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL
);
ALTER TABLE bill_items ADD COLUMN IF NOT EXISTS item_code TEXT NOT NULL DEFAULT '';
CREATE TABLE IF NOT EXISTS bill_events (
  id BIGSERIAL PRIMARY KEY,
  bill_id BIGINT NOT NULL REFERENCES bills(id) ON DELETE CASCADE,
  admin_user_id BIGINT NOT NULL REFERENCES admin_users(id),
  action TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS estimates (
  id BIGSERIAL PRIMARY KEY,
  lead_id BIGINT REFERENCES leads(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','issued','paid','void')),
  customer JSONB NOT NULL,
  business JSONB NOT NULL,
  estimate JSONB NOT NULL DEFAULT '{}'::jsonb,
  draft_data JSONB,
  issue_date DATE,
  due_date DATE,
  notes TEXT NOT NULL DEFAULT '',
  subtotal NUMERIC(12,2) NOT NULL DEFAULT 0,
  discount NUMERIC(12,2) NOT NULL DEFAULT 0,
  tax_total NUMERIC(12,2) NOT NULL DEFAULT 0,
  total NUMERIC(12,2) NOT NULL DEFAULT 0,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS estimates_created_idx ON estimates (created_at DESC);
CREATE INDEX IF NOT EXISTS estimates_status_idx ON estimates (status);
CREATE TABLE IF NOT EXISTS estimate_items (
  id BIGSERIAL PRIMARY KEY,
  estimate_id BIGINT NOT NULL REFERENCES estimates(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  item_code TEXT NOT NULL DEFAULT '',
  quantity NUMERIC(12,2) NOT NULL,
  unit TEXT NOT NULL,
  unit_price NUMERIC(12,2) NOT NULL,
  tax_rate NUMERIC(5,2) NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS estimate_events (
  id BIGSERIAL PRIMARY KEY,
  estimate_id BIGINT NOT NULL REFERENCES estimates(id) ON DELETE CASCADE,
  admin_user_id BIGINT NOT NULL REFERENCES admin_users(id),
  action TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Move documents created before Estimates and Bills had separate storage.
INSERT INTO estimates (id, lead_id, status, customer, business, estimate, draft_data, issue_date, due_date, notes, subtotal, discount, tax_total, total, deleted_at, created_at, updated_at)
SELECT id, lead_id, status, customer, business, estimate, draft_data, issue_date, due_date, notes, subtotal, discount, tax_total, total, deleted_at, created_at, updated_at
FROM bills WHERE estimate->>'type' = 'estimate' ON CONFLICT (id) DO NOTHING;
INSERT INTO estimate_items (estimate_id, description, item_code, quantity, unit, unit_price, tax_rate, sort_order)
SELECT b.id, i.description, i.item_code, i.quantity, i.unit, i.unit_price, i.tax_rate, i.sort_order
FROM bill_items i JOIN bills b ON b.id = i.bill_id WHERE b.estimate->>'type' = 'estimate';
INSERT INTO estimate_events (estimate_id, admin_user_id, action, created_at)
SELECT b.id, e.admin_user_id, e.action, e.created_at
FROM bill_events e JOIN bills b ON b.id = e.bill_id WHERE b.estimate->>'type' = 'estimate';
SELECT setval(pg_get_serial_sequence('estimates', 'id'), GREATEST((SELECT coalesce(max(id), 0) FROM estimates), 1), (SELECT count(*) > 0 FROM estimates));
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'bills_source_estimate_id_fkey'
      AND conrelid = 'bills'::regclass
      AND confrelid = 'bills'::regclass
  ) THEN
    ALTER TABLE bills DROP CONSTRAINT bills_source_estimate_id_fkey;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'bills_source_estimate_id_fkey'
      AND conrelid = 'bills'::regclass
  ) THEN
    ALTER TABLE bills ADD CONSTRAINT bills_source_estimate_id_fkey
      FOREIGN KEY (source_estimate_id) REFERENCES estimates(id);
  END IF;
END $$;
DELETE FROM bills WHERE estimate->>'type' = 'estimate';
