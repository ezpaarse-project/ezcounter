import { z, zStringToNullableBoolean } from '@ezcounter/dto';
import {
  HarvestAdditionalParams,
  HarvestDataHostOptions,
  HarvestDownloadOptions,
  HarvestReportOptions,
} from '@ezcounter/dto/harvest';
import { addPrefix, keysOf } from '@ezcounter/toolbox/utils';

/**
 * Validation for filtering reports supported by data host
 */
export const DataHostSupportedReportFilters = z
  .object({
    'createdAt[gte]': z.coerce.date().describe('Filter reports created after'),
    'createdAt[lte]': z.coerce.date().describe('Filter reports created before'),

    supported: zStringToNullableBoolean.describe(
      'Filter reports not overridden, or specific value'
    ),

    'updatedAt[gte]': z.coerce.date().describe('Filter reports updated after'),
    'updatedAt[lte]': z.coerce.date().describe('Filter reports updated before'),
  })
  .partial();

/**
 * Type for filtering reports supported by data host
 */
export type DataHostSupportedReportFilters = z.infer<
  typeof DataHostSupportedReportFilters
>;

/**
 * Validation for a report supported by Data Host
 */
export const DataHostSupportedReport = z.object({
  createdAt: z.coerce.date().describe('Creation date'),

  dataHostId: z.string().describe('ID of the Data Host'),

  firstMonthAvailable: z
    .string()
    .nullable()
    .describe(
      'First month available in report - empty if no date - null to not override'
    ),

  id: HarvestReportOptions.shape.id,

  lastMonthAvailable: z
    .string()
    .nullable()
    .describe(
      'Last month available in report - empty if no date - null to not override'
    ),

  params: HarvestAdditionalParams.describe(
    'Additional params to use when requesting data host using report'
  ),

  release: HarvestDownloadOptions.shape.release,

  supported: z
    .boolean()
    .nullable()
    .describe('Is report supported by data - null to not override'),

  updatedAt: z.coerce.date().nullable().describe('Last update date'),
});

/**
 * Type for a report supported by Data Host
 */
export type DataHostSupportedReport = z.infer<typeof DataHostSupportedReport>;

/**
 * Validation for filtering releases supported by data host
 */
export const DataHostSupportedReleaseFilters = z
  .object({
    'createdAt[gte]': z.coerce.date().describe('Filter hosts created after'),
    'createdAt[lte]': z.coerce.date().describe('Filter hosts created before'),

    'updatedAt[gte]': z.coerce.date().describe('Filter hosts updated after'),
    'updatedAt[lte]': z.coerce.date().describe('Filter hosts updated before'),
  })
  .partial();

/**
 * Type for filtering releases supported by data host
 */
export type DataHostSupportedReleaseFilters = z.infer<
  typeof DataHostSupportedReleaseFilters
>;

/**
 * Validation for a release supported by Data Host
 */
export const DataHostSupportedRelease = z.object({
  baseUrl: HarvestDataHostOptions.shape.baseUrl,

  createdAt: z.coerce.date().describe('Creation date'),

  dataHostId: z.string().describe('ID of the Data Host'),

  params: HarvestAdditionalParams.describe(
    'Additional params to use when requesting data host using release'
  ),

  paramsSeparator: HarvestDataHostOptions.shape.paramsSeparator.unwrap(),

  periodFormat: HarvestDataHostOptions.shape.periodFormat.unwrap(),

  release: HarvestDownloadOptions.shape.release,

  supportedReports: z
    .array(DataHostSupportedReport)
    .optional()
    .describe('[Include] Supported reports of release'),

  updatedAt: z.coerce.date().nullable().describe('Last update date'),
});

/**
 * Type for a release supported by Data Host
 */
export type DataHostSupportedRelease = z.infer<typeof DataHostSupportedRelease>;

/**
 * Validation for include-able keys for a release supported by Data Host
 */
export const DataHostSupportedReleaseInclude = z.enum(['supportedReports']);

/**
 * Type for include-able keys for a release supported by Data Host
 */
export type DataHostSupportedReleaseInclude = z.infer<
  typeof DataHostSupportedReleaseInclude
>;

/**
 * Validation for filtering Data Host
 */
export const DataHostFilters = z
  .object({
    'createdAt[gte]': z.coerce.date().describe('Filter hosts created after'),
    'createdAt[lte]': z.coerce.date().describe('Filter hosts created before'),

    'updatedAt[gte]': z.coerce.date().describe('Filter hosts updated after'),
    'updatedAt[lte]': z.coerce.date().describe('Filter hosts updated before'),
  })
  .partial();

/**
 * Type for filtering Data Host
 */
export type DataHostFilters = z.infer<typeof DataHostFilters>;

/**
 * Validation for a registered Data Host
 */
export const DataHost = z.object({
  createdAt: z.coerce.date().describe('Creation date'),

  id: z.string().describe('ID of the Data Host'),

  params: HarvestAdditionalParams.describe(
    'Additional params to use when requesting data host'
  ),

  supportedReleases: z
    .array(DataHostSupportedRelease)
    .optional()
    .describe('[Include] Supported releases of Data Host'),

  updatedAt: z.coerce.date().nullable().describe('Last update date'),
});

/**
 * Type for a registered Data Host
 */
export type DataHost = z.infer<typeof DataHost>;

/**
 * Validation for include-able keys for a Data Host
 */
export const DataHostInclude = z.enum([
  'supportedReleases',
  ...keysOf(DataHostSupportedReleaseInclude.enum).map((key) =>
    addPrefix('supportedReleases', key)
  ),
]);

/**
 * Type for include-able keys for a Data Host
 */
export type DataHostInclude = z.infer<typeof DataHostInclude>;

/**
 * Validation for a data host and it's supported data
 */
export const DataHostWithSupportedData = z.object({
  ...DataHost.shape,

  supportedReleases: z.array(
    z.object({
      ...DataHostSupportedRelease.shape,

      // oxlint-disable-next-line unicorn/max-nested-calls
      supportedReports: z.array(DataHostSupportedReport),
    })
  ),
});

/**
 * Type for a a data host and it's supported data
 */
export type DataHostWithSupportedData = z.infer<
  typeof DataHostWithSupportedData
>;
