import { db } from '../config/database';

export async function persistRequestEvent(event: {
  requestId: string;
  correlationId: string;
  method: string;
  path: string;
  statusCode: number;
  latencyMs: number;
  userId?: string;
  ip?: string;
}) {
  await db.query(
    `INSERT INTO request_analytics
      (request_id, correlation_id, method, path, status_code, latency_ms, user_id, ip_address)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
    [event.requestId, event.correlationId, event.method, event.path, event.statusCode, event.latencyMs, event.userId || null, event.ip || null]
  );
}

export async function topEndpoints(limit = 10) {
  const result = await db.query(
    `SELECT path, COUNT(*)::int AS requests, AVG(latency_ms)::numeric(10,2) AS avg_latency_ms
     FROM request_analytics
     WHERE created_at > NOW() - INTERVAL '1 hour'
     GROUP BY path
     ORDER BY requests DESC
     LIMIT $1`,
    [limit]
  );
  return result.rows;
}
