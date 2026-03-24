import { z } from '@ezcounter/dto';
import {
  HarvestDataHostOptions,
  HarvestDownloadOptions,
  HarvestReportOptions,
} from '@ezcounter/dto/harvest';
import { HarvestJobData } from '@ezcounter/dto/queues';

/**
 * Validation for a harvest request
 */
export const CreateHarvestRequest = z.object({
  ...HarvestJobData.omit({ id: true, try: true }).shape,

  download: z.object({
    ...HarvestDownloadOptions.omit({
      report: true,
      dataHost: true,
      cacheKey: true,
    }).shape,

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

    // Ask for a registered Data Host
    dataHost: z.object({
      ...HarvestDataHostOptions.omit({
        baseUrl: true,
        periodFormat: true,
        paramsSeparator: true,
      }).shape,

      id: z.string().describe('ID of the data host'),
    }),
  }),
});

/**
 * Type for a harvest request
 */
export type CreateHarvestRequest = z.infer<typeof CreateHarvestRequest>;
