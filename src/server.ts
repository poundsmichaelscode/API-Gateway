import http from 'http';
import { createApp } from './app';
import { env } from './config/env';
import { connectRedis, closeRedis } from './config/redis';
import { closeDatabase } from './config/database';
import { logger } from './utils/logger';
import { attachWebSocketGateway } from './websocket/wsGateway';
import { startAnalyticsAggregationJob } from './jobs/analyticsAggregationJob';

async function bootstrap() {
  await connectRedis();
  const app = createApp();
  const server = http.createServer(app);
  attachWebSocketGateway(server);
  startAnalyticsAggregationJob();

  server.listen(env.PORT, () => logger.info({ port: env.PORT }, 'API Gateway listening'));

  const shutdown = async (signal: string) => {
    logger.info({ signal }, 'Graceful shutdown started');
    server.close(async () => {
      await Promise.allSettled([closeRedis(), closeDatabase()]);
      logger.info('Graceful shutdown complete');
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10000).unref();
  };

  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));
}

void bootstrap().catch((error) => {
  logger.fatal({ error }, 'Failed to start gateway');
  process.exit(1);
});
