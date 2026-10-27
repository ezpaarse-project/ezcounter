import { milliseconds } from 'date-fns';
import { type FetchOptions, ofetch } from 'ofetch';

import { RouteResponseWithRegistry } from '@ezcounter/dto/registry';

import { appConfig } from '~/lib/config';
import { appLogger } from '~/lib/logger';

import type { ISyncRemote } from './types';
// import { CounterRegistryRemote } from './counter-registry';
import { EzCounterRemote } from './ezcounter';

const { source: config } = appConfig;

type RemoteTypes = 'ezcounter' | 'counter-registry' | null;

/**
 * Guess remote type by trying to fetch remote
 *
 * @param conf The config to fetch remote
 *
 * @returns Type of remote
 */
async function guessRemoteType(conf: FetchOptions): Promise<RemoteTypes> {
  if (!conf.baseURL) {
    return null;
  }

  try {
    const data = await ofetch('/', conf);

    if (RouteResponseWithRegistry.validate(data)) {
      // Override config to use data provided by service
      conf.baseURL = data.ezcRegistry.baseURL;
      return 'ezcounter';
    }

    return 'counter-registry';
  } catch (error) {
    appLogger.warn({
      config: conf,
      err: error,
      msg: 'Unable to guess type of sync remote, acting as a local registry only',
    });

    return null;
  }
}

/**
 * Create a remote for sync based on config
 *
 * @returns The remote to use when fetching data, or `null` if no remote is configured
 */
export async function createSyncRemote(): Promise<ISyncRemote | null> {
  const conf = {
    ...config,
    retryDelay:
      config.retryDelay.milliseconds || milliseconds(config.retryDelay),
    timeout: config.timeout.milliseconds || milliseconds(config.timeout),
  };

  const remoteType = await guessRemoteType(conf);

  switch (remoteType) {
    case 'ezcounter':
      return new EzCounterRemote(conf);

    case 'counter-registry':
    // return new CounterRegistryRemote(conf);

    default:
      return null;
  }
}
