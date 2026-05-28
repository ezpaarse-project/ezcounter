import { milliseconds } from 'date-fns';

import { appConfig } from '~/lib/config';
import { type Store, createStore } from '~/lib/store';

import type { IOpenAlexRemote } from './types';
import { MAX_STORE_SIZE } from '../../constants';
import { CNRSGatewayRemote } from './cnrs-gateway';
import { OpenAlexRemote } from './openalex';

const { openalex: config } = appConfig.enrich.sources;

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
export function createOpenAlexRemote(): IOpenAlexRemote {
  const conf = {
    ...config,
    retryDelay:
      config.retryDelay.milliseconds || milliseconds(config.retryDelay),
    timeout: config.timeout.milliseconds || milliseconds(config.timeout),
  };

  return config.isCNRSGateway
    ? new CNRSGatewayRemote(conf)
    : new OpenAlexRemote(conf);
}
