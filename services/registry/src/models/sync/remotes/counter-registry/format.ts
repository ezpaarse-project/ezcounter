import type { HarvestAdditionalParams } from '@ezcounter/dto/harvest';
import { z } from '@ezcounter/dto';

import { appLogger } from '~/lib/logger';

import type {
  DataHostReleaseSync,
  DataHostReportSync,
  DataHostSync,
} from '~/models/sync/dto';
// oxlint-disable-next-line import/extensions

import type {
  CounterPlatform,
  CounterPlatformReport,
  CounterService,
} from './dto';

const logger = appLogger.child({ scope: 'counter-registry' });

type PlatformMatchOptions = {
  hostName?: string;
};

/**
 * Extract platform parameter out of the description
 *
 * @param description The description of the platform parameter
 * @param matchOptions Options to match more precisely
 *
 * @returns The value of the param or undefined if not needed
 */
function extractPlatformParamValue(
  description: string,
  matchOptions: PlatformMatchOptions = {}
): string | undefined {
  let match = null;

  // Description is the value (maybe with prefix)
  if (
    (match = /^(?<prefix>Platform: )?(?<value>[a-z]+)$/v.exec(description)) !=
    null
  ) {
    return match.groups?.value?.trim();
  }

  // Description have name of host (T&F)
  if (
    matchOptions.hostName &&
    (match = new RegExp(
      `^Resource Standard Format: .*(?<value>${matchOptions.hostName})[^.]*`,
      'v'
    ).exec(description)) != null
  ) {
    return match.groups?.value?.trim();
  }

  return undefined;
}

/**
 * Check if given release is supported by ezCOUNTER
 *
 * @param release The release to check
 *
 * @returns `true` if supported
 */
function isReleaseSupported(release: string): release is '5' | '5.1' {
  const { success } = z.literal(['5', '5.1']).safeParse(release);
  if (success) {
    return true;
  }

  logger.warn({
    msg: 'Reference to a unsupported release from official registry',
    release,
  });

  return false;
}

/**
 * Check if a COUNTER Registry "sushi-service" is ezCOUNTER-compliant
 *
 * @param service The service
 *
 * @returns If ezCOUNTER-compliant
 */
const isServiceCompliant = (service: CounterService): boolean =>
  service.last_audit.audit_status === 'Currently valid audit';

/**
 * Format a COUNTER Registry "platform".reports to a ezCOUNTER "DataHostReport"
 *
 * @param report The report
 * @param platformId The ID of the platform having the report
 *
 * @returns data needed to sync a report of the data host
 */
export function formatReport(
  report: CounterPlatformReport,
  platformId: string
): DataHostReportSync | null {
  if (!isReleaseSupported(report.counter_release)) {
    return null;
  }

  return {
    dataHostId: platformId,
    firstMonthAvailable: null,
    lastMonthAvailable: null,
    release: report.counter_release,
    reportId: report.report_id.toLowerCase(),
    supported: true,
  };
}

/**
 * Format a COUNTER Registry "sushi-service" to a ezCOUNTER "DataHostRelease"
 *
 * @param service The service
 * @param platform The platform using the service
 * @param availableReports The reports of the service (from "platform".reports)
 *
 * @returns The data needed to sync a release of the data host
 */
export function formatServiceToRelease(
  service: CounterService,
  platform: CounterPlatform,
  availableReports: DataHostReportSync[] = []
): DataHostReleaseSync | null {
  if (!isReleaseSupported(service.counter_release)) {
    return null;
  }

  const params: HarvestAdditionalParams = {};
  if (service.platform_attr_required) {
    const platformAttr = extractPlatformParamValue(
      service.platform_specific_info,
      { hostName: platform.name }
    );
    if (platformAttr) {
      params.platform = platformAttr;
    }
  }

  return {
    availableReports,
    baseURL: service.url,
    compliant: isServiceCompliant(service),
    dataHostId: platform.id,
    params,
    release: service.counter_release,
    requiredAuth: {
      api_key: service.api_key_required,
      customer_id: true,
      requestor_id: service.requestor_id_required,
    },
    supported: true,
  };
}

/**
 * Format a COUNTER Registry "platform" to a ezCOUNTER "DataHost"
 *
 * @param platform The platform
 * @param availableReleases The releases of platform (from "sushi-service")
 *
 * @returns The data needed to sync a data host
 */
export const formatPlatformToHost = (
  platform: CounterPlatform,
  availableReleases: DataHostReleaseSync[] = []
): DataHostSync => ({
  availableReleases,
  id: platform.id,
  local: false,
  name: platform.abbrev
    ? `${platform.name} (${platform.abbrev})`
    : platform.name,
});
