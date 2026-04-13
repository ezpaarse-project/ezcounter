import { z } from '../../..';
import {
  HarvestDownloadOptions,
  HarvestEnrichOptions,
  HarvestInsertOptions,
} from '../../../harvest';

/**
 * Validation for the data used to harvest a COUNTER report
 */
export const HarvestJobData = z.object({
  download: HarvestDownloadOptions.describe(
    'Information about how to download report'
  ),

  enrich: HarvestEnrichOptions.optional().describe(
    'Information about enrich that needs to be done'
  ),

  id: z.string().describe('Job ID'),

  insert: HarvestInsertOptions.describe(
    'Information on how to deal with harvested data'
  ),

  try: z.int().optional().describe('Job try count'),
});

/**
 * Type of the data used to harvest a COUNTER report
 */
export type HarvestJobData = z.infer<typeof HarvestJobData>;
