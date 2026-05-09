import type { Server } from 'http';
import { WebSocketServer } from 'ws';
import { randomUUID } from 'crypto';
import { logger } from '../utils/logger';

export function attachWebSocketGateway(server: Server) {
  const wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (socket, req) => {
    const correlationId = req.headers['x-correlation-id'] || randomUUID();
    logger.info({ correlationId }, 'WebSocket connected');
    socket.send(JSON.stringify({ type: 'connected', correlationId }));
    socket.on('message', (message) => {
      socket.send(JSON.stringify({ type: 'echo', message: message.toString(), correlationId }));
    });
  });

  return wss;
}
