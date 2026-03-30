import { EventEmitter } from 'node:events';
import { statfs } from 'node:fs/promises';
import { hostname } from 'node:os';

import type { Logger } from '@ezcounter/logger';
import { type rabbitmq, sendJSONMessage } from '@ezcounter/rabbitmq';

import type {
  FileSystemUsage,
  Heartbeat,
  HeartbeatConnectedServicePing,
  HeartbeatFrequency,
  HeartbeatService,
} from '../dto';
import {
  type HeartbeatTransport,
  assertTransport,
  doPingWithTimeout,
} from './utils';

type HeartbeatContext = {
  transport: HeartbeatTransport;
  logger: Logger;
  service: HeartbeatService;
  frequency: HeartbeatFrequency;
  filesystems: [string, string][];
  connectedServices: Map<string, HeartbeatConnectedServicePing>;
};

// oxlint-disable no-magic-numbers
const DEFAULT_FREQ = {
  connected: {
    // Max: 5 mins
    max: 5 * 60 * 1000,
    // Min: 5 seconds
    min: 5 * 1000,
  },

  // Self: 2 seconds
  self: 2 * 1000,
};
// oxlint-enable no-magic-numbers

/** Map of frequency by service */
const frequencyByService = new Map<string, { last: number; next: number }>();
/** Map of NodeJS timeouts by service, useful when closing */
const timeoutByService = new Map<string, NodeJS.Timeout>();

/**
 * Get stats about watched file systems
 *
 * @param filesystems - The filesystems to watch
 *
 * @returns The stats
 */
function getFilesystemStatus(
  filesystems: [string, string][]
): Promise<FileSystemUsage[]> {
  // oxlint-disable-next-line prefer-await-to-then
  return Promise.all(
    filesystems.map(async ([name, path]) => {
      const stats = await statfs(path);

      const total = stats.bsize * stats.blocks;
      const available = stats.bavail * stats.bsize;

      return {
        available,
        name,
        total,
        used: total - available,
      };
    })
  );
}

/**
 * Helper to send a heartbeat
 *
 * @param transport - The transport to use
 * @param logger - The logger to use
 * @param data - The content of the heartbeat
 */
function sendHeartbeat(
  transport: HeartbeatTransport,
  logger: Logger,
  data: Heartbeat
): void {
  try {
    const { size } = sendJSONMessage(transport, data);
    logger.trace({
      msg: 'Heartbeat sent',
      service: data.service,
      size,
      sizeUnit: 'B',
    });
  } catch (error) {
    logger.error({
      err: error,
      msg: 'Failed to send heartbeat',
      service: data.service,
    });
  }
}

/**
 * Send main (self) heartbeat
 *
 * @param ctx - Configuration of heartbeats
 */
async function sendMainHeartbeat(ctx: HeartbeatContext): Promise<void> {
  const filesystems = await getFilesystemStatus(ctx.filesystems);

  const now = new Date();

  sendHeartbeat(ctx.transport, ctx.logger, {
    filesystems: filesystems.length > 0 ? filesystems : undefined,
    hostname: `${hostname()}:${process.pid}`,
    nextAt: new Date(now.getTime() + ctx.frequency.self),
    service: ctx.service.name,
    updatedAt: now,
    version: ctx.service.version,
  });
}

/**
 * Send a heartbeat for a connected service
 *
 * @param key The key of the service
 * @param ctx Configuration of heartbeats
 */
async function sendConnectedHeartbeat(
  key: string,
  ctx: HeartbeatContext
): Promise<void> {
  const ping = ctx.connectedServices.get(key);
  if (!ping) {
    throw new Error(`The service ${key} doesn't exists`);
  }

  const { min, max } = ctx.frequency.connected;
  const frequency = Math.min(frequencyByService.get(key)?.next ?? min, max);

  try {
    const service = await doPingWithTimeout(ping, frequency);

    sendHeartbeat(ctx.transport, ctx.logger, service);

    frequencyByService.set(key, {
      last: frequency,
      next: Math.min(frequency * 2, max),
    });
  } catch (error) {
    ctx.logger.error({
      err: error,
      msg: 'Error when getting connected service',
      service: key,
      timeout: frequency * 0.75,
    });

    frequencyByService.set(key, {
      last: frequency,
      next: min,
    });
  }
}

/**
 * Setup sender events
 *
 * @param ctx - The heartbeat context
 *
 * @returns The event emitter
 */
function setupSender(ctx: HeartbeatContext): HeartbeatSender {
  const sender: HeartbeatSender = new EventEmitter();

  sender.on('send:main', async () => {
    await sendMainHeartbeat(ctx);
  });

  sender.on('send:connected', async (key) => {
    await sendConnectedHeartbeat(key, ctx);
  });

  sender.on('send', () => {
    sender.emit('send:main');

    for (const [key] of ctx.connectedServices) {
      sender.emit('send:connected', key);
    }
  });

  return sender;
}

export type HeartbeatSender = EventEmitter<{
  send: [];
  'send:main': [];
  'send:connected': [string];
}>;

/**
 * Schedule next main heartbeat using static frequency
 *
 * @param sender - The event bus
 * @param frequency - The frequency config
 */
export function setupMainInterval(
  sender: HeartbeatSender,
  frequency: HeartbeatFrequency
): void {
  // Schedule next event
  const timeout = setTimeout(() => {
    sender.emit('send:main');

    setupMainInterval(sender, frequency);
  }, frequency.self);

  timeoutByService.set('_self', timeout);
}

/**
 * Schedule next main heartbeat using dynamic frequency
 *
 * @param sender - The event bus
 * @param frequency - The frequency config
 * @param key - The key of the service
 */
export function setupConnectedInterval(
  sender: HeartbeatSender,
  frequency: HeartbeatFrequency,
  key: string
): void {
  const delay = frequencyByService.get(key)?.next ?? frequency.connected.min;

  const timeout = setTimeout(() => {
    sender.emit('send:connected', key);

    setupConnectedInterval(sender, frequency, key);
  }, delay);

  timeoutByService.set(key, timeout);
}

/**
 * Setup heartbeat for this service
 *
 * @param channel - The rabbitmq channel
 * @param logger - The logger
 * @param options - Options to setup heartbeat
 *
 * @returns The heartbeat sender
 */
export async function setupHeartbeatSender(
  channel: rabbitmq.Channel,
  logger: Logger,
  options: {
    service: HeartbeatService;
    isRabbitMQMandatory?: boolean;
    frequency?: HeartbeatFrequency;
  }
): Promise<HeartbeatSender> {
  const childLogger = logger.child({ scope: 'heartbeat' });

  const transport = await assertTransport(
    channel,
    logger,
    options.isRabbitMQMandatory
  );

  const ctx: HeartbeatContext = {
    connectedServices: new Map(
      Object.entries(options.service.connectedServices ?? {})
    ),
    filesystems: Object.entries(options.service.filesystems ?? {}).filter(
      ([, path]) => path
    ),
    frequency: options.frequency ?? DEFAULT_FREQ,
    logger: childLogger,
    service: options.service,
    transport,
  };

  const sender = setupSender(ctx);

  setupMainInterval(sender, ctx.frequency);
  for (const [key] of ctx.connectedServices) {
    setupConnectedInterval(sender, ctx.frequency, key);
  }

  return sender;
}
