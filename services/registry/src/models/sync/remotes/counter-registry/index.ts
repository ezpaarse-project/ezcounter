import { type $Fetch, ofetch } from 'ofetch';
import { chainUnchecked as chain } from 'stream-chain';

import { appLogger } from '~/lib/logger';
import { jsonStreamArray } from '~/lib/stream/json';

import type { DataHostSync } from '~/models/sync/dto';

// oxlint-disable-next-line import/extensions
import {
  homepage as appHomepage,
  version as appVersion,
} from '~/../package.json' with { type: 'json' };

import type { ISyncRemote } from '../types';
import { CounterPlatform, CounterService } from './dto';
import {
  formatPlatformToHost,
  formatReport,
  formatServiceToRelease,
} from './format';

const logger = appLogger.child({ scope: 'counter-registry' });

type CounterRegistryRemoteConfig = {
  baseURL: string;
  timeout: number;
  retry: number;
  retryDelay: number;
};

/**
 * Wrapper around ezCOUNTER API to sync data hosts
 */
export class CounterRegistryRemote implements ISyncRemote {
  private $fetch: $Fetch;

  public sourceURL: string;

  constructor(config: CounterRegistryRemoteConfig) {
    this.$fetch = ofetch.create({
      baseURL: config.baseURL,
      headers: {
        'User-Agent': `Mozilla/5.0 (compatible; ezCOUNTER/registry:${appVersion}; +${appHomepage})`,
      },
      retry: config.retry,
      retryDelay: config.retryDelay,
      timeout: config.timeout,
    });

    this.sourceURL = config.baseURL;
  }

  /**
   * Fetch all COUNTER Registry "platform"
   *
   * @yields A parsed platform
   */
  private async *fetchAllPlatforms(): AsyncGenerator<CounterPlatform> {
    const response = await this.$fetch('/v1/platform', {
      query: { format: 'json' },
      responseType: 'stream',
    });

    const stream = chain([response, jsonStreamArray.withParser()]);

    for await (const { key: index, value: item } of stream) {
      const { data, error } = CounterPlatform.safeParse(item);
      if (!data) {
        logger.warn({
          err: error,
          msg: 'Unable to parse platform from official registry',
          platformIndex: index,
        });
        // oxlint-disable-next-line no-continue
        continue;
      }

      yield data;
    }
  }

  /**
   * Fetch a COUNTER Registry "sushi-service"
   *
   * @param url The URL to the service
   *
   * @returns The parsed service
   */
  private async fetchService(url: string): Promise<CounterService | null> {
    const item = await this.$fetch(url);

    const { data, error } = CounterService.safeParse(item);
    if (!data) {
      logger.warn({
        err: error,
        msg: 'Unable to parse service from official registry',
        url,
      });
      return null;
    }

    return data;
  }

  /**
   * Fetch all hosts from remote
   *
   * @yields Data to sync host (includes releases and reports)
   */
  async *fetchHostSyncData(): AsyncGenerator<DataHostSync> {
    for await (const platform of this.fetchAllPlatforms()) {
      const reports = platform.reports
        .map((report) => formatReport(report, platform.id))
        // oxlint-disable-next-line no-implicit-coercion
        .filter((report) => !!report);

      const releases = await Promise.all(
        platform.sushi_services.map(async (link) => {
          const service = await this.fetchService(link.url);
          if (!service) {
            return null;
          }

          return formatServiceToRelease(
            service,
            platform,
            reports.filter(({ release }) => release === link.counter_release)
          );
        })
      );

      yield formatPlatformToHost(
        platform,
        // oxlint-disable-next-line no-implicit-coercion
        releases.filter((release) => !!release)
      );
    }
  }
}
