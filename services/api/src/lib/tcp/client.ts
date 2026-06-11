import type { Readable } from 'node:stream';
import { Socket } from 'node:net';

import { appLogger } from '~/lib/logger';

const logger = appLogger.child({ scope: 'tcp' });

/**
 * Upload data through TCP by connecting to a TCP receiver
 *
 * @param stream - The stream to upload
 * @param remote - The TCP receiver to upload to
 * @param options - Various options to setup Socket
 *
 * @returns A promise that resolves to the data received from the TCP receiver (if any)
 */
export function uploadThroughTCP(
  stream: Readable,
  remote: { host: string; port: number },
  options?: { allowHalfOpen?: boolean }
): Promise<Buffer> {
  const socket = new Socket({ allowHalfOpen: options?.allowHalfOpen });

  let buf = Buffer.alloc(0);
  socket.on('data', (msg) => {
    buf = Buffer.concat([buf, msg]);
  });

  socket.on('connect', () => {
    logger.debug({ msg: 'Connected to remote socket' });
    stream.pipe(socket);
  });

  socket.connect(remote.port, remote.host);

  logger.info({
    host: remote.host,
    msg: 'Connecting to TCP server',
    port: remote.port,
  });

  // oxlint-disable-next-line promise/avoid-new
  return new Promise<Buffer>((resolve, reject) => {
    socket.on('error', (err) => {
      logger.error({ err, msg: 'Failed to connect to remote socket' });
      socket.end();
      reject(err);
    });

    socket.on('close', () => {
      resolve(buf);
    });
  });
}
