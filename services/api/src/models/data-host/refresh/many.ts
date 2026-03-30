import { stringify as stringifyQuery } from 'node:querystring';

import type { HarvestAuthOptions } from '@ezcounter/dto/harvest';

import { getDataHostWithSupportedData } from '~/models/data-host';

import type {
  DataHostSupportedReport,
  DataHostWithSupportedData,
} from '../dto';
import type { SupportedReportsRefreshOptions } from './types';
import { refreshSupportedReportOfDataHost } from './one';

/**
 * Generate a key to regroup data hosts to avoid refreshing multiple times same **platform**
 *
 * @param host - The host with supported data
 * @param release - The release to refresh
 *
 * @returns The key to regroup data hosts
 */
function generateRefreshKey(
  host: DataHostWithSupportedData | null,
  release: '5' | '5.1'
): string | null {
  const supported = host?.supportedReleases.find(
    (re) => re.release === release
  );
  // Skip if unsupported
  if (!supported) {
    return null;
  }

  const url = new URL(supported.baseUrl);
  // Merge params and stringify it
  // We don't need to do precise parsing as it's used as a key and not as an actual url
  url.search = stringifyQuery(
    {
      ...Object.fromEntries(url.searchParams.entries()),
      ...host?.params,
      ...supported.params,
    },
    '&'
  );
  return url.href;
}

/**
 * Refresh the list of supported reports for many data hosts
 *
 * @param dataHosts - The data hosts to refresh, with auth to use on remote
 * @param options - The options to use to refresh the supported reports
 *
 * @returns The list of supported reports for each data host
 */
export async function refreshManySupportedReports(
  dataHosts: { id: string; auth: HarvestAuthOptions }[],
  options: SupportedReportsRefreshOptions
): Promise<Map<string, DataHostSupportedReport[]>> {
  // Resolve data hosts
  const hostsWithAuth = await Promise.all(
    dataHosts.map(async (input) => ({
      ...input,
      host: await getDataHostWithSupportedData(input.id),
    }))
  );

  // Group by refresh key
  const toRefresh = Map.groupBy(hostsWithAuth, ({ host }) =>
    generateRefreshKey(host, options.release)
  );

  // Refresh
  const reportsEntries = await Promise.all(
    [...toRefresh.entries()]
      // Removes unsupported releases
      .filter(([key]) => Boolean(key))
      .map(
        async ([__, hosts]): Promise<[string, DataHostSupportedReport[]][]> => {
          // TODO: retry if Forbidden
          const [base] = hosts;
          const reports = base.host
            ? await refreshSupportedReportOfDataHost(
                base.host,
                base.auth,
                options
              )
            : [];

          return hosts.map(({ id }) => [id, reports]);
        }
      )
  );

  // Map refreshed reports by data host id
  return new Map(reportsEntries.flat());
}
