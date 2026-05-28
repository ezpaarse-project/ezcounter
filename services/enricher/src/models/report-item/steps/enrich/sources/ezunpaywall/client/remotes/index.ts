import { milliseconds } from 'date-fns';

import { appConfig } from '~/lib/config';
import { type Store, createStore } from '~/lib/store';

import type { IEzUnpaywallRemote } from './types';
import { MAX_STORE_SIZE } from '../constants';
import { EzUnpaywallRemote } from './ezunpaywall';

const { ezunpaywall: config } = appConfig.enrich.sources;

/**
 * Create a store for ezUnpaywall data based on config
 *
 * @returns The store to use before fetching data
 */
export const createEzUnpaywallStore = (): Store =>
  createStore('unpaywall', {
    l1: { size: MAX_STORE_SIZE },
    ttl: milliseconds(config.storeTtl),
  });

/**
 * Create a remote for ezUnpaywall based on config
 *
 * @returns The remote to use when fetching data
 */
export const createEzUnpaywallRemote = (): IEzUnpaywallRemote =>
  new EzUnpaywallRemote({
    ...config,
    retryDelay:
      config.retryDelay.milliseconds || milliseconds(config.retryDelay),
    timeout: config.timeout.milliseconds || milliseconds(config.timeout),
  });
