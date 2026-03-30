import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

import pino from 'pino';

function getStdOutTarget(options: LoggerOptions): pino.TransportTargetOptions {
  // If no prettier is installed, send logs directly to stdout
  if (options.pretty == null || !options.pretty) {
    return { options: { destination: 1 }, target: 'pino/file' };
  }

  return {
    level: options.level,
    options: {
      colorize: true,
      ignore: [...options.ignore, 'scope'].join(','),
      messageFormat: '{if scope}[{scope}]{end} {msg}',
    },
    target: 'pino-pretty',
  };
}

export const logLevels = pino.levels;

export type Logger = pino.Logger;
export type Level = pino.Level;
export type LoggerOptions = Omit<pino.LoggerOptions, 'transports'> & {
  name: string;
  ignore: string[];
  dir?: string;
  pretty?: boolean;
};

export function isPrettierInstalled(
  resolveModule: (specifier: string) => string
): boolean {
  try {
    return Boolean(resolveModule('pino-pretty'));
  } catch {
    return false;
  }
}

export function createLogger(options: LoggerOptions): Logger {
  const targets: pino.TransportTargetOptions[] = [getStdOutTarget(options)];

  // If needed add logs into a file
  if (options.dir != null) {
    mkdirSync(resolve(options.dir), { recursive: true });
    targets.push({
      level: options.level,
      options: {
        destination: resolve(options.dir, `${options.name}.log`),
        ignore: options.ignore.join(','),
        sync: false,
      },
      target: 'pino/file',
    });
  }

  return pino({
    ...options,
    transport: { targets },
  });
}
