import { z } from '../lib/zod';

export const HarvestReportPeriodDate = z.stringFormat(
  'date-month',
  /^[0-9]{4}-[0-9]{2}$/
);

/**
 * Validation for the options to harvest a COUNTER report
 */
export const HarvestReportOptions = z.object({
  reportId: z.string(),

  period: z
    .object({
      start: HarvestReportPeriodDate.describe('First month to harvest'),
      end: HarvestReportPeriodDate.describe('Last month to harvest'),
    })
    .describe('Period of the harvest'),

  release: z.literal(['5', '5.1']).describe('COUNTER release of the report'),

  forceDownload: z.boolean().optional(),

  params: z
    .object({
      // Filters
      access_method: z.array(z.string()).optional(),
      access_type: z.array(z.string()).optional(),
      data_type: z.array(z.string()).optional(),
      metric_type: z.array(z.string()).optional(),
      attributed: z.boolean().optional(),
      country_code: z.array(z.string()).optional(),
      subdivision_code: z.string().optional(),
      yop: z.array(z.string()).optional(),
      database: z.string().optional(),
      platform: z.string().optional(),
      author: z.string().optional(),
      item_id: z.string().optional(),
      // Attributes
      attributes_to_show: z.array(z.string()).optional(),
      include_components_details: z.boolean().optional(),
      include_parent_details: z.boolean().optional(),
      // Others
      granularity: z.string().optional(),
    })
    .optional()
    .describe('Query parameters to use when downloading report'),
});

/**
 * Type for the options to harvest a COUNTER report
 */
export type HarvestReportOptions = z.infer<typeof HarvestReportOptions>;

/**
 * Validation for the options to harvest a COUNTER endpoint
 */
export const HarvestDataHostOptions = z.object({
  baseUrl: z.url().describe('URL to use'),

  auth: z
    .object({
      customer_id: z.string().optional(),
      requestor_id: z.string().optional(),
      api_key: z.string().optional(),
    })
    .describe('Credentials to use to harvest'),

  periodFormat: z
    .string()
    .optional()
    .describe('Date format to use for the period (defaults to "yyyy-MM")'),

  paramsSeparator: z
    .string()
    .optional()
    .describe('Separator used for multivaluated params (defaults to "|")'),

  additionalParams: z
    .record(z.string(), z.union([z.string(), z.boolean(), z.array(z.string())]))
    .optional()
    .describe('Query parameters to add on requests'),
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

  timeout: z.int().optional().describe('Maximum idle time of a job'),

  report: HarvestReportOptions.describe('Information on report to harvest'),

  dataHost: HarvestDataHostOptions.describe(
    'Information on how to harvest the report'
  ),
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
  index: z.string().describe('Elastic index data will be inserted'),

  additionalData: z
    .record(z.string(), z.string())
    .optional()
    .describe('Data to add to harvested items'),
});

/**
 * Type for the options to insert COUNTER data
 */
export type HarvestInsertOptions = z.infer<typeof HarvestInsertOptions>;

/**
 * Validation for exceptions found while harvesting
 */
export const HarvestException = z.object({
  severity: z
    .enum(['error', 'warn', 'info'])
    .describe('Severity of the exception'),

  code: z.string().describe('Code of the exception'),

  message: z.string().describe('Message of the exception'),

  helpUrl: z.string().optional().describe('URL to get help about exception'),
});

/**
 * Type for the exceptions found while harvesting
 */
export type HarvestException = z.infer<typeof HarvestException>;

/**
 * Validation for errors while harvesting
 */
export const HarvestError = z.object({
  code: z.string(),
  message: z.string(),
  cause: z.unknown().optional(),
});

/**
 * Type for the errors while harvesting
 */
export type HarvestError = z.infer<typeof HarvestError>;
