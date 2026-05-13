import type {
  HarvestRequestContent,
  HarvestRequestData,
} from '@ezcounter/dto/queues';

import type {
  DataHostSupportedRelease,
  DataHostWithSupportedData,
} from '~/models/data-host/dto';
import { getDataHostWithSupportedData } from '~/models/data-host';

/**
 * Type for the context of a harvest request
 */
type HarvestRequestContext = {
  content: HarvestRequestContent;
  dataHost: DataHostWithSupportedData;
  release: DataHostSupportedRelease;
};

/**
 * Get the data hosts with supported data of a request
 *
 * @param request - The request to get the data hosts of
 *
 * @returns The data hosts with supported data of the request
 */
async function getDataHostsOfRequest(
  request: HarvestRequestData
): Promise<Map<string, DataHostWithSupportedData>> {
  const results = await Promise.all(
    request.map(async (content) => {
      try {
        const dataHost = await getDataHostWithSupportedData(
          content.download.dataHost.id
        );
        return dataHost;
      } catch {
        // TODO: Do something
        return null;
      }
    })
  );

  return new Map(
    results
      // oxlint-disable-next-line unicorn/prefer-native-coercion-functions - Type guard
      .filter((value): value is DataHostWithSupportedData => Boolean(value))
      .map((dataHost) => [dataHost.id, dataHost])
  );
}

/**
 * Resolve the request contexts per hostname
 *
 * Allows to run multiple requests in parallel but only one per hostname
 *
 * @param request - The request to resolve
 *
 * @returns The resolved request contexts per hostname
 */
export async function resolveRequestContextPerHostname(
  request: HarvestRequestData
): Promise<Map<string | undefined, HarvestRequestContext[]>> {
  const dataHosts = await getDataHostsOfRequest(request);

  const resolved = request
    .map((content): HarvestRequestContext | null => {
      const dataHost = dataHosts.get(content.download.dataHost.id);
      const release = dataHost?.supportedReleases.find(
        (item) => item.release === content.download.release
      );

      if (!dataHost || !release) {
        return null;
      }

      return {
        content,
        dataHost,
        release,
      };
    })
    // oxlint-disable-next-line unicorn/prefer-native-coercion-functions - Type guard
    .filter((value): value is HarvestRequestContext => Boolean(value));

  return Map.groupBy(
    resolved,
    ({ release }) => URL.parse(release?.baseUrl ?? '')?.hostname
  );
}
