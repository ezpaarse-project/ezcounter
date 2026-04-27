import { z } from '.';

const MIN_TIMEOUT = 100;

/**
 * Validation for the auth to use when requesting a COUNTER endpoint
 */
export const HarvestAuthOptions = z.object({
  api_key: z.string().optional(),
  customer_id: z.string().optional(),
  requestor_id: z.string().optional(),
});

/**
 * Type for the auth to use when requesting a COUNTER endpoint
 */
export type HarvestAuthOptions = z.infer<typeof HarvestAuthOptions>;

/**
 * Validation for a date of the period of a report
 */
export const HarvestReportPeriodDate = z.stringFormat(
  'date-month',
  /^[0-9]{4}-[0-9]{2}$/
);

/**
 * Type for a date of the period of a report
 */
export type HarvestReportPeriodDate = z.infer<typeof HarvestReportPeriodDate>;

/**
 * Validation for a period of a report
 */
export const HarvestReportPeriod = z.object({
  end: HarvestReportPeriodDate.describe('Last month to harvest'),
  start: HarvestReportPeriodDate.describe('First month to harvest'),
});

/**
 * Type for a period of a report
 */
export type HarvestReportPeriod = z.infer<typeof HarvestReportPeriod>;

/**
 * Validation for additional params when requesting a report
 */
export const HarvestAdditionalParams = z.record(
  z.string(),
  z.union([z.string(), z.boolean(), z.array(z.string())])
);

/**
 * Type for additional params when requesting a report
 */
export type HarvestAdditionalParams = z.infer<typeof HarvestAdditionalParams>;

/**
 * Validation for the options to harvest a COUNTER report
 */
export const HarvestReportOptions = z.object({
  id: z.string().describe('Report ID to harvest'),

  params: z
    .intersection(
      z.object({
        access_method: z.array(z.string()).optional(),
        access_type: z.array(z.string()).optional(),
        attributed: z.boolean().optional(),
        attributes_to_show: z.array(z.string()).optional(),
        author: z.string().optional(),
        country_code: z.array(z.string()).optional(),
        data_type: z.array(z.string()).optional(),
        database: z.string().optional(),
        granularity: z.string().optional(),
        include_components_details: z.boolean().optional(),
        include_parent_details: z.boolean().optional(),
        item_id: z.string().optional(),
        metric_type: z.array(z.string()).optional(),
        platform: z.string().optional(),
        subdivision_code: z.string().optional(),
        yop: z.array(z.string()).optional(),
      }),
      HarvestAdditionalParams
    )
    .optional()
    .describe('Query parameters to use when downloading report'),

  period: HarvestReportPeriod.describe('Period of the harvest'),

  release: z.literal(['5', '5.1']).describe('COUNTER release of the report'),
});

/**
 * Type for the options to harvest a COUNTER report
 */
export type HarvestReportOptions = z.infer<typeof HarvestReportOptions>;

/**
 * Validation for the options to harvest a COUNTER endpoint
 */
export const HarvestDataHostOptions = z.object({
  auth: HarvestAuthOptions.describe('Credentials to use to harvest'),

  baseUrl: z.url().describe('URL to use'),

  paramsSeparator: z
    .string()
    .optional()
    .describe('Separator used for multivaluated params (defaults to "|")'),

  periodFormat: z
    .string()
    .optional()
    .describe('Date format to use for the period (defaults to "yyyy-MM")'),
});

/**
 * Type for the options to harvest a COUNTER endpoint
 */
export type HarvestDataHostOptions = z.infer<typeof HarvestDataHostOptions>;

/**
 * Validation for the options to download a COUNTER report
 */
export const HarvestDownloadOptions = z.object({
  cacheKey: z.string().describe('Key to get/set cache data'),

  dataHost: HarvestDataHostOptions.describe(
    'Information on how to harvest the report'
  ),

  forceDownload: z
    .boolean()
    .optional()
    .describe(
      'Should force the download of the report even if cache is present'
    ),

  report: HarvestReportOptions.describe('Information on report to harvest'),

  timeout: z
    .int()
    .min(MIN_TIMEOUT)
    .optional()
    .describe('Maximum idle time of a job'),
});

/**
 * Type for the options to download a COUNTER report
 */
export type HarvestDownloadOptions = z.infer<typeof HarvestDownloadOptions>;

/**
 * Validation for the options to enrich a COUNTER report
 */
export const HarvestEnrichOptions = z.object({});

/**
 * Type for the options to enrich a COUNTER report
 */
export type HarvestEnrichOptions = z.infer<typeof HarvestEnrichOptions>;

/**
 * Validation for the options to insert COUNTER data
 */
export const HarvestInsertOptions = z.object({
  additionalData: z
    .record(z.string(), z.string())
    .optional()
    .describe('Data to add to harvested items'),

  additionalIdParts: z
    .array(z.string())
    .min(1)
    .optional()
    .describe('Parts to add to id of inserted documents'),

  index: z.string().describe('Elastic index data will be inserted'),
});

/**
 * Type for the options to insert COUNTER data
 */
export type HarvestInsertOptions = z.infer<typeof HarvestInsertOptions>;

/**
 * Validation for exceptions found while harvesting
 */
export const HarvestException = z.object({
  code: z.string().describe('Code of the exception'),

  helpUrl: z.string().optional().describe('URL to get help about exception'),

  message: z.string().describe('Message of the exception'),

  severity: z
    .enum(['error', 'warn', 'info'])
    .describe('Severity of the exception'),
});

/**
 * Type for the exceptions found while harvesting
 */
export type HarvestException = z.infer<typeof HarvestException>;

/**
 * Validation for errors while harvesting
 */
export const HarvestError = z.object({
  cause: z.json().optional(),
  code: z.string(),
  message: z.string(),
});

/**
 * Type for the errors while harvesting
 */
export type HarvestError = z.infer<typeof HarvestError>;
