-- ValidQR PostgreSQL Schema Initialization

CREATE TABLE IF NOT EXISTS merchants (
  id            SERIAL PRIMARY KEY,
  nmid          VARCHAR(20)    NOT NULL UNIQUE,
  name          VARCHAR(255)   NOT NULL,
  latitude      DECIMAL(10, 7) NOT NULL,
  longitude     DECIMAL(10, 7) NOT NULL,
  wa_number     VARCHAR(20),
  is_active     BOOLEAN        DEFAULT TRUE,
  created_at    TIMESTAMPTZ    DEFAULT NOW(),
  updated_at    TIMESTAMPTZ    DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_merchants_nmid ON merchants(nmid);

CREATE TABLE IF NOT EXISTS incident_logs (
  id              SERIAL PRIMARY KEY,
  nmid_scanned    VARCHAR(20)    NOT NULL,
  merchant_name   VARCHAR(255),
  status          VARCHAR(20)    NOT NULL,
  color           VARCHAR(10)    NOT NULL,
  reason          VARCHAR(50),
  fuzzy_score     INTEGER,
  latitude        DECIMAL(10, 7),
  longitude       DECIMAL(10, 7),
  distance_meters DECIMAL(10, 2),
  gps_available   BOOLEAN,
  raw_payload     TEXT,
  created_at      TIMESTAMPTZ    DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_incident_logs_status ON incident_logs(status);
CREATE INDEX IF NOT EXISTS idx_incident_logs_created_at ON incident_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_incident_logs_nmid ON incident_logs(nmid_scanned);
