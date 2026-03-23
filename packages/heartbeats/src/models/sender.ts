import { EventEmitter } from 'node:events';
import { statfs } from 'node:fs/promises';
import { hostname } from 'node:os';

import type { Logger } from '@ezcounter/logger';
import { type rabbitmq, sendJSONMessage } from '@ezcounter/rabbitmq';

import type {
  FileSystemUsage,
  Heartbeat,
  HeartbeatService,
  HeartbeatFrequency,
  HeartbeatConnectedServicePing,
} from '../dto';
import {
  doPingWithTimeout,
  assertTransport,
  type HeartbeatTransport,
} from './utils';

export type HeartbeatSender = EventEmitter<{
  send: [];
  'send:main': [];
  'send:connected': [string];
}>;

type HeartbeatContext = {
  transport: HeartbeatTransport;
  logger: Logger;
  service: HeartbeatService;
  frequency: HeartbeatFrequency;
  filesystems: [string, string][];
  connectedServices: Map<string, HeartbeatConnectedServicePing>;
};

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
        name,
        total,
        available,
        used: total - available,
      };
    })
  );
}

/**
 * Helper to send a heartbeat
 *
 * @param data The content of the heartbeat
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
  } catch (err) {
    logger.error({
      msg: 'Failed to send heartbeat',
      service: data.service,
      err,
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
    service: ctx.service.name,
    hostname: `${hostname()}:${process.pid}`,
    version: ctx.service.version,
    filesystems: filesystems.length > 0 ? filesystems : undefined,
    updatedAt: now,
    nextAt: new Date(now.getTime() + ctx.frequency.self),
  });
}

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
 * Send a heartbeat for a connected service
 *
 * @param key The key of the service
 * @param ping How to ping service
 * @param frequency Amount of milliseconds until next heartbeat
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
  const frequency = Math.min(frequencyByService.get(key)?.next || min, max);

  try {
    const service = await doPingWithTimeout(ping, frequency);

    sendHeartbeat(ctx.transport, ctx.logger, service);

    frequencyByService.set(key, {
      last: frequency,
      next: Math.min(frequency * 2, max),
    });
  } catch (err) {
    ctx.logger.error({
      msg: 'Error when getting connected service',
      service: key,
      timeout: frequency * 0.75,
      err,
    });

    frequencyByService.set(key, {
      last: frequency,
      next: min,
    });
  }
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
  const delay = frequencyByService.get(key)?.next || frequency.connected.min;

  const timeout = setTimeout(() => {
    sender.emit('send:connected', key);

    setupConnectedInterval(sender, frequency, key);
  }, delay);

  timeoutByService.set(key, timeout);
}

/**
 * Setup sender events
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

/**
 * Setup heartbeat for this service
 *
 * @param channel - The rabbitmq channel
 * @param logger - The logger
 * @param options - Options to setup heartbeat
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
    transport,
    logger: childLogger,
    service: options.service,
    frequency: options.frequency || {
      // self: 2 seconds
      self: 2 * 1000,

      connected: {
        // min: 5 seconds
        min: 5 * 1000,
        // max: 5 mins
        max: 5 * 60 * 1000,
      },
    },
    filesystems: Object.entries(options.service.filesystems ?? {}).filter(
      ([, path]) => path
    ),
    connectedServices: new Map(
      Object.entries(options.service.connectedServices ?? {})
    ),
  };

  const sender = setupSender(ctx);

  setupMainInterval(sender, ctx.frequency);
  for (const [key] of ctx.connectedServices) {
    setupConnectedInterval(sender, ctx.frequency, key);
  }

  return sender;
}
