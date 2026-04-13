import { z } from '../..';
import { HarvestAuthOptions } from '../../harvest';

/**
 * Validation for the data used to refresh data host supported data
 */
export const DataHostRefreshData = z.object({
  dataHost: z
    .object({
      auths: z
        .array(HarvestAuthOptions)
        .min(1)
        .describe('The auth to use for the data host'),

      id: z.string().describe('The id of the data host'),
    })
    .describe('The data host to refresh'),

  id: z.string().describe('The id of the job'),

  release: z.literal(['5', '5.1']).describe('The release to refresh'),
});

/**
 * Type for the data used to refresh data host supported data
 */
export type DataHostRefreshData = z.infer<typeof DataHostRefreshData>;
