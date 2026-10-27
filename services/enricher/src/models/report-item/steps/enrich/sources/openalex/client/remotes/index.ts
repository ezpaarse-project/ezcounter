import { milliseconds } from 'date-fns';
import { type FetchOptions, ofetch } from 'ofetch';

import { appConfig } from '~/lib/config';
import { appLogger } from '~/lib/logger';
import { type Store, createStore } from '~/lib/store';

import type { IOpenAlexRemote } from './types';
import { MAX_STORE_SIZE } from '../../constants';
import { CNRSGatewayRemote } from './cnrs-gateway';
import { OpenAlexRemote } from './openalex';

const { openalex: config } = appConfig.enrich.sources;

type RemoteTypes = 'openalex' | 'cnrs-gateway' | null;

/**
 * Guess remote type by trying to fetch remote
 *
 * @param conf The config to fetch remote
 *
 * @returns Type of remote
 */
async function guessRemoteType(conf: FetchOptions): Promise<RemoteTypes> {
  try {
    const data = await ofetch('/', conf);

    if (typeof data === 'string') {
      return 'cnrs-gateway';
    }
    return 'openalex';
  } catch (error) {
    appLogger.warn({
      config: conf,
      err: error,
      msg: 'Unable to guess type of openalex remote, skipping the source',
    });

    return null;
  }
}

/**
 * Create a store for OpenAlex data based on config
 *
 * @returns The store to use before fetching data
 */
export const createOpenAlexStore = (): Store =>
  createStore('openalex', {
    l1: { size: MAX_STORE_SIZE },
    ttl: milliseconds(config.storeTtl),
  });

/**
 * Create a remote for OpenAlex based on config
 *
 * @returns The remote to use when fetching data
 */
export async function createOpenAlexRemote(): Promise<IOpenAlexRemote | null> {
  const conf = {
    ...config,
    retryDelay:
      config.retryDelay.milliseconds || milliseconds(config.retryDelay),
    timeout: config.timeout.milliseconds || milliseconds(config.timeout),
  };

  const remoteType = await guessRemoteType(conf);

  switch (remoteType) {
    case 'cnrs-gateway':
      return new CNRSGatewayRemote(conf);

    case 'openalex':
      return new OpenAlexRemote(conf);

    default:
      return null;
  }
}
