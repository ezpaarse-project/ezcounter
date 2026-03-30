import http from 'node:http';

import type { Logger } from '@ezcounter/logger';

let server: http.Server | null = null;

export type Route = (
  req: http.IncomingMessage,
  res: http.ServerResponse
) => void;

/**
 * Setup HTTP server
 *
 * @param port - Port to listen on
 * @param logger - Logger to use
 * @param routes - Routes to setup
 *
 * @returns Promise that resolves when the server is listening
 */
export function setupHTTPServer(
  port: number,
  logger: Logger,
  routes: Record<string, Route>
): Promise<http.Server> {
  const start = process.uptime();

  // oxlint-disable-next-line promise/avoid-new
  return new Promise<http.Server>((resolve) => {
    server = http.createServer((req, res) => {
      const route = routes[req.url ?? ''] ?? routes[`${req.url}/`];
      if (route == null) {
        // oxlint-disable-next-line no-magic-numbers
        res.writeHead(404).end();
      } else {
        route(req, res);
      }
    });

    server.listen(port, () => {
      logger.info({
        address: `http://0.0.0.0:${port}`,
        initDuration: process.uptime() - start,
        initDurationUnit: 's',
        msg: 'Service listening',
      });

      process.on('SIGTERM', () => {
        if (!server) {
          return;
        }

        // oxlint-disable-next-line promise/prefer-await-to-callbacks
        server.close((err) => {
          if (err) {
            logger.error({ err, msg: 'Failed to close service' });
            return;
          }

          logger.debug('Service closed');
        });
      });

      resolve(server!);
    });
  });
}
