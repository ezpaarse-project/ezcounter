import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

import pino from 'pino';

import { appConfig } from '~/lib/config';

const config = appConfig.log;

const ignore = (
  Array.isArray(config.ignore) ? config.ignore : [config.ignore]
).join(',');

function createLogger(name: string): pino.Logger {
  const targets: pino.TransportTargetOptions[] = [];

  try {
    import.meta.resolve('pino-pretty');
    // Use pino-pretty if present
    targets.push({
      level: config.level,
      options: {
        colorize: true,
        ignore: [...ignore, 'scope'].join(','),
        messageFormat: '{if scope}[{scope}]{end} {msg}',
      },
      target: 'pino-pretty',
    });
  } catch {
    // Write logs to stdout
    targets.push({
      level: config.level,
      options: { destination: 1 },
      target: 'pino/file',
    });
  }

  // If needed add logs into a file
  if (config.dir) {
    // oxlint-disable-next-line node/no-sync - We want to ensure the dir before creating logger
    mkdirSync(config.dir, { recursive: true });
    targets.push({
      level: config.level,
      options: {
        destination: resolve(config.dir, `${name}.log`),
        ignore,
        sync: false,
      },
      target: 'pino/file',
    });
  }

  return pino({ transport: { targets } });
}

export const appLogger = createLogger('enricher');
export const accessLogger = createLogger('access');
