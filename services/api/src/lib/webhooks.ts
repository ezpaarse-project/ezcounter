import { createHash } from 'node:crypto';

import { createFetch } from 'ofetch';

import { appConfig } from '~/lib/config';
import { appLogger } from '~/lib/logger';

// oxlint-disable-next-line import/extensions
import {
  dependencies as appDeps,
  homepage as appHomepage,
  version as appVersion,
} from '~/../package.json' with { type: 'json' };

const config = appConfig.hooks;
const logger = appLogger.child({ scope: 'webhooks' });

/**
 * Loads banned hosts from config
 *
 * @returns Banned hosts
 */
function loadBannedHosts(): RegExp[] {
  // Warn if no domains was provided
  if (!Array.isArray(config.bannedHosts) || config.bannedHosts.length <= 0) {
    logger.warn(
      'No banned domains defined. Please set HOOKS_BANNED_DOMAINS or "hooks.bannedDomains" in a config file to avoid SSRF attacks'
    );
    return [];
  }

  // Try to parse the provided domains as RegExs
  try {
    const banned = config.bannedHosts.map(
      (domain) => new RegExp(`^${domain}$`, 'iv')
    );

    logger.trace({
      bannedHosts: banned.map((reg) => reg.source),
      msg: 'Loaded banned hosts',
    });
    return banned;
  } catch (error) {
    logger.error(error, 'Error occurred while parsing banned hosts as RegExs');
    return [];
  }
}

/**
 * Fetch instance used to trigger webhooks
 */
const $fetch = createFetch({
  defaults: {
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': `Mozilla/5.0 (compatible; ezCOUNTER/api:${appVersion}; +${appHomepage}); ofetch/${appDeps.ofetch.slice(1)}`,
    },
    method: 'POST',
    onRequest: [
      // Check if not attempting to request banned domain
      ({ request }): void => {
        const banned = loadBannedHosts();
        const { hostname } = new URL(request);

        if (banned.some((regexp) => regexp.test(hostname))) {
          throw new Error(`Cannot fetch banned host: ${hostname}`);
        }
      },
    ],
  },
});

/**
 * Trigger a webhook with payload. Calculates signature
 *
 * @param url - The URL to webhook
 * @param payload - The payload of webhook
 */
export async function triggerWebhook(
  url: string,
  payload: unknown
): Promise<void> {
  try {
    const body = JSON.stringify(payload);
    const signature = createHash('sha256')
      .update(Buffer.from(body, 'utf8'))
      .digest('hex');

    await $fetch(url, {
      body,
      headers: {
        'X-Signature-256': `sha256=${signature}`,
      },
    });

    logger.trace({
      msg: 'Successfully triggered webhook',
      signature,
      url,
    });
  } catch (error) {
    logger.warn({
      err: error,
      msg: 'Unable to trigger webhook',
      url,
    });
  }
}
