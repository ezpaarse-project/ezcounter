import { hostname } from 'node:os';
import { pid } from 'node:process';

import type { Heartbeat, HeartbeatConnectedServicePing } from './dto';

const FREQ_MULTIPLIER = 0.75;

export const EXCHANGE_NAME = 'ezcounter:heartbeat' as const;

export const NODE_NAME = `${hostname()}:${pid}`;

/**
 * Execute ping with timeout
 *
 * @param ping - The ping
 * @param frequency - The frequency
 *
 * @returns The heartbeat
 */
export function doPingWithTimeout(
  ping: HeartbeatConnectedServicePing,
  frequency: number
): Promise<Heartbeat> {
  const signal = AbortSignal.timeout(frequency * FREQ_MULTIPLIER);

  // oxlint-disable-next-line promise/avoid-new
  return new Promise<Heartbeat>((resolve, reject) => {
    signal.addEventListener('abort', () => {
      reject(new Error('TimeoutError'));
    });

    ping()
      // oxlint-disable promise/prefer-await-to-then,promise/prefer-await-to-callbacks
      .then((service) => {
        const now = new Date();
        return {
          ...service,
          nextAt: new Date(now.getTime() + frequency),
          updatedAt: now,
        };
      })
      .then((service) => {
        resolve(service);
        return service;
      })
      .catch((error) => {
        reject(error instanceof Error ? error : new Error(`${error}`));
      });
    // oxlint-enable promise/prefer-await-to-then,promise/prefer-await-to-callbacks
  });
}
