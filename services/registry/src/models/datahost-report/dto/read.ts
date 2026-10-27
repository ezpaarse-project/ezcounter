import { z } from '@ezcounter/dto';
import {
  HarvestAdditionalParams,
  HarvestCatchAllParams,
  HarvestDownloadOptions,
  HarvestReportOptions,
  HarvestReportPeriodDate,
} from '@ezcounter/dto/harvest';

import { prepareDiffFor } from '~/models/diff/dto';

const diff = prepareDiffFor<DataHostReport>();

/**
 * Validation for a report supported by Data Host
 */
export const DataHostReport = z.object({
  _appliedChanges: z
    .array(z.string())
    .describe('IDs of changes applied when serving object'),

  createdAt: z.coerce.date().describe('Creation date'),

  dataHostId: z.string().describe('ID of the Data Host'),

  firstMonthAvailable: HarvestReportPeriodDate.nullable().describe(
    'First month available in report - empty if no date - null to not override'
  ),

  lastMonthAvailable: HarvestReportPeriodDate.nullable().describe(
    'Last month available in report - empty if no date - null to not override'
  ),

  params: HarvestAdditionalParams.describe(
    'Additional params to use when requesting data host using report'
  ),

  release: HarvestDownloadOptions.shape.release,

  reportId: HarvestReportOptions.shape.id,

  supported: z
    .boolean()
    .nullable()
    .describe('Is report supported by data - null to not override'),

  updatedAt: z.coerce.date().nullable().describe('Last update date'),
});

/**
 * Type for a report supported by Data Host
 */
export type DataHostReport = z.infer<typeof DataHostReport>;

/**
 * Validation for a modification part of a Data Host
 */
export const DataHostReportDiffEntry = z.union([
  z.discriminatedUnion('key', [
    diff.describe(
      'firstMonthAvailable',
      DataHostReport.shape['firstMonthAvailable']
    ),
    diff.describe(
      'lastMonthAvailable',
      DataHostReport.shape['lastMonthAvailable']
    ),
    diff.describe('supported', DataHostReport.shape['supported']),
  ]),
  diff.describeNested('params', HarvestCatchAllParams),
]);

/**
 * Type for a modification part of a Data Host
 */
export type DataHostReportDiffEntry = z.infer<typeof DataHostReportChange>;

/**
 * Validation for a change on a release
 */
export const DataHostReportChange = z.object({
  createdAt: z.coerce.date().describe('Creation date'),

  dataHostId: DataHostReport.shape.dataHostId,

  diff: z
    .array(DataHostReportDiffEntry)
    .min(1)
    .describe('Modifications to apply to release'),

  id: z.string().describe('ID of the change'),

  release: DataHostReport.shape.release,

  reportId: DataHostReport.shape.reportId,
});

/**
 * Type for a change on a release
 */
export type DataHostReportChange = z.infer<typeof DataHostReportChange>;
