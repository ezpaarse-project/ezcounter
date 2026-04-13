import { z } from '../..';
import {
  HarvestDataHostOptions,
  HarvestDownloadOptions,
  HarvestReportOptions,
} from '../../harvest';
import { HarvestJobData } from './jobs';

/**
 * Validation for the content of a harvest request
 */
export const HarvestRequestContent = z.object({
  ...HarvestJobData.omit({ id: true, try: true }).shape,

  download: z.object({
    ...HarvestDownloadOptions.omit({
      cacheKey: true,
      report: true,
    }).shape,

    // Ask for a registered Data Host
    dataHost: z.object({
      ...HarvestDataHostOptions.omit({
        baseUrl: true,
        paramsSeparator: true,
        periodFormat: true,
      }).shape,

      id: z.string().describe('ID of the data host'),
    }),

    // Allow for multiple reports
    reports: z
      .array(
        z.object({
          ...HarvestReportOptions.shape,

          // Allow to split periods
          splitPeriodBy: z
            .int()
            .min(1)
            .optional()
            .describe(
              'If present, will split period by the number of given months'
            ),
        })
      )
      .min(1)
      .describe('Information about reports to harvest'),
  }),
});

/**
 * Type for the content of a harvest request
 */
export type HarvestRequestContent = z.infer<typeof HarvestRequestContent>;

/**
 * Validation for a harvest request
 */
export const HarvestRequestData = z.array(HarvestRequestContent).min(1);

/**
 * Type for a harvest request
 */
export type HarvestRequestData = z.infer<typeof HarvestRequestData>;
