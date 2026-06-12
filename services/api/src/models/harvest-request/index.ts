import { randomUUID } from 'node:crypto';
import { setTimeout } from 'node:timers/promises';

import type { HarvestReportOptions } from '@ezcounter/dto/harvest';
import type {
  HarvestJobData,
  HarvestRequestContent,
  HarvestRequestData,
} from '@ezcounter/dto/queues';

import type { DataHostWithSupportedData } from '~/models/data-host/dto';
import { fetchSupportedReportsOfDataHost } from '~/models/data-host/supported-reports';
import { limitReportOptionsWithSupported } from '~/models/harvest/limits';
import { splitPeriodByMonths } from '~/models/harvest/period';

import { resolveRequestContextPerHostname } from './context';

/**
 * Transform a HarvestRequest into a HarvestJob ready to be sent to harvesters
 *
 * @param request - The HarvestRequest
 * @param request.download - The download options of the request
 * @param request.download.reports - The reports to harvest
 * @param request.download.dataHost - The data host options of the request
 * @param request.download.dataHost.id - The ID of data host
 * @param reportOptions - The report options
 * @param requestOptions - The options to fetch remote
 *
 * @returns The job
 */
const createJobFromRequest = (
  {
    download: {
      reports: __,
      dataHost: { id: cacheKey, ...dataHostOpts },
      ...downloadOpts
    },
    ...request
  }: HarvestRequestContent,
  reportOptions: HarvestReportOptions,
  requestOptions: {
    baseUrl: string;
    params: Record<string, string | boolean | string[]>;
    paramsSeparator: string;
    periodFormat: string;
  }
): HarvestJobData => ({
  ...request,
  download: {
    ...downloadOpts,
    cacheKey,
    dataHost: {
      ...dataHostOpts,
      baseUrl: requestOptions.baseUrl,
      paramsSeparator: requestOptions.paramsSeparator,
      periodFormat: requestOptions.periodFormat,
    },
    report: {
      ...reportOptions,
      params: {
        ...requestOptions.params,
        ...reportOptions.params,
      },
    },
  },
  id: randomUUID(),
});

/**
 * Transform a HarvestRequest into HarvestJobData ready to be queued
 *
 * @param content - The harvest request content
 * @param dataHost - The data host to use with supported data
 *
 * @returns The jobs matching request
 */
function prepareHarvestJobsFromHarvestRequestContent(
  content: HarvestRequestContent,
  dataHost: DataHostWithSupportedData
): HarvestJobData[] {
  const [{ supportedReports, ...release }] = dataHost.supportedReleases;

  return content.download.reports
    .flatMap(({ splitPeriodBy, ...reportOpts }) => {
      const supported = supportedReports.find(({ id }) => id === reportOpts.id);

      const report = limitReportOptionsWithSupported(reportOpts, supported);

      // If report is not supported -> Skip report
      if (!report) {
        return null;
      }

      const parts = splitPeriodByMonths(report.period, splitPeriodBy ?? 0);
      return parts.map((period) =>
        createJobFromRequest(
          content,
          { ...report, period },
          {
            baseUrl: release.baseUrl || '',
            params: {
              ...dataHost.params,
              ...release.params,
              ...supported?.params,
            },
            paramsSeparator: release?.paramsSeparator,
            periodFormat: release?.periodFormat,
          }
        )
      );
    })
    .filter((job) => job != null);
}

/**
 * Transform many HarvestRequests into HarvestJobData ready to be queued
 *
 * @param request - The harvest request
 * @param fetchDelay - The delay between each fetch of the report list
 *
 * @returns The jobs matching requests
 */
export async function prepareHarvestJobsFromHarvestRequest(
  request: HarvestRequestData,
  fetchDelay = 0
): Promise<HarvestJobData[]> {
  const contextsPerHostname = await resolveRequestContextPerHostname(request);
  const jobs: HarvestJobData[] = [];
  await Promise.all(
    [...contextsPerHostname].map(async ([hostname, contexts]) => {
      if (!hostname) {
        return;
      }

      for (const { content, dataHost, release } of contexts) {
        try {
          // oxlint-disable-next-line no-await-in-loop - We want to fetch report list one at the time per data host
          const supportedReports = await fetchSupportedReportsOfDataHost(
            dataHost,
            content.download.dataHost.auth,
            release.release
          );

          if (fetchDelay > 0) {
            // oxlint-disable-next-line no-await-in-loop
            await setTimeout(fetchDelay);
          }

          jobs.push(
            ...prepareHarvestJobsFromHarvestRequestContent(content, {
              ...dataHost,
              supportedReleases: [{ ...release, supportedReports }],
            })
          );
        } catch {
          // TODO: Do something
          continue;
        }
      }
    })
  );

  return jobs;
}
