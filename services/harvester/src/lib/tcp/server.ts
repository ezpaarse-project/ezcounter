import { type AddressInfo, type Server, createServer } from 'node:net';
import { networkInterfaces } from 'node:os';
import { PassThrough, type Readable } from 'node:stream';

import { appLogger } from '~/lib/logger';

const logger = appLogger.child({ scope: 'tcp' });

const RETRY_DELAY = 1000;
const DEFAULT_EXPIRATION = 10_000;
// The range 49152–65535 [...] contains dynamic or private ports that cannot be registered with IANA.
// https://en.wikipedia.org/wiki/List_of_TCP_and_UDP_port_numbers#Dynamic,_private_or_ephemeral_ports
const MIN_PORT = 49_152;
const MAX_PORT = 65_535;

/**
 * Get a random port withing the allowed range
 *
 * @returns The port
 */
const getRandomPort = (): number =>
  Math.round(Math.random() * (MAX_PORT - MIN_PORT) + MIN_PORT);

/**
 * Get the first available address
 *
 * @returns First available address
 */
const getHost = (): string | undefined =>
  Object.values(networkInterfaces())
    .flat()
    .find((int) => int && !int?.internal)?.address;

/**
 * Create a TCP server listening on first available IP address and a random port
 *
 * @param options - Various options to setup Server
 *
 * @returns The server
 */
// oxlint-disable-next-line max-lines-per-function
function createTCPServer(options: { expiration?: number }): Promise<Server> {
  const server = createServer({ allowHalfOpen: true });
  server.maxConnections = 1;

  let port = -1;
  const host = getHost();
  let tries = 0;

  const listen = (): void => {
    port = getRandomPort();
    server.close();
    server.listen(port, host);
    tries += 1;
  };

  // oxlint-disable-next-line promise/avoid-new
  return new Promise<Server>((resolve, reject) => {
    if (!host) {
      reject(new Error('Unable to find a valid IP address'));
      return;
    }

    server.on('error', (err) => {
      logger.error({
        err,
        msg: 'Unable to setup TCP server',
      });

      const canRetry =
        tries * RETRY_DELAY <= (options?.expiration || DEFAULT_EXPIRATION);

      // Try another port if address is already in use
      if (canRetry && 'code' in err && err.code === 'EADDRINUSE') {
        setTimeout(listen, RETRY_DELAY);
        return;
      }

      reject(err);
    });

    server.on('listening', () => {
      logger.info({
        host,
        msg: 'TCP server listening',
        port,
      });

      resolve(server);
    });

    listen();
  });
}

type TCPReceiver = {
  addr: AddressInfo;
  stream: Readable;
};

/**
 * Receive data through TCP by listening on a random port and the first available IP address
 *
 * @param reply - Optional response to send when client is done
 * @param options - Various options to setup Server
 * @param options.expiration - Time to setup Server, ignored once Server is listening
 *
 * @returns The address and the data stream
 */
export async function receiveThroughTCP(
  reply?: () => Promise<unknown>,
  options?: { expiration?: number }
): Promise<TCPReceiver> {
  const stream = new PassThrough();

  const server = await createTCPServer({ expiration: options?.expiration });

  const addr = server.address();
  if (!addr || typeof addr === 'string') {
    throw new Error('Unable to get server address');
  }

  server.on('connection', (socket) => {
    logger.debug({
      msg: 'Client connected, receiving data',
      port: addr.port,
    });

    socket.pipe(stream);
    socket.on('end', async () => {
      logger.debug({
        msg: 'Data received, sending back response',
        port: addr.port,
      });

      if (reply) {
        const data = Buffer.from(JSON.stringify(await reply()), 'utf8');
        socket.write(data, () => {
          socket.end();
        });
      }

      // If not awaiting reply, client will already close the connection
      server.close(() => {
        logger.info({
          msg: 'TCP server closed',
          port: addr.port,
        });
      });
    });
  });

  return { addr, stream };
}
