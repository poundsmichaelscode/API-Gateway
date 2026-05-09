import { db, closeDatabase } from '../src/config/database';

async function migrate() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS request_analytics (
      id BIGSERIAL PRIMARY KEY,
      request_id TEXT NOT NULL,
      correlation_id TEXT NOT NULL,
      method TEXT NOT NULL,
      path TEXT NOT NULL,
      status_code INT NOT NULL,
      latency_ms NUMERIC(12, 3) NOT NULL,
      user_id TEXT,
      ip_address TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_request_analytics_created_at ON request_analytics(created_at);
    CREATE INDEX IF NOT EXISTS idx_request_analytics_path ON request_analytics(path);

    CREATE TABLE IF NOT EXISTS analytics_rollups (
      bucket_minute TIMESTAMPTZ PRIMARY KEY,
      total_requests BIGINT NOT NULL,
      avg_latency_ms NUMERIC(12, 3),
      error_count BIGINT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
  await closeDatabase();
}

void migrate();
