import type {
  R51ReportHeader,
  R51ReportItem,
  R51ReportItemParent,
  R5ReportItem,
} from '@ezcounter/counter/dto';
import type { SUSHIReportHeader as R5ReportHeader } from '@ezcounter/counter/schemas/r5';

import { z } from '../../..';
import { HarvestEnrichOptions, HarvestInsertOptions } from '../../../harvest';

/**
 * Type for any report header from any COUNTER release
 */
type COUNTERReportHeader = R5ReportHeader | R51ReportHeader;

/**
 * Type for any report item from any COUNTER release
 */
type COUNTERReportItem = R5ReportItem | R51ReportItem;

/**
 * Type for any report item parent from any COUNTER release
 *
 * Note: COUNTER 5 parent is included in item
 */
type COUNTERReportItemParent = R51ReportItemParent;

/**
 * Validation for the content used to enrich and insert a COUNTER item
 */
export const EnrichJobContent = z.object({
  harvestDate: z.string().describe('Date when the data was harvested'),
  // Using custom types without validation in order to cast without validating
  header: z.custom<COUNTERReportHeader>(),
  item: z.custom<COUNTERReportItem>(),
  parent: z.custom<COUNTERReportItemParent>().optional(),
});

/**
 * Type of the content used to enrich and insert a COUNTER item
 */
export type EnrichJobContent = z.infer<typeof EnrichJobContent>;

/**
 * Validation for the data used to enrich and insert a COUNTER item
 */
export const EnrichJobData = z.object({
  data: EnrichJobContent.describe(
    'Data to be enriched and inserted. Wont be validated on message reception'
  ),

  enrich: HarvestEnrichOptions.optional().describe(
    'Information about enrich that needs to be done'
  ),

  id: z.string().describe('Job ID'),

  insert: HarvestInsertOptions.describe(
    'Information on how to deal with harvested data'
  ),
});

/**
 * Type of the data used to enrich and insert a COUNTER item
 */
export type EnrichJobData = z.infer<typeof EnrichJobData>;
