CREATE TABLE IF NOT EXISTS report_requests (
  report_id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  source_type TEXT NOT NULL,
  selected_names_json TEXT NOT NULL,
  summary_json TEXT,
  full_report_json TEXT,
  report_status TEXT NOT NULL DEFAULT 'summary_ready',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_report_requests_session_id
  ON report_requests(session_id);

CREATE INDEX IF NOT EXISTS idx_report_requests_report_status
  ON report_requests(report_status);

CREATE INDEX IF NOT EXISTS idx_report_requests_created_at
  ON report_requests(created_at);

CREATE TABLE IF NOT EXISTS payment_orders (
  order_id TEXT PRIMARY KEY,
  report_id TEXT NOT NULL,
  provider TEXT NOT NULL,
  provider_checkout_id TEXT,
  provider_order_id TEXT,
  amount_cents INTEGER NOT NULL,
  currency TEXT NOT NULL,
  payment_status TEXT NOT NULL DEFAULT 'created',
  customer_email TEXT,
  raw_payload_json TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  paid_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_payment_orders_report_id
  ON payment_orders(report_id);

CREATE INDEX IF NOT EXISTS idx_payment_orders_payment_status
  ON payment_orders(payment_status);

CREATE INDEX IF NOT EXISTS idx_payment_orders_created_at
  ON payment_orders(created_at);

CREATE TABLE IF NOT EXISTS event_logs (
  event_id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  report_id TEXT,
  event_name TEXT NOT NULL,
  page TEXT,
  payload_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_event_logs_session_id
  ON event_logs(session_id);

CREATE INDEX IF NOT EXISTS idx_event_logs_report_id
  ON event_logs(report_id);

CREATE INDEX IF NOT EXISTS idx_event_logs_event_name
  ON event_logs(event_name);

CREATE INDEX IF NOT EXISTS idx_event_logs_created_at
  ON event_logs(created_at);
