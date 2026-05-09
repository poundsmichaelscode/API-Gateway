import cron from 'node-cron';
import { db } from '../config/database';
import { logger } from '../utils/logger';

export function startAnalyticsAggregationJob() {
  cron.schedule('*/1 * * * *', async () => {
    try {
      await db.query(`
        INSERT INTO analytics_rollups (bucket_minute, total_requests, avg_latency_ms, error_count)
        SELECT date_trunc('minute', created_at), COUNT(*), AVG(latency_ms), COUNT(*) FILTER (WHERE status_code >= 500)
        FROM request_analytics
        WHERE created_at >= NOW() - INTERVAL '2 minutes'
        GROUP BY 1
        ON CONFLICT (bucket_minute) DO UPDATE SET
          total_requests = EXCLUDED.total_requests,
          avg_latency_ms = EXCLUDED.avg_latency_ms,
          error_count = EXCLUDED.error_count
      `);
    } catch (error) {
      logger.warn({ error }, 'Analytics aggregation failed');
    }
  });
}
